/** Scene units are meters. +X is right, +Y is up, +Z faces the operator. */
export type Vec3 = readonly [number, number, number];
/** Quaternion component order follows glTF / Three.js: x, y, z, w. */
export type QuaternionTuple = readonly [number, number, number, number];

export const ASSEMBLY_GROUPS = [
  "01_Frame",
  "02_Hydraulics",
  "03_Pump",
  "04_Boilers",
  "05_BrewGroups",
  "06_Steam",
  "07_Electronics",
  "08_ControlPanel",
  "09_Drain",
  "10_BodyPanels",
  "11_Accessories",
] as const;

export type AssemblyGroup = (typeof ASSEMBLY_GROUPS)[number];
export type AccuracyStatus =
  | "Verified CAD"
  | "Document-supported reconstruction"
  | "Visual approximation"
  | "Missing asset";

export interface PartSpec {
  id: string;
  name: string;
  group: AssemblyGroup;
  assetPath: string | null;
  nodeName: string | null;
  sourceUrl: string;
  sourcePage: number | null;
  manufacturerPartNumber: string | null;
  accuracyStatus: AccuracyStatus;
  /** Animated parent-frame target. Custom CAD wrappers end at identity over static source binds. */
  finalPosition: Vec3;
  finalQuaternion: QuaternionTuple;
  finalScale: Vec3;
  initialPosition: Vec3;
  initialQuaternion: QuaternionTuple;
  /** Shared rigid subassembly center: useful for independently addressable portafilter leaves. */
  assemblyPivot?: { initialCenter: Vec3; finalCenter: Vec3 };
  assemblyStart: number;
  assemblyEnd: number;
  dependencies: readonly string[];
  materialGroup: string;
  /** Optional evidence note; does not upgrade the geometry accuracy classification. */
  notes?: string;
}

export interface PartState {
  position: Vec3;
  quaternion: QuaternionTuple;
  scale: Vec3;
  assemblyProgress: number;
  visible: boolean;
}

export interface CameraPose {
  position: Vec3;
  target: Vec3;
  fov: number;
}

export interface EnvironmentPalette {
  background: string;
  foreground: string;
  accent: string;
}

export interface LightingState {
  ambient: number;
  key: number;
  rim: number;
  environment: number;
  keyColor: string;
  rimColor: string;
}

export interface Chapter {
  id: AssemblyGroup;
  group: AssemblyGroup;
  index: number;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  start: number;
  end: number;
  interval: readonly [number, number];
  partIds: readonly string[];
  entryCamera: CameraPose;
  focusCamera: CameraPose;
  exitCamera: CameraPose;
  palette: EnvironmentPalette;
  lighting: LightingState;
  textTransition: { enter: number; exit: number };
  choreography: string;
}

export interface ChapterState {
  chapter: Chapter;
  index: number;
  progress: number;
  textOpacity: number;
}

export interface SceneState {
  palette: EnvironmentPalette;
  lighting: LightingState;
}

export interface AssemblyValidationIssue {
  code:
    | "duplicate-id"
    | "invalid-progress"
    | "invalid-transform"
    | "unknown-dependency"
    | "dependency-order"
    | "dependency-cycle";
  partId: string;
  message: string;
}
