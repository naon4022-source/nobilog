// 「何cm」など単位を問う数の問題で、その単位をつけた答えが×になるものを、本物のエンジンの写しで調べる（読むだけ）
const fs=require('fs'),path=require('path');const eng=require('../engine/material-engine.js');
const dir=process.argv[2];const out=[];let n=0;
const U=['cm³','cm3','cm²','cm2','km/h','km','cm','mm','kg','g','m','mL','L','N','秒','分','時間','℃','度','円','個','人','回','倍','%','本','枚','日','年','ページ','通り','目盛り','Hz'];
for(const f of fs.readdirSync(dir).filter(f=>f.endsWith('.json')).sort()){let u;try{u=JSON.parse(fs.readFileSync(path.join(dir,f)))}catch(e){continue}
 if(!Array.isArray(u.questions))continue;
 for(const q of u.questions){const a=q.answer||{};if(a.kind!=='number')continue;
  const m=q.prompt.match(/何\s*(g\/cm³|g\/cm3|km\/s|m\/s|km\/h|cm³|cm3|cm²|cm2|km\/h|km|cm|mm|kg|g|m|mL|L|N|秒|分|時間|℃|度|円|個|人|回|倍|%|本|枚|日|年|ページ|通り|目盛り|Hz)(?![\/a-zA-Z³²])/);
  if(!m)continue;n++;const inp=a.value+m[1];const r=eng.grade(q,inp);if(!r.correct)out.push({id:q.id,input:inp,units:a.units||null});}}
fs.writeFileSync('units_all.json',JSON.stringify(out,null,1));console.log('単位を問う数の問題',n,'単位つきで×',out.length);
