// 特訓の下書き（数学以外）を、本物の採点エンジンで点検する（Claude・2026-10-13）。配信用の本データには触らない。
// 使い方：node check_tokkun_draft.cjs tokkun-science-1-mitsudo.json [...]
// 1) validateUnit（厳しい検査・台帳つき） 2) すべての正解を入れて「正解」になる 3) 答えを壊すと「不正解」になる
// 4) 出典が台帳の原本と一致（SHA-256・verified・ページ） 5) 問題文の重複なし
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const ROOT=path.resolve(__dirname,'../..'),M=ROOT+'/教材整理/';
const engine=require(M+'実装/material-engine.js');
const ledger=JSON.parse(fs.readFileSync(M+'教材照合台帳.json','utf8'));const byId=new Map(ledger.map(s=>[s.id,s]));
let fail=0;
function correctInputs(a,q){
 if(a.kind==='number')return [a.value];
 if(a.kind==='exact')return a.accepted;
 if(a.kind==='set')return [a.items.map(x=>x[0]).join('、'),a.items.map(x=>x[0]).reverse().join('、')];
 if(a.kind==='rubric'&&(a.minChars||a.maxChars)){const ex=[...String(q&&q.explanation||'').matchAll(/「([^」]+)」のように/g)].map(m=>m[1]);if(!ex.length)return ['（字数つきの記述には解説に「…」のように の模範解答が必要）'];return ex;}   // 字数つきは解説の模範解答で確かめる（言葉を並べただけの答えは×が正しい）
 if(a.kind==='rubric')return [a.criteria.map(c=>c.any[0]).join('を')];
 return [];
}
function brokenInput(a){
 if(a.kind==='number')return String(Number(a.value)+1);
 if(a.kind==='exact')return 'まちがい'+a.accepted[0]+'ではない別の答えZZ';
 if(a.kind==='set')return a.items.slice(0,Math.max(1,a.items.length-1)).map(x=>x[0]).join('、')+(a.items.length===1?'と別のものQQ':'');
 if(a.kind==='rubric')return 'わかりません';
 return 'x';
}
for(const f of process.argv.slice(2)){
 const u=JSON.parse(fs.readFileSync(path.resolve(f),'utf8'));let bad=[];
 const errs=engine.validateUnit(u,{sources:ledger});if(errs.length)bad.push('validate: '+errs.slice(0,5).join(' / '));
 const prompts=new Set();
 for(const q of u.questions){
  if(prompts.has(q.prompt))bad.push(q.id+' prompt duplicated');prompts.add(q.prompt);
  for(const inp of correctInputs(q.answer,q)){const r=engine.grade(q,inp);if(!r.correct)bad.push(q.id+' correct input judged wrong: '+inp+' → '+(r.reason||''));}
  const b=brokenInput(q.answer),rb=engine.grade(q,b);if(rb.correct)bad.push(q.id+' broken input judged correct: '+b);
  const s=byId.get(q.source.id);
  if(!s||s.sha256!==q.source.sha256||s.file!==q.source.file||!s.verified||!(s.pages||[]).includes(q.source.page))bad.push(q.id+' source mismatch');
  else if(crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,s.file))).digest('hex')!==s.sha256)bad.push(q.id+' source file hash');
 }
 console.log(path.basename(f),'問題',u.questions.length,bad.length?'❌ '+bad.length:'✅ 問題なし');for(const x of bad.slice(0,20))console.log('   ',x);
 if(bad.length)fail++;
}
process.exit(fail?1:0);
