// Review the complete, explicitly enumerated 133-answer delta. No user stores.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),H=new URL('./',import.meta.url),R=new URL('../../../',H);
const read=p=>readFileSync(new URL(p,H),'utf8'),json=p=>JSON.parse(read(p));
const sha=s=>createHash('sha256').update(s).digest('hex');
const m=json('review-manifest.json'),ledger=json('reviewed-answer-deltas.json');
const beforeRaw=readFileSync(new URL(m.beforeBank,R),'utf8');assert.equal(sha(beforeRaw),m.beforeBankSha256);
assert.equal(sha(read('reviewed-answer-deltas.json')),m.deltasSha256);
assert.equal(ledger.changes.length,133);assert.deepEqual(ledger.unclassified,[]);
const before=JSON.parse(beforeRaw),engine=require('../../../site-assets/material-engine.js'),server=require('../../../cf-worker/src/material-engine.cjs');
const oldEngine=read('engine-before.js'),newEngine=readFileSync(new URL('教材整理/実装/material-engine.js',R),'utf8');
assert.equal(sha(oldEngine),m.engineBeforeSha256);assert.equal(sha(newEngine),m.engineAfterSha256);
const oldToken="s.replace(/[、,，・\\s]+/g,'')",newToken="s.replace(/[、,，・\\s→]+/g,'')";
assert.equal(oldEngine.split(oldToken).length,2);assert.equal(oldEngine.replace(oldToken,newToken),newEngine);
for(const path of ['site-assets/material-engine.js','cf-worker/src/material-engine.cjs'])assert.equal(readFileSync(new URL(path,R),'utf8'),newEngine);
let checks=0;const counts={};
const grade=(q,input,expected)=>{for(const e of [engine,server]){assert.equal(e.grade(q,input).correct,expected,q.id+' '+input);checks++;}};
function applyReviewedDelta(bank){
 const result=structuredClone(bank);
 for(const row of ledger.changes){
  const u=result.units.find(x=>x.id===row.unitId),q=u?.[row.mode]?.find(x=>x.id===row.questionId);
  assert.ok(q);assert.deepEqual(q.answer,row.before);
  q.answer=structuredClone(row.after);
 }
 const social=JSON.parse(readFileSync(new URL('tools/candidates/social-geo-nihon-review-20261021/rubric-candidate.json',R),'utf8'));
 const index=result.units.findIndex(u=>u.id===social.id);assert.ok(index>=0);result.units[index]=social;
 return result;
}
for(const row of ledger.changes){
 counts[row.category]=(counts[row.category]||0)+1;
 const q=before.units.find(u=>u.id===row.unitId)[row.mode].find(x=>x.id===row.questionId);
 const current={...q,answer:row.after},x=row.before,y=row.after;
 switch(row.category){
  case 'explicit_prompt_unit':{
   assert.equal(x.kind,'number');assert.deepEqual({...x,units:y.units},y);
   const added=y.units.filter(u=>!x.units?.includes(u));assert.ok(added.length>=1);
   assert.ok((x.units||[]).every(s=>y.units.includes(s)));
   if(added.length>1)assert.deepEqual(added,['回転','回']);
   grade(current,String(x.value),true);
   for(const suffix of y.units){
    if(added.includes(suffix))assert.ok(q.prompt.includes('何'+suffix));
    grade(current,String(x.value)+suffix,true);
    const wrong=Number(x.value)===0?'1':'0';grade(current,wrong+suffix,false);
   }
   break;
  }
  case 'unordered_symbols':{
   assert.equal(x.kind,'exact');assert.equal(y.kind,'set');assert.equal(y.letters,true);
   assert.match(q.prompt,/二つ|2つ|すべて/);assert.doesNotMatch(q.prompt,/順番|順序/);
   assert.deepEqual(y.items.map(a=>a[0]),x.accepted[0].match(/[ア-ン]/g));
   assert.ok(y.items.every(a=>a.length===1&&/^[ア-ン]$/.test(a[0])));
   for(const s of x.accepted)grade(current,s,true);
   const symbols=y.items.map(a=>a[0]);
   grade(current,[...symbols].reverse().join('→'),true);
   grade(current,symbols.slice(1).join(''),false);
   grade(current,symbols.join('')+'ン',false);
   grade(current,symbols.join('')+symbols[0],false);
   break;
  }
  case 'symbol_tokenization':{
   assert.equal(x.kind,'set');assert.deepEqual({...x,letters:true},y);
   assert.ok(x.items.every(a=>a.every(s=>/^[ア-ン]$/.test(s))));
   const symbols=y.items.map(a=>a[0]);
   for(const sep of ['','、',',','→'])grade(current,[...symbols].reverse().join(sep),true);
   grade(current,symbols.slice(1).join(''),false);grade(current,symbols.join('')+'ン',false);
   break;
  }
  case 'additional_equivalent_forms':{
   assert.equal(x.kind,'exact');assert.equal(y.kind,'exact');
   assert.deepEqual({...x,accepted:y.accepted},y);
   assert.ok(x.accepted.every(s=>y.accepted.includes(s)));
   const added=y.accepted.filter(s=>!x.accepted.includes(s));assert.ok(added.length);
   for(const s of added){
    const contracted=s.replace(/did not/g,"didn't").replace(/are not/g,"aren't");
    if(s.endsWith('度'))assert.ok(x.accepted.includes(s.slice(0,-1)));
    else assert.ok(x.accepted.includes(contracted),'equivalent English contraction '+q.id);
   }
   for(const s of y.accepted)grade(current,s,true);
   grade(current,'わからない',false);
   if(added[0].endsWith('度'))grade(current,'999度',false);
   else grade(current,'Yes, they did.',false);
   break;
  }
  default:assert.fail('unreviewed category');
 }
}
assert.deepEqual(counts,m.categories);
const expected=applyReviewedDelta(before),currentRaw=readFileSync(new URL('site-assets/material-bank.json',R),'utf8'),actual=JSON.parse(currentRaw);
assert.equal(sha(currentRaw),m.afterBankSha256);assert.deepEqual(actual,expected,'every other field/source/number/question exact');checks++;
const worker=readFileSync(new URL('cf-worker/src/material-bank.mjs',R),'utf8').replace(/^export default\s*/,'').replace(/;\s*$/,'');assert.deepEqual(JSON.parse(worker),actual);checks++;
// The expectation remains exact: unrelated future changes still fail.
for(const mutate of [b=>b.units[0].questions[0].prompt+='x',b=>b.units[0].questions[0].answer={kind:'number',value:'999'},b=>b.units[0].questions.pop(),b=>b.units[0].id+='x',b=>b.sources.pop()]){
 const changed=structuredClone(actual);mutate(changed);assert.throws(()=>assert.deepEqual(changed,expected));checks++;
}
writeFileSync(new URL('review-verification.json',H),JSON.stringify({status:'passed',checks,questionCount:133,categories:counts,manifestSha256:sha(read('review-manifest.json')),deltasSha256:m.deltasSha256,beforeBankSha256:m.beforeBankSha256,afterBankSha256:m.afterBankSha256,engineSha256:m.engineAfterSha256,authoredTextNumbersUnchanged:true,otherFieldsAndSourcesExact:true,realUserData:false,network:false,published:false},null,2)+'\n');
console.log(`Reviewed answer forms: ${checks} checks passed; 133 explicit answer-only changes, exact reconstruction plus original three social guards, other fields unchanged.`);
