import type { AssetIndex, AssetNode } from "../assets/loadMachineAssets";
import type { AssemblyGroup, PartSpec, QuaternionTuple, Vec3 } from "../types";
import { rotateVectorByQuaternion } from "../scroll/assemblyMath";
import { getChapter } from "./chapters";

const CAD_SOURCE = "https://au.lamarzocco.com/wp-content/uploads/2023/09/linea_pb_2d_3d_CAD.zip";
const SOURCE_NOTE = "Source CAD transform retained. Choreography is an educational exploded approach, not a factory installation sequence. Components without their verified supply or mount remain a suspended educational subassembly; missing boilers, valve bodies and wiring are not implied. Product identifiers are not claimed as current catalog part numbers.";

function context(node: AssetNode): string {
  return node.sourcePath?.join("/").toLowerCase() || node.sourceName.toLowerCase();
}
function isSightGlass(node: AssetNode): boolean { return /l120 c_/.test(context(node)); }
function isHotWater(node: AssetNode): boolean { return /l053-c|l160/.test(context(node)); }
function isKeypad(node: AssetNode): boolean { return /assieme_3tasti/.test(context(node)); }
function sourceFamily(node: AssetNode, family: string): boolean {
  const name = node.sourceName.toLowerCase();
  return name === family || name.startsWith(`${family}.`) || name.startsWith(`${family}_`);
}

// The occurrence hierarchy distinguishes a keypad cover from an exterior panel.
export function classifyNode(node: AssetNode): AssemblyGroup {
  if (node.group) return node.group as AssemblyGroup;
  const name = node.sourceName.toLowerCase(); const path = context(node);
  if (/l111-2nac|l112|l113|portaf/.test(path)) return "11_Accessories";
  if (isSightGlass(node)) return "02_Hydraulics";
  if (/l053|b\.1\.008|l160|l171|l173|t\.2\.001/.test(path)) return "06_Steam";
  if (isKeypad(node)) return /connettore|piastra_posteriore|cover_posteriore|scatolina/.test(name) ? "07_Electronics" : "08_ControlPanel";
  if (/nlsa05|nlsa08|c\.1\.152|c\.1\.157/.test(path)) return "09_Drain";
  if (/c\.1\.153|c\.1\.156|nle|l280|l400|i\.2\.001/.test(path) || sourceFamily(node, "i.1.006")) return "08_ControlPanel";
  if (/nlc0[456]|nlsa07|c\.3\.007|f\.2\.026/.test(path)) return "01_Frame";
  if (/c\.1\.(141|142|143|144|145|147|149|161|164)([._]|$)|d\.2\.007|i\.1\.060/.test(name)) return "10_BodyPanels";
  if (/l109|l107|l105|group|gruppo|sa944/.test(name)) return "05_BrewGroups";
  if (/connettore|scatolina|switch/.test(name)) return "07_Electronics";
  if (/tasti|display|manometro|nlscritta|nl_scritta/.test(name)) return "08_ControlPanel";
  if (/d\.4\.008|cover|piastra|c\.1\.15[0134]|c\.1\.155|fianc|rear|sheet|top/.test(name)) return "10_BodyPanels";
  return "01_Frame";
}

function materialForNode(node: AssetNode): string {
  const name = node.sourceName.toLowerCase();
  if (sourceFamily(node, "f.2.026") || sourceFamily(node, "l171-g") || sourceFamily(node, "l122-a") || sourceFamily(node, "l122-b")) return "rubber";
  if (sourceFamily(node, "l122") || sourceFamily(node, "f.1.042")) return "glass";
  if (sourceFamily(node, "l120-2a")) return "copper";
  if (sourceFamily(node, "l121") || sourceFamily(node, "l120-1cr")) return "chrome";
  if (/knob mounting screw|l120 c_body|l111-ss|l113|c\.1\.157/.test(name)) return "stainless";
  if (/l112.*handle|f\.1\.034.*plastic|main switch knob/.test(name)) return "black";
  if (/nlc0[456]|c\.1\.14[34]/.test(name)) return "black";
  if (/c\.1\.14[79]|c\.1\.153|c\.1\.156|c\.1\.151.*sheet|c\.1\.145.*center/.test(name)) return "white";
  if (/gasket|guarnizione|h\.1\./.test(name)) return "rubber";
  if (/nl_scritta_display|nle02/.test(name)) return "display";
  if (/tasto/.test(name)) return "chrome";
  return node.materialGroup || "stainless";
}

function offset(group: AssemblyGroup, node: AssetNode, rank: number): Vec3 {
  const side = node.position[0] < 0 ? -1 : 1;
  if (group === "01_Frame") return [side * (rank % 3) * .05, -.24 - rank % 4 * .025, 0];
  if (group === "10_BodyPanels") return [side * .36, .12 + rank % 3 * .06, node.position[2] < 0 ? -.25 : .08];
  if (group === "09_Drain") return [0, -.03, .35];
  if (group === "08_ControlPanel") return [0, .07, .34];
  if (group === "06_Steam") return [side * .14, .05, .20];
  if (group === "02_Hydraulics") return [.13, .07, .18];
  if (group === "05_BrewGroups") return [0, -.14 - rank % 3 * .025, .12];
  return [side * .18, .20, -.15];
}

type Entry = { node: AssetNode; part: PartSpec };
type Selection = readonly Entry[];

export function buildPartsManifest(index: AssetIndex): readonly PartSpec[] {
  const groups = new Map<AssemblyGroup, AssetNode[]>();
  for (const node of index.parts) {
    const group = classifyNode(node); groups.set(group, [...(groups.get(group) || []), node]);
  }
  const entries: Entry[] = index.parts.map((node) => {
    const group = classifyNode(node); const chapter = getChapter(group);
    const siblings = groups.get(group)!; const rank = siblings.indexOf(node); const delta = offset(group, node, rank);
    const start = chapter.start + .004 + (rank / Math.max(1, siblings.length)) * (chapter.end - chapter.start) * .42;
    return { node, part: {
      id: `${group}.${node.nodeName}`, name: node.sourceName, group,
      assetPath: index.assetPath, nodeName: node.nodeName, sourceUrl: CAD_SOURCE,
      sourcePage: null, manufacturerPartNumber: null, accuracyStatus: "Verified CAD",
      finalPosition: node.position, finalQuaternion: node.quaternion, finalScale: [1, 1, 1],
      initialPosition: [node.position[0] + delta[0], node.position[1] + delta[1], node.position[2] + delta[2]],
      initialQuaternion: node.quaternion, assemblyStart: start,
      assemblyEnd: Math.min(chapter.end - .004, start + (chapter.end - chapter.start) * .48),
      dependencies: [], materialGroup: materialForNode(node), notes: SOURCE_NOTE,
    } };
  });
  const select = (predicate: (node: AssetNode) => boolean): Selection => entries.filter(({ node }) => predicate(node));
  const named = (pattern: RegExp): Selection => select((node) => pattern.test(node.sourceName.toLowerCase()));
  const sideOf = (items: Selection, side: number): Selection => items.filter(({ node }) => Math.sign(node.position[0]) === side);
  const phase = (items: Selection, start: number, end: number, dependencies: Selection = [], delta?: Vec3) => {
    for (const { node, part } of items) {
      part.assemblyStart = start; part.assemblyEnd = end;
      part.dependencies = dependencies.filter((entry) => entry.part.id !== part.id).map((entry) => entry.part.id);
      if (delta) part.initialPosition = [node.position[0] + delta[0], node.position[1] + delta[1], node.position[2] + delta[2]];
    }
  };

  const legs = named(/^c\.3\.007/); const corners = named(/^nlc0[456]/);
  phase(legs, .054, .065); phase(corners, .066, .082, legs);
  for (const side of [-1, 1]) {
    const leg = sideOf(legs, side);
    phase(sideOf(named(/^f\.2\.026/), side), .083, .095, leg);
    phase(sideOf(select((node) => /nlsa07/.test(context(node)) && !/^c\.3\.007|^f\.2\.026/.test(node.sourceName.toLowerCase())), side), .096, .110, leg);
  }

  // The source includes a complete sight glass, but not its boiler feed tubes.
  const sight = select(isSightGlass);
  const sightPart = (pattern: RegExp) => sight.filter(({ node }) => pattern.test(node.sourceName.toLowerCase()));
  const sightBody = sightPart(/^l120 c_body/); const insideCap = sightPart(/^l120-3/);
  const sightSeal = sightPart(/^l122-a/); const glass = sightPart(/^l122_l122/);
  const flatSeal = sightPart(/^l122-b/); const bezel = sightPart(/^l121/);
  const drainFitting = sightPart(/^l120-1cr/); const washer = sightPart(/^l120-2a/);
  phase(sightBody, .134, .145, [], [.10, .05, .12]);
  phase(insideCap, .146, .156, sightBody, [0, 0, .075]);
  phase(sightSeal, .157, .167, insideCap, [0, 0, .12]);
  phase(glass, .168, .179, sightSeal, [0, 0, .16]);
  phase(flatSeal, .180, .189, glass, [0, 0, .19]);
  phase(bezel, .190, .204, flatSeal, [0, 0, .23]);
  phase(drainFitting, .146, .160, sightBody, [0, -.065, .03]);
  phase(washer, .161, .170, drainFitting, [0, -.08, .06]);
  phase(sightPart(/^l120-2_l120-2/), .171, .181, washer, [0, -.08, .10]);

  const hot = select(isHotWater);
  const hotPart = (pattern: RegExp) => hot.filter(({ node }) => pattern.test(node.sourceName.toLowerCase()));
  const junction = hotPart(/^l160_junction/); const upperSeal = hotPart(/^h\.1\.003/);
  const lowerSeal = hotPart(/^h\.1\.013/); const adaptor = hotPart(/^l160-3_areator adaptor/);
  const filter = hotPart(/^l160-3_filter/); const aeratorSeal = hotPart(/^l160-3_gasket/);
  phase(junction, .514, .522, [], [.035, .065, .10]);
  phase(upperSeal, .523, .531, junction, [0, .08, .015]);
  phase(lowerSeal, .523, .531, junction, [0, -.045, .015]);
  phase(hotPart(/^l160_nut/), .532, .540, upperSeal, [0, .10, 0]);
  phase(adaptor, .532, .543, lowerSeal, [0, -.075, .015]);
  phase(filter, .544, .552, adaptor, [0, -.13, 0]);
  phase(aeratorSeal, .544, .552, adaptor, [0, -.10, .015]);
  phase(hotPart(/^l160-3_areator cover/), .553, .563, [...filter, ...aeratorSeal], [0, -.17, 0]);

  for (const side of [-1, 1]) {
    const stagger = side > 0 ? .005 : 0;
    const wandJoint = sideOf(named(/^t\.2\.001_junction/), side);
    const wandTube = sideOf(named(/^t\.2\.001_tube/), side);
    const knobInsert = sideOf(named(/^f\.1\.034_insert/), side);
    const knob = sideOf(named(/^f\.1\.034_plastic/), side);
    phase(wandJoint, .565 + stagger, .574 + stagger, [], [side * .06, .055, .07]);
    phase(wandTube, .575 + stagger, .586 + stagger, wandJoint, [side * .07, -.025, .14]);
    phase(sideOf(named(/^l171-g/), side), .587 + stagger, .596 + stagger, wandTube, [side * .09, -.045, .08]);
    phase(sideOf(named(/^l173/), side), .587 + stagger, .596 + stagger, wandTube, [0, -.11, .08]);
    phase(knobInsert, .565 + stagger, .573 + stagger, [], [0, 0, .09]);
    phase(knob, .574 + stagger, .584 + stagger, knobInsert, [0, 0, .16]);
    phase(sideOf(named(/^f\.1\.035/), side), .585 + stagger, .595 + stagger, knob, [0, 0, .22]);
  }

  const fascia = named(/^c\.1\.153/); const switchPanel = named(/^c\.1\.156/);
  phase(fascia, .704, .722); phase(switchPanel, .704, .716);
  phase(named(/^fastener_m4_tl/), .723, .735, fascia);
  phase(named(/^i\.1\.006/), .717, .728, switchPanel);
  const switchPlate = named(/^main_switch_cover/); const switchInsert = named(/^knob insert/); const switchKnob = named(/^main switch knob/);
  phase(switchPlate, .717, .725, switchPanel); phase(switchInsert, .726, .734, switchPlate);
  phase(switchKnob, .735, .745, switchInsert); phase(named(/^knob mounting screw/), .746, .752, switchKnob);
  const gaugeBracket = named(/^staffa manometro/);
  phase(gaugeBracket, .723, .733, fascia); phase(named(/^l280/), .734, .748, gaugeBracket);
  const displayFrame = named(/^rev_04_nle03_front/); const display = named(/^nle02/); const displayLabel = named(/^nl_scritta_display/); const displayGlass = named(/^f\.1\.042/);
  phase(displayFrame, .723, .734, fascia); phase(display, .735, .747, displayFrame);
  phase(displayLabel, .748, .756, display); phase(displayGlass, .757, .768, [...displayLabel, ...displayFrame]);
  phase(named(/^i\.2\.001/), .769, .781, displayGlass);
  const teaBody = named(/^1_01_mod_nle04/); const teaInsert = named(/^3_01/);
  phase(teaBody, .725, .737, fascia); phase(teaInsert, .738, .748, teaBody); phase(named(/^2_01/), .749, .759, teaInsert);

  for (const side of [-1, 1]) {
    const stagger = side > 0 ? .004 : 0;
    const keypad = sideOf(select(isKeypad), side);
    const keypadPart = (pattern: RegExp) => keypad.filter(({ node }) => pattern.test(node.sourceName.toLowerCase()));
    const backPlate = keypadPart(/^piastra_posteriore/); const connector = keypadPart(/^connettore/); const box = keypadPart(/^scatolina/);
    phase(backPlate, .614 + stagger, .628 + stagger); phase(connector, .629 + stagger, .640 + stagger, backPlate);
    phase(box, .641 + stagger, .653 + stagger, connector); phase(keypadPart(/^cover_posteriore/), .654 + stagger, .668 + stagger, box);
    const front = keypadPart(/^piastra_anteriore/); const gasket = keypadPart(/^guarnizione_silicone/); const buttons = keypadPart(/^tasto/);
    phase(front, .723 + stagger, .735 + stagger, [...fascia, ...backPlate]);
    phase(gasket, .736 + stagger, .746 + stagger, front); phase(buttons, .747 + stagger, .758 + stagger, gasket);
    phase(keypadPart(/^vite_svasata$/), .759 + stagger, .769 + stagger, buttons);
    phase(keypadPart(/^vite_svasata_corta$/), .770 + stagger, .780 + stagger, buttons);
  }

  const basin = named(/^c\.1\.152/); const drainBrackets = named(/^c\.1\.151.*bracket/);
  const drainCover = named(/^c\.1\.151.*sheet/); const grille = named(/^c\.1\.157.*sheet/);
  phase(basin, .794, .804); phase(drainBrackets, .794, .807);
  phase(drainCover, .808, .820, drainBrackets); phase(grille, .821, .833, basin);
  phase(named(/^c\.1\.157.*stud/), .834, .843, grille); phase(named(/^d\.4\.008/), .821, .831, drainCover);

  const bodyPanels = select((node) => /^c\.1\.(141|142|143|144|145|147|149)([._]|$)/.test(node.sourceName.toLowerCase()));
  const cupGrilles = named(/^c\.1\.164/); const rail = named(/^c\.1\.161/);
  phase(bodyPanels, .854, .882); phase(cupGrilles, .883, .899, bodyPanels);
  phase(rail, .900, .916, cupGrilles); phase(named(/^i\.1\.060/), .917, .931, rail);
  phase(named(/^d\.2\.007/), .884, .896, named(/^c\.1\.145/));

  const portafilterYaw: QuaternionTuple = [0, Math.sin(Math.PI / 30), 0, Math.cos(Math.PI / 30)];
  for (const side of [-1, 1]) {
    const finalCenter: Vec3 = [side * .12, .3613809248526369, .14266092850376418];
    const initialCenter: Vec3 = [finalCenter[0], finalCenter[1] - .16, finalCenter[2] + .20];
    const portafilter = sideOf(select((node) => classifyNode(node) === "11_Accessories"), side);
    phase(portafilter, side < 0 ? .944 : .952, side < 0 ? .979 : .987);
    for (const { part } of portafilter) {
      const relative: Vec3 = [part.finalPosition[0] - finalCenter[0], part.finalPosition[1] - finalCenter[1], part.finalPosition[2] - finalCenter[2]];
      const rotated = rotateVectorByQuaternion(relative, portafilterYaw);
      part.initialQuaternion = portafilterYaw;
      part.initialPosition = [initialCenter[0] + rotated[0], initialCenter[1] + rotated[1], initialCenter[2] + rotated[2]];
      part.assemblyPivot = { initialCenter, finalCenter };
      part.notes = `${SOURCE_NOTE} All six leaves share one rigid portafilter pivot and locking rotation. L113 is the filter-retaining spring, not a basket or shower screen.`;
    }
  }
  return entries.map(({ part }) => part);
}
