# coding: utf-8
"""Prepare the next exact successor entirely outside the live frozen N tree."""
from pathlib import Path
import json,hashlib,re,os
ROOT=Path.cwd();U=Path(__file__).resolve().parent;UB=U.relative_to(ROOT)
N=Path('tools/candidates/nonadmin-ai-reader-successor-20261029/main');R=Path('tools/candidates/real-api-trial-20261029');H=Path('tools/candidates/math-history-toolbar-20261029')
sha=lambda b:hashlib.sha256(b).hexdigest()
read=lambda p:(ROOT/p).read_bytes()
load=lambda p:json.loads(read(p))
def put(rel,data):
 p=U/rel;p.parent.mkdir(parents=True,exist_ok=True);assert not p.exists(),p
 p.write_bytes(data if isinstance(data,bytes) else data.encode());return str(p.relative_to(ROOT))
def jsave(rel,data):return put(rel,json.dumps(data,ensure_ascii=False,indent=2)+'\n')
assert not (U/'prepared.json').exists(),'Do not overwrite a prepared batch'
spec=load(N/'prepared.json');assert len(spec['files'])==71 and spec['legacyNormalizedCount']==29
frozen={r['file']:r['sha256']for r in load(N/'full10-inputs.json')}
virtual={};sources=[]
for name in ['prepared.json','integration.json','checked-successor.cjs','verify-main-integration.mjs','predecessor-view.mjs','route-dependencies.json']:
 assert sha(read(N/name))==frozen[str(N/name)],name
 put('old-N/'+name,read(N/name))
# Three application fixes and one historical toolbar bridge, all already checked.
app=load(R/'combined-v2.json')['files'];assert len(app)==4
for r in app:assert sha(read(r['file']))==r['beforeSha256'] and sha(read(r['candidateFile']))==r['afterSha256']
# Preserve every existing assertion; supply the actual new adapter globals in fixtures.
fixtures=[]
f='.claude/verify/verify-openai-chat-retry-browser.mjs';s=read(f).decode();a="  window.remote=initial;window.posts=[];window.owner='pro';window.saveFail=false;window.next=0;";z=a+"\n  window.cloudState={busy:false};window.authLeaseBlocked=false;window.cloudConflict=()=>false;";assert s.count(a)==1
fixtures.append((f,s.replace(a,z),[{'before':a,'after':z}]))
f='.claude/verify/verify-messages-browser.mjs';s=read(f).decode();edits=[("let remoteRecords={};async function cloudPush()","let cloudState={busy:false},authLeaseBlocked=false;function cloudConflict(){return false;}\nlet remoteRecords={};async function cloudPush()"),("getByText(/送れませんでした（通信が切れたかもしれません）/)","getByText(/送信結果を確認できませんでした/)")]
for a,z in edits:assert s.count(a)==1;s=s.replace(a,z)
fixtures.append((f,s,[{'before':a,'after':z}for a,z in edits]))
fixturePaths=[x[0]for x in fixtures]
for f,s,edits in fixtures:
 before=put('before/'+f,read(f));candidate=put('output/'+f,s)
 app.append({'file':f,'beforeFile':before,'beforeSha256':sha(read(f)),'candidateFile':candidate,'afterSha256':sha(s.encode()),'edits':edits})
assert len(app)==6
# Runtime result files will change after integration, so archive immutable preparation proofs.
proofs=[]
for file,count in [(R/'status-replay-result.json',43),(R/'send-stage-result.json',32),(R/'save-idle-result.json',57),(R/'save-idle-browser-result.json',11),(H/'result.json',7)]:
 proof=load(file);assert proof['checks']==count and proof['status'].startswith('passed')
 archived=put('proofs/'+file.parent.name+'-'+file.name,read(file));inputs=[]
 for row in proof['inputs']:
  f=row['file']
  if not f.startswith(('tools/','site-assets/','cf-worker/','教材整理/','.claude/')):f=str(R/f)
  assert '..' not in Path(f).parts and not Path(f).is_absolute(),f
  mode='prior' if f in {x['file']for x in app} else 'current'
  inputs.append({'file':f,'sha256':row['sha256'],'mode':mode})
 proofs.append({'file':archived,'sha256':sha(read(file)),'checks':count,'inputs':inputs})
batch={'status':'reviewed six exact changes; combined runtime preflight pending','applicationAndHistoryFiles':[r['file']for r in app[:4]],'fixtureEdits':[{k:r[k]for k in ['file','edits']}for r in app[4:]],'proofs':proofs,'realProviderCallsInPreparation':0,'liveFailureCauseConfirmed':False,'sourceScopePlanned':77,'normalizationsPlanned':32}
batchfile=jsave('batch-review.json',batch)
# Materialize new before paths virtually until the live whole suite is terminal.
for r in app:
 f=r['file'];assert not any(x['file']==f for x in spec['files'])
 original=r['beforeFile'];before=str(N/'before'/f);current=str(N/'current-before'/f)
 virtual[before]=original;virtual[current]=original
 row={'file':f,'beforeFile':before,'beforeSha256':r['beforeSha256'],'candidateFile':r['candidateFile'],'afterSha256':r['afterSha256']}
 if 'edits' in r:row['edits']=r['edits']
 spec['files'].append(row);spec['currentBeforeFiles'].append({'file':f,'beforeFile':current,'beforeSha256':r['beforeSha256']})
# Original normalization assertions remain exact; only declared scope/count additions.
mfile=spec['historicalMainSourceVerifier'];mr=next(r for r in spec['files']if r['file']==mfile)
text=read(mr['beforeFile']).decode()
for e in mr['edits']:
 if e['after'].startswith('same('):e['after']=e['after'].replace(',29,',',32,')
 else:e['after']+=','+','.join(repr(f)for f in fixturePaths)
 assert text.count(e['before'])==1;text=text.replace(e['before'],e['after'])
mr['candidateFile']=put('output/'+mfile,text);mr['afterSha256']=sha(text.encode())
spec.update(status='reviewed77 exact successor; final whole verification separate',legacyNormalizedCount=32,additionalBatch={'file':batchfile,'sha256':sha(read(batchfile))},scope='Existing71 exact teaching/AI96 successors plus three AI fixes, the exact historical toolbar bridge and two necessary fixture updates. No historical assertion removed. Main not modified by preparation.')
specfile=jsave('prepared.json',spec);virtual[str(N/'prepared.json')]=specfile
# Future guard: strict current77 first; immutable original source checks remain mandatory.
s=read(N/'checked-successor.cjs').decode();s=re.sub(r"const SPEC_SHA='[a-f0-9]{64}'","const SPEC_SHA='"+sha(read(specfile))+"'",s)
s=re.sub(r'\b71\b','77',s).replace('successor71','successor77').replace('reviewed71','reviewed77')
for f in fixturePaths:s=s.replace("'.claude/verify/d1-sqlite.js',","'.claude/verify/d1-sqlite.js',"+repr(f)+',',1)
appdecl='const APP='+json.dumps([r['file']for r in app],ensure_ascii=False)+';\n'
s=s.replace('const sha=b=>',appdecl+'const sha=b=>',1)
s=s.replace('DATA,M,SIGNATURE,PRACTICE])','DATA,M,SIGNATURE,PRACTICE,...APP])')
s=s.replace('length!==6||changed.size!==6','length!==12||changed.size!==12')
a="['site-assets/textbook-book-english1.json',state.before.get('site-assets/textbook-book-english1.json')]]);if(result.size!==29)"
z="['site-assets/textbook-book-english1.json',state.before.get('site-assets/textbook-book-english1.json')],"+','.join('['+repr(f)+',state.before.get('+repr(f)+')]'for f in ['cf-worker/src/learning-assistant.mjs','site-assets/messages.js','tools/candidates/textbook-final-20261023/reviewed_changes.py'])+"]);if(result.size!==32)"
assert s.count(a)==1;s=s.replace(a,z)
needle=" const source=before.get(spec.historicalGuard);"
extra=""" const batchBytes=read(spec.additionalBatch.file);if(sha(batchBytes)!==spec.additionalBatch.sha256)throw Error('AI batch review drift');evidence.add(spec.additionalBatch.file);
 const batch=JSON.parse(batchBytes);if(batch.sourceScopePlanned!==77||batch.normalizationsPlanned!==32||batch.proofs.length!==5)throw Error('AI batch scope drift');
 for(const proof of batch.proofs){const bytes=read(proof.file);if(sha(bytes)!==proof.sha256)throw Error('archived batch proof drift');evidence.add(proof.file);const report=JSON.parse(bytes);if(!report.status.startsWith('passed')||report.checks!==proof.checks)throw Error('batch proof check drift');for(const input of proof.inputs){const value=input.mode==='prior'?prior(input.file):read(input.file);if(sha(value)!==input.sha256)throw Error('batch proof source drift:'+input.file);evidence.add(input.file);}}
"""
assert s.count(needle)==1;s=s.replace(needle,extra+needle)
guardfile=put('checked-successor.cjs',s);virtual[str(N/'checked-successor.cjs')]=guardfile
# Preserve the entire original runtime verifier and append actual checks for this batch.
s=read(N/'verify-main-integration.mjs').decode();s=s.replace('size,29,','size,32,').replace('before29','before32').replace('all71','all77').replace('currentFiles:71','currentFiles:77').replace('normalizations:29','normalizations:32').replace('plus71','plus77').replace('AI71','AI77')
needle="const result={status:'passed'"
extra="""const batchRuns=[];
for(const [name,entry,expected]of [
 ['status','tools/candidates/real-api-trial-20261029/verify-replayable-status.mjs',43],
 ['stage','tools/candidates/real-api-trial-20261029/verify-send-stage.mjs',32],
 ['save-idle','tools/candidates/real-api-trial-20261029/verify-save-idle.mjs',57],
 ['save-idle-browser','tools/candidates/real-api-trial-20261029/verify-save-idle-browser.mjs',11],
 ['math-toolbar','tools/candidates/math-history-toolbar-20261029/verify.py',7],
 ['messages-ui','.claude/verify/verify-messages-browser.mjs',138],
 ['retry-ui','.claude/verify/verify-openai-chat-retry-browser.mjs',10]]){
 const python=entry.endsWith('.py'),child=spawnSync(python?'python3':process.execPath,python?[entry]:['--preserve-symlinks','--preserve-symlinks-main',entry],{cwd:fileURLToPath(root),encoding:'utf8',maxBuffer:4*1024*1024});
 await writeFile(new URL('batch-'+name+'.log',here),(child.stdout||'')+(child.stderr||''));equal(child.status,0,'actual batch runtime '+name);batchRuns.push({name,checks:expected});
}
const liveStatus=JSON.parse(await readFile(new URL('tools/candidates/real-api-trial-20261029/status-replay-result.json',root)));equal(liveStatus.mainMode,'candidate','actual current parent uses the approved GET fix');equal(liveStatus.checks,43,'all original status/owner/quota assertions and exact source mode');
"""
assert s.count(needle)==1;s=s.replace(needle,extra+needle).replace("const result={status:'passed'","const result={status:'passed',batchRuns",1)
mainfile=put('verify-main-integration.mjs',s);virtual[str(N/'verify-main-integration.mjs')]=mainfile
s=read(N/'predecessor-view.mjs').decode().replace("'predecessor-view'","'predecessor-view-77'")
for f in fixturePaths:s=s.replace("'.claude/verify/d1-sqlite.js',","'.claude/verify/d1-sqlite.js',"+repr(f)+',',1)
predfile=put('predecessor-view.mjs',s);virtual[str(N/'predecessor-view.mjs')]=predfile
# Complete public module closure for both actual global fixture tests and AI controllers.
sourceFor={r['file']:r['candidateFile']for r in spec['files']};sourceFor.update(virtual)
entries=['preview/src/index.mjs',*fixturePaths,str(R/'verify-replayable-status.mjs'),str(R/'verify-send-stage.mjs'),str(R/'verify-save-idle.mjs'),str(R/'verify-save-idle-browser.mjs'),str(H/'verify.py')]
for folder in [R/'view/cf-worker/src',R/'view-before/cf-worker/src']:
 entries.extend(str(p)for p in (ROOT/folder).iterdir() if p.is_file())
entries=[str(Path(f).relative_to(ROOT))if Path(f).is_absolute()else f for f in entries]
queue=entries[:];seen=set();missing=[]
pattern=re.compile(r"(?:from\s*|import\s*(?:\(\s*)?|require\s*\(\s*)['\"](\.[^'\"]+)['\"]")
while queue:
 f=queue.pop()
 if f in seen:continue
 assert '..' not in Path(f).parts and not Path(f).is_absolute(),f
 p=ROOT/sourceFor.get(f,f);assert p.is_file(),f;seen.add(f)
 if p.suffix not in ['.mjs','.js','.cjs']:continue
 for ref in pattern.findall(p.read_text()):
  rel=os.path.normpath(str(Path(f).parent/ref.split('?')[0]));q=ROOT/sourceFor.get(rel,rel)
  if q.is_file():queue.append(rel)
  else:missing.append({'file':f,'literal':ref})
for f in ['site-assets/messages.css','site-assets/admin.js','site-assets/admin.css','site-assets/ai-trial-notice.js',str(H/'reviewed_changes.before.py'),str(H/'reviewed_changes.candidate.py'),str(R/'retry-adapter.before.js'),str(R/'retry-adapter.candidate.js'),str(R/'messages.before.js'),str(R/'messages.candidate.js'),str(R/'messages-patch.json'),str(R/'retry-adapter-patch.json'),str(R/'learning-assistant.candidate.mjs'),str(R/'learning-assistant.before.mjs')]:seen.add(f)
for p in proofs:seen.add(p['file']);seen.update(x['file']for x in p['inputs'])
seen.add(batchfile)
route=load(N/'route-dependencies.json');existing={r['file']for r in route['inputs']}
for f in sorted(seen-existing):
 p=ROOT/sourceFor.get(f,f);assert p.is_file(),f;route['inputs'].append({'file':f,'sha256':sha(p.read_bytes())})
routefile=jsave('route-dependencies.json',route);virtual[str(N/'route-dependencies.json')]=routefile
receipt=load(N/'integration.json');receipt.update(status=spec['status'],specSha256=sha(read(specfile)))
for r in receipt['guards']:r['sha256']=sha(read(virtual.get(r['file'],r['file'])))
receiptfile=jsave('integration.json',receipt);virtual[str(N/'integration.json')]=receiptfile
# Every declaration, current file and before buffer is explicit in the virtual future view.
for r in spec['files']:virtual[r['file']]=r['candidateFile']
jsave('virtual-map.json',virtual)
jsave('preparation.json',{'status':'draft77 only; no canonical source writes','targets':77,'normalizations':32,'currentBeforeRows':12,'moduleClosure':len(seen),'ignoredMissingImportLiterals':missing,'fixtures':fixturePaths,'virtualFiles':len(virtual),'liveFull10InputsUnchanged':all(sha(read(f))==digest for f,digest in frozen.items() if f in [str(N/x)for x in ['prepared.json','integration.json','checked-successor.cjs','verify-main-integration.mjs','predecessor-view.mjs','route-dependencies.json']])})
print('Prepared virtual77-source draft,32 normalizations and two exact fixture updates; live canonical files untouched.')
