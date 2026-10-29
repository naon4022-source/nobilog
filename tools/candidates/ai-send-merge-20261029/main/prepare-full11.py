"""Freeze the reviewed77 batch and both current math metadata successors."""
from pathlib import Path
import hashlib,json
ROOT=Path.cwd();HERE=Path(__file__).resolve().parent;BASE=HERE.relative_to(ROOT)
N=Path('tools/candidates/nonadmin-ai-reader-successor-20261029/main')
P=Path('tools/candidates/math-current-reader-20261029');Q=Path('tools/candidates/math-m05-m06-current-20261029')
load=lambda p:json.loads(p.read_text())
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert not (HERE/'full11-dependencies.json').exists()
applied=load(HERE/'applied77.json');assert applied['changedSourceTargets']==7 and not applied['published']
for r in applied['files']:assert sha(ROOT/r['file'])==r['afterSha256'],r['file']
proof=load(HERE/'runtime-preflight.json');assert proof['status']=='passed'
for r in proof['inputs']:assert sha(ROOT/r['file'])==r['sha256'],r['file']
for r in load(ROOT/N/'prepared.json')['files']:assert sha(ROOT/r['file'])==r['afterSha256'],r['file']
old=load(ROOT/P/'ledger-applied.json');recent=load(ROOT/Q/'ledger-applied.json')
assert recent['IDs']==['M1-C1-S2-M05','M1-C1-S2-M06'] and recent['unchangedRows']==347
assert sha(ROOT/recent['file'])==recent['afterSha256'] and sha(ROOT/recent['beforeFile'])==recent['beforeSha256']
for r in old['files']:
 if r['file']==recent['file']:assert r['afterSha256']==recent['beforeSha256']
 else:assert sha(ROOT/r['file'])==r['afterSha256'],r['file']
files=set(load(ROOT/N/'full10-dependencies.json'))
files.update(load(HERE/'dependencies.json'))
files.update(r['file']for r in proof['inputs'])
files.update(r['target']for r in proof['inputs'])
files.update(r['file']for r in load(HERE/'fixture-generated-inputs.json')['files'])
for r in applied['files']:
 files.update([r['file'],r['source']])
 if r['beforeSha256']is not None:files.add(str(BASE/'before-apply77'/r['file']))
for r in load(ROOT/Q/'result.json')['inputs']:files.add(r['file'])
for name in ['ledger-applied.json','ledger-apply-journal.json','ledger-prepared.json','ledger-before.json','ledger-candidate.json','result.json','verify-full-reader.mjs','full/browser-result.json','full-verification.log']:
 files.add(str(Q/name))
for name in ['prepare-full11.py','run-full11.py','finalize-preflight.py','apply-reviewed77.py','applied77.json','apply77-journal.json','applied77-guard.log','runtime-preflight.json','fixture-generated-inputs.json']:
 files.add(str(BASE/name))
for f in files:assert not Path(f).is_absolute() and '..'not in Path(f).parts and (ROOT/f).is_file(),f
(HERE/'full11-dependencies.json').write_text(json.dumps(sorted(files),ensure_ascii=False,indent=2)+'\n')
print('Prepared single full11 source/evidence inputs:',len(files))
