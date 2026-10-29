// 約分の採点の候補を、今の問題バンク全体で確かめる（バンクは読むだけ）
const E=require('./material-engine.candidate.js'),OLD=require('./material-engine.before.js'),b=require('../../../../site-assets/material-bank.json');
let n=0,f=0,changed=0;const ok=(c,m)=>{n++;if(!c){f++;if(f<10)console.log('❌',m);}};
for(const u of b.units)for(const q of [...u.questions,...(u.tests||[])]){
 const a=q.answer;
 if(a.kind==='number'){ok(E.grade(q,a.value).correct===OLD.grade(q,a.value).correct,q.id+' model answer unchanged');
  if(a.value.includes('/')){const [x,y]=a.value.split('/').map(Number);if(Number.isInteger(x)&&Number.isInteger(y)){const r=E.grade(q,(x*3)+'/'+(y*3));ok(!r.correct&&/約分/.test(r.reason),q.id+' unreduced is not correct');changed++;}}
  else if(/^-?\d+$/.test(a.value)){ok(!E.grade(q,(Number(a.value)*2)+'/2').correct||Number(a.value)===0,q.id+' integer written as 2n/2 is asked to reduce');}}
 else ok(JSON.stringify(E.grade(q,'わからない'))===JSON.stringify(OLD.grade(q,'わからない')),q.id+' other kinds unchanged');}
console.log('チェック '+n+'件　✅ '+(n-f)+'　❌ '+f+'（分数の答え '+changed+'問で約分前が×に）');process.exit(f?1:0);
