import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const here=new URL('./',import.meta.url),root=new URL('../../../../../',import.meta.url);
const sha=v=>createHash('sha256').update(v).digest('hex');
const files=[];
async function transform(name,edit){
 const path='cf-worker/src/'+name,original=await readFile(new URL(path,root),'utf8');
 let candidate=original;
 const replace=(from,to)=>{assert.equal(candidate.split(from).length,2,'exact candidate edit: '+from);candidate=candidate.replace(from,to);};
 edit(replace);
 await writeFile(new URL('before/'+name,here),original);
 await writeFile(new URL(name,here),candidate);
 files.push({file:path,beforeSha256:sha(original),afterSha256:sha(candidate),beforeFile:'tools/candidates/textbook-ai-20261026/review/practice-expansion-20261027/before/'+name,candidateFile:'tools/candidates/textbook-ai-20261026/review/practice-expansion-20261027/'+name});
}
await transform('ai-test-review-content.mjs',replace=>{
 replace('export async function buildTestReviewChunks(proof,uid,plan){','export async function buildTestReviewChunks(proof,uid,plan,{legacyPractices=false}={}){');
 replace('practices:await reviewPracticeOptions(slot.question)', 'practices:await reviewPracticeOptions(slot.question,{legacy:legacyPractices})');
 replace(' return {sessionId:source.session.id,fingerprint:source.fingerprint,total:rows.length,plan,model:testReviewModel(plan),chunks};\n}', ` return {sessionId:source.session.id,fingerprint:source.fingerprint,total:rows.length,plan,model:testReviewModel(plan),chunks};
}
// Compatibility is selected only by a previously stored server manifest.
// An exact source/model/total/chunk match is required; no client version flag.
export async function buildCompatibleTestReviewChunks(proof,uid,plan,saved){
 const current=await buildTestReviewChunks(proof,uid,plan);
 if(!saved)return current;
 const manifest=chunks=>chunks.map(({id,digest,questionIds,practices})=>({id,digest,questionIds,practices}));
 const same=compiled=>compiled.fingerprint===saved.sourceFingerprint&&compiled.plan===saved.plan&&compiled.model===saved.model&&compiled.total===saved.total&&JSON.stringify(manifest(compiled.chunks))===JSON.stringify(manifest(saved.chunks));
 if(same(current)||current.fingerprint!==saved.sourceFingerprint||current.plan!==saved.plan||current.model!==saved.model||current.total!==saved.total)return current;
 const legacy=await buildTestReviewChunks(proof,uid,plan,{legacyPractices:true});
 return same(legacy)?legacy:current;
}`);
});
await transform('ai-test-review-jobs.mjs',replace=>{
 replace("import {buildTestReviewChunks,testReviewDigest} from './ai-test-review-content.mjs';", "import {buildCompatibleTestReviewChunks,testReviewDigest} from './ai-test-review-content.mjs';");
 replace(" const compiled=await buildTestReviewChunks(proof,uid,first.plan),chunks=compiled.chunks.map(c=>({...manifest([c])[0],done:false})),manifestSha256=await testReviewDigest(JSON.stringify(manifest(chunks))),db=env.AUTH_DB,k=key(uid,source.session.id),prior=await readTestReviewJob(db,uid,source.session.id);", " const db=env.AUTH_DB,k=key(uid,source.session.id),prior=await readTestReviewJob(db,uid,source.session.id);\n const compiled=await buildCompatibleTestReviewChunks(proof,uid,first.plan,prior?.row),chunks=compiled.chunks.map(c=>({...manifest([c])[0],done:false})),manifestSha256=await testReviewDigest(JSON.stringify(manifest(chunks)));");
});
await transform('ai-test-review-service.mjs',replace=>{
 replace("import {buildTestReviewChunks,testReviewDigest} from './ai-test-review-content.mjs';", "import {buildCompatibleTestReviewChunks,testReviewDigest} from './ai-test-review-content.mjs';");
 replace('const compiled=await buildTestReviewChunks(proof,uid,rights.plan),pending=', 'const compiled=await buildCompatibleTestReviewChunks(proof,uid,rights.plan,old?.row),pending=');
 replace('compiled=await buildTestReviewChunks(proof,uid,row.plan);', 'compiled=await buildCompatibleTestReviewChunks(proof,uid,row.plan,row);');
 replace('compiled.chunks.every((c,i)=>c.id===row.chunks[i].id&&c.digest===row.chunks[i].digest)', 'compiled.chunks.every((c,i)=>c.id===row.chunks[i].id&&c.digest===row.chunks[i].digest&&JSON.stringify(c.questionIds)===JSON.stringify(row.chunks[i].questionIds)&&JSON.stringify(c.practices)===JSON.stringify(row.chunks[i].practices))');
});
await writeFile(new URL('job-compat-candidate.json',here),JSON.stringify({status:'candidate only; main unchanged',files,scope:'Reproduce exact original practice options only for matching stored unfinished job manifests; current jobs use48 defaults. Existing authorization, CAS, credit, unknown-operation and full digest guards retained.'},null,2)+'\n');
console.log('Unfinished-job compatibility:3 module candidates built; main unchanged.');
