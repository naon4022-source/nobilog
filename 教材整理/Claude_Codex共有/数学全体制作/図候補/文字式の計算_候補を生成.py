from pathlib import Path
import json,html,hashlib
B=Path(__file__).resolve().parent.parent
m=json.loads((B/'制作台帳.json').read_text());src=B/'Claude原稿/M1-C2-S2/図の仕様.json'
def t(x,y,s,size=34,attrs=''):return f'<text x="{x}" y="{y}" font-size="{size}" text-anchor="middle" {attrs}>{html.escape(s)}</text>'
for sp in json.loads(src.read_text())['figures']:
 sid=sp['slotId'];slot=next(s for s in m['imageSlots'] if s['id']==sid);d=B/'図候補'/sid;d.mkdir(parents=True,exist_ok=True);snap=d/'仕様スナップショット.json';snap.write_text(json.dumps(sp,ensure_ascii=False,indent=2)+'\n');slot['spec']={'file':str(snap.relative_to(B)),'sha256':hashlib.sha256(snap.read_bytes()).hexdigest(),'source':str(src.relative_to(B))};slot['brief']=sp['purpose']
 for v in 'ABCD':
  o=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 700" role="img" aria-labelledby="title desc"><title id="title">{html.escape(sp["purpose"])}</title><desc id="desc">{html.escape(sp["altText"])}</desc><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#222"/></marker></defs><rect width="1000" height="700" fill="white"/><g font-family="system-ui,sans-serif" fill="#222">']
  if v in 'AD':
   if v=='D':o.append('<rect x="31" y="31" width="940" height="650" rx="16" fill="#ddd"/>')
   o.append('<rect x="25" y="25" width="940" height="650" rx="16" fill="white" stroke="#222"/>')
  if sid.endswith('01'):
   for row,(bags,loose,y,label) in enumerate([(4,2,160,'4x+2'),(3,5,330,'3x+5'),(7,7,550,'7x+7')]):
    o.append(f'<g data-row="{row}">')
    for i in range(bags):
     x=90+i*57;o.append(f'<path d="M{x} {y+60} V{y+12} L{x+10} {y} H{x+36} L{x+46} {y+12} V{y+60} Z" fill="white" stroke="#222" stroke-width="2" data-bag="{i}"/>');o.append(t(x+23,y+43,'x',32))
    for i in range(loose):o.append(f'<circle cx="{620+i*43}" cy="{y+30}" r="14" fill="white" stroke="#222" stroke-width="3" data-loose="{i}"/>')
    o.append(t(300 if row<2 else 500,y-30 if row<2 else 655,label,36,'data-expression="true"'));o.append('</g>')
   for kind,x in [('bag',500),('loose',930)]:
    for row,start in [(0,230),(1,400)]:o.append(f'<line x1="{x+row*15}" y1="{start}" x2="{x+row*15}" y2="530" stroke="#222" stroke-width="2" marker-end="url(#arrow)" data-collect="{kind}" data-from="{row}" '+('stroke-dasharray="8 6"' if kind=='loose' else '')+'/>')
  elif sid.endswith('02'):
   for row,y in enumerate([270,550]):
    o.append(f'<g data-row="{row}"><line x1="230" y1="{y}" x2="920" y2="{y}" stroke="#222" stroke-width="2"/>')
    for x in range(270,901,90):o.append(f'<line x1="{x}" y1="{y-8}" x2="{x}" y2="{y+8}" stroke="#222" data-tick="true"/>')
    for x,label in [(810,'a'),(360,'a−b−c')]+([(540,'a−b')] if row==0 else []):o.append(f'<circle cx="{x}" cy="{y}" r="6" fill="#222"/>'+t(x,y+60,label,32))
    for start,end,label in ([(810,540,'b'),(540,360,'c')] if row==0 else [(810,360,'b+c')]):
     o.append(f'<line x1="{start}" y1="{y-50}" x2="{end}" y2="{y-50}" stroke="#222" stroke-width="3" stroke-dasharray="8 6" marker-end="url(#arrow)" data-move="{label}"/>');o.append(t((start+end)/2,y-80,label,36))
    o.append('</g>')
   o.append('<line x1="360" y1="270" x2="360" y2="285" stroke="#222" stroke-width="2" stroke-dasharray="6 6" data-arrival="true"/><line x1="360" y1="350" x2="360" y2="550" stroke="#222" stroke-width="2" stroke-dasharray="6 6" data-arrival="true"/>')
  else:
   o.append('<rect x="160" y="220" width="700" height="240" fill="white" stroke="#222" stroke-width="3" data-area="all"/><line x1="610" y1="220" x2="610" y2="460" stroke="#222" stroke-width="3" data-split="true"/>')
   o+=[t(385,170,'2x',40),t(735,170,'3',40),t(110,350,'5',40),t(385,350,'5×2x＝10x',36,'data-area-label="left"'),t(735,350,'5×3＝15',36,'data-area-label="right"'),t(500,560,'5(2x+3)＝10x+15',40,'data-total="true"'),t(500,630,'長さの比からxの値は読めません',28)]
  if v=='C':o.append('<rect x="35" y="35" width="930" height="640" rx="16" fill="none" stroke="#222" stroke-dasharray="7 5"/>')
  if v=='B':o=[s.replace('stroke-width="2"','stroke-width="1"') for s in o]
  o.append('</g></svg>');f=d/(sid+'-'+v+'.svg');f.write_text('\n'.join(o));c=next(c for c in slot['candidates'] if c['id']==sid+'-'+v);c.update(file=str(f.relative_to(B)),sha256=hashlib.sha256(f.read_bytes()).hexdigest(),status='条件・描画点検前・Claude未選定')
(B/'制作台帳.json').write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n');print('2章2節3配置12候補を作図。')
