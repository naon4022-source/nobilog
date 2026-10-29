"""Bind full AV/visual evidence to current 12 movies and 38 pictures without redundant decoding."""
from pathlib import Path
from io import BytesIO
import hashlib,json,math,sys,runpy
from copy import deepcopy
from verify_layout_chain import validate
from PIL import Image
H=Path(__file__).resolve().parent;R=H.parents[2];W=R/'教材整理/Claude_Codex共有/数学全体制作';M=W/'メディア';S=M/'制作ソース'
load=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();rel=lambda p:str(p.relative_to(R))
layout=(H/'layout-integration.json').exists()
intermediate=validate(True) if layout else R/'site-assets/textbook-book-math1.json'
oldpath=M/'点検/20261019_章別再点検/M1-C5_再復号.json';old=load(oldpath);assert old['status']=='passed'
prior={x['id']:x for x in old['results']};visual=load(H/'visual-review-original.json');assert visual['technicalReportSha256']==sha(oldpath)
progress=load(S/'69本_制作進捗.json');items=[x for x in progress['items'] if x['id'].startswith('M1-C5-')];assert len(items)==12
settings=load(S/'音声共有/設定.json');assert settings==old['voiceSettings'];assert (settings['engine'],settings['voice'],settings['rate'],settings['profile'])==('say','Kyoko',175,'clear')
requests={x['id']:x for x in load(S/'依頼台帳_1件ずつ.json')};book=load(R/'site-assets/textbook-book-math1.json');rows=[]
def flat(blocks):return [x for b in blocks for x in [b,*flat(b.get('body',[]))]]
blocks=[b for p in book['pages'] for b in flat(p.get('blocks',[]))]
changed=set()
for x in items:
 ident=x['id'];assert sha(M/(ident+'.mp4'))==x['sha256']==requests[ident]['sha256']
 for ext,value in x['sourceSha256'].items():assert sha(S/(ident+'.'+ext))==value
 for name,value in x.get('dependencySha256',{}).items():
  path=(S/name).resolve();assert path.is_relative_to(S.resolve()) and sha(path)==value
 sc=load(S/(ident+'.json'));tl=load(S/(ident+'.timeline.json'));assert sc['settings']=='音声共有/設定.json';assert len(sc['steps'])==len(tl['steps'])
 for a,b in zip(sc['steps'],tl['steps']):
  assert a['say']==a.get('cap',a['say'])==b['say']==b['cap'];assert b['end']-b['start']>=b['speak']>.2
 refs=[b for b in blocks if b.get('id')==ident];assert len(refs)==1 and refs[0]['kind']=='video'
 assert refs[0]['src']=='/textbook-book-math1-'+ident.lower()+'.mp4';assert sha(R/'site-assets'/refs[0]['src'][1:])==x['sha256']
 samples=math.ceil(round(tl['total']*30)/45)
 if ident in changed:
  ap=Path(x['shots'])/'実動画の点検.json';audit=load(ap)
  assert audit['previousSha256']==prior[ident]['sha256'] and audit['sha256']==x['sha256']
  assert audit['visualReview']['result']=='全場面を目視確認済み'
  assert audit['decode'].startswith('all video/audio decoded with -xerror') and audit['format']=='H264・1280x720・30fps・AAC'
  assert audit['frames']==round(tl['total']*30) and audit['sampleFrames']==samples==len(audit['videoFrameProof'])
  assert max(v['maxChannelRMS'] for v in audit['videoFrameProof'])<12
  assert audit['audioPreservation']['sameAsPrevious'] and not audit['audioPreservation']['reencoded']
  duration_evidence=prior[ident];assert abs(duration_evidence['audioSeconds']-tl['total'])<.15
  mean,peak=audit['meanDB'],audit['peakDB'];evidence=ap
 else:
  audit=prior[ident];assert audit['sha256']==x['sha256'] and audit['fps']==30 and audit['decode']=='all video/audio decoded with -xerror'
  assert audit['sampleFrames']==samples==audit['allReviewedFramesMatchVideo']['frames'] and audit['allReviewedFramesMatchVideo']['maxChannelRMS']<12
  assert abs(audit['audioSeconds']-tl['total'])<.15
  vr=next(v for v in visual['results'] if v['id']==ident);assert vr['sha256']==x['sha256'] and vr['result']=='目視範囲で問題なし'
  for sh in vr['contactSheets']:assert sha(R/sh['path'])==sh['sha256']
  mean,peak=audit['meanDB'],audit['peakDB'];evidence=oldpath
 assert -40<mean<0 and peak<0
 rows.append({'id':ident,'sha256':x['sha256'],'sampleFrames':samples,'evidence':rel(evidence),'evidenceSha256':sha(evidence)})
# Resolve the exact selected source, including existing Claude selections, without running the builder.
builder=R/'教材整理/実装/build-textbook-book.py';text=builder.read_text();namespace={'__file__':str(builder)}
exec(compile(text[:text.index('def section_name')],str(builder),'exec'),namespace)
selected=namespace['selected'];images=[]
for p in book['pages']:
 if not str(p.get('chapter','')).startswith('5章'):continue
 for b in flat(p.get('blocks',[])):
  src=b.get('src','')
  if b.get('t') not in ['fig','media'] or not src.endswith(('.svg','.jpg','.png')):continue
  ident=src.split('textbook-book-math1-')[-1].rsplit('.',1)[0].upper();copy=R/'site-assets'/src[1:]
  original=selected.get(ident)
  if not original:
   original=next((M/(ident+'.'+ext) for ext in ['svg','jpg','png'] if (M/(ident+'.'+ext)).exists()),None)
  assert original and original.exists(),ident+' selected source exists'
  if original.suffix=='.svg':assert original.read_bytes()==copy.read_bytes(),ident+' source/copy SHA'
  elif original.suffix=='.jpg' and original.parent==M:assert original.read_bytes()==copy.read_bytes()
  else:
   im=Image.open(original).convert('RGB');im.thumbnail((1400,1400));buf=BytesIO();im.save(buf,format='JPEG',quality=82,optimize=True);assert buf.getvalue()==copy.read_bytes(),ident+' derivative matches selected original'
  images.append({'id':ident,'pid':p.get('pid'),'source':rel(original),'sourceSha256':sha(original),'copy':src,'copySha256':sha(copy)})
imageCount=39 if layout else 38
assert len(images)==imageCount and len({x['id'] for x in images})==imageCount
assert load(H/'svg-integrated-result.json')['status']=='passed'
assert load(H/'independent-math-result.json')['status']=='passed'
assert load(H/'answer-anchors-integrated-result.json')['status']=='passed'
mathproof=load(H/'independent-math-result.json')
for row in mathproof['videos']:assert sha(S/(row['id']+'.json'))==row['scriptSha256']
for name,value in mathproof['dependencies'].items():assert sha(S/name)==value
imageproof=load(H/'image-visual-review.json');reviewed=deepcopy(imageproof['images'])
if layout:
 extra=load(H/'layout-image-review.json')
 for screen in extra['screens']:assert sha(R/screen['path'])==screen['sha256']
 assert extra['scene']['id']=='M1-C5-S2-APPLY' and extra['scene']['pid']=='M1-P227'
 assert sha(R/extra['scene']['source'])==extra['scene']['sourceSha256']
 assert sha(R/'site-assets'/extra['scene']['copy'][1:])==extra['scene']['copySha256']
 next(x for x in reviewed if x['id']=='M1-C5-S2-DP3')['pid']='M1-P225'
 reviewed.append(extra['scene'])
svg_predecessor=runpy.run_path(str(H.parent/'textbook-final-20261023/reviewed_changes.py'))['svg_predecessor']
normalized=[]
for current in images:
 previous=dict(current)
 historical=next(x for x in reviewed if x['id']==current['id'])
 for path_field,hash_field in [('source','sourceSha256'),('copy','copySha256')]:
  if current[hash_field]!=historical[hash_field]:
   path=R/current[path_field] if path_field=='source' else R/'site-assets'/current[path_field][1:]
   previous[hash_field]=sha(svg_predecessor(path,historical[hash_field]))
 normalized.append(previous)
assert sorted(reviewed,key=lambda x:x['id'])==sorted(normalized,key=lambda x:x['id'])
for evidence in imageproof['geometryReports']:assert sha(R/evidence['path'])==evidence['sha256']
originalGeometry={x['id']:x for x in load(H/'extra-images/geometry.json')}
fixedGeometry={x['id']:x for x in load(H/'candidate-images/geometry.json')}
for row in images:
 if row['source'].endswith('.svg'):
  reviewed=fixedGeometry.get(row['id'],originalGeometry[row['id']])
  assert sha(svg_predecessor(R/row['source'],reviewed['sha256']))==sha(svg_predecessor(R/'site-assets'/row['copy'][1:],reviewed['sha256']))==reviewed['sha256']
hidden=load(H/'hidden-answer-review.json');assert hidden['bookSha256']==sha(intermediate)
assert hidden['videos']==[{k:x[k] for k in ['id','sha256']} for x in rows]
assert load(H/'answer-integrated-visibility/browser-result.json')['passed']
assert load(H/'review-render-result.json')['passed']
revision=load(H/'integration.json');assert sha(intermediate)==revision['answerBookAfterSha256']
source=H/'layout-previous' if layout else W/'Claude原稿/M1-C5-S2'
for name,value in load(H/'answer-candidate-result.json')['sourceAfter'].items():assert sha(source/name)==value
report={'date':'2026-10-20','status':'passed','videos':rows,'sampleFrames':sum(x['sampleFrames'] for x in rows),'images':images,'bookSha256':sha(R/'site-assets/textbook-book-math1.json'),'newListeningReview':False,'iPhoneDeviceReview':False,'fullSuite':'separate; do not infer success'}
(H/'current-evidence.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(f'Chapter5: 12 current videos / 302 visual samples / {imageCount} image sources and book copies match; AV, Kyoko, captions, 30fps, hidden-answer and exact later layout evidence bound; listening/device/full suite separate')
