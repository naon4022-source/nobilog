# coding: utf-8
from pathlib import Path
import json,hashlib,copy,xml.etree.ElementTree as E,html
b=Path('教材整理/Claude_Codex共有/数学全体制作');m=json.loads((b/'制作台帳.json').read_text());specs=json.loads((b/'Claude原稿/M1-C1-S1/図の仕様.json').read_text())['figures']
N='{http://www.w3.org/2000/svg}';E.register_namespace('',N[1:-1]);placements=['M1-P004','M1-P008','M1-P012','M1-P016','M1-P023a','M1-P025']
if not any(p['id']=='M1-P023a' for p in m['pages']):
 template=next(p for p in m['pages'] if p['id']=='M1-P023');index=m['pages'].index(template)+1
 for i,(suffix,role) in enumerate(zip('abcd',['しくみ・意味と図の対応','解き方・判断の順序','例題・手順と検算','つまずきの比較・考え方付き確認'])):
  page=copy.deepcopy(template);page.update(id='M1-P023'+suffix,role='数直線での移動／'+role,imageSlots=[],sourceTextbookPages=[21,22]);m['pages'].insert(index+i,page)
for spec,pid in zip(specs,placements):
 sid=spec['slotId'];slot=next((s for s in m['imageSlots'] if s['id']==sid),None)
 if slot is None:
  slot={'id':sid,'unitId':'M1-C1-S1','kind':'exact-diagram','brief':spec['purpose'],'sourceTextbookPages':next(p for p in m['pages'] if p['id']==pid)['sourceTextbookPages'],'selected':None,'candidates':[]};m['imageSlots'].append(slot);next(p for p in m['pages'] if p['id']==pid)['imageSlots'].append(sid)
 src=Path(spec['existingSvg'].split('：')[-1]);raw=src.read_bytes();root=E.fromstring(raw);_,_,w,h=map(float,root.get('viewBox').split());folder=b/'図候補'/sid;folder.mkdir(exist_ok=True,parents=True)
 snap=folder/'仕様スナップショット.json';snap.write_text(json.dumps(spec,ensure_ascii=False,indent=2)+'\n');slot['spec']={'file':str(snap.relative_to(b)),'sha256':hashlib.sha256(snap.read_bytes()).hexdigest(),'source':'Claude原稿/M1-C1-S1/図の仕様.json'};slot['sourceContentReview']='Claudeの照合済み試作SVGの数学条件を保持。Codexは座標と文字を変更せず配置のみ比較。'
 for v in 'ABCD':
  # Preserve the exact authored source diagram as a nested SVG; changing only surrounding layout.
  f=folder/f'{sid}-{v}.svg';y=70 if v=='C' else 30;H=h*1.5+y+30
  out=E.Element(N+'svg',{'viewBox':f'0 0 1000 {H:g}','role':'img','aria-label':spec['purpose']});E.SubElement(out,N+'rect',{'width':'1000','height':str(H),'fill':'white'})
  if v=='A':E.SubElement(out,N+'rect',{'x':'10','y':'10','width':'980','height':str(H-20),'rx':'12','fill':'white','stroke':'#aaa'})
  if v=='D':
   E.SubElement(out,N+'rect',{'x':'15','y':'15','width':'975','height':str(H-25),'rx':'18','fill':'#ddd'})
   E.SubElement(out,N+'rect',{'x':'10','y':'10','width':'975','height':str(H-25),'rx':'18','fill':'white','stroke':'#666'})
  if v=='C':
   E.SubElement(out,N+'text',{'x':'30','y':'43','font-size':'27','font-family':'system-ui,sans-serif','fill':'#222'}).text=spec['purpose']
  nested=copy.deepcopy(root);nested.attrib.update(x='20',y=str(y),width='960',height=str(h*1.5));nested.set('data-source-sha256',hashlib.sha256(raw).hexdigest());out.append(nested)
  E.ElementTree(out).write(f,encoding='utf-8',xml_declaration=True)
  c={'id':sid+'-'+v,'direction':{'A':'余白と枠で説明図を独立させる','B':'枠なしで数直線・棒を大きく見せる','C':'Claudeの目的見出しと説明図を一緒に読む','D':'浮き上がる紙面の枠で注目する範囲を区切る'}[v],'file':str(f.relative_to(b)),'sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'status':'数学条件保持・描画点検待ち・Claude未選定','review':{'source':str(src),'sourceSha256':hashlib.sha256(raw).hexdigest(),'mathGeometryUnchanged':True}}
  old=next((x for x in slot['candidates'] if x['id']==c['id']),None)
  if old:old.update(c)
  else:slot['candidates'].append(c)
  assert all(a.tag==z.tag and a.text==z.text and a.attrib==z.attrib for a,z in zip(list(root.iter())[1:],list(nested.iter())[1:])),sid
m['previousPageCount']=392;m['pageCount']=len(m['pages']);m['slotCount']=len(m['imageSlots']);m['candidateCount']=4*m['slotCount'];m['rasterCandidateCount']=4*sum(s['kind']=='raster' for s in m['imageSlots']);m['diagramCandidateCount']=m['candidateCount']-m['rasterCandidateCount'];m['pageCountRule']='資料・Claudeの構成に合わせて必要な説明ページを追加。画像だけ・問題だけでページを埋めない。'
(b/'制作台帳.json').write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
print('説明図6配置×4候補=24追加。Claudeの数直線・棒・文字と座標を保持。396ページ、103配置、412候補。')
