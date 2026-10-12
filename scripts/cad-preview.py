#!/usr/bin/env python3
"""Make a quick orthographic software preview of the actual exported CAD mesh.
This is QA output, not an application asset or substitute for the WebGL scene.
"""
import argparse
from pathlib import Path
import numpy as np
import trimesh
from PIL import Image,ImageDraw
ap=argparse.ArgumentParser();ap.add_argument('--output',default='research/cad/verified-2av/mesh-preview.png');ap.add_argument('--input',default='research/cad/verified-2av/runtime-uncompressed/machine.glb');a=ap.parse_args()
scene=trimesh.load(a.input,force='scene',process=False)
size=(1800,1300);scale=1700;center=np.array([0,.28,0]);eye=np.array([1,.65,1.7]);eye/=np.linalg.norm(eye);right=np.cross([0,1,0],eye);right/=np.linalg.norm(right);up=np.cross(eye,right);light=np.array([.4,.9,.7]);light/=np.linalg.norm(light)
triangles=[];depths=[];colors=[]
for name in scene.graph.nodes_geometry:
    transform,geometry=scene.graph[name];m=scene.geometry[geometry];v=trimesh.transform_points(m.vertices,transform);tri=v[m.faces];e1=tri[:,1]-tri[:,0];e2=tri[:,2]-tri[:,0];n=np.cross(e1,e2);n/=np.maximum(np.linalg.norm(n,axis=1)[:,None],1e-20)
    visible=n@eye>0
    tri=tri[visible];n=n[visible];projected=np.stack(((tri-center)@right*scale+size[0]/2,-(tri-center)@up*scale+size[1]/2),axis=-1)
    d1=projected[:,1]-projected[:,0];d2=projected[:,2]-projected[:,0];area=np.abs(d1[:,0]*d2[:,1]-d1[:,1]*d2[:,0]);keep=area>.4;projected=projected[keep];tri=tri[keep];n=n[keep]
    base=np.array(m.visual.material.baseColorFactor[:3]);shading=np.clip(.36+np.maximum(n@light,0)*.62,0,1)
    color=np.clip(base[None,:]*shading[:,None],0,255).astype('uint8')
    triangles.append(projected);depths.append(tri.mean(axis=1)@eye);colors.append(color)
projected=np.concatenate(triangles);depth=np.concatenate(depths);color=np.concatenate(colors)
im=Image.new('RGB',size,(217,216,211));draw=ImageDraw.Draw(im)
for i in np.argsort(depth):draw.polygon([tuple(v) for v in projected[i]],fill=tuple(color[i]))
Path(a.output).parent.mkdir(parents=True,exist_ok=True);im.save(a.output);print('Saved QA preview',a.output,'triangles drawn',len(projected))
