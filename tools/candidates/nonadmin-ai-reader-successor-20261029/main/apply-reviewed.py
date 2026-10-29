"""Apply exactly six local files after a hash-bound isolated runtime preflight.
No network, publishing, commits, deletion or learner-data access. All validation
precedes replacement; the journal survives partial filesystem failure.
"""
from pathlib import Path
import hashlib,json,os,subprocess

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[3]
BASE=HERE.relative_to(ROOT)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
load=lambda p:json.loads(p.read_text())

assert Path.cwd()==ROOT,'Run from the authoritative workspace'
assert not (HERE/'applied.json').exists() and not (HERE/'apply-journal.json').exists(),'Never blindly repeat an integration'
running=subprocess.run(['pgrep','-f',r'^bash (/Users/shimizunaotomoo/Desktop/my-app/)?\.claude/verify/run\.sh$'],capture_output=True,text=True)
assert running.returncode==1,'Whole verification active or exclusivity unknown'
spec=load(HERE/'prepared.json')
assert len(spec['files'])==71 and spec['legacyNormalizedCount']==29
receipt=load(HERE/'integration.json')
assert receipt['specSha256']==sha(HERE/'prepared.json')
for row in receipt['guards']:assert sha(ROOT/row['file'])==row['sha256'],row['file']
proof=load(HERE/'runtime-preflight.json')
assert proof['status']=='passed' and proof['sourceFiles']==71 and proof['newHTTPQuestions']==48 and proof['legacyNormalizations']==29
assert proof['specSha256']==sha(HERE/'prepared.json')
for row in proof['inputs']:assert sha(ROOT/row['file'])==row['sha256'],row['file']
full=load(ROOT/spec['historicalCurrentSnapshot']['file'])
assert full['status']=='failed' and full['exitCode']==1 and not full['frozenDrift']
assert sha(ROOT/spec['historicalCurrentSnapshot']['file'])==spec['historicalCurrentSnapshot']['sha256']
changed={row['file']:row for row in spec['currentBeforeFiles']}
assert len(changed)==6
for row in spec['files']:
 assert sha(ROOT/row['beforeFile'])==row['beforeSha256'],row['beforeFile']
 assert sha(ROOT/row['candidateFile'])==row['afterSha256'],row['candidateFile']
 expected=changed[row['file']]['beforeSha256'] if row['file'] in changed else row['afterSha256']
 assert sha(ROOT/row['file'])==expected,row['file']
for row in changed.values():assert sha(ROOT/row['beforeFile'])==row['beforeSha256'],row['beforeFile']
staging=HERE/'apply-staging';staging.mkdir(exist_ok=False)
selected=[row for row in spec['files'] if row['file'] in changed]
for i,row in enumerate(selected):
 target=staging/str(i);target.write_bytes((ROOT/row['candidateFile']).read_bytes());assert sha(target)==row['afterSha256']
journal={'status':'validated; applying exactly six local files','specSha256':sha(HERE/'prepared.json'),'preflightSha256':sha(HERE/'runtime-preflight.json'),'files':selected,'completed':[]}
def save():
 (HERE/'apply-journal.json').write_text(json.dumps(journal,ensure_ascii=False,indent=2)+'\n')
save()
for i,row in enumerate(selected):
 assert sha(ROOT/row['file'])==changed[row['file']]['beforeSha256'],row['file']
 os.replace(staging/str(i),ROOT/row['file'])
 journal['completed'].append(row['file']);save()
for row in spec['files']:assert sha(ROOT/row['file'])==row['afterSha256'],row['file']
journal['status']='all six replaced; all71 final hashes match';save()
result={'status':'local71 integrated; final whole verification pending','newlyChanged':6,'questions':96,'preservedQuestions':48,'addedQuestions':48,'files':[{'file':r['file'],'sha256':r['afterSha256']} for r in spec['files']],'preflightSha256':sha(HERE/'runtime-preflight.json'),'journalSha256':sha(HERE/'apply-journal.json'),'unpublished':True}
(HERE/'applied.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print('Applied exactly six reviewed files locally; all71 final hashes match, AI96 contains unchanged old48. Final whole verification pending; unpublished.')
