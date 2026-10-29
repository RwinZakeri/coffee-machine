import { gsap } from "gsap";
import type { Object3D } from "three";
import type { PartSpec } from "../types";
import { assertValidPartsManifest, clampProgress, evaluatePartState } from "./assemblyMath";

export interface AssemblyTimelineController {
  timeline: gsap.core.Timeline;
  seek: (progress: number) => void;
  dispose: () => void;
}

/** GSAP owns time; immutable data owns each animated wrapper/object's parent-frame transform. */
export function createAssemblyTimeline(
  parts: readonly PartSpec[],
  objects: ReadonlyMap<string, Object3D>,
): AssemblyTimelineController {
  assertValidPartsManifest(parts);
  let disposed = false;
  const cursor = { progress: 0 };
  const apply = (progress: number) => {
    if (disposed) return;
    for (const part of parts) {
      const object = objects.get(part.id);
      if (!object) continue;
      const state = evaluatePartState(part, progress);
      object.position.set(...state.position);
      object.quaternion.set(...state.quaternion);
      object.scale.set(...state.scale);
      object.visible = state.visible;
      object.updateMatrix();
    }
  };

  const timeline = gsap.timeline({ paused: true }).to(cursor, {
    progress: 1,
    duration: 1,
    ease: "none",
    onUpdate: () => apply(cursor.progress),
  });
  apply(0);

  return {
    timeline,
    seek(progress) {
      if (disposed) return;
      const p = clampProgress(progress);
      timeline.totalProgress(p, false);
      // GSAP may round tween properties. Evaluate the original scroll value for exact targets.
      apply(p);
    },
    dispose() {
      disposed = true;
      timeline.kill();
    },
  };
}
