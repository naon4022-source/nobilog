"""Promote only exact reviewed successors after private runtime verification.
The immutable old71 receipts and failed whole10 remain historical evidence.
"""
from pathlib import Path
import hashlib,json,subprocess,os

ROOT=Path.cwd();HERE=Path(__file__).resolve().parent;N=Path('tools/candidates/nonadmin-ai-reader-successor-20261029/main')
load=lambda p:json.loads(p.read_text())
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert ROOT==HERE.parents[3]
assert not (HERE/'applied77.json').exists() and not (HERE/'apply77-journal.json').exists()
active=subprocess.run(['pgrep','-f',r'^bash (/Users/shimizunaotomoo/Desktop/my-app/)?\.claude/verify/run\.sh$'],capture_output=True,text=True)
assert active.returncode==1,'Whole verification active or exclusivity unknown'
full=load(ROOT/N/'full10-result.json');assert full['status']=='failed' and full['exitCode']==1 and not full['frozenDrift']
assert sha(ROOT/full['log'])==full['logSha256']
state=load(ROOT/N/'full10-process.json');assert state['status']=='finished'
proof=load(HERE/'runtime-preflight.json');assert proof['status']=='passed' and proof['sourceFiles']==77
for r in proof['inputs']:assert sha(ROOT/r['file'])==r['sha256'],r['file']
assert proof['specSha256']==sha(HERE/'prepared.json')
old=load(HERE/'old-N/prepared.json');new=load(HERE/'prepared.json')
assert len(old['files'])==71 and len(new['files'])==77
for row in old['files']:assert sha(ROOT/row['file'])==row['afterSha256'],row['file']
oldrows={r['file']:r for r in old['files']};newrows={r['file']:r for r in new['files']}
for r in new['files']:
 assert sha(ROOT/r['candidateFile'])==r['afterSha256'],r['candidateFile']
 if r['file']not in oldrows:assert sha(ROOT/r['file'])==r['beforeSha256'],r['file']
mapping=load(HERE/'virtual-map.json');changes=[]
infra={str(N/name)for name in ['prepared.json','integration.json','checked-successor.cjs','verify-main-integration.mjs','predecessor-view.mjs','route-dependencies.json']}
for target,source in mapping.items():
 dst=ROOT/target;src=ROOT/source;after=sha(src)
 if dst.exists() and sha(dst)==after:continue
 if target in infra:
  before=HERE/'old-N'/Path(target).name;assert sha(dst)==sha(before),target
 elif target in newrows:
  expected=oldrows[target]['afterSha256']if target in oldrows else newrows[target]['beforeSha256']
  assert sha(dst)==expected,target
 else:
  assert target.startswith((str(N/'before')+'/',str(N/'current-before')+'/'))and not dst.exists(),target
 changes.append({'file':target,'source':source,'beforeSha256':sha(dst)if dst.exists()else None,'afterSha256':after})
assert len([r for r in changes if r['file']in newrows])==7
assert len([r for r in changes if r['file']in infra])==6
backup=HERE/'before-apply77';backup.mkdir(exist_ok=False)
staging=HERE/'staging77';staging.mkdir(exist_ok=False)
for i,r in enumerate(changes):
 dst=ROOT/r['file']
 if dst.exists():
  b=backup/r['file'];b.parent.mkdir(parents=True,exist_ok=True);b.write_bytes(dst.read_bytes())
 (staging/str(i)).write_bytes((ROOT/r['source']).read_bytes())
journal={'status':'validated; applying reviewed77 successors','preflightSha256':sha(HERE/'runtime-preflight.json'),'files':changes,'completed':[]}
def save():(HERE/'apply77-journal.json').write_text(json.dumps(journal,ensure_ascii=False,indent=2)+'\n')
save()
for i,r in enumerate(changes):
 dst=ROOT/r['file'];assert (sha(dst)if dst.exists()else None)==r['beforeSha256'],r['file']
 dst.parent.mkdir(parents=True,exist_ok=True);os.replace(staging/str(i),dst)
 journal['completed'].append(r['file']);save()
for r in new['files']:assert sha(ROOT/r['file'])==r['afterSha256'],r['file']
checked=subprocess.run(['node','-e',"const g=require('./tools/candidates/nonadmin-ai-reader-successor-20261029/main/checked-successor.cjs');if(g.checkMainSource(process.cwd(),{assets:false}).size!==32)process.exit(1);console.log('All77 exact current successors validated')"],cwd=ROOT,capture_output=True,text=True)
(HERE/'applied77-guard.log').write_text(checked.stdout+checked.stderr);assert checked.returncode==0,checked.stderr
journal['status']='all reviewed77 successors locally applied; whole verification pending';save()
(HERE/'applied77.json').write_text(json.dumps({'status':journal['status'],'changedSourceTargets':7,'infrastructureFiles':6,'files':changes,'specSha256':sha(ROOT/N/'prepared.json'),'preflightSha256':sha(HERE/'runtime-preflight.json'),'previousWholeStatus':'failed','published':False,'realProviderCalls':0},ensure_ascii=False,indent=2)+'\n')
print('Reviewed77 successors applied locally; whole verification pending. No publication or real AI call.')
