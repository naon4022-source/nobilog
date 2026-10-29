# -*- coding: utf-8 -*-
from pathlib import Path
from datetime import datetime,timezone
import hashlib,json
H=Path(__file__).resolve().parent;R=H.parents[2]
files=['view.mjs','view.css','verify-view.mjs','view-integration.md','runtime-fixture.mjs','verify-native-rpc.mjs','invalidation-do.mjs','invalidation-hub.mjs','story-catalog.json']
proof={'at':datetime.now(timezone.utc).isoformat(),'status':'prepared only; existing whole-suite failure and one-line verifier clarification pending','files':{n:hashlib.sha256((H/n).read_bytes()).hexdigest() for n in files},'testsRun':False,'mainIntegrated':False,'deployed':False,'realData':False,'pending':['authorized old verifier correction and successful pre-full','isolated native RPC and browser execution','server-provided host flag','authoritative purchase retry IDs and serialized sends','live refresh/heartbeat/hide/owner teardown','three-client native/browser playthrough','main integration and final full']}
(H/'view-preparation.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n')
marker=H/'view-preparation-recorded.json'
if marker.exists():
 print('Manifest refreshed; progress already recorded.');raise SystemExit(0)
note='''

### 2026-10-22 協力RPGの画面候補と検証準備（未実行）

- 防御層の作業前全体検証を待つ間に、`tools/candidates/coop-story-rpg-20261021/view.mjs` と `view.css` を追加。冒険・物語・装備店・同行者付きクリア履歴の画面候補で、本体HTML・既存コード・設定は変更していない。
- 2人未満・切断・本人問題待ちの攻撃停止、本人用問題だけの表示、サーバー確定前のHP変更禁止、アカウント世代が変わった場合の表示と入力の破棄を設計。本文はtextContentで表示し、問題の数式は既存の安全な縦分数描画を接続する契約とした。
- `verify-view.mjs` に4幅・大きい文字・全12章36場面の原文一致・相方/ホスト/切断・個人問題・装備残高・所有者交代の検証を準備。ローカルworkerdの3クライアント通知検証も準備済み。いずれも未実行で、成功・実プレイ確認とは扱わない。9入力のSHAは `view-preparation.json`。
- 未完了：ホストの表示用真偽値をサーバー公開ビューへ追加、既存認証アダプター、購入/再送の操作ID、連打の送信キュー、時刻同期とハートビート、閉じる/再接続/所有者交代、3人の実画面、本体統合と最終全体検証。過去12本のバックエンド合格は変更せず保全。
'''
for path in ['AI連絡/作業連絡.md','AI連絡/現在の状況.md','IMPROVEMENT_PROGRESS.md','AI連絡/大型更新_できていることと未完了_20261017.md','.claude/HANDOFF.md']:
 with (R/path).open('a',encoding='utf-8') as f:f.write(note)
marker.write_text('{"recorded":true,"testsRun":false}\n')
print('View/native preparation hashes and actual pending work recorded; no functionality success claimed.')
