from pathlib import Path
import json, html, hashlib
B=Path(__file__).resolve().parent.parent
src=B/'Claude原稿/M1-C2-S3/図の仕様.json'
sp=json.loads(src.read_text())['figures'][0]
m=json.loads((B/'制作台帳.json').read_text())
sid=sp['slotId'];slot=next(s for s in m['imageSlots'] if s['id']==sid)
d=B/'図候補'/sid;d.mkdir(parents=True,exist_ok=True)
snap=d/'仕様スナップショット.json';snap.write_text(json.dumps(sp,ensure_ascii=False,indent=2)+'\n')
slot['spec']={'file':str(snap.relative_to(B)),'sha256':hashlib.sha256(snap.read_bytes()).hexdigest(),'source':str(src.relative_to(B))};slot['brief']=sp['purpose']
rows=[('はじめの数','n','5','−4'),('3倍する','3n','15','−12'),('6をたす','3n+6','21','−6'),('3でわる','n+2','7','−2'),('はじめの数をひく','2','2','2')]
def t(x,y,s,size=32,attr=''):
 return f'<text x="{x}" y="{y}" font-size="{size}" text-anchor="middle" {attr}>{html.escape(s)}</text>'
for v in 'ABCD':
 o=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 700" role="img" aria-labelledby="title desc"><title id="title">{html.escape(sp["purpose"])}</title><desc id="desc">{html.escape(sp["altText"])}</desc><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#222"/></marker></defs><rect width="1000" height="700" fill="white"/><g fill="#222" font-family="system-ui,sans-serif">']
 if v=='D':o.append('<rect x="36" y="41" width="930" height="620" rx="18" fill="#ddd"/>')
 o.append('<rect x="30" y="30" width="930" height="620" rx="18" fill="white" stroke="#222"/>')
 centers=[230,500,700,870]
 for x,h in zip(centers,['手順','式','n＝5','n＝−4']):o.append(t(x,90,h,34))
 for x in [400,600,795]:o.append(f'<line x1="{x}" y1="45" x2="{x}" y2="635" stroke="#777" stroke-width="1"/>')
 for i,row in enumerate(rows):
  y=165+i*105
  if v=='C' and i==4:o.append(f'<rect x="410" y="{y-45}" width="535" height="65" rx="12" fill="#eee" stroke="#222" stroke-dasharray="6 5"/>')
  o.append(f'<g data-row="{i}">')
  for j,(x,s) in enumerate(zip(centers,row)):o.append(t(x,y,s,30 if j==0 else 36,f'data-col="{j}"'+(' font-weight="700"' if i==4 else '')))
  o.append('</g>')
  if i<4:o.append(f'<line x1="70" y1="{y+12}" x2="70" y2="{y+70}" stroke="#222" stroke-width="2" marker-end="url(#arrow)" data-step="{i}"/>')
  o.append(f'<line x1="95" y1="{y+35}" x2="945" y2="{y+35}" stroke="#aaa" stroke-width="1"/>')
 if v=='B':o=[s.replace('stroke="#aaa"','stroke="#ddd"') for s in o]
 o.append('</g></svg>')
 f=d/(sid+'-'+v+'.svg');f.write_text('\n'.join(o)+'\n')
 c=next(c for c in slot['candidates'] if c['id']==sid+'-'+v)
 c.update(file=str(f.relative_to(B)),sha256=hashlib.sha256(f.read_bytes()).hexdigest(),status='条件・描画点検前・Claude未選定')
(B/'制作台帳.json').write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
print('数あての式の表：4候補を生成')
