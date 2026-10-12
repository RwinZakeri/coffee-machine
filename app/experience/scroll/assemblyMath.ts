import type {
  AssemblyValidationIssue,
  CameraPose,
  Chapter,
  ChapterState,
  PartSpec,
  PartState,
  QuaternionTuple,
  SceneState,
  Vec3,
} from "../types";

export function clampProgress(progress: number): number {
  if (!Number.isFinite(progress)) return 0;
  return Math.min(1, Math.max(0, progress));
}

/** Zero velocity at both endpoints, without an overshoot that could cause collisions. */
export function smoothstep(progress: number): number {
  const p = clampProgress(progress);
  return p * p * (3 - 2 * p);
}

export function lerpVec3(from: Vec3, to: Vec3, progress: number): Vec3 {
  const p = clampProgress(progress);
  if (p === 0) return [...from];
  if (p === 1) return [...to];
  return [
    from[0] + (to[0] - from[0]) * p,
    from[1] + (to[1] - from[1]) * p,
    from[2] + (to[2] - from[2]) * p,
  ];
}

/** Shortest-arc SLERP, evaluated from original manifest values on every seek. */
export function slerpQuaternion(
  from: QuaternionTuple,
  to: QuaternionTuple,
  progress: number,
): QuaternionTuple {
  const p = clampProgress(progress);
  if (p === 0) return [...from];
  if (p === 1) return [...to];

  let destination: QuaternionTuple = to;
  let cosine = from.reduce((sum, component, index) => sum + component * to[index], 0);
  if (cosine < 0) {
    destination = [-to[0], -to[1], -to[2], -to[3]];
    cosine = -cosine;
  }
  cosine = Math.min(1, Math.max(-1, cosine));

  if (cosine > 0.9995) {
    const interpolated = from.map(
      (component, index) => component + (destination[index] - component) * p,
    );
    const magnitude = Math.hypot(...interpolated);
    return interpolated.map((component) => component / magnitude) as unknown as QuaternionTuple;
  }

  const angle = Math.acos(cosine);
  const denominator = Math.sin(angle);
  const initialWeight = Math.sin((1 - p) * angle) / denominator;
  const finalWeight = Math.sin(p * angle) / denominator;
  return [
    from[0] * initialWeight + destination[0] * finalWeight,
    from[1] * initialWeight + destination[1] * finalWeight,
    from[2] * initialWeight + destination[2] * finalWeight,
    from[3] * initialWeight + destination[3] * finalWeight,
  ];
}

/** Rotate a vector by a unit quaternion without allocating rendering-library objects. */
export function rotateVectorByQuaternion(vector: Vec3, quaternion: QuaternionTuple): Vec3 {
  const [x, y, z] = vector;
  const [qx, qy, qz, qw] = quaternion;
  const ux = qy * z - qz * y;
  const uy = qz * x - qx * z;
  const uz = qx * y - qy * x;
  const uux = qy * uz - qz * uy;
  const uuy = qz * ux - qx * uz;
  const uuz = qx * uy - qy * ux;
  return [x + 2 * (qw * ux + uux), y + 2 * (qw * uy + uuy), z + 2 * (qw * uz + uuz)];
}

function evaluatePivotPosition(part: PartSpec, orientation: QuaternionTuple, progress: number): Vec3 {
  const pivot = part.assemblyPivot!;
  const relative: Vec3 = [
    part.finalPosition[0] - pivot.finalCenter[0],
    part.finalPosition[1] - pivot.finalCenter[1],
    part.finalPosition[2] - pivot.finalCenter[2],
  ];
  const [x, y, z, w] = part.finalQuaternion;
  const local = rotateVectorByQuaternion(relative, [-x, -y, -z, w]);
  const rotated = rotateVectorByQuaternion(local, orientation);
  const center = lerpVec3(pivot.initialCenter, pivot.finalCenter, progress);
  return [center[0] + rotated[0], center[1] + rotated[1], center[2] + rotated[2]];
}

export function evaluatePartState(part: PartSpec, progress: number): PartState {
  const p = clampProgress(progress);
  const localProgress = clampProgress(
    (p - part.assemblyStart) / (part.assemblyEnd - part.assemblyStart),
  );
  const easedProgress = smoothstep(localProgress);
  const quaternion = slerpQuaternion(part.initialQuaternion, part.finalQuaternion, easedProgress);
  const position = part.assemblyPivot && easedProgress > 0 && easedProgress < 1
    ? evaluatePivotPosition(part, quaternion, easedProgress)
    : lerpVec3(part.initialPosition, part.finalPosition, easedProgress);

  return {
    position,
    quaternion,
    // The physical dimensions never animate: scale is identical before, during and after assembly.
    scale: [...part.finalScale],
    assemblyProgress: localProgress,
    visible: part.accuracyStatus !== "Missing asset" && p > part.assemblyStart,
  };
}

export function evaluateAssemblyState(
  parts: readonly PartSpec[],
  progress: number,
): ReadonlyMap<string, PartState> {
  return new Map(parts.map((part) => [part.id, evaluatePartState(part, progress)]));
}

export function chapterAtProgress(progress: number, chapters: readonly Chapter[]): ChapterState {
  if (chapters.length === 0) throw new Error("The experience requires at least one chapter.");
  const p = clampProgress(progress);
  const index = Math.max(
    0,
    chapters.findIndex((chapter, i) => p < chapter.end || i === chapters.length - 1),
  );
  const chapter = chapters[index];
  const localProgress = clampProgress((p - chapter.start) / (chapter.end - chapter.start));
  const enter = chapter.textTransition.enter;
  const exit = chapter.textTransition.exit;
  const textOpacity = Math.min(
    smoothstep(localProgress / enter),
    smoothstep((1 - localProgress) / (1 - exit)),
  );
  return { chapter, index, progress: localProgress, textOpacity };
}

function interpolateCamera(from: CameraPose, to: CameraPose, progress: number): CameraPose {
  const p = smoothstep(progress);
  if (p === 0) return { ...from, position: [...from.position], target: [...from.target] };
  if (p === 1) return { ...to, position: [...to.position], target: [...to.target] };
  const target = lerpVec3(from.target, to.target, p);
  const sphericalOffset = (pose: CameraPose) => {
    const x = pose.position[0] - pose.target[0];
    const y = pose.position[1] - pose.target[1];
    const z = pose.position[2] - pose.target[2];
    return { radius: Math.hypot(x, y, z), azimuth: Math.atan2(x, z), elevation: Math.atan2(y, Math.hypot(x, z)) };
  };
  const initial = sphericalOffset(from);
  const final = sphericalOffset(to);
  // Orbit around the focus rather than cutting through the machine on a straight camera chord.
  const angularDelta = Math.atan2(
    Math.sin(final.azimuth - initial.azimuth),
    Math.cos(final.azimuth - initial.azimuth),
  );
  const azimuth = initial.azimuth + angularDelta * p;
  const elevation = initial.elevation + (final.elevation - initial.elevation) * p;
  const radius = initial.radius + (final.radius - initial.radius) * p;
  const horizontalRadius = radius * Math.cos(elevation);
  return {
    position: [
      target[0] + horizontalRadius * Math.sin(azimuth),
      target[1] + radius * Math.sin(elevation),
      target[2] + horizontalRadius * Math.cos(azimuth),
    ],
    target,
    fov: from.fov + (to.fov - from.fov) * p,
  };
}

export interface CameraOptions {
  mobile?: boolean;
  reducedMotion?: boolean;
}

/** Camera choreography is independent of part transforms and contains no playback history. */
export function evaluateCameraState(
  progress: number,
  chapters: readonly Chapter[],
  options: CameraOptions = {},
): CameraPose {
  const { chapter, progress: localProgress } = chapterAtProgress(progress, chapters);
  const pose = options.reducedMotion
    ? chapter.exitCamera
    : localProgress <= 0.48
      ? interpolateCamera(chapter.entryCamera, chapter.focusCamera, localProgress / 0.48)
      : interpolateCamera(chapter.focusCamera, chapter.exitCamera, (localProgress - 0.48) / 0.52);

  if (!options.mobile) return { ...pose, position: [...pose.position], target: [...pose.target] };
  // Increase distance around the same target to preserve complete machine framing in portrait.
  const distanceMultiplier = 1.65;
  return {
    ...pose,
    position: [
      pose.target[0] + (pose.position[0] - pose.target[0]) * distanceMultiplier,
      pose.target[1] + (pose.position[1] - pose.target[1]) * distanceMultiplier,
      pose.target[2] + (pose.position[2] - pose.target[2]) * distanceMultiplier,
    ],
    target: [...pose.target],
    fov: 37,
  };
}

function lerpColor(from: string, to: string, progress: number): string {
  const initial = parseInt(from.slice(1), 16);
  const final = parseInt(to.slice(1), 16);
  const channels = [16, 8, 0].map((shift) => {
    const a = (initial >> shift) & 255;
    const b = (final >> shift) & 255;
    return Math.round(a + (b - a) * progress).toString(16).padStart(2, "0");
  });
  return `#${channels.join("")}`;
}

/** Fade palette near the end of the preceding chapter, keeping shared boundaries continuous. */
export function evaluateSceneState(progress: number, chapters: readonly Chapter[]): SceneState {
  const state = chapterAtProgress(progress, chapters);
  const next = chapters[Math.min(state.index + 1, chapters.length - 1)];
  const p = smoothstep((state.progress - 0.75) / 0.25);
  const current = state.chapter;
  return {
    palette: {
      background: lerpColor(current.palette.background, next.palette.background, p),
      foreground: lerpColor(current.palette.foreground, next.palette.foreground, p),
      accent: lerpColor(current.palette.accent, next.palette.accent, p),
    },
    lighting: {
      ambient: current.lighting.ambient + (next.lighting.ambient - current.lighting.ambient) * p,
      key: current.lighting.key + (next.lighting.key - current.lighting.key) * p,
      rim: current.lighting.rim + (next.lighting.rim - current.lighting.rim) * p,
      environment: current.lighting.environment
        + (next.lighting.environment - current.lighting.environment) * p,
      keyColor: lerpColor(current.lighting.keyColor, next.lighting.keyColor, p),
      rimColor: lerpColor(current.lighting.rimColor, next.lighting.rimColor, p),
    },
  };
}

export function validatePartsManifest(parts: readonly PartSpec[]): AssemblyValidationIssue[] {
  const issues: AssemblyValidationIssue[] = [];
  const byId = new Map<string, PartSpec>();
  for (const part of parts) {
    if (byId.has(part.id)) {
      issues.push({ code: "duplicate-id", partId: part.id, message: `Duplicate part ID: ${part.id}.` });
    }
    byId.set(part.id, part);
    if (
      !Number.isFinite(part.assemblyStart) || !Number.isFinite(part.assemblyEnd)
      || part.assemblyStart < 0 || part.assemblyEnd > 1 || part.assemblyStart >= part.assemblyEnd
    ) {
      issues.push({ code: "invalid-progress", partId: part.id, message: "Assembly timing must satisfy 0 ≤ start < end ≤ 1." });
    }
    const values = [
      ...part.initialPosition, ...part.finalPosition, ...part.initialQuaternion,
      ...part.finalQuaternion, ...part.finalScale,
      ...(part.assemblyPivot?.initialCenter ?? []), ...(part.assemblyPivot?.finalCenter ?? []),
    ];
    if (
      values.some((value) => !Number.isFinite(value))
      || part.finalScale.some((value) => value <= 0)
      || Math.abs(Math.hypot(...part.initialQuaternion) - 1) > 1e-6
      || Math.abs(Math.hypot(...part.finalQuaternion) - 1) > 1e-6
    ) {
      issues.push({ code: "invalid-transform", partId: part.id, message: "Transforms require finite coordinates, positive scale and unit quaternions." });
    }
    if (part.assemblyPivot) {
      const pivotInitial = evaluatePivotPosition(part, part.initialQuaternion, 0);
      if (pivotInitial.some((value, index) => Math.abs(value - part.initialPosition[index]) > 1e-6)) {
        issues.push({ code: "invalid-transform", partId: part.id, message: "Pivot rotation at the initial center must match the configured initial position." });
      }
    }
  }
  for (const part of parts) {
    for (const dependencyId of part.dependencies) {
      const dependency = byId.get(dependencyId);
      if (!dependency) {
        issues.push({ code: "unknown-dependency", partId: part.id, message: `Dependency ${dependencyId} is absent from the manifest.` });
      } else if (dependency.assemblyEnd > part.assemblyStart + 1e-9) {
        issues.push({ code: "dependency-order", partId: part.id, message: `${dependencyId} must complete before ${part.id} starts.` });
      }
    }
  }

  const complete = new Set<string>();
  const visiting = new Set<string>();
  function visit(partId: string): void {
    if (complete.has(partId)) return;
    if (visiting.has(partId)) {
      issues.push({ code: "dependency-cycle", partId, message: `Dependency cycle reaches ${partId}.` });
      return;
    }
    visiting.add(partId);
    for (const dependencyId of byId.get(partId)?.dependencies ?? []) {
      if (byId.has(dependencyId)) visit(dependencyId);
    }
    visiting.delete(partId);
    complete.add(partId);
  }
  for (const part of parts) visit(part.id);
  return issues;
}

export function assertValidPartsManifest(parts: readonly PartSpec[]): void {
  const issues = validatePartsManifest(parts);
  if (issues.length) {
    throw new Error(`Invalid assembly manifest:\n${issues.map((issue) => `${issue.partId}: ${issue.message}`).join("\n")}`);
  }
}
