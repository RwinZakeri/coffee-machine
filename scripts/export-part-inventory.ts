import { readFile, writeFile } from "node:fs/promises";
import { buildPartsManifest } from "../app/experience/data/partsManifest";
import { createReconstructedParts } from "../app/experience/data/reconstructedParts";
import type { AssetIndex } from "../app/experience/assets/loadMachineAssets";

const index = JSON.parse(await readFile("public/models/linea-pb/asset-index.json", "utf8")) as AssetIndex;
const parts = [...buildPartsManifest(index), ...createReconstructedParts()];
const fields = ["id", "name", "group", "assetPath", "nodeName", "sourceUrl", "sourcePage", "manufacturerPartNumber", "accuracyStatus", "finalPosition", "finalQuaternion", "finalScale", "initialPosition", "initialQuaternion", "assemblyPivot", "assemblyStart", "assemblyEnd", "dependencies", "materialGroup", "notes"] as const;
const quote = (value: unknown) => `"${(typeof value === "object" && value !== null ? JSON.stringify(value) : value == null ? "" : String(value)).replaceAll('"', '""')}"`;
const inventoryFields = ["cadAvailability", "geometryAvailability", "licenseStatus"];
const csv = [[...fields, ...inventoryFields].map(quote).join(","), ...parts.map((part) => [
  ...fields.map((field) => quote(part[field])),
  quote(part.nodeName ? "Independent source CAD node" : "No source CAD; original reconstructed mesh"),
  quote(part.accuracyStatus === "Missing asset" ? "Unavailable" : "Available in runtime scene"),
  quote(part.nodeName ? "Manufacturer derivative; local study only; written redistribution permission required" : "Original reconstruction from manufacturer references; no public licensing grant established"),
].join(","))].join("\n") + "\n";
await writeFile("docs/parts-inventory.csv", csv);
console.log(`Exported ${parts.length} independent parts with source, accuracy, transforms and dependencies.`);
