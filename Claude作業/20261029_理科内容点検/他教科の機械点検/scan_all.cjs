// 確認済みの全単元（理科特訓をのぞく）を読むだけで調べる：
// ①rubric の解説（模範）が×になる ②number の正答・単位つきが×になる ③exact に数だけの答え（単位つきが×）
const fs=require('fs'),path=require('path');const eng=require('../engine/material-engine.js');
const dir=process.argv[2];const out={rubricModel:[],numberFail:[],exactNumeric:[],units:0,questions:0};
for(const f of fs.readdirSync(dir).filter(f=>f.endsWith('.json')&&!f.startsWith('tokkun-science')).sort()){
 let u;try{u=JSON.parse(fs.readFileSync(path.join(dir,f)));}catch(e){continue}
 if(!Array.isArray(u.questions))continue;out.units++;
 for(const q of u.questions){out.questions++;const a=q.answer||{};
  if(a.kind==='rubric'&&q.explanation){const r=eng.grade(q,q.explanation);if(!r.correct)out.rubricModel.push({id:q.id,reason:r.reason,ex:q.explanation.slice(0,60)});}
  if(a.kind==='number'){for(const v of [a.value,...(a.units||[]).map(x=>a.value+x)]){const r=eng.grade(q,v);if(!r.correct)out.numberFail.push({id:q.id,input:v});}}
  if(a.kind==='exact'&&(a.accepted||[]).some(v=>/^-?\d+(\.\d+)?$/.test(v))&&/何\s*(cm|m|g|kg|N|秒|分|℃|度|円|個|人|回|倍|%|km)/.test(q.prompt))out.exactNumeric.push({id:q.id,accepted:a.accepted});
 }}
fs.writeFileSync('scan_all.json',JSON.stringify(out,null,1));
console.log('単元',out.units,'問題',out.questions,'模範×',out.rubricModel.length,'数の正答×',out.numberFail.length,'数をexactで採点',out.exactNumeric.length);
