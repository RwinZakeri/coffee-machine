# Linea PB AV 2 Group — source geometry audit

Audit date: 11 October 2026. This audit distinguishes actual source geometry from the requested educational chapter structure.

## Official archives inspected

| Resource | Actual content | Applicability |
| --- | --- | --- |
| [linea_pb_2d_3d_CAD.zip](https://au.lamarzocco.com/wp-content/uploads/2023/09/linea_pb_2d_3d_CAD.zip) | Six configuration directories: AV and MP, each in 2/3/4 group versions. Each supplies STEP, IGES, DWG and a one-page PDF drawing. | Only `LINEA_PB-AV_2GR` is used for this implementation. |
| [LINEA-PB-AV.zip](https://au.lamarzocco.com/wp-content/uploads/2023/09/LINEA-PB-AV.zip) | Nine AutoCAD 2013–2017 DWG files, approximately 25–36 KB each: `2AVE`, `2AVP`, `2AVS`, and equivalent 3/4 group files. No STEP, IGES, GLB or textures. | Architectural drawing references; no independently controllable internal 3D components have been established from this archive. |

Downloaded sources remain under `research/cad/`; raw source archives are excluded from browser assets. The full archive is 236,900,983 bytes. The target files are:

| Target source | Uncompressed size | Evidence |
| --- | --- | --- |
| `LINEA-PB-AV_2GR.STEP` | 61,215,647 bytes | Real AP203 BREP assembly exported with SolidWorks 2014 / SwSTEP 2.0, on 28 October 2014. |
| `LINEA-PB-AV_2GR.IGS` | 102,821,686 bytes | Alternative IGES geometry; STEP is preferred because it retains assembly definitions. |
| `LINEA-PB-AV_2GR.DWG` | 2,204,516 bytes | AutoCAD resource; not the chosen runtime conversion source. |
| `LINEA-PB-AV_2GR.PDF` | 495,679 bytes | Official dimension and configuration drawing, one page. |

`research/cad/archive-inventory.json` records every relevant ZIP entry. `scripts/cad-fetch.py` writes per-archive inventories and `research/cad/source-checksums.json`, and verifies the CRC and SHA256 of all four 2GR AV target entries. `research/cad/verified-2av/step-text-inventory.json` records the STEP product and solid definitions.

## What the STEP actually preserves

Text inspection finds **108 PRODUCT definitions and 91 MANIFOLD_SOLID_BREP definitions**. It uses metric SI length units with a millimetre prefix. There are reference transformations and nested assembly definitions, so this is not one flattened exterior mesh. Product names include:

- Body sheet-metal parts (`C.1.*`), rear cover, front/rear plates, brackets and fasteners.
- Steam / hot-water family identifiers (`L160*`, `L120*`, `L122*`).
- AV controls (`Assieme_3tasti_approvati`, `tasto`, `NLE*`), connectors, display label, gauge bracket and switch components.
- Portafilter-related identifiers (`L111*`, `L112*`, `L113*`) and named silicone gaskets.

A named PRODUCT is **not** automatically a verified current manufacturer spare-part number. Names retain the 2014 CAD source identity until cross-checked with the official parts catalog. Component occurrences may repeat a definition; the final geometry inventory records occurrences, not just unique PRODUCT names.

A product name alone does not establish the presence of the requested steam boiler, coffee boiler, pump, full hydraulic network or wiring harness. Their availability is determined from the tessellated assembly and its spatial bounds; unavailable internals must be reconstructed from explicit evidence and identified as reconstruction.

## Configuration and dimensions

The supplied one-page drawing gives **710 mm width × 590 mm depth × 533 mm height**, description `LINEA PB 2GR.`, and configuration `NL_2AV`. The STEP root is named `LINEA-PB_2GR`.

There is a drafting conflict: the same PDF's front/back/side orthographics show the two-group arrangement, while its top and isometric views show three controls/portafilters. Its title also mentions source file `LINEA-PB_4GR`. These mixed views are recorded as a source uncertainty. The runtime assembly must use the actual `AV_2GR` STEP geometry and count its group occurrences, rather than treating the conflicting isometric illustration as authoritative.

## Conversion and verification

The headless pipeline uses OpenCascade XCAF to read component names, references, instances and original location transforms. `scripts/cad-inspect.py` writes the occurrence-level inventory. `scripts/cad-convert.py` tessellates independent occurrences and exports the local-preview GLB plus machine-readable asset index. It uses a persistent OpenCascade BREP cache to make subsequent exports fast. Angle-weighted vertex normals preserve the source CAD face seams. The runtime coordinate conversion and measured bounds are documented below.

## Usage and redistribution

The official drawing expressly states that its information is proprietary to La Marzocco Srl and that possession does not grant use or distribution rights without written permission. Public download availability is not a redistribution license. The converted assets here are for the user-requested local development preview. **Do not deploy or redistribute the manufacturer geometry without confirming written permission, a suitable license, or replacement independently licensed geometry.** Custom black-and-white runtime material styling does not alter this provenance.

## Accuracy classifications

- **Verified CAD:** unmodified source geometry and original instance transforms, with unit/axis conversion only.
- **Document-supported reconstruction:** missing physical components reconstructed using cited catalog diagrams and dimensions; individual uncertainty is stated.
- **Visual approximation:** development visuals whose geometry or placement is inferred; never accepted as exact OEM reconstruction.
- **Missing asset:** required component not present or not sufficiently evidenced to reconstruct credibly.

The actual per-occurrence GLB inventory is the basis for final availability claims. Educational chapters are not evidence that a component exists in the CAD.


## Completed occurrence audit and runtime output

OpenCascade XCAF transfer yields **144 leaf component occurrences, 33 assembly occurrences, 156 solids and 19,129 faces**. The 144 occurrences reference the 108 product definitions; the counts describe different things. Two exact coincident duplicate central AV button instances are removed during export to prevent overlapping surfaces. The resulting GLB contains **142 independent named nodes**.

| Requested chapter | What genuinely exists in this CAD | What remains absent |
| --- | --- | --- |
| Structural frame | Two `C.3.007` leg/support assemblies, four `F.2.026` foot pads, four corner members and four leg bolts. | Complete internal chassis and boiler mounting structure. Exterior side covers and drip-cover brackets belong to their own chapters. |
| Hydraulics | Genuine nine-piece sight-glass assembly, including glass, seals, bezel, drain fitting and copper washer. | Main inlet, complete copper network, check valves, solenoids and sight-glass feed tubes. |
| Pump | None identified. | Separate pump head, motor and bracket. |
| Boilers | None identified. | Steam boiler, coffee boiler, heating elements, probes and safety valves. |
| Brew groups | No saturated group geometry. The two portafilter assemblies establish axes at source X ±120 mm. | Actual saturated group bodies, lower chromed group rings, shower screens and group gaskets. `L113` is a filter-retaining spring; a separate portafilter basket is not established. Twelve catalog-supported lower-stack objects are reconstructed separately. |
| Steam and hot water | Two steam knob/wand/tip/junction assemblies; hot-water aerator adaptor, cover, filter, nut, junction and seals. | Complete boiler-to-valve plumbing and internal valve mechanisms. |
| Electronics | Independent AV control covers, plates, connectors and control module housing components. | Complete controller PCB, power supply, harness and documented cable routing. |
| Control panel | Genuine 2-group fascia, two three-button control arrays, display/module, gauge and bracket, switch and steam knobs. | Display/gauge face artwork is not provided as a texture. |
| Drain | Genuine tray body, perforated grilles, supports and sheet-metal pieces. | Full drain hose and undertray fittings are not established. |
| Body | Genuine white/black configurable casing geometry, cup rail, rear and side pieces. | CAD material/texture authenticity; material styling is assigned at runtime. |
| Final assembly | Genuine two portafilter subassemblies and complete CAD exterior. | Absent internals and group bodies require separately evidenced reconstruction. |

The named source occurrence hierarchy is copied into every `asset-index.json` part as both `sourceHierarchy` and `sourcePath`, so AV control rear covers cannot be mistaken for exterior rear panels. OEM identifiers remain source names until catalog cross-checking verifies them.

### Coordinates and exact final placements

The original assembly is already oriented with **X = width, Y = up, Z = front**, with front portafilter handles at positive Z. No rotation or arbitrary scale correction is applied. STEP millimetres are converted to runtime metres and shifted as follows:

```text
runtime position = source position / 1000 - sourceRecenterOffsetMetres
sourceRecenterOffsetMetres = [-5.828670879282072e-16, -0.2103309248526369, -0.06466092850376418]
```

The actual tessellated overall bounds are:

```text
min = [-0.35500000000000054, 0.0, -0.3211390714962349]
max = [ 0.35500000000000054, 0.5373224229560739, 0.3211390714962349]
```

Thus the width is exactly **710 mm**. The complete mesh height is **537.3 mm** and depth **642.3 mm**, compared with the nominal drawing's 533 mm and 590 mm. The geometry includes projecting portafilter handles and source foot positions. This discrepancy is preserved and disclosed, rather than forcing an undocumented scale correction. OpenCascade's initial analytic bounding boxes are more conservative than tessellated mesh bounds; animation uses the mesh bounds.

Each runtime mesh is centered in its own local coordinates. Its node translation in the GLB and `position` in the asset index are the exact final assembled center. Final quaternion is identity `[0,0,0,1]`, and scale is `[1,1,1]` because original assembly rotations have been baked into local vertex orientation. Returning every node to this final translation exactly reconstructs the source assembly.

### Current asset size and verification

- Initial uncompressed GLB: **26,100,108 bytes**, 813,334 triangles and 142 meshes.
- Current `public/models/linea-pb/machine.glb`: **6,043,044 bytes** after the app pipeline applies Meshopt compression; 142 nodes remain independently controllable.
- `public/models/linea-pb/asset-index.json`: occurrence-level provenance, bounds, positions, hierarchy and material categories.
- Tessellation: 0.6 mm linear deflection, 0.35 radians angular deflection.
- Cached export: 13.6 seconds on this development machine.
- `python3 scripts/cad-validate.py`: validates the uncompressed conversion before optimization. `npm run assets:audit` decodes the compressed runtime and validates all 142 independent mesh bounds and transforms; maximum decoded bound error is 0.020574 mm.
- `research/cad/verified-2av/mesh-preview.png`: software-rendered geometry QA preview; the actual application still uses Three.js WebGL.

The 25 MB original export is reduced to 5.8 MB with Meshopt compression. Production/mobile readiness still requires profiling and appropriate component LOD while preserving node identity. The asset index records current measurements; frame-rate targets must not be claimed without runtime testing.

### Reproducible local conversion

```sh
python3 scripts/cad-fetch.py
python3 -m venv research/cad/.venv
research/cad/.venv/bin/python -m pip install --no-deps -r scripts/cad-requirements.txt
research/cad/.venv/bin/python scripts/cad-inspect.py
research/cad/.venv/bin/python scripts/cad-convert.py
python3 scripts/cad-validate.py
```

Read the usage restriction above before copying the output into a publicly hosted application. The download and derivative conversion do not establish a public redistribution right.
