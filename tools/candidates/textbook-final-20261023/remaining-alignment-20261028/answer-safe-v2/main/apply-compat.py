"""Apply exactly three reviewed local compatibility changes only after full8 is terminal."""
from pathlib import Path
import json,hashlib,os
ROOT=Path.cwd();BASE=Path('tools/candidates/textbook-final-20261023/remaining-alignment-20261028/answer-safe-v2/main')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
assert not (BASE/'compat-applied.json').exists(),'Never reapply a recorded integration'
full=json.loads((BASE/'full8-result.json').read_text())
assert full['status']=='failed' and full['exitCode']==1 and full['frozenDrift']==[], 'Required terminal full8 failure with fixed inputs unchanged'
state=json.loads((BASE/'full8-process.json').read_text());assert state['status']=='finished'
assert sha(ROOT/full['log'])==full['logSha256']
preflight=json.loads((BASE/'compat-preflight-result.json').read_text());assert preflight['status']=='passed'
for row in preflight['inputs']:assert sha(ROOT/row['file'])==row['sha256'],row['file']
spec=json.loads((BASE/'compat-spec.json').read_text())
assert len(spec['files'])==67
for n,row in enumerate(spec['files']):
 assert sha(ROOT/row['beforeFile'])==row['beforeSha256'],row['beforeFile']
 assert sha(ROOT/row['candidateFile'])==row['afterSha256'],row['candidateFile']
 assert sha(ROOT/row['file'])==(row['afterSha256'] if n<64 else row['beforeSha256']),row['file']
staging=BASE/'compat-staged';staging.mkdir(exist_ok=False)
for n,row in enumerate(spec['files'][64:]):
 file=staging/str(n);file.write_bytes((ROOT/row['candidateFile']).read_bytes());assert sha(file)==row['afterSha256']
for n,row in enumerate(spec['files'][64:]):os.replace(staging/str(n),ROOT/row['file'])
for row in spec['files']:assert sha(ROOT/row['file'])==row['afterSha256'],row['file']
result={'status':'local67 exact successors integrated; final whole verification pending','files':[{ 'file':r['file'],'sha256':r['afterSha256']} for r in spec['files']],'newlyChanged':3,'unpublished':True,'previousFullFailure':{'file':str(BASE/'full8-result.json'),'sha256':sha(BASE/'full8-result.json')},'preflightSha256':sha(BASE/'compat-preflight-result.json')}
(BASE/'compat-applied.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print('Applied exactly3 reviewed compatibility/toolbar files locally; all67 final hashes match. Not published.')
