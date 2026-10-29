"""Apply only the reviewed three rubric guard fields; preserve all other教材/data."""
from pathlib import Path
import hashlib,json,shutil,subprocess
H=Path(__file__).resolve().parent;R=H.parents[2]
load=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert subprocess.run(['pgrep','-f','^bash .claude/verify/run.sh$'],capture_output=True).returncode==1,'wait for current full'
prior=load(R/'tools/candidates/math-appendix-recheck-20261021/post-full-verification.json')
assert prior['status']=='passed' and prior['observedExitCode']==0,'required successful preflight still pending'
assert load(H/'reproduction-result.json')['rows'] and all(x['reproduced'] for x in load(H/'reproduction-result.json')['rows'])
proof=load(H/'candidate-result.json');assert proof['status']=='passed' and proof['checks']==40
manifest=load(H/'candidate-manifest.json');source=R/manifest['source'];candidate=H/'rubric-candidate.json'
assert sha(source)==manifest['beforeSha256'] and sha(candidate)==manifest['candidateSha256']==proof['candidateSha256']
# Existing packager copies these sources; abort rather than overwrite unrelated drift.
for name in ['material-engine.js','material-ui.js','material-ui.css']:
 assert sha(R/'教材整理/実装'/name)==sha(R/'site-assets'/name),name
assert sha(R/'教材整理/実装/material-engine.js')==sha(R/'cf-worker/src/material-engine.cjs')
old=load(source);new=load(candidate);assert len(old['questions'])==len(new['questions'])==70
changed=[i+1 for i,(a,b) in enumerate(zip(old['questions'],new['questions'])) if a!=b];assert changed==[31,37,69]
for a,b in zip(old['questions'],new['questions']):
 assert {k:v for k,v in a.items() if k!='answer'}=={k:v for k,v in b.items() if k!='answer'}
backup=H/'previous';backup.mkdir(exist_ok=True)
paths=[source,R/'site-assets/material-bank.json',R/'cf-worker/src/material-bank.mjs']
for p in paths:
 dst=backup/p.relative_to(R);dst.parent.mkdir(parents=True,exist_ok=True);assert not dst.exists();shutil.copy2(p,dst)
shutil.copy2(candidate,source)
result=subprocess.run(['python3',str(R/'教材整理/scripts/build-material-assets.py')],cwd=R,capture_output=True,text=True)
(H/'package-result.json').write_text(json.dumps({'returncode':result.returncode,'output':result.stdout,'error':result.stderr},ensure_ascii=False,indent=2)+'\n');assert result.returncode==0,result.stderr
bank=load(R/'site-assets/material-bank.json');before=load(backup/'site-assets/material-bank.json');expected=dict(before);expected['units']=[new if u['id']==new['id'] else u for u in before['units']]
assert bank==expected,'only one unit with the exact three grading guard fields may change'
receipt={'status':'applied locally; integrated check and post-change full pending','source':manifest['source'],'beforeSha256':manifest['beforeSha256'],'afterSha256':sha(source),'unitId':new['id'],'changedGuardQuestions':changed,'units':len(bank['units']),'totalQuestions':sum(len(u['questions']) for u in bank['units']),'otherUnitsAndSourcesExact':True,'learnerVisibleTextUnchanged':True,'existingScoresReadOrChanged':False,'published':False}
(H/'integration.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n')
print('Applied3 grading guards,70 questions and other units/data preserved; integrated/full verification pending')
