# -*- coding: utf-8 -*-
from pathlib import Path
from datetime import datetime,timezone
import hashlib,json
H=Path(__file__).resolve().parent;R=H.parents[2]
names=['battle-service.mjs','verify-battle-service.mjs','verify-backend.py']
proof={'at':datetime.now(timezone.utc).isoformat(),'status':'prepared orchestration, new tests pending','files':{n:hashlib.sha256((H/n).read_bytes()).hexdigest() for n in names},'newTestsRun':False,'workerRouteIntegrated':False,'mainIntegrated':False,'published':False,'realUserData':False}
(H/'service-preparation.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n')
p=H/'resume.json';r=json.loads(p.read_text());r['status']='active: ten backend/quiz/battle/service checks prepared; external whole-app full still live';r['newBattleService']='service-preparation.json';r['next'][1]='After no whole-app full is live, run verify-backend.py serially (ten checks); preserve and fix failed logs before integration';r['next'][3]='Verify prepared battle orchestration, then add authenticated route and guarded saved-word runtime adapter; keep strict origin/action schemas';p.write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n')
p=H/'provenance.json';r=json.loads(p.read_text());r['newBattleServiceUntested']='service-preparation.json';p.write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n')
entry='''

### 2026-10-21 Codex：協力RPGの戦闘・出題・保存をつなぐ候補

battle-service.mjs に、本人用の部屋読取、接続期限、準備/開始、サーバー装備からの攻撃力、正解済み問題の出題/既存採点、回答の再送、撃破の原子的保存、保存後の更新通知までを接続した独立候補を追加。保存直前の切断や装備変更はCASで競合として扱い、最新状態から最大3回再評価する。切断で攻撃できなくなった場合も、接続状態の変化を一時停止として保存できる形。通知失敗を攻撃の失敗として再加算せず、再取得で回復するための状態を返す。本人用の表示を作る非同期処理の後にも同じ所有者で部屋を読めることを再確認する。

一連の合成SQLite検証を用意し、verify-backend.py は計10本。追加分は未実行・本体未反映で、service-preparation.json にSHAを保存。新規問題や成績/通常報酬は書き込まない。HTTP入口/保存スナップショットの本体アダプター、メニュー/UI、実通信、最終全体は残る。

Claude全体PID27824は確認時点で継続中。先に記録した3本に加え、japanese-tokkun-integration-20261016/verify-selection-browser.mjs:26 でも旧「まとめて表示」ボタン待機の時間切れを現物確認。これらを成功扱いにせず、Claude担当の共有UI/検証を重複修正しない。追加10本はこの全体の終了後に単独実行する。公開/コミット/削除/admin/実AI/実ユーザーデータ操作なし。
'''
tracking=H/'service-preparation-recorded.json';done=json.loads(tracking.read_text()) if tracking.exists() else []
for name in ['AI連絡/作業連絡.md','AI連絡/現在の状況.md','IMPROVEMENT_PROGRESS.md','AI連絡/大型更新_できていることと未完了_20261017.md','.claude/HANDOFF.md']:
 if name in done:continue
 with (R/name).open('a') as f:f.write(entry)
 done.append(name);tracking.write_text(json.dumps(done,ensure_ascii=False,indent=2)+'\n')
print('Recorded orchestration as untested and current external failures; no success inferred.')
