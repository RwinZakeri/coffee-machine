import type { AssemblyGroup, CameraPose, Chapter, EnvironmentPalette, LightingState, Vec3 } from "../types";

const DARK: EnvironmentPalette = { background: "#0b0c0b", foreground: "#eeeae2", accent: "#c2a681" };
const LIGHT: EnvironmentPalette = { background: "#eae9e2", foreground: "#23251e", accent: "#8c6f48" };
const NEUTRAL: EnvironmentPalette = { background: "#24231f", foreground: "#eeeae2", accent: "#c2a681" };

const DARK_LIGHTING: LightingState = {
  ambient: 0.32, key: 3.7, rim: 4.2, environment: 0.6,
  keyColor: "#fff6e7", rimColor: "#e7d9c3",
};
const LIGHT_LIGHTING: LightingState = {
  ambient: 0.75, key: 3.2, rim: 2.1, environment: 1.1,
  keyColor: "#ffffff", rimColor: "#e8e2d8",
};

function camera(position: Vec3, target: Vec3 = [0, 0.2, 0], fov = 32): CameraPose {
  return { position, target, fov };
}

// Shared boundary poses keep direct jumps and reverse playback on the same path.
// All coordinates follow the inspected custom CAD: Y up, +Z toward the operator.
const CAMERA_BOUNDARIES: readonly CameraPose[] = [
  camera([0.94, 0.62, 1.14], [0, 0.18, -0.02]),
  camera([0.84, 0.53, 1.02], [0, 0.17, 0.02]),
  camera([0.77, 0.62, 1.07], [0, 0.21, 0.06]),
  camera([0.86, 0.66, 1.04], [0, 0.25, 0.01]),
  camera([1.02, 0.71, 0.92], [0, 0.24, -0.04]),
  camera([0.92, 0.63, 1.09], [0, 0.2, 0]),
  camera([0.96, 0.64, 1.16], [0, 0.2, 0]),
];

interface ChapterDefinition {
  group: AssemblyGroup;
  title: string;
  description: string;
  parts: readonly string[];
  focus: CameraPose;
  palette: EnvironmentPalette;
  choreography: string;
}

const definitions: readonly ChapterDefinition[] = [
  {
    group: "01_Frame", title: "Structure & supports",
    description: "A folded steel chassis establishes the structure. Separate mounting bases locate the components around it.",
    parts: ["steel Chassis espresso", "espresso chekvalve base", "espresso wiring base", "espresso input valve base", "espresso hydrodamper base", "espresso boiler base"],
    focus: camera([0.78, 0.49, 0.91], [-0.01, 0.18, -0.1]), palette: DARK,
    choreography: "The chassis and mounting bases approach their measured CAD positions as rigid components.",
  },
  {
    group: "09_Drain", title: "Drainage & cup support",
    description: "The drain basin, grille and raised cup support define the working space beneath the headgroup.",
    parts: ["espresso drain Mesh", "espresso drain", "espresso group drain", "espresso short cup mesh", "espresso short cup mesh left holder", "espresso short cup mesh right holder", "espresso short cup mesh base"],
    focus: camera([0.67, 0.5, 1.03], [-0.01, 0.11, 0.15]), palette: NEUTRAL,
    choreography: "Drainage and cup-support pieces translate into place; their modeled dimensions remain fixed.",
  },
  {
    group: "05_BrewGroups", title: "Headgroup & lever",
    description: "One headgroup and the side lever give the Jaxo coffee machine its distinctive working arrangement.",
    parts: ["espresso headgroup", "espresso lever full parts", "espresso solenoid cover"],
    focus: camera([0.8, 0.56, 1.03], [0.02, 0.22, 0.1]), palette: LIGHT,
    choreography: "The headgroup, four-solid lever product and solenoid cover settle as rigid products without invented joint motion.",
  },
  {
    group: "08_ControlPanel", title: "Display assembly",
    description: "The display base and its separate glass panel complete the interface opening above the headgroup.",
    parts: ["espresso display base", "espresso display glass "],
    focus: camera([0.73, 0.65, 1.04], [-0.01, 0.31, -0.02]), palette: LIGHT,
    choreography: "The display base and glass approach their source positions; no screen graphics or controls are inferred from the CAD.",
  },
  {
    group: "10_BodyPanels", title: "Enclosure & fasteners",
    description: "The curved outer cover, sheet-panel bodies and two screw groups complete the enclosure around the structure.",
    parts: ["espresso unit cover", "espresso right sheet pannel", "Symmetry of espresso screw", "Symmetry of Symmetry of espresso screw"],
    focus: camera([1.04, 0.67, 0.8], [0, 0.22, -0.08]), palette: DARK,
    choreography: "The cover, panel product and screw groups translate independently, preserving their internal solid relationships.",
  },
  {
    group: "11_Accessories", title: "The complete unit",
    description: "A single portafilter completes the custom design. Its projecting handle balances the depth of the curved enclosure.",
    parts: ["espresso portafilter"],
    focus: camera([0.78, 0.52, 1.08], [-0.01, 0.2, 0.1]), palette: LIGHT,
    choreography: "The three-solid portafilter product translates into its CAD placement before a three-quarter product reveal.",
  },
];

const CHAPTER_BOUNDARIES = [0.05, 0.22, 0.39, 0.57, 0.69, 0.88, 1] as const;

export const CHAPTERS: readonly Chapter[] = definitions.map((definition, index) => {
  const start = CHAPTER_BOUNDARIES[index];
  const end = CHAPTER_BOUNDARIES[index + 1];
  const chapterNumber = String(index + 1).padStart(2, "0");
  return {
    id: definition.group,
    group: definition.group,
    index,
    label: `${chapterNumber} / ${definition.title.toUpperCase()}`,
    eyebrow: `${chapterNumber} / ${definition.title.toUpperCase()}`,
    title: definition.title,
    description: definition.description,
    start,
    end,
    interval: [start, end] as const,
    partIds: definition.parts,
    entryCamera: CAMERA_BOUNDARIES[index],
    focusCamera: definition.focus,
    exitCamera: CAMERA_BOUNDARIES[index + 1],
    palette: definition.palette,
    lighting: definition.palette === LIGHT ? LIGHT_LIGHTING : DARK_LIGHTING,
    textTransition: { enter: 0.12, exit: 0.9 },
    choreography: definition.choreography,
  };
});

export const chapters = CHAPTERS;

export function getChapter(group: AssemblyGroup): Chapter {
  const chapter = CHAPTERS.find((item) => item.group === group);
  if (!chapter) throw new Error(`Unknown assembly group: ${group}`);
  return chapter;
}
