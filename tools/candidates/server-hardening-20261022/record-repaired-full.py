# -*- coding: utf-8 -*-
from pathlib import Path
from datetime import datetime,timezone
import hashlib,json,subprocess
H=Path(__file__).resolve().parent;R=H.parents[2]
if subprocess.run(['pgrep','-f',r'^(/[^ ]*/)?bash .*\.claude/verify/run.sh$'],capture_output=True).returncode!=1:raise SystemExit('Full still live; no terminal certification.')
log=Path('/tmp/nobi-security-preflight-repaired-20261022.log');body=log.read_text();assert body.rstrip().endswith('EXIT=0') and '✅ ぜんぶ通過' in body
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
selection=json.loads((H/'selection-repair-verification.json').read_text());assert all(sha(R/n)==h for n,h in selection['inputsSha256'].items())
layer=json.loads((H/'layer-preparation.json').read_text());assert all(sha(R/n)==h for n,h in layer['existingApplicationInputs'].items())
target=H/'repaired-pre-full-result.json'
if target.exists():print('Already recorded.');raise SystemExit(0)
proof={'at':datetime.now(timezone.utc).isoformat(),'status':'repaired pre-full succeeded; new candidate checks remain separate','ownExecSession':26912,'ownObservedExitCode':0,'terminal':True,'wholeAppSucceeded':True,'log':str(log),'logSha256':sha(log),'selectionInputsUnchanged':True,'existingWorkerInputsUnchanged':True,'fullSuiteAllInputsFrozen':False,'securityAndNewViewTestsRun':False,'applicationEdited':False,'verifierOnlyOneLineEdited':True,'deployed':False}
target.write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n')
layer['status']='required repaired pre-full passed; isolated security checks next'
layer['preFull']={'execSession':26912,'log':str(log),'terminalKnown':True,'observedExitCode':0,'proof':target.name}
(H/'layer-preparation.json').write_text(json.dumps(layer,ensure_ascii=False,indent=2)+'\n')
P=R/'tools/candidates/coop-story-rpg-20261021';resume=json.loads((P/'resume.json').read_text());resume['currentPreFull']={**proof,'proof':'../server-hardening-20261022/'+target.name};resume['next'][4]='Repaired pre-security full own session26912 exited0; preserve separate proof scope and proceed with new security/RPC/UI checks.';(P/'resume.json').write_text(json.dumps(resume,ensure_ascii=False,indent=2)+'\n')
note='''

### 2026-10-22 修正後の全体検証：自分の終了0を取得

旧テスト1行の修正後、全体検証exec26912が終了0。「✅ ぜんぶ通過」と末尾EXIT=0、実プロセスなしを確認。`/tmp/nobi-security-preflight-repaired-20261022.log` のSHAと自分の終了コードは `tools/candidates/server-hardening-20261022/repaired-pre-full-result.json`。対象検証7入力と既存Worker2本は保存済みSHAに一致。全入力を凍結した証拠とは広げない。

旧exec56548の終了1と局所512項目の合格は別試行として保全。作業前全体の失敗は今回の試行で解消したため、新防御層の隔離検証、その後のRPG通信/画面検証へ進む。新候補の機能合格・本体反映・公開・全目標完了はまだ主張しない。公開/コミット/削除/admin/実AI/実ユーザーデータ/自動スケジュールの変更なし。
'''
for name in ['AI連絡/作業連絡.md','AI連絡/現在の状況.md','IMPROVEMENT_PROGRESS.md','AI連絡/大型更新_できていることと未完了_20261017.md','.claude/HANDOFF.md']:
 with (R/name).open('a',encoding='utf-8') as f:f.write(note)
print('Own exec26912 exit0 recorded; new security/native/view checks not yet certified.')
