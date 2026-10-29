// 単位つきで答えるのが自然なのに、答えに単位が登録されていない問題をさがし、本物の採点エンジン（読むだけ）で「答え＋単位」が×になるかを調べる（Claude 2026-10-29）
const fs=require('fs'),path=require('path');const e=require('/Users/shimizunaotomoo/Desktop/my-app/教材整理/実装/material-engine.js');
const dirs=[path.join(__dirname,'../../20261029_立体残7/原稿'),path.join(__dirname,'../原稿')];
const seen=new Set();const hits=[];
const unitOf=p=>{const m=p.match(/（(cm³|cm²|cm|m²|m³|m|度|°|個|人|本|通り|倍|分|秒|kg|g)）/)||p.match(/答えよう（(cm³|cm²|cm)）/);return m?m[1]:null;};
for(const d of dirs){for(const f of fs.readdirSync(d).filter(f=>/^tokkun-math-1-.*\.json$/.test(f))){
 const u=JSON.parse(fs.readFileSync(path.join(d,f),'utf8'));
 for(const q of u.questions){if(seen.has(q.id))continue;seen.add(q.id);const a=q.answer;
  if((a.kind==='expr'||a.kind==='number')&&!a.units){const un=unitOf(q.prompt);if(!un)continue;
   const inp=a.value+' '+un;const r=e.grade(q,inp);const r0=e.grade(q,a.value);
   hits.push({id:q.id,file:path.relative(path.join(__dirname,'..','..'),path.join(d,f)),kind:a.kind,value:a.value,unit:un,plain:r0.correct,withUnit:r.correct,reason:r.reason||''});}}}}
fs.writeFileSync(path.join(__dirname,'scan-result.json'),JSON.stringify(hits,null,1)+'\n');
const x=hits.filter(h=>!h.withUnit);console.log('単位なしの答えで、問題文に単位がある問題',hits.length,'／ 答え＋単位が×',x.length);
for(const h of x)console.log(' ',h.id,h.value,'＋',h.unit,'→×');
