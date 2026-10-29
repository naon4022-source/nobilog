"""Record completed private-view checks and run the two remaining source checks.
No application source writes, whole-suite launch, network or learner data.
"""
from pathlib import Path
import hashlib,json,os,subprocess

ROOT=Path.cwd();HERE=Path(__file__).resolve().parent
BASE=HERE.relative_to(ROOT);N=Path('tools/candidates/nonadmin-ai-reader-successor-20261029/main')
VIEW=HERE/'future-view'
load=lambda p:json.loads(p.read_text())
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert not (HERE/'runtime-preflight.json').exists()
current=load(VIEW/N/'source-current-result.json')
assert current['status']=='passed' and current['currentFiles']==77 and current['normalizations']==32
assert current['currentQuestions']==96 and current['preservedQuestions']==48 and current['newQuestionsWithActualHTTP']==48
assert [current[k]for k in ['historicalTeachingChecks','historicalOriginalChecks','historicalVisionChecks']]==[2609,37,49]
assert [(r['name'],r['checks'])for r in current['batchRuns']]==[('status',43),('stage',32),('save-idle',57),('save-idle-browser',11),('math-toolbar',7)]
for name,marker in [('current-preflight.log','Combined teaching/AI77 source:'),('messages-preflight.log','✅ 138'),('retry-preflight.log','10 checks passed'),('virtual-guard4.log','247 virtual guard checks passed')]:
 assert marker in (HERE/name).read_text(),name
steps=[]
env={**os.environ,'NODE_OPTIONS':'--preserve-symlinks --preserve-symlinks-main'}
for name,entry in [('vision','tools/candidates/textbook-vision-20261027/main/verify-main-source.mjs'),('contexts','tools/candidates/textbook-ai-20261025/verify-contexts.mjs')]:
 log=HERE/(name+'-preflight.log');assert not log.exists(),'Preserve previous attempt'
 with log.open('w')as stream:proc=subprocess.run(['node',entry],cwd=VIEW,env=env,stdout=stream,stderr=subprocess.STDOUT)
 steps.append({'name':name,'exitCode':proc.returncode,'log':str(log.relative_to(ROOT)),'sha256':sha(log)})
 print(name,'exit',proc.returncode,flush=True)
 assert proc.returncode==0,name
vision=load(VIEW/'tools/candidates/textbook-vision-20261027/main/source-current-result.json')
contexts=load(HERE/'contexts-preflight.log')
assert vision['status']=='passed' and vision['checks']==49
assert contexts['status']=='passed' and contexts['checks']==41 and len(contexts['books'])==6
mapping=load(HERE/'virtual-map.json');files=set(load(HERE/'dependencies.json'))
files.update(r['file']for r in load(HERE/'fixture-generated-inputs.json')['files'])
files.update(str(BASE/x)for x in ['prepared.json','integration.json','virtual-map.json','batch-review.json','verify-main-integration.mjs','checked-successor.cjs','predecessor-view.mjs','route-dependencies.json','virtual-guard-result.json','finalize-preflight.py','apply-reviewed77.py','current-preflight.log','messages-preflight.log','retry-preflight.log','virtual-guard4.log','vision-preflight.log','contexts-preflight.log'])
inputs=[]
for target in sorted(files):
 source=mapping.get(target,target)
 assert not Path(source).is_absolute() and '..'not in Path(source).parts
 inputs.append({'file':source,'target':target,'sha256':sha(ROOT/source)})
proof={'status':'passed','sourceFiles':77,'legacyNormalizations':32,'specSha256':sha(HERE/'prepared.json'),'actualQuestions':96,'newHTTPQuestions':48,'checks':{'library':2667,'route':1394,'messagesUI':138,'retryUI':10,'guard':247,'status':43,'sendStage':32,'saveIdle':57,'saveBrowser':11,'mathToolbar':7,'vision':49,'contexts':41},'steps':steps,'inputs':inputs,'scope':'Exact future77 private source/runtime checks. Main integration and required whole verification are separate. No real provider call.'}
(HERE/'runtime-preflight.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n')
print('77-source private runtime preflight passed; inputs',len(inputs),flush=True)
