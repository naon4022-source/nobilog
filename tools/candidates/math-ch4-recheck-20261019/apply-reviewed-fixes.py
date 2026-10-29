"""Adopt three reviewed chapter-four visual corrections locally, retaining originals."""
from pathlib import Path
import json,hashlib,shutil
H=Path(__file__).resolve().parent;R=H.parents[2]
W=R/'教材整理/Claude_Codex共有/数学全体制作';M=W/'メディア';S=M/'制作ソース'
load=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
write=lambda p,d:p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
patches={'M1-C4-S2-VP':'階段グラフ_整数条件補正.js','M1-C4-S1-VP':'駐車料金_境界補正.js','M1-C4-REVIEW-V01':'駐車料金_境界補正.js'}
assert not (H/'integration.json').exists(),'already applied; do not repeat'
baseline=load(H/'before-fix-sha.json')
for path,value in baseline.items():assert sha(R/path)==value,'baseline changed: '+path
proof=load(H/'corrections-candidate-result.json');assert proof['passed'] and proof['checks']==52
assert load(H/'candidate-audio-and-visual-result.json')['passed']
progress=load(S/'69本_制作進捗.json');items={x['id']:x for x in progress['items']};requests=load(S/'依頼台帳_1件ずつ.json')
booksha=sha(R/'site-assets/textbook-book-math1.json');back=H/'previous';back.mkdir(exist_ok=True)
def preserve(p):
 q=back/p.name
 if q.exists():assert sha(q)==sha(p),'backup collision '+p.name
 else:shutil.copy2(p,q)
for p in [S/'69本_制作進捗.json',S/'依頼台帳_1件ずつ.json']:preserve(p)
audits={}
# Complete all preflight checks before the first adopted-file mutation.
for ident,patch in patches.items():
 staged=H/'candidate'/ident;a=load(staged/'actual-shots/実動画の点検.json');audits[ident]=a
 assert a['sha256']==sha(staged/(ident+'.mp4')) and a['previousSha256']==items[ident]['sha256']
 assert a['visualReview']['result']=='全場面を目視確認済み' and a['audioDurationCheck']['passed']
 assert a['audioPreservation']['sameAsPrevious'] and not a['audioPreservation']['reencoded']
 assert a['sampleFrames']==len(a['videoFrameProof']) and max(x['maxChannelRMS'] for x in a['videoFrameProof'])<12
 before=load(S/(ident+'.json'));after=load(H/'candidate'/(ident+'.json'))
 assert before['steps']==after['steps'] and before['settings']==after['settings']
 assert set(before)==set(after)
 for key in before:
  if key!='summary':assert before[key]==after[key],key
 assert patch in (H/'candidate'/(ident+'.html')).read_text()
 assert not (S/patch).exists(),'new helper name already exists'
 for p in [S/(ident+'.html'),S/(ident+'.json'),M/(ident+'.mp4')]:preserve(p)
 assert not (M/'点検'/(ident+'_20261019_図条件修正')).exists()
reports=[]
for patch in set(patches.values()):shutil.copy2(H/'candidate'/patch,S/patch)
for ident,patch in patches.items():
 staged=H/'candidate'/ident;a=audits[ident];dest=M/'点検'/(ident+'_20261019_図条件修正')
 shutil.copytree(staged/'actual-shots',dest)
 for src,name in [('full-av-decode.log','復号ログ.txt'),('audio-length-decode.log','音声長さ復号ログ.txt')]:shutil.copy2(staged/src,dest/name)
 a['contactSheets']=[str(dest/'全場面_1.jpg')];a['adoption']='ローカル反映済み／修正後の本内4幅再生・全体検証待ち'
 write(dest/'実動画の点検.json',a)
 for ext in ['html','json']:shutil.copy2(H/'candidate'/(ident+'.'+ext),S/(ident+'.'+ext))
 shutil.copy2(staged/(ident+'.mp4'),M/(ident+'.mp4'))
 shutil.copy2(staged/(ident+'.mp4'),R/('site-assets/textbook-book-math1-'+ident.lower()+'.mp4'))
 old=dict(items[ident]);items[ident].update(sha256=a['sha256'],shots=str(dest),auditFile=str((dest/'実動画の点検.json').relative_to(R)),log=str(dest/'復号ログ.txt'),sourceSha256={ext:sha(S/(ident+'.'+ext)) for ext in ['html','json']},previousRevision={'sha256':old['sha256'],'sourceSha256':old['sourceSha256'],'shots':old['shots'],'backup':str((back/(ident+'.mp4')).relative_to(R)),'reason':'段数は整数の点のみ／駐車料金0分を除く既存図条件へ一致'},latestBookRecheck={'date':'2026-10-19','status':'修正後4幅再生・全体検証待ち'})
 items[ident].setdefault('dependencySha256',{})[patch]=sha(S/patch)
 progress['sceneSourcesSha256'][patch]=sha(S/patch)
 for req in requests:
  if req['id']==ident:req['sha256']=a['sha256'];req['state']='2026-10-19 図条件修正をローカル反映・全AV復号/全場面目視済み／修正後4幅再生・全体検証待ち'
 reports.append({'id':ident,'before':a['previousSha256'],'after':a['sha256'],'samples':a['sampleFrames'],'aacPreserved':True,'audit':str((dest/'実動画の点検.json').relative_to(R))})
for path,value in baseline.items():
 if not any(ident in path or ident.lower() in path for ident in patches):assert sha(R/path)==value,'unrelated chapter-four file changed'
assert sha(R/'site-assets/textbook-book-math1.json')==booksha
write(S/'69本_制作進捗.json',progress);write(S/'依頼台帳_1件ずつ.json',requests)
write(H/'integration.json',{'date':'2026-10-19','scope':'three visual corrections, local only','videos':reports,'otherVideosRegenerated':0,'bookJsonUnchangedSha256':booksha,'fullSuite':'pending','playback':'pending','narrationAndTiming':'unchanged; approved AAC byte copies'})
print('3 chapter-four visual corrections adopted locally; 9 other videos and book JSON unchanged; playback/full suite pending')
