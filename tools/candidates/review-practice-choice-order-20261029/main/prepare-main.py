"""Prepare an exact4-file AI successor only after the single full9 run succeeds.
No application files are changed. Candidate/predecessor files are kept separately.
"""
from pathlib import Path
import json,hashlib,os
ROOT=Path.cwd();HERE=Path(__file__).resolve().parent;BASE=HERE.relative_to(ROOT);PARENT=HERE.parent
V=Path('tools/candidates/textbook-final-20261023/remaining-alignment-20261028/answer-safe-v2/main')
K=Path('tools/candidates/textbook-final-20261023/kokugo-reading-20261027/main')
M=Path('tools/candidates/textbook-vision-20261027/main')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
full_path=V/'full9-result.json'
assert full_path.is_file(),'full9 is not terminal; do not prepare from a running baseline'
full=json.loads(full_path.read_text());assert full['status']=='passed' and full['exitCode']==0 and not full['frozenDrift'] and full['terminalSuccessMarker'],'Fix the failed required verification before AI promotion'
assert sha(ROOT/full['log'])==full['logSha256']
for r in full['inputs']:assert sha(ROOT/r['file'])==r['sha256'],r['file']
assert not (HERE/'prepared.json').exists(),'Do not overwrite a prepared integration'
approval_path=PARENT/'clarity/approval.json';approval=json.loads(approval_path.read_text());candidate=PARENT/'clarity/ai-review-practice-data.mjs'
assert approval['status']=='reviewed candidate; main integration pending' and approval['candidateSha256']==sha(candidate)
for r in approval['proofs']:assert sha(ROOT/r['file'])==r['sha256'],r['file']
parse=lambda p:json.loads(p.read_text().removeprefix('export default ').rstrip().removesuffix(';'))
old=parse(Path('cf-worker/src/ai-review-practice-data.mjs'));new=parse(candidate)
assert len(old['questions'])==48 and len(new['questions'])==96
for q in old['questions']:assert next(v for v in new['questions'] if v['id']==q['id'])==q
for p in old['patterns']:assert next(v for v in new['patterns'] if v['id']==p['id'])==p
for r in old['references']:assert r in new['references']
for key in ['legacyQuestions','legacyPatterns']:assert new[key]==old[key]
files=['cf-worker/src/ai-review-practice-data.mjs',str(K/'checked-successor.cjs'),str(K/'verify-main-integration.mjs'),str(M/'verify-main-source.mjs')]
rows=[];output=HERE/'output'
for f in files:
 before=HERE/'before'/f;before.parent.mkdir(parents=True,exist_ok=True);before.write_bytes((ROOT/f).read_bytes())
 target=output/f;target.parent.mkdir(parents=True,exist_ok=True)
 if f==files[0]:target.write_bytes(candidate.read_bytes())
 elif f==files[1]:
  rel=os.path.relpath(HERE/'checked-successor.cjs',(ROOT/f).parent);target.write_text('// Exact reviewed AI96 successor; unchanged historical checks remain required.\nmodule.exports=require('+json.dumps(rel)+');\n')
 elif f==files[2]:
  rel=os.path.relpath(HERE/'verify-main-integration.mjs',(ROOT/f).parent);target.write_text('// Current AI96 integration and immutable previous teaching assertions.\nimport '+json.dumps(rel)+';\n')
 else:
  text=before.read_text();edits=[('same(before.size,27,','same(before.size,28,'),('same(checkMainSource(sandbox,{assets:false}).size,27,','same(checkMainSource(sandbox,{assets:false}).size,28,')]
  for a,b in edits:assert text.count(a)==1;text=text.replace(a,b)
  target.write_text(text)
 row={'file':f,'beforeFile':str(before.relative_to(ROOT)),'beforeSha256':sha(before),'candidateFile':str(target.relative_to(ROOT)),'afterSha256':sha(target)}
 if f==files[3]:row['edits']=[{'before':a,'after':b} for a,b in edits]
 rows.append(row)
spec={'status':'reviewed4 exact AI96 successor; progress/global validation separate','files':rows,'previousFull':{'file':str(full_path),'sha256':sha(full_path),'inputs':len(full['inputs'])},'historicalGuard':str(V/'checked-successor.cjs'),'historicalVerifier':str(K/'verify-main-integration.mjs'),'historicalMainSourceVerifier':str(M/'verify-main-source.mjs'),'priorGuardSha256':sha(V/'checked-successor.cjs'),'legacyNormalizedCount':28,'approvedCandidate':{'file':str(approval_path.relative_to(ROOT)),'sha256':sha(approval_path)},'scope':'Actual96 questions with existing48 preserved; only exact canonical links and two normalization-count assertions change. Historical27-file assertions must execute unchanged in a private predecessor view.'}
(HERE/'prepared.json').write_text(json.dumps(spec,ensure_ascii=False,indent=2)+'\n')
spec_sha=sha(HERE/'prepared.json')
# Reuse the already-tested strict validator; retain every previous gate.
s=(V/'checked-successor.cjs').read_text()
def edit(a,b,count=1):
 global s
 assert s.count(a)==count,(a,s.count(a),count);s=s.replace(a,b)
edit("path.resolve(__dirname,'../../../../../..')","path.resolve(__dirname,'../../../..')")
edit("const BASE='"+str(V)+"/';","const BASE='"+str(BASE)+"/';")
edit("const SPEC_SHA='27543a65e66ccfd6535ce7b4d3e20a9142a5dfdf75a743f493a7045ea2dd1447';","const SPEC_SHA='"+spec_sha+"';")
edit("BASE+'compat-spec.json'","BASE+'prepared.json'",2)
edit("spec.files.length!==67||new Set(spec.files.map(r=>r.file)).size!==67","spec.files.length!==4||new Set(spec.files.map(r=>r.file)).size!==4")
edit("![BASE+'before/'+row.file,BASE+'before-compat/'+row.file].includes(row.beforeFile)","row.beforeFile!==BASE+'before/'+row.file")
edit("full.inputs.length!==1381","full.inputs.length!=="+str(len(full['inputs'])))
edit("receipt.status!=='reviewed67 exact successor; final whole verification separate'","receipt.status!=='reviewed4 exact AI96 successor; final whole verification separate'")
edit("BASE+'legacy-view.mjs'","BASE+'predecessor-view.mjs'")
edit("receipt.guards.length!==3","receipt.guards.length!==6")
edit("BASE+'predecessor-view.mjs']);","BASE+'predecessor-view.mjs',BASE+'verify-main-library.mjs',BASE+'verify-main-route.mjs',BASE+'preparation.json']);")
edit("const historical=before.get(spec.historicalGuard);if(!historical)throw Error('missing historical teaching guard');","const historical=read(spec.historicalGuard);if(sha(historical)!==spec.priorGuardSha256)throw Error('historical teaching guard drift');")
edit("return legacy;","const result=new Map([...legacy,['cf-worker/src/ai-review-practice-data.mjs',state.before.get('cf-worker/src/ai-review-practice-data.mjs')]]);\n if(result.size!==28)throw Error('AI successor normalization scope drift');\n return result;")
# Exact4 rows already bind these two small assertion edits; replay them too.
needle="  before.set(row.file,previous);"
edit(needle,needle+"\n  if(row.edits){let text=previous.toString();for(const e of row.edits){if(text.split(e.before).length!==2)throw Error('AI exact count edit');text=text.replace(e.before,e.after);}if(text!==read(row.candidateFile).toString())throw Error('unrelated main-source assertion edit');}")
# Bind reviewed content/layout evidence, including unchanged sources and actual screenshots.
edit(" const receipt=JSON.parse(read(BASE+'integration.json'));", """ const evidence=[spec.approvedCandidate.file],approvalBytes=read(spec.approvedCandidate.file);
 if(sha(approvalBytes)!==spec.approvedCandidate.sha256)throw Error('AI approval drift');
 const approval=JSON.parse(approvalBytes);
 if(approval.status!=='reviewed candidate; main integration pending'||approval.candidateSha256!==spec.files[0].afterSha256)throw Error('AI approval drift');
 const evidenceFile=(f,digest)=>{evidence.push(f);if((assets||!media(f))&&sha(old(f))!==digest)throw Error('AI evidence drift:'+f);};
 const visualRoot=path.posix.dirname(spec.approvedCandidate.file)+'/';
 for(const proof of approval.proofs){
  evidenceFile(proof.file,proof.sha256);if(!proof.file.endsWith('.json'))continue;
  const value=JSON.parse(read(proof.file));
  if(value.candidateSha256&&value.candidateSha256!==spec.files[0].afterSha256||value.outputSha256&&value.outputSha256!==spec.files[0].afterSha256)throw Error('AI proof candidate mismatch');
  for(const row of value.inputs||[])evidenceFile(row.file,row.sha256);
  for(const sheet of value.sheets||[]){evidenceFile(sheet.file,sheet.sha256);for(const screen of sheet.screens||[])evidenceFile(visualRoot+screen.file,screen.sha256);}
 }
 const receipt=JSON.parse(read(BASE+'integration.json'));""")
edit("return {spec,full,receipt,before,original:module.exports};", "return {spec,full,receipt,before,original:module.exports,evidence};")
edit("const {spec,full,receipt,original}=validated(root,{assets:false});", "const {spec,full,receipt,original,evidence}=validated(root,{assets:false});")
edit("...original.mainDependencyFiles(root),BASE+'prepared.json'", "...original.mainDependencyFiles(root),...evidence,BASE+'prepared.json'")
(HERE/'checked-successor.cjs').write_text(s)
# Reuse the full2667-check candidate library harness against actual main modules.
meta=json.loads((PARENT/'clarity/preparation.json').read_text())
for r in meta['inputs']:
 if r['file']=='cf-worker/src/ai-review-practice-data.mjs':r['file']=str(BASE/'before/cf-worker/src/ai-review-practice-data.mjs')
(HERE/'preparation.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n')
current=(PARENT/'verify-clarity.mjs').read_text()
replacements=[("from './clarity/ai-review-practice-data.mjs'","from '../../../../cf-worker/src/ai-review-practice-data.mjs'"),("from './clarity/relocated-library.mjs'","from '../../../../cf-worker/src/ai-review-practice-library.mjs'"),("root=new URL('../../../',import.meta.url)","root=new URL('../../../../',import.meta.url)"),("here=new URL('./clarity/',import.meta.url)","here=new URL('./',import.meta.url)"),("new URL('cf-worker/src/ai-review-practice-data.mjs',root)","new URL('before/cf-worker/src/ai-review-practice-data.mjs',here)"),("new URL('result.json',here)","new URL('library-result.json',here)")]
for a,b in replacements:assert current.count(a)==1,(a,current.count(a));current=current.replace(a,b)
(HERE/'verify-main-library.mjs').write_text(current)
for f in ['predecessor-view.mjs','verify-main-integration.mjs']:assert (HERE/f).is_file()
receipt={'status':'reviewed4 exact AI96 successor; final whole verification separate','specSha256':spec_sha,'guards':[{'file':str(BASE/f),'sha256':sha(HERE/f)} for f in ['checked-successor.cjs','verify-main-integration.mjs','predecessor-view.mjs','verify-main-library.mjs','verify-main-route.mjs','preparation.json']]}
(HERE/'integration.json').write_text(json.dumps(receipt,indent=2)+'\n')
# Still candidate-only. Complete isolated preflight and exact promotion checks before any main write.
print('Prepared exact4-file successor and strict28-file normalized scope. No main changes. Finish verifiers and isolated preflight before promotion.')
