"""Bind full AV/visual evidence to current 12 movies and 36 pictures without redundant decoding."""
from pathlib import Path
from io import BytesIO
import hashlib,json,math,sys,runpy
from PIL import Image
H=Path(__file__).resolve().parent;R=H.parents[2];W=R/'教材整理/Claude_Codex共有/数学全体制作';M=W/'メディア';S=M/'制作ソース'
load=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();rel=lambda p:str(p.relative_to(R))
oldpath=M/'点検/20261019_章別再点検/M1-C4_再復号.json';old=load(oldpath);assert old['status']=='passed'
prior={x['id']:x for x in old['results']};visual=load(H/'visual-review-original.json');assert visual['technicalReportSha256']==sha(oldpath)
progress=load(S/'69本_制作進捗.json');items=[x for x in progress['items'] if x['id'].startswith('M1-C4-')];assert len(items)==12
settings=load(S/'音声共有/設定.json');assert settings==old['voiceSettings'];assert (settings['engine'],settings['voice'],settings['rate'],settings['profile'])==('say','Kyoko',175,'clear')
integration=load(H/'integration.json');reviewedBookSha=integration['bookJsonUnchangedSha256']
currentBookPath=R/'site-assets/textbook-book-math1.json'
if reviewedBookSha!=sha(currentBookPath):
 # A later chapter-five answer relocation legitimately changes the whole-book
 # hash. Validate its exact before/after bytes and every chapter-four page;
 # never let that later edit silently invalidate the chapter-four review.
 later=H.parent/'math-ch5-recheck-20261019';revision=load(later/'integration.json')
 previous=later/'answer-previous/textbook-book-math1.json'
 assert sha(previous)==reviewedBookSha==revision['answerBookBeforeSha256']
 intermediate=runpy.run_path(str(later/'verify_layout_chain.py'))['validate'](True) if (later/'layout-integration.json').exists() else currentBookPath
 assert sha(intermediate)==revision['answerBookAfterSha256']==sha(later/'answer-candidate/textbook-book-math1.json')
 beforeBook=load(previous);afterBook=load(currentBookPath)
 chapter=lambda b:[p for p in b['pages'] if str(p.get('chapter','')).startswith('4章')]
 assert chapter(beforeBook)==chapter(afterBook) and beforeBook['toc']==afterBook['toc']
requests={x['id']:x for x in load(S/'依頼台帳_1件ずつ.json')};book=load(R/'site-assets/textbook-book-math1.json');rows=[]
def flat(blocks):return [x for b in blocks for x in [b,*flat(b.get('body',[]))]]
blocks=[b for p in book['pages'] for b in flat(p.get('blocks',[]))]
changed={'M1-C4-S2-VP','M1-C4-S1-VP','M1-C4-REVIEW-V01'}
for x in items:
 ident=x['id'];assert sha(M/(ident+'.mp4'))==x['sha256']
 if ident in changed:assert requests[ident]['sha256']==x['sha256']
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
  assert audit['audioDurationCheck']['passed'] and abs(audit['audioDurationCheck']['decodedSeconds']-tl['total'])<.2
  assert sha(Path(x['shots'])/'全場面_1.jpg')==audit['visualReview']['contactSheetSha256']
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
 if not str(p.get('chapter','')).startswith('4章'):continue
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
assert len(images)==36 and len({x['id'] for x in images})==36
canvas=load(H/'corrections-integrated-result.json');assert canvas['passed'] and canvas['checks']==18
mathproof=load(H/'independent-math-result.json');assert mathproof['status']=='passed'
for row in mathproof['videos']:assert sha(S/(row['id']+'.json'))==row['scriptSha256']
for name,value in mathproof['dependencies'].items():assert sha(S/name)==value
assert sha(W/'Claude原稿/M1-C4-S2/本文.md')==mathproof['sourceIntegerDomainSha256']
imageproof=load(H/'image-visual-review.json');assert imageproof['images']==images
for evidence in imageproof['boundsReports']:assert sha(R/evidence['path'])==evidence['sha256']
hidden=load(H/'hidden-answer-review.json');assert hidden['bookSha256']==reviewedBookSha
assert hidden['videos']==[{k:x[k] for k in ['id','sha256']} for x in rows]
baseline=load(H/'before-fix-sha.json')
for path,value in baseline.items():
 if not any(ident in path or ident.lower() in path for ident in changed):assert sha(R/path)==value
report={'date':'2026-10-19','status':'passed','videos':rows,'sampleFrames':sum(x['sampleFrames'] for x in rows),'images':images,'bookSha256':sha(R/'site-assets/textbook-book-math1.json'),'newListeningReview':False,'iPhoneDeviceReview':False,'fullSuite':'separate; do not infer success'}
(H/'current-evidence.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print('Chapter4: 12 current videos / 290 visual samples / 36 image sources and book copies match; AV, Kyoko, captions, 30fps evidence bound; listening/device/full suite separate')
