# coffee-machine

## Linea PB — The Anatomy of Espresso

A local React / TypeScript / Vite experience using React Three Fiber, Three.js, GSAP and ScrollTrigger. Native scroll controls an independently assembled La Marzocco Linea PB AV 2 Group, with eleven educational chapters and a custom black-and-white exterior.

## What is implemented

- 142 independent nodes converted from the official 2014 `AV_2GR` STEP assembly.
- 12 separately controlled lower brew-group objects reconstructed from the parts catalogs. Their inferred profiles and placements are explicitly disclosed.
- Source-based structural outline, nine-piece sight glass, AV controls, steam wands, eight-piece hot-water outlet, trays, shell and portafilters.
- 171 validated CAD dependency links stage seals, retained filters, controls, tray components and rail fasteners. The two six-part portafilters use shared rigid pivots for a restrained 12° educational locking approach.
- A paused, deterministic GSAP assembly timeline, native ScrollTrigger progress, independent camera choreography, studio PBR materials and continuous dark/light palettes.
- Responsive desktop, portrait tablet and mobile composition, adaptive DPR, demand rendering, actual byte loading progress, errors, chapter jumps, replay, internals navigation and an accessible sources dialog.
- Reduced-motion mode presents completed chapter states with a static camera for each chapter.

**This is a working source-grounded partial reconstruction, not a complete service-level machine assembly.** Boilers, external pump, full hydraulic network, main PCB/wiring and saturated group necks/caps are missing. See [ASSET_GAPS.md](ASSET_GAPS.md). All eleven chapters are navigable; chapters without geometry explain the asset gap instead of inventing parts.

## Run locally

Use Node **22.22+ or 24 LTS**. This workspace also has Node 24.18.0 at `/Users/rwiiinzz/.nvm/versions/node/v24.18.0/bin/node`.

```sh
npm ci
npm run dev -- --host 127.0.0.1
```

Open the printed local URL. Scroll, use the chapter dots, or adjust the bottom assembly scrubber. The sources dialog links the original manufacturer resources. Native scrolling is retained.

```sh
npm run typecheck
npm test
npm run assets:audit
npm run build
npm start
```

`npm start` serves the React Router production build. Set `PORT=4173` for a separate QA server. The retained React Router framework supplies Vite; it has no server-side data requirements.

## Deploy to Vercel

Import `RwinZakeri/coffee-machine` into Vercel and deploy `main`. The checked-in `vercel.json` builds the static SPA with `VERCEL=1 npm run build`, serves `build/client`, and provides the route fallback. No runtime environment variables are required.

## Geometry pipeline

The complete audit is in [docs/asset-audit.md](docs/asset-audit.md). `research/` holds downloaded references and conversion caches; it is excluded from browser assets and Docker context. The runtime GLB is approximately 6.0 MB, reduced from 26.1 MB using Meshopt, with 142 independently named nodes preserved.

```sh
python3 scripts/cad-fetch.py
python3 -m venv research/cad/.venv
research/cad/.venv/bin/pip install -r scripts/cad-requirements.txt
research/cad/.venv/bin/python scripts/cad-inspect.py
research/cad/.venv/bin/python scripts/cad-convert.py
node scripts/optimize-model.mjs
npm run assets:audit
```

The scripts may require source/output flags; run each with `--help`. Delete or replace `research/cad/verified-2av/machine-uncompressed.glb` after changing the source conversion: the optimizer deliberately retains that uncompressed input for repeatable processing. Tessellation uses 0.6 mm linear and 0.35 rad angular deflection. Meshopt uses 16-bit geometry quantization; measured maximum node-bound error is about 0.021 mm. Original assembled instance translations remain manifest targets. The runtime preserves the static dequantization transform inside each animated wrapper.

Coordinates: metres; +X width, +Y up, +Z toward the operator; foot plane Y=0. The CAD's actual envelope is 710 × 642 × 537 mm including handles/protrusions, while the product drawing nominal envelope is 710 × 590 × 533 mm. The source model is not distorted to force a match. The dimension conflict is documented.

## Add or replace a component

1. Prepare independently named GLB nodes. Preserve their final assembled transforms and use metre units.
2. Add each node to `public/models/linea-pb/asset-index.json`: `nodeName`, `sourceName`, `sourcePath`, `position`, `quaternion`, `bounds` and evidence/material information.
3. Update `classifyNode` / `materialForNode` in `app/experience/data/partsManifest.ts` if the assembly family is new. This function produces strongly typed `PartSpec` entries.
4. Add authoritative provenance and accuracy status. Do not infer an OEM part number from a CAD label without catalog confirmation.
5. For reconstructed geometry, edit `reconstructedParts.ts` and `BrewGroupGeometry.ts`. Exact nominal dimensions and inferred surfaces have separate classifications.
6. Add dependencies only where the mounting relationship is known. The validator rejects unknown dependencies, cycles and installation before the dependency completes.

CAD approach paths are educational exploded motions, not a certified factory installation sequence. Source hierarchy and placement remain untouched. Small items stay independent within their chapter.

## Adjust timing and camera

`app/experience/data/chapters.ts` defines opening 0–5%, chapter intervals, camera entry/focus/exit, palette and lighting. `partsManifest.ts` staggers each chapter's CAD nodes; `reconstructedParts.ts` defines dependent group-stack timings. Changing scroll distance is a CSS change to `.journey`; it does not change normalized assembly state.

`assemblyMath.ts` calculates immutable position/quaternion/scale states and separate spherical camera interpolation. `CameraRig.tsx` places the subject in a responsive safe area and gently widens overview shots for unavailable internal chapters. `LightingRig.tsx` creates a local studio environment with no remote HDR fetch.

## Verification

The 18 checks in `npm test` cover initial/final targets for all 154 available objects, repeatable arbitrary/reverse seeks, rigid portafilter insertion, quaternion interpolation, dependency order, audited component classification, camera continuity/clearance and catalog-based reconstruction dimensions. `npm run assets:audit` decodes the compressed runtime GLB and compares all 142 node bounds with the original tessellation index. [The part inventory](docs/parts-inventory.csv) records each object's evidence, accuracy, final/exploded transforms, timing and dependencies; regenerate it with `node --import tsx scripts/export-part-inventory.ts` after changing a manifest.

Start a dev or production server, then:

```sh
QA_BASE_URL=http://127.0.0.1:4173 npm run test:browser
```

The browser suite uses the locally installed Google Chrome. On another platform, change `executablePath` in `playwright.config.ts`. Screenshots at 0/25/50/75/100% cover 1920×1080, 1440×900, 768×1024, 390×844 and 360×740. It also checks loading, WebGL context, reverse seeks, no repeated GLB fetch, source-dialog keyboard/focus behavior, chapter controls and reduced motion. Results and measured limitations are in [docs/qa.md](docs/qa.md).

## Provenance and limitations

Research: [sources](docs/sources.md), [mechanical architecture](docs/mechanical-architecture.md), [assembly map](docs/assembly-map.md), [assumptions](docs/assumptions.md).

The manufacturer drawing expressly reserves use/distribution without written permission. Public availability is not an asset license. The source and converted geometry are included for the requested **local development study**; this project has not been deployed. Obtain written authorization or replace the proprietary geometry before redistribution. Third-party runtime library licenses remain their respective package licenses. Catalog-based original reconstructions have dimensional and placement limits described per part.

Software-browser rendering checks are not real-device FPS guarantees or certification of internal mechanical clearances. Exact factory geometry, serial-specific variants, service routing and production licensing remain required for the full brief's final engineering acceptance.
