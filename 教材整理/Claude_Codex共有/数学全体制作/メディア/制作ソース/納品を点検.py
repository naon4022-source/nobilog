from pathlib import Path
import subprocess,re,hashlib,json,xml.etree.ElementTree as ET
from PIL import Image
root=Path(__file__).resolve().parents[1]
ff=Path('/tmp/nobilog-media-tools/imageio_ffmpeg/binaries/ffmpeg-macos-x86_64-v7.1')
blocks=json.loads((root/'制作ソース/依頼台帳_1件ずつ.json').read_text())
report=[]
for d in (v for v in blocks if v.get('scope')=='main'):
 ext={'動画':'mp4','図解':'svg','場面の絵':'jpg'}[d['kind']];p=root/(d['id']+'.'+ext)
 if not p.exists():continue
 item={'id':d['id'],'file':p.name,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
 if ext=='mp4':
  duration=int(re.search(r'・(\d+)秒',d['spec'])[1]);x=subprocess.run([str(ff),'-i',str(p),'-f','framemd5','-'],capture_output=True,text=True)
  assert x.returncode==0,(p.name,x.stderr[-500:]);frames=[s for s in x.stdout.splitlines() if s and not s.startswith('#')]
  assert len(frames)==duration*12,(p.name,len(frames),duration*12)
  assert 'h264' in x.stderr and '1280x720' in x.stderr and item['bytes']<=3_000_000,p.name
  item.update(fullDecode=True,frames=len(frames),duration=duration,format='H.264 1280×720')
 elif ext=='svg':
  svg=ET.parse(p).getroot();assert svg.attrib['viewBox']=='0 0 1600 900',p.name
  assert all(float(t.attrib.get('font-size',40))>=40 for t in svg.iter() if t.tag.endswith('text')),p.name
  item.update(xml=True,viewBox='1600×900')
 else:
  with Image.open(p) as im:assert im.size==(1600,900) and im.format=='JPEG',p.name
  item.update(dimensions='1600×900')
 report.append(item)
(root/'制作ソース/機械点検_新仕様.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(f'{len(report)} deliveries checked; every video fully decoded')
