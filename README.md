# Jaxo Coffee Machine — The Anatomy of Espresso

A React 19 / TypeScript experience with React Three Fiber, Three.js and GSAP ScrollTrigger. The displayed machine is converted locally from the supplied **espressu unit all parts.stp** design.

## Current model

- 23 original component groups containing 56 solid meshes; source proportions and assembled placements retained.
- Source millimetres and Z-up orientation converted to metres: X right/width, Y up, Z toward the operator, lowest modeled surface at Y=0.
- Approximately 251 mm wide × 399 mm high × 650 mm deep, including the side lever and portafilter.
- Six chapters: structure, drainage/cup support, headgroup/lever, display, enclosure/fasteners, and the complete unit.
- Rigid translation-only exploded presentation. No unverified hinge or locking motion, missing internals, or old procedural group geometry.
- Authored PBR finishes: the source CAD has no colors or materials.
- Local Meshopt-compressed GLB, streamed loading, responsive cameras, studio reflections/shadows, reduced motion, keyboard scrubbing, chapter jumps and replay.

The original STEP is not changed or shipped to the browser. Conversion does not use an external service. The previous Linea PB assets and legacy reconstruction modules are retained for reference but are not loaded by the active experience. Historical documents under `docs/` refer to that previous asset unless labeled custom-machine.

## Run

Use Node 24 LTS (available locally under `/Users/rwiiinzz/.nvm/versions/node/v24.18.0/bin`).

```sh
npm ci
npm run dev -- --host 127.0.0.1
```

Open the printed local URL, then scroll or choose a chapter. Conversion details and authored finishes are recorded in the asset index and integration document.

```sh
npm run typecheck
npm test
npm run assets:audit
npm run build
npm start
```

The existing React Router configuration supports local SSR and the Vercel static SPA build. No deployment was performed as part of the replacement.

## Local CAD pipeline

The source inspection and measured coordinates are in [the investigation report](/Users/rwiiinzz/Desktop/coffee-machine/docs/custom-machine-investigation/REPORT.md). That report records the earlier investigation-only stage; the application replacement is now implemented.

The existing preparation environment includes OCP/Open Cascade, NumPy and trimesh. To recreate it, use `scripts/cad-requirements.txt` in a Python virtual environment. Conversion and optimization are separate steps:

```sh
research/cad/.venv/bin/python scripts/convert-custom-machine.py --source '/Users/rwiiinzz/Downloads/espressu unit all parts.stp'
node scripts/optimize-custom-model.mjs
npm run assets:audit
```

The converter verifies the source SHA-256 against the inspection before tessellating, retains the 23 source product groups and 56 solid children, and excludes auxiliary sketches. The uncompressed reference is kept in ignored `research/cad/custom-espresso/`; only the optimized GLB and index go into `public/models/custom-espresso/`. Optimization verifies group hierarchy, child inventory and world placements after decoding.

Source component/solid identifiers, original labels, placement metadata, tessellation settings, authored finishes and mesh statistics are recorded in `public/models/custom-espresso/asset-index.json`. Do not run the legacy `cad-convert.py` or `optimize-model.mjs` for this model: they still describe the archived Linea PB asset.

## Runtime transform contract

`partsManifest.ts` maps source product IDs to custom chapters. Each animation wrapper ends at identity; the source component group beneath it retains its exact static bind transform and its solid children retain any quantization transforms. `prepareMachineAssembly.ts` clones the complete hierarchy and inserts these wrappers without replacing imported materials. No node is cloned out of its parent frame or corrected by subtracting only its translation.

`AssemblyTimeline.ts` evaluates immutable deltas for arbitrary, reverse and repeated seeks. `CameraRig.tsx` follows the custom chapter poses and fits the assembled envelope plus all components at their current poses, including incoming hidden parts around the reserved text area. `LightingRig.tsx` supplies a local studio environment without a remote HDR dependency.

## Validation

`npm test` covers custom source coverage, decoded GLB normals and dimensions, preservation of nested transforms/materials, rigid multi-solid groups and exact bind restoration after arbitrary/reverse seeks, as well as the generic timeline/camera engine. Legacy reconstruction tests remain regression checks for retained reference modules; those objects are not part of the custom scene.

`npm run assets:audit` decodes the active compressed GLB, checks every component and solid, and compares final world bounds with the inspected CAD. Export the active presentation inventory using:

```sh
node --import tsx scripts/export-part-inventory.ts
```

For browser QA, start the dev server and run `npm run test:browser`. The suite uses the locally installed Chrome and checks rendering/draw calls, five checkpoints, reverse seeks, only custom asset requests, chapter navigation, reduced motion and camera continuity at the portafilter entrance and final reveal. Software-browser timing is not a real-device performance guarantee.
