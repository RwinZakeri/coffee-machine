import { readFile, writeFile } from "node:fs/promises";
import { buildPartsManifest } from "../app/experience/data/partsManifest";
import { MACHINE } from "../app/experience/data/machineConfig";
import type { AssetIndex } from "../app/experience/assets/loadMachineAssets";

const index = JSON.parse(await readFile(`public${MACHINE.indexUrl}`, "utf8")) as AssetIndex;
const parts = buildPartsManifest(index);
const fields = ["id", "name", "group", "assetPath", "nodeName", "sourceUrl", "sourcePage", "manufacturerPartNumber", "accuracyStatus", "finalPosition", "finalQuaternion", "finalScale", "initialPosition", "initialQuaternion", "assemblyPivot", "assemblyStart", "assemblyEnd", "dependencies", "materialGroup", "notes"] as const;
const quote = (value: unknown) => `"${(typeof value === "object" && value !== null ? JSON.stringify(value) : value == null ? "" : String(value)).replaceAll('"', '""')}"`;
const inventoryFields = ["sourceProductId", "solidCount", "componentBindPosition", "componentBindQuaternion", "animationTransformSpace"];
const csv = [[...fields, ...inventoryFields].map(quote).join(","), ...parts.map((part) => [
  ...fields.map((field) => quote(part[field])),
  ...(() => {
    const source = index.parts.find((node) => node.nodeName === part.nodeName)!;
    return [source.sourceProductId, source.solidCount, source.position, source.quaternion, "Parent-frame delta; identity final wrapper, original static bind retained"].map(quote);
  })(),
].join(","))].join("\n") + "\n";
await writeFile("docs/custom-machine-runtime-parts.csv", csv);
console.log(`Exported ${parts.length} independent parts with source, accuracy, transforms and dependencies.`);
