from pathlib import Path
from datetime import datetime,timezone
import json,hashlib,subprocess,sys
H=Path(__file__).resolve().parent;R=H.parents[2]
assert subprocess.run(['pgrep','-f',r'^(/[^ ]*/)?bash .*\.claude/verify/run.sh$'],capture_output=True).returncode==1
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
old=json.loads((H/'backend-verification.json').read_text());names=list(old['inputsSha256'])+[str((H/n).relative_to(R)) for n in ['client-actions.mjs','verify-client-actions.mjs']]
inputs={n:sha(R/n) for n in names};changed=[n for n,h in old['inputsSha256'].items() if inputs[n]!=h]
assert set(changed)=={str((H/'battle-service.mjs').relative_to(R)),str((H/'verify-route.mjs').relative_to(R))},changed
stamp=datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ');out=H/'client-checks'/stamp;out.mkdir(parents=True,exist_ok=False);checks=[]
clientOnly=sys.argv[1:]==['--client-only'];assert not sys.argv[1:] or clientOnly
if clientOnly:
 prior=json.loads((H/'client-verification.json').read_text());allowed={str((H/n).relative_to(R)) for n in ['client-actions.mjs','verify-client-actions.mjs']}
 assert all(inputs[n]==h for n,h in prior['inputsSha256'].items() if n not in allowed)
 checks=prior['checks'][:2];assert all(sha(R/c['log'])==c['logSha256'] and c['exitCode']==0 for c in checks)
for name in (['verify-client-actions.mjs'] if clientOnly else ['verify-battle-service.mjs','verify-route.mjs','verify-client-actions.mjs']):
 assert subprocess.run(['pgrep','-f',r'^(/[^ ]*/)?bash .*\.claude/verify/run.sh$'],capture_output=True).returncode==1
 result=subprocess.run(['node',str(H/name)],cwd=R,capture_output=True,text=True);log=out/(name+'.log');log.write_text(result.stdout+result.stderr)
 checks.append({'file':name,'exitCode':result.returncode,'log':str(log.relative_to(R)),'logSha256':sha(log)});print(result.stdout,end='',flush=True)
 if result.returncode:
  (out/'failure.json').write_text(json.dumps({'status':'failed','checks':checks,'inputsSha256':inputs},indent=2)+'\n');print('Inspect',log);raise SystemExit(result.returncode)
assert all(sha(R/n)==h for n,h in inputs.items())
proof={'at':stamp,'status':'host projection and command adapter checks passed; browser/main lifecycle integration incomplete','checks':checks,'inputsSha256':inputs,'serialCheckInputsUnchanged':True,'reusedTwoUnchangedBackendChecks':clientOnly,'changedFromPreviousBackendProof':changed,'previousProof':'backend-verification.json','unaffectedBackendChecksNotRerun':10,'mainIntegrated':False,'realUserData':False,'deployed':False}
data=json.dumps(proof,indent=2)+'\n';(out/'verification.json').write_text(data);(H/'client-verification.json').write_text(data)
