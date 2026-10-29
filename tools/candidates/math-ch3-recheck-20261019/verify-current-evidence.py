"""Bind full AV/visual evidence to current 11 movies and 38 pictures without redundant decoding."""
from pathlib import Path
from io import BytesIO
import hashlib,json,math,sys
from PIL import Image
H=Path(__file__).resolve().parent;R=H.parents[2];W=R/'教材整理/Claude_Codex共有/数学全体制作';M=W/'メディア';S=M/'制作ソース'
load=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();rel=lambda p:str(p.relative_to(R))
oldpath=M/'点検/20261019_章別再点検/M1-C3_再復号.json';old=load(oldpath);assert old['status']=='passed'
prior={x['id']:x for x in old['results']};visual=load(H/'visual-review-original.json');assert visual['technicalReportSha256']==sha(oldpath)
progress=load(S/'69本_制作進捗.json');items=[x for x in progress['items'] if x['id'].startswith('M1-C3-')];assert len(items)==11
settings=load(S/'音声共有/設定.json');assert settings==old['voiceSettings'];assert (settings['engine'],settings['voice'],settings['rate'],settings['profile'])==('say','Kyoko',175,'clear')
equiv=load(H/'scene-equivalence.json');assert equiv['afterSha256']==sha(S/'数学3章_場面.js')
requests={x['id']:x for x in load(S/'依頼台帳_1件ずつ.json')};book=load(R/'site-assets/textbook-book-math1.json');rows=[]
def flat(blocks):return [x for b in blocks for x in [b,*flat(b.get('body',[]))]]
blocks=[b for p in book['pages'] for b in flat(p.get('blocks',[]))]
changed={'M1-C3-S1-V04','M1-C3-S1-VP'}
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
  assert next(v for v in equiv['results'] if v['id']==ident)['changed']==0
  mean,peak=audit['meanDB'],audit['peakDB'];evidence=oldpath
 assert -40<mean<0 and peak<0
 rows.append({'id':ident,'sha256':x['sha256'],'sampleFrames':samples,'evidence':rel(evidence),'evidenceSha256':sha(evidence)})
# Resolve the exact selected source, including existing Claude selections, without running the builder.
builder=R/'教材整理/実装/build-textbook-book.py';text=builder.read_text();namespace={'__file__':str(builder)}
exec(compile(text[:text.index('def section_name')],str(builder),'exec'),namespace)
selected=namespace['selected'];images=[]
for p in book['pages']:
 if not str(p.get('chapter','')).startswith('3章'):continue
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
assert len(images)==38 and len({x['id'] for x in images})==38
pattern=(M/'M1-C3-S2-FIG03.svg').read_text();assert pattern.count('fill="url(#c3-blue-hatch)"')==7 and 'stroke-opacity=".45"' in pattern
report={'date':'2026-10-19','status':'passed','videos':rows,'sampleFrames':sum(x['sampleFrames'] for x in rows),'images':images,'bookSha256':sha(R/'site-assets/textbook-book-math1.json'),'newListeningReview':False,'iPhoneDeviceReview':False,'fullSuite':'separate; do not infer success'}
(H/'current-evidence.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print('Chapter3: 11 current videos / 272 visual samples / 38 image sources and book copies match; AV, Kyoko, captions, 30fps, hidden-answer review evidence bound; listening/device/full suite separate')
