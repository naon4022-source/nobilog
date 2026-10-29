"""Freeze public verification dependencies, including direct-test imports missing from older lists."""
from pathlib import Path
import json
BASE=Path('tools/candidates/textbook-final-20261023/remaining-alignment-20261028/answer-safe-v2/main')
files=set()
for name in ['full8-dependencies.json','candidate-dependencies.json','expansion-preflight-deps.json','direct-main-extra-deps.json','static-module-deps.json']:
 files.update(json.loads((BASE/name).read_text()));files.add(str(BASE/name))
for name in ['compat-applied.json','compat-preflight-result.json','compat-spec.json','integration.json','checked-successor.cjs','verify-main-integration.mjs','legacy-view.mjs','full8-result.json','full8.log','apply-compat.py','prepare-compat-proof.py','prepare-full9.py','verify-successor-candidate.cjs','candidate-guard-result.json','candidate-guard-assets.log']:
 files.add(str(BASE/name))
proof=json.loads((BASE/'compat-preflight-result.json').read_text())
files.update(row['file'] for row in proof['inputs'])
for file in files:
 assert Path(file).is_file(),file
 assert not Path(file).is_absolute() and '..' not in Path(file).parts,file
 assert 'successor-view' not in file or file.endswith('source-current-result.json'),file
out=BASE/'full9-dependencies.json';assert not out.exists();out.write_text(json.dumps(sorted(files),ensure_ascii=False,indent=2)+'\n')
print('Prepared full9 public frozen dependencies:',len(files))
