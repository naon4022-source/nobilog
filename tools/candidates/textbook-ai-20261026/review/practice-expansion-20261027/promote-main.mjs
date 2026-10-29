import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,writeFile,copyFile,lstat,realpath,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../../../../../',import.meta.url),here=new URL('./',import.meta.url),require=createRequire(import.meta.url),sha=v=>createHash('sha256').update(v).digest('hex');
const read=file=>readFile(new URL(file,root)),stamp=new URL('promotion.json',here);
let exists=true;try{await access(stamp);}catch{exists=false;}assert.ok(!exists,'promotion already recorded; inspect it instead of repeating');
const receiptBytes=await readFile(new URL('main-integration.json',here)),receipt=JSON.parse(receiptBytes),proofBytes=await readFile(new URL('successor-clone-result.json',here)),proof=JSON.parse(proofBytes);
assert.equal(proof.status,'passed');assert.equal(proof.checks,34);assert.equal(proof.integrationChecks,88);
for(const input of proof.inputs)assert.equal(sha(await read(input.file)),input.sha256,'isolated successor proof source drift');
const beforeFull=JSON.parse(await readFile(new URL('before-full.json',here)));assert.equal(beforeFull.exitCode,0);assert.ok(beforeFull.observedTerminal);
const realRoot=await realpath(root);
for(const row of [...receipt.products,...receipt.verifiers]){
 const target=new URL(row.file,root),stat=await lstat(target);
 assert.ok(stat.isFile()&&!stat.isSymbolicLink(),'regular approved source file only');
 assert.ok((await realpath(target)).startsWith(realRoot+'/'),'approved project root');
 assert.equal(sha(await read(row.file)),row.beforeSha256,'current main differs; do not overwrite');
 assert.equal(sha(await read(row.candidateFile)),row.afterSha256,'reviewed candidate drift');
}
const base='tools/candidates/textbook-ai-20261026/review/';
const protectedNames=['practice-route-result.json','practice-browser-result.json','practice-main-library-result.json','practice-integration-result.json',...['390','820','1440'].map(w=>'practice-screens/practice-'+w+'.png')].map(f=>base+f);
protectedNames.push('site-assets/material-bank.json','cf-worker/src/material-bank.mjs');
const preserved=[];for(const file of protectedNames)preserved.push({file,sha256:sha(await read(file))});
const completed=[];
try{
 for(const row of [...receipt.products,...receipt.verifiers]){await copyFile(new URL(row.candidateFile,root),new URL(row.file,root));completed.push(row.file);}
 const normalized=require('../practice-source.cjs').checkPracticeSource();
 assert.equal(normalized.size,5);assert.equal(normalized.expansionBefore.size,15);
 for(const input of preserved)assert.equal(sha(await read(input.file)),input.sha256,'historical proof or canonical bank changed');
 await writeFile(stamp,JSON.stringify({status:'applied; actual main individual and final full checks pending',products:receipt.products.map(r=>({file:r.file,beforeSha256:r.beforeSha256,afterSha256:r.afterSha256})),verifiers:receipt.verifiers.map(r=>({file:r.file,beforeSha256:r.beforeSha256,afterSha256:r.afterSha256})),receiptSha256:sha(receiptBytes),isolatedProofSha256:sha(proofBytes),protected:preserved,scope:'Local main only. Seven reviewed product files and eight exact verifier successors; no bank/grades/auth/admin/provider flags/schedules/publication/commit/deletion changes.'},null,2)+'\n');
 console.log('Local main promoted:7 product files +8 exact verifier successors; historical proofs and canonical bank unchanged. Final full pending.');
}catch(error){await writeFile(stamp,JSON.stringify({status:'promotion needs repair; do not claim completed',completed,error:'source write or verification failed; inspect exact error in local tool output',receiptSha256:sha(receiptBytes)},null,2)+'\n');throw error;}
