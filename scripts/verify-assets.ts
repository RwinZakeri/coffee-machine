import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Box3, Group, Mesh } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { buildPartsManifest } from "../app/experience/data/partsManifest";
import type { AssetIndex } from "../app/experience/assets/loadMachineAssets";
import { assertValidPartsManifest } from "../app/experience/scroll/assemblyMath";

const index = JSON.parse(await readFile("public/models/linea-pb/asset-index.json", "utf8")) as AssetIndex;
const data = await readFile(`public${index.assetPath}`);
const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength), "");
const specs = buildPartsManifest(index);
assertValidPartsManifest(specs);
let maximumBoundError = 0; let triangles = 0;
for (const [i, spec] of specs.entries()) {
  const node = gltf.scene.getObjectByName(spec.nodeName!);
  assert(node, `Missing GLB node ${spec.nodeName}`);
  const wrapper = new Group(); const copy = node.clone(true);
  copy.position.x -= spec.finalPosition[0]; copy.position.y -= spec.finalPosition[1]; copy.position.z -= spec.finalPosition[2];
  wrapper.position.set(...spec.finalPosition); wrapper.add(copy); wrapper.updateMatrixWorld(true);
  const box = new Box3().setFromObject(wrapper);
  for (const [bound, actual] of [["min", box.min.toArray()], ["max", box.max.toArray()]] as const) {
    index.parts[i].bounds[bound].forEach((target, axis) => {
      const error = Math.abs(target - actual[axis]); maximumBoundError = Math.max(maximumBoundError, error);
      assert(error < .0001, `Quantized ${spec.nodeName} ${bound}[${axis}] differs from source by ${error}m`);
    });
  }
  node.traverse((child) => { if (child instanceof Mesh) triangles += (child.geometry.index?.count || child.geometry.getAttribute("position").count) / 3; });
}
console.log(JSON.stringify({ validatedNodes: specs.length, triangles, modelBytes: data.length, maximumGeometryBoundErrorMm: maximumBoundError * 1000 }, null, 2));
