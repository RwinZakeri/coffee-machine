import assert from "node:assert/strict";
import test from "node:test";
import { Box3, Mesh, Object3D, Vector3 } from "three";
import { createReconstructedParts } from "../app/experience/data/reconstructedParts";
import { createBrewGroupObjects } from "../app/experience/geometry/BrewGroupGeometry";
import { evaluateAssemblyState, validatePartsManifest } from "../app/experience/scroll/assemblyMath";

function dimensions(object: Object3D): Vector3 {
  return new Box3().setFromObject(object).getSize(new Vector3());
}

function approximately(actual: number, expected: number, tolerance = 1e-8): void {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} differs from catalog constraint ${expected}`);
}

test("catalog-constrained group meshes preserve gasket, screen and fastener dimensions", () => {
  const objects = createBrewGroupObjects();
  for (const side of ["Left", "Right"]) {
    const gasket = objects.get(`05_BrewGroups.Reconstruction.${side}.Gasket`) as Mesh;
    const gasketSize = dimensions(gasket);
    // H.3.007, V3.2 p37 /V3.8 printed49:71.6mm outside,55mm inside,8.2mm height.
    approximately(gasketSize.x, .0716); approximately(gasketSize.z, .0716); approximately(gasketSize.y, .0082);
    const vertices = gasket.geometry.getAttribute("position");
    let minimumRadius = Infinity;
    for (let i = 0; i < vertices.count; i++) {
      minimumRadius = Math.min(minimumRadius, Math.hypot(vertices.getX(i), vertices.getZ(i)));
    }
    approximately(minimumRadius *2, .055);

    const screen = objects.get(`05_BrewGroups.Reconstruction.${side}.ShowerScreen`)!;
    // F.3.040.01 H6.5: illustrative perforation insets are separate from the formed mesh.
    approximately(dimensions(screen.getObjectByName("FormedScreen_H6_5")!).y, .0065);
    const screw = objects.get(`05_BrewGroups.Reconstruction.${side}.DiffuserScrew`)!;
    approximately(dimensions(screw.getObjectByName("Head_D10")!).x, .010);
    const bolts = objects.get(`05_BrewGroups.Reconstruction.${side}.FixingBolts`)!;
    assert.equal(bolts.children.length, 3, "AV cap diagram has three fixing screws");
    for (const bolt of bolts.children) {
      // L110.01 M8×52 and L1003 washer8.5×14×1.5, V3.2 p43.
      approximately(dimensions(bolt.getObjectByName("M8x52")!).y, .052);
      approximately(dimensions(bolt.getObjectByName("M8x52")!).x, .008);
      const washerSize = dimensions(bolt.getObjectByName("L1003_Washer_8_5x14x1_5")!);
      approximately(washerSize.x, .014); approximately(washerSize.y, .0015);
    }
  }
});

test("the lower-stack subset has complete provenance, explicit gaps and valid dependencies", () => {
  const parts = createReconstructedParts(); const objects = createBrewGroupObjects();
  assert.equal(parts.length, 12); assert.equal(objects.size, 12);
  assert.deepEqual(validatePartsManifest(parts), []);
  for (const part of parts) {
    assert.ok(objects.has(part.id)); assert.ok(part.sourceUrl.startsWith("https://au.lamarzocco.com/"));
    assert.ok(part.sourcePage); assert.ok(part.notes);
    assert.ok(part.assemblyStart >= .41 && part.assemblyEnd <= .51);
    assert.ok(!new Box3().setFromObject(objects.get(part.id)!).isEmpty());
    if (part.id.endsWith(".Housing")) {
      assert.equal(part.manufacturerPartNumber, null);
      assert.equal(part.accuracyStatus, "Visual approximation");
      assert.match(part.notes!, /not the complete saturated housing/);
    }
  }
});

test("reconstructed components return to exact initial/final transforms after reverse seeks", () => {
  const parts = createReconstructedParts();
  for (const progress of [0, .48, 1, .46, .15, 1, 0]) {
    const state = evaluateAssemblyState(parts, progress);
    assert.deepEqual(state, evaluateAssemblyState(parts, progress), "same progress has no playback history");
    for (const part of parts) {
      const current = state.get(part.id)!;
      assert.deepEqual(current.scale, [1, 1, 1]);
      if (progress === 0) {
        assert.deepEqual(current.position, part.initialPosition);
        assert.deepEqual(current.quaternion, part.initialQuaternion);
        assert.equal(current.visible, false);
      }
      if (progress === 1) {
        assert.deepEqual(current.position, part.finalPosition);
        assert.deepEqual(current.quaternion, part.finalQuaternion);
      }
    }
  }
});
