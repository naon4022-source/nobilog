// 検定原稿の専用チェック（Claude・2026-10-13）：正答がすべて正解・崩した答えが不正解・出典ファイルのSHA一致・重複なし
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const ROOT=path.resolve(__dirname,'../../..');
const engine=require(path.join(ROOT,'教材整理/実装/material-engine.js'));
function corrects(a){
  if(a.kind==='number')return [a.value].concat((a.units||[]).map(u=>a.value+u));
  if(a.kind==='exact')return a.accepted;
  if(a.kind==='set')return [a.items.map(x=>x[0]).join('、')];
  if(a.kind==='numbers')return [a.values.join('、')];
  if(a.kind==='expr'||a.kind==='relation')return [a.value];
  return [];
}
function broken(a){
  if(a.kind==='number')return String(Number(a.value)+1);
  if(a.kind==='exact')return a.accepted[0]+'あ';
  if(a.kind==='set')return a.items.slice(0,-1).map(x=>x[0]).join('、')||'なし';
  if(a.kind==='numbers')return a.values.map(v=>String(Number(v)+1)).join('、');
  if(a.kind==='expr')return a.value+'+1';
  if(a.kind==='relation')return a.value+'+1';
}
let bad=0;
for(const f of process.argv.slice(2)){
  const u=JSON.parse(fs.readFileSync(f,'utf8'));const errs=[];const seen=new Set();
  for(const q of u.questions){
    if(seen.has(q.prompt))errs.push('dup '+q.id);seen.add(q.prompt);
    for(const c of corrects(q.answer)){const r=engine.grade(q,c);if(!r.correct)errs.push(q.id+' correct judged wrong: '+c+' / '+(r.reason||''));}
    const b=broken(q.answer),rb=engine.grade(q,b);if(rb.correct)errs.push(q.id+' broken judged correct: '+b);
    const h=crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,q.source.file))).digest('hex');
    if(h!==q.source.sha256)errs.push(q.id+' sha mismatch');
    if(!q.explanation)errs.push(q.id+' no explanation');
  }
  bad+=errs.length;console.log(path.basename(f),'問題',u.questions.length,errs.length?'❌ '+errs.length:'✅ 問題なし');errs.slice(0,8).forEach(e=>console.log('   ',e));
}
process.exit(bad?1:0);
