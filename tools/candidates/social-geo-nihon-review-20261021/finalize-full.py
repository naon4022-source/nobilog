"""Finalize only an observed successful post-guard full suite, with exact input proof."""
from pathlib import Path
import hashlib,json,subprocess,sys,datetime
H=Path(__file__).resolve().parent;R=H.parents[2]
load=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert len(sys.argv)==3 and sys.argv[2]=='0';session=int(sys.argv[1]);active=load(H/'full-active.json')
assert active['sessionId']==session and active['status']=='running'
assert subprocess.run(['pgrep','-f','^bash .claude/verify/run.sh$'],capture_output=True).returncode==1
log=Path(active['log']);text=log.read_text();assert text.rstrip().endswith('EXIT=0') and '✅ ぜんぶ通過' in text
frozen=load(H/'full-inputs.json')['inputs'];assert len(frozen)==active['frozenInputCount']
changed=[name for name,value in frozen.items() if not (R/name).is_file() or sha(R/name)!=value];assert not changed,changed
integration=load(H/'integration.json');source=R/integration['source'];proof=load(H/'integrated-result.json');assert proof['status']=='passed' and proof['checks']==45
assert sha(source)==integration['afterSha256']==proof['sourceSha256']
assert 'Social3 rubric guards: 45 integrated checks passed' in text
review=load(H/'source-review.json');assert review['uniqueCodexContentReviewed']==70 and review['unitSha256']==sha(source)
for row in review['sources']:assert sha(R/row['file'])==row['sha256']
receipt={'status':'passed','sessionId':session,'observedExitCode':0,'log':str(log),'logSha256':sha(log),'frozenInputCount':len(frozen),'allExplicitInputsUnchangedAtCompletion':True,'observedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'three social rubric guards,70 authored source reviews and this full suite; not general semantic grading or whole-goal completion','published':False}
(H/'post-full-verification.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n')
active.update(status='completed',observedExitCode=0,proof='post-full-verification.json');(H/'full-active.json').write_text(json.dumps(active,ensure_ascii=False,indent=2)+'\n')
integration.update(status='three local grading guards verified; post-change full passed',postFullSuite=receipt);(H/'integration.json').write_text(json.dumps(integration,ensure_ascii=False,indent=2)+'\n')
review.update(status='70 source reviews and three mechanical grading guard fixes verified; post-change full passed',postFullSuite='post-full-verification.json');(H/'source-review.json').write_text(json.dumps(review,ensure_ascii=False,indent=2)+'\n')
p=H/'resume.json';d=load(p);d.update(status='social70 content review and three local rubric fixes verified; whole goal remains incomplete',activeFull=active,next=['Audit remaining allowed nonadmin requirements against current evidence; keep unresolved requirements and decision/source holds explicit','Do not repeat finished media generation or publish']);p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
entry=f'''\n\n### 2026-10-21 Codex：社会特訓の採点3件・変更後全体成功

全体{session}の終了0・末尾「ぜんぶ通過」「EXIT=0」を同じハンドルで確認し、固定した{len(frozen)}入力SHAも全て一致。社会特訓の3採点ガードは、本体45項目・候補40項目と全体内での検査を通過。4写真に対する全70問の本文/解説/数値照合と元内容不変の証拠を保持。実データの採点/再採点・成績修正は0。正本 tools/candidates/social-geo-nihon-review-20261021/post-full-verification.json。

これは3件の機械的条件不一致の修正であり、記述の一般的な意味判定が完成した/誤採点ゼロ/他の特訓単元も完成したという意味ではない。実AI・正式契約・本人パスワード変更・バックアップ・日付/範囲/問題数等の判断資料待ちは従前の保留を維持。ゴール全体は未完了。公開/コミット/削除/admin変更なし。\n'''
for name in ['AI連絡/作業連絡.md','AI連絡/現在の状況.md','IMPROVEMENT_PROGRESS.md','AI連絡/大型更新_できていることと未完了_20261017.md','.claude/HANDOFF.md']:
 with (R/name).open('a') as f:f.write(entry)
print('Observed social post-full',session,'exit0;',len(frozen),'explicit inputs unchanged; scoped result recorded')
