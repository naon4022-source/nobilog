// 小学校復習の教材と進め方の確認（合成の本人・メモリの保存だけ）
const E=require('../../../../site-assets/material-engine.js'),M=require('./elementary-review-model.js'),bank=require('./elementary-review-bank.json');
let n=0,f=0;const ok=(c,m)=>{n++;if(!c){f++;console.log('❌',m);}};
ok(bank.units.length===20&&bank.units.every(u=>u.questions.length===50),'20 units × 50 = 1000');
const ids=new Set(bank.units.flatMap(u=>u.questions.map(q=>q.id)));ok(ids.size===1000,'unique ids');
const right=a=>a.kind==='number'?a.value:a.kind==='numbers'?a.values.join('、'):a.kind==='exact'?a.accepted[0]:a.kind==='set'?a.items.map(x=>x[0]).join('、'):a.kind==='rubric'?a.criteria.map(c=>c.any[0]).join('、'):a.value;
let graded=0;for(const u of bank.units)for(const q of u.questions){ok(E.grade(q,right(q.answer)).correct,q.id+' model answer correct');ok(!E.grade(q,'わからない').correct,q.id+' わからない is not correct');ok(!!q.explanation,q.id+' explanation');graded++;}
// 進め方
const mem=new Map();let owner='syn-a';const store={get:u=>mem.get(u),set:(u,v)=>mem.set(u,v),owner:()=>owner};
const unit={questions:[{id:'a'},{id:'b'},{id:'c'}]};
let r=M.load(store,'syn-a');ok(M.next(unit,r).q.id==='a'&&M.next(unit,r).phase==='first','starts with the first question');
M.record(store,'syn-a',unit,'a',false);M.record(store,'syn-a',unit,'b',true);r=M.load(store,'syn-a');
ok(M.next(unit,r).q.id==='c'&&M.next(unit,r).phase==='first','wrong answers wait until every question is answered once');
M.record(store,'syn-a',unit,'c',true);r=M.load(store,'syn-a');ok(M.next(unit,r).q.id==='a'&&M.next(unit,r).phase==='review','after one round, the wrong one comes back');
M.record(store,'syn-a',unit,'a',false);r=M.load(store,'syn-a');ok(r.wrong.a===2&&M.next(unit,r).q.id==='a','wrong again → stays');
M.record(store,'syn-a',unit,'a',true);r=M.load(store,'syn-a');ok(M.next(unit,r).phase==='done'&&M.progress(unit,r).complete,'correct → done');
ok(M.progress(unit,M.load(store,'syn-b')).answered===0,'another person has their own record');
owner='syn-b';ok(M.record(store,'syn-a',unit,'b',false)===null&&!M.load(store,'syn-a').wrong.b,'a late answer from the previous person is not saved after switching');
ok(M.record(store,'syn-b',unit,'zzz',true)===null,'unknown question ignored');
ok(M.progress(unit,M.load(store,'syn-b')).wrong===0,'unanswered is not counted as wrong');
console.log('チェック '+n+'件　✅ '+(n-f)+'　❌ '+f+'（教材'+graded+'問）');process.exit(f?1:0);
