"""Freeze inherited public dependencies and exact local successor/media metadata."""
from pathlib import Path
import hashlib,json
ROOT=Path.cwd();HERE=Path(__file__).resolve().parent;BASE=HERE.relative_to(ROOT)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
load=lambda p:json.loads(p.read_text())
assert not (HERE/'full10-dependencies.json').exists(),'Never overwrite fixed whole inputs'
assert load(HERE/'applied.json')['newlyChanged']==6
spec=load(HERE/'prepared.json')
for row in spec['files']:assert sha(ROOT/row['file'])==row['afterSha256'],row['file']
proof=load(HERE/'runtime-preflight.json');assert proof['status']=='passed'
for row in proof['inputs']:assert sha(ROOT/row['file'])==row['sha256'],row['file']
math=Path('tools/candidates/math-current-reader-20261029');mp=load(math/'ledger-applied.json')
assert len(mp['files'])==2
for row in mp['files']:assert sha(ROOT/row['file'])==row['afterSha256'],row['file']
files=set(load(HERE/'candidate-dependencies.json'))
files.update(['tools/candidates/textbook-ai-20261025/verify-book-signature.mjs','tools/candidates/textbook-ai-20261025/verify-contexts.mjs','tools/candidates/textbook-ai-20261025/build-contexts.mjs'])
files.update(load(Path(spec['historicalTeachingDirectory'])/'full9-dependencies.json'))
files.update(r['file'] for r in proof['inputs'])
for name in ['prepared.json','integration.json','applied.json','apply-journal.json','runtime-preflight.json','prepare-full10.py','run-full10.py','apply-reviewed.py','run-preflight.py','candidate-guard-result.json','candidate-guard-deps9.log']:
 files.add(str(BASE/name))
for name in ['prepare-ledger.py','apply-ledger.py','ledger-prepared.json','ledger-applied.json','ledger-apply-journal.json','current-math-playback-result.json','current-math-playback-manifest.json']:
 files.add(str(math/name))
for row in mp['files']:files.update([row['file'],row['beforeFile'],row['candidateFile']])
for f in files:
 assert not Path(f).is_absolute() and '..' not in Path(f).parts and (ROOT/f).is_file(),f
(HERE/'full10-dependencies.json').write_text(json.dumps(sorted(files),ensure_ascii=False,indent=2)+'\n')
print('Prepared final single-suite frozen public inputs:',len(files))
