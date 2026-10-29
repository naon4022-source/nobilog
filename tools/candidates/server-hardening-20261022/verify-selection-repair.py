from pathlib import Path
from datetime import datetime,timezone
import hashlib,json,subprocess
H=Path(__file__).resolve().parent;R=H.parents[2]
if subprocess.run(['pgrep','-f',r'^(/[^ ]*/)?bash .*\.claude/verify/run.sh$'],capture_output=True).returncode!=1:raise SystemExit('Whole suite still running; no overlap.')
stamp=datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ');out=H/'selection-checks'/stamp;out.mkdir(parents=True,exist_ok=False)
names=['tools/candidates/japanese-tokkun-integration-20261016/verify-selection-browser.mjs','site-assets/material-bank.json','site-assets/material-engine.js','site-assets/material-ui.js','site-assets/material-ui.css','tools/candidates/japanese-tokkun-integration-20261016/integration-plan.json','tools/candidates/english-tokkun-integration-20261016/integration-plan.json']
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
inputs={n:sha(R/n) for n in names};checks=[]
for flags in [['--smoke'],['--smoke','--english'],['--smoke','--drill']]:
 if subprocess.run(['pgrep','-f',r'^(/[^ ]*/)?bash .*\.claude/verify/run.sh$'],capture_output=True).returncode!=1:raise SystemExit('Whole suite started externally; no further overlap.')
 result=subprocess.run(['node',str(R/names[0]),*flags],cwd=R,capture_output=True,text=True)
 log=out/('selection-'+flags[-1].removeprefix('--')+'.log');log.write_text(result.stdout+result.stderr)
 checks.append({'flags':flags,'exitCode':result.returncode,'log':str(log.relative_to(R)),'logSha256':sha(log)})
 print(result.stdout,end='',flush=True)
 if result.returncode:
  (out/'failure.json').write_text(json.dumps({'status':'failed','checks':checks,'inputsSha256':inputs},indent=2)+'\n');print('Failure details:',log);raise SystemExit(result.returncode)
assert all(sha(R/n)==h for n,h in inputs.items()),'Input drift: cannot certify current files'
proof={'at':stamp,'status':'three corrected selection checks passed; whole suite still pending','checks':checks,'inputsSha256':inputs,'inputsUnchanged':True,'applicationEdited':False,'wholeAppSucceeded':False,'deployed':False}
data=json.dumps(proof,indent=2)+'\n';(out/'verification.json').write_text(data);(H/'selection-repair-verification.json').write_text(data)
