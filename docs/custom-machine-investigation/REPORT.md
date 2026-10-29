# Custom espresso unit: CAD and application investigation

**Inspection date:** 29 October 2026. **Status:** investigation complete; conversion and integration have not been implemented.

The supplied model supports a component-preserving conversion. It contains **one assembly, 23 named component occurrences, 56 solids and 4,097 faces**. Preserve the 23 source components as the initial animation units, with optional solid children. The model is substantially different from the existing two-group Linea PB: its measured envelope is **251.34 mm wide × 399.40 mm high × 650.09 mm deep**, including the side lever and projecting portafilter. Existing timeline and rendering infrastructure can be reused, but the old classifications, geometry, assembly offsets, pivots and chapter content cannot.

This report implements the attached prompt's investigation scope. Application code, the existing GLB/index and the original STEP were left unchanged. The CAD was processed locally with the repository's existing Open Cascade environment; it was not uploaded to a conversion service. The accompanying image samples actual B-rep edges for inspection. It is not an exported runtime model.

**Evidence:** [machine-readable inspection](/Users/rwiiinzz/Desktop/coffee-machine/docs/custom-machine-investigation/inspection.json), [23-component inventory](/Users/rwiiinzz/Desktop/coffee-machine/docs/custom-machine-investigation/parts-inventory.csv), [CAD inspection image](/Users/rwiiinzz/Desktop/coffee-machine/docs/custom-machine-investigation/cad-inspection.png).

## A. CAD inspection results

### Source and method

| Item | Verified result |
| --- | --- |
| Original | `/Users/rwiiinzz/Downloads/espressu unit all parts.stp` |
| Size | 43,118,861 bytes, approximately 41.12 MiB |
| SHA-256 | `8d2b18ced88ab1bbde9708f2c3ba61bb57dc1d619345c6f6c6243c960503f663` |
| Exporter | CATIA V5 Release 21 GA; STEP AP203, `CONFIG_CONTROL_DESIGN` |
| File timestamp | `2026-10-27T09:34:50+00:00` |
| Structural inspection | Parsed all 476,159 STEP entity records, including products, shape references, placements, units and auxiliary representations |
| Geometry inspection | OCP `8.0.1.1` in `research/cad/.venv`; `STEPCAFControl_Reader` transferred the file successfully to XCAF |
| Geometry checks | Imported counts match the source: 56 solids and 4,097 faces; every solid-bearing imported component shape passed `BRepCheck_Analyzer(shape, True)` |
| Bounds method | `BRepBndLib.AddOptimal`, with triangulation and shape-tolerance enlargement disabled; measured the transformed B-rep, not spline control-point bounds |
| Visual check | Front, side and oblique projections sampled from 10,432 B-rep edges; no runtime mesh or GLB generated |

Passing the kernel check establishes consistency of the imported shapes under the kernel's checks. It does not establish manufacturing readiness, clearances, collision-free installation, pressure integrity or correct mechanisms.

### Assembly, components and names

The STEP has **24 PRODUCT definitions**: the root `espressu unit all parts` and 23 distinct child products. There are 23 direct assembly usages, with no nested source subassembly usages and no repeated child-product references. It is an assembly of solid-bearing components, not a single solid or a collection of unrelated surface entities.

| Source component name, spelling retained | Solids | Faces |
| --- | ---: | ---: |
| steel Chassis espresso | 1 | 401 |
| espresso chekvalve base | 1 | 32 |
| espresso wiring base | 1 | 20 |
| espresso input valve base | 1 | 28 |
| espresso hydrodamper base | 1 | 20 |
| espresso boiler base | 2 | 28 |
| espresso drain Mesh | 1 | 391 |
| espresso drain | 1 | 11 |
| espresso group drain | 1 | 13 |
| espresso short cup mesh | 1 | 138 |
| espresso short cup mesh left holder | 1 | 17 |
| espresso short cup mesh right holder | 1 | 17 |
| espresso short cup mesh base | 1 | 26 |
| espresso solenoid cover | 1 | 52 |
| espresso headgroup | 1 | 1,870 |
| espresso lever full parts | 4 | 62 |
| espresso portafilter | 3 | 136 |
| espresso unit cover | 1 | 344 |
| espresso display glass *(source has a trailing space)* | 1 | 22 |
| espresso display base | 1 | 39 |
| espresso right sheet pannel | 4 | 140 |
| Symmetry of espresso screw | 13 | 145 |
| Symmetry of Symmetry of espresso screw | 13 | 145 |
| **Total** | **56** | **4,097** |

The file also contains three curve-only auxiliary representations, associated with the drain mesh, headgroup and lever. Open Cascade imports those products as additional grouping labels: its tree has four assembly-like labels including the root, and 26 terminal labels, of which three contain only auxiliary curves. These are importer-created groups, **not three additional source mechanical subassemblies**. Exclude curve-only geometry from the render asset while retaining the 23 original component groups.

Names require an explicit mapping. The headgroup's two PRODUCT text fields are `espresso headgroup` and `620424`; this importer labels it `620424`. Its internal solid is called `Thread7`. Other internal solid names are often `PartBody` or numbered variants. A portafilter solid name mentions `Breville Naked Porta Filter`. Preserve these as source metadata; they do not by themselves establish manufacturer identity, compatibility or ownership. Use unique application IDs rather than display names as keys. STEP entity IDs identify this particular export; use a maintained mapping for identity across future CAD revisions.

All 23 referenced `.CATPart` filenames are metadata accompanying embedded B-rep representations. The file is not waiting for external CATPart geometry to render.

### What the model supports

Verified separate geometry includes the chassis, enclosure, panel bodies, display glass/base, headgroup, lever, portafilter, drainage/cup-support pieces, mounting bases and screw groups. The two screw products account for 26 of the 56 solids. The lever's four solids and portafilter's three solids are contained inside their respective products without a nested source assembly tree.

A product called **boiler base** is not a boiler: its imported geometry is two approximately 2 mm-thick support bodies. Likewise, wiring, input-valve, check-valve and hydrodamper bases do not prove that the corresponding functional internals are supplied. No separately identified boiler vessel, pump, complete pipe network, valves, buttons or wiring harness was established by this inventory. Holes or circular details on a cover do not establish separate movable buttons. Do not fill those gaps with the old machine's geometry.

There are no source joint axes, joint limits, motion constraints or assembly sequence entities. Component separation permits presentation-level exploded views; it does not prove independent physical motion for every solid.

### Placements, dimensions and orientation

All 23 assembly placements are available. Seventeen are identity transforms; six are nonidentity:

| Component | Assembly placement in source millimetres |
| --- | --- |
| input valve base | Translation `(4.661748, 0, 3.185597)` |
| boiler base | Translation `(7.975935, 0, 4.244105)` |
| drain Mesh | Translation `(0, 0, -10.175479)` |
| headgroup | Origin `(152.557224, 0, 192.147786)`; local X along source +Y, local Z along source +X |
| lever | Origin `(92.711831, 85.280471, 84.846343)`; rotated local axes, recorded in the inventory |
| portafilter | Translation `(328.799938, 0, 198.847228)` |

Many product origins coincide with the global origin even though their bodies are elsewhere. These origins are unsuitable as automatic animation pivots. The inventory retains source placement axes and complete accumulated kernel matrices.

Length units are explicitly **millimetres**; angular units are radians. The source declares 0.005 mm uncertainty in its 24 geometric contexts. That declaration is not a measured tessellation error or a quality guarantee.

The precise assembled source envelope, rounded to six decimals, is:

```text
Source minimum XYZ (mm): [-213.562796, -112.052647,  -2.153658]
Source maximum XYZ (mm): [ 436.529526,  139.285939, 397.247538]
Source extent XYZ  (mm): [ 650.092321,  251.338586, 399.401196]
```

**Geometrically supported orientation:** source **Z is up**, source **X spans depth with +X toward the operator**, and source **Y spans width**. This interpretation follows the horizontal drain/cup surfaces, vertical chassis/cover, and the headgroup/portafilter position, and was checked in the edge projections. STEP placement axes provide coordinate frames but do not explicitly label a semantic “front.”

Use this proper rotation, unit conversion and grounding for target X=width/right, Y=up, Z=front:

```text
R = [[0, 1, 0],
     [0, 0, 1],
     [1, 0, 0]]           determinant = +1; no mirroring

offset_mm = [13.61664569413712, -2.153657762695405, 111.48336485370967]
p_target_m = (R * p_source_mm - offset_mm) * 0.001

Target bounds (m), rounded:
min = [-0.125669293, 0,           -0.325046161]
max = [ 0.125669293, 0.399401196,  0.325046161]
```

The offset centers the complete assembled envelope in X/Z and places its lowest modeled surface on Y=0. The lowest point belongs to the cover, approximately 0.154 mm below the chassis minimum. A manufacturing support datum could differ; retain this explicit display-ground choice instead of silently changing geometry. The overall width includes the side lever, and depth includes the handle; these are not enclosure-only dimensions.

![B-rep edge projections of the supplied CAD](/Users/rwiiinzz/Desktop/coffee-machine/docs/custom-machine-investigation/cad-inspection.png)

### Appearance and remaining uncertainty

No STEP color/style/material entities were found, and the imported XCAF color table is empty. There are no verified PBR finishes or texture assignments to preserve. Proposed steel, painted metal, polymer and glass finishes must be explicit authoring choices, not presented as recovered CAD materials. Density and mass cannot be derived reliably without material data.

No export triangle count, normal quality, compressed file size or browser performance has been measured for the custom model because conversion was intentionally deferred. The unit cover contains 342,128 Cartesian-point records despite only 344 faces; the headgroup accounts for 1,870 faces. These identify areas to inspect during tessellation, not proof of a particular GPU cost.

## B. Existing application analysis

### Loading and rendering contract

The existing asset is a glTF 2.0 binary with **142 mesh nodes, 142 meshes, 813,334 triangles and five material definitions**, occupying **6,043,044 bytes**. All mesh nodes are direct scene roots; hierarchy survives in index metadata rather than nested GLB nodes. It has no embedded animation clips and requires `EXT_meshopt_compression` and `KHR_mesh_quantization`. Its measured X/Y/Z envelope is 0.710 × 0.537322 × 0.642278 m.

[loadMachineAssets.ts](/Users/rwiiinzz/Desktop/coffee-machine/app/experience/assets/loadMachineAssets.ts:26) fetches a hardcoded Linea PB index, streams its referenced GLB with progress, then parses through Three.js `GLTFLoader` with a Meshopt decoder. The parse resource base is also hardcoded to `/models/linea-pb/`. The loader currently has no Draco/KTX2 configuration. Disposal covers geometries/materials but would need texture disposal if new finishes introduce textures.

[MachineAssembly.tsx](/Users/rwiiinzz/Desktop/coffee-machine/app/experience/MachineAssembly.tsx:28) combines CAD specs with 12 procedural old-machine brew-group objects. It finds each CAD node by exact `nodeName`, clones it out of the source hierarchy, subtracts its final translation and adds an animated wrapper. It replaces every imported mesh material with a category material. The resulting root is named `Linea_PB_AV_2_Group`.

That wrapper contract works with the current flat, centered export and its retained static quantization transforms. It is not a general hierarchy-preserving loader. Removing a node's ancestors can discard parent placement; subtracting translation does not invert a general transform, and applying wrapper rotation while retaining an original child rotation can duplicate rotation. A nested custom GLB requires explicit static bind-matrix ownership.

### Reuse and replacement boundaries

| File/system | Reusable behavior | Custom-model changes required |
| --- | --- | --- |
| [partsManifest.ts](/Users/rwiiinzz/Desktop/coffee-machine/app/experience/data/partsManifest.ts:20) | General manifest concept | Replace Italian/OEM-name classifiers, frame fallback, metre offsets, 171 CAD dependency links, provenance and fixed scale assumptions. The two portafilter pivots at X=±0.12 m and 12° yaw are old-model-specific. |
| [reconstructedParts.ts](/Users/rwiiinzz/Desktop/coffee-machine/app/experience/data/reconstructedParts.ts:5) / [BrewGroupGeometry.ts](/Users/rwiiinzz/Desktop/coffee-machine/app/experience/geometry/BrewGroupGeometry.ts:98) | Isolated mathematical helpers only | Exclude all 12 old lower-group objects; their two axes, mating planes, dimensions and catalog evidence do not describe this model. |
| [AssemblyTimeline.ts](/Users/rwiiinzz/Desktop/coffee-machine/app/experience/scroll/AssemblyTimeline.ts:13) / [assemblyMath.ts](/Users/rwiiinzz/Desktop/coffee-machine/app/experience/scroll/assemblyMath.ts:100) | Paused GSAP playhead; absolute repeatable seeks; smoothstep translation; quaternion SLERP; constant scale; optional rigid pivots; validation | Supply custom component IDs, transforms, times and verified group relationships. These checks do not detect collisions or prove mechanical assembly. |
| [ScrollDirector.ts](/Users/rwiiinzz/Desktop/coffee-machine/app/experience/scroll/ScrollDirector.ts:5) / progress store | ScrollTrigger, normalized progress, navigation | Keep the mechanism; drive it from the new chapter data. |
| [CameraRig.tsx](/Users/rwiiinzz/Desktop/coffee-machine/app/experience/CameraRig.tsx:9) / [chapters.ts](/Users/rwiiinzz/Desktop/coffee-machine/app/experience/data/chapters.ts:21) | Camera interpolation, reduced motion, portrait framing, copy-safe view offset | Replace old fixed camera targets/distances and group-specific widening; author views from the custom assembled and exploded bounds. |
| [LightingRig.tsx](/Users/rwiiinzz/Desktop/coffee-machine/app/experience/LightingRig.tsx:10) | Local studio Lightformers, reflections, background blends, shadow ground | Retune cards, shadow bounds/bias and finish response for the new envelope. The current shadow plane is at Y=-0.008 m. |
| [ExperienceCanvas.tsx](/Users/rwiiinzz/Desktop/coffee-machine/app/experience/ExperienceCanvas.tsx:34) | Demand rendering, adaptive DPR, loading/retry, context handling, mobile postprocessing reduction, ACES | Remove old reconstruction inventory and aria-label; watch full-buffer copies during loading and parsing. |
| [home.tsx](/Users/rwiiinzz/Desktop/coffee-machine/app/routes/home.tsx:10), [SourcePanel.tsx](/Users/rwiiinzz/Desktop/coffee-machine/app/components/SourcePanel.tsx:3), navigation/types | Page shell and UI patterns | Replace title/meta, branding, old dimensions, source links, gaps and descriptions; make chapter count data-driven instead of assuming 11 chapters and fallback index 10. |

### Existing preparation scripts

The existing scripts are references for a new pipeline, not safe commands to run on the custom source:

- [cad-inspect.py](/Users/rwiiinzz/Desktop/coffee-machine/scripts/cad-inspect.py:30) writes a B-rep cache beside its input. It was **not invoked on the Downloads source**. It also declares output units as mm rather than validating them, and does not inventory colors despite enabling their import.
- [cad-convert.py](/Users/rwiiinzz/Desktop/coffee-machine/scripts/cad-convert.py:52) defaults to old paths, guesses orientation against a 533 mm old-machine height, always writes an old inventory path, assigns old material/provenance rules, removes coincident duplicates, flattens placements and emits identity rotations. Its per-face tessellation, face-location application and reversed-face winding handling are useful reference code.
- [optimize-model.mjs](/Users/rwiiinzz/Desktop/coffee-machine/scripts/optimize-model.mjs:7) uses old paths and may reuse a stale uncompressed old model. Its node-name equality check does not prove preserved matrices, hierarchy or animation semantics.
- [cad-validate.py](/Users/rwiiinzz/Desktop/coffee-machine/scripts/cad-validate.py:5) enforces old dimensions and identity transforms. [verify-assets.ts](/Users/rwiiinzz/Desktop/coffee-machine/scripts/verify-assets.ts:10) also uses old paths and translation-only wrappers. Generalize the checks before using them for the custom asset.

**Baseline checks actually run:** `npm test` passed all 18 tests; `npm run assets:audit` passed all 142 existing nodes, with maximum compressed-geometry/index bounds difference of 0.020574 mm. These validate the existing model's contracts only. No browser benchmark, production build or custom-GLB validation was performed.

## C. Recommended conversion pipeline

### Feasible local workflows

| Workflow | Accuracy, structure and appearance | Cost/fit |
| --- | --- | --- |
| STEP → OCCT/OCP XCAF → GLB | Retains B-rep until controlled tessellation; explicit products, occurrences, names, transforms and metadata. Best opportunity to preserve this source's 23 groups and optional 56 solid children. PBR finishes still require authoring. | **Recommended.** The required runtime already works locally. |
| STEP → FreeCAD → GLB | Practical GUI inspection/export alternative; current FreeCAD source registers glTF export. Verify import preferences, actual tree and exported matrices rather than assuming the source hierarchy survives. | Optional, not installed here. GUI edits can introduce undocumented placement or scaling. [FreeCAD format registration](https://github.com/FreeCAD/FreeCAD/blob/main/src/Mod/Import/Init.py). |
| STEP → tessellated GLB → Blender → GLB | Good for reviewing shading, assigning finishes and selective cleanup. Preserve names, parenting and transforms, and verify round trips. Use a CAD tessellator first; Blender's native format list does not provide STEP support. | Optional, not installed here. Adds a round trip; avoid accidental joins, remeshing or rescaling. [Blender pipeline](https://www.blender.org/features/pipeline/). |
| STEP → STL/OBJ → Blender → GLB | STL loses semantic scene/material/unit information; OBJ does not provide a reliable equivalent of the complete assembly/placement contract. Rebuilding it requires additional files/sidecars. | Avoid as the primary route. It unnecessarily increases reconstruction work. |
| STEP → local occt-import-js → custom glTF writer | Local browser/Node import with hierarchy, meshes, normals, names and tessellation/unit settings; avoids sending CAD to a server. | Feasible fallback, but adds a JSON-to-glTF exporter when full OCP is already available. [Project documentation](https://github.com/kovacsv/occt-import-js). |

### Tools and conversion steps

Use the existing Python 3.12 environment at `/Users/rwiiinzz/Desktop/coffee-machine/research/cad/.venv/bin/python`. Installed dependencies match [cad-requirements.txt](/Users/rwiiinzz/Desktop/coffee-machine/scripts/cad-requirements.txt): OCP/proxy 8.0.1.1.0, VTK 9.6.2, NumPy 2.5.4, trimesh 5.1.1 and Pillow 12.3.0. No missing CAD dependency blocked this investigation. FreeCAD and Blender are optional GUI alternatives available through their official distributions; they are not required for the recommended path.

1. **Register a separate source.** Hash the original, retain its exact units and product fields, and use a new output/cache directory. Cache validity must include source hash, kernel version, meshing settings, coordinates and material configuration. Never silently reuse the Linea PB cache.
2. **Import and audit XCAF.** Enable names, colors and metadata. Reconcile importer labels against the 23 STEP products, including `620424`; retain original local/world placements. Keep auxiliary sketches in inspection data only. [STEPCAFControl reader](https://occt3d.com/dev/doc/refman/html/class_s_t_e_p_c_a_f_control___reader.html).
3. **Define render hierarchy.** Preserve root → 23 source component groups → optional solid nodes. Multi-solid products remain rigid groups by default. Keep per-solid source IDs for inspection/material assignment without claiming each is an independent mechanism.
4. **Tessellate explicitly.** Begin evaluation around **0.10–0.25 mm absolute linear deflection and 0.15–0.30 rad angular deflection**. These are starting recommendations, not measured optimal settings. Compare cover silhouettes, holes and headgroup highlights at actual close-up distances; refine selected parts, not the entire assembly. Mesh in mm before scaling or convert deflection consistently. Check mesher completion and nonempty triangulation per rendered face. [Incremental mesher](https://occt3d.com/dev/doc/refman/html/class_b_rep_mesh___incremental_mesh.html).
5. **Protect normals and dimensions.** Use face/surface normals with correct face orientation and winding; preserve hard edges. Validate any weighted-normal fallback. Do not globally smooth or weld across normal/material discontinuities. Apply scale, the `[y,z,x]` rotation and grounding exactly once to geometry, normals and placements. Generic Z-up conversion alone does not establish this model's front direction. [Coordinate converter](https://occt3d.com/dev/doc/refman/html/class_r_w_mesh___coordinate_system_converter.html).
6. **Write a reference GLB.** `RWGltf_CafWriter` supports binary output, naming policies and coordinate conversion; it requires existing triangulation. Its constructor, naming/face-merge options, coordinate converter and export entry point are available in the installed OCP binding; full export has not been exercised. Use an audited render XCAF document if necessary to omit auxiliary curves while keeping source groups. Merge compatible face primitives **within a component**, not across animated components. Keep the uncompressed output as the fidelity reference. Verify the writer with a small controlled export before processing the complete assembly; a hierarchy-preserving custom glTF writer is a fallback. [OCCT writer](https://occt3d.com/dev/doc/refman/html/class_r_w_gltf___caf_writer.html).
7. **Author finishes separately.** With no source colors, start from neutral inspection materials, then assign reviewed PBR materials by explicit component/solid ID. Do not reuse Italian-name heuristics. Glass transmission and chrome need lighting/shading review; display artwork is not supplied.
8. **Optimize selectively.** Reuse the installed glTF Transform/Meshopt stack with new paths and source-aware caches. Deduplicate geometry/material resources without deleting occurrences. Preserve names, IDs, hierarchy and bind matrices. Avoid blanket flatten/join passes: application-driven animation has no glTF channels to protect its nodes automatically. Simplification is lossy and must be checked against the reference. Meshopt quantization must pass decoded bounds/feature checks. [Dedup](https://gltf-transform.dev/modules/functions/functions/dedup), [flatten](https://gltf-transform.dev/modules/functions/functions/flatten), [join](https://gltf-transform.dev/modules/functions/functions/join), [simplify](https://gltf-transform.dev/modules/functions/functions/simplify), [Meshopt](https://gltf-transform.dev/modules/functions/functions/meshopt).

### Acceptance checks and budgets

Before integration, require complete coverage of all 23 component groups and 56 solids, with no auxiliary sketch meshes; recorded hierarchy and bind matrices must reproduce the B-rep placements. Compare reference and decoded optimized bounds in metres, and compare selected feature dimensions/silhouettes within an agreed error budget consistent with tessellation and quantization. Inspect backfaces, holes, seams and curved highlights in multiple views. A bounds-only check can miss surface errors.

Run the [Khronos glTF Validator](https://github.com/KhronosGroup/glTF-Validator), then load with the installed Three.js loader. Schema validity does not prove CAD fidelity. Test materials, isolation and exact assembled placements before authoring motion. Verify decoder availability; the installed loader supports Meshopt, while Draco/KTX2 would need additional setup. [Three.js GLTFLoader](https://threejs.org/docs/pages/GLTFLoader).

Initial **planning targets**, subject to actual conversion and device measurements: at most approximately 500,000 visible triangles for desktop, 250,000 for a mobile variant, fewer than 100 opaque color-pass draw calls, and approximately 8 MB or less compressed geometry. These are not predicted results or hard reasons to sacrifice the design. Measure transfer/decode time, peak memory, texture use, shadow/postprocessing cost and scroll frame time. Target 60 fps on the chosen desktop and at least 30 fps on the chosen mobile device; define the devices before acceptance. Compression reduces transfer size, not triangle count or necessarily draw calls.

## D. Integration plan

These are **proposed future changes**, not files implemented in this investigation.

| Create or modify | Purpose |
| --- | --- |
| New `public/models/custom-espresso/` asset directory | Separate reference/optimized asset identity; keep the existing GLB/index for comparison and rollback. Publish only the selected runtime assets. |
| New custom conversion/configuration and audit scripts | Explicit source/output/cache paths, source hash, coordinate matrix, meshing settings, appearance rules and validation; no old defaults. |
| Expanded asset-index/types | Source product/solid IDs, application ID, parent ID, both product fields, local/world bind matrices, pivots, bounds, materials and per-part mesh statistics. |
| `loadMachineAssets.ts` | Accept a model configuration/base URL; preserve streamed progress, abort/retry and Meshopt decoding; extend validation and texture disposal if needed. |
| `MachineAssembly.tsx` | Retain the imported hierarchy and exact bind transforms; add animation wrappers at selected source-component boundaries; remove old procedural additions and universal material replacement. |
| New custom manifest/configuration | Explicit groups and timings for actual components; no old node names, fixed offsets, dependency graph or portafilter pivots. |
| `CameraRig.tsx`, `chapters.ts`, `LightingRig.tsx` | Reuse interpolation/environment mechanisms; calibrate custom focus targets, framing, light cards and shadows. |
| `ExperienceCanvas.tsx`, types, home/source/navigation UI | Custom inventory/identity, data-driven chapter count, accurate provenance and descriptions. |
| Asset/animation/browser checks | Source-to-render fidelity, matrix ownership, material assignments, independent isolation, reverse/random seeks and actual device performance. |

### Transform ownership and pivots

Prefer keeping each source component's static assembled placement beneath an initially identity animation wrapper. The wrapper supplies a presentation delta in a documented parent frame; it must not overwrite or reapply a bind placement already on the imported group. Preserve any static quantization/dequantization transforms below it. If reparenting into a pivot wrapper, derive the child's local bind matrix with the inverse pivot/parent matrix so its world placement stays identical.

The existing timeline can be reused once the manifest and wrappers agree on this contract. For wrapper deltas, evaluate the wrapper's final delta as identity; alternatively extend the evaluator to compose explicit bind matrices. Do not mix absolute component poses with already-placed children. Tests should compare full world matrices at assembly completion and after repeated forward/reverse/random seeks, including rigid distances within multi-solid products.

### Assembly storytelling supported by this model

Start with six or seven chapters reflecting the actual inventory: chassis/supports; drainage/cup support; headgroup with lever shown as a rigid product; display and panel pieces; enclosure/fasteners; portafilter and completed product. Exact ordering is a proposed editorial sequence, not a verified manufacturing sequence. Do not retain empty boiler/pump/steam chapters with old geometry or imply internals that are absent.

Move the 23 product groups as rigid units initially. Keep boiler-base bodies, lever bodies, portafilter bodies, panel bodies and screw groups coherent unless geometry review justifies finer motion. Exploded directions and distances should follow measured bounds and attachment geometry, with overlap/collision review. Start with translation-only presentation motion; derive rotation axes only when the actual hinge/shaft/mating geometry supports them. Do not inherit the old two-portafilter 12° locking animation. The CAD has one portafilter product and no verified locking angle.

Where motion cannot be justified, use camera orbits, part isolation, opacity transitions or clearly labeled section views. This preserves the custom design while avoiding invented mechanical behavior.

Camera distance should fit both assembled and exploded envelopes using the current FOV/aspect ratio and reserved text area; do not shrink the machine to fit. The custom machine is narrower than the old asset and has different focus locations. Review portrait framing and near-plane clipping of the portafilter. Retain demand rendering, adaptive DPR and reduced motion, and retune transparent surfaces and shadows after finishes are chosen.

## E. Risks, limitations and decision

| Evidence status | Finding and practical consequence |
| --- | --- |
| **Verified** | Embedded, transferable 23-component/56-solid B-rep assembly; no single-mesh reconstruction is needed. |
| **Verified** | No source nested assembly usages or joints; the importer adds auxiliary grouping labels. Preserve source semantics explicitly. |
| **Verified** | Native names/origins and the old runtime wrapper contract are not interchangeable. Map identifiers and own full bind transforms. |
| **Verified** | No CAD colors/materials; realistic finishes require authored choices. |
| **Verified** | Existing scripts contain old paths, dimensions, heuristics and stale-cache risks. Running them unchanged could overwrite/reintroduce old assets. |
| **Geometric interpretation** | Source Z-up, +X-front is strongly supported by the inspected geometry; STEP does not explicitly state semantic front/up. |
| **Display convention** | Grounding to the lowest modeled cover surface and centering the full accessory envelope are deliberate presentation choices, not manufacturing datums. |
| **Unverified** | Lever mechanism, portafilter locking axis/angle, physically valid assembly order, fit and collision-free travel. Use rigid groups and restrained presentation motion until established. |
| **Unmeasured** | Custom GLB triangles, normals, bytes, decode cost and device frame time. Set them through conversion trials and profiling, not STEP size. |
| **Recommendation** | Preserve the actual CAD shape; selectively control tessellation and simplify only after visual/dimensional comparison. Never generate missing geometry from imagination. |

**Recommended decision:** proceed later with a separate, local, source-aware OCCT/XCAF conversion preserving the 23 component groups and optional 56 solid children. Reuse the scrolling, deterministic timeline, camera interpolation and studio environment; rebuild the model-specific manifest, transform handling, finishes and chapter data. The supplied CAD is sufficient for an accurate product visualization and restrained exploded presentation, but it does not supply evidence for a complete operating-machine simulation or an exact mechanical assembly demonstration.
