// Explicit public baseline only; historical verifiers write only their private outputs.
import assert from 'node:assert/strict';
import {readFile,mkdir,symlink,lstat,readlink} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
export async function predecessorView(root,base){
 const spec=JSON.parse(await readFile(path.join(root,base,'prepared.json'))),full=JSON.parse(await readFile(path.join(root,spec.historicalCurrentSnapshot.file)));
 const rows=new Map(spec.currentBeforeFiles.map(r=>[r.file,r])),fixture=path.join(root,base,'predecessor-view-77');
 const teaching=spec.historicalTeachingDirectory,vision=path.dirname(spec.historicalMainSourceVerifier);
 const outputs=new Set([teaching+'/source-current-result.json',teaching+'/historical-integration.log',vision+'/source-current-result.json',path.dirname(spec.historicalVerifier)+'/source-current-result.json']);
 let checked=0;
 for(const row of full.inputs){
  const file=row.file;if(outputs.has(file))continue;
  assert(typeof file==='string'&&!path.isAbsolute(file)&&!file.split('/').includes('..'),'relative public predecessor input');
  assert(/^(?:tools\/candidates|site-assets|cf-worker\/src|教材整理\/Claude_Codex共有)\//.test(file)||['index.html','preview/build.py','.claude/verify/run.sh','.claude/verify/d1-sqlite.js','.claude/verify/verify-messages-browser.mjs','.claude/verify/verify-openai-chat-retry-browser.mjs','Claude作業/20261026_ProAI類題/practice-bank.json','tools/releases/auth-repair-20261019/verify-login-flow.mjs','tools/releases/google-link-20261019/verify-login-flow.mjs'].includes(file),'public predecessor whitelist '+file);
  const changed=rows.get(file),source=path.join(root,changed?changed.beforeFile:file),target=path.join(fixture,file),bytes=await readFile(source);
  assert.equal(sha(bytes),row.sha256,'prior full source '+file);
  await mkdir(path.dirname(target),{recursive:true});let exists=false;
  try{const stat=await lstat(target);assert(stat.isSymbolicLink(),'historical input must be a link');assert.equal(await readlink(target),source,'historical link destination');exists=true;}catch(e){if(e.code!=='ENOENT')throw e;}
  if(!exists)await symlink(source,target);
  assert.equal(sha(await readFile(target)),row.sha256,'private predecessor bytes '+file);checked++;
 }
 return {fixture,teachingEntry:path.join(fixture,spec.historicalVerifier),visionEntry:path.join(fixture,spec.historicalMainSourceVerifier),teachingResult:path.join(fixture,teaching,'source-current-result.json'),visionResult:path.join(fixture,vision,'source-current-result.json'),checked};
}
