"""Build an isolated future-current tree using exact public dependency paths only."""
from pathlib import Path
import json,hashlib
ROOT=Path.cwd();BASE=Path(__file__).resolve().parent.relative_to(ROOT)
spec=json.loads((BASE/'prepared.json').read_text());rows={r['file']:r for r in spec['files']};files=set(json.loads((BASE/'candidate-dependencies.json').read_text()))
fixture=ROOT/BASE/'successor-view'
writers={str(BASE/'source-current-result.json'),str(BASE/'library-result.json'),str(BASE/'route-result.json'),str(BASE/'previous-teaching.log'),str(BASE/'previous-vision.log'),str(Path(spec['historicalGuard']).parent/'source-current-result.json'),str(Path(spec['historicalGuard']).parent/'historical-integration.log'),str(Path(spec['historicalMainSourceVerifier']).parent/'source-current-result.json')}
for file in sorted(files):
 assert not Path(file).is_absolute() and '..' not in Path(file).parts,file
 assert file.startswith(('tools/candidates/','site-assets/','cf-worker/src/','教材整理/Claude_Codex共有/')) or file in ['index.html','preview/build.py','.claude/verify/run.sh','.claude/verify/d1-sqlite.js','Claude作業/20261026_ProAI類題/practice-bank.json','tools/releases/auth-repair-20261019/verify-login-flow.mjs','tools/releases/google-link-20261019/verify-login-flow.mjs'],file
 if file in writers:continue
 source=ROOT/(rows[file]['candidateFile'] if file in rows else file);assert source.is_file(),file
 target=fixture/file;target.parent.mkdir(parents=True,exist_ok=True)
 if target.exists() or target.is_symlink():assert target.is_symlink() and target.resolve()==source.resolve(),file
 else:target.symlink_to(source)
 assert hashlib.sha256(target.read_bytes()).digest()==hashlib.sha256(source.read_bytes()).digest(),file
print(json.dumps({'status':'isolated future tree prepared; main unchanged','publicInputs':len(files),'fixture':str(fixture)}))
