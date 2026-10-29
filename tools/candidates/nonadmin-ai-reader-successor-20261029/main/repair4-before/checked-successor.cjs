// TEMPLATE ONLY. Sealing fills the exact specification digest before isolated preflight.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'../../../..'),BASE='tools/candidates/nonadmin-ai-reader-successor-20261029/main/';
const V='tools/candidates/textbook-final-20261023/remaining-alignment-20261028/answer-safe-v2/main/';
const SPEC_SHA='63cf93414126a57a862cc6bbf0427ded1a63954399866e78bf5a6fcab46fb95c',OLD_SPEC_SHA='27543a65e66ccfd6535ce7b4d3e20a9142a5dfdf75a743f493a7045ea2dd1447';
const DATA='cf-worker/src/ai-review-practice-data.mjs',BASIC='tools/candidates/textbook-ai-20261026/review/legacy-evidence-fix/checked-basic-ui.cjs',M='tools/candidates/textbook-vision-20261027/main/verify-main-source.mjs';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),media=f=>/\.(?:svg|jpg|png|mp4|webm|mp3|wav)$/.test(f);
const safe=f=>typeof f==='string'&&!path.isAbsolute(f)&&!f.split('/').includes('..')&&(/^(?:tools\/candidates|site-assets|cf-worker\/src|教材整理\/Claude_Codex共有)\//.test(f)||['index.html','preview/build.py','.claude/verify/run.sh','.claude/verify/d1-sqlite.js','Claude作業/20261026_ProAI類題/practice-bank.json','Claude作業/20261028_類題拡大_残10/候補/ai-review-practice-data.mjs','tools/releases/auth-repair-20261019/verify-login-flow.mjs','tools/releases/google-link-20261019/verify-login-flow.mjs'].includes(f));
function validated(root=ROOT,{assets=true}={}){
 const read=f=>{if(!safe(f))throw Error('successor70 path');return fs.readFileSync(path.join(root,f));};
 const bytes=read(BASE+'prepared.json');if(sha(bytes)!==SPEC_SHA)throw Error('successor70 specification drift');
 const spec=JSON.parse(bytes),oldBytes=read(V+'compat-spec.json');if(sha(oldBytes)!==OLD_SPEC_SHA)throw Error('original67 specification drift');
 const SIGNATURE='tools/candidates/textbook-ai-20261025/book-signature-edit.json';
 const oldSpec=JSON.parse(oldBytes),allowed=new Set([...oldSpec.files.map(r=>r.file),DATA,M,SIGNATURE]),before=new Map(),currentBefore=new Map();
 if(spec.files.length!==70||allowed.size!==70||new Set(spec.files.map(r=>r.file)).size!==70)throw Error('successor70 whitelist drift');
 for(const row of spec.files){
  if(!allowed.delete(row.file)||![BASE+'before/'+row.file,V+'before/'+row.file,V+'before-compat/'+row.file].includes(row.beforeFile))throw Error('successor70 row path');
  const previous=read(row.beforeFile);if(sha(previous)!==row.beforeSha256)throw Error('successor70 predecessor drift:'+row.file);before.set(row.file,previous);
  const old=oldSpec.files.find(r=>r.file===row.file);if(old&&(old.beforeFile!==row.beforeFile||old.beforeSha256!==row.beforeSha256))throw Error('original67 predecessor contract drift');
  if(!assets&&media(row.file))continue;
  const actual=read(row.file),candidate=read(row.candidateFile);if(sha(actual)!==row.afterSha256||sha(candidate)!==row.afterSha256||!actual.equals(candidate))throw Error('successor70 current/candidate drift:'+row.file);
  if(row.edits){let text=previous.toString();for(const e of row.edits){if(text.split(e.before).length!==2)throw Error('successor70 unique count edit');text=text.replace(e.before,e.after);}if(text!==actual.toString())throw Error('successor70 unrelated assertion edit');}
 }
 if(allowed.size)throw Error('successor70 missing target');
 const changed=new Set([spec.historicalGuard,spec.historicalVerifier,DATA,M,SIGNATURE]);if(spec.currentBeforeFiles.length!==5||changed.size!==5)throw Error('current snapshot normalization scope');
 for(const row of spec.currentBeforeFiles){if(!changed.delete(row.file)||row.beforeFile!==BASE+'current-before/'+row.file)throw Error('current snapshot backup path');const value=read(row.beforeFile);if(sha(value)!==row.beforeSha256)throw Error('current snapshot backup drift');currentBefore.set(row.file,value);}
 if(changed.size)throw Error('current snapshot missing predecessor');
 const old=f=>before.get(f)||read(f),prior=f=>currentBefore.get(f)||read(f);
 const oldSignature=JSON.parse(before.get(SIGNATURE)),signature=JSON.parse(read(SIGNATURE));
 if(oldSignature.edits.length!==2||signature.edits.length!==3||JSON.stringify(signature.edits.slice(0,2))!==JSON.stringify(oldSignature.edits)||signature.beforeFile!==oldSignature.beforeFile||signature.beforeSha256!==oldSignature.beforeSha256)throw Error('signature original metadata edits drift');
 let replay=read(signature.beforeFile).toString();if(sha(Buffer.from(replay))!==signature.beforeSha256)throw Error('signature original source drift');
 for(const edit of signature.edits){if(replay.split(edit.before).length!==2)throw Error('signature unique registered edit drift');replay=replay.replace(edit.before,edit.after);}
 if(replay!==read('site-assets/textbook-book.js').toString()||sha(Buffer.from(replay))!==signature.afterSha256)throw Error('signature full current renderer drift');
 if(sha(read(signature.lastAvailablePreviousResult.file))!==signature.lastAvailablePreviousResult.sha256)throw Error('signature archived result drift');
 if(JSON.stringify(spec.previousFull)!==JSON.stringify(oldSpec.previousFull))throw Error('positive baseline contract drift');
 const fullBytes=read(spec.previousFull.file),full=JSON.parse(fullBytes);
 if(sha(fullBytes)!==spec.previousFull.sha256||full.status!=='passed'||full.exitCode!==0||full.frozenDrift.length||full.inputs.length!==1381||sha(read(full.log))!==full.logSha256||!read(full.log).toString().trimEnd().endsWith('✅ ぜんぶ通過'))throw Error('positive full7 drift');
 for(const row of full.inputs){if(!assets&&media(row.file))continue;if(sha(old(row.file))!==row.sha256)throw Error('positive full7 input drift:'+row.file);}
 const snapshotBytes=read(spec.historicalCurrentSnapshot.file),snapshot=JSON.parse(snapshotBytes);
 if(sha(snapshotBytes)!==spec.historicalCurrentSnapshot.sha256||snapshot.status!=='failed'||snapshot.exitCode!==1||snapshot.frozenDrift.length||snapshot.terminalSuccessMarker||snapshot.inputs.length!==1715||sha(read(snapshot.log))!==snapshot.logSha256)throw Error('failed historical snapshot drift');
 for(const row of snapshot.inputs){if(!assets&&media(row.file))continue;if(sha(prior(row.file))!==row.sha256)throw Error('historical snapshot input drift:'+row.file);}
 const parse=b=>JSON.parse(b.toString().replace(/^export default /,'').replace(/;\s*$/,'')),previousData=parse(before.get(DATA)),currentData=parse(read(DATA));
 if(previousData.questions.length!==48||currentData.questions.length!==96||previousData.patterns.length!==16||currentData.patterns.length!==32)throw Error('AI96 scope drift');
 for(const key of ['questions','patterns'])for(const row of previousData[key])if(JSON.stringify(currentData[key].find(q=>q.id===row.id))!==JSON.stringify(row))throw Error('existing AI48 educational drift');
 for(const row of previousData.references)if(!currentData.references.some(r=>JSON.stringify(r)===JSON.stringify(row)))throw Error('existing AI source binding drift');
 for(const key of ['legacyQuestions','legacyPatterns'])if(JSON.stringify(currentData[key])!==JSON.stringify(previousData[key]))throw Error('legacy AI educational drift');
 const evidence=new Set([signature.beforeFile,signature.lastAvailablePreviousResult.file]),evidenceFile=(file,digest)=>{if(path.isAbsolute(file)){const recordedRoot='/Users/shimizunaotomoo/Desktop/my-app/';file=file.startsWith(recordedRoot)?file.slice(recordedRoot.length):path.relative(root,file);}if(!safe(file))throw Error('approved evidence path');evidence.add(file);if((assets||!media(file))&&sha(prior(file))!==digest)throw Error('approved evidence drift:'+file);};
 for(const entry of [spec.approvedCandidate,spec.basicUICompatibility,spec.currentMath,spec.englishSourceCompatibility]){
  evidenceFile(entry.file,entry.sha256);const proof=JSON.parse(read(entry.file));
  for(const input of Array.isArray(proof.inputs)?proof.inputs:[])evidenceFile(input.file,input.sha256);
 }
 const approval=JSON.parse(read(spec.approvedCandidate.file));if(approval.status!=='reviewed candidate; main integration pending'||approval.candidateSha256!==sha(read(DATA)))throw Error('AI candidate approval drift');
 for(const row of approval.proofs){
  evidenceFile(row.file,row.sha256);if(!row.file.endsWith('.json'))continue;const proof=JSON.parse(read(row.file));
  if(proof.candidateSha256&&proof.candidateSha256!==sha(read(DATA))||proof.outputSha256&&proof.outputSha256!==sha(read(DATA)))throw Error('AI approval candidate binding drift');
  for(const input of proof.inputs||[])evidenceFile(input.file,input.sha256);
  for(const sheet of proof.sheets||[]){evidenceFile(sheet.file,sheet.sha256);for(const image of sheet.screens||[])evidenceFile(path.posix.dirname(spec.approvedCandidate.file)+'/'+image.file,image.sha256);}
 }
 const english=JSON.parse(read(spec.englishSourceCompatibility.file));if(english.status!=='passed'||english.checks!==41||english.books!==6||!english.sourceVerifierUnchanged||english.previousEnglishSha256!==sha(before.get('site-assets/textbook-book-english1.json')))throw Error('English baseline compatibility drift');
 const basic=JSON.parse(read(spec.basicUICompatibility.file)),math=JSON.parse(read(spec.currentMath.file));if(basic.status!=='passed'||basic.checks!==2||!basic.originalAssertionsPreserved||!basic.currentReaderProof||math.status!=='passed'||math.plays!==300||math.movies!==75||math.errors.length||math.outside.length)throw Error('UI/math approval scope drift');
 for(const [name,digest]of Object.entries(math.inputs))evidenceFile('site-assets/'+name,digest);
 const receipt=JSON.parse(read(BASE+'integration.json')),names=new Set(['checked-successor.cjs','verify-main-integration.mjs','predecessor-view.mjs','verify-main-library.mjs','verify-main-route.mjs','preparation.json','route-dependencies.json'].map(f=>BASE+f));
 if(receipt.specSha256!==SPEC_SHA||receipt.status!=='reviewed70 exact successor; final whole verification separate'||receipt.guards.length!==7)throw Error('successor70 receipt drift');
 for(const row of receipt.guards)if(!names.delete(row.file)||sha(read(row.file))!==row.sha256)throw Error('successor70 verifier drift');if(names.size)throw Error('successor70 missing verifier');
 const routeDependencies=JSON.parse(read(BASE+'route-dependencies.json'));for(const row of routeDependencies.inputs){if(sha(read(row.file))!==row.sha256)throw Error('actual route dependency drift:'+row.file);evidence.add(row.file);}evidence.add(BASE+'route-dependencies.json');
 const source=before.get(spec.historicalGuard);if(!source||sha(source)!=='1cd541cbb272fb12580bfde967b5171fa9a63d67cdb5159846c90380a1939e3e')throw Error('original teaching guard drift');
 const view=Object.freeze({...fs,readFileSync(file,options){const value=before.get(path.relative(root,path.resolve(file)));if(!value)return fs.readFileSync(file,options);const enc=typeof options==='string'?options:options?.encoding;return enc?value.toString(enc):Buffer.from(value);}});
 const module={exports:{}},trustedRequire=name=>{if(name==='node:fs')return view;if(['node:path','node:crypto','node:vm'].includes(name))return require(name);throw Error('unexpected historical dependency');};
 vm.runInNewContext(source.toString(),{module,exports:module.exports,require:trustedRequire,__dirname:path.dirname(path.join(root,spec.historicalGuard)),Buffer},{filename:spec.historicalGuard,timeout:1000});
 return {spec,full,snapshot,receipt,before,evidence,original:module.exports};
}
function checkMainSource(root=ROOT,options={}){const state=validated(root,options),legacy=state.original.checkMainSource(root,options);if(legacy.size!==27)throw Error('original normalization scope drift');const result=new Map([...legacy,[DATA,state.before.get(DATA)],['site-assets/textbook-book-english1.json',state.before.get('site-assets/textbook-book-english1.json')]]);if(result.size!==29)throw Error('successor normalization scope drift');return result;}
function mainDependencyFiles(root=ROOT){const {spec,full,snapshot,receipt,evidence,original}=validated(root,{assets:false});return [...new Set([...original.mainDependencyFiles(root),BASE+'prepared.json',BASE+'integration.json',V+'compat-spec.json',...spec.files.flatMap(r=>[r.file,r.beforeFile,r.candidateFile]),...spec.currentBeforeFiles.map(r=>r.beforeFile),spec.previousFull.file,full.log,...full.inputs.map(r=>r.file),spec.historicalCurrentSnapshot.file,snapshot.log,...snapshot.inputs.map(r=>r.file),...evidence,...receipt.guards.map(r=>r.file)])];}
module.exports={checkMainSource,mainDependencyFiles};
