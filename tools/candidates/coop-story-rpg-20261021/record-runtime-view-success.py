# -*- coding: utf-8 -*-
from pathlib import Path
from datetime import datetime,timezone
import hashlib,json
H=Path(__file__).resolve().parent;R=H.parents[2];sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
p=H/'view-verification.json';proof=json.loads(p.read_text());assert all(c['exitCode']==0 and sha(R/c['log'])==c['logSha256'] for c in proof['checks']);assert all(sha(H/n)==h for n,h in proof['inputsSha256'].items())
marker=H/'runtime-view-success-recorded.json'
if marker.exists():print('Already recorded.');raise SystemExit(0)
proof['ownExecSession']=56007;proof['ownObservedExitCode']=0
proof['manualShopReview']=[{'width':w,'file':f'view-checks/shop-{w}.png','sha256':sha(H/f'view-checks/shop-{w}.png'),'observed':'visible labels, balance and enabled/disabled purchase; no clipping seen'} for w in [320,390,820,1280]]
proof['manualOtherPhasesReviewed']=False;p.write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n')
p=H/'view-preparation.json';d=json.loads(p.read_text());d.update({'status':'isolated native RPC and 548 view checks passed; main and full gameplay incomplete','testsRun':True,'latestVerification':'view-verification.json','files':proof['inputsSha256']});d['pending']=[x for x in d['pending'] if x not in ['authorized old verifier correction and successful pre-full','isolated native RPC and browser execution']];p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
p=H/'native-rpc-preparation.json';d=json.loads(p.read_text());d.update({'status':'native local workerd notification check passed; production ownership and full gameplay separate','testsRun':True,'latestVerification':'view-verification.json'});d['files']={n:sha(H/n) for n in d['files']};p.write_text(json.dumps(d,indent=2)+'\n')
p=H/'resume.json';d=json.loads(p.read_text());d['status']='active: required repaired full, isolated security layer, backend12, native notifications and view548 passed; main/three-client gameplay incomplete';d['latestViewVerification']='view-verification.json';d['latestSecurityVerification']='../server-hardening-20261022/verification.json';d['next']=['Preserve unchanged backend12, security gateway/native and view548 proofs; rerun only when dependencies change','Add authoritative host-display boolean, aggregated authenticated client adapter, stable retry IDs and responsive tap queue','Connect heartbeat, SSE refresh, hidden/closed teardown, owner generation and countdown; verify three-client full gameplay against actual route/storage','Review real integrated battle/question/story/equipment/history at multiple widths, not only synthetic view fixtures','Connect into main app without overwriting public Souta/Google changes; finish one final whole-app verification and synchronized progress records'];p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
note='''

### 2026-10-22 専用防御層とRPG画面/ネイティブ通知の局所合格

- 修正後の作業前全体exec26912は終了0。防御層はNodeのゲート検証合格後、Miniflare5の設定形式不一致でネイティブ検証の初回セットアップが失敗した。検証ハーネスだけを現行API形式へ直し、自分のexec59298が終了0。実ローカルworkerd/SQLite DOへ50件同時要求を送り、認証20件通過・30件429、通常要求の通過、外部通信0を確認。初回失敗を消さず、Node合格は依存SHAが不変の場合だけ再利用。`server-hardening-20261022/verification.json`。全ネイティブ入力を実行前に凍結した証拠ではない点も記録。
- 自分のexec56007が終了0。RPGのローカルworkerd/DOで3クライアントへreadyと同一の答えを含まない更新通知を配信。別の合成ブラウザ検証は320/390/820/1280pxで548項目合格。全12章36場面の原文一致、相方/ホスト/切断の表示制御、本人問題だけ、入力保持、装備予算、所有者交代時の表示破棄を確認。9入力は実行前後不変。`coop-story-rpg-20261021/view-verification.json`。
- 装備店の画像は4幅を実際に目視し、残高・購入可否・文字・折り返し・欠けを確認。ほかの場面の全目視、実際の3人プレイ、連打の応答性は未確認。ネイティブ通知と合成画面の個別合格を、実アカウントの認証やゲーム全体の結合合格とは扱わない。
- 防御層は既存Workerをimportする候補のまま。本番・確認版の設定、binding/migration、WAF、独自ドメイン、公開は変更しておらず、防御が有効になったとは主張しない。
- 次は元の協力RPGへ戻り、サーバーのホスト判定、認証付き集約アダプター、再送ID、連打キュー、ハートビート/閉じる/所有者交代/時刻同期を接続し、実ルート/保存を使う3人結合確認、本体反映と最終全体を行う。公開/コミット/削除/admin/実AI/実ユーザーデータ/スケジュール変更なし。全ゴールは未完了。
'''
for name in ['AI連絡/作業連絡.md','AI連絡/現在の状況.md','IMPROVEMENT_PROGRESS.md','AI連絡/大型更新_できていることと未完了_20261017.md','.claude/HANDOFF.md']:
 with (R/name).open('a',encoding='utf-8') as f:f.write(note)
marker.write_text(json.dumps({'at':datetime.now(timezone.utc).isoformat(),'ownExecSession':56007,'ownExit':0,'recorded':True,'mainIntegrated':False},indent=2)+'\n')
print('Own native/view success and four-width shop visual review recorded; main/real gameplay/production protection remain incomplete.')
