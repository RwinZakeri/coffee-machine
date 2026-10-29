/** Compress only the custom model; retain every component and solid node. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, stat } from 'node:fs/promises';
import { NodeIO, getBounds } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, weld, meshopt } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';

const rawPath = 'research/cad/custom-espresso/machine-uncompressed.glb';
const outputPath = 'public/models/custom-espresso/machine.glb';
const indexPath = 'public/models/custom-espresso/asset-index.json';
await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder,
});
const index = JSON.parse(await readFile(indexPath, 'utf8'));
assert.equal(index.modelId, 'custom-espresso');
const document = await io.read(rawPath);
const nodeMap = (doc) => new Map(doc.getRoot().listNodes().map((node) => [node.getName(), node]));
const before = nodeMap(document);
const contract = index.parts.map((part) => {
  const node = before.get(part.nodeName);
  assert.ok(node, part.nodeName);
  assert.equal(node.listChildren().length, part.solidCount);
  return { part, matrix: node.getWorldMatrix(), parent: node.getParentNode()?.getName() ?? null,
    children: node.listChildren().map((child) => child.getName()).sort(), bounds: getBounds(node) };
});
const namesBefore = [...before.keys()].sort();
const materialsBefore = document.getRoot().listMaterials().map((m) => m.getName()).sort();
await document.transform(dedup(), weld(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
await io.write(outputPath, document);
// Re-read the compressed bytes so checks exercise the encoded/decoded asset.
const decoded = await io.read(outputPath);
const after = nodeMap(decoded);
assert.deepEqual([...after.keys()].sort(), namesBefore, 'Optimization changed named nodes');
assert.deepEqual(decoded.getRoot().listMaterials().map((m) => m.getName()).sort(), materialsBefore);
let maximumCompressionBoundsErrorM = 0;
for (const { part, matrix, parent, children, bounds } of contract) {
  const node = after.get(part.nodeName);
  assert.deepEqual(node.getWorldMatrix(), matrix, `Component placement changed: ${part.nodeName}`);
  assert.equal(node.getParentNode()?.getName() ?? null, parent);
  assert.deepEqual(node.listChildren().map((child) => child.getName()).sort(), children);
  const actual = getBounds(node);
  const error = Math.max(...['min', 'max'].flatMap((key) => actual[key].map((v, i) => Math.abs(v - bounds[key][i]))));
  assert.ok(error < .00005, `${part.nodeName} compression error ${error}m`);
  maximumCompressionBoundsErrorM = Math.max(maximumCompressionBoundsErrorM, error);
}
index.uncompressedAssetBytes = (await stat(rawPath)).size;
index.assetBytes = (await stat(outputPath)).size;
index.compression = 'EXT_meshopt_compression; 16-bit positions; source component hierarchy retained';
index.maximumCompressionBoundsErrorM = maximumCompressionBoundsErrorM;
index.assetSha256 = createHash('sha256').update(await readFile(outputPath)).digest('hex');
await writeFile(indexPath, `${JSON.stringify(index, null, 2)}\n`);
console.log(JSON.stringify({ components: index.parts.length, solids: index.solidCount,
  triangles: index.triangleCount, originalBytes: index.uncompressedAssetBytes,
  optimizedBytes: index.assetBytes, maximumCompressionBoundsErrorMm: maximumCompressionBoundsErrorM * 1000 }));
