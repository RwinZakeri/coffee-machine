#!/usr/bin/env python3
"""Convert the inspected custom STEP locally, retaining 23 groups and 56 solids.

Run with research/cad/.venv/bin/python. The original STEP and Linea PB assets
are read-only inputs. Output/cache paths never point beside the source file.
"""
import argparse
import hashlib
import json
import time
from pathlib import Path

import numpy as np
import trimesh
from trimesh.visual.material import PBRMaterial
from trimesh.visual.texture import TextureVisuals
from OCP.BRep import BRep_Tool
from OCP.BRepBndLib import BRepBndLib
from OCP.BRepLib import BRepLib_ToolTriangulatedShape
from OCP.BRepGProp import BRepGProp
from OCP.GProp import GProp_GProps
from OCP.BRepMesh import BRepMesh_IncrementalMesh
from OCP.IMeshTools import IMeshTools_Parameters
from OCP.Bnd import Bnd_Box
from OCP.STEPCAFControl import STEPCAFControl_Reader
from OCP.TCollection import TCollection_ExtendedString
from OCP.TDF import TDF_Label
from OCP.TDocStd import TDocStd_Document
from OCP.TopAbs import TopAbs_FACE, TopAbs_SOLID, TopAbs_REVERSED
from OCP.TopExp import TopExp_Explorer
from OCP.TopLoc import TopLoc_Location
from OCP.TopoDS import TopoDS
from OCP.XCAFDoc import XCAFDoc_DocumentTool
from OCP.collections import Sequence_TDF_Label

ROTATION = np.array([[0, 1, 0], [0, 0, 1], [1, 0, 0]], dtype=float)
OFFSET_MM = np.array([13.61664569413712, -2.153657762695405, 111.48336485370967])


def bbox(shape):
    box = Bnd_Box()
    BRepBndLib.AddOptimal_s(shape, box, False, False)
    a, b = box.CornerMin(), box.CornerMax()
    return np.array([[a.X(), a.Y(), a.Z()], [b.X(), b.Y(), b.Z()]])


def mesh_solid(solid, linear, angular):
    mesher = BRepMesh_IncrementalMesh(solid, linear, False, angular, True)
    if not mesher.IsDone():
        raise RuntimeError('Open Cascade meshing failed')
    vertices, indices, normals = [], [], []
    explorer = TopExp_Explorer(solid, TopAbs_FACE)
    while explorer.More():
        face = TopoDS.Face(explorer.Current())
        loc = TopLoc_Location()
        tri = BRep_Tool.Triangulation_s(face, loc)
        if tri is None or tri.NbTriangles() == 0:
            area = GProp_GProps()
            BRepGProp.SurfaceProperties_s(face, area)
            if area.Mass() < 1e-8:
                explorer.Next()
                continue
            # Very thin CAD ribbons can be below the default minimum mesh
            # size. Retry those exact faces with finer explicit controls.
            params = IMeshTools_Parameters()
            params.Deflection = min(linear, .01)
            params.Angle = angular
            params.MinSize = 1e-7
            params.AdjustMinSize = True
            params.ControlSurfaceDeflection = False
            retry = BRepMesh_IncrementalMesh(face, params)
            tri = BRep_Tool.Triangulation_s(face, loc)
            if tri is None or tri.NbTriangles() == 0:
                raise RuntimeError(f'A solid face has no triangulation: area={area.Mass()} mm2; bounds={bbox(face).tolist()}; mesher status={mesher.GetStatusFlags()}; retry={retry.GetStatusFlags()}')
            print(f'  Refined thin face: {area.Mass():.6f} mm2, {tri.NbTriangles()} triangles', flush=True)
        BRepLib_ToolTriangulatedShape.ComputeNormals_s(face, tri)
        transform = loc.Transformation()
        vv, nn, ff = [], [], []
        for i in range(1, tri.NbNodes() + 1):
            p = tri.Node(i).Transformed(transform)
            n = tri.Normal(i).Transformed(transform)
            vv.append([p.X(), p.Y(), p.Z()])
            nn.append([n.X(), n.Y(), n.Z()])
        for i in range(1, tri.NbTriangles() + 1):
            a, b, c = tri.Triangle(i).Get()
            if face.Orientation() == TopAbs_REVERSED:
                b, c = c, b
            ff.append([a - 1, b - 1, c - 1])
        vv, nn, ff = np.asarray(vv), np.asarray(nn), np.asarray(ff)
        cross = np.cross(vv[ff[:, 1]] - vv[ff[:, 0]], vv[ff[:, 2]] - vv[ff[:, 0]])
        # OCCT versions differ in whether stored surface normals account for
        # face orientation. Reconcile against the explicitly oriented winding.
        if np.sum(cross * nn[ff].mean(axis=1)) < 0:
            nn *= -1
        start = len(vertices)
        vertices.extend(vv)
        normals.extend(nn)
        indices.extend(ff + start)
        explorer.Next()
    v, n, f = np.asarray(vertices), np.asarray(normals), np.asarray(indices)
    assert len(f) and np.isfinite(v).all() and np.isfinite(n).all()
    assert np.min(np.linalg.norm(n, axis=1)) > .99
    return v, f, n


def material_key(part, solid_name):
    if part == 'espresso display glass ':
        return 'smoked-glass'
    if part in ('espresso unit cover', 'espresso right sheet pannel'):
        return 'graphite-enamel'
    if part == 'espresso display base':
        return 'display-housing'
    if part in ('espresso portafilter', 'espresso lever full parts'):
        # Authored finishes, never recovered CAD materials. B-rep extents
        # identify the long handle and end cap; retain metal on wheel/linkage.
        handles = ('Part1.1', 'Part2.1\\\\PartBody') if part == 'espresso portafilter' else ('Part2.1', 'Part3.1\\\\PartBody')
        if solid_name in handles:
            return 'handle-polymer'
        return 'polished-metal'
    if part == 'espresso headgroup':
        return 'polished-metal'
    return 'brushed-steel'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, default=Path('/Users/rwiiinzz/Downloads/espressu unit all parts.stp'))
    parser.add_argument('--output', type=Path, default=Path('public/models/custom-espresso'))
    parser.add_argument('--reference', type=Path, default=Path('research/cad/custom-espresso/machine-uncompressed.glb'))
    parser.add_argument('--inspection', type=Path, default=Path('docs/custom-machine-investigation/inspection.json'))
    parser.add_argument('--deflection', type=float, default=.20)
    parser.add_argument('--angular', type=float, default=.25)
    args = parser.parse_args()
    started = time.time()
    audit = json.loads(args.inspection.read_text())
    source_hash = hashlib.sha256(args.source.read_bytes()).hexdigest()
    if source_hash != audit['source']['sha256']:
        raise ValueError('Source changed: re-inspect it before using the source-specific mapping')
    if args.output.resolve() == Path('public/models/linea-pb').resolve():
        raise ValueError('Refusing to overwrite the old model')
    doc = TDocStd_Document(TCollection_ExtendedString('CustomEspresso'))
    reader = STEPCAFControl_Reader()
    reader.SetNameMode(True)
    reader.SetColorMode(True)
    print('Reading custom STEP locally', flush=True)
    assert int(reader.ReadFile(str(args.source))) == 1
    assert reader.Transfer(doc)
    tool = XCAFDoc_DocumentTool.ShapeTool_s(doc.Main())
    roots = Sequence_TDF_Label()
    tool.GetFreeShapes(roots)
    assert roots.Length() == 1
    children = Sequence_TDF_Label()
    tool.GetComponents_s(roots.Value(1), children)
    assert children.Length() == 23

    palette = {
        'graphite-enamel': ([39, 46, 48, 255], .42, .27),
        'display-housing': ([13, 20, 22, 255], .25, .32),
        'brushed-steel': ([182, 190, 193, 255], .93, .30),
        'polished-metal': ([208, 216, 218, 255], .98, .18),
        'handle-polymer': ([23, 26, 26, 255], .02, .46),
        'smoked-glass': ([47, 69, 72, 90], .05, .14),
    }
    materials = {key: PBRMaterial(name=key, baseColorFactor=color, metallicFactor=metal,
                                 roughnessFactor=rough, doubleSided=False,
                                 alphaMode='BLEND' if key == 'smoked-glass' else 'OPAQUE')
                 for key, (color, metal, rough) in palette.items()}
    scene = trimesh.Scene(base_frame='CustomEspresso')
    records, totals, actual_bounds = [], [], []
    for i, source in enumerate(audit['sourceComponents']):
        label = children.Value(i + 1)
        shape = tool.GetShape_s(label)
        expected = np.array(source['sourceBoundsMm']).reshape(2, 3)
        measured = bbox(shape)
        assert np.max(np.abs(measured - expected)) < 1e-5, source['part']
        # Product-level auxiliary curves are retained in source metadata only.
        # In particular, the lever sketch extends 4 mm outside its real solids.
        render_boxes = []
        solid_explorer = TopExp_Explorer(shape, TopAbs_SOLID)
        while solid_explorer.More():
            render_boxes.append(bbox(solid_explorer.Current()))
            solid_explorer.Next()
        solid_bounds = np.array([np.min([b[0] for b in render_boxes], axis=0),
                                 np.max([b[1] for b in render_boxes], axis=0)])
        target_bounds = (solid_bounds[:, [1, 2, 0]] - OFFSET_MM) * .001
        center = target_bounds.mean(axis=0)
        node_name = f"component_{source['sourceProduct']['entity']:06d}"
        placement = np.eye(4)
        placement[:3, 3] = center
        scene.graph.update(frame_to=node_name, frame_from=scene.graph.base_frame, matrix=placement,
                           metadata={'sourceName': source['part'], 'sourceProductId': source['sourceProduct']['entity']})
        solids = TopExp_Explorer(shape, TopAbs_SOLID)
        solid_records, component_mesh_bounds, count, triangles = [], [], 0, 0
        while solids.More():
            solid = TopoDS.Solid(solids.Current())
            v, f, n = mesh_solid(solid, args.deflection, args.angular)
            mapped = (v @ ROTATION.T - OFFSET_MM) * .001
            normal = n @ ROTATION.T
            actual_bounds.append(np.array([mapped.min(axis=0), mapped.max(axis=0)]))
            component_mesh_bounds.append(actual_bounds[-1])
            solid_name = source['solidNames'][count]
            material = material_key(source['part'], solid_name)
            mesh_name = f"{node_name}_solid_{source['solidIds'][count]}"
            mesh = trimesh.Trimesh(vertices=mapped - center, faces=f, vertex_normals=normal, process=False)
            mesh.visual = TextureVisuals(material=materials[material])
            mesh.metadata = {'sourceName': solid_name, 'sourceSolidId': source['solidIds'][count], 'sourceProductId': source['sourceProduct']['entity']}
            scene.add_geometry(mesh, node_name=mesh_name, geom_name=mesh_name, parent_node_name=node_name)
            solid_records.append({'nodeName': mesh_name, 'sourceSolidId': source['solidIds'][count],
                                  'sourceName': solid_name, 'triangleCount': len(f), 'materialGroup': material})
            count += 1
            triangles += len(f)
            solids.Next()
        assert count == source['solidCount'], source['part']
        mesh_box = np.array([np.min([b[0] for b in component_mesh_bounds], axis=0),
                             np.max([b[1] for b in component_mesh_bounds], axis=0)])
        component_error = float(np.max(np.abs(mesh_box - target_bounds)))
        assert component_error < args.deflection * .001 + 1e-6, (source['part'], component_error)
        totals.append(triangles)
        print(f"{i+1}/23 {source['part']}: {count} solids, {triangles:,} triangles", flush=True)
        records.append({'nodeName': node_name, 'sourceName': source['part'],
                        'sourceProductId': source['sourceProduct']['entity'], 'sourceProductFields': source['sourceProduct']['productFields'],
                        'position': center.tolist(), 'quaternion': [0, 0, 0, 1], 'scale': [1, 1, 1],
                        'bounds': {'min': target_bounds[0].tolist(), 'max': target_bounds[1].tolist()},
                        'sourceBoundsMm': source['sourceBoundsMm'], 'sourceSolidBoundsMm': solid_bounds.tolist(),
                        'meshBounds': {'min': mesh_box[0].tolist(), 'max': mesh_box[1].tolist()},
                        'maximumTessellationEnvelopeErrorM': component_error,
                        'sourcePath': ['espressu unit all parts', source['part']],
                        'sourcePlacement': source['assemblyAxes'], 'solidCount': count,
                        'triangleCount': triangles, 'solids': solid_records, 'accuracyStatus': 'Verified CAD'})
    assert len(records) == 23 and sum(p['solidCount'] for p in records) == 56
    args.output.mkdir(parents=True, exist_ok=True)
    args.reference.parent.mkdir(parents=True, exist_ok=True)
    glb = scene.export(file_type='glb', include_normals=True)
    args.reference.write_bytes(glb)
    (args.output / 'machine.glb').write_bytes(glb)
    b = np.asarray(audit['coordinates']['sourceBoundsMm']).reshape(2, 3)[:, [1, 2, 0]]
    b = (b - OFFSET_MM) * .001
    mesh_bounds = np.array([np.min([x[0] for x in actual_bounds], axis=0), np.max([x[1] for x in actual_bounds], axis=0)])
    bound_error = float(np.max(np.abs(mesh_bounds - b)))
    if bound_error > args.deflection * .001 + 1e-6:
        raise RuntimeError(f'Tessellation envelope error exceeds deflection: {bound_error}')
    index = {'modelId': 'custom-espresso', 'assetPath': '/models/custom-espresso/machine.glb',
             'sourceName': args.source.name, 'sourceSha256': source_hash, 'units': 'metres',
             'coordinateSystem': '+X width/right, +Y up, +Z front; lowest modeled surface Y=0',
             'sourceToRuntime': {'rotation': ROTATION.tolist(), 'subtractAfterRotationMm': OFFSET_MM.tolist(), 'scale': .001},
             'bounds': {'min': b[0].tolist(), 'max': b[1].tolist()}, 'dimensions': (b[1] - b[0]).tolist(),
             'meshBounds': {'min': mesh_bounds[0].tolist(), 'max': mesh_bounds[1].tolist()},
             'maximumTessellationEnvelopeErrorM': bound_error, 'componentCount': 23, 'meshCount': 56, 'solidCount': 56,
             'triangleCount': sum(totals), 'assetBytes': len(glb), 'uncompressedAssetBytes': len(glb),
             'deflectionMm': args.deflection, 'angularDeflectionRadians': args.angular,
             'materialNote': 'Authored visualization finishes; source STEP contains no colors or materials.',
             'geometryNote': 'Actual source solids and occurrences retained. No invented geometry. Curves excluded. Components are rigid presentation units, not certified mechanisms.',
             'conversionSeconds': time.time() - started, 'parts': records}
    (args.output / 'asset-index.json').write_text(json.dumps(index, indent=2) + '\n')
    print(json.dumps({'components': 23, 'solids': 56, 'triangles': sum(totals), 'bytes': len(glb),
                      'maxBoundsErrorMm': bound_error * 1000, 'seconds': time.time() - started}), flush=True)


if __name__ == '__main__':
    main()
