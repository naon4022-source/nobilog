"""Apply two reviewed circle fixes and one hatch fix; preserve all prior media and records."""
from pathlib import Path
import shutil,json,hashlib
R=Path(__file__).resolve().parents[3];H=Path(__file__).resolve().parent
W=R/'教材整理/Claude_Codex共有/数学全体制作';M=W/'メディア';S=M/'制作ソース'
load=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
write=lambda p,x:p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
ids=['M1-C3-S1-V04','M1-C3-S1-VP'];equiv=load(H/'scene-equivalence.json')
scene=S/'数学3章_場面.js';candidate=H/'candidate/数学3章_場面.js'
assert sha(scene)==equiv['beforeSha256'] and sha(candidate)==equiv['afterSha256']
assert len(equiv['results'])==11 and all(x['changed']==0 for x in equiv['results'] if x['id'] not in ids)
booksha=sha(R/'site-assets/textbook-book-math1.json')
progress=load(S/'69本_制作進捗.json');items={x['id']:x for x in progress['items']};requests=load(S/'依頼台帳_1件ずつ.json')
back=H/'previous';assert not (H/'integration.json').exists(),'already applied';back.mkdir(exist_ok=True)
for p in [scene,S/'図/c4.py',S/'69本_制作進捗.json',S/'依頼台帳_1件ずつ.json',M/'M1-C3-S2-FIG03.svg']:
 if (back/p.name).exists():assert sha(p)==sha(back/p.name),'preserved baseline must still match'
 else:shutil.copy2(p,back/p.name)
reports=[]
for ident in ids:
 old=M/(ident+'.mp4');copy=R/('site-assets/textbook-book-math1-'+ident.lower()+'.mp4')
 staged=H/'candidate'/ident;video=staged/(ident+'.mp4');audit=load(staged/'actual-shots/実動画の点検.json')
 assert sha(old)==sha(copy) and sha(old) in [audit['previousSha256'],audit['sha256']]
 assert audit['previousSha256']==items[ident]['sha256']
 assert sha(video)==audit['sha256'] and audit['audioPreservation']['sameAsPrevious'] and not audit['audioPreservation']['reencoded']
 assert audit['sampleFrames']==len(audit['videoFrameProof']) and max(x['maxChannelRMS'] for x in audit['videoFrameProof'])<12
 if (back/old.name).exists():assert sha(back/old.name)==audit['previousSha256']
 else:shutil.copy2(old,back/old.name)
 dest=M/'点検'/(ident+'_20261019_囲み修正');
 if not dest.exists():shutil.copytree(staged/'actual-shots',dest)
 else:assert load(dest/'実動画の点検.json')['sha256']==audit['sha256']
 shutil.copy2(staged/'full-av-decode.log',dest/'復号ログ.txt')
 audit['contactSheets']=[str(dest/'全場面_1.jpg')]
 audit['visualReview']={'date':'2026-10-19','reviewer':'Codex','result':'全場面を目視確認済み','scope':f"修正実動画の1.5秒ごと全{audit['sampleFrames']}場面を目視。式全体の外側に円を広げ、全字形と円の重なりなし。数式・台本・字幕・タイミング不変。既存承認AACを無変換コピー。新しい耳の点検とは別。"}
 audit['adoption']='許可済み非admin教材修正としてローカル反映・本内4幅再生と全体検証待ち'
 write(dest/'実動画の点検.json',audit)
 before=dict(items[ident]);items[ident].update(sha256=audit['sha256'],shots=str(dest),auditFile=str((dest/'実動画の点検.json').relative_to(R)),log=str(dest/'復号ログ.txt'),visualReview='2026-10-19 全場面目視。強調円の重なり修正。承認音声AAC不変。',mediaCheck='全AV復号・全30fpsフレーム列挙・実動画1.5秒コマ照合。承認AACバイト一致。',previousRevision={'sha256':before['sha256'],'shots':before['shots'],'auditFile':before.get('auditFile',str(Path(before['shots'])/'実動画の点検.json')),'backup':str((back/old.name).relative_to(R)),'reason':'強調円が8xのxへ重なるため円だけ修正'},latestBookRecheck={'date':'2026-10-19','status':'修正後4幅再生と全体検証待ち'})
 shutil.copy2(video,old);shutil.copy2(video,copy)
 reports.append({'id':ident,'before':audit['previousSha256'],'after':audit['sha256'],'samples':audit['sampleFrames'],'aacPreserved':True,'audit':str((dest/'実動画の点検.json').relative_to(R))})
assert progress['sceneSourcesSha256']['数学3章_場面.js']==equiv['beforeSha256']
progress['sceneSourcesSha256']['数学3章_場面.js']=equiv['afterSha256']
for x in progress['items']:
 if not x['id'].startswith('M1-C3-'):continue
 x.setdefault('dependencySha256',{})['数学3章_場面.js']=equiv['afterSha256']
 x['latestSceneSourceReview']={'date':'2026-10-19','report':str((H/'scene-equivalence.json').relative_to(R)),'previousDependencySha256':equiv['beforeSha256'],'status':'circle revised' if x['id'] in ids else 'all samples pixel-identical; video not regenerated'}
for x in requests:
 if x['id'] in ids:x['sha256']=items[x['id']]['sha256'];x['state']='2026-10-19 円のみ修正・全AV復号と全場面目視済み／本内4幅再生と変更後全体待ち'
shutil.copy2(candidate,scene)
# Only the blue hatch changes. Preserve the exact mathematical labels and nine cell geometry.
import xml.etree.ElementTree as ET
ident='M1-C3-S2-FIG03';old=M/(ident+'.svg');new=H/'candidate'/(ident+'.svg');copy=R/('site-assets/textbook-book-math1-'+ident.lower()+'.svg')
assert sha(old)==sha(copy)
ns={'s':'http://www.w3.org/2000/svg'};a=ET.fromstring(old.read_text());b=ET.fromstring(new.read_text())
assert [t.text for t in a.findall('.//s:text',ns)]==[t.text for t in b.findall('.//s:text',ns)]
cells=lambda x:[e for e in x.findall('.//s:g/s:rect',ns) if e.get('y')=='300.0' and e.get('width')=='140.0' and e.get('height')=='130.0']
ac,bc=cells(a),cells(b);assert len(ac)==len(bc)==9
for i,(u,v) in enumerate(zip(ac,bc)):
 assert {k:z for k,z in u.attrib.items() if k!='fill'}=={k:z for k,z in v.attrib.items() if k!='fill'}
 assert v.get('fill')==('white' if i<2 else 'url(#c3-blue-hatch)')
assert len(b.findall('.//s:pattern',ns))==1
pattern_before=sha(old);shutil.copy2(new,old);shutil.copy2(new,copy);shutil.copy2(H/'candidate/c4.py',S/'図/c4.py')
for x in requests:
 if x['id']==ident:x['sha256']=sha(old);x['latestLocalRecheck']={'date':'2026-10-19','state':'既存の本文図へ指定斜線だけ追加・白2/青7/9等分/180g不変・本内検証待ち','report':str((H/'integration.json').relative_to(R))}
write(S/'69本_制作進捗.json',progress);write(S/'依頼台帳_1件ずつ.json',requests)
assert sha(R/'site-assets/textbook-book-math1.json')==booksha
write(H/'integration.json',{'date':'2026-10-19','scope':'2 circle movies + 1 hatch SVG; local only','videos':reports,'otherVideosRegenerated':0,'sceneBefore':equiv['beforeSha256'],'sceneAfter':sha(scene),'hatch':{'id':ident,'before':pattern_before,'after':sha(old)},'bookJsonUnchangedSha256':booksha,'fullSuite':'pending','playback':'pending'})
print('2 reviewed circle movies and 1 existing hatch SVG applied locally; original media retained; narration/timelines/book JSON unchanged')
