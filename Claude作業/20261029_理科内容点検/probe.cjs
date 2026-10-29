// 本物のエンジンの写しで、正答・単位つき・近い誤答を試す（原本は読むだけ）
const fs=require('fs'),path=require('path');
const eng=require(process.argv[2]||'./engine/material-engine.js');
const dir=process.argv[3]||'原本写し';
const units=fs.readdirSync(dir).filter(f=>/^tokkun-science-1-.*\.json$/.test(f)).sort();
const out=[];let n=0,bad=0;
const L=['ア','イ','ウ','エ','オ','カ'];
function t(q,inp,exp,why){n++;const r=eng.grade(q,inp);const ok=!!r.correct;if(ok!==exp){bad++;out.push({id:q.id,input:inp,expected:exp,got:ok,why,msg:r.message||r.feedback});}}
for(const f of units){const u=JSON.parse(fs.readFileSync(path.join(dir,f)));
 for(const q of u.questions){const a=q.answer;
  if(a.kind==='number'){const v=a.value;t(q,v,true,'正答');for(const un of (a.units||[]))t(q,v+un,true,'単位つき');
   const x=Number(v);t(q,String(-x),x===0,'逆符号');if(x!==0)t(q,String(x*10),false,'10倍');t(q,String(x+1),false,'+1');
   t(q,v+((a.units||[]).includes('kg')?'m':'kg'),false,'ちがう単位');}
  else if(a.kind==='exact'){for(const v of a.accepted)t(q,v,true,'正答');
   const letters=(q.prompt.match(/[ア-カ](?=\s)/g)||[]);const isChoice=a.accepted.every(v=>/^[ア-カ]$/.test(v));
   if(isChoice){for(const l of new Set(letters))if(!a.accepted.includes(l))t(q,l,false,'ほかの記号');}
   // 単位つきの数（exactで数を持つもの）
   if(a.accepted.some(v=>/^\d+(\.\d+)?$/.test(v)))out.push({id:q.id,note:'数の答えがexact（numberでない）',accepted:a.accepted});}
  else if(a.kind==='set'){const items=a.items.map(x=>x[0]);if(items.every(x=>x.length===1))t(q,items.join(''),true,'正答つなげ');t(q,items.join('、'),true,'正答読点');t(q,[...items].reverse().join('、'),true,'逆順');
   if(items.length>1)t(q,items.slice(0,-1).join('、'),false,'1つ足りない');
   const letters=[...new Set(q.prompt.match(/[ア-カ](?=\s)/g)||[])];const extra=letters.find(l=>!items.includes(l));if(extra)t(q,[...items,extra].join('、'),false,'1つ多い');}
 }}
const res={engine:process.argv[2]||'./engine/material-engine.js',data:dir,tried:n,mismatch:bad,items:out};
fs.writeFileSync(process.argv[4]||'検証/probe-result.json',JSON.stringify(res,null,1));
console.log('試した入力',n,'期待とちがう',bad,'注記',out.length-bad);process.exit(0);
