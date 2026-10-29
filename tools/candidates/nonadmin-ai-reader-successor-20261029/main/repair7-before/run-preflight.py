"""One isolated successor runtime preflight, pinned to exact current/candidate inputs.
Never runs the whole suite or writes application sources. Each attempt has its
own directory so failed diagnostics and earlier results are preserved.
"""
from pathlib import Path
import hashlib,json,subprocess,sys

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[3];BASE=HERE.relative_to(ROOT)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
load=lambda p:json.loads(p.read_text())
assert Path.cwd()==ROOT
assert not (HERE/'runtime-preflight.json').exists(),'Do not repeat a passing preflight without a new justified change'
spec=load(HERE/'prepared.json');assert len(spec['files'])==70 and spec['legacyNormalizedCount']==29
fixture=HERE/'successor-view';assert fixture.is_dir()
attempt=1
while (HERE/('preflight-'+str(attempt))).exists():attempt+=1
output=HERE/('preflight-'+str(attempt));output.mkdir()
steps=[('vision','tools/candidates/textbook-vision-20261027/main/verify-main-source.mjs'),('contexts','tools/candidates/textbook-ai-20261025/verify-contexts.mjs'),('current',str(BASE/'verify-main-integration.mjs'))]
results=[]
for name,entry in steps:
 log=output/(name+'.log')
 with log.open('w') as stream:
  proc=subprocess.run(['node','--preserve-symlinks','--preserve-symlinks-main',str(fixture/entry)],cwd=fixture,stdout=stream,stderr=subprocess.STDOUT)
 results.append({'name':name,'entry':entry,'exitCode':proc.returncode,'log':str(log.relative_to(ROOT)),'sha256':sha(log)})
 (output/'steps.json').write_text(json.dumps(results,indent=2)+'\n')
 print(name,'exit',proc.returncode,'log',str(log.relative_to(ROOT)),flush=True)
 if proc.returncode:sys.exit(1)
current=load(fixture/BASE/'source-current-result.json')
assert current['status']=='passed' and current['currentFiles']==70 and current['normalizations']==29 and current['newQuestionsWithActualHTTP']==48
assert current['historicalTeachingChecks']==2609 and current['historicalOriginalChecks']==37 and current['historicalVisionChecks']==49
route=load(fixture/BASE/'route-result.json');library=load(fixture/BASE/'library-result.json')
assert route['status']=='passed' and route['newQuestions']==48 and route['outside']==0
assert library['status']=='passed' and library['questions']==96 and library['shippedPreserved']==48
vision=load(fixture/'tools/candidates/textbook-vision-20261027/main/source-current-result.json');assert vision['status']=='passed'
contexts=json.loads((output/'contexts.log').read_text());assert contexts['status']=='passed' and len(contexts['books'])==6 and contexts['checks']==41
rows={r['file']:r for r in spec['files']}
files=set()
for file in load(HERE/'candidate-dependencies.json'):
 source=rows[file]['candidateFile'] if file in rows else file
 files.add(source)
for name in ['prepared.json','integration.json','candidate-guard-result.json','candidate-guard-deps7.log','apply-reviewed.py','run-preflight.py']:
 files.add(str(BASE/name))
for step in results:files.add(step['log'])
files.add(str((output/'steps.json').relative_to(ROOT)))
for name in ['source-current-result.json','library-result.json','route-result.json','previous-teaching.log','previous-vision.log','basic-index.log','basic-annotations.log']:
 files.add(str((fixture/BASE/name).relative_to(ROOT)))
files.add(str((fixture/'tools/candidates/textbook-vision-20261027/main/source-current-result.json').relative_to(ROOT)))
inputs=[{'file':f,'sha256':sha(ROOT/f)} for f in sorted(files)]
proof={'status':'passed','sourceFiles':70,'legacyNormalizations':29,'newHTTPQuestions':48,'preservedQuestions':48,'libraryChecks':library['checks'],'routeChecks':route['checks'],'contextChecks':contexts['checks'],'specSha256':sha(HERE/'prepared.json'),'steps':results,'inputs':inputs,'scope':'Exact isolated future source/96-question library/new48 private HTTP, unchanged previous assertions and actual canonical English source verification. No whole-suite claim; main integration pending.'}
(HERE/'runtime-preflight.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n')
print('Runtime preflight passed; exact70 candidate inputs pinned. Local application and final whole suite still pending.')
