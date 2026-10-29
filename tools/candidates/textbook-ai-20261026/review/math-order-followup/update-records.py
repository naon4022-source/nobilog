# -*- coding: utf-8 -*-
from pathlib import Path
import json,hashlib,shutil
r=Path('tools/candidates/textbook-ai-20261026/review');h=r/'math-order-followup'
note='''

### 2026-10-26 続き：数学の既存解説132件とガイド1件を生成元から手元反映

現在の正本234単元/511出典から、変更前のパッケージ6出力が完全再現されることを隔離ビルドで確認。3生成元と4確認済みJSON、生成物2本を保全してから、数学1章の計算順序を「かっこの内側から、その中では累乗→乗除→加減、同じ順位は左から」へ修正。かっこの式を底にする累乗で、途中式が12回進まず最終値へ飛ぶ場合も修正した。通常ビルダーで教材を生成し、対象4単元325問の設問/答え/数値/near/出典/順序等を保持、説明132件とガイド1件だけの変更を確認。対象外230単元と511出典はそのまま、UI/採点エンジン等の再コピーもバイト一致。数学の本JSON・動画・図・成績は変更しない。

現在の生成元に対する独立AST/Fraction検算1585、現本体/正本/独立ビルドと全項目保全741、実entry/bridge/UIとHTTP/SQLiteによる4単元×390/820/1440幅76項目が成功。60問の既存表示、ガイドの初期折りたたみ、明示回答後の説明、はみ出しなし、合成の既存成績17を保つこと、AI呼出し0を確認。12枚の実表示を原寸の3連絡シートですべて目視し、縦分数と説明の収まりを確認。PC/タブレットの同じ高さのカードの余白は既存レイアウトのままで、ついでに変更しない。類題本体の純粋ライブラリ589と本人用経路125も、この教材変更後に再成功。

証拠：`review/math-order-followup/main-integration.json`、`main-result.json`、`current-arithmetic-result.json`、`browser-result.json`、`reviewed-screens/`。成功報告の固定コピーも保存し、全体への登録2本は元の場所に依存せずproject-rootから呼ぶ。最初の隔離生成で採点エンジンをコピーしていなかった失敗、文章の中の式/説明の前置きを検査側が抽出できなかった失敗は、条件を緩めず修正して記録を保持。今回の主処理/画面検査は終了0を実測。前の全体87031の終了1は成功へ変更していない。変更後の最後の全体検証はまだ必要。

次は教科書の画面/図の読取り。現在の教科書AIは本文抜粋だけで画像未対応。既存の一般画像相談の本人ID/権利/モデル/費用処理をそのまま流用して完成とせず、3人・教科書専用権利・Pro=LUNA/Unlimited=SOL・結果不明の予約保全を確認する。類題の社会/通常ワーク/旧/定期/生成/別英検など、現在の元テストで到達しない対象への拡張も残る。105本の他教科動画/画像/その他非adminは未完了。公開・コミット・削除・実AI/キュー資源・実Gemini・admin・新エージェント・自動作業再開・秘密値/実データ操作なし。
'''
for name in ['AI連絡/作業連絡.md','AI連絡/現在の状況.md','IMPROVEMENT_PROGRESS.md','AI連絡/大型更新_できていることと未完了_20261017.md','.claude/HANDOFF.md','2026年10月大型アップデート.md','tools/candidates/textbook-final-20261023/進捗.md','tools/candidates/textbook-ai-20261025/進捗.md']:
    with Path(name).open('a') as f:f.write(note)
p=Path('AI連絡/現在の状況.md');s=p.read_text();a=s.index('<!-- CODEX_CURRENT_TEXTBOOK_STATUS_BEGIN -->');b=s.index('<!-- CODEX_CURRENT_TEXTBOOK_STATUS_END -->',a);v=s[a:b]
v=v.replace('1. 数学4単元の説明132件/ガイド1件の候補反映。325問の設問/答え/数値等を保つ隔離再生成618、独立計算1585が成功しているが本体未反映。','1. 数学の説明132件/ガイド1件は生成元・正本・パッケージへ手元反映済み。325問の設問/答え/数値等と他230単元を保持し、現本体741/独立計算1585/4単元×3幅76と全12画像の目視が成功。UI/採点/本JSON/動画/図は変更なし。')
v=v.replace('数学説明候補反映・最後の全体は未完了','最後の全体は未完了');v+='\n数学132件の反映後も類題589/125が成功。現在、検査は動いていない。次は画面/図の読取りと未対応テスト形式の拡張。\n\n';p.write_text(s[:a]+v+s[b:])
p=r/'resume.json';v=json.loads(p.read_text());v.update(status='active; math132 explanations+guide1 now main integrated;741/1585/76 and12 direct visuals passed; post-math practice589/125 passed; no tests running',activeSessions=[],next='Math-order main integrated and verified via main-integration.json (9 exact files;325 question fields/other230 units retained). Do not redo candidate generation. Next textbook vision: currently text-only. Existing generic learning-images/openai-vision/openai-image-service UID regex excludesu4, image-analysis selects SOL in Pro, old image plan rules differ from textbook-only early entitlement, priced text receipt rejects input arrays. Inspect/reuse safe codecs/transport with correct owner/consent/Pro LUNA/Unlimited SOL/quota/budget and unknown holds; do not enable providers or read secrets. Also extend owned completion/UI sources for current unreachable practice10/30 and old/term/generated/Eiken contexts. Other105 media/images/nonadmin remain. Final standalone whole still needed; prior87031 is terminal1 with14 failures repaired, not a pass.',lastGoalTurnClassification='progress: actual main math corrections integrated,325 question fields/230 unrelated units preserved,741+1585+76 and all12 images checked; library/route regressions passed.');v['newProofs'].update(mathOrderMain=741,mathOrderArithmetic=1585,mathOrderBrowser=76);v['mathOrderIntegration']=str(h/'main-integration.json');p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
p=h/'README.md';old=p.read_text();p.write_text('''# 現在：数学の計算順序の改善を手元本体へ反映済み

3生成元/4正本/2パッケージへ反映。325問の問題/答え等と他230単元を保ち、説明132件/ガイド1件だけ変更。現本体741、独立計算1585、実画面76と全12画像目視が成功。`main-integration.json` が最新の証拠。全体/公開は未完了。

## 以下は候補制作時点の履歴

'''+old)
p=h/'main-integration.json';v=json.loads(p.read_text());out=h/'accepted-proofs';out.mkdir(exist_ok=True)
for row in v['proofs']:
    target=out/Path(row['file']).name;shutil.copyfile(row['file'],target);row['file']=str(target)
p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
p=r/'source-review.json';v=json.loads(p.read_text());rows={x['file']:x for x in v['files']}
for row in json.loads((h/'main-integration.json').read_text())['files']:rows[row['file']]={'file':row['file'],'sha256':row['afterSha256']}
rows['.claude/verify/run.sh']={'file':'.claude/verify/run.sh','sha256':hashlib.sha256(Path('.claude/verify/run.sh').read_bytes()).hexdigest()};v['files']=list(rows.values());v['status']='Current math9-file delta,741/1585/76 and12 visuals reviewed; current practice589/125 passed; final whole pending.';p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
audit={'status':'next implementation requirements; no provider activation','files':[{'file':f,'sha256':hashlib.sha256(Path(f).read_bytes()).hexdigest()} for f in ['cf-worker/src/learning-images.mjs','cf-worker/src/openai-vision.mjs','cf-worker/src/openai-image-service.mjs','cf-worker/src/openai-policy.mjs','cf-worker/src/openai-priced-operation.mjs','cf-worker/src/textbook-ai-service.mjs','site-assets/textbook-ai.js','site-assets/screenshot.js']],'gaps':['Current textbook chat sends excerpt/text only.','Generic image modules currently use u[12], excluding Souta/u4.','Existing image-analysis purpose selects SOL in Pro; user requires LUNA for new textbook AI.','Generic image plan rules do not substitute for textbook-only early entitlements.','Current priced text operation explicitly rejects array input; do not bypass the journal for multimodal calls.','Generic image service refunds plan units on every generation error; verify unknown-outcome conservation before reuse.'],'safeNext':'Use existing bounded metadata-free pixel/capture components where appropriate, but verify owned textbook image context, model contract, consent/early entitlement, durable identities/quota and monetary reservations. No secrets/actual learner records/live provider.'}
(r/'vision-gap-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n')
print('Math main proofs frozen; all8 records and next vision requirements updated.')
