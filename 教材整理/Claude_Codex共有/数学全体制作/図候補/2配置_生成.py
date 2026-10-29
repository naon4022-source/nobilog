# coding: utf-8
from pathlib import Path
import json,html,hashlib,xml.etree.ElementTree as ET
B=Path('教材整理/Claude_Codex共有/数学全体制作')
SLOTS=['M1-C1-S2-FIG02','M1-C1-S3-FIG01']

def text(x,y,t,size=28,anchor='start'):
 return f'<text x="{x}" y="{y}" font-size="{size}" text-anchor="{anchor}">{html.escape(t)}</text>'
def background(v,x,y,w,h):
 out=[]
 if v=='D':out.append(f'<rect x="{x+5}" y="{y+6}" width="{w}" height="{h}" rx="12" fill="#ddd"/>')
 if v!='B':out.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="12" fill="white" stroke="#bbb"/>')
 return out
for sid in SLOTS:
 unit=sid.rsplit('-',1)[0];src=B/'Claude原稿'/unit/'図の仕様.json';spec=next(s for s in json.loads(src.read_text())['figures'] if s['slotId']==sid)
 folder=B/'図候補'/sid;folder.mkdir(parents=True,exist_ok=True)
 if sid.endswith('FIG02'):
  assert spec['numericConditions']==['移動量5（左向き）'];assert spec['labels'][:2]==['(+3)−(+5)','(+3)+(−5)']
 else:assert spec['numericConditions']==['A−2','B+3','C0','D−3','E+7','平均ずれ+1']
 for v in 'ABCD':
  out=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 760" role="img" aria-labelledby="title desc">','<title id="title">'+html.escape(spec['purpose'])+'</title>','<desc id="desc">'+html.escape(spec['altText'])+'</desc>','<defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#111"/></marker><pattern id="hatch" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="9" fill="white"/><path d="M-2 2 L2 -2 M0 9 L9 0 M7 11 L11 7" stroke="#111" stroke-width="1.5"/></pattern></defs><rect width="1000" height="760" fill="white"/><g font-family="system-ui,sans-serif" fill="#111">']
  if sid.endswith('FIG02'):
   out.append(text(35,48,'● 出発　○ 到着　　上下とも同じ動き',30))
   for i,label in enumerate(spec['labels'][:2]):
    y=250+i*275;out+=background(v,25,y-150,940,250);out.append(f'<g data-row="{i}">');out.append(text(45,y-100,label+'＝−2',36));out.append(text(530,y-100,'5小さい' if i==0 else '−5をたす',30))
    for n in range(-6,7):
     x=80+(n+6)*70;out.append(f'<line data-tick="{n}" x1="{x}" x2="{x}" y1="{y-7}" y2="{y+7}" stroke="#111"/>');out.append(text(x,y+45,str(n).replace('-','−'),28,'middle'))
    out.append(f'<line x1="80" x2="920" y1="{y}" y2="{y}" stroke="#111" stroke-width="{1.5 if v=="B" else 2}"/>')
    out.append(f'<line data-motion="true" stroke-dasharray="9 7" x1="710" x2="360" y1="{y-35}" y2="{y-35}" stroke="#111" stroke-width="3" marker-end="url(#arrow)"/>')
    for x,kind,fill in [(710,'start','#111'),(360,'end','white')]:out.append(f'<circle data-point="{kind}" cx="{x}" cy="{y}" r="7" fill="{fill}" stroke="#111" stroke-width="2.5"/>')
    if v=='C':out.append(text(570,y+80,'出発 +3 → 到着 −2',28))
    out.append('</g>')
  else:
   out+=background(v,25,20,940,715);out.append(text(45,65,'基準20分からのちがい',34));out.append(text(45,105,'上向き：灰色　下向き：斜線',28))
   base=490;scale=40
   for n in range(-3,8):
    yy=base-n*scale;out.append(f'<line data-tick="{n}" x1="120" x2="910" y1="{yy}" y2="{yy}" stroke="{ "#111" if n==0 else "#ddd"}" stroke-width="{3 if n==0 else 1}"/>');out.append(text(90,yy+9,str(n).replace('-','−'),28,'end'))
   out.append(text(90,185,'分',28,'end'))
   for i,d in enumerate([-2,3,0,-3,7]):
    x=210+i*150;y=base-max(d,0)*scale;h=abs(d)*scale
    out.append(f'<rect data-bar="{i}" data-difference="{d}" x="{x-33}" y="{y}" width="66" height="{h}" fill="{ "#aaa" if d>0 else "url(#hatch)"}" stroke="#111" stroke-width="2"/>')
    if d==0:out.append(f'<circle cx="{x}" cy="{base}" r="5" fill="#111"/>')
    out.append(text(x,650,chr(65+i),30,'middle'));out.append(text(x,688,('+' if d>0 else '')+str(d).replace('-','−'),30,'middle'))
   out.append(f'<line data-average="1" x1="120" x2="910" y1="450" y2="450" stroke="#111" stroke-width="3" stroke-dasharray="9 7"/>')
   out.append(text(45,145,'ちがいの平均 +1（点線）',28))
   out.append(text(560,145,'基準20分＝0',28))
   if v=='C':out.append(text(570,65,'平均21分',30))
   if v=='B':out.append(text(570,65,'A〜Eの5本',30))
  out.append('</g></svg>');f=folder/(sid+'-'+v+'.svg');f.write_text('\n'.join(out))
 (folder/'仕様スナップショット.json').write_text(json.dumps(spec,ensure_ascii=False,indent=2)+'\n')
 # merge current catalog after generation, preserving all other slots
 mf=B/'制作台帳.json';m=json.loads(mf.read_text());slot=next(s for s in m['imageSlots'] if s['id']==sid)
 slot['spec']={'file':str((folder/'仕様スナップショット.json').relative_to(B)),'sha256':hashlib.sha256((folder/'仕様スナップショット.json').read_bytes()).hexdigest(),'source':str(src.relative_to(B)),'status':'Claude条件のスナップショット・候補選定前'}
 for c in slot['candidates']:
  f=folder/(c['id']+'.svg');c.update(file=str(f.relative_to(B)),sha256=hashlib.sha256(f.read_bytes()).hexdigest(),direction=spec['candidateLayouts'][c['id'][-1]],status='生成済み・表示と座標点検中・未選定')
 mf.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
print('2配置・8候補を保存。数学条件と描画の点検は別途実行。')
