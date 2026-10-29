// Validate the complete current successor before exposing the unchanged historical view.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'../../../../../..');
const BASE='tools/candidates/textbook-final-20261023/remaining-alignment-20261028/answer-safe-v2/main/';
const SPEC_SHA='27543a65e66ccfd6535ce7b4d3e20a9142a5dfdf75a743f493a7045ea2dd1447';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const media=f=>/\.(?:svg|jpg|png|mp4|webm|mp3|wav)$/.test(f);
const safe=f=>typeof f==='string'&&!path.isAbsolute(f)&&!f.split('/').includes('..')&&
 (/^(?:tools\/candidates|site-assets|cf-worker\/src|教材整理\/Claude_Codex共有)\//.test(f)||['index.html','preview/build.py','.claude/verify/run.sh','.claude/verify/d1-sqlite.js','Claude作業/20261026_ProAI類題/practice-bank.json','tools/releases/auth-repair-20261019/verify-login-flow.mjs','tools/releases/google-link-20261019/verify-login-flow.mjs'].includes(f));
function validated(root=ROOT,{assets=true}={}){
 const read=f=>{if(!safe(f))throw Error('current teaching path rejected');return fs.readFileSync(path.join(root,f));};
 const specBytes=read(BASE+'compat-spec.json');if(sha(specBytes)!==SPEC_SHA)throw Error('current teaching specification drift');
 const spec=JSON.parse(specBytes),before=new Map();
 if(spec.files.length!==67||new Set(spec.files.map(r=>r.file)).size!==67)throw Error('current teaching whitelist drift');
 for(const row of spec.files){
  if(!safe(row.file)||!safe(row.candidateFile)||![BASE+'before/'+row.file,BASE+'before-compat/'+row.file].includes(row.beforeFile))throw Error('current teaching row path');
  const previous=read(row.beforeFile);if(sha(previous)!==row.beforeSha256)throw Error('current teaching predecessor drift:'+row.file);
  before.set(row.file,previous);
  if(!assets&&media(row.file))continue;
  const actual=read(row.file),candidate=read(row.candidateFile);
  if(sha(actual)!==row.afterSha256||sha(candidate)!==row.afterSha256||!actual.equals(candidate))throw Error('current teaching main/candidate drift:'+row.file);
 }
 const old=f=>before.get(f)||read(f),fullBytes=read(spec.previousFull.file),full=JSON.parse(fullBytes);
 if(sha(fullBytes)!==spec.previousFull.sha256||full.status!=='passed'||full.exitCode!==0||!Array.isArray(full.frozenDrift)||full.frozenDrift.length||full.inputs.length!==1381||sha(read(full.log))!==full.logSha256||!read(full.log).toString().trimEnd().endsWith('✅ ぜんぶ通過'))throw Error('current teaching previous full drift');
 for(const row of full.inputs){if(!assets&&media(row.file))continue;if(sha(old(row.file))!==row.sha256)throw Error('current teaching prior full input drift:'+row.file);}
 const receipt=JSON.parse(read(BASE+'integration.json'));
 if(receipt.specSha256!==SPEC_SHA||receipt.status!=='reviewed67 exact successor; final whole verification separate'||receipt.guards.length!==3)throw Error('current teaching receipt drift');
 const names=new Set([BASE+'checked-successor.cjs',BASE+'verify-main-integration.mjs',BASE+'legacy-view.mjs']);
 for(const row of receipt.guards){if(!names.delete(row.file)||sha(read(row.file))!==row.sha256)throw Error('current teaching verifier drift');}
 if(names.size)throw Error('current teaching missing verifier');
 const historical=before.get(spec.historicalGuard);if(!historical)throw Error('missing historical teaching guard');
 const view=Object.freeze({...fs,readFileSync(file,options){const rel=path.relative(root,path.resolve(file)),bytes=before.get(rel);if(!bytes)return fs.readFileSync(file,options);const encoding=typeof options==='string'?options:options?.encoding;return encoding?bytes.toString(encoding):Buffer.from(bytes);}});
 const module={exports:{}},trustedRequire=name=>{if(name==='node:fs')return view;if(['node:path','node:crypto','node:vm'].includes(name))return require(name);throw Error('unexpected historical dependency:'+name);};
 vm.runInNewContext(historical.toString(),{module,exports:module.exports,require:trustedRequire,__dirname:path.dirname(path.join(root,spec.historicalGuard)),Buffer},{filename:spec.historicalGuard,timeout:1000});
 return {spec,full,receipt,before,original:module.exports};
}
function checkMainSource(root=ROOT,options={}){
 const state=validated(root,options),legacy=state.original.checkMainSource(root,options);
 if(legacy.size!==27)throw Error('historical normalized scope drift');
 return legacy;
}
function mainDependencyFiles(root=ROOT){
 const {spec,full,receipt,original}=validated(root,{assets:false});
 return [...new Set([...original.mainDependencyFiles(root),BASE+'compat-spec.json',BASE+'integration.json',...spec.files.flatMap(r=>[r.file,r.beforeFile,r.candidateFile]),spec.previousFull.file,full.log,...full.inputs.map(r=>r.file),...receipt.guards.map(r=>r.file)])];
}
module.exports={checkMainSource,mainDependencyFiles};
