const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {update}=require('./original-drill-tests.cjs');
const root=path.resolve(__dirname,'../../..'),source=fs.readFileSync(path.join(root,'教材整理/実装/material-engine.js'),'utf8');
const old=require('../../../教材整理/実装/material-engine.js'),sandbox={module:{exports:{}}};vm.runInNewContext(update(source),sandbox);const engine=sandbox.module.exports;
const ledger=JSON.parse(fs.readFileSync(path.join(root,'教材整理/教材照合台帳.json'),'utf8'));
const sources=ledger.map(s=>s.id==='source-0074'?{...s,pages:[46,47],grade:1,verified:true}:s);
const u=JSON.parse(fs.readFileSync(path.join(root,'教材整理/特訓下書き/drill-japanese-1-shiji.json'),'utf8'));
u.status='ready';for(const q of [...u.questions,...u.tests]){q.source.id='source-0074';delete q.source.proposal;delete q.source.ledgerId;}
let n=0;const eq=(a,b)=>{assert.equal(JSON.stringify(a),JSON.stringify(b));n++;};
eq(engine.validateUnit(u,{sources}).includes('test must be adapted'),true);
u.testPolicy='reviewed-original';eq(engine.validateUnit(u,{sources}),[]);
for(const q of [...u.questions,...u.tests]){eq(q.origin,'original');for(const input of q.answer.accepted)eq(engine.grade(q,input).correct,true);eq(engine.grade(q,'まちがいの答えZZ').correct,false);}
const bank=JSON.parse(fs.readFileSync(path.join(root,'site-assets/material-bank.json'),'utf8'));
for(const unit of bank.units)eq(engine.validateUnit(unit,{sources:bank.sources}),old.validateUnit(unit,{sources:bank.sources}));
eq(engine.validateUnit({...u,mode:'workbook'},{sources}).includes('test policy'),true);
eq(engine.validateUnit({...u,testPolicy:true},{sources}).includes('test policy'),true);
eq(engine.validateUnit(u,{sources:ledger}).includes('source registry mismatch'),true);
const changed=JSON.parse(JSON.stringify(u));changed.tests[0].reviewed=false;eq(engine.validateUnit(changed,{sources}).includes('unreviewed question'),true);
changed.tests[0].reviewed=true;changed.tests[0].prompt=changed.questions[0].prompt;eq(engine.validateUnit(changed,{sources}).some(e=>e.includes('duplicate')),true);
console.log(`Original drill test policy candidate: ${n} checks passed; all 115 original questions, explicit drill-only opt-in, real source/grade verification, review/duplicate guards and unchanged current banks; no source-origin relabeling or file writes`);
