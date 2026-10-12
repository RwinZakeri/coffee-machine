#!/usr/bin/env python3
"""Convert official 2GR AV STEP occurrences to independently movable local GLB nodes.

Run in research/cad/.venv; cadquery-ocp, its VTK binary dependency, numpy and
trimesh are required. Source geometry is proprietary; output is local preview.
"""
import argparse,json,re,time,hashlib
from pathlib import Path
import numpy as np
import trimesh
from trimesh.visual.material import PBRMaterial
from trimesh.visual.texture import TextureVisuals
from OCP.BRepMesh import BRepMesh_IncrementalMesh
from OCP.TopExp import TopExp_Explorer
from OCP.TopAbs import TopAbs_FACE,TopAbs_REVERSED
from OCP.TopoDS import TopoDS
from OCP.TopLoc import TopLoc_Location
from OCP.BRep import BRep_Tool
import importlib.util
spec=importlib.util.spec_from_file_location('cad_inspect',Path(__file__).with_name('cad-inspect.py'))
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
read_step=module.read_step

# cad-inspect.py is deliberately executable and also loaded as a module here.

def mesh_shape(shape,linear,angular):
    mesher=BRepMesh_IncrementalMesh(shape,linear,False,angular,True)
    vertices=[];faces=[];explorer=TopExp_Explorer(shape,TopAbs_FACE)
    while explorer.More():
        face=TopoDS.Face(explorer.Current());loc=TopLoc_Location()
        tri=BRep_Tool.Triangulation_s(face,loc)
        if tri is not None:
            offset=len(vertices);transform=loc.Transformation()
            for j in range(1,tri.NbNodes()+1):
                v=tri.Node(j).Transformed(transform);vertices.append([v.X(),v.Y(),v.Z()])
            for j in range(1,tri.NbTriangles()+1):
                a,b,c=tri.Triangle(j).Get()
                if face.Orientation()==TopAbs_REVERSED:b,c=c,b
                faces.append([offset+a-1,offset+b-1,offset+c-1])
        explorer.Next()
    return np.asarray(vertices,dtype=np.float64),np.asarray(faces,dtype=np.int64)

def material_group(name):
    n=name.lower()
    if any(w in n for w in ('gasket','guarnizione','silicone')):return 'rubber'
    if any(w in n for w in ('plastic','handle','knob','l111','l113','tasto')):return 'black-polymer'
    if any(w in n for w in ('nle','connettore','scatolina','display')):return 'electronics'
    if n.startswith('c.1.') and any(w in n for w in ('sheet','c.1.142','c.1.143','c.1.144','c.1.145','c.1.147')):return 'white-enamel'
    return 'stainless'

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--source',default='research/cad/verified-2av/LINEA-PB-AV_2GR.STEP');ap.add_argument('--output',default='public/models/linea-pb');ap.add_argument('--deflection',type=float,default=0.6);ap.add_argument('--angular',type=float,default=0.35);ap.add_argument('--axis-map',choices=['auto','xyz','xz-y','-xyz'],default='auto');a=ap.parse_args()
    started=time.time();source=Path(a.source);out=Path(a.output);out.mkdir(parents=True,exist_ok=True)
    doc,parts,assemblies=read_step(source)
    matrices={'xyz':np.eye(3),'xz-y':np.array([[1,0,0],[0,0,1],[0,-1,0]]),'-xyz':np.array([[-1,0,0],[0,1,0],[0,0,-1]])}
    source_min=np.min([p['bounds']['min'] for p in parts],axis=0);source_max=np.max([p['bounds']['max'] for p in parts],axis=0)
    dimensions=source_max-source_min
    if a.axis_map=='auto':a.axis_map='xz-y' if abs(dimensions[2]-533)<abs(dimensions[1]-533) else 'xyz'
    rotation=matrices[a.axis_map];records=[];raw=[];total_triangles=0
    print('SOURCE BOUNDS',source_min.tolist(),source_max.tolist(),'DIMENSIONS',dimensions.tolist(),'AXIS MAP',a.axis_map,flush=True)
    inventory={'source':str(source),'units':'mm','assemblies':assemblies,'parts':[{k:v for k,v in p.items() if k!='shape'} for p in parts]}
    Path('research/cad/verified-2av/xcaf-inventory.json').write_text(json.dumps(inventory,indent=2))
    seen_geometry={};duplicate_instances=[]
    for i,part in enumerate(parts):
        v,f=mesh_shape(part['shape'],a.deflection,a.angular)
        if not len(f):continue
        geometry_key=hashlib.sha256(np.round(v,7).tobytes()+f.tobytes()).hexdigest()
        if geometry_key in seen_geometry:
            duplicate_instances.append({'sourceName':part['name'],'coincidentWithSourceName':seen_geometry[geometry_key]});continue
        seen_geometry[geometry_key]=part['name']
        mapped=v@rotation.T*0.001
        raw.append((part,mapped,f));total_triangles+=len(f)
        print(f"Tessellated {i+1}/{len(parts)} {part['name']}: {len(f):,} triangles",flush=True)
    all_min=np.min([v.min(axis=0) for p,v,f in raw],axis=0);all_max=np.max([v.max(axis=0) for p,v,f in raw],axis=0)
    offset=np.array([(all_min[0]+all_max[0])/2,all_min[1],(all_min[2]+all_max[2])/2])
    scene=trimesh.Scene();palette={'stainless':([196,205,209,255],0.94,0.27),'white-enamel':([231,231,221,255],0.18,0.24),'black-polymer':([17,20,22,255],0.1,0.42),'rubber':([10,12,12,255],0.0,0.77),'electronics':([42,49,44,255],0.2,0.44)}
    materials={k:PBRMaterial(name=k,baseColorFactor=c,metallicFactor=m,roughnessFactor=r,doubleSided=False) for k,(c,m,r) in palette.items()}
    for i,(p,v,f) in enumerate(raw):
        v-=offset;bmin=v.min(axis=0);bmax=v.max(axis=0);center=(bmin+bmax)/2;v-=center
        token=re.sub(r'[^a-zA-Z0-9_]+','_',p['name']).strip('_')[:100];node=f'cad_{i:03d}_{token}'
        group=material_group(p['name'])
        # CAD faces retain separate seam vertices; angle-weighted normals smooth each surface without blurring its sharp boundaries.
        triangles=v[f];cross=np.cross(triangles[:,1]-triangles[:,0],triangles[:,2]-triangles[:,0]);length=np.linalg.norm(cross,axis=1);face_normals=cross/np.maximum(length[:,None],1e-20)
        angles=trimesh.triangles.angles(triangles);vertex_normals=np.zeros_like(v)
        np.add.at(vertex_normals,f.reshape(-1),np.repeat(face_normals,3,axis=0)*angles.reshape(-1,1))
        vertex_normals/=np.maximum(np.linalg.norm(vertex_normals,axis=1)[:,None],1e-20)
        mesh=trimesh.Trimesh(vertices=v,faces=f,vertex_normals=vertex_normals,process=False)
        mesh.visual=TextureVisuals(material=materials[group]);mesh.metadata={'sourceName':p['name'],'accuracyStatus':'verified-cad','sourcePath':p['path']}
        transform=np.eye(4);transform[:3,3]=center
        scene.add_geometry(mesh,node_name=node,geom_name=node,transform=transform)
        records.append({'nodeName':node,'sourceName':p['name'],'instanceName':p['instanceName'],'sourceHierarchy':p['path'],'sourcePath':p['path'],'position':center.tolist(),'quaternion':[0,0,0,1],'scale':[1,1,1],'bounds':{'min':bmin.tolist(),'max':bmax.tolist()},'localBounds':{'min':(bmin-center).tolist(),'max':(bmax-center).tolist()},'sourceBoundsMm':p['bounds'],'materialGroup':group,'triangleCount':len(f),'accuracyStatus':'verified-cad','sourceUrl':'https://au.lamarzocco.com/wp-content/uploads/2023/09/linea_pb_2d_3d_CAD.zip'})
    glb=scene.export(file_type='glb',include_normals=True)
    (out/'machine.glb').write_bytes(glb)
    index={'assetPath':'/models/linea-pb/machine.glb','configuration':'Linea PB AV 2 Group','sourceFile':source.name,'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'units':'metres','axisMap':a.axis_map,'coordinateSystem':'+X width, +Y height, +Z front; foot plane Y=0','sourceToRuntimeRotation':rotation.tolist(),'sourceRecenterOffsetMetres':offset.tolist(),'bounds':{'min':(all_min-offset).tolist(),'max':(all_max-offset).tolist()},'duplicateCoincidentOccurrencesRemoved':duplicate_instances,'triangleCount':total_triangles,'meshCount':len(records),'assetBytes':len(glb),'deflectionMm':a.deflection,'angularDeflectionRadians':a.angular,'conversionSeconds':time.time()-started,'license':'Proprietary La Marzocco source. Local development preview only; no redistribution license established.','materialNote':'Material categories inferred for visualization; black-and-white exterior is user requested customization, not CAD source color.','parts':records}
    (out/'asset-index.json').write_text(json.dumps(index,indent=2))
    print(f"Exported {len(records)} nodes, {total_triangles:,} triangles, {len(glb):,} bytes in {time.time()-started:.1f}s; bounds {index['bounds']}",flush=True)

if __name__=='__main__':main()
