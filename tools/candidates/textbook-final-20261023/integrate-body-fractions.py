"""Two exact frontend edits plus strict predecessor preservation; no source-text edits."""
from pathlib import Path
import json,hashlib,sys
H=Path(__file__).resolve().parent;R=H.parents[2];D=H/'body-fractions-20261025';load=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();enc=lambda o:(json.dumps(o,ensure_ascii=False,indent=2)+'\n').encode()
assert not (D/'receipt.json').exists(),'already integrated'
m=load(D/'manifest.json');tests=load(D/'context-candidate-result.json');assert tests['status']=='passed' and tests['defaultComparisons']==44094 and tests['explicitMathChecks']==68
assert not load(H/'resume.json')['activeSessions'];gate=load(H/'post-font-full-verification.json');assert gate['status']=='passed' and gate['observedExitCode']==0 and sha(Path(gate['log']))==gate['logSha256']
prior={}
for file in ['chapter6-fraction-integration.json','appendix-fraction-integration.json','science-fraction-integration.json']:prior.update({x['path']:x for x in load(H/file)['changes']})
math_ledger=load(H/'appendix-fraction-result.json');science=load(H/'science-fraction-result.json');assert math_ledger['observedExitCode']==science['observedExitCode']==0
for p,row in prior.items():
 expected=math_ledger['ledgerAfterSha256'] if p.endswith('/依頼台帳_1件ずつ.json') else science['ledgerAfterSha256'] if p.endswith('/依頼台帳_縦分数_20261025.json') else row['afterSha256'];assert sha(R/p)==expected,p+' prior change drift'
for p,expected in m['bookJsonSha256'].items():assert sha(R/p)==expected
changes=[]
for row in m['files']:
 p,before,candidate=R/row['file'],R/row['beforeFile'],R/row['candidate'];assert sha(p)==sha(before)==row['beforeSha256'] and sha(candidate)==row['afterSha256'];text=before.read_text()
 for edit in row['edits']:assert text.count(edit['before'])==1;text=text.replace(edit['before'],edit['after'])
 assert text.encode()==candidate.read_bytes();changes.append((p,candidate.read_bytes()))
p=H/'reviewed_changes.py';text=p.read_text();anchor='def before_zoom_file(relative):\n    current=R/relative';assert text.count(anchor)==1
helper='''def before_math_fraction_file(relative):
    current=R/relative
    receipt_path=H/'body-fractions-20261025/receipt.json'
    if not receipt_path.exists():
        return current
    receipt=load(receipt_path)
    found=next((r for r in receipt['files'] if r['file']==relative),None)
    if found is None:
        return current
    for row in receipt['files']:
        previous,now=R/row['beforeFile'],R/row['file']
        assert sha(previous)==row['beforeSha256'] and sha(now)==row['afterSha256']
        text=previous.read_text()
        for edit in row['edits']:
            assert text.count(edit['before'])==1
            text=text.replace(edit['before'],edit['after'])
        assert text.encode()==now.read_bytes(),row['file']+': unreviewed change outside exact math-context delta'
    for path,expected in receipt['bookJsonSha256'].items():
        assert sha(R/path)==expected
    return R/found['beforeFile']


'''
text=text.replace(anchor,helper+'def before_zoom_file(relative):\n    current=before_math_fraction_file(relative)');changes.append((p,text.encode()))
p=R/'.claude/verify/run.sh';text=p.read_text();anchor='node "$VERIFY_DIR/verify-vertical-fractions-rules.cjs" || fail=1';assert text.count(anchor)==1;changes.append((p,text.replace(anchor,anchor+'\nnode "$PROJECT_DIR/tools/candidates/textbook-final-20261023/verify-math-fraction-context.cjs" || fail=1').encode()))
receipt={**m,'status':'locally integrated; actual-book/final whole verification pending','candidateTestsSha256':sha(D/'context-candidate-result.json'),'wholeGateSha256':sha(H/'post-font-full-verification.json'),'priorScienceEvidenceSha256':sha(H/'science-fraction-result.json'),'verificationEdits':[{'file':str(p.relative_to(R)),'beforeFile':str((D/'previous'/p.relative_to(R)).relative_to(R)),'beforeSha256':sha(p),'afterSha256':hashlib.sha256(value).hexdigest()} for p,value in changes if p not in [R/x['file'] for x in m['files']]]}
for p,_ in changes:
 backup=D/'previous'/p.relative_to(R)
 if backup.exists():assert backup.read_bytes()==p.read_bytes()
 else:backup.parent.mkdir(parents=True,exist_ok=True);backup.write_bytes(p.read_bytes())
(D/'receipt.json').write_bytes(enc(receipt))
for p,value in changes:p.write_bytes(value)
for row in m['files']:assert sha(R/row['file'])==row['afterSha256']
print('Integrated exact math-context formatter/book cache changes and strict historical predecessor bridge; source JSON unchanged')
