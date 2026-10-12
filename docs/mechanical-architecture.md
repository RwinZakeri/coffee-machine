# Mechanical architecture and reconstruction evidence

Target: standard Linea PB AV two-group, without ABR scales, MP paddle valves or PB X independent coffee boilers. Sources S01-S11 are linked in `sources.md`.

## Coordinate system and design envelope

Use meters in the runtime: +X machine right when seen from the barista, +Y up, +Z toward the barista. The nominal design envelope is 0.710m wide ×0.590m deep ×0.533m high (S01 technical table; S04). The source CAD mesh bounds are 710×642.3×537.3mm including projecting accessories/supports; the discrepancy is preserved in the audit, not corrected by scaling. Ground is the bottom support plane. Keep scale at 1 through the animation. A portafilter's final projection is part of the overall working area; no per-part enlargement is justified by a camera close-up.

The actual model nodes or the typed runtime manifest establish component coordinates. Position estimates from perspective illustrations are **visual approximations**, not measured installation transforms. CAD geometry retains its documented source coordinates after one explicit unit/axis transform; reconstructed geometry requires a separately disclosed alignment transform.

## Topology verified in actual exploded diagrams

- The catalog frame is an open folded/formed metal structure with base longitudinal rails, upper cross members, side upright brackets and a terminal-block support. V3.2 p6 shows this structure without assigning manufacturing dimensions or an OEM number to the complete chassis. The audited CAD supplies only the 14-node structural outline: two legs, four foot pads, four corner members and four leg bolts. The internal chassis and boiler mounts remain missing.
- Steam and coffee boilers have transverse axes along machine width. The standard coffee boiler connects to the forward saturated groups via short curved necks (V3.2 pp28/44/46; V3.8 pp58/60). V3.2 p44 is drawn with three groups: it establishes topology only. The two-group spare boiler is explicitly labeled on p46/47.
- The standard two-group coffee boiler is cataloged as `L.1.005.2GB.R`; a right-side 2GR replacement `L.1.005.2DGB.R` also appears. Catalog context is insufficient to silently choose the second for the target. The two-group steam boiler is `L.1.004.2.R`, with sight glass (V3.2 p49; V3.8 p63).
- Both boilers are insulated (S01/S04). The coffee insulation is `F.7.004`; steam insulation is `F.7.012`. V3.8 p63 explicitly lists the steam blanket as 420×515×15mm. This flat blanket size is not a cylindrical shell's exact length or diameter. Neither boiler nor its insulation is present in the runtime scene.
- Plumbing contains separate steam-boiler autofill and brew-water paths. The source identifies actual connecting tubes and fittings, but no exact three-dimensional pipe centerline coordinates (V3.2 pp24-29). Show only source-supported endpoints; any traveling light is an illustrative annotation.
- The motor-pump is an **external support module**. S06 p11 documents separate braided hose connections and a separate power connector, and locates the motor close to the machine for accessible, ventilated service. It must not assemble into the chassis. V3.2 p78 illustrates motor, clamp and pump head as separate parts.
- The AV control panel has three buttons per group, a central narrow display above the double-scale gauge and steam knobs at the outer ends (S08/S09; V3.2 pp14/15). The fascia and stainless control elements do not establish circuit-board artwork or exact wiring paths.
- Standard drainage uses a basin, grille and drain collector. The CAD contains the basin/grille/cover pieces; the complete collector and reinforced exit hose are absent. ABR-only scales are excluded (S04). The installed reinforced drain hose leaves on the machine's left according to S06 p12.
- Two portafilters fit into the lower bayonet rings, with the handle turning left-to-right to lock (S06 p14). The manual does not specify the locking angle; a restrained insertion-turn animation is explanatory.

## Genuine CAD subassemblies demonstrated

The completed audit and conversion preserve 142 independent manufacturer CAD nodes. The runtime includes two complete localized outlet/inspection subassemblies without implying their missing feed plumbing:

- **Hot-water outlet, eight nodes:** junction, upper O-ring, lower O-ring, nut, aerator adaptor, filter, aerator gasket and cover. The junction precedes the seals; the upper seal precedes the nut; the lower seal precedes the adaptor; the adaptor precedes the filter/gasket; both precede the cover. Exploded approaches follow the outlet axis, and every node returns to its audited source transform. This is a genuine localized outlet assembly, not the whole hot-water valve/plumbing system.
- **Sight glass, nine nodes:** body, inside cap, O-ring, glass, flat gasket, chromed bezel, drain fitting, copper washer and fixing screw. One dependency branch closes the glass stack along its front-facing axis; another attaches the drain fitting, washer and screw to the body. The steam boiler and sight-glass feed tubes remain absent. The completed subassembly is therefore an educational suspended detail rather than an installed boiler connection.

## Reconstructed AV lower group and documented upper topology

V3.2 pp36/42 and V3.8 pp48/55 establish the AV group's exploded hierarchy and several nominal seal dimensions. They support the implemented lower-stack reconstruction, but do not supply the full housing/neck/cap CAD required for a complete saturated group. AV is the left-hand group in the shared AV/MP lower-stack illustration. The right-hand illustration's paddle is excluded.

### Independent lower components

| Part | Verified OEM number | Evidence | Geometry constraints and uncertainty |
| --- | --- | --- | --- |
| Bayonet ring | `L109.01` | V3.2 p37 item1; V3.8 p49 item1 | Chromed lower annulus with opposed locking entries and mounting holes, visible in the exploded drawing. Exact outer diameter, lug profile and bolt circle are not specified. |
| Diffuser screw | `A.5.110` | V3.2 p37 item2; V3.8 p49 item2 | M6, head diameter 10mm. Total shaft length and head profile not dimensioned; do not infer an exact threading model. |
| Shower screen | `F.3.040.01` | V3.2 p37 item3b; V3.8 p49 item3 | Screen with logo, H6.5mm. Shallow dish/disc with central screw opening. Diameter and perforation pattern are not cataloged here. |
| Group gasket | `H.3.007` | V3.2 p37 item4; V3.8 p49 item4 | Silicone 71.6mm outside /55mm inside ×8.2mm height in description. These numbers can constrain an annular reconstruction; hardness, section bevel and exact compression are unverified. NBR alternatives are described as 72/63×55×8 or9. |
| Group housing and neck | No standalone housing number assigned in the group table | V3.2 pp36/46; V3.8 pp48/60 | Downward cylindrical housing with a curved rear neck joining the common boiler. OEM topology is supported; detailed housing diameters and neck-wall geometry are unknown. |

The older shower `L107` is marked for serial numbers 0001-0353 on V3.2 p36; `F.3.040.01` is shown from 0354 onward and remains in V3.8. There is no supplied machine serial number. The reconstruction depicts the later screen and states that choice; it does not combine both screens in one group.

The lower stack assembles along the group vertical axis. The gasket and screen seat into the housing underside; the screen's screw sits at its center; the bayonet annulus surrounds the underside and receives the portafilter. The exploded drawing separates these for clarity, but is not a fit/tolerance drawing. In the assembled mesh, the screen disc belongs inside the 55mm gasket opening and the ring encloses the stack. A scaled cylinder beneath an unrelated boiler would lose the documented relationship.

### Documented AV upper components, currently absent

| Part | Verified OEM number | Evidence | Constraints |
| --- | --- | --- | --- |
| AV cap | `SA944`; assembly `940/AV.02` | V3.2 p43 items22/23; V3.8 p57 items22/23 | Circular steel cap with raised flowmeter region and drilled fittings. No cap diameter or port spacing given. |
| Fiber seal | `L103/B` | V3.2 p43 item18; V3.8 p56 item18 | 87×81×0.5mm, ring form. |
| Cap O-ring | `L103/A` | V3.2 p43 item24; V3.8 p57 item24 | 75.87mm internal diameter ×2.62mm section, FKM/Viton. A torus centerline diameter would be 78.49mm; outside diameter 81.11mm. |
| Cap mounting screws and washers | `L110.01`, `L1003` | V3.2 p43 items2/1; V3.8 p56 items2/1 | Diagram shows **three** vertical cap screws; M8×52 with 8.5×14×1.5mm washers. Bolt-center coordinates are inferred. |
| Integrated flowmeter | `LAD070/GC.R`, `LAD070/V`, `LAD070/S1` | V3.2 p43 items5/3/4; V3.8 p56 | The impeller, O-ring and head stack directly on the cap; head mounts with three small fasteners. V3.8 seal description is 2×28mm silicone. |
| Flowmeter connector | `LAD070/CGC` | V3.2 p43 item7; V3.8 p56 | Above/at the flowmeter head; cable route is undocumented. |
| Solenoid coil and connector | `L100/G.01`, `L205` | V3.2 p43 items11/10; V3.8 p56 | Separate black blocks beside the brass valve region. 220-240V 8W coil exists; voltage selection depends on installation. Exact housing geometry is unmeasured. |
| Group adapter and neck cap | `A.2.009.01`, `B.1.003.01` | V3.2 p43 items19/21; V3.8 pp56/57 | Fit into AV cap/neck region with specified washer/O-ring relationships; port position and hidden bore layout are not dimensioned. |

The cap seals meet the group housing upper rim, the cap descends above them, then three long bolts pass vertically through it. The flowmeter impeller descends into its recess, then its O-ring/head closes that recess. The source supports these relative directions. It does not prove a complete manufacturing build order or torques. Brew group housing, cap, screen, gasket, ring, seals, screw, flowmeter and solenoid must stay distinct animatable objects.

### Requirements for completing the group reconstruction

1. Anchor a group local origin at the lower housing axis. Use explicit millimeter-to-meter conversion for the listed seal dimensions.
2. Build the bayonet ring as an extruded annular section with two locking entry recesses, not a solid disc. Keep the cutouts visually plausible and classified as approximate until a dimensioned ring drawing is obtained.
3. Use a shallow formed shower disc with a separate screw. A lightweight perforation shader or instanced perforation detail can illustrate the screen; it is not verified hole artwork.
4. Form the group neck as a bent/arched solid joining the rear transverse boiler. Its exact swept profile is inferred. Never add a second miniature independent boiler to the standard PB group.
5. Cap geometry should expose separate seals and three fixing bolts. Use soft machined edges and distinguish silicone/black elastomer, steel, copper washers, treated brass valve and black coil materials.
6. Reuse geometry for the second group and align it to its independently documented final transform. The boiler must already exist before the groups lock into it, except during a clearly identified exploded explanatory shot.
7. Camera close-ups establish readability rather than changing physical scale. Reverse motion must evaluate the original transforms directly.

## Catalog families and completion requirements

These identifiers are verified in the catalog tables. The completed CAD audit determines which are genuinely present; a catalog family name alone does not supply its mesh. The current availability/counts are listed below.

| Chapter | Source-supported families | Required separation |
| --- | --- | --- |
| 01 Structure | Open frame shown V3.2 p6; low rubber supports `CL001.01` p9; leg `C.3.007` p7 | Retain the source CAD legs/corner outline; obtain missing internal rails/brackets and boiler supports. Do not claim the source leg geometry represents a serial-specific low-support variant. |
| 02 Hydraulics | Inlet `T.1.158.2`; check valve `L032/P.01`; water manifold `L025/C.01`; copper tubing endpoints pp24-29 | Tubes, valves and fitting nodes, without fabricated full schematic. |
| 03 Pump | Motor alternatives `L290/5` /`L290/8UL`; head `L290/1.01`; clamp `L290/C` pp78-79 | External motor/head/clamp, all currently absent. Any future hose connection must return to the verified inlet. |
| 04 Thermal | Coffee `L.1.005.2GB.R`; steam `L.1.004.2.R`; insulation `F.7.004` /`F.7.012`; probe `E.1.005` pp44-49 | Distinct vessels, insulation, end fittings, probes and side-entry elements. |
| 05 Groups | Lower/upper stack above | Both groups and separate screens/gaskets/rings. |
| 06 Steam/water | Valve `B.1.008.01`; steel wand `T.2.001`; four-hole tip `L173`; hot-water wand `L160.02` pp20-23 | Left/right valve, shaft/knob, swivel wand, hot-water outlet. |
| 07 Electronics | Low-voltage harness `E.4.155`; universal board `E.1.023.02`; PB board `E.1.025.02`; box `F.1.043` pp80-81 | The runtime has the keypad rear housings/plates/connectors. Main boards, harness and exact routes remain absent. |
| 08 Controls | Two-group fascia `C.1.153.2.01`; three-button keypad `E.2.038`; gauge `E.3.010`; display `E.1.024` pp14-15 | Fascia, two keypad groups, central display/gauge and steam knobs. |
| 09 Drain | Basin `C.1.152.2`; grille `C.1.157.2`; front cover `C.1.151.2.01`; collector `F.1.036.01` pp10-11/32-33 | Basin/grille/collector/left-exit hose. No ABR weighing system. |
| 10 Body | Left/right upper panels `C.1.144` /`C.1.143.01`; rear `C.1.145.2.01`; cup tray `C.1.146.2.01`; rail `C.1.161.2` pp6-9 | Individual panels, top tray, perforated inserts and rails. |
| 11 Accessories | Portafilter drawings/tables pp82-87; locking relationship S06 p14 | Two genuine six-leaf CAD portafilters. `L113` is the filter-retaining spring; a separate filter basket is absent. Each assembly inserts rigidly with an illustrative 12° yaw rotation, while every leaf remains independently addressable. |

The black/white treatment is a user customization of exterior material slots, not evidence for altered mechanical geometry. Copper and brass colors should be assigned to actual source-supported material families; catalog diagrams also use color for visual separation, so an illustration's tint alone does not verify alloy.

## Implemented reconstruction subset

`app/experience/data/reconstructedParts.ts` and `app/experience/geometry/BrewGroupGeometry.ts` create **12 independent lower-group objects in chapter 05**, six per group: exposed skirt, gasket, shower screen, diffuser screw, bayonet ring and three-bolt set. Their staggered timings remain inside the chapter's 0.41-0.51 progress interval and satisfy their lower-stack dependencies. The skirt/ring are visual approximations; the gasket/screen/screw/bolt set are document-supported reconstructions with precise limits in their notes. The entire saturated housing, curved neck, AV cap, cap seals, flowmeter and solenoid are **not** fabricated as complete hidden geometry.

Source-to-runtime axes are identity, with millimeters converted to meters and translation `[0, +0.2103309248526369, +0.06466092850376418]`, matching the CAD export. Group X positions are ±0.120m. The lower-stack mating reference uses source Y151.05mm (upper portafilter body bounds) and Z78mm (the circular `L113` filter-retaining spring), rather than the metal body's deeper bounding-box midpoint which includes a projecting connection. Absolute attachment alignment remains approximate. Changing these inferred anchors must not rescale the documented 71.6/55×8.2mm gasket.

The 142 CAD nodes and 12 lower-group objects make 154 visible-capable runtime parts. Chapters 03 and 04 retain their educational captions and explicit asset gaps but contain no pump/boiler substitutes. Source CAD availability and conversion are complete; full service geometry and public redistribution rights remain unresolved.

`tests/reconstruction.test.ts` checks the authored gasket outside/inside diameters and height against the catalog, the formed screen height, screw head diameter, three fixing-screw dimensions and washer size. It also verifies twelve independent named objects, valid dependencies, provenance, chapter timing and exact initial/final transforms after reverse seeks. These checks verify retained source constraints and deterministic rendering data; they do not certify the unmeasured housing/ring dimensions.
