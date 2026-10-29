"""点検済みの対象1本だけを反映し、共通場面の他12本同一証明と旧版を保全する。"""
from pathlib import Path
import shutil,json,hashlib
r=Path(__file__).resolve().parents[3];t=Path(__file__).resolve().parent;w=r/'教材整理/Claude_Codex共有/数学全体制作';m=w/'メディア';s=m/'制作ソース';ident='M1-C2-S1-V03';load=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
equiv=load(t/'scene-equivalence.json');shared=s/'数学2章_場面.js';candidate=t/'candidate/数学2章_場面.js';assert sha(shared)==equiv['beforeSha256'] and sha(candidate)==equiv['afterSha256'];assert len(equiv['results'])==13 and all(x['changed']==0 for x in equiv['results'] if x['id']!=ident)
video=t/'candidate'/(ident+'.mp4');old=m/(ident+'.mp4');copy=r/('site-assets/textbook-book-math1-'+ident.lower()+'.mp4');audit=load(t/'candidate/actual-shots/実動画の点検.json');assert sha(video)==audit['sha256'] and sha(old)==sha(copy)==audit['previousSha256'];assert audit['audioPreservation']['sameAsPrevious'] and audit['sampleFrames']==19
prev=t/'previous';assert not (prev/(ident+'.mp4')).exists(),'do not apply twice'
for p in [old,s/'69本_制作進捗.json',s/'依頼台帳_1件ずつ.json']:shutil.copy2(p,prev/p.name)
newshots=m/'点検'/('M1-C2-S1-V03_20261018_囲み修正');assert not newshots.exists();shutil.copytree(t/'candidate/actual-shots',newshots);shutil.copy2(t/'candidate/full-av-decode.log',newshots/'復号ログ.txt')
audit['contactSheets']=[str(newshots/'全場面_1.jpg')];audit['visualReview']={'date':'2026-10-18','result':'全場面を目視確認済み','reviewer':'Codex','scope':'修正後の実動画を1.5秒ごと19場面全て目視。式・字幕・図の重なりなし。最終値11を出さず5−(−6)で停止。音声AACは旧版とバイト一致。'};(newshots/'実動画の点検.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n')
progress=load(s/'69本_制作進捗.json');assert progress['sceneSourcesSha256']['数学2章_場面.js']==equiv['beforeSha256'];progress['sceneSourcesSha256']['数学2章_場面.js']=equiv['afterSha256'];items={x['id']:x for x in progress['items']};before=dict(items[ident])
for x in progress['items']:
 if not x['id'].startswith('M1-C2-'):continue
 x.setdefault('dependencySha256',{})['数学2章_場面.js']=equiv['afterSha256'];x['latestSceneSourceReview']={'date':'2026-10-18','report':str((t/'scene-equivalence.json').relative_to(r)),'status':'target circle fixed' if x['id']==ident else 'all 1.5s and step-boundary samples pixel-identical; no video regeneration','previousDependencySha256':equiv['beforeSha256']}
x=items[ident];x.update(sha256=audit['sha256'],shots=str(newshots),auditFile=str((newshots/'実動画の点検.json').relative_to(r)),log=str(newshots/'復号ログ.txt'),visualReview='2026-10-18 修正後実動画19場面を目視。先頭5と楕円は重ならず、最終答え非表示。',mediaCheck='全824映像フレームと音声を-xerror復号。30fps H264/AAC。承認音声AACは旧版とバイト一致。',previousRevision={'sha256':before['sha256'],'shots':before['shots'],'auditFile':before['auditFile'],'reason':'強調楕円が先頭5へ重なるため囲みだけ修正','backup':str((prev/(ident+'.mp4')).relative_to(r))},latestBookRecheck={'date':'2026-10-18','status':'pending after circle revision'})
requests=load(s/'依頼台帳_1件ずつ.json')
for x in requests:
 if x['id'].startswith('M1-C2-') and x['kind']=='動画':x['sha256']=items[x['id']]['sha256'];x['state']='2026-10-18 全AV復号・30fps・音声長さ・台本字幕・273場面目視対応確認／修正1本のAAC保全・他12本再制作なし／本内4幅再生と変更後全体検証待ち'
shutil.copy2(candidate,shared);shutil.copy2(video,old);shutil.copy2(video,copy);(s/'69本_制作進捗.json').write_text(json.dumps(progress,ensure_ascii=False,indent=2)+'\n');(s/'依頼台帳_1件ずつ.json').write_text(json.dumps(requests,ensure_ascii=False,indent=2)+'\n')
(t/'integration.json').write_text(json.dumps({'id':ident,'before':before['sha256'],'after':sha(old),'sourceBefore':equiv['beforeSha256'],'sourceAfter':sha(shared),'bookCopySha256':sha(copy),'aacPreserved':True,'otherVideosRegenerated':0,'scriptTimelineUnchanged':True,'bookJsonUnchanged':True,'previous':before,'latestAudit':str((newshots/'実動画の点検.json').relative_to(r))},ensure_ascii=False,indent=2)+'\n');print('1 corrected movie and exact book copy applied; old movie/audit retained; shared branch diff only; other12 re-render equivalence preserved')
