import {reviewedMathBankSuccessor} from "file:///Users/shimizunaotomoo/Desktop/my-app/tools/candidates/textbook-ai-20261026/review/math-order-followup/checked-bank-successor.mjs";
// Real compiled client/server curriculum and graders, no record/API calls.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import serverBank from "file:///Users/shimizunaotomoo/Desktop/my-app/cf-worker/src/material-bank.mjs";
const require=createRequire("file:///Users/shimizunaotomoo/Desktop/my-app/tools/candidates/social-geo-nihon-review-20261021/verify-integrated.mjs"),client=require('../../../site-assets/material-engine.js'),server=require('../../../cf-worker/src/material-engine.cjs');
const H=new URL('./',"file:///Users/shimizunaotomoo/Desktop/my-app/tools/candidates/social-geo-nihon-review-20261021/verify-integrated.mjs"),load=async p=>JSON.parse(await readFile(new URL(p,H),'utf8'));
const manifest=await load('candidate-manifest.json'),candidate=await load('rubric-candidate.json');
const actual=await load('../../../'+manifest.source),bank=await load('../../../site-assets/material-bank.json');
assert.deepEqual(actual,candidate);assert.deepEqual(bank.units.find(u=>u.id===actual.id),actual);assert.deepEqual(serverBank.units.find(u=>u.id===actual.id),actual);
const before=await load('previous/site-assets/material-bank.json'),expected=structuredClone(before);expected.units=expected.units.map(u=>u.id===actual.id?actual:u);
// 2026-10-21 Claude：その後の採点条件だけの修正（answer-forms-20261021/corrections.json）は、記録どおりの answer に置きかえて比べる。ほかは今までどおり完全一致。
const corrections=await load('../answer-forms-20261021/corrections.json');for(const u of expected.units)for(const k of ['questions','tests'])for(const q of u[k]||[])if(corrections.questions[q.id]){assert.deepEqual(q.answer,corrections.questions[q.id].before);q.answer=corrections.questions[q.id].after;}
// 2026-10-22 Claude：記述問題の否定の直し（rubric-negation-20261022/corrections.json）も、記録どおりの answer に置きかえて比べる。
const negation=await load('../rubric-negation-20261022/corrections.json'),negById=Object.fromEntries(negation.changes.map(c=>[c.id,c]));for(const u of expected.units)for(const k of ['questions','tests'])for(const q of u[k]||[])if(negById[q.id]){assert.deepEqual(q.answer,negById[q.id].before);q.answer=negById[q.id].after;}
// 2026-10-22 Claude：あとから足した模擬検定（mode:'kentei' の単元と出典）は、確認済みファイルと同じであることを確かめてから比較から外す。
const kenteiUnits=bank.units.filter(u=>u.mode==='kentei');for(const u of kenteiUnits)assert.deepEqual(u,await load('../../../教材整理/確認済み/'+u.id+'.json'));
// 2026-10-22 Claude：この点検のあとに確認済みへ足した単元（国語の記述2単元・特訓の追加など）も、確認済みファイルと同じことを確かめてから比較から外す。
const expectedIds=new Set(expected.units.map(u=>u.id)),expectedSrc=new Set(expected.sources.map(x=>x.id));
const addedUnits=bank.units.filter(u=>u.mode!=='kentei'&&!expectedIds.has(u.id));for(const u of addedUnits)assert.deepEqual(u,await load('../../../教材整理/確認済み/'+u.id+'.json'));
const bankWithoutKentei={...bank,units:bank.units.filter(u=>u.mode!=='kentei'&&expectedIds.has(u.id)),sources:bank.sources.filter(x=>x.mode!=='kentei'&&expectedSrc.has(x.id))};
assert.deepEqual(bankWithoutKentei,await reviewedMathBankSuccessor(expected,bank),'all other units and source registries exact');assert.deepEqual(serverBank,bank);
const proof=await load('candidate-result.json');let checks=5;
for(const c of proof.cases){
 const q=actual.questions[c.number-1];assert.equal(client.grade(q,c.input).correct,c.expectedCorrect);checks++;
 assert.equal(server.grade(q,c.input).correct,c.expectedCorrect);checks++;
}
const result={status:'passed',checks,sourceSha256:createHash('sha256').update(await readFile(new URL('../../../'+manifest.source,"file:///Users/shimizunaotomoo/Desktop/my-app/tools/candidates/social-geo-nihon-review-20261021/verify-integrated.mjs"))).digest('hex'),bankSha256:createHash('sha256').update(await readFile(new URL('../../../site-assets/material-bank.json',"file:///Users/shimizunaotomoo/Desktop/my-app/tools/candidates/social-geo-nihon-review-20261021/verify-integrated.mjs"))).digest('hex'),otherUnitsExact:true,existingRecordsTouched:false,realUsers:false,network:false};
await writeFile(new URL('../textbook-ai-20261026/review/math-order-followup/social-successor-candidate-result.json',H),JSON.stringify(result,null,2)+'\n');console.log('Social3 rubric guards:',checks,'integrated checks passed; authored text and other curricula preserved');
