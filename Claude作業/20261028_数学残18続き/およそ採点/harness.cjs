// 「およそ」採点の候補を、エンジンの写しだけで試す（Claude 2026-10-28）。本体・実ユーザーの記録は使わない。
const fs=require('fs');const path=require('path');
const orig=require('./material-engine.original.js'),cand=require('./material-engine.candidate.js');
const bank=JSON.parse(fs.readFileSync('/Users/shimizunaotomoo/Desktop/my-app/site-assets/material-bank.json','utf8'));
const mine=['prob'].map(k=>JSON.parse(fs.readFileSync(path.join(__dirname,'..','原稿','tokkun-math-1-'+k+'.json'),'utf8')));
let n=0,bad=[];const ok=(c,m)=>{n++;if(!c)bad.push(m);};
// 1) 再現：いまのエンジンでは「およそ」つきが×
const p1=mine[0].questions.find(q=>q.id==='tokkun-math-1-prob-1');
ok(orig.grade(p1,'およそ1140回').correct===false,'再現できない（もとから○）');
ok(orig.grade(p1,'1140回').correct===true,'もとの正解が×');
// 2) 印のある問題だけ読みとばす
const A={...p1,answer:{...p1.answer,approx:true}};
for(const s of ['およそ1140回','およそ 1140 回','約1140回','約 1140','やく1140回','1140','1140回','およそ１１４０回','およそ1,140回'])ok(cand.grade(A,s).correct===true,'○にならない: '+s);
for(const s of ['およそ1100回','およそ1141回','1140回くらい','およそおよそ1140回','およそ1140人','およそ','約','およそ-1140回','1140およそ','およそx=1140','だいたい1140回','およそ1140回と1200回','わからない','およそわからない'])ok(cand.grade(A,s).correct===false,'○になってしまう: '+s);
// 3) 印のない問題は、いままでと1文字も同じ判定
const all=[...bank.units.flatMap(u=>u.questions||[]),...mine.flatMap(u=>u.questions)];
const inputs=q=>{const v=String(q.answer.value??(q.answer.accepted||[''])[0]);return ['およそ'+v,'約'+v,v,'およそ',v+'くらい'];};
let same=0;for(const q of all){for(const s of inputs(q)){const x=JSON.stringify(orig.grade(q,s)),y=JSON.stringify(cand.grade(q,s));n++;if(x!==y)bad.push('印のない問題で判定が変わった '+q.id+' '+s);else same++;}}
// 4) 候補の印をつけても validateUnit が通るか
const u={...mine[0],questions:mine[0].questions.map(q=>q.prompt.includes('およそ')&&q.answer.kind==='number'?{...q,answer:{...q.answer,approx:true}}:q)};
const vErr=(cand.validateUnit(u)||[]).filter(e=>e!=='unreviewed question');ok(true,'');
// 5) 「およそ何…」とたずねる number 問題の数（印をつける候補）
const approxQs=all.filter(q=>q.answer&&q.answer.kind==='number'&&/およそ|約(?![分数束])/.test(q.prompt));
fs.writeFileSync(path.join(__dirname,'result.json'),JSON.stringify({checks:n,mismatch:bad.length,bad,unchangedWithoutFlag:same,validateUnitWithFlag:vErr,approxCandidates:{count:approxQs.length,ids:approxQs.map(q=>q.id)}},null,1)+'\n');
console.log(`検査 ${n} / 期待とちがう ${bad.length} / 印のない問題で同じ判定 ${same} / 印の候補 ${approxQs.length} 問 / validateUnit ${JSON.stringify(vErr).slice(0,200)}`);bad.slice(0,20).forEach(b=>console.log(' ',b));process.exit(bad.length?1:0);
