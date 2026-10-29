"""Serial isolated checks. Refuse to overlap the required whole-app suite."""
from pathlib import Path
from datetime import datetime,timezone
import hashlib,json,subprocess
H=Path(__file__).resolve().parent
R=H.parents[2]
active=subprocess.run(['pgrep','-f',r'^(/[^ ]*/)?bash .*\.claude/verify/run.sh$'],capture_output=True)
if active.returncode!=1:
 raise SystemExit('Full suite live or status unknown; backend checks were not started.')
tests=['verify-equipment.mjs','verify-equipment-store.mjs','verify-invitation-store.mjs','verify-presence-store.mjs','verify-pool.mjs','verify-word-challenges.mjs','verify-battle.mjs','verify-battle-store.mjs','verify-quiz-service.mjs','verify-battle-service.mjs','verify-route.mjs','verify-owned-word-reader.mjs']
inputs=['party-core.mjs','party-store.mjs','equipment.mjs','equipment-store.mjs','invitation-store.mjs','presence-store.mjs','story-catalog.mjs','eligible-pool.mjs','word-challenges.mjs','word-grader.mjs','word-grader-source.json','battle-core.mjs','battle-store.mjs','quiz-service.mjs','battle-service.mjs','route.mjs','owned-word-reader.mjs',*tests]
paths=[H/name for name in inputs]+[Path(__file__).resolve(),R/'.claude/verify/d1-sqlite.js',R/'site-assets/eiken-vocab.js',R/'cf-worker/src/material-bank.mjs',R/'cf-worker/src/material-engine.cjs']
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
before={str(p.relative_to(R)):sha(p) for p in paths}
stamp=datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
out=H/'backend-checks'/stamp
out.mkdir(parents=True,exist_ok=False)
checks=[]
for file in tests:
 result=subprocess.run(['node',str(H/file)],cwd=R,capture_output=True,text=True)
 log=out/(file+'.log');log.write_text(result.stdout+result.stderr)
 checks.append({'file':file,'exitCode':result.returncode,'log':str(log.relative_to(R)),'logSha256':sha(log)})
 if result.returncode:
  (out/'failure.json').write_text(json.dumps({'status':'failed','checks':checks,'inputsBefore':before},ensure_ascii=False,indent=2)+'\n')
  print(file,'failed; inspect',log);raise SystemExit(result.returncode)
 print(result.stdout,end='')
changed=[str(p.relative_to(R)) for p in paths if sha(p)!=before[str(p.relative_to(R))]]
assert not changed,changed
proof={'status':'isolated backend checks passed; live API/UI remain incomplete','at':stamp,'checks':checks,'inputsSha256':before,'inputsUnchanged':True,'realUserData':False,'network':False,'mainIntegrated':False,'published':False}
serialized=json.dumps(proof,ensure_ascii=False,indent=2)+'\n'
(out/'verification.json').write_text(serialized)
(H/'backend-verification.json').write_text(serialized)
