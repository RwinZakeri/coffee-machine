import { NodeIO } from '@gltf-transform/core';
import { EXTMeshoptCompression, ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, weld, meshopt } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
import { readFile, writeFile, copyFile, stat } from 'node:fs/promises';

const modelPath = 'public/models/linea-pb/machine.glb';
const rawPath = 'research/cad/verified-2av/machine-uncompressed.glb';
const indexPath = 'public/models/linea-pb/asset-index.json';
await MeshoptEncoder.ready;
await MeshoptDecoder.ready;
try { await stat(rawPath); } catch { await copyFile(modelPath, rawPath); }
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });
const document = await io.read(rawPath);
const initialNodeNames = document.getRoot().listNodes().map(node => node.getName()).sort();
await document.transform(dedup(), weld(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
const finalNodeNames = document.getRoot().listNodes().map(node => node.getName()).sort();
if (JSON.stringify(initialNodeNames) !== JSON.stringify(finalNodeNames)) throw new Error('Optimization altered the independent assembly node inventory.');
await io.write(modelPath, document);
const index = JSON.parse(await readFile(indexPath, 'utf8'));
index.uncompressedAssetBytes = (await stat(rawPath)).size;
index.assetBytes = (await stat(modelPath)).size;
index.compression = 'EXT_meshopt_compression; 16-bit position quantization; independent node transforms preserved';
await writeFile(indexPath, JSON.stringify(index, null, 2) + '\n');
console.log(JSON.stringify({ nodes: index.meshCount, originalBytes: index.uncompressedAssetBytes, optimizedBytes: index.assetBytes, savedPercent: Math.round((1 - index.assetBytes / index.uncompressedAssetBytes) * 100) }));
