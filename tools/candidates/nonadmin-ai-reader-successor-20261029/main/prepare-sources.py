"""Stage70 exact source rows after full9 TERMINAL, retaining passed full7 as baseline.
Failed full9 is only an immutable historical-source snapshot, never passed evidence.
Does not write application files or an executable successor guard.
"""
from pathlib import Path
import json,hashlib,copy,os,re
ROOT=Path.cwd();HERE=Path(__file__).resolve().parent;BASE=HERE.relative_to(ROOT)
V=Path('tools/candidates/textbook-final-20261023/remaining-alignment-20261028/answer-safe-v2/main')
K=Path('tools/candidates/textbook-final-20261023/kokugo-reading-20261027/main');M=Path('tools/candidates/textbook-vision-20261027/main')
B=Path('tools/candidates/basic-ui-reader-current-20261029');A=Path('tools/candidates/review-practice-choice-order-20261029')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();load=lambda p:json.loads(p.read_text())
assert not (HERE/'prepared-source.json').exists(),'Never overwrite a staged successor'
terminal=V/'full9-result.json';assert terminal.is_file(),'Wait on existing full9 handle; never restart it'
full9=load(terminal);state=load(V/'full9-process.json')
assert state['status']=='finished' and full9['status']=='failed' and full9['exitCode']==1 and not full9['frozenDrift'],'Need authoritative terminal failed snapshot with unchanged inputs'
assert sha(ROOT/full9['log'])==full9['logSha256']
errors={x for x in (ROOT/full9['log']).read_text().splitlines() if re.match(r'^(?:Error:|AssertionError|FAIL|❌)',x)}
assert errors=={'Error: basic UI proof source drift','AssertionError [ERR_ASSERTION]: english1: source preserved except exact separately approved explanations','AssertionError [ERR_ASSERTION]: entire renderer equals its predecessor plus only two metadata edits','❌ 落ちたスイートがある'},errors
for row in full9['inputs']:assert sha(ROOT/row['file'])==row['sha256'],row['file']
old_spec=load(V/'compat-spec.json');assert len(old_spec['files'])==67
for row in old_spec['files']:assert sha(ROOT/row['file'])==row['afterSha256'],row['file']
full7_path=Path(old_spec['previousFull']['file']);full7=load(full7_path)
assert sha(full7_path)==old_spec['previousFull']['sha256'] and full7['status']=='passed' and full7['exitCode']==0 and not full7['frozenDrift'] and len(full7['inputs'])==1381
assert sha(ROOT/full7['log'])==full7['logSha256'] and (ROOT/full7['log']).read_text().rstrip().endswith('✅ ぜんぶ通過')
app=load(A/'clarity/approval.json');assert app['status']=='reviewed candidate; main integration pending'
assert sha(A/'clarity/ai-review-practice-data.mjs')==app['candidateSha256']
for proof in app['proofs']:assert sha(ROOT/proof['file'])==proof['sha256']
english=load(Path('tools/candidates/english-source-compat-20261029/candidate-result.json'));assert english['status']=='passed' and english['checks']==41 and english['books']==6
basic=load(B/'result.json');assert basic['status']=='passed' and basic['checks']==2 and basic['originalAssertionsPreserved'] and basic['currentReaderProof']
for row in basic['inputs']:assert sha(ROOT/row['file'])==row['sha256'],row['file']
math_dir=Path('tools/candidates/math-current-reader-20261029');math=load(math_dir/'current-math-playback-result.json');assert math['status']=='passed' and math['plays']==300 and not math['errors'] and not math['outside']
for file,digest in math['inputs'].items():assert sha(Path('site-assets')/file)==digest,file
rows=copy.deepcopy(old_spec['files']);targets={r['file']:r for r in rows};output=HERE/'output';current_before=[]
signature_file='tools/candidates/textbook-ai-20261025/book-signature-edit.json'
changed=[str(K/'checked-successor.cjs'),str(K/'verify-main-integration.mjs'),'cf-worker/src/ai-review-practice-data.mjs',str(M/'verify-main-source.mjs'),signature_file]
for file in changed:
 current=HERE/'current-before'/file;current.parent.mkdir(parents=True,exist_ok=True);current.write_bytes((ROOT/file).read_bytes());current_before.append({'file':file,'beforeFile':str(current.relative_to(ROOT)),'beforeSha256':sha(current)})
 if file not in targets:
  before=HERE/'before'/file;before.parent.mkdir(parents=True,exist_ok=True);before.write_bytes((ROOT/file).read_bytes());row={'file':file,'beforeFile':str(before.relative_to(ROOT)),'beforeSha256':sha(before)};rows.append(row);targets[file]=row
 row=targets[file]
 if file=='cf-worker/src/ai-review-practice-data.mjs':candidate=A/'clarity/ai-review-practice-data.mjs'
 elif file==signature_file:candidate=Path('tools/candidates/reader-signature-compat-20261029/candidate.json')
 else:
  candidate=output/file;candidate.parent.mkdir(parents=True,exist_ok=True)
  if file==str(K/'checked-successor.cjs'):
   relative=os.path.relpath(HERE/'checked-successor.cjs',(ROOT/file).parent);candidate.write_text('// Exact reviewed70-file successor; all immutable predecessor assertions retained.\nmodule.exports=require('+json.dumps(relative)+');\n')
  elif file==str(K/'verify-main-integration.mjs'):
   relative=os.path.relpath(HERE/'verify-main-integration.mjs',(ROOT/file).parent);candidate.write_text('// Current teaching/AI96 and unchanged historical teaching/vision assertions.\nimport '+json.dumps(relative)+';\n')
  else:
   text=(ROOT/file).read_text();edits=[('same(before.size,27,','same(before.size,29,'),('same(checkMainSource(sandbox,{assets:false}).size,27,','same(checkMainSource(sandbox,{assets:false}).size,29,')]
   edits.append(("'Claude作業/20261026_ProAI類題/practice-bank.json'", "'Claude作業/20261026_ProAI類題/practice-bank.json','Claude作業/20261028_類題拡大_残10/候補/ai-review-practice-data.mjs'"))
   for a,b in edits:assert text.count(a)==1;text=text.replace(a,b)
   candidate.write_text(text);row['edits']=[{'before':a,'after':b} for a,b in edits]
 row['candidateFile']=str(candidate.relative_to(ROOT) if candidate.is_absolute() else candidate);row['afterSha256']=sha(candidate)
assert len(rows)==70 and len(targets)==70
for row in rows:assert sha(ROOT/row['beforeFile'])==row['beforeSha256'] and sha(ROOT/row['candidateFile'])==row['afterSha256']
for item in full7['inputs']:
 path=ROOT/(targets[item['file']]['beforeFile'] if item['file'] in targets else item['file']);assert sha(path)==item['sha256'],item['file']
parse=lambda p:json.loads(p.read_text().removeprefix('export default ').rstrip().removesuffix(';'))
old=parse(ROOT/'cf-worker/src/ai-review-practice-data.mjs');new=parse(A/'clarity/ai-review-practice-data.mjs');assert len(old['questions'])==48 and len(new['questions'])==96
for q in old['questions']:assert next(v for v in new['questions'] if v['id']==q['id'])==q
for p in old['patterns']:assert next(v for v in new['patterns'] if v['id']==p['id'])==p
for r in old['references']:assert r in new['references']
for key in ['legacyQuestions','legacyPatterns']:assert new[key]==old[key]
spec={'status':'source staging only; guard, runtime preflight and promotion NOT approved','files':rows,'previousFull':old_spec['previousFull'],'historicalCurrentSnapshot':{'file':str(terminal),'sha256':sha(terminal),'expectedStatus':'failed','inputs':len(full9['inputs']),'scope':'Historical source snapshot only; NOT positive whole verification'},'currentBeforeFiles':current_before,'historicalGuard':str(K/'checked-successor.cjs'),'historicalVerifier':str(K/'verify-main-integration.mjs'),'historicalMainSourceVerifier':str(M/'verify-main-source.mjs'),'historicalTeachingDirectory':str(V),'legacyNormalizedCount':29,'approvedCandidate':{'file':str(A/'clarity/approval.json'),'sha256':sha(A/'clarity/approval.json')},'englishSourceCompatibility':{'file':'tools/candidates/english-source-compat-20261029/candidate-result.json','sha256':sha(Path('tools/candidates/english-source-compat-20261029/candidate-result.json'))},'basicUICompatibility':{'file':str(B/'result.json'),'sha256':sha(B/'result.json')},'currentMath':{'file':str(math_dir/'current-math-playback-result.json'),'sha256':sha(math_dir/'current-math-playback-result.json')},'scope':'Exact existing67 successors plus basic-UI verifier, AI96 data and declared extra normalization assertion count. Positive baseline is passed full7; failed full9 provides only immutable prior-source views. Candidate only; no main writes.'}
(HERE/'prepared-source.json').write_text(json.dumps(spec,ensure_ascii=False,indent=2)+'\n');print('Staged70 exact source rows with positive1381-input full7 baseline and explicitly FAILED full9 source snapshot. Application unchanged; guard/preflight/promotion pending.')
