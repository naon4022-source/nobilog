# -*- coding: utf-8 -*-
from pathlib import Path
from datetime import datetime,timezone
import hashlib,json,subprocess
H=Path(__file__).resolve().parent;R=H.parents[2]
proof=json.loads((H/'backend-verification.json').read_text())
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert len(proof['checks'])==12 and proof['inputsUnchanged']
assert all(c['exitCode']==0 and sha(R/c['log'])==c['logSha256'] for c in proof['checks'])
changed=[name for name,digest in proof['inputsSha256'].items() if sha(R/name)!=digest]
assert not changed,changed
assert subprocess.run(['ps','-p','27824'],capture_output=True).returncode==1
log=Path('/tmp/nobi-claude-frac-layout2-20261021.log')
assert log.read_text().rstrip().endswith('EXIT=1')
external={'pid':27824,'log':str(log),'logSha256':sha(log),'observedTerminalExit':1,'observedThroughExternalLog':True,'ownSessionExitObserved':False,'mainFullSuccess':False}
(H/'external-full2-result.json').write_text(json.dumps(external,ensure_ascii=False,indent=2)+'\n')
record={'at':datetime.now(timezone.utc).isoformat(),'proof':'backend-verification.json','ownExecSession':31874,'ownExecExit':0,'checks':12,'currentInputsMatch':True,'mainIntegrated':False,'published':False}
(H/'backend-success-recorded.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n')
p=H/'resume.json';r=json.loads(p.read_text());r['status']='active: twelve isolated backend/quiz/battle/route/owned-word checks passed; main, local real RPC and browser integration incomplete';r['backendProof']='backend-verification.json';r['externalFull']=external;r['next']=[
 'Do not rerun the twelve checks unchanged; preserve exact logs and 34 input hashes',
 'Build isolated real local Worker/RPC and three-client UI harness without real accounts or data',
 'Render all12 edited chapters, avatars, shop, taps, private questions, reconnect and companion history at mobile/desktop widths',
 'Connect existing main owner/origin/permission/snapshot/notification adapters when Claude shared files are stable',
 'Resolve whole-app failed verifiers with the Claude ownership boundary intact; current whole-app full exited1',
 'After main integration run one final whole-app suite with frozen inputs and update all progress documents'
];p.write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n')
p=H/'provenance.json';r=json.loads(p.read_text());r['status']='twelve isolated checks passed with unchanged recorded inputs; main/real RPC/UI integration incomplete';r['backendVerification']='backend-verification.json';r['currentEquipmentCatalogRequiresRecheck']=False
keys=[k for k in r if k.endswith('Untested') or k in ['newBackendUntested','newRouteUntested','newWordReaderUntested']]
r.setdefault('preparationHistory',{}).update({k:r.pop(k) for k in keys})
r['remaining']=['real local Worker/RPC and browser adapters','main authentication/permission/origin/snapshot integration','hamburger menu and avatar/shop/story/battle/quiz/history UI','multiple clients, hide/close/reconnect and own save-ACK refresh','final story game/UI/play-through review','current whole-app failures and final post-integration full']
r['activeFullUnmodified']={'status':'terminal_exit1','result':'external-full2-result.json'}
p.write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n')
entry='''

### 2026-10-22 Codex：協力RPGの追加12本が隔離検証で合格

外部全体PID27824は実プロセス消滅と /tmp/nobi-claude-frac-layout2-20261021.log 末尾EXIT=1を確認。途中に記録した画面検証等の失敗が残り、全体は失敗。external-full2-result.json にログSHAと外部ログでの終了確認を保存。Codex自身の全体終了コード取得・現行本体の全体成功とは扱わない。

ほかの全体検証が動いていないことを確認後、verify-backend.py を単独実行。自分のexec session31874が終了0、追加12本がすべて終了0。装備/残高/購入競合、招待と同意/承認/2〜3人制限、接続期限と所有者、5教科の本人正解済み候補、英単語の両方向と既存採点、開始/攻撃/問題/再送、撃破のCASと全員分のクリア履歴、出題アダプター、戦闘サービス、実Request/ResponseによるHTTP入口、本人用英単語読取を合成SQLite/合成保存で確認。通常の成績・報酬の追加なし、実データ・外部APIなし。backend-verification.json と backend-checks/20261021T151125727284Z/ に各ログとSHA、実行前後不変の34入力を保存し、記録時にも一致を確認。

これは独立候補の局所合格。現在のWorkerへの認証/権限/送信元/保存ヘルパーの接続、実ローカルRPC、実画面/3クライアント、メニュー/アバター/お店/物語/戦闘/問題/履歴のUI、本体統合と最終全体は未完了。既存の録音/数学等の全体成功へ広げない。次は実データを使わないローカル画面/通信ハーネスと、本体用アダプターの統合。公開/コミット/削除/admin/実AI/実ユーザーデータ/スケジュール変更なし。
'''
tracking=H/'backend-success-progress.json';done=json.loads(tracking.read_text()) if tracking.exists() else []
for name in ['AI連絡/作業連絡.md','AI連絡/現在の状況.md','IMPROVEMENT_PROGRESS.md','AI連絡/大型更新_できていることと未完了_20261017.md','.claude/HANDOFF.md']:
 if name in done:continue
 with (R/name).open('a') as out:out.write(entry)
 done.append(name);tracking.write_text(json.dumps(done,ensure_ascii=False,indent=2)+'\n')
print('Recorded twelve passing isolated checks against 34 unchanged inputs; external whole-app full exited1 and main remains incomplete.')
