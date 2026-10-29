"""Resolve literal relative module dependencies without executing application modules."""
from pathlib import Path
import re,json
root=Path.cwd();base=Path('tools/candidates/textbook-final-20261023/remaining-alignment-20261028/answer-safe-v2/main')
spec=json.loads((base/'compat-spec.json').read_text());rows={r['file']:r for r in spec['files']}
queue=['tools/candidates/textbook-vision-20261027/main/verify-main-source.mjs',str(base/'verify-main-integration.mjs')];seen=set()
while queue:
 file=queue.pop()
 if file in seen:continue
 seen.add(file)
 source=root/(rows[file]['candidateFile'] if file in rows else file)
 assert source.is_file(),file
 text=source.read_text()
 for relative in re.findall(r'''(?:from\s*|import\s*\(\s*|require\s*\(\s*|import\s*)['"](\.[^'"]+)['"]''',text):
  target=(root/Path(file).parent/relative).resolve()
  if not target.suffix:
   choices=[target.with_suffix(s) for s in ['.js','.mjs','.cjs']]
   target=next((p for p in choices if p.is_file()),target)
  name=target.relative_to(root).as_posix()
  assert name.startswith(('tools/candidates/','cf-worker/src/','site-assets/','.claude/verify/')),name
  if target.suffix in ['.js','.mjs','.cjs']:queue.append(name)
for file in sorted(seen):
 source=root/(rows[file]['candidateFile'] if file in rows else file);target=root/base/'successor-view'/file
 target.parent.mkdir(parents=True,exist_ok=True)
 if not target.exists():target.symlink_to(source)
(base/'static-module-deps.json').write_text(json.dumps(sorted(seen),indent=2)+'\n')
print('Literal public module dependency closure:',len(seen))
