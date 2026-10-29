// 記述問題（rubric）の自然な正答・逆の誤答を、本物のエンジンの写しで採点する
const fs=require('fs'),path=require('path');
const eng=require(path.resolve(process.argv[2]));const dir=process.argv[3];const out=process.argv[4];
const fx=JSON.parse(fs.readFileSync(path.join(__dirname,'heldout.json')));
const Q={};for(const f of fs.readdirSync(dir).filter(f=>f.endsWith('.json'))){for(const q of JSON.parse(fs.readFileSync(path.join(dir,f))).questions)Q[q.id.replace('tokkun-science-1-','')]=q;}
let n=0,bad=0;const res=[];
for(const [id,{ok,ng}] of Object.entries(fx)){const q=Q[id];if(!q)throw new Error('no '+id);
 const model=q.explanation;
 for(const [inp,exp,kind] of [[model,true,'模範（解説）'],...ok.map(x=>[x,true,'自然な正答']),...ng.map(x=>[x,false,'誤答'])]){n++;const r=eng.grade(q,inp);if(!!r.correct!==exp){bad++;res.push({id,kind,input:inp,expected:exp,got:!!r.correct,reason:r.reason});}}}
fs.writeFileSync(out,JSON.stringify({engine:process.argv[2],data:dir,tried:n,mismatch:bad,items:res},null,1));
console.log('試した入力',n,'期待とちがう',bad);
