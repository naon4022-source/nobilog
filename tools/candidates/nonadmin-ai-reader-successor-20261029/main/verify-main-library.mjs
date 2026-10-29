import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import data from '../../../../cf-worker/src/ai-review-practice-data.mjs';
import {reviewPracticeOptions,publicReviewPractice,gradeReviewPractice} from '../../../../cf-worker/src/ai-review-practice-library.mjs';
const root=new URL('../../../../',import.meta.url),here=new URL('./',import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex');
const bank=JSON.parse(await readFile(new URL('site-assets/material-bank.json',root))),sources=new Map(bank.units.flatMap(u=>[...(u.questions||[]),...(u.tests||[])].map(q=>[q.id,q])));
let checks=0;const equal=(a,b,m)=>{assert.deepEqual(a,b,m);checks++;};
const preparation=JSON.parse(await readFile(new URL('preparation.json',here)));
for(const input of preparation.inputs)equal(sha(await readFile(new URL(input.file,root))),input.sha256,'original main/Claude candidate unchanged');
equal(data.questions.length,96,'actual candidate questions');equal(data.patterns.length,32,'actual candidate patterns');
const shipped=(await import(new URL('before/cf-worker/src/ai-review-practice-data.mjs',here))).default;
for(const q of shipped.questions)equal(data.questions.find(r=>r.id===q.id),q,'shipped question unchanged '+q.id);
for(const p of shipped.patterns)equal(data.patterns.find(r=>r.id===p.id),p,'shipped pattern unchanged '+p.id);
const seen=new Set();
for(const ref of data.references){
 const source=sources.get(ref.questionId);assert(source,'real source exists '+ref.questionId);checks++;
 equal(sha(JSON.stringify({id:source.id,prompt:source.prompt,answer:source.answer})),ref.sha256,'real source binding');
 const options=await reviewPracticeOptions(source),pattern=data.patterns.find(p=>p.id===ref.patternId);
 for(const id of pattern.practiceIds){
  const q=data.questions.find(q=>q.id===id);
  if(!q.appliesToSourceIds.includes(source.id)){
   assert(!options.some(o=>o.id===id),'unbound practice excluded');checks++;
   equal(await publicReviewPractice(source,id),null,'unbound public practice rejected');
   continue;
  }
  assert(options.some(o=>o.id===id),'actual library source eligibility');checks++;
  const publicQ=await publicReviewPractice(source,id);
  equal(Object.keys(publicQ).sort(),['id','prompt','type'],'public practice hides answer/explanation');
  equal(publicQ.prompt,q.prompt,'current reordered prompt');
  for(const answer of 'アイウ')equal((await gradeReviewPractice(source,id,answer)).correct,q.answer.accepted.includes(answer),'actual server grader '+id+':'+answer);
  seen.add(id);
 }
 equal(await reviewPracticeOptions({...source,prompt:source.prompt+'changed'}),[],'changed source rejected');
}
equal(seen.size,96,'all96 reachable and graded');
const testIds=new Set(bank.units.flatMap(u=>(u.tests||[]).map(q=>q.id))),shippedIds=new Set(shipped.questions.map(q=>q.id));
const added=data.questions.filter(q=>!shippedIds.has(q.id));
for(const q of added){assert(q.appliesToSourceIds.some(id=>testIds.has(id)),'new question has an actual current test source '+q.id);checks++;}
equal(added.length,48,'new48 all reachable from current test bank');
const positions=preparation.changes.map(r=>r.newCorrect);equal([...new Set(positions)].sort(),[...'アイウ'].sort(),'answer positions vary');
for(const x of 'アイウ')equal(positions.filter(p=>p===x).length,10,'balanced aggregate '+x);
assert(Array.from({length:10},(_,n)=>positions.slice(n*3,n*3+3).join('')).some(s=>new Set(s).size<3),'no per-pattern missing-letter rule');checks++;
for(const p of data.patterns){assert([...p.commentExample].length<=70,'feedback length '+p.id);checks++;}
await writeFile(new URL('library-result.json',here),JSON.stringify({status:'passed',checks,questions:96,patterns:32,referenceRows:data.references.length,sourceReachableQuestions:seen.size,newQuestionsWithCurrentTestSource:added.length,shippedPreserved:48,targetedUnshipped:30,reorderedUnshipped:preparation.changes.filter(r=>JSON.stringify(r.before)!==JSON.stringify(r.after)).length,inputs:preparation.inputs,outputSha256:sha(await readFile(new URL('cf-worker/src/ai-review-practice-data.mjs',root))),scope:'Actual main96 data and unchanged server library; all references checked against real public bank and old48 preserved. Synthetic pure-library verification; owned HTTP and full-suite results recorded separately.'},null,2)+'\n');
console.log('Choice-order candidate: '+checks+' checks passed; all96 reachable/graded; main48 unchanged.');
