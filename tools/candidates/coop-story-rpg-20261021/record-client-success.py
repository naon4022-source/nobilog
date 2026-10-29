# -*- coding: utf-8 -*-
from pathlib import Path
from datetime import datetime,timezone
import json,hashlib,subprocess
H=Path(__file__).resolve().parent;R=H.parents[2];sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
proof=json.loads((H/'client-verification.json').read_text());assert all(sha(R/n)==h for n,h in proof['inputsSha256'].items());assert all(c['exitCode']==0 and sha(R/c['log'])==c['logSha256'] for c in proof['checks'])
marker=H/'client-success-recorded.json'
if marker.exists():print('Already recorded.');raise SystemExit(0)
p=H/'resume.json';d=json.loads(p.read_text());d['status']='active: repaired full, security, view548 and native notifications passed; authoritative host/command adapter additionally checked; main/three-browser lifecycle incomplete';d['backendCompositeCurrentProof']='client-verification.json';d['next'][0]='Preserve historical backend12; use current host/service/route rechecks and command proof for changed dependencies, reusing 10 unaffected checks';d['next'][1]='Wire authenticated command adapter into the view: same-operation retry, responsive bounded taps and state aggregation';d['next'][2]='Connect heartbeat, native SSE refresh, hidden/closed teardown, owner generation, room recovery and countdown; verify full three-browser gameplay';p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
note='''

### 2026-10-22 協力RPG：サーバーのホスト判定と再送アダプターが局所合格

- `battle-service.mjs` の本人用応答へ、サーバーの会員/所有者再確認後に `canHost` 真偽値だけを追加。UIDや所有者値は公開せず、既存のホスト権限検査も維持。実ルート検証にホスト=true・参加者=falseの確認を追加。
- `client-actions.mjs` を追加。既存セッションを固定したrequestコールバックを受け取り、認証値やストレージを直接扱わない。上限付きの直列操作、実行時に割り当てる攻撃/解答連番、購入/部屋/参加の固定操作ID、同一本文の再送、結果不明時の後続操作停止、本人問題が開いたら未送信タップを止める処理を実装。確定済みタップごとの追加GETを省き、サーバー応答の状態だけを反映。古い装備リビジョンの上書きと新所有者への旧応答配送を防ぐ。
- 実ルートと隔離SQLiteで、合成2人のキャラクター作成、同意、ホスト承認、準備と開始、12タップと本人の正解済み単語の再回答を確認。攻撃確定後の応答喪失→同じ連番の再送でも、HPは12だけ減り二重加算しない。通常の成績記録を作成しない。HTTP active_session失効時は安全な空の状態を通知して停止し、単なるhost_only拒否はログイン失効と混同しない。
- 自分の実行0809d1は戦闘サービス/ルート2本が終了0。変更したクライアントの実行a1e3d6も終了0、`client-verification.json` に3本のログSHAと36入力、後半実行で再利用した2本の依存不変を記録。過去のバックエンド12本は履歴として残し、影響しない10本は重ねて実行していない。古い34入力がすべて今も不変とは主張しない。
- 未完了：画面への実配線、連打のUI送信待ち、同じ操作の再試行ボタン、SSE/ハートビート/時刻同期、閉じる/非表示/所有者交代、部屋の復旧、3ブラウザの結合プレイ、本体統合と変更後全体。防御層も本番未適用。公開・コミット・削除・admin・実AI・実ユーザーデータ・スケジュール変更なし。
'''
for name in ['AI連絡/作業連絡.md','AI連絡/現在の状況.md','IMPROVEMENT_PROGRESS.md','AI連絡/大型更新_できていることと未完了_20261017.md','.claude/HANDOFF.md']:
 with (R/name).open('a',encoding='utf-8') as f:f.write(note)
result=subprocess.run(['git','diff','--check'],capture_output=True,text=True);assert result.returncode==0,'Whitespace check failed; inspect safely'
marker.write_text(json.dumps({'at':datetime.now(timezone.utc).isoformat(),'threeChecksPassed':True,'gitDiffCheckExit':0,'mainIntegrated':False,'goalComplete':False},indent=2)+'\n')
print('Current host/command proof, reused-check scope and exact lifecycle/integration gaps recorded; main remains untouched.')
