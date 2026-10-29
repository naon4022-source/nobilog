"""Serial synthetic/local-runtime verification, never remote Cloudflare."""
from pathlib import Path
from datetime import datetime,timezone
import hashlib,json,subprocess
H=Path(__file__).resolve().parent;R=H.parents[2]
def running():
 return subprocess.run(['pgrep','-f',r'^(/[^ ]*/)?bash .*\.claude/verify/run.sh$'],capture_output=True).returncode!=1
if running():raise SystemExit('Required whole-app suite still live; security checks not started.')
prepared=json.loads((H/'layer-preparation.json').read_text())
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
pre=prepared.get('preFull',{})
if not pre.get('terminalKnown') or pre.get('observedExitCode')!=0:
 raise SystemExit('Required pre-full has not succeeded; keep this layer untested and unapplied.')
proofPath=pre.get('proof')
if not proofPath:raise SystemExit('Missing own terminal pre-full evidence.')
preProof=json.loads((H/proofPath).read_text())
if preProof.get('ownObservedExitCode')!=0 or preProof.get('terminal') is not True or preProof.get('wholeAppSucceeded') is not True:
 raise SystemExit('Pre-full evidence does not prove success.')
if sha(Path(preProof['log']))!=preProof.get('logSha256'):
 raise SystemExit('Pre-full log changed; inspect before testing.')
inputs={**{str((H/n).relative_to(R)):sha(H/n) for n in prepared['files']},**{n:sha(R/n) for n in prepared['existingApplicationInputs']}}
assert all(inputs[n]==digest for n,digest in prepared['existingApplicationInputs'].items()),'Application code changed externally; inspect before testing'
stamp=datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ');out=H/'checks'/stamp;out.mkdir(parents=True,exist_ok=False)
checks=[]
for name in ['verify-gateway.mjs','verify-rpc.mjs']:
 if running():raise SystemExit('A whole-app suite started; no further security check will overlap it.')
 result=subprocess.run(['node',str(H/name)],cwd=R,capture_output=True,text=True)
 log=out/(name+'.log');log.write_text(result.stdout+result.stderr)
 checks.append({'file':name,'exitCode':result.returncode,'log':str(log.relative_to(R)),'logSha256':sha(log)})
 if result.returncode:
  (out/'failure.json').write_text(json.dumps({'status':'failed','checks':checks,'inputsBefore':inputs},ensure_ascii=False,indent=2)+'\n')
  print('Security check failed; inspect',log);raise SystemExit(result.returncode)
 print(result.stdout,end='',flush=True)
assert all(sha(R/n)==digest for n,digest in inputs.items()),'Input drift; do not certify current code'
proof={'at':stamp,'status':'isolated security layer checks passed; existing application/configuration untouched','checks':checks,'inputSha256':inputs,'inputsUnchanged':True,'applicationCodeChanged':False,'configurationChanged':False,'deployed':False,'realUserData':False}
data=json.dumps(proof,ensure_ascii=False,indent=2)+'\n';(out/'verification.json').write_text(data);(H/'verification.json').write_text(data)
