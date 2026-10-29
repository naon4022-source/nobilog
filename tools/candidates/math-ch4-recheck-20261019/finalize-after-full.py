"""Finalize chapter media records only after an observed successful standalone run."""
from pathlib import Path
import json,hashlib
H=Path(__file__).resolve().parent;R=H.parents[2];W=R/'教材整理/Claude_Codex共有/数学全体制作';S=W/'メディア/制作ソース'
load=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
write=lambda p,d:p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
rel=lambda p:str(p.relative_to(R))
receipt=load(H/'observed-full-result.json')
assert receipt['observedExitCode']==0 and receipt['session']==33821
log=Path(receipt['log']);assert sha(log)==receipt['logSha256'] and log.read_text().strip().endswith('✅ ぜんぶ通過')
assert not (H/'post-full-verification.json').exists(),'already finalized'
evidence=load(H/'current-evidence.json');assert evidence['status']=='passed'
assert sha(R/'site-assets/textbook-book-math1.json')==evidence['bookSha256']
proof={**receipt,'status':'passed','bookSha256':evidence['bookSha256'],'evidenceSha256':sha(H/'current-evidence.json'),'scope':'数学4章の図条件修正3本と3章原稿表示同期後の指定全体検証。原資料全文・新たな聴取・iPhone実機・未点検5章と付録の完了は意味しない。'}
write(H/'post-full-verification.json',proof)
progress=load(S/'69本_制作進捗.json')
for x in progress['items']:
 if not x['id'].startswith('M1-C4-'):continue
 assert next(v['sha256'] for v in evidence['videos'] if v['id']==x['id'])==x['sha256']
 x['latestLocalRecheck']['status']='4章媒体の内容・全AV・30fps・音声長・字幕同文・全290場面・参照SHA・本内4幅・変更後全体検証成功'
 x['latestLocalRecheck']['fullSuite']={'status':'passed','proof':rel(H/'post-full-verification.json')}
 x['latestBookRecheck']['status']=x['latestBookRecheck']['status'].replace('／変更後全体検証待ち','／変更後全体検証成功')
 x['latestBookRecheck']['fullSuiteProof']=rel(H/'post-full-verification.json')
progress['verification']['chapter4Recheck']['status']='media and post-change full suite passed'
progress['verification']['chapter4Recheck']['fullSuite']={'status':'passed','proof':rel(H/'post-full-verification.json')}
progress['verification']['chapter3RawPreviewPostFull']={'status':'passed','proof':rel(H/'post-full-verification.json'),'scope':'M1-C3-S2原稿表示同期後の指定全体検証。従来の配置修正時の証拠は保持。'}
write(S/'69本_制作進捗.json',progress)
requests=load(S/'依頼台帳_1件ずつ.json')
for x in requests:
 if x['id'] in {v['id'] for v in evidence['videos']}:
  x['state']='2026-10-19 4章媒体点検・本内4幅・変更後全体検証成功／原資料全文・新たな聴取・実機は別'
write(S/'依頼台帳_1件ずつ.json',requests)
prod=load(W/'制作台帳.json');prod['latestLocalRechecks']['chapter4']['fullSuite']={'status':'passed','proof':rel(H/'post-full-verification.json')}
prod['latestLocalRechecks']['chapter3']['rawPreviewSync']['wholeSuiteAfterPreviewSync']={'status':'passed','proof':rel(H/'post-full-verification.json')}
write(W/'制作台帳.json',prod)
integration=load(H/'integration.json');integration['fullSuite']={'status':'passed','proof':rel(H/'post-full-verification.json')};write(H/'integration.json',integration)
# Keep the actual decode/visual audit artifacts immutable. Their adoption field
# records the earlier integration-time state; the dated receipt supersedes it.
write(H/'post-full-metadata-update.json',{'scope':'ledger status/receipt text only; audits/video/source/book bytes unchanged','fullSuiteInputEvidenceSha256':proof['evidenceSha256'],'rebindNeeded':False})
report='''
## 2026-10-19 追記：数学4章の媒体修正後・指定全体検証成功

- 指定の `bash .claude/verify/run.sh` を単独実行し、終了コード0と末尾「✅ ぜんぶ通過」を確認。根拠：tools/candidates/math-ch4-recheck-20261019/post-full-verification.json。
- 数学4章12本の媒体点検、図条件修正3本、本内4幅、全AV・音声長・30fps・字幕同文・全290場面・36画像のSHA照合を確認済み。3章原稿表示同期後の全体確認も同じ実行で成功。
- 主69動画の章別媒体点検は1〜4章の57/69本。未点検は5章12本と別枠付録6本。原資料写真全文・本文全問・新たな聴取・iPhone実機は別の未完了として保持し、全数学・全機能完了とは扱わない。次は数学5章を1章ずつの順序で進める。
- サブスク/AIの契約・費用・規約等の保留は継続。公開・コミット・削除・admin・実Gemini・自動スケジュールは変更なし。
'''
for name in ['AI連絡/数学4章_反映と検証結果_20261019.md','AI連絡/数学3章_反映と検証結果_20261019.md','AI連絡/作業連絡.md','AI連絡/現在の状況.md','IMPROVEMENT_PROGRESS.md','2026年10月大型アップデート.md','.claude/HANDOFF.md']:
 with (R/name).open('a') as f:f.write(report)
print('Observed full run recorded, chapter4 media stage finalized; chapter5/appendix and broad holds remain')
