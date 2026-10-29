# -*- coding: utf-8 -*-
from pathlib import Path
import json,hashlib
r=Path('tools/candidates/textbook-ai-20261026/review')
note='''

### 2026-10-26 続き：全体の14失敗を修正し、類題の本人用経路・回答保存・画面を手元接続

全体87031は最後まで実行し、終了コード1を実測。固定入力変更0、旧数学証跡の照合3件と新検査の作業フォルダ不一致11本が失敗し、全体は未合格。終了後にのみ、確認済みの基本AI画面の前段を厳密にたどる修正と、新検査をproject-rootから呼ぶ子シェルを適用。旧期待SHA/判定を維持して3本を再実行し終了0、残る11本も実際のrunner呼出し/検証フォルダから再実行してすべて終了0。証拠は `review/legacy-evidence-fix/cwd-recheck-result.json` と3章別ログ。前の全体を成功へ書き換えない。

30問の原因理解用類題をサーバー専用データとして手元本体へ接続。新しい全問AI解説の入力へ、元設問ID/問題文/正式解答の指紋が一致する候補IDとねらいだけを追加し、APIはその中のIDのみ選ぶ。本人の全問解説が完成し、実際に選ばれた1問であることをサーバーで再確認してから開く。別の人/別の問題/選ばれていない類題を拒否。回答前の表示データには正答/解説を含めない。明示回答後に既存採点器で判定し、通常の成績/報酬/教材は変えず専用の不変記録へ保存する。保存直前の本人変更も同じSQLで拒否。記録上限の集計も本人のキー範囲へ絞り、既存の全記録を走査しない。

画面の「この問題をやってみよう」から実際の類題を開く。回答前に本人別の受付番号と回答を実IndexedDBへ保存し、応答消失/再読込後はGETで結果を確認。同じ回答の明示再試行は同じ番号を使い、回答を変えて解き直すときは新しい番号で元の誤答を残す。自動POST/AI枠の追加使用はない。入力変更後に前の正解表示を残さず、本人切替/使用端末の再確認で親と子の画面を即時消去。端末保存不能なら採点POSTをしない。入力中の不要な外部通信・新しい常時監視タイマーは追加していない。閉じた類題の端末DB接続も閉じる。

実際の名簿→100回分の解説→共通制御/合成AI→選択済み類題→HTTP/SQLite採点/保存は125項目成功。3人×Pro/Unlimited、未完了解説拒否、本人/Origin/選択ID、Free後の再読取、二重/同時/保存応答消失、0追加AI枠、保存直前本人変更を含む。本体の純粋ライブラリ589も成功。実entry/UI/本人API/HTTP/SQLite/実IndexedDB/合成AIによる3人×390/820/1440幅は145項目成功。間違い→正解、GETだけの再読込復旧、未送信/送信済み不明の明示再試行、旧本人の遅延返信、端末保存不可、不正入力を確認。全30問の表示幅は追加の明示的な合成APIで点検し、実経路の全30対応の証明とは分けた。最終3画像を直接目視（暗色/大文字を含む）。限定5既存ファイル/5新規素材、本人ガード/preview/非キャッシュ/旧証拠保全/複製改変拒否80項目成功。既存サービス186、既存の解説画面79、既存の限定差分44/37/61も成功。意味のある検査を省略せず、同じ全体の繰返し起動はしない。

証拠：`review/practice-integration.json`、`practice-route-result.json`、`practice-browser-result.json`、`practice-main-library-result.json`、`practice-integration-result.json`。新4検査を正しい作業場所で全体runnerへ登録。以前の成功証拠は凍結し、今回の厳密な後続差分だけを戻して古い判定へつなぐ。現在コードでの旧意味検査は別名のcurrent結果へ保存し、旧成功を上書きして再利用しない。

到達範囲：30問はサーバーへ組込み済みだが、現在の教材テスト元からUIで到達できるのは20問。社会・通常ワーク/旧・定期・生成・別英検などの完了証明/画面への拡張は未完了。全形式/全問題の本体完成とは言わない。画面画像の読取り、数学説明132件/ガイド1件の候補反映、他教科105動画/画像/非admin残件も残る。今回の変更後の全体検証はまだ成功していない。公開・コミット・削除・実AI有効化・キュー資源・実Gemini・admin・新エージェント・自動作業再開・秘密値/実データ操作なし。
'''
for name in ['AI連絡/作業連絡.md','AI連絡/現在の状況.md','IMPROVEMENT_PROGRESS.md','AI連絡/大型更新_できていることと未完了_20261017.md','.claude/HANDOFF.md','2026年10月大型アップデート.md','tools/candidates/textbook-final-20261023/進捗.md','tools/candidates/textbook-ai-20261025/進捗.md']:
    with Path(name).open('a') as f:f.write(note)
p=Path('AI連絡/現在の状況.md');s=p.read_text();a=s.index('<!-- CODEX_CURRENT_TEXTBOOK_STATUS_BEGIN -->');b=s.index('<!-- CODEX_CURRENT_TEXTBOOK_STATUS_END -->',a)
v=s[a:b];v+='\n最新：全体87031は終了1、14失敗は修正後に個別終了0。全体の成功とは別。類題30をサーバー本体へ組込み、本人の選択済み解説から開く経路/回答の保存復旧/画面を接続し125/589/145/80成功。既存186/79/44/37/61も成功。到達20/30、別形式・画像読取・数学説明候補反映・最後の全体は未完了。検査は現在停止、公開なし。\n\n';p.write_text(s[:a]+v+s[b:])
p=r/'spec-progress.json';v=json.loads(p.read_text())
for item in v['items']:
    if item['requirement']=='原因別類題を本体から開く':item.update(status='main_connected_subset',evidence='main source-pinned30 library589, owned completion/selected-ID/HTTP/SQLite125, actual main+IDB145, strict delta80; current material test UI reaches20/30. Broader source formats remain pending.')
v['progressLimits']='Unweighted14-item checklist for new AI feature only. Cause practice is main-connected for existing source subset, not all formats/coverage. Whole not passed; no whole-app/time percentage.';p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
p=r/'resume.json';v=json.loads(p.read_text());v.update(status='active; full87031 failed exit1,14 individual failures repaired; main30 practice/owned route/receipts/UI125+589+145+80 verified; no tests running',activeSessions=[],next='Do not restart87031 (terminal1).14 failed suites are fixed/rechecked0. Main practice30 installed, current UI source subset20/30 only;125 HTTP/service,589 main library,145 actual UI/IDB,80 exact delta and frozen visuals, old186/79/44/37/61 passed. Remaining: source roster/UI adapters for normal workbook/social/old/term/generated/Eiken tests; textbook image/vision input; math-order-followup132 explanations+1 guide candidate1585/618 to integrate with exact325 question-field preservation; other105 media/images/nonadmin backlog. Batch authorized related changes before final standalone full; never claim old full success. No publish/commit/delete/real provider/resources/admin/new agents/automations/real data.',lastGoalTurnClassification='progress: fixed14 suite failures and connected actual owned practice route, immutable receipts/recovery and UI with145 browser checks; new whole not yet passed.');v['newProofs'].update(practiceRoute=125,practiceMainLibrary=589,practiceBrowser=145,practiceIntegration=80);v['practiceIntegration']=str(r/'practice-integration.json');p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
p=r/'source-review.json';v=json.loads(p.read_text());rows={x['file']:x for x in v['files']}
for f in ['cf-worker/src/index.js','preview/build.py','cf-worker/src/ai-test-review-content.mjs','index.html','site-assets/test-review.js','cf-worker/src/ai-review-practice-data.mjs','cf-worker/src/ai-review-practice-library.mjs','cf-worker/src/ai-review-practice-route.mjs','site-assets/review-practice.js','site-assets/review-practice.css',str(r/'practice-source.cjs'),'.claude/verify/run.sh','tools/candidates/textbook-final-20261023/reviewed_changes.py']:
    rows[f]={'file':f,'sha256':hashlib.sha256(Path(f).read_bytes()).hexdigest()}
v['files']=list(rows.values());v['status']='Current owned practice additions reviewed;125/589/145/80 passed; full87031 failed1 and14 individual fixes passed; final whole pending.';p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
p=Path('AI連絡/Claudeへ_ProAI解説と類題の並行制作_20261026.md');s=p.read_text();s=s.replace('本体の本人用経路/画面/AI入力はCodexが未接続です。','本人用経路/画面/AI入力をCodexが手元接続し125/589/145/80が成功。現在の教材テストから到達20/30で、別形式は未接続です。');s=s.replace('全体87031を二重起動せず','全体87031は終了1、14件を個別修正済みです。新しい全体を二重起動せず');p.write_text(s)
print('Main practice status and all eight records updated; whole remains incomplete.')
