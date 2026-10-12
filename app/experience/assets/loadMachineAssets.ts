import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { Vec3, QuaternionTuple } from "../types";

export interface AssetNode {
  nodeName: string;
  sourceName: string;
  position: Vec3;
  quaternion: QuaternionTuple;
  bounds: { min: Vec3; max: Vec3 };
  materialGroup?: string;
  group?: string;
  sourcePath?: string[];
}
export interface AssetIndex {
  assetPath: string;
  parts: AssetNode[];
  byteLength?: number;
  triangleCount?: number;
  assetBytes?: number;
  sourceUrl?: string;
}
export interface LoadedAssets { model: GLTF; index: AssetIndex; }

export async function loadMachineAssets(signal: AbortSignal, onProgress: (loaded: number, total: number) => void): Promise<LoadedAssets> {
  const manifestResponse = await fetch("/models/linea-pb/asset-index.json", { signal });
  if (!manifestResponse.ok) throw new Error(`The CAD manifest is unavailable (HTTP ${manifestResponse.status}). See docs/asset-audit.md for conversion instructions.`);
  const index = await manifestResponse.json() as AssetIndex;
  if (!Array.isArray(index.parts) || !index.assetPath) throw new Error("The machine asset manifest has an invalid format.");
  const response = await fetch(index.assetPath, { signal });
  if (!response.ok) throw new Error(`The model is unavailable (HTTP ${response.status}).`);
  const total = Number(response.headers.get("Content-Length")) || index.assetBytes || index.byteLength || 0;
  const reader = response.body?.getReader();
  let buffer: ArrayBuffer;
  if (reader) {
    const chunks: Uint8Array[] = []; let loaded = 0;
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      chunks.push(chunk.value); loaded += chunk.value.byteLength; onProgress(loaded, total);
    }
    const joined = new Uint8Array(loaded); let offset = 0;
    for (const chunk of chunks) { joined.set(chunk, offset); offset += chunk.byteLength; }
    buffer = joined.buffer; onProgress(loaded, loaded);
  } else { buffer = await response.arrayBuffer(); onProgress(buffer.byteLength, buffer.byteLength); }
  signal.throwIfAborted();
  const model = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(buffer, "/models/linea-pb/");
  if (signal.aborted) { disposeMachineAssets(model); signal.throwIfAborted(); }
  return { model, index };
}

export function disposeMachineAssets(model: GLTF) {
  const geometries = new Set<import("three").BufferGeometry>();
  const materials = new Set<import("three").Material>();
  model.scene.traverse((object) => {
    const mesh = object as import("three").Mesh;
    if (mesh.isMesh) { geometries.add(mesh.geometry); (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((material) => materials.add(material)); }
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
}
