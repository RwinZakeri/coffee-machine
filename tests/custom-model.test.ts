import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { Box3, BoxGeometry, Group, Mesh, MeshStandardMaterial, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import type { AssetIndex } from "../app/experience/assets/loadMachineAssets";
import { prepareMachineAssembly } from "../app/experience/assets/prepareMachineAssembly";
import { buildPartsManifest } from "../app/experience/data/partsManifest";
import { MACHINE } from "../app/experience/data/machineConfig";
import { createAssemblyTimeline } from "../app/experience/scroll/AssemblyTimeline";
import { measureAssemblyBounds } from "../app/experience/geometry/assemblyBounds";

const index = JSON.parse(await readFile(new URL("../public/models/custom-espresso/asset-index.json", import.meta.url), "utf8")) as AssetIndex;
const bytes = await readFile(new URL(`../public${index.assetPath}`, import.meta.url));
const model = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "");
const specs = buildPartsManifest(index);

function close(actual: readonly number[], expected: readonly number[], tolerance = 1e-10) {
  actual.forEach((value, axis) => assert.ok(Math.abs(value - expected[axis]) <= tolerance, `${value} differs from ${expected[axis]} at ${axis}`));
}

test("the decoded custom GLB retains all 23 components, 56 solids, metre bounds and finite normals", () => {
  assert.equal(index.modelId, MACHINE.id);
  assert.equal(index.parts.length, 23);
  assert.equal(index.solidCount, 56);
  assert.equal(new Set(index.parts.map((part) => part.nodeName)).size, 23);
  let solids = 0; let triangles = 0;
  for (const part of index.parts) {
    const node = model.scene.getObjectByName(part.nodeName);
    assert.ok(node, part.nodeName);
    let componentSolids = 0;
    node.traverse((child) => {
      if (!(child instanceof Mesh)) return;
      componentSolids++; solids++;
      triangles += (child.geometry.index?.count ?? child.geometry.getAttribute("position").count) / 3;
      const normals = child.geometry.getAttribute("normal");
      assert.ok(normals?.count, `${child.name} needs normals`);
      for (let i = 0; i < normals.count; i++) {
        const length = Math.hypot(normals.getX(i), normals.getY(i), normals.getZ(i));
        assert.ok(Number.isFinite(length) && Math.abs(length - 1) < .02, `${child.name} invalid normal`);
      }
    });
    assert.equal(componentSolids, part.solidCount);
  }
  assert.equal(solids, 56);
  assert.equal(triangles, index.triangleCount);
  const bounds = new Box3().setFromObject(model.scene);
  close(bounds.min.toArray(), MACHINE.bounds.min, .0003);
  close(bounds.max.toArray(), MACHINE.bounds.max, .0003);
});

test("identity animation wrappers preserve nested parent rotations, bind scale and PBR materials", () => {
  const scene = new Group(); scene.position.set(.2, .1, -.15); scene.rotation.y = .3;
  const parent = new Group(); parent.rotation.x = -.4; parent.scale.set(.8, 1.2, 1.1); scene.add(parent);
  const component = new Group(); component.name = index.parts[0].nodeName;
  component.position.set(.21, .13, -.06); component.rotation.z = .27;
  parent.add(component);
  const material = new MeshStandardMaterial({ color: "#445566", metalness: .7 });
  const solid = new Mesh(new BoxGeometry(), material); solid.name = "quantized_solid";
  solid.position.set(.015, -.02, .04); solid.scale.set(.003, .002, .004); component.add(solid);
  scene.updateMatrixWorld(true);
  const expected = solid.matrixWorld.elements.slice();
  const prepared = prepareMachineAssembly(scene, [specs[0]]);
  const cloned = prepared.root.getObjectByName(solid.name) as Mesh;
  close(cloned.matrixWorld.elements, expected);
  assert.equal(cloned.material, material);
  assert.equal(cloned.geometry, solid.geometry);
  const timeline = createAssemblyTimeline(prepared.specs, prepared.objects);
  for (const progress of [1, .12, .8, 0, 1]) timeline.seek(progress);
  prepared.root.updateMatrixWorld(true);
  close(cloned.matrixWorld.elements, expected);
  close(solid.matrixWorld.elements, expected);
  timeline.dispose(); solid.geometry.dispose(); material.dispose();
});

test("arbitrary and reverse seeks keep multi-solid products rigid and restore every source world matrix", () => {
  model.scene.updateMatrixWorld(true);
  const sourceMatrices = new Map<string, number[]>();
  model.scene.traverse((node) => { if (node instanceof Mesh) sourceMatrices.set(node.name, node.matrixWorld.elements.slice()); });
  const prepared = prepareMachineAssembly(model.scene, specs);
  const timeline = createAssemblyTimeline(prepared.specs, prepared.objects);
  const rigidDistances = new Map<string, number[]>();
  for (const progress of [1, .97, .5, 0, .86, .43, 1, .23, 1]) {
    timeline.seek(progress); prepared.root.updateMatrixWorld(true);
    for (const part of index.parts.filter((entry) => (entry.solidCount ?? 0) > 1)) {
      const node = prepared.root.getObjectByName(part.nodeName)!;
      const centers: Vector3[] = [];
      node.traverse((child) => { if (child instanceof Mesh) centers.push(new Box3().setFromObject(child).getCenter(new Vector3())); });
      const distances = centers.map((center) => center.distanceTo(centers[0]));
      if (!rigidDistances.has(part.nodeName)) rigidDistances.set(part.nodeName, distances);
      close(distances, rigidDistances.get(part.nodeName)!);
    }
    if (progress === 1) prepared.root.traverse((node) => {
      if (node instanceof Mesh) close(node.matrixWorld.elements, sourceMatrices.get(node.name)!);
    });
  }
  timeline.dispose();
});

test("camera bounds remain continuous when the incoming portafilter becomes visible", () => {
  const prepared = prepareMachineAssembly(model.scene, specs);
  const timeline = createAssemblyTimeline(specs, prepared.objects);
  const portafilter = specs.find((part) => part.group === "11_Accessories")!;
  const sample = (progress: number) => {
    timeline.seek(progress);
    const box = measureAssemblyBounds(prepared.root);
    return [...box.min.toArray(), ...box.max.toArray()];
  };
  const before = sample(portafilter.assemblyStart - .000001);
  assert.equal(prepared.objects.get(portafilter.id)!.visible, false);
  const after = sample(portafilter.assemblyStart + .000001);
  assert.equal(prepared.objects.get(portafilter.id)!.visible, true);
  close(after, before, .000001);
  for (const progress of [.89, .88, 1, .887, .88]) assert.deepEqual(sample(progress), sample(progress));
  timeline.dispose();
});
