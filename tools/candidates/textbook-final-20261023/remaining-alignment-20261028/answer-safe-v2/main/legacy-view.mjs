// Build an isolated, explicitly whitelisted predecessor tree; never execute app writes.
import assert from 'node:assert/strict';
import {readFile,mkdir,symlink,lstat} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
export async function legacyView(root,base){
 const spec=JSON.parse(await readFile(path.join(root,base,'compat-spec.json')));
 const full=JSON.parse(await readFile(path.join(root,spec.previousFull.file)));
 const rows=new Map(spec.files.map(r=>[r.file,r]));
 const fixture=path.join(root,base,'legacy-view');
 const output=path.dirname(spec.historicalVerifier)+'/source-current-result.json';
 const files=new Set(full.inputs.map(r=>r.file));
 let checked=0;
 for(const file of files){
  if(file===output)continue;
  assert(typeof file==='string'&&!path.isAbsolute(file)&&!file.split('/').includes('..'),'predecessor relative whitelist');
  const row=rows.get(file),source=path.join(root,row?row.beforeFile:file),target=path.join(fixture,file);
  const bytes=await readFile(source),input=full.inputs.find(r=>r.file===file);
  if(input)assert.equal(sha(bytes),input.sha256,'predecessor snapshot hash '+file);
  if(row)assert.equal(sha(bytes),row.beforeSha256,'reviewed predecessor hash '+file);
  await mkdir(path.dirname(target),{recursive:true});
  let exists=false;try{await lstat(target);exists=true;}catch(e){if(e.code!=='ENOENT')throw e;}
  if(!exists)await symlink(source,target);
  assert.equal(sha(await readFile(target)),sha(bytes),'predecessor link bytes '+file);checked++;
 }
 return {fixture,verifier:path.join(fixture,spec.historicalVerifier),output:path.join(fixture,output),checked};
}
