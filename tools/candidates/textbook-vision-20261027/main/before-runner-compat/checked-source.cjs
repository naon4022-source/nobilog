// Validate the entire approved successor before exposing historical bytes to
// older verifiers. Only six exact source files can be normalized.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'../../../..'),BASE='tools/candidates/textbook-vision-20261027/main/',sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const SPEC_SHA='4c4117e03464b42ef56cb9e5152d1b2840e4287a0ab805b4ae013c5a9791952d';
const expected=['index.html','cf-worker/src/index.js','preview/build.py','site-assets/sw.js','.claude/verify/run.sh','tools/candidates/textbook-ai-20261026/review/practice-source.cjs'].sort();
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function load(root){
 const read=f=>fs.readFileSync(path.join(root,f)),bytes=read(BASE+'prepared.json');if(sha(bytes)!==SPEC_SHA)throw Error('vision approved specification changed');
 const spec=JSON.parse(bytes),receipt=JSON.parse(read(BASE+'integration.json'));
 if(receipt.status!=='reviewed exact image consultation successor; integration progress separate'||!same(receipt.existing,spec.existing)||!same(receipt.newFiles,spec.newFiles)||!same(spec.existing.map(r=>r.file).sort(),expected)||spec.newFiles.length!==27)throw Error('vision integration whitelist');
 return {read,spec,receipt};
}
function checkMainSource(root=ROOT,{assets=true}={}){
 const {read,spec,receipt}=load(root),before=new Map();
 for(const row of spec.existing){
  if(row.beforeFile!==BASE+'before/'+row.file||row.candidateFile!==BASE+'output/'+row.file||row.edits.length!==1)throw Error('vision backup path');
  const prior=read(row.beforeFile),actual=read(row.file),candidate=read(row.candidateFile);
  if(sha(prior)!==row.beforeSha256||sha(actual)!==row.afterSha256||sha(candidate)!==row.afterSha256||!actual.equals(candidate))throw Error('vision main source drift:'+row.file);
  let replay=prior.toString();for(const e of row.edits){if(!e.before||replay.split(e.before).length!==2)throw Error('vision unique edit');replay=replay.replace(e.before,e.after);}if(replay!==actual.toString())throw Error('unrelated vision edit');before.set(row.file,prior);
 }
 for(const row of spec.newFiles){
  if(!/^(?:cf-worker\/src|site-assets)\/textbook-(?:vision\.css|vision-[a-z-]+\.(?:js|mjs|css)|ai-media-context-(?:math1|kokugo1|english1|science1|geography|history)\.json)$/.test(row.file)||row.candidateFile!==BASE+'output/'+row.file)throw Error('vision new asset path');
  if(sha(read(row.file))!==row.sha256||sha(read(row.candidateFile))!==row.sha256)throw Error('vision new asset drift:'+row.file);
 }
 const stage=JSON.parse(read('tools/candidates/textbook-vision-20261027/media-stage-result.json'));
 if(sha(read('tools/candidates/textbook-vision-20261027/media-stage-result.json'))!==spec.candidateStageSha256||stage.status!=='passed'||stage.checks!==4624||stage.sourceDrift.length)throw Error('vision candidate proof drift');
 for(const r of stage.frozenInputs)if(sha(read(r.file))!==r.sha256)throw Error('vision candidate source drift');
 for(const component of stage.components)if(sha(read(component.log))!==component.sha256||!read(component.log).toString().includes(component.checks+' checks passed'))throw Error('vision component evidence drift');
 if(receipt.previousFull.file!=='tools/candidates/verification-dialog-repair-20261027/full4-result.json')throw Error('vision previous full path');
 const fullBytes=read(receipt.previousFull.file),full=JSON.parse(fullBytes),old=f=>before.get(f)||read(f);
 if(sha(fullBytes)!==receipt.previousFull.sha256||full.status!=='passed'||full.exitCode!==0||full.frozenDrift.length||sha(read(full.log))!==full.logSha256||!read(full.log).toString().trimEnd().endsWith('✅ ぜんぶ通過'))throw Error('vision previous full drift');
 for(const r of full.inputs)if(sha(old(r.file))!==r.sha256)throw Error('vision before full input drift');
 if(receipt.mainProof.file!==BASE+'approved-panel-result.json')throw Error('vision main proof path');
 const proofBytes=read(receipt.mainProof.file),proof=JSON.parse(proofBytes);
 if(sha(proofBytes)!==receipt.mainProof.sha256||proof.status!=='passed'||proof.checks!==103||proof.posts!==7||proof.uploads!==7||proof.generations!==7||proof.countCalls!==7)throw Error('vision main book proof drift');
 // Historical source comparisons need the exact current code/catalogs. The
 // registered standalone main verifier additionally checks every media byte
 // once, instead of rereading540MB for each historical source assertion.
 for(const r of proof.inputs){
  if(!assets&&/\.(?:svg|jpg|png|mp4|webm|mp3)$/.test(r.file))continue;
  if(sha(read(r.file))!==r.sha256)throw Error('vision main book source drift:'+r.file);
 }
 for(const r of receipt.guards)if(![BASE+'checked-source.cjs',BASE+'check-expansion.cjs',BASE+'verify-main-source.mjs'].includes(r.file)||sha(read(r.file))!==r.sha256)throw Error('vision successor guard drift');
 return before;
}
function mainDependencyFiles(root=ROOT){
 const {read,spec,receipt}=load(root),stage=JSON.parse(read('tools/candidates/textbook-vision-20261027/media-stage-result.json'));
 const full=JSON.parse(read(receipt.previousFull.file)),proof=JSON.parse(read(receipt.mainProof.file));
 return [...new Set([BASE+'prepared.json',BASE+'integration.json',...spec.existing.flatMap(r=>[r.file,r.beforeFile,r.candidateFile]),...spec.newFiles.flatMap(r=>[r.file,r.candidateFile]),...stage.frozenInputs.map(r=>r.file),...stage.components.map(r=>r.log),'tools/candidates/textbook-vision-20261027/media-stage-result.json',receipt.previousFull.file,full.log,...full.inputs.map(r=>r.file),receipt.mainProof.file,...proof.inputs.filter(r=>!/\.(?:svg|jpg|png|mp4|webm|mp3)$/.test(r.file)).map(r=>r.file),...receipt.guards.map(r=>r.file)])];
}
module.exports={checkMainSource,mainDependencyFiles};
