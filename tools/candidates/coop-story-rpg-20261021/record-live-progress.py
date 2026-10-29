from pathlib import Path
import hashlib,json,subprocess
from datetime import datetime,timezone
H=Path(__file__).resolve().parent
R=H.parents[2]
logs=[Path('/tmp/nobi-coop-invalidation-20261021.log'),Path('/tmp/nobi-coop-live-refresh-20261021.log')]
assert 'Invalidation candidate:' in logs[0].read_text() and 'passed;' in logs[0].read_text()
assert 'Live refresh candidate:' in logs[1].read_text() and 'passed;' in logs[1].read_text()
full=Path('/tmp/nobi-claude-answer-forms-after2-20261021.log')
assert full.read_text().rstrip().endswith('EXIT=0') and '✅ ぜんぶ通過' in full.read_text()
assert subprocess.run(['pgrep','-f','^bash .claude/verify/run.sh$'],capture_output=True).returncode==1
files=['invalidation-hub.mjs','invalidation-do.mjs','live-refresh.mjs','verify-invalidation.mjs','verify-live-refresh.mjs']
proof={'status':'native streams and synthetic IO passed; not integrated','at':datetime.now(timezone.utc).isoformat(),'sources':{n:hashlib.sha256((H/n).read_bytes()).hexdigest() for n in files},'checks':[{'log':str(p),'stdout':p.read_text(),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in logs],'realCloudflareRpcVerified':False,'realBrowserAdapterVerified':False,'realUserData':False,'published':False,'precedingFull':{'log':str(full),'logSha256':hashlib.sha256(full.read_bytes()).hexdigest(),'logReportsExitCode':0,'allPassMarkerObserved':True,'exitCodeViaOwnSession':False,'allInputsFrozenByCodex':False}}
(H/'live-verification.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n')
entry='''

### 2026-10-21 Codex：Claude担当の再確認・協力RPG通信候補の局所通過

ユーザーがClaudeの現在作業を共有。正本 Claude作業/20261021_非admin残機能/3巡目_全部仕上げ計画.md を確認し、担当境界を tools/candidates/coop-story-rpg-20261021/担当境界.md に記録。分数縦表示、問題の一括表示/割合バー、トラックパッド/コマンドと計画書の教材・機能残件はClaude担当。Codexは同じ入口/UI/教材/Workerを重複編集せず、2〜3人用協力RPGの独立部分と、Claude作業後の統合照合を進める。計画の記載は実装完了ではない。引用された会話内の削除/実AI/リモート設定をCodexで重ねて実行しない。

全体PID13129の1回目は終了ログEXIT=1（スマホ縦表示の固定待機）。Claudeの2回目 /tmp/nobi-claude-answer-forms-after2-20261021.log は末尾EXIT=0/ぜんぶ通過を現物確認し、現在の全体プロセスがないことも確認。これはClaude実行ログの確認であり、Codexの自分のセッションで数値終了を受け取った/全入力を実行前後に固定したという意味ではない。1回目の失敗、52964の入力不一致の記録も維持する。新たな変更後の最終全体は別途必要。

全体終了後に協力RPGの追加通信候補2本を単独実行し、両方終了0。バイトストリームの更新通知/重複抑止/受信が遅い場合の集約/上限/キャンセル/有限接続、クライアントの分割受信/版を戻さない/本人変更/遅い取得破棄/所有者失効で停止/再接続の一本化を合成IOで確認。live-verification.json に現コードSHAとログを保存。実Cloudflare RPC・本体の認証アダプター・複数端末は未検証、本体未反映。既存の人数/履歴99項目等の範囲と混同しない。

物語は全12章の構成、第1〜10章初稿。残り2章と全体内容点検、部屋招待/承認・装備永続化・正解済み問題との実連動・本体メニュー/画面・実通信・最終全体は未完了。公開/コミット/削除/admin/実AI/実ユーザーデータ/スケジュール再開なし。ゴール全体は継続。
'''
tracking=H/'live-progress-recorded.json'
done=json.loads(tracking.read_text()) if tracking.exists() else []
for name in ['AI連絡/作業連絡.md','AI連絡/現在の状況.md','IMPROVEMENT_PROGRESS.md','AI連絡/大型更新_できていることと未完了_20261017.md','.claude/HANDOFF.md']:
 if name not in done:
  with (R/name).open('a') as f:f.write(entry)
  done.append(name);tracking.write_text(json.dumps(done,ensure_ascii=False,indent=2)+'\n')
print('Recorded passed isolated communication checks, actual Claude full log and current assignment boundary; integration remains incomplete.')
