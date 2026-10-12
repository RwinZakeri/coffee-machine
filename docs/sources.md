# Source register

Inspected on 11 October 2026. The target is the **standard Linea PB AV, two groups**, with normal low supports and a custom white/black exterior. MP, ABR and PB X drawings appear in the same catalogs; their parts are not interchangeable assumptions.

## Primary documents actually downloaded and inspected

| ID | Official source | Local copy | Inspection and purpose |
| --- | --- | --- | --- |
| S01 | [UK Linea PB product page](https://lamarzocco.com/uk/en/commercial-products/espresso-machines/linea-pb/) | `research/catalogs/product-page.html` | Product identification, feature descriptions, technical specification table, links to separate AV two-group front/angle images. The web reader returned HTTP 403, but downloading the HTML directly succeeded. |
| S02 | [Parts catalog V3.2](https://au.lamarzocco.com/wp-content/uploads/2023/09/LineaPB_Parts_Catalog_V3.2COLOR-2.pdf) | `research/catalogs/LineaPB_Parts_Catalog_V3.2.pdf` | 90 PDF pages. Text extracted; actual exploded diagrams rendered and visually inspected, including frame/body p6, AV controls p14, plumbing pp24/26/28, drain p32, group p36, AV cap p42, coffee boiler p44, steam boiler p48, pump p78, and electronics p80. |
| S03 | [Parts catalog V3.8](https://lamarzoccousa.com/wp-content/uploads/2025/11/LineaPB_Parts_Catalog_V3.8-min-1.pdf) | `research/catalogs/LineaPB_Parts_Catalog_V3.8.pdf` | 105 PDF pages. Cross-checks the group, seals, AV cap, boiler and heater tables. Actual group and AV-cap diagrams and steam-boiler list rendered and visually inspected. Some source page images also have an OCR layer; identifiers are checked against the clear vector/text list and rendering. |
| S04 | [English product brochure](https://www.lamarzocco.com/uk/en/wp-content/uploads/2023/04/product_brochure_linea_pb_eng.pdf) | `research/catalogs/linea_pb_brochure.pdf` | Single-page sheet, rendered and inspected. Supports AV three-button interface, integrated cap flowmeter, saturated groups, dual boilers, optional colors, MP-only paddle and ABR-only scales. The large brochure photograph shows three groups and is not the two-group geometry reference. |
| S05 | [Australian technical resource library](https://au.lamarzocco.com/support/) | Referenced online | Confirms designer resources are DWG and STEP/IGS/PDF/DXF archives; provides official operating manual and installation template. Archive contents and actual geometry are documented separately in `docs/asset-audit.md`. |
| S06 | [Operating manual V3.2](https://au.lamarzocco.com/wp-content/uploads/2023/09/MAN.10.1_LINEAPB_EN_V3.2.pdf) | `research/catalogs/LineaPB_Operating_Manual_V3.2.pdf` | 106 pages. Installation pp10-12 establishes the external motor-pump, separate hoses/cable and drain outlet. Page14 describes portafilter insertion and left-to-right handle locking. Selected pages rendered, with extracted text for the first 17 pages. |
| S07 | [Installation template](https://au.lamarzocco.com/wp-content/uploads/2023/09/lineapb-install-template.pdf) | `research/catalogs/lineapb-install-template.pdf` | Three-page template, rendered and inspected. Includes counter penetrations and high-leg positions; does not establish internal component coordinates or normal low-foot coordinates. |
| S08 | [Official AV two-group front image](https://www.lamarzocco.com/uk/en/wp-content/uploads/2023/04/linea-pb_av_2-group_front.png) | `research/photos/linea-pb-av-2-group-front.png` | 1600×1065 official image, visually inspected. Identifies fascia, six AV buttons, central display/gauge, external controls, low supports and two groups. |
| S09 | [Official AV two-group angle image](https://www.lamarzocco.com/uk/en/wp-content/uploads/2023/04/linea-pb_av_2-group_angle.png) | `research/photos/linea-pb-av-2-group-angle.png` | 1600×1065 official image, visually inspected. Side silhouette, cup tray, rail, front fascia, separate drain tray and wand curvature. |
| S10 | [Designer CAD archive](https://au.lamarzocco.com/wp-content/uploads/2023/09/linea_pb_2d_3d_CAD.zip) | `research/cad/linea_pb_2d_3d_CAD.zip` | Inspected by the CAD audit workflow. See `docs/asset-audit.md`; an archive name alone is not evidence of independently modeled internals. |
| S11 | [AV DWG archive](https://au.lamarzocco.com/wp-content/uploads/2023/09/LINEA-PB-AV.zip) | See CAD audit | Inspected by the CAD audit workflow. See `docs/asset-audit.md` for available files and actual supported extraction. |

The web PDF reader rejected S02 and S03 for download size; both local downloads succeeded and were parsed with pypdf and rendered with Poppler. No inaccessible catalog is being passed off as inspected.

## Page conventions

Page numbers in manifests refer to the **printed catalog page** unless explicitly marked PDF index. V3.2 printed and one-based PDF pages match. V3.8 contains an inserted page: around the mechanical sections, the one-based PDF page is printed page +1. The V3.8 index still labels coffee boiler assembly at 52, while the actual printed diagram appears at 58. Use the actual inspected page, not the index alone.

| Assembly | V3.2 printed pages | V3.8 printed pages / one-based PDF pages |
| --- | --- | --- |
| Group lower stack | 36 diagram, 37 list | 48 diagram /49 PDF; 49 list /50 PDF |
| AV group cap | 42 diagram, 43 list | 55 diagram /56 PDF; 56-57 lists /57-58 PDF |
| Coffee boiler assembly | 44 diagram, 45 list; 46 diagram, 47 list | 58 diagram /59 PDF; 59 list /60 PDF; 60-61 spare boiler /61-62 PDF |
| Standard steam boiler | 48 diagram, 49 list | 62 diagram /63 PDF; 63-64 lists /64-65 PDF |
| Two-group heating elements | 74 diagram, 75 list | 88 diagram /89 PDF; 89 list /90 PDF |
| Pump/electrical system | 78 diagram, 79 list | 90 diagram /91 PDF; 91-92 lists /92-93 PDF |

## Confirmed dimensional facts

The S01 table and S04 brochure agree on 710mm width, 590mm depth and 533mm overall height for the two-group model. S02/S03 general specification drawings label 530mm height and 460mm body depth as well as 590mm overall depth. The app uses the requested 533mm overall design envelope, and these small conflicts are recorded in `docs/assumptions.md`. The S01/S04 capacities are 3.4L coffee and 7L steam; capacity does not determine a vessel's exact shape.

The group-gasket, cap-gasket, washers, screws and flowmeter seal have dimensions in the catalog part descriptions. Neither the exploded illustrations nor the brochure are dimensioned manufacturing drawings for group housings, boiler ports, frame weldments or pipe centerlines.

## Provenance and rights

All source downloads remain research references. Manufacturer CAD, drawings, logo artwork and photographs are manufacturer material; no permissive redistribution license was found in these downloads. Public availability is not a grant to republish or relicense. The project is a local educational implementation and does not claim manufacturer affiliation. Any hosted distribution of converted CAD or source images needs rights review. The source photos are used for inspection, not as the assembly renderer.

The self-authored reconstructed meshes must retain their accuracy classification and source metadata. A source-supported topology and a matching part number do not turn an inferred mesh into verified CAD.

## Download integrity

SHA-256 hashes of the complete inspected copies:

```text
786b2418f4150f0cf9f953f0cf10f7d731e79e626b13d70dcbd2a39f3ace8e64  LineaPB_Parts_Catalog_V3.2.pdf
bda1fbdab5c4aafe207f9d5f616792146fcbb72c57081f5545e38d3410cb09f8  LineaPB_Parts_Catalog_V3.8.pdf
6cbe6eb6ebdc27e2730b98ffa07cdc44292a590d7ed9e75411135161667e0c4a  linea_pb_brochure.pdf
cb3d8bd0cbf668e495c40a9647a18f97af25b8d63ae396aedaaed115fd558f0a  LineaPB_Operating_Manual_V3.2.pdf
722fe3418ba4ae9ea56b0ae1fd09c67b6b568cc4b2917c99e1eca9ec9cebd7a8  lineapb-install-template.pdf
8817a06cc10907e41ca727d7a8cf5a4a770e618f53abd57efeb1657129e0977b  linea-pb-av-2-group-angle.png
2e6ef2fe10085dcbd9363f8d103576e7ecd84e2a0e7a25e5308efd83d9d06d54  linea-pb-av-2-group-front.png
```
