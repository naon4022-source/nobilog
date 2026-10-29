# coding: utf-8
"""Claudeが確定した数と関係を保ち、説明用の4配置候補を生成する。"""
from pathlib import Path
import copy, hashlib, html, json
B=Path(__file__).resolve().parent.parent
m=json.loads((B/'制作台帳.json').read_text())
src=B/'Claude原稿/M1-C1-S2/図の仕様.json'
specs={s['slotId']:s for s in json.loads(src.read_text())['figures']}
def text(x,y,s,size=34,anchor='start',attrs=''):
 return f'<text x="{x}" y="{y}" font-size="{size}" text-anchor="{anchor}" {attrs}>{html.escape(s)}</text>'
def rect(x,y,w,h,attrs=''):
 return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="16" fill="white" stroke="#222" stroke-width="2" {attrs}/>'
# 図の追加は、Claudeのページ構成提案にある2配置だけ。
for n in (7,8):
 sid=f'M1-C1-S2-FIG0{n}';sp=specs[sid]
 slot=next((s for s in m['imageSlots'] if s['id']==sid),None)
 if slot is None:
  slot={'id':sid,'unitId':'M1-C1-S2','kind':'exact-diagram','brief':sp['purpose'],
        'sourceTextbookPages':[47] if n==7 else [48,49],'selected':None,
        'sourceContentReview':'教科書p46〜49の印刷概念を実画像確認。Claudeの独自数値と条件を図にした。全設問照合ではない。',
        'spec':None,'candidates':[{'id':sid+'-'+v,'direction':sp['candidateLayouts'][v],
            'file':None,'sha256':None,'status':'未生成'} for v in 'ABCD']}
  m['imageSlots'].append(slot)
  if n==7:next(p for p in m['pages'] if p['id']=='M1-P059')['imageSlots'].append(sid)
 folder=B/'図候補'/sid;folder.mkdir(parents=True,exist_ok=True)
 snap=folder/'仕様スナップショット.json';snap.write_text(json.dumps(sp,ensure_ascii=False,indent=2)+'\n')
 slot['spec']={'file':str(snap.relative_to(B)),'sha256':hashlib.sha256(snap.read_bytes()).hexdigest(),'source':str(src.relative_to(B))}
 for v in 'ABCD':
  o=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 700" role="img" aria-labelledby="title desc"><title id="title">{html.escape(sp["purpose"])}</title><desc id="desc">{html.escape(sp["altText"])}</desc><rect width="1000" height="700" fill="white"/><g font-family="system-ui,sans-serif" fill="#222">']
  if n==7:
   assert sp['confirmedConcept']=='自然数⊂整数⊂数全体'
   boxes=[('all',40,50,920,560),('integer',120,235,820,330),('natural',500,350,370,180)]
   for kind,x,y,w,h in boxes:
    if v=='D':o.append(f'<rect x="{x+6}" y="{y+6}" width="{w}" height="{h}" rx="16" fill="#ddd"/>')
    o.append(rect(x,y,w,h,f'data-region="{kind}" '+('stroke-dasharray="10 6"' if kind=='integer' else '')))
   for x,y,s in [(80,110,'数全体'),(150,290,'整数'),(530,405,'自然数')]:o.append(text(x,y,s,36))
   for x,y,s,region in [(90,190,'0.6','all'),(270,190,'−3/7','all'),(180,365,'0','integer'),(310,365,'−2','integer'),(180,475,'−15','integer'),(590,475,'4','natural'),(770,475,'9','natural')]:
    o.append(text(x,y,s,40,attrs=f'data-region-value="{region}"'))
   if v=='C':o.append(rect(100,630,800,55,'stroke-dasharray="6 4"'))
   o.append(text(500,669,'自然数 ⊂ 整数 ⊂ 数全体',32,'middle'))
  else:
   assert sp['confirmedConcept']=='60＝2²×3×5。60＝6×10 と 60＝4×15 の2通りで、最後の素数の組は同じ'
   for tree,root,children,leaves in [('left',(260,140,60),[(140,290,6),(390,290,10)],[(70,450,2),(210,450,3),(320,450,2),(460,450,5)]),('right',(740,140,60),[(620,290,4),(870,290,15)],[(550,450,2),(690,450,2),(800,450,3),(940,450,5)])]:
    if v in 'AD':
     if v=='D':o.append('<rect x="'+str(26 if tree=='left' else 516)+'" y="75" width="475" height="445" rx="16" fill="#ddd"/>')
     o.append(rect(20 if tree=='left' else 510,70,475,445))
    o.append(f'<g data-tree="{tree}">')
    nodes=[root]+children+leaves
    for parent,child in [(0,1),(0,2),(1,3),(1,4),(2,5),(2,6)]:
     x1,y1,_=nodes[parent];x2,y2,_=nodes[child]
     o.append(f'<line x1="{x1}" y1="{y1+17}" x2="{x2}" y2="{y2-38}" stroke="#222" stroke-width="2" data-parent="{parent}" data-child="{child}"/>')
    for i,(x,y,value) in enumerate(nodes):
     if i>=3:o.append(f'<circle cx="{x}" cy="{y-12}" r="34" fill="white" stroke="#222" stroke-width="3" data-prime="{value}"/>')
     o.append(text(x,y,str(value),36,'middle',f'data-node="{i}"'))
    o.append('</g>')
   if v=='C':o.append(rect(65,580,870,85,'stroke-dasharray="6 4"'))
   o.append(text(500,635,'2×2×3×5＝2²×3×5',40,'middle','data-factorization="true"'))
  # Bは余白を枠で区切らず、素数や包含の輪郭へ注目させる。
  if v=='B':o=[s.replace('stroke-width="2"','stroke-width="1"') for s in o]
  o.append('</g></svg>')
  f=folder/(sid+'-'+v+'.svg');f.write_text('\n'.join(o))
  c=next(c for c in slot['candidates'] if c['id']==sid+'-'+v)
  c.update(file=str(f.relative_to(B)),sha256=hashlib.sha256(f.read_bytes()).hexdigest(),status='数学条件・描画点検前・Claude未選定')
# 既存の本文はそのまま。ClaudeのP062a〜d提案と同じ4区分を枠へ反映。
if not any(p['id']=='M1-P062a' for p in m['pages']):
 template=next(p for p in m['pages'] if p['id']=='M1-P062');idx=m['pages'].index(template)+1
 roles=['素数と素因数分解／しくみ・図と意味の対応','素数と素因数分解／解き方と手順の理由','素数と素因数分解／例題と段階的な解説','素数と素因数分解／つまずきの比較と考え方付き確認']
 for k,role in enumerate(roles):
  p=copy.deepcopy(template);p['id']='M1-P062'+chr(97+k);p['role']=role;p['imageSlots']=[]
  p['sourceTextbookPages']=[48,49,50];m['pages'].insert(idx+k,p)
for p in m['pages']:
 if p['id']=='M1-P059':p['imageSlots']=[s for s in p['imageSlots'] if s!='M1-C1-S2-FIG08']
 if p['id']=='M1-P062a':p['imageSlots']=['M1-C1-S2-FIG08']
for u in m['units']:
 u['pageIds']=[p['id'] for p in m['pages'] if p['unitId']==u['id']]
 u['imageSlots']=[s['id'] for s in m['imageSlots'] if s['unitId']==u['id']]
m['pageCount']=len(m['pages']);m['slotCount']=len(m['imageSlots']);m['candidateCount']=sum(len(s['candidates']) for s in m['imageSlots'])
(B/'制作台帳.json').write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
print('2配置8候補、素数と素因数分解の説明枠4つ。本文と解答はClaudeのまま。')
