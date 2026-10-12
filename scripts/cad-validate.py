#!/usr/bin/env python3
"""Validate local GLB node contracts and finite, metre-scale assembled bounds."""
import json,struct,math
from pathlib import Path
asset_dir=Path('public/models/linea-pb')
index=json.loads((asset_dir/'asset-index.json').read_text())
b=(asset_dir/'machine.glb').read_bytes()
magic,version,length=struct.unpack_from('<4sII',b)
assert magic==b'glTF' and version==2 and length==len(b)
chunk_len,chunk_type=struct.unpack_from('<II',b,12)
assert chunk_type==0x4E4F534A
schema=json.loads(b[20:20+chunk_len])
nodes={n['name']:n for n in schema['nodes'] if 'mesh' in n}
assert len(nodes)==len(index['parts']), (len(nodes),len(index['parts']))
assert len({p['nodeName'] for p in index['parts']})==len(index['parts'])
for p in index['parts']:
 n=nodes[p['nodeName']]
 assert all(math.isfinite(v) for v in p['position'])
 assert all(math.isfinite(v) for k in ('min','max') for v in p['bounds'][k])
 if 'matrix' in n:
  actual=[n['matrix'][12],n['matrix'][13],n['matrix'][14]]
 else:actual=n.get('translation',[0,0,0])
 assert all(abs(a-b)<1e-8 for a,b in zip(actual,p['position'])),p['nodeName']
 assert p['quaternion']==[0,0,0,1] and p['scale']==[1,1,1]
 for low,high in zip(p['bounds']['min'],p['bounds']['max']):assert low<=high
assert index['bounds']['min'][1]==0
width=index['bounds']['max'][0]-index['bounds']['min'][0]
height=index['bounds']['max'][1]-index['bounds']['min'][1]
assert .69<width<.73, width
assert .51<height<.55, height
print(f"Validated {len(nodes)} independent nodes; {index['triangleCount']:,} triangles; width={width:.4f}m height={height:.4f}m; all assembled positions match GLB.")
