from pathlib import Path
import json,hashlib,sys,time
H=Path(__file__).resolve().parent;R=H.parents[2];sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def inputs():
 paths=[R/'.claude/verify/run.sh',R/'tools/releases/auth-repair-20261019/verify-pin-browser.mjs',H/'review-manifest.json',H/'full-proof.py',H/'candidate/deploy.sh',H/'candidate/cf-worker/deploy-secure.sh',H/'check-worker-baseline.py',H/'check-published-baseline.py',H/'verify-public.py']
 # Runtime release files; deployment wrappers receive their own command-order checks.
 paths += [p for p in (H/'candidate').rglob('*') if p.is_file() and p.suffix!='.sh' and not any(x.startswith('.') for x in p.relative_to(H/'candidate').parts)]
 paths += list(H.glob('verify-*.mjs'))
 paths += list(H.glob('verify-*.py'))
 return {str(p.relative_to(R)):sha(p) for p in sorted(paths)}
mode=sys.argv[1] if len(sys.argv)>1 else 'check'
if mode=='freeze':
 (H/'full-inputs.json').write_text(json.dumps(inputs(),indent=2)+'\n');print('Exact public candidate and test inputs frozen')
elif mode=='record':
 assert sys.argv[3]=='0','observed successful exit required';log=Path(sys.argv[2]);assert log.read_text().strip().endswith('✅ ぜんぶ通過')
 assert inputs()==json.loads((H/'full-inputs.json').read_text()),'inputs changed during full suite'
 for name in ['entry-result.json','cancel-result.json','browser-result.json','account-result.json','service-result.json','races-result.json','google-api-result.json','settings-result.json','settings-flow-result.json','preservation-result.json','deploy-test-result.json']:
  d=json.loads((H/name).read_text());assert d.get('status')=='passed' or d.get('passed') is True,name
 (H/'full-verification.json').write_text(json.dumps({'observedExitCode':0,'finishedAt':time.time(),'log':str(log),'logSha256':sha(log),'inputs':inputs(),'version':'2.17.0'},indent=2)+'\n');print('Full success recorded for unchanged release candidate')
else:
 d=json.loads((H/'full-verification.json').read_text());assert d['observedExitCode']==0 and 0<=time.time()-d['finishedAt']<7200;assert sha(Path(d['log']))==d['logSha256'];assert inputs()==d['inputs'];print('Full success matches exact unchanged release candidate')
