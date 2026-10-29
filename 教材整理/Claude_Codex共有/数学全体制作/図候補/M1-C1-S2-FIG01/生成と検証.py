# coding: utf-8
from pathlib import Path
import json,html,hashlib,xml.etree.ElementTree as ET
b=Path('教材整理/Claude_Codex共有/数学全体制作');specfile=b/'Claude原稿/M1-C1-S2/図の仕様.json';spec=next(f for f in json.loads(specfile.read_text())['figures'] if f['slotId']=='M1-C1-S2-FIG01')
folder=b/'図候補/M1-C1-S2-FIG01';folder.mkdir(parents=True,exist_ok=True)
rows=[(2,3,5),(-2,-3,-5),(2,-3,-1),(-2,3,1)]
labels=spec['labels'][:4]
assert labels==['(+2)+(+3)＝+5','(−2)+(−3)＝−5','(+2)+(−3)＝−1','(−2)+(+3)＝+1'], 'Claudeの仕様変更あり。新条件を照合してから更新する'
assert spec['numericConditions']==['1本目 出発+2 移動+3 到着+5','2本目 出発−2 移動−3 到着−5','3本目 出発+2 移動−3 到着−1','4本目 出発−2 移動+3 到着+1']
def x(v):return 80+(v+6)*70
for variant in 'ABCD':
 out=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 770" role="img" aria-labelledby="title desc">', '<title id="title">正負の数の加法・数直線</title>','<desc id="desc">'+html.escape(spec['altText'])+'</desc>', '<defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#111"/></marker></defs>', '<rect width="1000" height="770" fill="white"/>', '<g font-family="system-ui,sans-serif" fill="#111">', '<text x="35" y="42" font-size="30">● 出発　○ 到着　　右へ：実線　左へ：点線</text>']
 for i,((start,move,end),label) in enumerate(zip(rows,labels)):
  top=65+i*174;axis=top+100
  if variant=='D':out.append(f'<rect x="30" y="{top+5}" width="940" height="160" rx="12" fill="#ddd"/>')
  if variant in 'ACD':out.append(f'<rect x="25" y="{top}" width="940" height="160" rx="12" fill="{ "#fafafa" if variant=="A" else "white"}" stroke="#bbb"/>')
  out.append(f'<g data-row="{i}" data-start="{start}" data-move="{move}" data-end="{end}"><text x="45" y="{top+35}" font-size="32" font-weight="600">{html.escape(label)}</text>')
  if variant=='C':out.append(f'<rect x="540" y="{top+8}" width="360" height="36" rx="8" fill="#eee"/><text x="555" y="{top+35}" font-size="28">{abs(move)}目盛り {"右へ" if move>0 else "左へ"}</text>')
  out.append(f'<line x1="{x(-6)}" x2="{x(6)}" y1="{axis}" y2="{axis}" stroke="#111" stroke-width="{1.5 if variant=="B" else 2}"/>')
  for v in range(-6,7):
   out.append(f'<line data-tick="{v}" x1="{x(v)}" x2="{x(v)}" y1="{axis-7}" y2="{axis+7}" stroke="#111" stroke-width="{3 if v==0 else 1.5}"/><text x="{x(v)}" y="{axis+42}" text-anchor="middle" font-size="28">{str(v).replace("-","−")}</text>')
  dashed=' stroke-dasharray="9 7"' if move<0 else ''
  out.append(f'<line data-motion="true" x1="{x(start)}" x2="{x(end)}" y1="{axis-32}" y2="{axis-32}" stroke="#111" stroke-width="3" marker-end="url(#arrow)"{dashed}/>')
  for val,kind,fill in [(start,'start','#111'),(end,'end','white')]:out.append(f'<circle data-point="{kind}" data-value="{val}" cx="{x(val)}" cy="{axis}" r="7" stroke="#111" stroke-width="2.5" fill="{fill}"/>')
  out.append('</g>')
 out.append('</g></svg>');name=f'M1-C1-S2-FIG01-{variant}.svg';(folder/name).write_text('\n'.join(out))
 # independent checks from rendered coordinates, not metadata alone
 root=ET.parse(folder/name).getroot();ns={'s':'http://www.w3.org/2000/svg'}
 for g,(a,d,z) in zip(root.findall('.//s:g[@data-row]',ns),rows):
  ticks=g.findall('s:line[@data-tick]',ns);assert len(ticks)==13
  origin=float(ticks[6].get('x1'));step=float(ticks[7].get('x1'))-origin
  pts=g.findall('s:circle',ns);assert [(float(c.get('cx'))-origin)/step for c in pts]==[a,z];assert a+d==z
  arrow=g.find('s:line[@data-motion]',ns);assert (float(arrow.get('x2'))-float(arrow.get('x1')))/step==d
  assert (arrow.get('stroke-dasharray') is not None)==(d<0)
(folder/'仕様スナップショット.json').write_text(json.dumps(spec,ensure_ascii=False,indent=2)+'\n')
mfile=b/'制作台帳.json';m=json.loads(mfile.read_text());slot=next(s for s in m['imageSlots'] if s['id']==spec['slotId']);slot['spec']={'file':'図候補/M1-C1-S2-FIG01/仕様スナップショット.json','sha256':hashlib.sha256((folder/'仕様スナップショット.json').read_bytes()).hexdigest(),'source':'Claude原稿/M1-C1-S2/図の仕様.json','status':'Claude条件のスナップショット・数値座標検証済み・選定前'}
for c in slot['candidates']:
 f=folder/(c['id']+'.svg');c['file']=str(f.relative_to(b));c['sha256']=hashlib.sha256(f.read_bytes()).hexdigest();c['direction']=spec['candidateLayouts'][c['id'][-1]];c['status']='候補生成・座標検証済み・表示点検中・未選定'
mfile.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
print('FIG01の4候補：全4式、13目盛り、出発・到着座標、移動量、実線と点線を検証')
