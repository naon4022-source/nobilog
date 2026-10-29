// SYNTAX PREFLIGHT ONLY; not for use or promotion.
// Validate the complete current successor before exposing the unchanged historical view.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'../../../..');
const BASE='tools/candidates/review-practice-choice-order-20261029/main/';
const SPEC_SHA='aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const media=f=>/\.(?:svg|jpg|png|mp4|webm|mp3|wav)$/.test(f);
const safe=f=>typeof f==='string'&&!path.isAbsolute(f)&&!f.split('/').includes('..')&&
 (/^(?:tools\/candidates|site-assets|cf-worker\/src|教材整理\/Claude_Codex共有)\//.test(f)||['index.html','preview/build.py','.claude/verify/run.sh','.claude/verify/d1-sqlite.js','Claude作業/20261026_ProAI類題/practice-bank.json','tools/releases/auth-repair-20261019/verify-login-flow.mjs','tools/releases/google-link-20261019/verify-login-flow.mjs'].includes(f));
function validated(root=ROOT,{assets=true}={}){
 const read=f=>{if(!safe(f))throw Error('current teaching path rejected');return fs.readFileSync(path.join(root,f));};
 const specBytes=read(BASE+'prepared.json');if(sha(specBytes)!==SPEC_SHA)throw Error('current teaching specification drift');
 const spec=JSON.parse(specBytes),before=new Map();
 if(spec.files.length!==4||new Set(spec.files.map(r=>r.file)).size!==4)throw Error('current teaching whitelist drift');
 for(const row of spec.files){
  if(!safe(row.file)||!safe(row.candidateFile)||row.beforeFile!==BASE+'before/'+row.file)throw Error('current teaching row path');
  const previous=read(row.beforeFile);if(sha(previous)!==row.beforeSha256)throw Error('current teaching predecessor drift:'+row.file);
  before.set(row.file,previous);
  if(row.edits){let text=previous.toString();for(const e of row.edits){if(text.split(e.before).length!==2)throw Error('AI exact count edit');text=text.replace(e.before,e.after);}if(text!==read(row.candidateFile).toString())throw Error('unrelated main-source assertion edit');}
  if(!assets&&media(row.file))continue;
  const actual=read(row.file),candidate=read(row.candidateFile);
  if(sha(actual)!==row.afterSha256||sha(candidate)!==row.afterSha256||!actual.equals(candidate))throw Error('current teaching main/candidate drift:'+row.file);
 }
 const old=f=>before.get(f)||read(f),fullBytes=read(spec.previousFull.file),full=JSON.parse(fullBytes);
 if(sha(fullBytes)!==spec.previousFull.sha256||full.status!=='passed'||full.exitCode!==0||!Array.isArray(full.frozenDrift)||full.frozenDrift.length||full.inputs.length!==1715||sha(read(full.log))!==full.logSha256||!read(full.log).toString().trimEnd().endsWith('✅ ぜんぶ通過'))throw Error('current teaching previous full drift');
 for(const row of full.inputs){if(!assets&&media(row.file))continue;if(sha(old(row.file))!==row.sha256)throw Error('current teaching prior full input drift:'+row.file);}
 const evidence=[spec.approvedCandidate.file],approvalBytes=read(spec.approvedCandidate.file);
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
 const receipt=JSON.parse(read(BASE+'integration.json'));
 if(receipt.specSha256!==SPEC_SHA||receipt.status!=='reviewed4 exact AI96 successor; final whole verification separate'||receipt.guards.length!==6)throw Error('current teaching receipt drift');
 const names=new Set([BASE+'checked-successor.cjs',BASE+'verify-main-integration.mjs',BASE+'predecessor-view.mjs',BASE+'verify-main-library.mjs',BASE+'verify-main-route.mjs',BASE+'preparation.json']);
 for(const row of receipt.guards){if(!names.delete(row.file)||sha(read(row.file))!==row.sha256)throw Error('current teaching verifier drift');}
 if(names.size)throw Error('current teaching missing verifier');
 const historical=read(spec.historicalGuard);if(sha(historical)!==spec.priorGuardSha256)throw Error('historical teaching guard drift');
 const view=Object.freeze({...fs,readFileSync(file,options){const rel=path.relative(root,path.resolve(file)),bytes=before.get(rel);if(!bytes)return fs.readFileSync(file,options);const encoding=typeof options==='string'?options:options?.encoding;return encoding?bytes.toString(encoding):Buffer.from(bytes);}});
 const module={exports:{}},trustedRequire=name=>{if(name==='node:fs')return view;if(['node:path','node:crypto','node:vm'].includes(name))return require(name);throw Error('unexpected historical dependency:'+name);};
 vm.runInNewContext(historical.toString(),{module,exports:module.exports,require:trustedRequire,__dirname:path.dirname(path.join(root,spec.historicalGuard)),Buffer},{filename:spec.historicalGuard,timeout:1000});
 return {spec,full,receipt,before,original:module.exports,evidence};
}
function checkMainSource(root=ROOT,options={}){
 const state=validated(root,options),legacy=state.original.checkMainSource(root,options);
 if(legacy.size!==27)throw Error('historical normalized scope drift');
 const result=new Map([...legacy,['cf-worker/src/ai-review-practice-data.mjs',state.before.get('cf-worker/src/ai-review-practice-data.mjs')]]);
 if(result.size!==28)throw Error('AI successor normalization scope drift');
 return result;
}
function mainDependencyFiles(root=ROOT){
 const {spec,full,receipt,original,evidence}=validated(root,{assets:false});
 return [...new Set([...original.mainDependencyFiles(root),...evidence,BASE+'prepared.json',BASE+'integration.json',...spec.files.flatMap(r=>[r.file,r.beforeFile,r.candidateFile]),spec.previousFull.file,full.log,...full.inputs.map(r=>r.file),...receipt.guards.map(r=>r.file)])];
}
module.exports={checkMainSource,mainDependencyFiles};
