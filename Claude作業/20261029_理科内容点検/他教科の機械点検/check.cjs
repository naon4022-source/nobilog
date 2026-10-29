// 候補：単位つきの正答が○、単位なしも○、ちがう値（+1・逆数・逆符号）に単位をつけると×、ほかの単位は×
const fs=require('fs');const eng=require('../engine/material-engine.js');const log=JSON.parse(fs.readFileSync('単位_変更前後.json'));
const Q={};for(const f of fs.readdirSync('候補'))for(const q of JSON.parse(fs.readFileSync('候補/'+f)).questions)Q[q.id]=q;
const O={};for(const f of fs.readdirSync('原本写し'))for(const q of JSON.parse(fs.readFileSync('原本写し/'+f)).questions)O[q.id]=q;
let n=0,bad=0,orig=0;const t=(q,i,e)=>{n++;if(!!eng.grade(q,i).correct!==e){bad++;console.log('×',q.id,i,e);}};
for(const x of log){const q=Q[x.id],v=q.answer.value,u=q.answer.units[q.answer.units.length-1];
 if(!eng.grade(O[x.id],v+u).correct)orig++;
 t(q,v,true);for(const un of q.answer.units)t(q,v+un,true);
 const m=v.match(/^(-?)(\d+)\/(\d+)$/);const wrong=m?[`${m[1]}${m[3]}/${m[2]}`,`${m[1]}${+m[2]+1}/${m[3]}`]:[String(+v+1)];
 for(const w of wrong)if(w!==v)t(q,w+u,false);t(q,v+'kg',false);}
// 元の問題の採点がほかの入力で変わっていないこと（単位をつけない入力）
for(const id in Q){if(log.some(x=>x.id===id))continue;const a=JSON.stringify(Q[id]),b=JSON.stringify(O[id]);if(a!==b){bad++;console.log('変更外',id);}}
console.log('原本で単位つきが×',orig,'/',log.length,' 候補の検査',n,'期待とちがう',bad);process.exit(bad?1:0);
