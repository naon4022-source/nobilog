from pathlib import Path
import json,html,hashlib
B=Path(__file__).resolve().parent.parent
src=B/'Claude原稿/M1-C3-S1/図の仕様.json';m=json.loads((B/'制作台帳.json').read_text())
def t(x,y,s,size=34,attr=''):
 return f'<text x="{x}" y="{y}" font-size="{size}" text-anchor="middle" {attr}>{html.escape(s)}</text>'
def line(x1,y1,x2,y2,attr=''):
 return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="#222" stroke-width="2" {attr}/>'
for sp in json.loads(src.read_text())['figures']:
 sid=sp['slotId'];slot=next(s for s in m['imageSlots'] if s['id']==sid)
 d=B/'図候補'/sid;d.mkdir(parents=True,exist_ok=True)
 snap=d/'仕様スナップショット.json';snap.write_text(json.dumps(sp,ensure_ascii=False,indent=2)+'\n')
 slot['spec']={'file':str(snap.relative_to(B)),'sha256':hashlib.sha256(snap.read_bytes()).hexdigest(),'source':str(src.relative_to(B))};slot['brief']=sp['purpose']
 for v in 'ABCD':
  o=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 700" role="img" aria-labelledby="title desc"><title id="title">{html.escape(sp["purpose"])}</title><desc id="desc">{html.escape(sp["altText"])}</desc><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#222"/></marker></defs><rect width="1000" height="700" fill="white"/><g fill="#222" font-family="system-ui,sans-serif">']
  if v=='D':o.append('<rect x="36" y="41" width="930" height="620" rx="18" fill="#ddd"/>')
  o.append('<rect x="30" y="30" width="930" height="620" rx="18" fill="white" stroke="#222"/>')
  if sid.endswith('01'):
   xs=[150,405,655,865]
   for x,s in zip(xs,['x','左辺 3x−5','右辺 x+3','等しい？']):o.append(t(x,95,s,32))
   for x in range(1,7):
    y=155+(x-1)*85
    if x==4:o.append(f'<rect x="65" y="{y-45}" width="870" height="70" rx="8" fill="'+('#eee' if v=='C' else 'white')+'" stroke="#222" stroke-width="4" data-equal-row="4"/>')
    o.append(f'<g data-row="{x}">')
    for j,(cx,s) in enumerate(zip(xs,[str(x),str(3*x-5).replace('-','−'),str(x+3),'○' if x==4 else ''])):
     if s:o.append(t(cx,y,s,36,f'data-col="{j}"'))
    o.append('</g>')
    if x!=4:o.append(line(70,y+28,930,y+28,'stroke-dasharray="2 4"'))
  elif sid.endswith('02'):
   o.append(t(500,75,'両方から30gを取る',34))
   for row,y in enumerate([220,520]):
    o.append(f'<g data-row="{row}">')
    o.append(line(180,y,820,y,'data-beam="true"'))
    o.append(f'<path d="M500 {y} L475 {y+90} H525 Z" fill="white" stroke="#222"/>')
    for x in [290,710]:
     o.append(line(x,y,x,y+20));o.append(line(x-100,y+20,x+100,y+20))
    if row==0:
     o.append(f'<rect x="200" y="{y-100}" width="100" height="100" fill="white" stroke="#222"/>');o.append(t(250,y-38,'x',40))
     o.append(f'<rect x="320" y="{y-80}" width="100" height="80" fill="white" stroke="#222"/>');o.append(t(370,y-28,'30g',32,'data-weight="30"'))
    else:
     o.append(f'<rect x="240" y="{y-100}" width="100" height="100" fill="white" stroke="#222"/>');o.append(t(290,y-38,'x',40))
    w=80 if row==0 else 50
    o.append(f'<rect x="660" y="{y-100}" width="120" height="100" fill="white" stroke="#222"/>');o.append(t(720,y-38,f'{w}g',36,f'data-weight="{w}"'))
    o.append('</g>')
   for x in [290,710]:
    o.append(line(x,280,x,395,'marker-end="url(#arrow)" data-remove="30"'))
    o.append(t(x+(-100 if x<500 else 100),350,'−30g',32))
   o.append(t(500,642,'x+30＝80 → x＝50',32))
  else:
   o.append(line(500,70,500,620,'stroke-dasharray="6 6"'))
   o.append(t(265,100,'両辺に7をたす',32));o.append(t(745,100,'移項',32))
   for col,(cx,vals) in enumerate([(265,['5x−7＝18','5x−7+7＝18+7','5x＝25','x＝5']),(745,['5x−7＝18','5x＝18+7','5x＝25','x＝5'])]):
    for i,(y,s) in enumerate(zip([210,385,505,605],vals)):
     o.append(t(cx,y,s,34,f'data-col="{col}" data-stage="{i}"'))
     if i<3 and not (col==1 and i==0):o.append(line(cx,y+20,cx,([210,385,505,605][i+1])-45,'marker-end="url(#arrow)"'))
   # Above-line start under −7; end above +7 in the next equation.
   o.append('<path d="M720 220 C920 235 930 310 797 345" fill="none" stroke="#222" stroke-width="3" marker-end="url(#arrow)" data-transfer="true"/>')
   o.append(t(785,280,'符号が変わる',28))
  if v=='B':o=[s.replace('stroke-width="2"','stroke-width="1"') for s in o]
  if v=='C' and sid.endswith('02'):o.append('<rect x="120" y="315" width="140" height="45" rx="7" fill="none" stroke="#222" stroke-dasharray="7 6"/><rect x="740" y="315" width="140" height="45" rx="7" fill="none" stroke="#222" stroke-dasharray="7 6"/>')
  if v=='C' and sid.endswith('03'):o.append('<rect x="120" y="467" width="290" height="55" rx="7" fill="none" stroke="#222" stroke-dasharray="7 6"/><rect x="600" y="467" width="290" height="55" rx="7" fill="none" stroke="#222" stroke-dasharray="7 6"/>')
  o.append('</g></svg>')
  f=d/(sid+'-'+v+'.svg');f.write_text('\n'.join(o)+'\n')
  c=next(c for c in slot['candidates'] if c['id']==sid+'-'+v);c.update(file=str(f.relative_to(B)),sha256=hashlib.sha256(f.read_bytes()).hexdigest(),status='条件・描画点検前・Claude未選定')
(B/'制作台帳.json').write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
print('方程式の説明図3配置12候補を生成')
