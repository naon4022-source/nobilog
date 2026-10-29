import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const here=new URL('./',import.meta.url),root=new URL('../../../../../',import.meta.url);
const sha=v=>createHash('sha256').update(v).digest('hex');
export async function installCandidateHooks(){
 const initial=JSON.parse(await readFile(new URL('candidate.json',here)));
 for(const input of initial.inputs)assert.equal(sha(await readFile(new URL(input.file,root))),input.sha256,'candidate baseline drift');
 const receipt=JSON.parse(await readFile(new URL('job-compat-candidate.json',here)));
 assert.deepEqual(receipt.files.map(f=>f.file).sort(),['cf-worker/src/ai-test-review-content.mjs','cf-worker/src/ai-test-review-jobs.mjs','cf-worker/src/ai-test-review-service.mjs']);
 const substitutions=new Map([
  [new URL('cf-worker/src/ai-review-practice-library.mjs',root).href,new URL('candidate-library.mjs',here).href],
  [new URL('cf-worker/src/ai-review-practice-data.mjs',root).href,new URL('ai-review-practice-data.mjs',here).href]
 ]);
 for(const row of receipt.files){
  assert.equal(sha(await readFile(new URL(row.file,root))),row.beforeSha256,'main source drift');
  assert.equal(sha(await readFile(new URL(row.candidateFile,root))),row.afterSha256,'candidate source drift');
  substitutions.set(new URL(row.file,root).href,new URL(row.candidateFile,root).href);
 }
 const relocated=new Set(receipt.files.map(row=>new URL(row.candidateFile,root).href));
 let resolutions=0;
 const handle=registerHooks({resolve(specifier,context,nextResolve){
  // The three unchanged dependency lists keep resolving against cf-worker/src.
  if(relocated.has(context.parentURL)&&specifier.startsWith('./'))specifier=new URL(specifier,new URL('cf-worker/src/',root)).href;
  const result=nextResolve(specifier,context),replacement=substitutions.get(result.url);
  if(!replacement)return result;
  resolutions++;
  return {...result,url:replacement};
 }});
 return {deregister:()=>handle.deregister(),resolutions:()=>resolutions,substitutions:[...substitutions]};
}
