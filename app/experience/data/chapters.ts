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

function camera(position: Vec3, target: Vec3 = [0, 0.25, 0], fov = 32): CameraPose {
  return { position, target, fov };
}

// Every entry is the previous chapter's exit, so direct jumps and reverse playback share one path.
const CAMERA_BOUNDARIES: readonly CameraPose[] = [
  camera([1.16, 0.42, 1.34], [0, 0.08, 0]),
  camera([0.99, 0.53, 1.11], [0, 0.18, 0]),
  camera([0.87, 0.66, 0.97], [0, 0.25, 0]),
  camera([1.01, 0.43, 0.87], [0, 0.23, 0]),
  camera([-0.83, 0.67, 1.04], [0, 0.31, 0]),
  camera([0.13, 0.47, 1.24], [0, 0.28, 0.2]),
  camera([0.85, 0.66, 1.15], [0, 0.31, 0.12]),
  camera([-0.79, 1.12, 1.12], [0, 0.28, 0]),
  camera([0.13, 0.53, 1.35], [0, 0.32, 0.16]),
  camera([0.89, 0.56, 1.28], [0, 0.15, 0.18]),
  camera([-1.09, 0.72, 1.43], [0, 0.24, 0]),
  camera([1.12, 0.74, 1.6], [0, 0.25, 0]),
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
    group: "01_Frame", title: "Structural core",
    description: "The load-bearing structure establishes the coordinate frame for every system that follows.",
    parts: ["BaseFrame", "SupportBrackets", "Feet"],
    focus: camera([0.73, 0.21, 0.93], [0, 0.07, 0]), palette: DARK,
    choreography: "Base first; support brackets and feet follow their mounting structure.",
  },
  {
    group: "02_Hydraulics", title: "Water system",
    description: "Inlets, fittings and valves form the delivery network connecting the machine's major hydraulic systems.",
    parts: ["WaterInlet", "CopperPipes", "Fittings", "CheckValves", "SolenoidValves"],
    focus: camera([0.58, 0.48, 0.69], [0, 0.22, 0.02]), palette: DARK,
    choreography: "Separate fittings approach documented pipe connections; paths remain illustrative where unverified.",
  },
  {
    group: "03_Pump", title: "Pressure engine",
    description: "The rotary pump creates brewing pressure. Its mounting and placement depend on the installation configuration.",
    parts: ["PumpMotor", "PumpHead", "PumpBracket"],
    focus: camera([0.73, 0.38, 0.64], [0.13, 0.15, 0]), palette: LIGHT,
    choreography: "Mounting bracket precedes motor and pump head; no unsupported shaft animation.",
  },
  {
    group: "04_Boilers", title: "Thermal heart",
    description: "Separate steam and coffee boilers give the Linea PB independent thermal systems for milk and extraction.",
    parts: ["SteamBoiler", "BrewBoiler", "HeatingElements", "Probes", "SafetyValves"],
    focus: camera([0.71, 0.48, -0.93], [0, 0.31, -0.04]), palette: DARK,
    choreography: "Boiler bodies settle before heating elements, probes and safety-valve details.",
  },
  {
    group: "05_BrewGroups", title: "Extraction core",
    description: "Two brew groups bring the coffee boiler's stable water supply to the gasket and shower-screen interfaces.",
    parts: ["GroupHeadLeft", "GroupHeadRight", "ShowerScreenLeft", "ShowerScreenRight", "GasketLeft", "GasketRight"],
    focus: camera([-0.2, 0.32, 0.82], [-0.12, 0.28, 0.21]), palette: LIGHT,
    choreography: "Left and right housings arrive with a slight stagger; gaskets precede shower screens.",
  },
  {
    group: "06_Steam", title: "Steam control",
    description: "Steam valves and articulated wands connect the thermal system to milk preparation, with a separate hot-water outlet.",
    parts: ["SteamValveLeft", "SteamValveRight", "SteamWandLeft", "SteamWandRight", "HotWaterSpout"],
    focus: camera([0.61, 0.48, 0.87], [0.25, 0.3, 0.16]), palette: LIGHT,
    choreography: "Valves locate first; rigid wands rotate and translate toward their joints without deformation.",
  },
  {
    group: "07_Electronics", title: "Control intelligence",
    description: "Boards, sensors and connectors coordinate the automatic machine. Unverified wiring is identified as illustrative.",
    parts: ["MainPCB", "WiringHarness", "Relays", "Connectors", "Sensors"],
    focus: camera([-0.52, 0.97, 0.7], [0, 0.32, -0.02]), palette: DARK,
    choreography: "Board mounting precedes connectors and harness; camera stays outside solid surfaces.",
  },
  {
    group: "08_ControlPanel", title: "Human interface",
    description: "The central display, gauge and paired AV group controls make the machine's internal precision accessible to the barista.",
    parts: ["FrontFascia", "ButtonsLeft", "ButtonsRight", "Display", "Gauge", "KnobLeft", "KnobRight"],
    focus: camera([0.15, 0.48, 0.91], [0, 0.37, 0.23]), palette: LIGHT,
    choreography: "Fascia carries its visible controls; final screen and gauge design must follow the source references.",
  },
  {
    group: "09_Drain", title: "Drainage",
    description: "A basin and removable grilles collect discharge below the groups and route it toward the installation drain.",
    parts: ["DripTrayBasin", "Grilles", "DrainPipe"],
    focus: camera([0.39, 0.21, 0.89], [0, 0.1, 0.22]), palette: NEUTRAL,
    choreography: "Drain connection precedes basin and grille; no unsupported internal fluid-flow simulation.",
  },
  {
    group: "10_BodyPanels", title: "Exterior shell",
    description: "Black and white body panels enclose the assembled systems; the stainless cup tray and rails complete the silhouette.",
    parts: ["LeftPanel", "RightPanel", "RearPanel", "TopTray", "GuardRails"],
    focus: camera([0.97, 0.72, -1.2], [0, 0.26, 0]), palette: LIGHT,
    choreography: "Side and rear panels approach independently; cup tray precedes guard rails; all final panels are opaque.",
  },
  {
    group: "11_Accessories", title: "Final assembly",
    description: "Two portafilters align with their groups before the final wide reveal of the Linea PB AV 2 Group.",
    parts: ["PortafilterLeft", "PortafilterRight"],
    focus: camera([0.15, 0.3, 1.12], [0, 0.2, 0.22]), palette: LIGHT,
    choreography: "Portafilters enter after their groups; a restrained locking rotation leads into the product reveal.",
  },
];

const CHAPTER_BOUNDARIES = [0.05, 0.13, 0.23, 0.3, 0.41, 0.51, 0.61, 0.7, 0.79, 0.85, 0.94, 1] as const;

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
    partIds: definition.parts.map((name) => `${definition.group}.${name}`),
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
