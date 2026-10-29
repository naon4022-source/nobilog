"""Exact whole-book delta and source provenance of the closed-answer relocation."""
from pathlib import Path
import json,copy,hashlib
from verify_layout_chain import validate
H=Path(__file__).resolve().parent;R=H.parents[2];W=R/'教材整理/Claude_Codex共有/数学全体制作';U=W/'Claude原稿/M1-C5-S2'
load=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
manifest=load(H/'answer-candidate-result.json');revision=load(H/'integration.json')
before=H/'answer-previous/textbook-book-math1.json';actual=R/'site-assets/textbook-book-math1.json'
layout=(H/'layout-integration.json').exists()
# Validate the later exact layout delta before replaying the original answer
# relocation proof against its immutable intermediate book/source snapshot.
current=validate(True) if layout else actual
source=H/'layout-previous' if layout else U
assert sha(before)==manifest['bookBeforeSha256']==revision['answerBookBeforeSha256']
assert sha(current)==manifest['bookAfterSha256']==revision['answerBookAfterSha256']
old=load(before);new=load(current);expected=copy.deepcopy(old)
p=next(p for p in expected['pages'] if p.get('pid')=='M1-P225')
image=next(x for x in p['blocks'] if x.get('id')=='M1-C5-S2-D03');p['blocks'].remove(image)
p=next(p for p in expected['pages'] if p.get('pid')=='M1-P226');table=next(x for x in p['blocks'] if x['t']=='table')
row=['75° を「90°−15°」と考えて、15° を目分量でとる','15° も 30° の二等分線で作図できる。目分量は使わない']
assert table['rows'].count(row)==1;table['rows'].remove(row)
q=next(i for i,x in enumerate(p['blocks']) if x.get('x','').startswith('**確認4-1**'));answer=p['blocks'][q+2]
assert answer['summary']=='答えと解説'
answer['body'] += [{'t':'table','rows':[['まちがい','正しい考え方'],row]},image]
assert new==expected,'all other book content, problems, answers, numbers and media must remain exact'
for name,value in manifest['sourceAfter'].items():assert sha(source/name)==value
a=load(H/'answer-previous/本の追加.json');b=load(source/'本の追加.json');entry=next(x for x in a['media'] if x['id']=='M1-C5-S2-D03');entry['pid']='M1-P226';entry['hide']='確認4-1の答えを先に見せない。既存画像を閉じた「答えと解説」に配置。';assert a==b
sourceLedger=load(W/'原稿表示台帳.json');oldLedger=load(H/'integration-previous/原稿表示台帳.json')
appendix=R/'tools/candidates/math-appendix-recheck-20261021'
later_appendix=(appendix/'integration.json').exists()
assert oldLedger['readingCards']==923
changed=[x['unitId'] for x,y in zip(oldLedger['units'],sourceLedger['units']) if x!=y]
assert changed==(['M1-C5-S2','M1-APP3'] if later_appendix else ['M1-C5-S2'])
if later_appendix:
 prior=load(appendix/'integration-previous/教材整理/Claude_Codex共有/数学全体制作/原稿表示台帳.json')
 old_app=next(x for x in prior['units'] if x['unitId']=='M1-APP3')
 new_app=next(x for x in sourceLedger['units'] if x['unitId']=='M1-APP3')
 assert new_app['sha256']==sha(W/'Claude原稿/M1-APP3/本文.md')
 assert new_app['readingCards']==old_app['readingCards']-1
 assert sourceLedger['readingCards']==prior['readingCards']-1==922
else:assert sourceLedger['readingCards']==923
assert next(x for x in sourceLedger['units'] if x['unitId']=='M1-C5-S2')['sha256']==sha(U/'本文.md')
placement=load(W/'メディアの置き場所.json');assert placement['pages']==(651 if later_appendix else 652) and placement['media']['M1-C5-S2-D03']['inAnswer'] is True
(H/'answer-data-integrated-result.json').write_text(json.dumps({'status':'passed','changedSourcePages':['M1-P225','M1-P226'],'sourcePages':441,'physicalPages':placement['pages'],'readingCards':sourceLedger['readingCards'],'bookSha256':sha(actual),'answerIntermediateSha256':sha(current),'laterExactLayoutVerified':layout,'sourceWordsAndNumbersPreserved':True,'otherPagesExact':not layout,'placementInAnswer':True},ensure_ascii=False,indent=2)+'\n')
print('Closed answer data: exact original chapter5 proof plus later exact appendix chain; 441 sources /',placement['pages'],'physical /',sourceLedger['readingCards'],'cards; all words/numbers preserved')
