#!/usr/bin/env python3
"""Inspect component-level AP203 STEP hierarchy using OpenCascade XCAF."""
import argparse,json,time
from pathlib import Path
from OCP.STEPCAFControl import STEPCAFControl_Reader
from OCP.TDocStd import TDocStd_Document
from OCP.TCollection import TCollection_ExtendedString
from OCP.XCAFDoc import XCAFDoc_DocumentTool
from OCP.TDF import TDF_Label
from OCP.collections import Sequence_TDF_Label as TDF_LabelSequence
from OCP.TDataStd import TDataStd_Name
from OCP.TopLoc import TopLoc_Location
from OCP.Bnd import Bnd_Box
from OCP.BRepBndLib import BRepBndLib
from OCP.TopAbs import TopAbs_SOLID,TopAbs_FACE
from OCP.TopExp import TopExp_Explorer
from OCP.BRep import BRep_Builder
from OCP.BRepTools import BRepTools
from OCP.TopoDS import TopoDS_Shape

def label_name(label):
    attr=TDataStd_Name()
    return attr.Get().ToExtString() if label.FindAttribute(TDataStd_Name.GetID_s(),attr) else ''

def count(shape,typ):
    e=TopExp_Explorer(shape,typ);n=0
    while e.More():n+=1;e.Next()
    return n

def read_step(path):
    path=Path(path);cache=path.parent/'.ocp-cache';cache_index=cache/'index.json'
    signature={'bytes':path.stat().st_size,'mtime':path.stat().st_mtime_ns}
    if cache_index.exists():
        cached=json.loads(cache_index.read_text())
        if cached.get('signature')==signature:
            print('Reading cached OpenCascade BREP occurrences',flush=True);leaves=[]
            for i,p in enumerate(cached['parts']):
                shape=TopoDS_Shape()
                if not BRepTools.Read_s(shape,str(cache/f'{i:03d}.brep'),BRep_Builder()):raise ValueError('Corrupt BREP cache')
                leaves.append(dict(p,shape=shape))
            return None,leaves,cached['assemblies']
    doc=TDocStd_Document(TCollection_ExtendedString('LineaPB'))
    reader=STEPCAFControl_Reader();reader.SetNameMode(True);reader.SetColorMode(True)
    print('Reading STEP',path,flush=True)
    if int(reader.ReadFile(str(path)))!=1:raise ValueError('STEP read failed')
    print('Transferring STEP assembly',flush=True)
    if not reader.Transfer(doc):raise ValueError('STEP transfer failed')
    print('Walking XCAF hierarchy',flush=True)
    tool=XCAFDoc_DocumentTool.ShapeTool_s(doc.Main())
    roots=TDF_LabelSequence();tool.GetFreeShapes(roots)
    leaves=[];assemblies=[]
    def visit(label,parent_loc,path):
        loc=parent_loc.Multiplied(tool.GetLocation_s(label))
        ref=TDF_Label()
        definition=ref if tool.GetReferredShape_s(label,ref) else label
        name=label_name(definition) or label_name(label)
        path=path+[name]
        children=TDF_LabelSequence()
        if tool.GetComponents_s(definition,children):
            assemblies.append({'name':name,'path':path,'children':children.Length()})
            for i in range(1,children.Length()+1):visit(children.Value(i),loc,path)
        else:
            shape=tool.GetShape_s(definition).Moved(loc)
            box=Bnd_Box();BRepBndLib.Add_s(shape,box)
            if box.IsVoid():return
            mi=box.CornerMin();ma=box.CornerMax();b=[mi.X(),mi.Y(),mi.Z(),ma.X(),ma.Y(),ma.Z()];leaves.append({'name':name,'instanceName':label_name(label),'path':path,'bounds':{'min':b[:3],'max':b[3:]},'solids':count(shape,TopAbs_SOLID),'faces':count(shape,TopAbs_FACE),'shape':shape})
    for i in range(1,roots.Length()+1):visit(roots.Value(i),TopLoc_Location(),[])
    cache.mkdir(exist_ok=True)
    for i,p in enumerate(leaves):BRepTools.Write_s(p['shape'],str(cache/f'{i:03d}.brep'))
    cache_index.write_text(json.dumps({'signature':signature,'parts':[{k:v for k,v in p.items() if k!='shape'} for p in leaves],'assemblies':assemblies},indent=2))
    return doc,leaves,assemblies

if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('source',nargs='?',default='research/cad/verified-2av/LINEA-PB-AV_2GR.STEP');ap.add_argument('--output',default='research/cad/verified-2av/xcaf-inventory.json');a=ap.parse_args()
    started=time.time();doc,leaves,assemblies=read_step(a.source)
    data={'source':str(a.source),'units':'mm','conversionSeconds':time.time()-started,'assemblies':assemblies,'parts':[{k:v for k,v in p.items() if k!='shape'} for p in leaves]}
    Path(a.output).write_text(json.dumps(data,indent=2));print('Components:',len(leaves),'Assemblies:',len(assemblies),'Solids:',sum(p['solids'] for p in leaves),'Faces:',sum(p['faces'] for p in leaves),flush=True)
    for i,p in enumerate(leaves): print(i,p['name'],p['bounds'],flush=True)
