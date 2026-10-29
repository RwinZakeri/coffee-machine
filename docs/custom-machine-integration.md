# Custom espresso machine integration

The active experience now uses the supplied custom espresso unit. The earlier [investigation report](/Users/rwiiinzz/Desktop/coffee-machine/docs/custom-machine-investigation/REPORT.md) records the pre-integration inspection; its investigation-only status describes that historical stage.

## Source and conversion

- Source: `/Users/rwiiinzz/Downloads/espressu unit all parts.stp`.
- Source SHA-256: `8d2b18ced88ab1bbde9708f2c3ba61bb57dc1d619345c6f6c6243c960503f663`.
- Runtime asset: [machine.glb](/Users/rwiiinzz/Desktop/coffee-machine/public/models/custom-espresso/machine.glb), with [asset index](/Users/rwiiinzz/Desktop/coffee-machine/public/models/custom-espresso/asset-index.json).
- Preserved **23 named source component groups and 56 uniquely identified source-solid mesh children**. Auxiliary sketches are excluded; no replacement geometry was invented.
- Runtime mesh: **202,481 triangles**, **1,505,560 bytes** after Meshopt compression. The uncompressed reference remains under the ignored `research/cad/custom-espresso/` directory.
- Runtime asset SHA-256: `5dbf6828214309fe9364a79fffa2408ee89f6346e8159f40f15abb58bc736d1a`.

Conversion is entirely local: STEP → Open Cascade/XCAF → solid-level tessellation → hierarchical reference GLB → glTF Transform/Meshopt. Reproduce from the project root:

```sh
research/cad/.venv/bin/python scripts/convert-custom-machine.py
node scripts/optimize-custom-model.mjs
```

The converter checks the inspected source hash before using its product/solid mapping. Tessellation starts at 0.20 mm absolute linear deflection and 0.25 rad angular deflection. Two thin cover faces, approximately 3.116786 and 0.713384 mm², needed a finer local retry at 0.01 mm with an explicit minimum size. Both were recovered without omitting nonzero-area geometry or altering the source B-rep.

The source has no colors or materials. Graphite enamel, steel, polished metal, polymer handles, smoked glass and display-housing finishes are authored visualization choices. They are not recovered CAD material specifications.

## Coordinates and assembly contract

Source millimetres use Z as up, +X toward the operator and Y across the width. Runtime metres use X right/width, Y up and Z front:

```text
p_runtime = ([source_y, source_z, source_x]
             - [13.61664569413712, -2.153657762695405, 111.48336485370967]) * 0.001
```

This proper rotation does not mirror the design. The complete source envelope is approximately **251.34 × 399.40 × 650.09 mm** in width, height and depth, including the lever and portafilter. Its lowest modeled cover surface defines Y=0. Decoded mesh extrema differ by only tessellation/quantization tolerances.

The lever's auxiliary sketch extended approximately 4.02 mm outside its actual solids. Component render bounds and group centers are therefore derived from solid geometry only; complete original product bounds remain separately recorded in the index. Three.js decoding verified all 56 meshes and normals. Maximum component B-rep versus decoded-mesh bounds difference was approximately **0.094 mm**; compression alone contributed at most approximately **0.011 mm**.

Each component retains its exact static bind placement and child geometry/dequantization transforms. An animation wrapper starts with identity and supplies a presentation delta in the documented parent frame. Final wrapper deltas are identity, so the timeline never applies the source placement twice. Multi-solid products remain coherent rigid groups. The old procedural brew-group geometry, model-specific offsets, portafilter pivots and part-name rules are excluded from the custom experience. Exploded motion is presentation choreography, not a certified manufacturing sequence or operating-machine simulation.

The original STEP is unchanged. The old Linea PB GLB/index remain available under `public/models/linea-pb/` for comparison or rollback; they are not the active model.

## Validation

Verified at integration time:

- 21 unit tests passed, including a regression for hidden incoming component bounds.
- Type checking passed.
- Active-asset audit passed, including component/solid counts, full assembled placements, triangle totals and decoded geometry bounds.
- Production build passed.

Browser rendering and reverse-seek checks passed at 1920×1080, 1440×900, 768×1024, 390×844 and 360×740 during integration. Navigation and reduced-motion checks also passed on laptop/mobile. After the transition correction, the five-checkpoint rendering/layout test passed again at 360×740, and the camera continuity regression passed at 1440×900, 768×1024 and 360×740. The current UI retains the concurrent Jaxo branding and removal of the sources button.

### 88–89% transition correction

The portafilter becomes visible at 88.6%. Fitting only visible meshes added its displaced geometry to the camera bounds in one frame, causing a sudden zoom-out. Camera fitting now includes every component at its continuous current pose, including hidden incoming parts. The final placement and source geometry are unchanged.

Portrait chapter copy has a stable reserved height. The final section stays mounted but hidden, aria-hidden and inert until the reveal, allowing its layout to be measured beforehand. The camera smoothly blends toward that final text reserve over 94–99%, and layout observers invalidate the demand-rendered canvas after DOM changes. Decorative text-entry transforms do not affect the measured reserve.

The browser regression samples both sides of 88%, 88.6% and 99.5%, checks projected frame movement below 1.5 pixels at each threshold, and repeats the samples in reverse/random order. It also verifies 88→89% movement stays below 12 pixels. Forward/reverse behavior was checked in the existing in-app preview.

Evidence screenshots: [88%](/Users/rwiiinzz/Desktop/coffee-machine/artifacts/qa/laptop-1440/transition-088.png), [89%](/Users/rwiiinzz/Desktop/coffee-machine/artifacts/qa/laptop-1440/transition-089.png), [narrow mobile final layout](/Users/rwiiinzz/Desktop/coffee-machine/artifacts/qa/mobile-360/100.png). Software-rendered browser timings are not real-device performance guarantees.
