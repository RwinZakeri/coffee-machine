import type { AssetIndex, AssetNode } from "../assets/loadMachineAssets";
import type { AssemblyGroup, PartSpec, Vec3 } from "../types";
import { getChapter } from "./chapters";

// Explicit mapping for the supplied STEP export; no inferred OEM name families.
const GROUP_BY_PRODUCT: Readonly<Record<number, AssemblyGroup>> = {
  56: "01_Frame", 13573: "01_Frame", 14616: "01_Frame",
  15276: "01_Frame", 16177: "01_Frame", 16840: "01_Frame",
  17731: "09_Drain", 31113: "09_Drain", 31379: "09_Drain",
  31739: "09_Drain", 35945: "09_Drain", 36499: "09_Drain", 37041: "09_Drain",
  37920: "05_BrewGroups", 39459: "05_BrewGroups", 104346: "05_BrewGroups",
  462669: "08_ControlPanel", 463563: "08_ControlPanel",
  113985: "10_BodyPanels", 464725: "10_BodyPanels",
  469488: "10_BodyPanels", 472826: "10_BodyPanels",
  106835: "11_Accessories",
};

export function classifyNode(node: AssetNode): AssemblyGroup {
  const group = node.sourceProductId === undefined ? undefined : GROUP_BY_PRODUCT[node.sourceProductId];
  if (!group) throw new Error(`Unmapped custom CAD component: ${node.sourceName}.`);
  return group;
}

function approach(node: AssetNode, group: AssemblyGroup, rank: number): Vec3 {
  const side = node.position[0] < 0 ? -1 : 1;
  if (node.sourceProductId === 56) return [0, .10, -.12];
  if (group === "01_Frame") return [side * .10, .08, -.08];
  if (group === "09_Drain") return [0, .035 + (rank % 2) * .025, .16];
  if (group === "05_BrewGroups") return node.sourceProductId === 104346 ? [.16, .03, 0] : [0, .055, .16];
  if (group === "08_ControlPanel") return [0, .07, .12];
  if (node.sourceProductId === 113985) return [0, .10, -.17];
  if (group === "10_BodyPanels") return [side * .16, .035, 0];
  return [0, -.07, .17];
}

/** Animate parent-frame deltas; imported component and solid bind matrices stay intact. */
export function buildPartsManifest(index: AssetIndex): readonly PartSpec[] {
  const grouped = new Map<AssemblyGroup, AssetNode[]>();
  for (const node of index.parts) {
    const group = classifyNode(node);
    grouped.set(group, [...(grouped.get(group) ?? []), node]);
  }
  return index.parts.map((node) => {
    const group = classifyNode(node);
    const chapter = getChapter(group);
    const siblings = grouped.get(group)!;
    const rank = siblings.indexOf(node);
    const span = chapter.end - chapter.start;
    const start = chapter.start + .006 + rank / siblings.length * span * .34;
    return {
      id: `${group}.${node.nodeName}`,
      name: node.sourceName.trim(), group,
      assetPath: index.assetPath, nodeName: node.nodeName,
      sourceUrl: "", sourcePage: null, manufacturerPartNumber: null,
      accuracyStatus: "Verified CAD",
      finalPosition: [0, 0, 0], finalQuaternion: [0, 0, 0, 1], finalScale: [1, 1, 1],
      initialPosition: approach(node, group, rank), initialQuaternion: [0, 0, 0, 1],
      assemblyStart: start, assemblyEnd: Math.min(chapter.end - .012, start + span * .48),
      dependencies: [], materialGroup: node.materialGroup ?? "source-material",
      notes: "Original STEP component and solid bind transforms retained beneath a translation-only animation wrapper. Motion illustrates an exploded presentation, not a manufacturing sequence. Finishes are authored because the CAD contains no material data.",
    } satisfies PartSpec;
  });
}
