import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { Object3D } from "three";
import { CHAPTERS } from "../app/experience/data/chapters";
import { buildPartsManifest } from "../app/experience/data/partsManifest";
import { createReconstructedParts } from "../app/experience/data/reconstructedParts";
import type { AssetIndex, AssetNode } from "../app/experience/assets/loadMachineAssets";
import type { PartSpec, QuaternionTuple, Vec3 } from "../app/experience/types";
import { ASSEMBLY_GROUPS } from "../app/experience/types";
import { createAssemblyTimeline } from "../app/experience/scroll/AssemblyTimeline";
import {
  chapterAtProgress,
  clampProgress,
  evaluateAssemblyState,
  evaluateCameraState,
  evaluatePartState,
  evaluateSceneState,
  rotateVectorByQuaternion,
  slerpQuaternion,
  validatePartsManifest,
} from "../app/experience/scroll/assemblyMath";

// Internal engine fixtures are deliberately separate from the physical machine asset manifest.
const frame: PartSpec = {
  id: "01_Frame.BaseFrame", name: "Engine-test frame", group: "01_Frame",
  assetPath: null, nodeName: null, sourceUrl: "", sourcePage: null,
  manufacturerPartNumber: null, accuracyStatus: "Visual approximation",
  finalPosition: [0, 0.06, 0], finalQuaternion: [0, 0, 0, 1], finalScale: [1, 1, 1],
  initialPosition: [0, -0.7, -0.8], initialQuaternion: [0, Math.sin(Math.PI / 6), 0, Math.cos(Math.PI / 6)],
  assemblyStart: 0.01, assemblyEnd: 0.1, dependencies: [], materialGroup: "stainless-steel",
};
const bracket: PartSpec = {
  ...frame,
  id: "01_Frame.SupportBrackets", name: "Engine-test bracket",
  finalPosition: [-0.2, 0.15, -0.07], finalScale: [0.001, 0.001, 0.001],
  initialPosition: [-0.9, 0.5, -0.2], initialQuaternion: [Math.sin(Math.PI / 4), 0, 0, Math.cos(Math.PI / 4)],
  assemblyStart: 0.11, assemblyEnd: 0.19, dependencies: [frame.id],
};
const missing: PartSpec = {
  ...bracket, id: "04_Boilers.Probes", name: "Unresolved physical part", group: "04_Boilers",
  accuracyStatus: "Missing asset", assemblyStart: 0.5, assemblyEnd: 0.6,
};
const fixtureParts = [frame, bracket, missing];

type QaAssetIndex = Omit<AssetIndex, "parts"> & { parts: (AssetNode & { scale: Vec3 })[] };
const assetIndex = JSON.parse(readFileSync(new URL("../public/models/linea-pb/asset-index.json", import.meta.url), "utf8")) as QaAssetIndex;
const actualParts = buildPartsManifest(assetIndex);

test("the audited CAD inventory separates sight-glass hydraulics from steam and exterior panels", () => {
  const counts = ASSEMBLY_GROUPS.map((group) => actualParts.filter((part) => part.group === group).length);
  assert.deepEqual(counts, [14, 9, 0, 0, 0, 22, 8, 51, 8, 18, 12]);
  const partAt = (number: number) => actualParts.find((part) => part.nodeName?.startsWith(`cad_${String(number).padStart(3, "0")}_`))!;
  assert.equal(partAt(55).materialGroup, "glass");
  assert.equal(partAt(59).materialGroup, "copper");
  assert.equal(partAt(46).materialGroup, "rubber");
  assert.equal(partAt(87).materialGroup, "rubber");
  const cover = partAt(24);
  for (const retained of [partAt(23), partAt(25)]) {
    assert.ok(cover.dependencies.includes(retained.id), "outlet cover must retain the assembled gasket and filter");
    assert.ok(retained.assemblyEnd <= cover.assemblyStart);
    assert.equal(evaluatePartState(retained, cover.assemblyStart).assemblyProgress, 1);
  }
  assert.ok(actualParts.filter((part) => part.dependencies.length > 0).length >= 25, "real assembly relationships must be exercised by validation");
});

test("all six CAD leaves in each portafilter remain rigid during insertion and reverse seeking", () => {
  for (const side of [-1, 1]) {
    const parts = actualParts.filter((part) => part.group === "11_Accessories" && Math.sign(part.finalPosition[0]) === side);
    assert.equal(parts.length, 6);
    for (const progress of [.96, .97, .95, 1, .965, .94]) {
      const origin = evaluatePartState(parts[0], progress);
      for (const part of parts) {
        assert.ok(part.assemblyPivot, "portafilter leaves require a shared rigid pivot");
        const state = evaluatePartState(part, progress);
        const expectedDistance = Math.hypot(...part.finalPosition.map((value, axis) => value - parts[0].finalPosition[axis]));
        const actualDistance = Math.hypot(...state.position.map((value, axis) => value - origin.position[axis]));
        assert.ok(Math.abs(actualDistance - expectedDistance) < 1e-10);
        assert.deepEqual(state.quaternion, origin.quaternion);
      }
    }
  }
});

function assertTupleClose(actual: readonly number[], expected: readonly number[], tolerance = 1e-12): void {
  assert.equal(actual.length, expected.length);
  actual.forEach((value, index) => assert.ok(
    Math.abs(value - expected[index]) <= tolerance,
    `${value} differs from ${expected[index]} at component ${index}`,
  ));
}

test("every initial and final transform equals its immutable manifest target", () => {
  for (const part of fixtureParts) {
    const initial = evaluatePartState(part, 0);
    const final = evaluatePartState(part, 1);
    assert.deepEqual(initial.position, part.initialPosition);
    assert.deepEqual(initial.quaternion, part.initialQuaternion);
    assert.deepEqual(initial.scale, part.finalScale);
    assert.equal(initial.visible, false);
    assert.deepEqual(final.position, part.finalPosition);
    assert.deepEqual(final.quaternion, part.finalQuaternion);
    assert.deepEqual(final.scale, part.finalScale);
    assert.equal(final.assemblyProgress, 1);
  }
});

test("every extracted CAD node has exact source transforms at 100% and its displaced state at 0%", () => {
  assert.equal(actualParts.length, assetIndex.parts.length);
  assert.ok(actualParts.length > 0);
  assert.deepEqual(validatePartsManifest(actualParts), []);
  const before = JSON.stringify(assetIndex);
  for (const part of actualParts) {
    const sourceNode = assetIndex.parts.find((node) => node.nodeName === part.nodeName)!;
    assert.equal(part.accuracyStatus, "Verified CAD");
    assert.deepEqual(part.finalPosition, sourceNode.position);
    assert.deepEqual(part.finalQuaternion, sourceNode.quaternion);
    const initial = evaluatePartState(part, 0);
    assert.deepEqual(initial.position, part.initialPosition);
    assert.deepEqual(initial.quaternion, part.initialQuaternion);
    assert.equal(initial.visible, false);
    const final = evaluatePartState(part, 1);
    assert.deepEqual(final.position, sourceNode.position);
    assert.deepEqual(final.quaternion, sourceNode.quaternion);
    assert.deepEqual(final.scale, sourceNode.scale);
    assert.equal(final.visible, true);
  }
  for (const progress of [0.25, 1, 0.05, 0.5, 0, 0.75, 0.3, 1, 0.5]) {
    assert.deepEqual(evaluateAssemblyState(actualParts, progress), evaluateAssemblyState(actualParts, progress));
  }
  assert.equal(JSON.stringify(assetIndex), before);
});

test("combined CAD and reconstructed runtime manifest preserves chapter timing and independent identities", () => {
  const runtimeParts = [...actualParts, ...createReconstructedParts()];
  assert.deepEqual(validatePartsManifest(runtimeParts), []);
  assert.equal(new Set(runtimeParts.map((part) => part.id)).size, runtimeParts.length);
  for (const part of runtimeParts) {
    const chapter = CHAPTERS.find((entry) => entry.group === part.group)!;
    assert.ok(part.assemblyStart >= chapter.start, `${part.id} starts before its chapter`);
    assert.ok(part.assemblyEnd <= chapter.end, `${part.id} ends after its chapter`);
    assert.equal(evaluatePartState(part, 0.05).visible, false, `${part.id} leaks into the opening`);
    assert.deepEqual(evaluatePartState(part, 1).position, part.finalPosition);
  }
});

test("random seeks, forward/backward playback and repeated evaluation are identical", () => {
  const checkpoints = [0, 0.025, 0.065, 0.13, 0.185, 0.41, 0.58, 0.75, 1];
  const expected = checkpoints.map((progress) => evaluateAssemblyState(fixtureParts, progress));
  const scrambled = [1, 4, 8, 2, 0, 6, 3, 8, 7, 5, 1];
  for (const index of scrambled) {
    assert.deepEqual(evaluateAssemblyState(fixtureParts, checkpoints[index]), expected[index]);
  }
  for (const index of [...checkpoints.keys()].reverse()) {
    assert.deepEqual(evaluateAssemblyState(fixtureParts, checkpoints[index]), expected[index]);
  }
});

test("intermediate quaternions remain normalized and take the shortest arc", () => {
  const from: QuaternionTuple = [0, 0, 0, 1];
  const to: QuaternionTuple = [0, Math.sin(Math.PI / 6), 0, Math.cos(Math.PI / 6)];
  assertTupleClose(slerpQuaternion(from, to, 0.5), [0, Math.sin(Math.PI / 12), 0, Math.cos(Math.PI / 12)]);
  assertTupleClose(slerpQuaternion(from, [0, 0, 0, -1], 0.5), from);
  for (let step = 0; step <= 100; step += 1) {
    assert.ok(Math.abs(Math.hypot(...slerpQuaternion(from, to, step / 100)) - 1) < 1e-12);
  }
});

test("shared pivots preserve leaf distances during a rigid translating and rotating subassembly", () => {
  const finalCenter: Vec3 = [0.12, 0.27, 0.2];
  const initialCenter: Vec3 = [0.15, 0.1, 0.4];
  const initialQuaternion: QuaternionTuple = [0, Math.sin(Math.PI / 12), 0, Math.cos(Math.PI / 12)];
  const makeLeaf = (id: string, relative: Vec3): PartSpec => {
    const rotated = rotateVectorByQuaternion(relative, initialQuaternion);
    return {
      ...frame, id, group: "11_Accessories", initialQuaternion,
      finalPosition: [finalCenter[0] + relative[0], finalCenter[1] + relative[1], finalCenter[2] + relative[2]],
      initialPosition: [initialCenter[0] + rotated[0], initialCenter[1] + rotated[1], initialCenter[2] + rotated[2]],
      assemblyPivot: { initialCenter, finalCenter }, assemblyStart: .944, assemblyEnd: .979,
    };
  };
  const leaves = [makeLeaf("portafilter.basket", [.015, .025, .02]), makeLeaf("portafilter.handle", [.015, 0, .16])];
  assert.deepEqual(validatePartsManifest(leaves), []);
  const expectedDistance = Math.hypot(...leaves[0].finalPosition.map((value, index) => value - leaves[1].finalPosition[index]));
  for (let sample = 0; sample <= 100; sample += 1) {
    const progress = .94 + sample /100 * .05;
    const states = leaves.map((part) => evaluatePartState(part, progress));
    const distance = Math.hypot(...states[0].position.map((value, index) => value - states[1].position[index]));
    assert.ok(Math.abs(distance - expectedDistance) < 1e-12);
    assert.deepEqual(states[0].quaternion, states[1].quaternion);
    for (const part of leaves) {
      assert.deepEqual(evaluatePartState(part, 0).position, part.initialPosition);
      assert.deepEqual(evaluatePartState(part, 1).position, part.finalPosition);
      assert.deepEqual(evaluatePartState(part, 1).quaternion, part.finalQuaternion);
      assert.deepEqual(evaluatePartState(part, progress).scale, part.finalScale);
    }
  }
  assertTupleClose(rotateVectorByQuaternion([1, 0, 0], [0, Math.SQRT1_2, 0, Math.SQRT1_2]), [0, 0, -1]);
  assert.ok(validatePartsManifest([{ ...leaves[0], initialPosition: [0, 0, 0] }])
    .some((issue) => issue.code === "invalid-transform"));
});

test("physical scale is constant and missing geometry is never rendered", () => {
  for (let step = 0; step <= 100; step += 1) {
    for (const part of fixtureParts) {
      assert.deepEqual(evaluatePartState(part, step / 100).scale, part.finalScale);
    }
    assert.equal(evaluatePartState(missing, step / 100).visible, false);
  }
  assert.equal(evaluatePartState(frame, frame.assemblyStart).visible, false);
  assert.equal(evaluatePartState(frame, frame.assemblyStart + 0.001).visible, true);
});

test("validation detects unknown dependencies, overlapping installation, cycles and invalid transforms", () => {
  assert.deepEqual(validatePartsManifest(fixtureParts), []);
  assert.ok(validatePartsManifest([{ ...frame, dependencies: ["absent"] }])
    .some((issue) => issue.code === "unknown-dependency"));
  assert.ok(validatePartsManifest([frame, { ...bracket, assemblyStart: 0.05 }])
    .some((issue) => issue.code === "dependency-order"));
  assert.ok(validatePartsManifest([{ ...frame, dependencies: [bracket.id] }, bracket])
    .some((issue) => issue.code === "dependency-cycle"));
  assert.ok(validatePartsManifest([{ ...frame, finalQuaternion: [0, 0, 0, 2] }])
    .some((issue) => issue.code === "invalid-transform"));
  assert.ok(validatePartsManifest([{ ...frame, assemblyEnd: frame.assemblyStart }])
    .some((issue) => issue.code === "invalid-progress"));
  assert.ok(validatePartsManifest([frame, frame]).some((issue) => issue.code === "duplicate-id"));
});

test("paused GSAP timeline sets absolute transforms on jumps and releases its resources", () => {
  const objects = new Map(fixtureParts.map((part) => [part.id, new Object3D()]));
  const controller = createAssemblyTimeline(fixtureParts, objects);
  assert.equal(controller.timeline.paused(), true);
  for (const progress of [0, 1, 0.13, 0.6, 0.03, 1, 0]) {
    controller.seek(progress);
    for (const part of fixtureParts) {
      const object = objects.get(part.id)!;
      const expected = evaluatePartState(part, progress);
      assertTupleClose(object.position.toArray(), expected.position);
      assertTupleClose(object.quaternion.toArray(), expected.quaternion);
      assertTupleClose(object.scale.toArray(), expected.scale);
      assert.equal(object.visible, expected.visible);
    }
  }
  controller.dispose();
  controller.seek(1);
  assertTupleClose(objects.get(frame.id)!.position.toArray(), frame.initialPosition);
});

test("all eleven brief chapters have contiguous intervals and continuous camera boundaries", () => {
  assert.deepEqual(CHAPTERS.map((chapter) => chapter.group), ASSEMBLY_GROUPS);
  assert.equal(CHAPTERS[0].start, 0.05);
  assert.equal(chapterAtProgress(0, CHAPTERS).progress, 0);
  assert.equal(CHAPTERS.at(-1)!.end, 1);
  for (let index = 0; index < CHAPTERS.length - 1; index += 1) {
    const chapter = CHAPTERS[index];
    const next = CHAPTERS[index + 1];
    assert.equal(chapter.end, next.start);
    assert.deepEqual(chapter.exitCamera, next.entryCamera);
    const before = evaluateCameraState(chapter.end - 1e-8, CHAPTERS);
    const after = evaluateCameraState(chapter.end + 1e-8, CHAPTERS);
    assertTupleClose(before.position, after.position, 1e-6);
    assertTupleClose(before.target, after.target, 1e-6);
    assert.equal(evaluateSceneState(chapter.end, CHAPTERS).palette.background, next.palette.background);
  }
  assert.equal(chapterAtProgress(1, CHAPTERS).index, 10);
});

test("camera and scene state remain deterministic with mobile and reduced-motion alternatives", () => {
  for (const progress of [0, 0.05, 0.27, 0.5, 0.89, 1]) {
    assert.deepEqual(evaluateCameraState(progress, CHAPTERS), evaluateCameraState(progress, CHAPTERS));
    assert.deepEqual(evaluateSceneState(progress, CHAPTERS), evaluateSceneState(progress, CHAPTERS));
    const desktop = evaluateCameraState(progress, CHAPTERS);
    const mobile = evaluateCameraState(progress, CHAPTERS, { mobile: true });
    const distance = (position: Vec3, target: Vec3) => Math.hypot(...position.map((component, index) => component - target[index]));
    assert.ok(distance(mobile.position, mobile.target) > distance(desktop.position, desktop.target));
    const chapter = chapterAtProgress(progress, CHAPTERS).chapter;
    assert.deepEqual(evaluateCameraState(progress, CHAPTERS, { reducedMotion: true }), chapter.exitCamera);
  }
});

test("camera orbits stay outside the nominal machine envelope throughout every chapter", () => {
  for (let sample = 0; sample <= 1100; sample += 1) {
    const { position } = evaluateCameraState(sample / 1100, CHAPTERS);
    const intersectsEnvelope = Math.abs(position[0]) < 0.355
      && position[1] >= 0 && position[1] <= 0.533
      && Math.abs(position[2]) < 0.295;
    assert.equal(intersectsEnvelope, false, `Camera crosses machine at progress ${sample / 1100}`);
  }
});

test("out-of-range and invalid progress values have defined safe endpoints", () => {
  assert.equal(clampProgress(-3), 0);
  assert.equal(clampProgress(9), 1);
  assert.equal(clampProgress(Number.NaN), 0);
  assert.equal(clampProgress(Number.POSITIVE_INFINITY), 0);
  assert.deepEqual(evaluatePartState(frame, -1), evaluatePartState(frame, 0));
  assert.deepEqual(evaluatePartState(frame, 2), evaluatePartState(frame, 1));
});
