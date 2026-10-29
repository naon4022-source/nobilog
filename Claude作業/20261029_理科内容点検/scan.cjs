// 機械点検：①記述（rubric）の模範解答（解説）が○になるか ②図表を参照するのに画像がない問題 ③validateUnit（台帳つき）
const fs=require('fs'),path=require('path');const eng=require('./engine/material-engine.js');
const dir=process.argv[3]||'原本写し';const reg=JSON.parse(fs.readFileSync(process.argv[2]));
const registry=Array.isArray(reg)?reg:(reg.sources||reg.items||reg);
const R={rubricModel:[],figRef:[],validate:{}};
for(const f of fs.readdirSync(dir).filter(f=>f.endsWith('.json')).sort()){const u=JSON.parse(fs.readFileSync(path.join(dir,f)));
 let v;try{v=eng.validateUnit(u,{sources:registry});}catch(e){v={error:String(e)}}
 R.validate[u.id]=v;
 for(const q of u.questions){
  if(q.answer.kind==='rubric'){const ex=q.explanation.replace(/^答え[:：]?/,'');const r=eng.grade(q,ex);if(!r.correct)R.rubricModel.push({id:q.id,input:ex,msg:r.message||r.feedback,ratio:r.score});}
  if(/(図|表)\s*\d+|下の(図|表)|右の(図|表)|この(図|表)|グラフ/.test(q.prompt)&&!q.image)R.figRef.push({id:q.id,ref:(q.prompt.match(/(図|表)\s*\d+|下の(図|表)|右の(図|表)|この(図|表)|グラフ/)||[])[0]});
 }}
fs.writeFileSync(process.argv[4]||'検証/scan-原本.json',JSON.stringify(R,null,1));
console.log('rubric模範×',R.rubricModel.length,'図参照で画像なし',R.figRef.length);
for(const [k,v] of Object.entries(R.validate))console.log(k,JSON.stringify(v).slice(0,200));
