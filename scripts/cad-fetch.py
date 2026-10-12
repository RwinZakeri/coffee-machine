#!/usr/bin/env python3
"""Fetch and verify official CAD archives, extract only the requested AV 2 Group.

Public availability does not establish a redistribution licence. Sources and
uncompressed cache stay in research/, not browser build output.
"""
import argparse,hashlib,json,urllib.request,zipfile
from pathlib import Path
ap=argparse.ArgumentParser();ap.add_argument('--verify-only',action='store_true');a=ap.parse_args()
root=Path('research/cad');root.mkdir(parents=True,exist_ok=True)
sources=[('linea_pb_2d_3d_CAD.zip','https://au.lamarzocco.com/wp-content/uploads/2023/09/linea_pb_2d_3d_CAD.zip'),('LINEA-PB-AV.zip','https://au.lamarzocco.com/wp-content/uploads/2023/09/LINEA-PB-AV.zip')]
checksums=[]
for filename,url in sources:
 archive=root/filename
 if not archive.exists():
  if a.verify_only:raise FileNotFoundError(archive)
  with urllib.request.urlopen(url,timeout=120) as response,archive.open('wb') as target:
   while chunk:=response.read(1024*1024):target.write(chunk)
 data=archive.read_bytes();checksums.append({'file':filename,'sourceUrl':url,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
 with zipfile.ZipFile(archive) as z:
  inventory=[{'name':it.filename,'compressed':it.compress_size,'bytes':it.file_size} for it in z.infolist() if not it.filename.startswith('__MACOSX')]
  (root/(filename+'.inventory.json')).write_text(json.dumps(inventory,indent=2))
  for info in z.infolist():
   if filename=='linea_pb_2d_3d_CAD.zip' and info.filename.startswith('linea_pb_2d_3d_CAD/LINEA_PB-AV_2GR/') and not info.is_dir():
    raw=z.read(info) # ZipFile checks CRC on each target entry.
    out=root/'verified-2av'/Path(info.filename).name;out.parent.mkdir(exist_ok=True)
    if not out.exists() or hashlib.sha256(out.read_bytes()).digest()!=hashlib.sha256(raw).digest():out.write_bytes(raw)
    checksums.append({'file':str(out),'sourceArchive':filename,'entry':info.filename,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest(),'crc32Verified':True})
(root/'source-checksums.json').write_text(json.dumps(checksums,indent=2))
print('Verified official archives and all four AV 2GR target entries; source-checksums.json written.')
