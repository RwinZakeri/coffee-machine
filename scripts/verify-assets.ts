import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Box3, Mesh } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { buildPartsManifest } from "../app/experience/data/partsManifest";
import { MACHINE } from "../app/experience/data/machineConfig";
import { prepareMachineAssembly } from "../app/experience/assets/prepareMachineAssembly";
import type { AssetIndex } from "../app/experience/assets/loadMachineAssets";
import { assertValidPartsManifest } from "../app/experience/scroll/assemblyMath";
import { createAssemblyTimeline } from "../app/experience/scroll/AssemblyTimeline";

const index = JSON.parse(await readFile(`public${MACHINE.indexUrl}`, "utf8")) as AssetIndex;
const data = await readFile(`public${index.assetPath}`);
const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength), "");
const specs = buildPartsManifest(index);
assertValidPartsManifest(specs);
assert.equal(index.modelId, MACHINE.id);
assert.equal(specs.length, MACHINE.componentCount);
assert.equal(index.solidCount, MACHINE.solidCount);
const prepared = prepareMachineAssembly(gltf.scene, specs);
const director = createAssemblyTimeline(specs, prepared.objects);
director.seek(1); prepared.root.updateMatrixWorld(true);
let maximumBoundError = 0; let triangles = 0; let solids = 0;
for (const part of index.parts) {
  const node = prepared.root.getObjectByName(part.nodeName);
  assert(node, `Missing GLB node ${part.nodeName}`);
  const box = new Box3().setFromObject(node);
  for (const [bound, actual] of [["min", box.min.toArray()], ["max", box.max.toArray()]] as const) {
    part.bounds[bound].forEach((target, axis) => {
      const error = Math.abs(target - actual[axis]); maximumBoundError = Math.max(maximumBoundError, error);
      assert(error < .0003, `${part.nodeName} ${bound}[${axis}] differs from source by ${error}m`);
    });
  }
  let componentSolids = 0;
  node.traverse((child) => { if (child instanceof Mesh) {
    componentSolids++; solids++;
    triangles += (child.geometry.index?.count ?? child.geometry.getAttribute("position").count) / 3;
  } });
  assert.equal(componentSolids, part.solidCount);
}
assert.equal(solids, MACHINE.solidCount);
assert.equal(triangles, index.triangleCount);
const world = new Box3().setFromObject(prepared.root);
for (const bound of ["min", "max"] as const) world[bound].toArray().forEach((value, axis) => assert(Math.abs(value - MACHINE.bounds[bound][axis]) < .0003));
director.dispose();
console.log(JSON.stringify({ model: index.modelId, validatedComponents: specs.length, solids, triangles, modelBytes: data.length, maximumGeometryBoundErrorMm: maximumBoundError * 1000, dimensionsMetres: world.getSize(world.max.clone()).toArray() }, null, 2));
