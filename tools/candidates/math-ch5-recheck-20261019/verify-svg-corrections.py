"""Verify the precise three SVG changes and the actual drawn tangent, independently."""
from pathlib import Path
import xml.etree.ElementTree as E
import json,hashlib,math,sys
H=Path(__file__).resolve().parent;R=H.parents[2];M=R/'教材整理/Claude_Codex共有/数学全体制作/メディア';integrated='--integrated' in sys.argv
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();checks=0
def ok(v,m):
 global checks
 assert v,m
 checks+=1
expected={'M1-C5-S2-D02':{17:{'x'}},'M1-C5-S2-FIG03':{14:{'x'},16:{'x'},18:{'x'}},'M1-C5-S4-FIG01':{14:{'y1','y2'},15:{'points'},20:{'x','y'}}}
if integrated:ok(sha(M/'制作ソース/図/c5.py')==sha(H/'candidate/c5.py'),'adopted generator matches reviewed source')
geometry=json.loads((H/'candidate-images/geometry.json').read_text());reports=[]
for ident,allowed in expected.items():
 old=H/'previous'/(ident+'.svg');new=(M if integrated else H/'candidate/svg')/(ident+'.svg');a=list(E.fromstring(old.read_bytes()).iter());b=list(E.fromstring(new.read_bytes()).iter());ok(len(a)==len(b),'same element count '+ident)
 changed={}
 for i,(x,y) in enumerate(zip(a,b)):
  ok(x.tag==y.tag and x.text==y.text,'all element types and words unchanged')
  attrs={k for k in x.attrib.keys()|y.attrib.keys() if x.get(k)!=y.get(k)}
  if attrs:changed[i]=attrs
 ok(changed==allowed,'only reviewed geometry or label coordinates change '+ident)
 if integrated:
  ok(sha(new)==sha(H/'candidate/svg'/(ident+'.svg')),'adopted matches candidate')
  ok(sha(new)==sha(R/('site-assets/textbook-book-math1-'+ident.lower()+'.svg')),'native copy matches adopted source')
 geo=next(x for x in geometry if x['id']==ident);ok(sha(new)==geo['sha256'],'rendered candidate bound to exact bytes')
 for t in geo['texts']:
  box=t['box'];ok(box['x']>=0 and box['y']>=0 and box['x']+box['width']<=1600 and box['y']+box['height']<=900,'text inside image '+t['text'])
 if ident=='M1-C5-S4-FIG01':
  def metrics(nodes):
   tangent=nodes[14];radius=nodes[13]
   o=tuple(float(radius.get(k)) for k in ['x1','y1']);t=tuple(float(radius.get(k)) for k in ['x2','y2'])
   start=tuple(float(tangent.get(k)) for k in ['x1','y1']);end=tuple(float(tangent.get(k)) for k in ['x2','y2'])
   u=(t[0]-o[0],t[1]-o[1]);v=(end[0]-start[0],end[1]-start[1]);norm=math.hypot(*u)*math.hypot(*v)
   cosine=(u[0]*v[0]+u[1]*v[1])/norm
   distance=abs(v[0]*(o[1]-start[1])-v[1]*(o[0]-start[0]))/math.hypot(*v)
   through=abs(v[0]*(t[1]-start[1])-v[1]*(t[0]-start[0]))/math.hypot(*v)
   return cosine,distance,through
  bad=metrics(a);good=metrics(b)
  ok(abs(bad[0])>.8,'old drawn tangent defect reproduced')
  ok(abs(good[0])<.0001,'actual new tangent direction perpendicular to radius within SVG decimal precision')
  ok(abs(good[1]-280)<.1 and good[2]<.1,'line passes contact point and center-line distance equals radius')
  label=next(t['box'] for t in geo['texts'] if t['text']=='T');ok(label['y']>750,'T label clear of contact-line intersection')
  reports.append({'id':ident,'beforeCosine':bad[0],'afterCosine':good[0],'centerToLine':good[1],'contactToLine':good[2],'sha256':sha(new)})
 else:reports.append({'id':ident,'sha256':sha(new),'scope':'point-label x coordinates only; geometry and every text unchanged'})
(H/('svg-integrated-result.json' if integrated else 'svg-candidate-result.json')).write_text(json.dumps({'status':'passed','checks':checks,'integrated':integrated,'results':reports,'manualVisualReview':'three candidate images individually displayed and reviewed; labels and right-angle mark clear'},ensure_ascii=False,indent=2)+'\n')
print('Three SVG corrections:',checks,'checks passed; drawn tangent perpendicular and no mathematical text/quantity changes')
