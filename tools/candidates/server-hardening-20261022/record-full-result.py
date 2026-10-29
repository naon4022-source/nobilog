# -*- coding: utf-8 -*-
from pathlib import Path
from datetime import datetime,timezone
import hashlib,json,subprocess,sys
H=Path(__file__).resolve().parent;R=H.parents[2]
if sys.argv[1:]!=['1']:raise SystemExit('Requires observed own exec56548 exit1, not a guessed result.')
if subprocess.run(['pgrep','-f',r'^(/[^ ]*/)?bash .*\.claude/verify/run.sh$'],capture_output=True).returncode!=1:raise SystemExit('Whole-app suite still live; do not record terminal.')
target=H/'pre-full-result.json'
if target.exists():print('Terminal result already recorded.');raise SystemExit(0)
log=Path('/tmp/nobi-security-before-20261022.log');text=log.read_text();assert text.rstrip().endswith('EXIT=1')
failure='tools/candidates/japanese-tokkun-integration-20261016/verify-selection-browser.mjs:26:63'
assert text.count(failure)==3
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
layer=json.loads((H/'layer-preparation.json').read_text())
workers={n:sha(R/n)==h for n,h in layer['existingApplicationInputs'].items()};assert all(workers.values())
layerFiles={n:sha(H/n)==h for n,h in layer['files'].items()};assert all(layerFiles.values())
P=R/'tools/candidates/coop-story-rpg-20261021'
backend=json.loads((P/'backend-verification.json').read_text());assert all(sha(R/n)==h for n,h in backend['inputsSha256'].items())
view=json.loads((P/'view-preparation.json').read_text());assert all(sha(P/n)==h for n,h in view['files'].items())
proof={'at':datetime.now(timezone.utc).isoformat(),'status':'pre-full failed; do not certify security layer or new RPG UI','ownExecSession':56548,'ownObservedExitCode':1,'terminal':True,'log':str(log),'logSha256':sha(log),'observedFailureFile':failure,'sameFailureOccurrences':3,'wholeAppSucceeded':False,'fullSuiteAllInputsFrozen':False,'existingWorkerShaMatches':workers,'preparedLayerInputShaMatches':layerFiles,'existingPassedBackendInputsUnchanged':len(backend['inputsSha256']),'newViewInputsUnchanged':len(view['files']),'securityAndNewViewTestsRun':False,'oneLineVerifierPatchApplied':False,'correctionAuthorizationPending':True,'applicationEditedByThisSecurityTask':False,'deployed':False,'postChangeWholeSuitePassed':False}
target.write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n')
layer['status']='prepared only; pre-full exited1, one-line verifier correction awaits user clarification'
layer['preFull']={'execSession':56548,'log':str(log),'terminalKnown':True,'observedExitCode':1,'proof':'pre-full-result.json'}
(H/'layer-preparation.json').write_text(json.dumps(layer,ensure_ascii=False,indent=2)+'\n')
resume=json.loads((P/'resume.json').read_text())
resume['currentPreFull']={'execSession':56548,'log':str(log),'terminalExitObserved':True,'ownExitCode':1,'sameSelectionVerifierFailureOccurrences':3,'correctionApprovalPending':True,'proof':'../server-hardening-20261022/pre-full-result.json'}
resume['next'][4]='Pre-security full own session56548 exited1; three old selector timeouts in the same verifier. Await its one-line correction clarification; do not claim the gate passed.'
(P/'resume.json').write_text(json.dumps(resume,ensure_ascii=False,indent=2)+'\n')
note='''

### 2026-10-22 全体検証終了1を実取得／新規候補は未検証

- 自分のexec56548が終了1。`/tmp/nobi-security-before-20261022.log` 末尾もEXIT=1、全体検証プロセスなしを確認。失敗は旧「まとめて表示」セレクターを待つ同一検証 `verify-selection-browser.mjs:26:63` の3実行。既存テストの修正1行はユーザーへの確認待ちで、適用していない。
- 全体では縦分数32・問題一覧63・非admin設定/サウンド178・大きい文字教科書48等が合格しているが、全体合格にはしない。ログSHAと自分の終了コードは `tools/candidates/server-hardening-20261022/pre-full-result.json` に保存。全体入力をすべて凍結した証拠ではない。
- 既存Worker 2本、新規防御層10入力、過去合格RPGの34入力、新しい画面候補9入力のSHA一致を記録。機能テストの重複実行はしていない。防御層・新RPG画面・新ローカルRPCの検証は未実行。本体反映・公開・最終全体成功も未完了。
- 防御の適用条件は `edge-protection-conditions.md` に公式文書付きで整理。WAF/独自ドメイン/別名入口を未確認のまま全入口保護済みと扱わない。有料契約・ドメイン購入・既定URL停止・ログイン設定変更なし。
- 元の協力RPGについては冒険/物語/装備店/同行者履歴の独立画面候補と、全12章36場面/4幅の検証準備まで前進。次は確認待ちの検証1行、単独の全体成功、その後の新防御層・RPG画面/通信の点検、認証/再送/連打/閉じる時の停止を含む本体統合。保留を含めた全項目完了とは扱わない。
'''
for path in ['AI連絡/作業連絡.md','AI連絡/現在の状況.md','IMPROVEMENT_PROGRESS.md','AI連絡/大型更新_できていることと未完了_20261017.md','.claude/HANDOFF.md']:
 with (R/path).open('a',encoding='utf-8') as f:f.write(note)
print('Own exec56548 exit1 recorded; three selector failures, unchanged worker/backend inputs and all new checks still unrun.')
