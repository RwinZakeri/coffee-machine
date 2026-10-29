import type { Vec3 } from "../types";

export const MACHINE = {
  id: "custom-espresso",
  name: "Jaxo Coffee Machine",
  indexUrl: "/models/custom-espresso/asset-index.json",
  sourceName: "espressu unit all parts.stp",
  componentCount: 23,
  solidCount: 56,
  bounds: {
    min: [-0.12566929312418303, 0, -0.32504616066529035] as Vec3,
    max: [0.12566929312418303, 0.3994011958865686, 0.32504616066529035] as Vec3,
  },
} as const;
