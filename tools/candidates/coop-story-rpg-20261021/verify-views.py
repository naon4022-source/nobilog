from pathlib import Path
from datetime import datetime,timezone
import hashlib,json,subprocess
H=Path(__file__).resolve().parent;R=H.parents[2]
def idle():return subprocess.run(['pgrep','-f',r'^(/[^ ]*/)?bash .*\.claude/verify/run.sh$'],capture_output=True).returncode==1
assert idle(),'Do not overlap a whole suite'
gate=json.loads((H.parent/'server-hardening-20261022/repaired-pre-full-result.json').read_text());assert gate['ownObservedExitCode']==0 and gate['wholeAppSucceeded'] is True
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(Path(gate['log']))==gate['logSha256']
previous=json.loads((H/'view-preparation.json').read_text());inputs={name:sha(H/name) for name in previous['files']}
stamp=datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ');out=H/'ui-runtime-checks'/stamp;out.mkdir(parents=True,exist_ok=False);checks=[]
for name in ['verify-native-rpc.mjs','verify-view.mjs']:
 assert idle(),'A whole suite started; do not overlap'
 result=subprocess.run(['node',str(H/name)],cwd=R,capture_output=True,text=True)
 log=out/(name+'.log');log.write_text(result.stdout+result.stderr)
 checks.append({'file':name,'exitCode':result.returncode,'log':str(log.relative_to(R)),'logSha256':sha(log)})
 print(result.stdout,end='',flush=True)
 if result.returncode:
  (out/'failure.json').write_text(json.dumps({'status':'failed','checks':checks,'inputsBeforeSha256':inputs},indent=2)+'\n');print('Inspect failure:',log);raise SystemExit(result.returncode)
assert all(sha(H/name)==digest for name,digest in inputs.items()),'Input drift: cannot certify current sources'
proof={'at':stamp,'status':'isolated native notifications and view checks passed; main/playthrough integration separate','checks':checks,'inputsSha256':inputs,'inputsUnchanged':True,'mainIntegrated':False,'threeClientFullGameplayVerified':False,'realUserData':False,'deployed':False}
data=json.dumps(proof,indent=2)+'\n';(out/'verification.json').write_text(data);(H/'view-verification.json').write_text(data)
