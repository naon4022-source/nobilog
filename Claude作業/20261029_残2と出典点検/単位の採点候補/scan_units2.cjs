// 第2版（Claude 2026-10-29）：第1版は問題文の「答えよう（cm²）」の形だけで探したため、「何 cm² ふえるか、π を使って答えよう」などの5問を見のがした（自己点検で発見）。
// 解説の最後の「答え 32π cm²」のように、答えの値のあとに単位が書かれている問題も対象にする。単位は解説が書いているものを使う。
const fs=require('fs'),path=require('path');const e=require('/Users/shimizunaotomoo/Desktop/my-app/教材整理/実装/material-engine.js');
const dirs=[path.join(__dirname,'../../20261029_立体残7/原稿'),path.join(__dirname,'../原稿')];const seen=new Set();const hits=[];
const U='cm³|cm²|cm|m²|m³|m';
for(const d of dirs)for(const f of fs.readdirSync(d).filter(f=>/^tokkun-math-1-.*\.json$/.test(f))){
 const u=JSON.parse(fs.readFileSync(path.join(d,f),'utf8'));
 for(const q of u.questions){if(seen.has(q.id))continue;seen.add(q.id);const a=q.answer;
  if(a.kind!=='expr'||a.units)continue;
  const esc=a.value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const m1=q.prompt.match(new RegExp('(?:答えよう|求めよう|表そう)（('+U+')）'));
  const m2=q.explanation.match(new RegExp('答え\\s*'+esc+'\\s*('+U+')\\s*$'));
  const un=(m2&&m2[1])||(m1&&m1[1]);if(!un)continue;
  const r=e.grade(q,a.value+' '+un);
  hits.push({id:q.id,file:path.relative(path.join(__dirname,'..','..'),path.join(d,f)),kind:a.kind,value:a.value,unit:un,by:m2?(m1?'問題文と解説':'解説'):'問題文',plain:e.grade(q,a.value).correct,withUnit:r.correct});}}
fs.writeFileSync(path.join(__dirname,'scan-result.json'),JSON.stringify(hits,null,1)+'\n');
const x=hits.filter(h=>!h.withUnit);console.log('対象',hits.length,'／ 答え＋単位が×',x.length,'／ 解説だけで見つかった',hits.filter(h=>h.by==='解説').map(h=>h.id).join(' '));
