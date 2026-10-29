from pathlib import Path
import json,html,hashlib
B=Path(__file__).resolve().parent.parent
m=json.loads((B/'制作台帳.json').read_text());src=B/'Claude原稿/M1-C2-S1/図の仕様.json'
for sp in json.loads(src.read_text())['figures']:
 sid=sp['slotId'];slot=next(s for s in m['imageSlots'] if s['id']==sid);d=B/'図候補'/sid;d.mkdir(parents=True,exist_ok=True)
 snap=d/'仕様スナップショット.json';snap.write_text(json.dumps(sp,ensure_ascii=False,indent=2)+'\n');slot['spec']={'file':str(snap.relative_to(B)),'sha256':hashlib.sha256(snap.read_bytes()).hexdigest(),'source':str(src.relative_to(B))};slot['brief']=sp['purpose']
 def t(x,y,s,size=34,attrs=''):return f'<text x="{x}" y="{y}" font-size="{size}" text-anchor="middle" {attrs}>{html.escape(s)}</text>'
 def bracket(x1,x2,y,label,up):return f'<path d="M{x1} {y} v{(-18 if up else 18)} H{x2} v{(18 if up else -18)}" stroke="#222" fill="none" stroke-width="2" data-bracket="{label}"/>'+t((x1+x2)/2,y+(-45 if up else 65),label)
 for v in 'ABCD':
  o=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 700" role="img" aria-labelledby="title desc"><title id="title">{html.escape(sp["purpose"])}</title><desc id="desc">{html.escape(sp["altText"])}</desc><rect width="1000" height="700" fill="white"/><g font-family="system-ui,sans-serif" fill="#222">']
  if v in 'AD':
   if v=='D':o.append('<rect x="36" y="56" width="940" height="600" rx="18" fill="#ddd"/>')
   o.append('<rect x="30" y="50" width="940" height="600" rx="18" fill="white" stroke="#222"/>')
  if sid.endswith('01'):
   for i in range(6):
    x=100+i*120;w=120 if i<5 else 180
    o.append(f'<rect x="{x}" y="260" width="{w}" height="130" fill="white" stroke="#222" stroke-width="{1 if v=="B" else 2}" data-band="{i}"/>')
    o.append(t(x+w/2,338,'x' if i<5 else '120',40, f'data-cost="{i}"'))
   o+=[bracket(100,700,245,'5x',True),bracket(100,880,405,'5x+120',False),t(400,160,'パン',36),t(790,215,'牛乳',36),t(500,550,'円',32),t(500,605,'帯の長さから120とxの大小は読めません',28)]
  else:
   o.append('<line x1="100" y1="310" x2="900" y2="310" stroke="#222" stroke-width="3"/>')
   for i in range(5):o.append(f'<line x1="{100+i*200}" y1="285" x2="{100+i*200}" y2="335" stroke="#222" stroke-width="3" data-tick="{i}"/>')
   for i in range(4):
    o.append(t(200+i*200,260,'x km',34,f'data-distance="{i}"'));o.append(t(200+i*200,385,'1時間',34,f'data-time="{i}"'))
   o+=[bracket(100,900,195,'4x km',True),bracket(100,900,450,'4時間',False)]
  if v=='C':o.append('<rect x="45" y="60" width="910" height="590" rx="18" fill="none" stroke="#222" stroke-dasharray="7 5"/>')
  o.append('</g></svg>');f=d/(sid+'-'+v+'.svg');f.write_text('\n'.join(o));c=next(c for c in slot['candidates'] if c['id']==sid+'-'+v)
  c.update(file=str(f.relative_to(B)),sha256=hashlib.sha256(f.read_bytes()).hexdigest(),status='条件検証・描画点検前・Claude未選定')
(B/'制作台帳.json').write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
print('2章1節の2配置8候補を作図。本文・問題・解答は無変更。')
