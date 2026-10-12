# Runtime CAD classification and choreography review

Independent review of the 142-node runtime asset against the original XCAF occurrence hierarchy, the completed source audit, and the official V3.2/V3.8 catalog text. Reviewed `app/experience/data/partsManifest.ts`, `MachineAssembly.tsx`, chapter intervals and manifest validation. This report recommends changes; it does not alter runtime code.

## Main findings

The model is consistently the AV two-group configuration. All 12 CAD portafilter occurrences correctly resolve to chapter 11 through the `L111-2NAC` ancestor. There are six distinct AV keypad button occurrences: three at X −120 mm and three at X +120 mm. No CAD occurrence is currently classified as a genuine brew-group body, and none exists in the source. The separately reconstructed lower group stack retains its declared reconstruction/approximation status.

Several real body/fastener objects currently fall through to the structural chapter, while the sight-glass assembly is incorrectly caught by the broad steam regex. All CAD dependencies are empty, so the existing dependency validation cannot detect unsupported sequencing. The generic rank calculation causes virtually every part in a chapter to move at once, regardless of the physical parent assembly.

## Exact classification corrections

Use occurrence ancestors first, then explicit source families. Do not use generic `cover`, `sheet`, `switch` or `bracket` tokens before checking the parent assembly.

| Node/source family | Current group | Recommended group | Reason and evidence |
| --- | --- | --- | --- |
| `cad_002` / `cad_010`, `C.1.141_C.1.141` | 01 Frame | 10 Body panels | Catalog V3.2 p7 explicitly identifies the lower side panels. These are exterior covers, not base-frame structure. |
| `cad_005`, `C.1.156.3_C.1.156.2_B` | 01 Frame | 08 Controls | Main-switch operator panel, V3.2 p13. Installing this backing before the `L400` switch is a coherent control-panel subassembly. It must not be called an internal structural frame. If categorized as exterior chapter 10 instead, hold its switch in an explicitly suspended temporary subassembly until the panel arrives. |
| `cad_015`–`cad_017`, `C.1.151.*bracket*` under `NLSA08` | 01 Frame | 09 Drain | These belong to the drip-tray front-cover assembly; V3.2 pp10–11. A generic `bracket` token does not make them chassis supports. |
| `cad_053`–`cad_061`, all descendants of `L120 C_L120 C` | 06 Steam | 02 Hydraulics | This is the actual **sight-glass assembly**, V3.2 p27 / V3.8 p38, with body, inside cap, O-ring, glass, flat gasket, bezel, drain fitting, washer and screw. It is not a steam wand or hot-water aerator. Check this ancestor before the broad `l120` steam rule. |
| `cad_066`, `C.1.161.3_C.1.161.2_C` | 01 Frame | 10 Body panels | Cup railing, V3.2 p7 item16. The rail must follow the cup-warmer tray/grilles. |
| `cad_067`–`cad_070`, root-level `I.1.006_I.1.006` | 01 Frame | 08 Controls | Their actual positions lie around the `C.1.156` main-switch panel edges. They must arrive after that backing. Catalog p15 identifies the fastener family; occurrence positions determine this use. |
| `cad_071`–`cad_074`, root-level `I.1.060_I.1.060` | 07 Electronics | 10 Body panels | Four top-corner screws at source Y278.4 mm, Z137.3 / −369.7 mm. They attach the top railing/corner region, not a PCB. V3.2 p7 item19 also lists the screw in this body assembly. |
| `cad_079` / `cad_080`, `FASTENER_M4_TL` with `C.1.153` ancestor | 01 Frame | 08 Controls | The source hierarchy explicitly places these within the AV fascia assembly. Use the ancestor, not an unrecognized generic fastener name. |

`NLC04`, `NLC05`, and the two `NLC06` occurrences are the four large front/rear corner members. They are distinct from the thin `C.1.143/144/147/149` side covers. Keeping the corner members in chapter 01 is a defensible exposed structural-outline presentation. Their old CAD names are not current catalog part numbers; the relationship to the catalog's `C.2.032/033/034` corner families is inferred from shape and placement. Do not claim that these establish the missing complete internal chassis.

The following existing classifications are correct:

- Genuine hot-water aerator/outlet assembly `cad_022`–`cad_029` under `L053-C` / `L160` → 06.
- Steam knob/wand/junction/tip/rubber occurrences `cad_081`–`cad_094` → 06. The `B.1.008` assembly name does not establish a separately extracted complete internal valve body.
- `C.1.153` AV fascia, two three-button fronts, display module and gauge → 08.
- The eight AV keypad rear cover / connector / back plate / box occurrences → 07 as an explicitly exploded control-module preparation view.
- Drip basin, grilles, front cover and its logo → 09.
- Cup-warmer grilles, upper/middle/rear exterior panels, group cover and rear logo → 10.
- All descendants of the two `L111-2NAC` portafilter occurrences, including their O-rings/spouts/handles/inserts/retaining springs → 11.

Applying exactly the corrections above produces these CAD counts:

| Chapter | CAD nodes |
| --- | ---: |
| 01 Frame | 14 |
| 02 Hydraulics / sight glass | 9 |
| 03 Pump | 0 |
| 04 Boilers | 0 |
| 05 Brew groups | 0, plus the 12 separately identified reconstructed objects |
| 06 Steam / hot-water outlet | 22 |
| 07 Electronics / keypad rear components | 8 |
| 08 Control panel | 51 |
| 09 Drain | 8 |
| 10 Body panels | 18 |
| 11 Portafilters | 12 |

The sum remains 142. Avoid creating fake pump/boiler geometry to fill the two genuinely empty chapters.

## Material corrections

The imported GLB has five shared material categories (stainless 105 meshes; white-enamel 9; black-polymer 17; rubber 3; electronics 8). `MachineAssembly` clones each mesh and assigns a fresh runtime material reference by the resolved category. It does not mutate the original shared GLB material object. Consequently, there is no source-material sharing bug that turns every mesh black; the incorrect categories below are the direct cause of individual wrong finishes.

| Source/node | Current material | Recommended material | Evidence |
| --- | --- | --- | --- |
| Four `F.2.026` foot pads | stainless | rubber | V3.2 p7 item3 explicitly says rubber foot. |
| Two `L171-G` steam-wand grips | stainless | rubber | V3.2 p21 item19: steam wand rubber. |
| `L122-A` | stainless | rubber | V3.2 p27 item14: Viton O-ring. |
| `L122-B` | stainless | gasket / rubber visualization | V3.2 p27 item16: flat sight-glass gasket 62×55×0.5. Exact gasket material is not specified there. |
| `L122_L122` | stainless | glass | V3.2 p27 item15: sight glass, diameter61.5, thickness5. A wholly metallic disc hides the intended transparent viewport. |
| `F.1.042` display protection | stainless | glass | V3.2 p15 item12 explicitly identifies protection glass. |
| `L120-2A` within sight glass | stainless | copper | V3.2 p27 item19: copper washer. |
| `L120 C_body*` | black | stainless / disclosed metal approximation | This is a hydraulic sight-glass body, not a nylon steam knob. No source evidence establishes black polymer for the whole body. |
| `Knob Mounting Screw` | black-polymer fallback | stainless | The generic conversion `knob` token mistakenly colored this metal fastener. |
| `C.1.157.*sheet*` drain grille | white-enamel fallback | stainless | Removable perforated drain grille; retain the user-requested painted front cover separately. |
| `L121` | stainless | chrome | V3.2 p27 item17 identifies the chrome bezel. Optional roughness refinement, not a geometry issue. |

Custom black-and-white casing categories are deliberate user-requested styling. They are not claimed as source CAD colors. Keep material accuracy notes separate from geometry accuracy.

`L113` in this CAD is the **filter-retaining spring**, not the portafilter basket and not a group shower screen: V3.2 p83 item18 identifies stainless wire1.1. The geometry is a thin ring with roughly1mm vertical extent. Its position remains a useful portafilter axis reference, but documentation should name it correctly. A separate basket is not established by the node inventory alone.

## Required sequencing improvements

The current 06 generic ranking starts adaptor → gasket → cover → filter → nut → junction. Their approximately48ms-normalized chapter windows overlap almost completely, so the cover can visually arrive before the filter it retains. Source order is an export ordering, not an installation dependency.

The first real detailed subassembly can be the genuine eight-piece hot-water outlet. A practical deterministic local-progress schedule inside chapter06 `[0.51,0.61]` is below. This is a readable educational subassembly order, not a claim about factory assembly. It holds no invented hydraulic connections.

| Node | Start/end progress | Dependencies |
| --- | --- | --- |
| `cad_027` junction | .514 → .522 | Existing frame reference only; its unavailable supply/mount is disclosed. |
| `cad_028` upper O-ring | .523 → .531 | junction |
| `cad_029` lower seal | .523 → .531 | junction |
| `cad_026` nut | .532 → .540 | upper O-ring |
| `cad_022` adaptor | .532 → .543 | lower seal |
| `cad_025` filter | .544 → .552 | adaptor |
| `cad_023` aerator gasket | .544 → .552 | adaptor |
| `cad_024` cover | .553 → .563 | filter and aerator gasket |

Use actual IDs after classification (`06_Steam.${nodeName}`). The existing strict validator requires every dependency's end ≤ the dependent's start, so these windows satisfy it. Give the small parts distinct axial exploded offsets around their real final positions; currently they all share the same displacement and remain spatially packed together even before assembly. The source component axes are vertical Y, so separate the cover/filter/gasket downward along Y and preserve their actual final scale/orientation.

After `.563`, show the paired steam outlet details with a restrained left/right stagger. Within each side, install the real wand junction before the rigid tube, then its grip and tip. Assemble the knob insert before the nylon knob and end cap. Do not claim an internal valve mechanism exists merely because the source ancestor is named `B.1.008`.

The whole outlet lacks a verified supply/mounting component in this CAD. A temporary suspended/exploded educational view is permissible and must be described as such. Do not label the parts as already bolted to a non-existent boiler or fascia before chapter08.

The nine-piece sight glass can similarly occupy chapter02 with a coherent sequence: body → inside cap → rear O-ring → glass → flat gasket → bezel; drain fitting → copper washer → screw is a separate branch. This gives chapter02 real source geometry while still disclosing the missing main hydraulic network and sight-glass feed tubes.

### Other dependency examples

- Leg assemblies before their rubber pads and mounting bolts; corner members follow their visible support reference.
- Main-switch panel before its switch and its four surrounding screws.
- AV fascia before its two `FASTENER_M4_TL` occurrences and before the visible controls reach installed positions. Keypad rear components in07 remain an explicitly exploded preassembly until08.
- Drip-cover brackets before front cover; basin before the perforated grille; retaining stud after/with its grille subassembly. Keep all eight drain objects in09.
- Upper/rear panels before their logos; cup-warmer supports/grilles before the rail; four top screws after the rail.
- Each portafilter metal body before its own spout/O-ring/insert/handle/spring details, and each completed portafilter installation after the corresponding reconstructed bayonet ring. Side is safely derived from the CAD occurrence's X sign; both handles and all six parts remain on the correct side.

The manifest currently has `dependencies: []` for all142 CAD nodes, so its successful dependency test presently proves only that an empty graph is valid. Add explicit IDs and non-overlapping windows for the verified subassembly relationships above. Avoid marking missing mounts as dependencies on unrelated geometry solely to make a test pass.

## Geometry and transform consistency

The local node-centering contract remains valid. Meshopt adds a local dequantization transform; `MachineAssembly` preserves it and removes only the original assembled translation before applying the wrapper transform. The root's decoded bounds check reports a maximum mesh-bounds discrepancy of0.020574mm, far below the original0.6mm tessellation deflection. There is no need to rescale or shift the individual parts to fix their chapter/material classifications.

Original CAD source names contain both2GR and3GR legacy strings, for example `C.1.153.2` and `C.1.156.3_C.1.156.2_B`. The actual scene width710mm, two portafilter assemblies and two three-button keypad arrays establish the target configuration; embedded legacy strings alone are not grounds to substitute three-group geometry.
