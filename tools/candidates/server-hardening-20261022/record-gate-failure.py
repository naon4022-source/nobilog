# -*- coding: utf-8 -*-
from pathlib import Path
import json,hashlib
H=Path(__file__).resolve().parent
marker=H/'gate-failure-observed.json'
if marker.exists():raise SystemExit('Already recorded; no duplicate append.')
R=H.parents[2]
name='tools/candidates/japanese-tokkun-integration-20261016/verify-selection-browser.mjs'
proof={'status':'pre-full observed failures; execution still live; security tests not started','execSession':56548,'log':'/tmp/nobi-security-before-20261022.log','finalExitObserved':False,'failureFile':name,'failureFileSha256':hashlib.sha256((R/name).read_bytes()).hexdigest(),'proposal':'selection-verifier-only.patch','proposalApplyCheckExit':0,'proposalApplied':False,'userClarificationPending':True,'dedicatedLayerTestsRun':False,'applicationChanged':False,'deployed':False}
marker.write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n')
note='''

### 2026-10-22 作業前検証の失敗を確認（最終終了待ち）

- 専用防御層を試す前の全体検証中に、`tools/candidates/japanese-tokkun-integration-20261016/verify-selection-browser.mjs:26` が旧「まとめて表示」ボタン待ちで失敗。同じ入口を使う複数実行で発生。全体の最終終了コードはまだ未取得。
- アプリ本体を変更しない検証1行の修正案を `tools/candidates/server-hardening-20261022/selection-verifier-only.patch` に保存し、適用可能性だけ確認済み。問題数・重複・出典ID等の確認は保持する。未適用・動作未検証。
- AGENTS.mdの作業前全成功と最新の「他のコードを変えない」の両方を守るため、検証1か所だけ直すかをユーザーへ確認中。返答前に元コードへ適用しない。追加防御層も未検証・未適用として区別。
- 待機中の独立準備として、元の協力RPGの3クライアント通知を確かめるローカルworkerdハーネスを用意（`native-rpc-preparation.json`）。こちらも未実行であり、本体統合・実アカウントの認証確認とは分ける。
'''
for path in ['AI連絡/作業連絡.md','AI連絡/現在の状況.md','IMPROVEMENT_PROGRESS.md','AI連絡/大型更新_できていることと未完了_20261017.md','.claude/HANDOFF.md']:
 with (R/path).open('a',encoding='utf-8') as f:f.write(note)
print('Observed failure, unapplied one-line proposal and independent RPG preparation recorded; terminal full result remains pending.')
