// Exact reviewed teaching successor. Historical assertions run unchanged in a
// private read-only predecessor view after current teaching bytes are validated.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'../../../../..');
const BASE='tools/candidates/textbook-final-20261023/kokugo-reading-20261027/main/';
const PRIOR='tools/candidates/textbook-vision-20261027/main/checked-source.cjs';
const SPEC_SHA='cdb1a98e92a86aa2b8be66c3cd29a06d9a033d00efef291e71ab8ee8950a1111',sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const media=f=>/\.(?:svg|jpg|png|mp4|webm|mp3|wav)$/.test(f);
const safe=f=>typeof f==='string'&&!path.isAbsolute(f)&&!f.split('/').includes('..')&&
 (/^(?:tools\/candidates|site-assets|cf-worker\/src|教材整理\/Claude_Codex共有)\//.test(f)||['index.html','preview/build.py','.claude/verify/run.sh','.claude/verify/d1-sqlite.js','Claude作業/20261026_ProAI類題/practice-bank.json','tools/releases/auth-repair-20261019/verify-login-flow.mjs','tools/releases/google-link-20261019/verify-login-flow.mjs'].includes(f));
function validated(root=ROOT,{assets=true}={}){
 const read=f=>{if(!safe(f))throw Error('teaching successor path');return fs.readFileSync(path.join(root,f));};
 const bytes=read(BASE+'prepared.json');if(sha(bytes)!==SPEC_SHA)throw Error('teaching specification drift');
 const spec=JSON.parse(bytes),before=new Map();
 if(spec.files.length!==19||new Set(spec.files.map(r=>r.file)).size!==19)throw Error('teaching successor whitelist');
 for(const row of spec.files){
  if(row.beforeFile!==BASE+'before/'+row.file)throw Error('teaching backup path');
  const previous=read(row.beforeFile);if(sha(previous)!==row.beforeSha256)throw Error('teaching predecessor drift:'+row.file);
  before.set(row.file,previous);
  if(assets||!media(row.file)){
   const actual=read(row.file),candidate=read(row.candidateFile);
   if(sha(actual)!==row.afterSha256||sha(candidate)!==row.afterSha256||!actual.equals(candidate))throw Error('teaching main/candidate drift:'+row.file);
   if(row.edits){let replay=previous.toString();for(const edit of row.edits){if(replay.split(edit.before).length!==2)throw Error('teaching unique verifier edit');replay=replay.replace(edit.before,edit.after);}if(replay!==actual.toString())throw Error('unrelated teaching verifier edit');}
  }
 }
 const old=f=>before.get(f)||read(f);
 for(const r of spec.frozenEvidence){if(!assets&&media(r.file))continue;if(sha(old(r.file))!==r.sha256)throw Error('teaching evidence drift:'+r.file);}
 const fullBytes=read(spec.previousFull.file),full=JSON.parse(fullBytes);
 if(sha(fullBytes)!==spec.previousFull.sha256||full.status!=='passed'||full.exitCode!==0||full.frozenDrift.length||full.inputs.length!==1161||sha(read(full.log))!==full.logSha256||!read(full.log).toString().trimEnd().endsWith('✅ ぜんぶ通過'))throw Error('teaching previous full drift');
 for(const r of full.inputs){if(!assets&&media(r.file))continue;if(sha(old(r.file))!==r.sha256)throw Error('teaching full predecessor drift:'+r.file);}
 const receipt=JSON.parse(read(BASE+'integration.json'));
 if(receipt.specSha256!==SPEC_SHA||receipt.status!=='reviewed exact teaching successor; progress separate'||receipt.guards.length!==2)throw Error('teaching receipt drift');
 for(const r of receipt.guards){if(![BASE+'checked-successor.cjs',BASE+'verify-main-integration.mjs'].includes(r.file)||sha(read(r.file))!==r.sha256)throw Error('teaching successor guard drift');}
 const source=before.get(PRIOR);if(!source||sha(source)!==spec.priorGuardSha256)throw Error('teaching original guard drift');
 const view=Object.freeze({...fs,readFileSync(file,options){const relative=path.relative(root,path.resolve(file)),bytes=before.get(relative);if(!bytes)return fs.readFileSync(file,options);const encoding=typeof options==='string'?options:options?.encoding;return encoding?bytes.toString(encoding):Buffer.from(bytes);}});
 const module={exports:{}},trustedRequire=name=>{if(name==='node:fs')return view;if(['node:path','node:crypto'].includes(name))return require(name);throw Error('unexpected historical teaching dependency');};
 vm.runInNewContext(source.toString(),{module,exports:module.exports,require:trustedRequire,__dirname:path.dirname(path.join(root,PRIOR)),Buffer},{filename:PRIOR,timeout:1000});
 return {read,spec,receipt,before,original:module.exports};
}
function checkMainSource(root=ROOT,options={}){
 const state=validated(root,options),older=state.original.checkMainSource(root,options);
 if(older.size!==8)throw Error('historical vision scope changed');
 const result=new Map([...state.before,...older]);if(result.size!==26)throw Error('teaching normalized scope changed');
 return result;
}
function mainDependencyFiles(root=ROOT){
 const {spec,receipt,original}=validated(root,{assets:false});
 const full=JSON.parse(fs.readFileSync(path.join(root,spec.previousFull.file)));
 return [...new Set([...original.mainDependencyFiles(root),BASE+'prepared.json',BASE+'integration.json',...spec.files.flatMap(r=>[r.file,r.beforeFile,r.candidateFile]),...spec.frozenEvidence.map(r=>r.file),spec.previousFull.file,full.log,...full.inputs.map(r=>r.file),...receipt.guards.map(r=>r.file)])];
}
module.exports={checkMainSource,mainDependencyFiles};
