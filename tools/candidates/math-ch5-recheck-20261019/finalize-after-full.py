"""Finalize chapter-five media stage only after an observed successful full run."""
from pathlib import Path
import json,hashlib
H=Path(__file__).resolve().parent;R=H.parents[2];W=R/'教材整理/Claude_Codex共有/数学全体制作';S=W/'メディア/制作ソース'
load=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
rel=lambda p:str(p.relative_to(R));write=lambda p,d:p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
receipt=load(H/'observed-full-result.json');assert receipt['session']==79323 and receipt['observedExitCode']==0
log=Path(receipt['log']);assert sha(log)==receipt['logSha256'] and log.read_text().strip().endswith('✅ ぜんぶ通過')
assert not (H/'post-full-verification.json').exists(),'already finalized'
e=load(H/'current-evidence.json');assert e['status']=='passed' and e['bookSha256']==sha(R/'site-assets/textbook-book-math1.json')
proof={**receipt,'status':'passed','bookSha256':e['bookSha256'],'evidenceSha256':sha(H/'current-evidence.json'),'scope':'5章の既存3図修正・75度の答え非表示・原稿表示同期後の指定全体検証。主69動画の媒体点検と、付録6本・原資料全文・本文全問・新たな聴取・実機の未完了を区別。'}
write(H/'post-full-verification.json',proof)
full={'status':'passed','proof':rel(H/'post-full-verification.json')}
progress=load(S/'69本_制作進捗.json')
for x in progress['items']:
 if not x['id'].startswith('M1-C5-'):continue
 x['latestLocalRecheck']['status']='全AV・音声長・30fps・字幕同文・全302場面・本内4幅・SHA一致と変更後指定全体検証成功'
 x['latestLocalRecheck']['fullSuite']=full;x['latestBookRecheck']['fullSuite']=full
progress['verification']['chapter5Recheck']['status']='media and post-change full suite passed';progress['verification']['chapter5Recheck']['fullSuite']=full
write(S/'69本_制作進捗.json',progress)
requests=load(S/'依頼台帳_1件ずつ.json');videoIds={x['id'] for x in e['videos']}
for x in requests:
 if x['id'] in videoIds:x['state']='2026-10-20 既存動画の全AV/音声長/30fps/字幕/全場面/反映後4幅・変更後指定全体検証成功。原資料全文・新たな聴取・実機は別。'
 if x['id'] in ['M1-C5-S2-D02','M1-C5-S2-FIG03','M1-C5-S4-FIG01']:
  x['latestLocalRecheck']['state']='接線の直角条件/点名の重なりを修正。目視・座標・本内4幅・変更後指定全体検証成功。';x['latestLocalRecheck']['fullSuite']=full
 if x['id']=='M1-C5-S2-D03':
  x['latestLocalRecheck']['state']='既存画像不変。確認4-1の閉じた解説内へ配置し、開閉・読み込み・変更後指定全体検証成功。';x['latestLocalRecheck']['fullSuite']=full
write(S/'依頼台帳_1件ずつ.json',requests)
prod=load(W/'制作台帳.json');prod['latestLocalRechecks']['chapter5']['fullSuite']=full
prod['latestLocalRechecks']['chapter5']['layoutFollowup']={'status':'unresolved','newPicturelessSpreads':['416-417','420-421'],'scope':'媒体検証成功と、本の配置の残件は別。付録前に評価。'}
prod['latestLocalRechecks']['chapter4']['latestLaterBookVerification']={'fullSuite':full,'scope':'後続の5章修正による全体SHA変更。4章全ページ・媒体は不変、以前の証拠も保管。'}
write(W/'制作台帳.json',prod)
integration=load(H/'integration.json');integration['fullSuite']=full;write(H/'integration.json',integration)
active=load(H/'active-full-run.json');active.update(status='completed',observedExitCode=0,proof=rel(H/'post-full-verification.json'));write(H/'active-full-run.json',active)
report='''
## 2026-10-20 追記：数学5章の変更後・指定全体検証成功

- 単独実行した `bash .claude/verify/run.sh` が終了コード0、末尾「✅ ぜんぶ通過」。根拠：tools/candidates/math-ch5-recheck-20261019/post-full-verification.json。図3枚と75度の答え非表示、原稿表示同期を含む変更後の結果。
- 主69動画（1〜5章）の章別媒体点検・本内再生を実施済み。5章の画像なし見開き追加2か所（416-417、420-421）の配置評価が未処理なので、まずこれを確認する。その後は別枠の付録6動画。全担当動画完了とは扱わない。Claude担当6・7章19本は重複制作なし。
- 5章は既存12動画を再制作せず、全AV・音声長・30fps・字幕同文・全302場面・38画像・SHA・反映後4幅を確認。原稿441ページ・本652ページ・原稿表示923カード・マーカー2724件を保持。
- 原資料写真全文・本文全問の照合、新たな聴取、iPhone実機は未完了。サブスク/AIの契約・実費・規約判断等は保留を継続。全数学・全機能の完成とは言わない。公開・コミット・削除・admin・実Gemini・自動スケジュール変更なし。
'''
for name in ['AI連絡/数学5章_反映と検証結果_20261020.md','AI連絡/作業連絡.md','AI連絡/現在の状況.md','IMPROVEMENT_PROGRESS.md','2026年10月大型アップデート.md','.claude/HANDOFF.md']:
 with (R/name).open('a') as f:f.write(report)
with (R/'AI連絡/数学4章_反映と検証結果_20261019.md').open('a') as f:
 f.write('\n## 2026-10-20 後続の5章修正後の全体確認\n\n5章の閉じた解説への配置変更で本全体のSHAが更新された。4章全ページ・媒体は不変の前後SHA連鎖で確認し、後続の指定全体検証も成功。根拠：tools/candidates/math-ch5-recheck-20261019/post-full-verification.json。以前の証拠は同フォルダのprior-chapter-evidence/に保持。\n')
print('Observed full success recorded; main 69 media stage checked, six appendix videos and broader requirements remain')
