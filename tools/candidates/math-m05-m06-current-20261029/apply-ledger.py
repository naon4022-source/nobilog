"""Add two current-reader QA records only after the active whole suite is terminal."""
from pathlib import Path
import json,hashlib,os,subprocess
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[2]
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
load=lambda p:json.loads(p.read_text())
assert Path.cwd()==ROOT
assert not (HERE/'ledger-applied.json').exists(),'Do not reapply a completed QA update'
full=ROOT/'tools/candidates/nonadmin-ai-reader-successor-20261029/main'
state=load(full/'full10-process.json');result=load(full/'full10-result.json')
assert state['status']=='finished' and result['status'] in ['passed','failed']
assert state['exitCode']==result['exitCode'] and not result['frozenDrift']
assert sha(ROOT/result['log'])==result['logSha256']
try:os.kill(state['pid'],0)
except ProcessLookupError:pass
else:raise AssertionError('Recorded whole process is still live or its PID was reused')
p=subprocess.run(['pgrep','-f',r'^bash (/Users/shimizunaotomoo/Desktop/my-app/)?\.claude/verify/run\.sh$'],capture_output=True,text=True)
assert p.returncode==1,'Whole verification active or exclusivity unknown'
r=load(HERE/'ledger-prepared.json');target=ROOT/r['file'];before=ROOT/r['beforeFile'];candidate=ROOT/r['candidateFile']
assert r['file']=='教材整理/Claude_Codex共有/数学全体制作/メディア/制作ソース/依頼台帳_1件ずつ.json'
assert sha(target)==sha(before)==r['beforeSha256'] and sha(candidate)==r['afterSha256']
proof=ROOT/r['proof']['file'];assert sha(proof)==r['proof']['sha256'];check=load(proof)
assert check['status']=='passed current full reader M05/M06 verification' and check['checks']==144
for row in check['inputs']:assert sha(ROOT/row['file'])==row['sha256'],row['file']
for row in check['media']:assert sha(ROOT/row['bookAsset'])==sha(ROOT/row['sourceAsset'])==row['sha256']
for row in check['screens']:assert row['manuallyReviewed'] and sha(ROOT/row['file'])==row['sha256']
a,z=load(before),load(candidate);assert len(a)==len(z)==349
for old,new in zip(a,z):
 assert old['id']==new['id']
 if old['id'] in r['targetIDs']:assert {k:v for k,v in new.items()if k!='currentReaderVerification'}==old
 else:assert old==new
staging=HERE/'ledger-apply-staging.json';assert not staging.exists();staging.write_bytes(candidate.read_bytes());assert sha(staging)==r['afterSha256']
os.replace(staging,target);assert sha(target)==r['afterSha256']
receipt={'status':'applied two current-reader QA metadata records; whole result remains separate','file':r['file'],'beforeFile':r['beforeFile'],'beforeSha256':r['beforeSha256'],'afterSha256':r['afterSha256'],'IDs':r['targetIDs'],'unchangedRows':347,'proofSha256':r['proof']['sha256'],'previousWholeStatus':result['status'],'artworkOrQuestionsChanged':False,'published':False}
(HERE/'ledger-applied.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n')
print('Applied M05/M06 QA metadata only; other347 rows preserved. No whole-success or publication claim.')
