from pathlib import Path
from datetime import datetime,timezone
import hashlib,json,os
H=Path(__file__).resolve().parent;R=H.parents[2]
story=json.loads((H/'story-build.json').read_text());assert story['chapters']==12 and story['sections']==36
assert hashlib.sha256((H/'物語構成.md').read_bytes()).hexdigest()==story['sourceSha256']
os.kill(24143,0)
files=['equipment.mjs','equipment-store.mjs','invitation-store.mjs','presence-store.mjs','verify-equipment.mjs','verify-equipment-store.mjs','verify-invitation-store.mjs','verify-presence-store.mjs','verify-backend.py']
manifest={'status':'prepared; backend checks deferred while whole-app full is live','observedAt':datetime.now(timezone.utc).isoformat(),'files':{n:hashlib.sha256((H/n).read_bytes()).hexdigest() for n in files},'storyBuild':'story-build.json','storyDraftComplete':True,'storyContentAndUiReviewComplete':False,'fullObservedLive':{'pid':24143,'log':'/tmp/nobi-claude-frac-layout-20261021.log','errorsAlreadyPrinted':True,'terminalResultKnown':False},'testDriverRefusedOverlap':True,'testsStartedForNewBackend':False,'mainIntegrated':False,'realUserData':False,'published':False}
(H/'backend-preparation.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
resume=json.loads((H/'resume.json').read_text())
resume.update(status='active: full12 story draft serialized, new backend modules prepared; current full and backend tests incomplete',latestIndependentCurriculumReview='../curriculum-answer-forms-review-20261021/review-verification.json',externalFull=manifest['fullObservedLive'],next=['Poll actual PID24143 and its same log; no duplicate full, no edits to Claude inputs while running','After full terminal run verify-backend.py serially; diagnose any failure without overriding existing changes','Review all12 story chapters and render from lossless story-catalog.json; generation is not content/UI proof','Implement complete guarded API orchestration: stage readiness, leases, attacks, owner-only previously-correct quiz flow and replay','Integrate dedicated modules/menu when Claude shared files and verification are stable; no overlapping edits','Verify real local RPC transport, three client views, equipment persistence and disconnection/rejoin','Run one own post-integration whole suite with exact frozen inputs and update four progress docs plus private handoff'])
(H/'resume.json').write_text(json.dumps(resume,ensure_ascii=False,indent=2)+'\n')
p=H/'provenance.json';d=json.loads(p.read_text());d['story'].update(draftChapters=list(range(1,13)),allDraftChaptersWritten=True,allChaptersComplete=False);d['newBackendUntested']='backend-preparation.json';d['currentEquipmentCatalogRequiresRecheck']=True;p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
entry='''

### 2026-10-21 Codex：協力RPG全12章初稿・招待/装備/接続期限の候補

新規物語「余白の国と、名前のない手紙」は全12章・36場面・317段落、本文20291文字の初稿がそろった。第1章からの宛先/印/配達帳の手掛かりが最終章へつながる構成。source→story-catalog.json/mjsの変換を行い、story-build.json に原稿と両データのSHAを保存。これは原稿生成/変換であり、ゲーム内表示・通しの内容点検・学習効果の確認の完了ではない。

独立候補に装備3段階とequipment-store、invitation-store、presence-storeを追加。装備残高はRPGのステージ初回クリアからだけ計算し、再クリアでは増額しない。購入はprofileのCASと操作IDを結び付け、同一結果になる同時購入でも偽の二重レシートが残らない形を準備。招待コードだけでは参加不可、本人確認・同意・ホスト承認と2〜3人上限を必要とし、期限/重複申請/ステージ進行を扱う候補。接続期限は同一人の複数タブを1人として数え、古い所有者の接続は期限前でも無効にする候補。既存成績/政治経済の現金は扱わない。

これらの新しい保存処理と追加装備は未検証・本体未反映。以前の人数/履歴99項目や通信候補2本の成功を、今回追加分の成功へ広げない。4本の専用ハーネスを用意し、verify-backend.py は実行中の全体検証を検出して開始を拒否したため、追加のモデル検証は実行0。backend-preparation.json を正本とする。

Claudeの分数/一覧レイアウト全体PID24143 /tmp/nobi-claude-frac-layout-20261021.log が実プロセスとして継続中。一部のAssertionError/TypeError出力はあるが、まだ末尾終了は未確認。入力を変更したり、別の全体/ブラウザ/モデル/AV検証を重ねたりせず、Claude担当の共通ファイルにも触れない。

残件：全12章内容/画面点検、今回の保存候補の実行検証、招待から戦闘/本人の正解済み問題への一連のAPI、同時開始/接続期限と一時停止/再開、実RPC・複数画面、ハンバーガーメニューへの本体統合、最終全体。公開/コミット/削除/admin/実AI/実ユーザーデータ/自動再開なし。ゴールは未完了。
'''
tracking=H/'backend-preparation-recorded.json';done=json.loads(tracking.read_text()) if tracking.exists() else []
for name in ['AI連絡/作業連絡.md','AI連絡/現在の状況.md','IMPROVEMENT_PROGRESS.md','AI連絡/大型更新_できていることと未完了_20261017.md','.claude/HANDOFF.md']:
 if name not in done:
  with (R/name).open('a') as f:f.write(entry)
  done.append(name);tracking.write_text(json.dumps(done,ensure_ascii=False,indent=2)+'\n')
print('Recorded complete story draft and explicitly untested backend additions; current full PID24143 still live.')
