import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../../../../../',import.meta.url),here=new URL('./',import.meta.url);
const sha=b=>createHash('sha256').update(b).digest('hex'),copy=v=>JSON.parse(JSON.stringify(v));
const read=p=>readFile(new URL(p,root));
const mainPath='cf-worker/src/ai-review-practice-data.mjs',bytes=await read(mainPath),old=JSON.parse(bytes.toString().replace(/^export default /,'').replace(/;\s*$/,''));
const incomingBytes=await read('Claude作業/20261026_ProAI類題/practice-bank.json');
assert.equal(sha(incomingBytes),'262837d2e63b4319a7746844b8fb7356d2665c37667b40eefd10cde2ae2a4b94');
const incoming=JSON.parse(incomingBytes),bank=JSON.parse(await read('site-assets/material-bank.json'));
assert.equal(old.questions.length,30);assert.equal(old.patterns.length,10);assert.equal(incoming.questions.length,18);assert.equal(incoming.patterns.length,6);
assert.ok(!old.legacyQuestions,'do not expand an already expanded bank twice');
const letters=['ア','イ','ウ'],fixes={
 'review-eng-change-03':{
  'ア':'No, he does not.　動作を尋ねる文だから、Isで始まっていてもdoes notで答える。',
  'イ':'No, he are not.　be動詞を使った質問だから、主語がheでもare notで答える。'
 },
 'review-soc-coordinates-03':{
  'ア':'赤道の北で、本初子午線の西。15に負の符号がないので、南緯でも北半球と考える。',
  'イ':'赤道の南で、本初子午線の東。西経の「西」は、経度を東向きに読むための印と考える。'
 },
 'review-sci-echo-03':{
  'イ':'雷の音だけが往復し、壁で反射して戻る音は片道。音の種類で経路を決め、雷の場合だけ2で割る。',
  'ア':'どちらも音なので、どの経路を進んだかは考えない。速さ×時間を計算し、どちらも必ず2で割る。'
 }
};
const edits=[],idMap=new Map(),questions=old.questions.map(original=>{
 const q=copy(original),id=q.id+'-v2',answer=q.answer.accepted[0];
 assert.equal(q.answer.kind,'exact');assert.deepEqual(q.answer.accepted,[answer]);assert.ok(letters.includes(answer));
 const rows=q.prompt.split('\n'),choices=new Map();
 for(const line of rows){const m=/^([アイウ])　(.+)$/.exec(line);if(m){assert.ok(!choices.has(m[1]));choices.set(m[1],m[2]);}}
 assert.deepEqual([...choices.keys()],letters);assert.ok(q.explanation.startsWith(answer));
 const internal=[...q.explanation.slice(1).matchAll(/(?<![ァ-ヴー])([アイウ])(?=[。、とやのはがをにで])/g)].map(m=>m[1]);
 assert.deepEqual(internal,q.id==='review-math-neg-01'?['イ','ウ']:[],'only independently reviewed internal choice references may be remapped');
 if(fixes[q.id])for(const [label,value]of Object.entries(fixes[q.id])){assert.notEqual(label,answer,'correct option wording remains untouched');choices.set(label,value);}
 const order=[...letters].sort((a,b)=>sha('practice-choice-v2:'+id+':'+a).localeCompare(sha('practice-choice-v2:'+id+':'+b)));
 const remap=new Map(order.map((label,i)=>[label,letters[i]]));let next=0;
 q.prompt=rows.map(line=>/^[アイウ]　/.test(line)?letters[next]+'　'+choices.get(order[next++]):line).join('\n');
 q.id=id;q.answer={kind:'exact',accepted:[remap.get(answer)]};q.explanation=remap.get(answer)+q.explanation.slice(1).replace(/(?<![ァ-ヴー])([アイウ])(?=[。、とやのはがをにで])/g,(_,label)=>remap.get(label));
 idMap.set(original.id,id);edits.push({previousId:original.id,currentId:id,oldAnswer:answer,newAnswer:q.answer.accepted[0],optionOrder:order,balancedDistractors:!!fixes[original.id]});
 return q;
});
const patterns=copy(old.patterns).map(pattern=>({...pattern,practiceIds:pattern.practiceIds.map(id=>idMap.get(id))}));
patterns.push(...copy(incoming.patterns));questions.push(...copy(incoming.questions));
// Preserve the delivery verbatim; clarify only the derived candidate.
const contentEdits=[];
for(const id of ['review-math-notation-01','review-math-notation-03']){
 const q=questions.find(q=>q.id===id),before=q.prompt;
 assert.equal(before.split('を、×を使わない式に直す。').length,2);
 q.prompt=before.replace('を、×を使わない式に直す。','を、文字式の書き方の約束に従い、×を使わない式に直す。');
 contentEdits.push({id,field:'prompt',before,after:q.prompt,reason:'State the conventional-form requirement; equivalent values alone do not decide the answer.'});
}
{
 const q=questions.find(q=>q.id==='review-sci-quake-02'),before=q.prompt;
 const replacements=[
  ['ア　6×2＝12km。P波の速さに初期微動継続時間をかける。','ア　6×2＝12km。P波が進んだ距離を出せばよいので、P波の速さ6に初期微動継続時間2をかける。'],
  ['イ　(6−4)×2＝4km。速さの差に時間をかける。','イ　(6−4)×2＝4km。2秒の間にP波がS波を追い越した距離が震源距離なので、速さの差に時間をかける。']
 ];
 for(const [from,to]of replacements){assert.equal(q.prompt.split(from).length,2);q.prompt=q.prompt.replace(from,to);}
 contentEdits.push({id:q.id,field:'prompt',before,after:q.prompt,reason:'Give both wrong alternatives comparable reasoning length; correct text and conditions unchanged.'});
}
assert.equal(new Set(patterns.map(p=>p.id)).size,16);assert.equal(new Set(questions.map(q=>q.id)).size,48);
const references=copy(old.references);
for(const pattern of incoming.patterns)for(const ref of pattern.sources){
 const unit=bank.units.find(u=>u.id===ref.unitId);assert.ok(unit,'actual source unit');
 const source=[...unit.questions,...unit.tests].find(q=>q.id===ref.questionId);assert.ok(source,'actual source question');
 const eligible=unit.tests.some(q=>q.id===source.id)||unit.mode==='kentei'&&unit.questions.some(q=>q.id===source.id);
 assert.ok(eligible,'new18 must be reachable from an existing material test');
 references.push({...ref,patternId:pattern.id,reviewEligibleViaCurrentMaterialTest:eligible,sha256:sha(JSON.stringify({id:source.id,prompt:source.prompt,answer:source.answer}))});
}
// This actual test asks exactly the same negative-subtraction skill.
const negativePattern=patterns.find(p=>p.id==='math-negative-subtraction');
const negativeRef={unitId:'drill-math-1-signedcalc',questionId:'drill-math-1-signedcalc-test-14'};
const negativeSource=bank.units.find(u=>u.id===negativeRef.unitId).tests.find(q=>q.id===negativeRef.questionId);
assert.equal(negativeSource.prompt,'次の計算をしよう。\n−15 − (−10)');
assert.deepEqual(negativeSource.answer,{kind:'number',value:'-5'});
negativePattern.sources.push(negativeRef);
references.push({...negativeRef,patternId:negativePattern.id,reviewEligibleViaCurrentMaterialTest:true,sha256:sha(JSON.stringify({id:negativeSource.id,prompt:negativeSource.prompt,answer:negativeSource.answer}))});
for(const q of questions.filter(q=>q.patternId===negativePattern.id))q.appliesToSourceIds.push(negativeSource.id);
const data={version:2,patterns,questions,references,legacyQuestions:copy(old.questions),legacyPatterns:copy(old.patterns)};
assert.equal(new Set([...questions,...data.legacyQuestions].map(q=>q.id)).size,78);
for(const pattern of patterns){assert.ok([...pattern.commentExample].length<=70);assert.equal(pattern.practiceIds.length,3);assert.ok(pattern.practiceIds.every(id=>questions.some(q=>q.id===id&&q.patternId===pattern.id)));}
for(const q of questions){assert.ok(q.appliesToSourceIds.length>0&&q.appliesToSourceIds.every(id=>references.some(r=>r.questionId===id&&r.patternId===q.patternId)));}
await mkdir(new URL('before/',here),{recursive:true});
await writeFile(new URL('before/ai-review-practice-data.mjs',here),bytes);
const libraryBytes=await read('cf-worker/src/ai-review-practice-library.mjs');await writeFile(new URL('before/ai-review-practice-library.mjs',here),libraryBytes);
await writeFile(new URL('data.json',here),JSON.stringify(data,null,2)+'\n');
await writeFile(new URL('ai-review-practice-data.mjs',here),'export default '+JSON.stringify(data)+';\n');
let library=libraryBytes.toString();
library=library.replace('questions=new Map(data.questions.map(q=>[q.id,q]))','questions=new Map([...(data.legacyQuestions||[]),...data.questions].map(q=>[q.id,q]))');
const replaceLibrary=(from,to)=>{assert.equal(library.split(from).length,2);library=library.replace(from,to);};
replaceLibrary('patterns=new Map(data.patterns.map(p=>[p.id,p])),bindings=new Map()', 'patterns=new Map(data.patterns.map(p=>[p.id,p])),legacyPatterns=new Map((data.legacyPatterns||[]).map(p=>[p.id,p])),bindings=new Map()');
replaceLibrary('export async function reviewPracticeOptions(source){','export async function reviewPracticeOptions(source,{legacy=false}={}){');
replaceLibrary('const pattern=patterns.get(ref.patternId);for(const id of pattern.practiceIds)', 'const pattern=(legacy?legacyPatterns:patterns).get(ref.patternId);if(!pattern)continue;for(const id of pattern.practiceIds)');
const previous="async function allowed(source,id){if(typeof id!=='string'||!(await reviewPracticeOptions(source)).some(p=>p.id===id))return null;return questions.get(id)||null;}";
assert.equal(library.split(previous).length,2);
library=library.replace(previous,"async function allowed(source,id){if(typeof id!=='string')return null;const q=questions.get(id),refs=bindings.get(source?.id);if(!q||!refs||!q.appliesToSourceIds.includes(source.id)||!patterns.has(q.patternId))return null;const hash=await digest(source);return hash&&refs.some(ref=>ref.sha256===hash&&ref.patternId===q.patternId)?q:null;}");
library=library.replace("from './material-engine.cjs'","from '../../../../../cf-worker/src/material-engine.cjs'");
await writeFile(new URL('candidate-library.mjs',here),library);
const mainLibrary=library.replace("from '../../../../../cf-worker/src/material-engine.cjs'","from './material-engine.cjs'");
await writeFile(new URL('ai-review-practice-library.mjs',here),mainLibrary);
const testIds=new Set(bank.units.flatMap(u=>[...u.tests,...(u.mode==='kentei'?u.questions:[])].map(q=>q.id)));
const reachable=questions.filter(q=>q.appliesToSourceIds.some(id=>testIds.has(id)));
assert.equal(reachable.length,41);
const report={status:'candidate only; main unchanged',defaultQuestions:48,legacyQuestions:30,patterns:16,newQuestions:18,revisedQuestions:30,reachableDefaultQuestions:reachable.length,unreachableDefaultIds:questions.filter(q=>!reachable.includes(q)).map(q=>q.id),references:references.length,edits,contentEdits,addedBinding:negativeRef,
 inputs:[{file:mainPath,sha256:sha(bytes)},{file:'cf-worker/src/ai-review-practice-library.mjs',sha256:sha(libraryBytes)},{file:'Claude作業/20261026_ProAI類題/practice-bank.json',sha256:sha(incomingBytes)},{file:'site-assets/material-bank.json',sha256:sha(await read('site-assets/material-bank.json'))}],
 scope:'Append18, presentation-only revision30 under new IDs, exact original30 retained for old parent reviews/IndexedDB pending answers/immutable server receipts. No route/UI/schema/provider/normal-grade change.'};
await writeFile(new URL('candidate.json',here),JSON.stringify(report,null,2)+'\n');
console.log('Practice expansion candidate prepared:48 default +30 legacy; main unchanged.');
