// 教科書（台帳登録案）を出典にふくむ特訓の下書きを点検する（Claude・2026-10-14）。配信用の本データ・台帳・採点エンジンには触らない。
// 使い方：node check_tokkun_textbook.cjs tokkun-social-1-geo-nihon.json [...]
// 1) 台帳に登録ずみの出典：check_tokkun_draft.cjs と同じ（SHA-256・verified・ページ）
// 2) 登録案の出典（id:null）：登録案に同じ file・SHA-256・ページがあり、checkLevel が「本文」で、写真の実ファイルの SHA-256 も一致する
//    validateUnit には、その場だけの仮ID（source-9xxxx・mode:textbook）を作って渡す（ファイルには書かない）
// 3) 正解をすべて入れて「正解」、答えを壊すと「不正解」 4) 問題文の重複なし
// 5) 教科書出典があれば status は draft のままであること（ready にしていないこと）
// 6) 否定を許す記述問題（allowNegation）は、逆の意味の書き方（reject）を足すと不正解になること
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const ROOT=path.resolve(__dirname,'../..'),M=ROOT+'/教材整理/';
const engine=require(M+'実装/material-engine.js');
const ledger=JSON.parse(fs.readFileSync(M+'教材照合台帳.json','utf8'));const byId=new Map(ledger.map(s=>[s.id,s]));
const proposals={};
for(const n of ['理科の教科書','地理教科書','歴史きょうかしょ','英語教科書','国語ドリル'])proposals['台帳登録案/'+n+'.json']=JSON.parse(fs.readFileSync(path.join(__dirname,'台帳登録案',n+'.json'),'utf8'));
const hashCache=new Map();const sha=f=>{if(!hashCache.has(f))hashCache.set(f,crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,f))).digest('hex'));return hashCache.get(f);};
let fail=0;
function correctInputs(a){
 if(a.kind==='number')return [a.value];
 if(a.kind==='exact')return a.accepted;
 if(a.kind==='set')return [a.items.map(x=>x[0]).join('、'),a.items.map(x=>x[0]).reverse().join('、')];
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
 const tmpLedger=ledger.slice(),tmpUnit=JSON.parse(JSON.stringify(u));let tmpN=90000,nTb=0;const tmpIds=new Map();
 for(const q of [...tmpUnit.questions,...(tmpUnit.tests||[])]){
  const s=q.source;
  if(s.id!==null)continue;
  nTb++;
  const P=proposals[s.proposal];const e=P&&P.entries.find(x=>x.file===s.file);
  if(!e||e.sha256!==s.sha256||!(e.pages||[]).includes(s.page)||e.checkLevel!=='本文'){bad.push(q.id+' proposal source mismatch');continue;}
  if(sha(e.file)!==e.sha256){bad.push(q.id+' proposal file hash');continue;}
  if(!tmpIds.has(e.file)){const id='source-'+(tmpN++);tmpIds.set(e.file,id);tmpLedger.push({id,file:e.file,sha256:e.sha256,mode:e.mode||'textbook',subject:e.subject||u.subject,grade:(e.grade===undefined?u.grade:e.grade),pages:e.pages,verified:true});}
  s.id=tmpIds.get(e.file);
 }
 const errs=engine.validateUnit(tmpUnit,{sources:tmpLedger});if(errs.length)bad.push('validate: '+errs.slice(0,5).join(' / '));
 if(nTb&&u.status==='ready')bad.push('教科書（登録案）出典があるのに ready になっている');
 const prompts=new Set();
 for(const q of [...u.questions,...(u.tests||[])]){
  if(prompts.has(q.prompt))bad.push(q.id+' prompt duplicated');prompts.add(q.prompt);
  for(const inp of correctInputs(q.answer)){const r=engine.grade(q,inp);if(!r.correct)bad.push(q.id+' correct input judged wrong: '+inp+' → '+(r.reason||''));}
  const b=brokenInput(q.answer),rb=engine.grade(q,b);if(rb.correct)bad.push(q.id+' broken input judged correct: '+b);
  if(q.answer.kind==='rubric'&&q.answer.allowNegation){const ok=correctInputs(q.answer)[0];for(const r of (q.answer.reject||[]).flat()){const rr=engine.grade(q,ok+'、'+r);if(rr.correct)bad.push(q.id+' reject phrase judged correct: '+r);}}
  if(q.source.id===null)continue;
  const s=byId.get(q.source.id);
  if(!s||s.sha256!==q.source.sha256||s.file!==q.source.file||!s.verified||!(s.pages||[]).includes(q.source.page))bad.push(q.id+' source mismatch');
  else if(sha(s.file)!==s.sha256)bad.push(q.id+' source file hash');
 }
 console.log(path.basename(f),'問題',u.questions.length,'（教科書出典',nTb+'）',u.status,bad.length?'❌ '+bad.length:'✅ 問題なし');for(const x of bad.slice(0,20))console.log('   ',x);
 if(bad.length)fail++;
}
process.exit(fail?1:0);
