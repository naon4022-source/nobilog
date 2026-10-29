const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {update}=require('./patch-engine.cjs');
const root=path.resolve(__dirname,'../../..'),source=fs.readFileSync(path.join(root,'教材整理/実装/material-engine.js'),'utf8');
const original=require(path.join(root,'教材整理/実装/material-engine.js'));
const next=update(source),sandbox={module:{exports:{}}};vm.runInNewContext(next,sandbox);const patched=sandbox.module.exports;
let n=0;const eq=(a,b)=>{assert.equal(JSON.stringify(a),JSON.stringify(b));n++;};
assert.throws(()=>update(next));n++;
const bank=JSON.parse(fs.readFileSync(path.join(root,'site-assets/material-bank.json'),'utf8'));
for(const unit of bank.units){
 eq(patched.validateUnit(unit,{sources:bank.sources}),original.validateUnit(unit,{sources:bank.sources}));
 for(const q of [...unit.questions,...unit.tests]){
  const a=q.answer,example=a.kind==='rubric'?a.criteria.map(c=>c.any[0]).join('、'):a.kind==='set'?a.items.map(x=>x[0]).join('、'):a.kind==='numbers'?a.values.join(','):a.value??a.accepted?.[0]??'';
  for(const input of [example,'わからない'])eq(patched.grade(q,input),original.grade(q,input));
 }
}
const unit=JSON.parse(fs.readFileSync(path.join(root,'教材整理/特訓下書き/tokkun-japanese-1-kaku.json'),'utf8'));
const q=unit.questions.find(q=>q.id==='tokkun-japanese-1-kaku-22');q.answer.maxChars=40;
const good='近所のお年寄りたちが毎朝水をやって育てているから。',long=good+'あ'.repeat(40);
eq(patched.grade(q,good).correct,true);eq(patched.grade(q,long).correct,false);eq(patched.grade(q,long).reason.includes('字数をこえています'),true);
eq(patched.validateUnit(unit,{sources:bank.sources}),[]);
q.answer.maxChars='40';assert.ok(patched.validateUnit(unit,{sources:bank.sources}).some(x=>x.includes('rubric length')));n++;
console.log(`Patched engine candidate: ${n} checks passed; actual engine in isolated VM, current local bank validation/grade parity, explicit length enforcement and invalid length metadata; no engine/bank writes`);
