"""Adopt precisely three SVG fixes and one closed-answer placement, locally only."""
from pathlib import Path
import json,hashlib,shutil
H=Path(__file__).resolve().parent;R=H.parents[2];W=R/'教材整理/Claude_Codex共有/数学全体制作';M=W/'メディア';S=M/'制作ソース';U=W/'Claude原稿/M1-C5-S2'
load=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
write=lambda p,d:p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
assert not (H/'integration.json').exists(),'already applied'
answer=load(H/'answer-candidate-result.json');assert answer['status']=='passed'
assert load(H/'svg-candidate-result.json')['status']=='passed'
assert load(H/'answer-anchors-candidate-result.json')['status']=='passed'
browser=load(H/'answer-visibility/browser-result.json');assert browser['passed'] and browser['checks']==78
baseline=load(H/'before-image-fix-sha.json')
for path,value in baseline.items():assert sha(R/path)==value,'baseline drift '+path
for name,value in answer['sourceBefore'].items():assert sha(U/name)==value
assert sha(S/'図/c5.py')==sha(H/'previous/c5.py')
ids=['M1-C5-S2-D02','M1-C5-S2-FIG03','M1-C5-S4-FIG01']
for ident in ids:assert sha(M/(ident+'.svg'))==sha(H/'previous'/(ident+'.svg'))
previous=H/'integration-previous';previous.mkdir(exist_ok=True)
for p in [W/'制作台帳.json',W/'原稿を読む.html',W/'原稿表示台帳.json',S/'依頼台帳_1件ずつ.json',S/'69本_制作進捗.json']:
 shutil.copy2(p,previous/p.name)
shutil.copy2(H/'candidate/c5.py',S/'図/c5.py')
for ident in ids:
 for target in [M/(ident+'.svg'),R/('site-assets/textbook-book-math1-'+ident.lower()+'.svg')]:shutil.copy2(H/'candidate/svg'/(ident+'.svg'),target)
for name in ['本文.md','本の追加.json']:shutil.copy2(H/'answer-candidate'/name,U/name)
shutil.copy2(H/'answer-candidate/textbook-book-math1.json',R/'site-assets/textbook-book-math1.json')
requests=load(S/'依頼台帳_1件ずつ.json')
for x in requests:
 if x['id'] in ids:
  x['sha256']=sha(M/(x['id']+'.svg'));x['latestLocalRecheck']={'date':'2026-10-20','state':'接線の直角条件/点名の重なり修正・候補目視と座標検証済み／反映後検証待ち'}
 if x['id']=='M1-C5-S2-D03':
  x['latestLocalRecheck']={'date':'2026-10-20','state':'画像は不変。75度の答え先出し防止のためP226確認4-1の閉じた解説へ配置。旧置き場所は過去記録として保持。反映後検証待ち','currentSourcePage':'M1-P226'}
write(S/'依頼台帳_1件ずつ.json',requests)
changed={str(R/('site-assets/textbook-book-math1-'+ident.lower()+'.svg')) for ident in ids}|{str(R/'site-assets/textbook-book-math1.json'),str(S/'図/c5.py')}
for path,value in baseline.items():
 if str(R/path) not in changed:assert sha(R/path)==value,'unrelated asset changed '+path
write(H/'integration.json',{'date':'2026-10-20','scope':'local only: three existing SVG corrections; same D03 image and 75-degree table row placed in own closed answer','videosRegenerated':0,'newImagesGenerated':0,'correctedExistingImages':[{'id':ident,'beforeSha256':sha(H/'previous'/(ident+'.svg')),'afterSha256':sha(M/(ident+'.svg'))} for ident in ids],'answerBookBeforeSha256':answer['bookBeforeSha256'],'answerBookAfterSha256':answer['bookAfterSha256'],'allOtherAssetsUnchanged':True,'postIntegrationChecks':'pending','fullSuite':'pending'})
print('3 reviewed SVG fixes and exact answer placement adopted locally; all 12 videos and other assets unchanged; post-integration checks pending')
