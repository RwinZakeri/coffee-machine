import type { AccuracyStatus, PartSpec, Vec3 } from "../types";

const CATALOG = "https://au.lamarzocco.com/wp-content/uploads/2023/09/LineaPB_Parts_Catalog_V3.2COLOR-2.pdf";

// Source STEP axes are already X width / Y up / Z front, in millimeters.
// Negated source recenter offset from public/models/linea-pb/asset-index.json.
export const RECONSTRUCTION_CAD_OFFSET: Vec3 = [0, 0.2103309248526369, 0.06466092850376418];
export const GROUP_SOURCE_MATING_PLANE_MM = 151.05;
export const GROUP_SOURCE_AXIS_DEPTH_MM = 78;
const BREW_CHAPTER_TIMING_OFFSET = .04;

export type BrewGroupElement = "Housing" | "Gasket" | "ShowerScreen" | "DiffuserScrew" | "BayonetRing" | "FixingBolts";
export const BREW_GROUP_ELEMENTS: readonly BrewGroupElement[] = [
  "Housing", "Gasket", "ShowerScreen", "DiffuserScrew", "BayonetRing", "FixingBolts",
];
export function brewGroupPartId(side: "Left" | "Right", element: BrewGroupElement): string {
  return `05_BrewGroups.Reconstruction.${side}.${element}`;
}

interface ReconstructionDefinition {
  element: BrewGroupElement;
  name: string;
  number: string | null;
  accuracy: AccuracyStatus;
  heightOffset: number;
  start: number;
  end: number;
  dependencies: readonly BrewGroupElement[];
  material: string;
  note: string;
}

const definitions: readonly ReconstructionDefinition[] = [
  {
    element: "Housing", name: "Exposed AV group skirt", number: null,
    accuracy: "Visual approximation", heightOffset: .026, start: .376, end: .392,
    dependencies: [], material: "chrome",
    note: "V3.2 p36 shows exposed cylindrical group with rear saturated neck. This mesh depicts only an inferred 96mm outer-diameter exposed skirt and upper lip, not the complete saturated housing, neck or internal water path. Absolute vertical/depth alignment is inferred from the CAD portafilter rim.",
  },
  {
    element: "Gasket", name: "Silicone group gasket", number: "H.3.007",
    accuracy: "Document-supported reconstruction", heightOffset: .0051, start: .393, end: .405,
    dependencies: ["Housing"], material: "rubber",
    note: "V3.2 p37 item4 and V3.8 printed49: catalog dimensions 71.6mm OD /55mm ID ×8.2mm. Nominal annulus dimensions retained; exact bevel/compression and installed placement are inferred. Silicone selected from catalog alternatives, target serial unknown.",
  },
  {
    element: "ShowerScreen", name: "Later AV shower screen", number: "F.3.040.01",
    accuracy: "Document-supported reconstruction", heightOffset: .00425, start: .406, end: .418,
    dependencies: ["Gasket"], material: "stainless",
    note: "V3.2 p36/p37 item3b: later S/N0354 onward screen; V3.8 printed49 retains it. H6.5mm is verified. 53mm diameter, dish profile and illustrative perforation detail are inferred; no OEM logo emboss or exact hole artwork claimed.",
  },
  {
    element: "DiffuserScrew", name: "Central M6 diffuser screw", number: "A.5.110",
    accuracy: "Document-supported reconstruction", heightOffset: .0015, start: .419, end: .428,
    dependencies: ["ShowerScreen"], material: "chrome",
    note: "V3.2 p37 item2 /V3.8 printed49: M6 screw, 10mm head diameter. Shaft length and drive recess profile are illustrative; central attachment relationship is diagram-supported.",
  },
  {
    element: "BayonetRing", name: "Chromed bayonet ring", number: "L109.01",
    accuracy: "Visual approximation", heightOffset: .001, start: .419, end: .432,
    dependencies: ["Gasket"], material: "chrome",
    note: "V3.2 pp36-37 item1 /V3.8 printed48-49: separate lower chromed annulus with locking entries. 99mm outer diameter, 67mm lower bore, two entry widths, thickness and placement are inferred from diagrams and portafilter reference, not manufacturing dimensions.",
  },
  {
    element: "FixingBolts", name: "Three AV M8 cap fixing bolts", number: "L110.01",
    accuracy: "Document-supported reconstruction", heightOffset: .019, start: .433, end: .443,
    dependencies: ["BayonetRing"], material: "stainless",
    note: "V3.2 p42 diagram /p43 item2 and V3.8 printed55-56 show three M8×52 cap screws plus L1003 8.5×14×1.5mm washers. Screw dimensions and count supported; head profile and 43mm mounting radius inferred. Upper cap and rear neck are missing assets; these bolts do not establish a complete AV cap assembly.",
  },
];

/** Nominal lower-stack placements preserve CAD portafilter axes; see the source notes for dimensional limits. */
export function createReconstructedParts(): PartSpec[] {
  return (["Left", "Right"] as const).flatMap((side) => {
    const x = (side === "Left" ? -120 : 120) /1000 + RECONSTRUCTION_CAD_OFFSET[0];
    const groupPlaneY = GROUP_SOURCE_MATING_PLANE_MM /1000 + RECONSTRUCTION_CAD_OFFSET[1];
    const z = GROUP_SOURCE_AXIS_DEPTH_MM /1000 + RECONSTRUCTION_CAD_OFFSET[2];
    const stagger = side === "Right" ? .006 : 0;
    return definitions.map((definition) => {
      const finalPosition: Vec3 = [x, groupPlaneY + definition.heightOffset, z];
      return {
        id: brewGroupPartId(side, definition.element), name: `${definition.name} · ${side.toLowerCase()}`,
        group: "05_BrewGroups", assetPath: null, nodeName: null,
        sourceUrl: CATALOG, sourcePage: definition.element === "FixingBolts" ? 43 : 37,
        manufacturerPartNumber: definition.number, accuracyStatus: definition.accuracy,
        finalPosition, finalQuaternion: [0, 0, 0, 1], finalScale: [1, 1, 1],
        initialPosition: [x + (side === "Left" ? -.025 : .025), finalPosition[1] - .14, z + .04],
        initialQuaternion: [0, 0, 0, 1],
        assemblyStart: definition.start + BREW_CHAPTER_TIMING_OFFSET + stagger,
        assemblyEnd: definition.end + BREW_CHAPTER_TIMING_OFFSET + stagger,
        dependencies: definition.dependencies.map((element) => brewGroupPartId(side, element)),
        materialGroup: definition.material, notes: definition.note,
      } satisfies PartSpec;
    });
  });
}
