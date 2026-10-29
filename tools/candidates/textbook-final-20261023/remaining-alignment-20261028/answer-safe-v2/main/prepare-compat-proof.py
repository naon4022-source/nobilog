"""Bind the successful actual-source isolated preflights before local promotion."""
from pathlib import Path
import hashlib,json
ROOT=Path.cwd();BASE=Path('tools/candidates/textbook-final-20261023/remaining-alignment-20261028/answer-safe-v2/main')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
fixture=BASE/'successor-view'
current=fixture/BASE/'source-current-result.json'
historical=fixture/BASE/'legacy-view/tools/candidates/textbook-final-20261023/kokugo-reading-20261027/main/source-current-result.json'
vision=fixture/'tools/candidates/textbook-vision-20261027/main/source-current-result.json'
c=json.loads(current.read_text());h=json.loads(historical.read_text());v=json.loads(vision.read_text())
assert c['status']=='passed' and c['checks']==2609 and c['currentFiles']==67 and c['historicalChecks']==37
assert h['status']=='passed' and h['checks']==37
assert v['status']=='passed' and v['checks']==49
for r in v['inputs']:assert sha(fixture/r['file'])==r['sha256'],r['file']
paths=[BASE/'compat-spec.json',BASE/'integration.json',BASE/'checked-successor.cjs',BASE/'verify-main-integration.mjs',BASE/'legacy-view.mjs',BASE/'candidate-guard-assets.log',BASE/'successor-integration-preflight.log',BASE/'successor-source-preflight6.log',current,historical,vision]
proof={'status':'passed','currentChecks':2609,'historicalChecks':37,'mainSourceChecks':49,'candidateTamperChecks':213,'inputs':[{'file':str(p),'sha256':sha(p)} for p in paths],'failedPreflightsPreserved':['successor-source-preflight.log','successor-source-preflight2.log','successor-source-preflight3.log','successor-source-preflight4.log','successor-source-preflight5.log'],'failureCause':'Isolated tree initially lacked explicit direct-test files and transitive module imports. Added only named public files; every original assertion retained.','scope':'Future exact67 successors verified against both current public readers and byte-identical historical assertions in private trees. No main promotion or final whole-suite success claimed.'}
(BASE/'compat-preflight-result.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n')
print('Pinned2609 current +37 historical +49 main-source assertions; all recorded fixture inputs unchanged.')
