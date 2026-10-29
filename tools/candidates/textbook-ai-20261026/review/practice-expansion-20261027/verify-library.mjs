import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as candidate from './candidate-library.mjs';
import * as previous from '../../../../../cf-worker/src/ai-review-practice-library.mjs';
import bank from '../../../../../cf-worker/src/material-bank.mjs';
const here=new URL('./',import.meta.url),root=new URL('../../../../../',import.meta.url);
const read=f=>readFile(new URL(f,root));
const sha=v=>createHash('sha256').update(v).digest('hex');
const data=JSON.parse(await readFile(new URL('data.json',here)));
const manifest=JSON.parse(await readFile(new URL('candidate.json',here)));
let checks=0;
const ok=(v,m)=>{assert.ok(v,m);checks++;};
const same=(a,b,m)=>{assert.deepEqual(a,b,m);checks++;};
for(const input of manifest.inputs)same(sha(await read(input.file)),input.sha256,'candidate inputs unchanged');
const current=new Map(data.questions.map(q=>[q.id,q]));
const old=new Map(data.legacyQuestions.map(q=>[q.id,q]));
const original=JSON.parse((await read('cf-worker/src/ai-review-practice-data.mjs')).toString().replace(/^export default /,'').replace(/;\s*$/,''));
same(data.legacyQuestions,original.questions,'old question bytes retain all original fields');
same(data.legacyPatterns,original.patterns,'old option order and purpose retained');
same(current.size,48,'48 new default questions');
same(old.size,30,'30 retained legacy questions');
const incoming=JSON.parse(await read('Claude作業/20261026_ProAI類題/practice-bank.json'));
for(const q of data.questions){
 const prior=q.id.endsWith('-v2')?old.get(q.id.slice(0,-3)):incoming.questions.find(p=>p.id===q.id);
 ok(prior,'each question has an original');
 const choices=s=>new Map([...s.matchAll(/^([アイウ])　(.+)$/gm)].map(m=>[m[1],m[2]]));
 const rows=choices(q.prompt),priorRows=choices(prior.prompt);
 same(rows.size,3,'three explicit alternatives');
 same(rows.get(q.answer.accepted[0]),priorRows.get(prior.answer.accepted[0]),'correct option text retained exactly');
 same(q.numericCheck,prior.numericCheck,'all numerical checks retained');
 const correctLength=[...rows.get(q.answer.accepted[0])].length;
 const wrongLengths=[...rows].filter(([letter])=>letter!==q.answer.accepted[0]).map(([,text])=>[...text].length);
 ok(correctLength<=Math.max(...wrongLengths)*1.55,'correct option not identifiable as uniquely much longer');
}
for(const ref of data.references){
 const unit=bank.units.find(u=>u.id===ref.unitId);
 const source=[...unit.questions,...unit.tests].find(q=>q.id===ref.questionId);
 const expected=data.questions.filter(q=>q.patternId===ref.patternId&&q.appliesToSourceIds.includes(source.id));
 const options=await candidate.reviewPracticeOptions(source);
 same(await candidate.reviewPracticeOptions(source,{legacy:true}),await previous.reviewPracticeOptions(source),'old manifested job options reproduced exactly');
 ok(expected.every(q=>options.some(p=>p.id===q.id)),'explicit source skills offered');
 ok(options.every(p=>current.has(p.id)&&!old.has(p.id)),'legacy IDs never offered to new jobs');
 ok(options.every(p=>Object.keys(p).sort().join(',')==='focus,id,purpose'),'provider options exclude answers');
 for(const q of expected){
  const view=await candidate.publicReviewPractice(source,q.id);
  same(Object.keys(view).sort(),['id','prompt','type'],'answer-free public view');
  for(const letter of ['ア','イ','ウ'])same((await candidate.gradeReviewPractice(source,q.id,letter)).correct,q.answer.accepted.includes(letter),'existing deterministic grader');
  view.prompt='untrusted mutation';
  same((await candidate.publicReviewPractice(source,q.id)).prompt,q.prompt,'public view cannot mutate bank');
 }
 const retained=data.legacyQuestions.filter(q=>q.patternId===ref.patternId&&q.appliesToSourceIds.includes(source.id));
 for(const q of retained){
  same(await candidate.publicReviewPractice(source,q.id),await previous.publicReviewPractice(source,q.id),'legacy prompt preserved');
  for(const letter of ['ア','イ','ウ'])same(await candidate.gradeReviewPractice(source,q.id,letter),await previous.gradeReviewPractice(source,q.id,letter),'legacy full grading result preserved');
 }
 for(const changed of [{...source,prompt:source.prompt+' different'},{...source,answer:{kind:'exact',accepted:['other']}}]){
  same(await candidate.reviewPracticeOptions(changed),[],'changed source not offered');
  for(const q of [...expected,...retained])same(await candidate.publicReviewPractice(changed,q.id),null,'legacy and current require exact source');
 }
 same(await candidate.publicReviewPractice(source,'unknown-question'),null,'unknown ID refused');
}
const testIds=new Set(bank.units.flatMap(u=>[...u.tests,...(u.mode==='kentei'?u.questions:[])].map(q=>q.id)));
const reachable=data.questions.filter(q=>q.appliesToSourceIds.some(id=>testIds.has(id)));
same(reachable.length,41,'41 actual question-level links');
same(manifest.reachableDefaultQuestions,41,'manifest count is exact');
const negative=bank.units.find(u=>u.id==='drill-math-1-signedcalc').tests.find(q=>q.id==='drill-math-1-signedcalc-test-14');
same((await candidate.reviewPracticeOptions(negative)).map(q=>q.id).sort(),['review-math-neg-01-v2','review-math-neg-02-v2','review-math-neg-03-v2'],'all three negative subtraction practices reachable');
for(const q of data.legacyQuestions.filter(q=>q.patternId==='math-negative-subtraction'))same(await candidate.publicReviewPractice(negative,q.id),null,'new binding does not widen legacy question bindings');
const files=['cf-worker/src/ai-review-practice-data.mjs','cf-worker/src/ai-review-practice-library.mjs','cf-worker/src/material-bank.mjs','cf-worker/src/material-engine.cjs',...['build.mjs','data.json','candidate.json','candidate-library.mjs','ai-review-practice-data.mjs','ai-review-practice-library.mjs','verify-library.mjs'].map(f=>'tools/candidates/textbook-ai-20261026/review/practice-expansion-20261027/'+f)];
const inputs=[];for(const file of files)inputs.push({file,sha256:sha(await read(file))});
await writeFile(new URL('library-result.json',here),JSON.stringify({status:'passed',checks,defaultQuestions:48,legacyQuestions:30,reachableQuestions:41,inputs,scope:'Candidate pure library only. Current IDs and exact legacy views/results, numerical conditions, answer-free output, wrong-source refusal and exact existing-test links. HTTP/SQLite/browser/main integration not proven.'},null,2)+'\n');
console.log('Expanded practice candidate library: '+checks+' checks passed;48 default/30 legacy/41 reachable.');
