# Assembly map and playback contract

The educational sequence has eleven logical groups. The chapter order explains systems; it is not a manufacturer-approved service procedure. A logical group exists even when some or all of its geometry is unavailable. The asset manifest's accuracy classification is authoritative: a chapter entry is not proof of a complete physical reconstruction.

## Coordinates and transform ownership

Scene distances are meters. X spans machine width, Y is vertical, Z spans depth, and positive Z faces the barista. The ground datum is Y = 0. Quaternion tuples use glTF / Three.js order `[x, y, z, w]`. The nominal exterior envelope is approximately 0.710 × 0.533 × 0.590 m. Actual CAD bounds are 0.710 ×0.5373 ×0.6423 m including projecting accessories/supports; the source geometry is preserved without an arbitrary scaling correction. Source conversion and individual placement evidence are recorded in the completed asset audit.

`PartSpec` records each component's initial and final position and orientation, constant physical scale, source, accuracy status and installation interval. `evaluatePartState` always calculates from those original values. It never adds transforms to a previous rendered frame. Positions use smoothstep interpolation; orientations use shortest-arc quaternion SLERP. The initial and final values are copied exactly at their endpoints. Scale does not animate.

Components remain invisible at and before `assemblyStart`, which keeps progress 0 empty. After that threshold, the independent geometry moves from its displaced initial transform toward its assembled target. An entry classified **Missing asset** is never visible. A missing mesh is skipped by the renderer, while its documentation can still be shown by the interface.

Parts can optionally share an `assemblyPivot` with initial and final centers. The transform engine rotates each leaf's final relative position into the interpolated orientation before adding the interpolated center. All leaves remain independently addressable while their distances remain constant during a rigid insertion/locking movement. Pivot initial placement is validated against the manifest; exact initial and final target positions are retained.

## Eleven chapters

The opening reserves progress 0–0.05 before any assembly starts. The eleven chapters then occupy intervals 0.05–0.13, 0.13–0.23, 0.23–0.30, 0.30–0.41, 0.41–0.51, 0.51–0.61, 0.61–0.70, 0.70–0.79, 0.79–0.85, 0.85–0.94 and 0.94–1.00. Independent part intervals are defined by the manifest and may occupy a narrower subsection of that chapter for staging. The IDs below identify logical requested parts; an extracted CAD model can use more detailed independent nodes beneath the same logical group.

| Chapter | Group ID | Requested components | Installation relationships to verify |
| --- | --- | --- | --- |
| 01 / Structural core | `01_Frame` | BaseFrame, SupportBrackets, Feet | Base precedes brackets and feet. |
| 02 / Water system | `02_Hydraulics` | WaterInlet, CopperPipes, Fittings, CheckValves, SolenoidValves | Mounts and pipe endpoints require documented hydraulic layout. |
| 03 / Pressure engine | `03_Pump` | PumpMotor, PumpHead, PumpBracket | The external pump module is absent. A future motor/head/clamp assembly must remain outside the chassis. |
| 04 / Thermal heart | `04_Boilers` | SteamBoiler, BrewBoiler, HeatingElements, Probes, SafetyValves | Boiler supports precede bodies; attachment details follow their boiler. |
| 05 / Extraction core | `05_BrewGroups` | GroupHeadLeft, GroupHeadRight, ShowerScreenLeft, ShowerScreenRight, GasketLeft, GasketRight | Housings precede gaskets and shower screens; both groups retain independent transforms. |
| 06 / Steam control | `06_Steam` | SteamValveLeft, SteamValveRight, SteamWandLeft, SteamWandRight, HotWaterSpout | Valves precede wands; no unsupported bending or deforming pipe effects. |
| 07 / Control intelligence | `07_Electronics` | MainPCB, WiringHarness, Relays, Connectors, Sensors | Board mounts precede attached electronics; unverified routing must be disclosed. |
| 08 / Human interface | `08_ControlPanel` | FrontFascia, ButtonsLeft, ButtonsRight, Display, Gauge, KnobLeft, KnobRight | Fascia precedes its mounted controls. |
| 09 / Drainage | `09_Drain` | DripTrayBasin, Grilles, DrainPipe | Drain connection precedes basin, which precedes grilles. |
| 10 / Exterior shell | `10_BodyPanels` | LeftPanel, RightPanel, RearPanel, TopTray, GuardRails | Mounting structure and internal systems precede covers; tray precedes rails. |
| 11 / Final assembly | `11_Accessories` | PortafilterLeft, PortafilterRight | The available lower-group reconstructions complete before the portafilters arrive; full saturated bodies remain absent and disclosed. |

The dependency validator rejects unknown IDs, cycles and installation windows beginning before their dependencies complete. An unavailable component may remain in the manifest for documentation, but it does not establish verified mechanical attachment evidence. The relationships in this table describe the intended sequencing contract and must be cross-checked against the source audit before being treated as physical installation instructions.

## Audited runtime availability

The final runtime classification contains **142 independent CAD nodes plus 12 separately authored lower-group objects**. These counts describe loaded geometry, not a complete machine bill of materials:

| Chapter | CAD nodes | Reconstruction nodes | Demonstrated geometry and limitations |
| --- | ---: | ---: | --- |
| 01 / Structure | 14 | 0 | Two legs, four foot pads, four corner members and four leg bolts; internal chassis/boiler supports absent. |
| 02 / Hydraulics | 9 | 0 | Genuine sight-glass body, cap, seals, glass, bezel, drain fitting, washer and screw; feed tubes and full inlet/pipe network absent. |
| 03 / Pump | 0 | 0 | Asset-gap chapter; no fabricated motor/head. |
| 04 / Boilers | 0 | 0 | Asset-gap chapter; no fabricated boiler, heater or probe. |
| 05 / Brew groups | 0 | 12 | Two six-object lower stacks; skirts/rings approximate, nominal gasket/screen/fastener constraints retained; full housing/neck/cap absent. |
| 06 / Steam and hot water | 22 | 0 | Two seven-piece steam control/wand assemblies and one genuine eight-piece hot-water outlet; boiler feed and internal valve mechanism absent. |
| 07 / Electronics | 8 | 0 | Rear keypad plates/connectors/boxes/covers; main PCB/power supply/harness absent. |
| 08 / Controls | 51 | 0 | AV fascia, three-button arrays, display/gauge, mounting pieces and visible controls. |
| 09 / Drain | 8 | 0 | Basin, grille, cover/supports/studs/logo; complete collector and drain hose absent. |
| 10 / Body | 18 | 0 | Source CAD side/rear/cup-cover pieces, cup grilles/rail and fastening details. |
| 11 / Accessories | 12 | 0 | Two six-leaf portafilters; `L113` is the retaining spring, with no separate basket mesh. |
| **Total** | **142** | **12** | **154 available parts; missing service geometry is not counted.** |

The hot-water outlet uses explicit dependencies: junction → seals; upper seal → nut; lower seal → adaptor; adaptor → filter/gasket; filter and gasket → cover. Its exploded approach is axial, and its final transform preserves the original CAD. The sight-glass graph separates the front stack (body → cap → O-ring → glass → flat gasket → bezel) from the drainage branch (body → drain fitting → washer → screw). Neither graph implies a connection to the missing steam boiler or feed plumbing.

At the final stage, each portafilter's six CAD leaves shares one rigid pivot. They approach their preserved mating center with a 12° initial yaw, then return together to the source orientation. Their relative distances remain fixed during forward and reverse seeking. The manual supports left-to-right locking, but supplies no angle; the 12° movement is illustrative. This motion does not turn the inferred group ring into verified mechanical fit evidence.

## Scroll, camera and environment

`createAssemblyTimeline(parts, objects)` creates one paused GSAP timeline. Its scalar cursor drives absolute per-part transforms. `seek(progress)` supports jumps, reverse scrolling, scroll restoration and repeated evaluation of the same value. The controller exposes `dispose()` to kill the timeline on unmount.

Camera poses are separate from part placement. Each chapter has entry, focus and exit poses. A chapter's exit is the next chapter's entry, making the camera path continuous at each shared boundary. Camera position follows a spherical orbit around the interpolated focus point, avoiding a straight-line camera path through the chassis. Reduced-motion mode selects completed chapter poses rather than continuously animating through macro shots. Portrait framing increases distance around the existing target instead of scaling the physical machine.

Palette and lighting blend into the next chapter near the end of the current interval. No cumulative environment state is required. The final chapter ends in a bright product studio.

## Verification

Run `npm test` for the engine and reconstruction checks. They cover exact initial/final transforms, repeatable randomized seeks, reverse playback, quaternion normalization, invariant scale, missing-asset visibility, dependency validation, the audited CAD classification, rigid portafilter leaf distances, paused GSAP ownership, camera continuity and catalog-constrained reconstruction dimensions. These are animation/data checks. They do not certify hydraulic connections, wiring, installation clearances or the unmeasured group housing; those limitations remain in the source audit and asset-gap register.
