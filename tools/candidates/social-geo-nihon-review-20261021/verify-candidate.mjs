// Explicit educational counterexamples for the three reported grading defects.
// Actual client/server graders; authored prompts, explanations and numbers unchanged.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url),client=require('../../../site-assets/material-engine.js'),server=require('../../../cf-worker/src/material-engine.cjs');
const here=new URL('./',import.meta.url),manifest=JSON.parse(await readFile(new URL('candidate-manifest.json',here),'utf8'));
const reproduction=JSON.parse(await readFile(new URL('reproduction-result.json',here),'utf8'));assert(reproduction.rows.length===3&&reproduction.rows.every(x=>x.reproduced));
const oldBytes=await readFile(new URL('../../../'+manifest.source,import.meta.url)),newBytes=await readFile(new URL('rubric-candidate.json',here));
const hash=b=>createHash('sha256').update(b).digest('hex');assert.equal(hash(oldBytes),manifest.beforeSha256);assert.equal(hash(newBytes),manifest.candidateSha256);
const old=JSON.parse(oldBytes),candidate=JSON.parse(newBytes),expected=structuredClone(old);
for(const n of [31,37,69])expected.questions[n-1].answer=candidate.questions[n-1].answer;
assert.deepEqual(candidate,expected,'no non-answer-object change permitted');
for(const n of [31,37,69]){
 const a=structuredClone(candidate.questions[n-1].answer),b=structuredClone(old.questions[n-1].answer);
 if(n===37)a.reject=b.reject;else delete a.required;
 assert.deepEqual(a,b,'only the exact three declared grading guard fields may differ');
}
const cases=[
 [31,'暖流と寒流が出会うところだから',false],
 [31,'対馬海流と寒流がぶつかるため',false],
 [31,'暖流とリマン海流がぶつかるため',false],
 [31,'対馬海流とリマン海流',false],
 [31,'対馬海流とリマン海流は出会わないから',false],
 [31,'対馬海流とリマン海流がぶつかる潮目に近いから',true],
 [31,'寒流のリマン海流と暖流の対馬海流が出会う海だから',true],
 [31,'対馬暖流とリマン寒流がぶつかるため',true],
 [37,'寒くないから',false],
 [37,'寒くはありません',false],
 [37,'一年中低温ではないから',false],
 [37,'低温とは言えないから',false],
 [37,'一年を通して気温が低いから',true],
 [37,'寒い気候だから',true],
 [37,'気温の低い場所だから',true],
 [69,'水域の資源を使えるから',false],
 [69,'水産資源があるから',false],
 [69,'排他的経済水域が広がり水産資源を利用できるから',true],
 [69,'鉱産資源を利用できる広い排他的経済水域を確保できるため',true],
 [69,'広い排他的経済水域で水産資源や鉱産資源を利用できないから',false]
];
let checks=0;const rows=[];
for(const [n,input,correct] of cases){
 const q=candidate.questions[n-1],a=client.grade(q,input),b=server.grade(q,input);
 assert.deepEqual(a,b);checks++;assert.equal(a.correct,correct,'question'+n+': '+input);checks++;
 rows.push({number:n,input,expectedCorrect:correct,actualCorrect:a.correct});
}
await writeFile(new URL('candidate-result.json',here),JSON.stringify({status:'passed',checks,cases:rows,candidateSha256:hash(newBytes),sourceContentPreserved:true,scope:'these explicit mechanical input cases only; not general semantic grading',realUserData:false,network:false},null,2)+'\n');
console.log('Three social rubric candidates:',checks,'checks passed; no authored content or real records changed');
