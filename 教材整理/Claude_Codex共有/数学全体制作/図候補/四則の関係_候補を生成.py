# coding: utf-8
from pathlib import Path
import json,html,hashlib
B=Path('教材整理/Claude_Codex共有/数学全体制作');m=json.loads((B/'制作台帳.json').read_text());src=B/'Claude原稿/M1-C1-S2/図の仕様.json';specs={s['slotId']:s for s in json.loads(src.read_text())['figures']}
def t(x,y,s,size=30,anchor='start',attrs=''):return f'<text x="{x}" y="{y}" font-size="{size}" text-anchor="{anchor}" {attrs}>{html.escape(s)}</text>'
def line(x1,y1,x2,y2,attrs=''):return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="#222" stroke-width="2" {attrs}/>'
def box(x,y,w,h,v,attrs=''):
 return (f'<rect x="{x+5}" y="{y+5}" width="{w}" height="{h}" rx="12" fill="#ddd"/>' if v=='D' else '')+f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="12" fill="white" stroke="#222" stroke-width="{1 if v=="B" else 2}" {attrs}/>'
for n in range(3,7):
 sid=f'M1-C1-S2-FIG0{n}';sp=specs[sid];slot=next(s for s in m['imageSlots'] if s['id']==sid);folder=B/'図候補'/sid;folder.mkdir(exist_ok=True,parents=True)
 snap=folder/'仕様スナップショット.json';snap.write_text(json.dumps(sp,ensure_ascii=False,indent=2)+'\n');slot['spec']={'file':str(snap.relative_to(B)),'sha256':hashlib.sha256(snap.read_bytes()).hexdigest(),'source':str(src.relative_to(B))};slot['brief']=sp['purpose'];slot['sourceContentReview']='教科書p30〜31・34〜37・40〜41の印刷概念を実画像確認。Claudeの本文用条件で独自図を作図。全設問照合ではない。'
 for v in 'ABCD':
  o=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 700" role="img" aria-labelledby="title desc">',f'<title id="title">{html.escape(sp["purpose"])}</title><desc id="desc">{html.escape(sp["altText"])}</desc>','<defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto-start-reverse"><path d="M0 0 L8 4 L0 8 Z" fill="#222"/></marker></defs><rect width="1000" height="700" fill="white"/><g font-family="system-ui,sans-serif" fill="#222">']
  if n==3:
   assert sp['numericConditions']==['項は4つ','正の項の和12','負の項の和−15','答え−3']
   o.append(t(500,60,'7−12+5−3',40,'middle'))
   for x,val in zip([200,400,600,800],[7,-12,5,-3]):
    o.append(t(x,150,('+' if val>0 else '−')+str(abs(val)),36,'middle',f'data-term="{val}"'))
    tx={7:200,-12:620,5:380,-3:800}[val]
    o.append(f'<path d="M{x} 170 C{x} 200 {tx} 220 {tx} 270" fill="none" stroke="#222" stroke-width="2" marker-end="url(#arrow)" data-sort="{val}" data-sign="{1 if val>0 else -1}" '+('stroke-dasharray="8 6"' if val<0 else '')+'/>')
   for x,sign,title,items,total in [(80,1,'正の項の箱','+7　+5',12),(540,-1,'負の項の箱','−12　−3',-15)]:
    o.append(box(x,275,380,230,v,f'data-box-sign="{sign}"'));o.append(t(x+190,320,title,32,'middle'));o.append(t(x+190,390,items,40,'middle'));o.append(t(x+190,465,'和 '+('+' if total>0 else '−')+str(abs(total)),34,'middle',f'data-sum="{total}"'))
   o.append(t(500,590,'12＋(−15)＝−3',40,'middle','data-result="-3"'))
   if v=='C':o.append(t(500,655,sp['labels'][0],28,'middle'))
  elif n==4:
   assert sp['numericConditions']==['答えの列：−9, −6, −3, 0, 3, 6']
   for i,b in enumerate([3,2,1,0,-1,-2]):
    y=75+i*95;z=-3*b
    if v!='B':o.append(box(35,y-40,790,75,v))
    if v=='C' and b==0:o.append(f'<rect x="42" y="{y-33}" width="776" height="61" rx="8" fill="none" stroke="#222" stroke-width="3" stroke-dasharray="7 5"/>')
    bs=str(b) if b>=0 else '(−'+str(abs(b))+')';zs=str(z).replace('-','−')
    o.append(t(70,y+7,f'(−3)×{bs}',36,attrs=f'data-multiplier="{b}"'));o.append(t(555,y+7,'＝'+zs,36,attrs=f'data-product="{z}"'))
    if i<5:o+=[line(855,y+15,855,y+67,'marker-end="url(#arrow)" data-increment="3"'),t(880,y+55,'+3',30)]
   o.append(t(500,675,'3ずつ増える',32,'middle'))
  elif n==5:
   assert sp['numericConditions']==['1行目 □＝3','2行目 □＝−3']
   for i,(factor,answer) in enumerate([(-4,3),(4,-3)]):
    y=170+i*260;o.append(box(25,y-70,950,220,v));fs='(−4)' if factor<0 else '4'
    o.append(t(55,y,f'□×{fs}＝−12',32,attrs=f'data-factor="{factor}" data-operation="multiply"'));o.append(t(570,y,f'(−12)÷{fs}＝□',32,attrs=f'data-factor="{factor}" data-operation="divide"'))
    o.append(line(440,y-10,535,y-10,'marker-start="url(#arrow)" marker-end="url(#arrow)" data-relation="same"'))
    o.append(t(500,y+100,'□＝'+str(answer).replace('-','−'),40,'middle',f'data-answer="{answer}"'))
   if v=='C':o.append(t(500,640,sp['purpose'],27,'middle'))
  else:
   assert sp['numericConditions']==['積 −1, 1, −1, 1']
   o.append(t(40,55,'負の数の個数',28));o.append(t(340,55,'式',28));o.append(t(870,55,'積',28))
   for i,nf in enumerate(range(1,5)):
    y=140+i*115;z=(-1)**nf
    if v!='B':o.append(box(25,y-40,950,82,v))
    if v=='C':o.append(f'<rect x="830" y="{y-30}" width="110" height="62" rx="6" fill="none" stroke="#222" stroke-width="3" '+('stroke-dasharray="7 5"' if nf%2 else '')+'/>')
    o.append(t(65,y+8,str(nf),32,attrs=f'data-count="{nf}"'));o.append(t(160,y+8,'×'.join(['(−1)']*nf),32,attrs=f'data-expression-count="{nf}"'));o.append(t(850,y+8,'＝'+('−1' if z<0 else '+1'),36,attrs=f'data-product="{z}"'))
    if i<3:o+=[line(930,y+50,930,y+69,'marker-end="url(#arrow)" data-flip="true"')]
   o.append(t(500,640,'偶数個→+　　奇数個→−',34,'middle'))
  o.append('</g></svg>');f=folder/(sid+'-'+v+'.svg');f.write_text('\n'.join(o));c=next(c for c in slot['candidates'] if c['id']==sid+'-'+v);c.update(file=str(f.relative_to(B)),sha256=hashlib.sha256(f.read_bytes()).hexdigest(),status='数値条件検証前・描画点検前・Claude未選定')
(B/'制作台帳.json').write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
print('項の仕分け・負×負の規則・乗除の対応・負の個数：4配置16候補を作図。')
