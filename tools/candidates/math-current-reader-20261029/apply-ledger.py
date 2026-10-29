"""Apply only the two metadata candidates after the frozen full9 run is terminal."""
from pathlib import Path
import hashlib,json,os,subprocess
ROOT=Path.cwd();HERE=Path(__file__).resolve().parent
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
load=lambda p:json.loads(p.read_text())
assert not (HERE/'ledger-applied.json').exists() and not (HERE/'ledger-apply-journal.json').exists()
v=ROOT/'tools/candidates/textbook-final-20261023/remaining-alignment-20261028/answer-safe-v2/main'
assert load(v/'full9-process.json')['status']=='finished'
full=load(v/'full9-result.json');assert full['exitCode']==1 and full['status']=='failed' and not full['frozenDrift']
assert sha(ROOT/full['log'])==full['logSha256']
running=subprocess.run(['pgrep','-f',r'^bash (/Users/shimizunaotomoo/Desktop/my-app/)?\.claude/verify/run\.sh$'],capture_output=True,text=True);assert running.returncode==1
proof=load(HERE/'ledger-prepared.json');assert len(proof['files'])==2 and proof['updatedVideoRows']==75 and proof['unchangedOtherRows']==274
report=load(HERE/'current-math-playback-result.json')
for f,digest in report['inputs'].items():assert sha(ROOT/'site-assets'/f)==digest,f
for row in proof['files']:
 assert sha(ROOT/row['file'])==row['beforeSha256'] and sha(ROOT/row['beforeFile'])==row['beforeSha256'],row['file']
 assert sha(ROOT/row['candidateFile'])==row['afterSha256'],row['candidateFile']
staging=HERE/'ledger-apply-staging';staging.mkdir(exist_ok=False)
for i,row in enumerate(proof['files']):(staging/str(i)).write_bytes((ROOT/row['candidateFile']).read_bytes())
journal={'status':'metadata application started','completed':[],'preparedSha256':sha(HERE/'ledger-prepared.json')}
def save():(HERE/'ledger-apply-journal.json').write_text(json.dumps(journal,ensure_ascii=False,indent=2)+'\n')
save()
for i,row in enumerate(proof['files']):
 assert sha(ROOT/row['file'])==row['beforeSha256']
 os.replace(staging/str(i),ROOT/row['file']);journal['completed'].append(row['file']);save()
for row in proof['files']:assert sha(ROOT/row['file'])==row['afterSha256']
journal['status']='two metadata files applied; original content and Claude19 preserved';save()
(HERE/'ledger-applied.json').write_text(json.dumps({'status':journal['status'],'preparedSha256':sha(HERE/'ledger-prepared.json'),'journalSha256':sha(HERE/'ledger-apply-journal.json'),'files':proof['files'],'wholeVerificationResult':'tools/candidates/nonadmin-ai-reader-successor-20261029/main/full10-result.json','wholeVerificationStatusAtIntegration':'pending','unpublished':True},ensure_ascii=False,indent=2)+'\n')
print('Applied only current-reader metadata to75 rows and production progress; Claude19/content preserved. Final whole verification pending.')
