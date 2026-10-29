"""Link only explicit public verification inputs into an isolated future-current tree."""
from pathlib import Path
import json
import hashlib
ROOT=Path.cwd()
BASE=Path('tools/candidates/textbook-final-20261023/remaining-alignment-20261028/answer-safe-v2/main')
spec=json.loads((BASE/'compat-spec.json').read_text())
rows={r['file']:r for r in spec['files']}
files=json.loads((BASE/'candidate-dependencies.json').read_text())
files += json.loads((BASE/'expansion-preflight-deps.json').read_text())
files += [str(BASE/'legacy-view.mjs'),'.claude/verify/d1-sqlite.js','tools/candidates/textbook-vision-20261027/ui-candidate/before-textbook-ai.js']
fixture=ROOT/BASE/'successor-view'
writers={str(BASE/'source-current-result.json'),str(BASE/'historical-integration.log'),'tools/candidates/textbook-vision-20261027/main/source-current-result.json'}
for file in sorted(set(files)):
 assert not Path(file).is_absolute() and '..' not in Path(file).parts
 if file in writers: continue
 source=ROOT/(rows[file]['candidateFile'] if file in rows else file)
 assert source.is_file(),file
 target=fixture/file
 target.parent.mkdir(parents=True,exist_ok=True)
 if target.is_symlink() or target.exists():
  assert target.is_symlink() and target.resolve()==source.resolve(),file
 else: target.symlink_to(source)
 assert hashlib.sha256(target.read_bytes()).digest()==hashlib.sha256(source.read_bytes()).digest(),file
print(json.dumps({'fixture':str(fixture),'publicFiles':len(set(files))}))
