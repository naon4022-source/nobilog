// 解説の最後の「答え ○○」が、登録された答えと本物の採点エンジンで○になるかを、完成候補の全単元で調べる（Claude 2026-10-29）
const fs=require('fs'),path=require('path');const e=require('/Users/shimizunaotomoo/Desktop/my-app/教材整理/実装/material-engine.js');
const dirs=[path.join(__dirname,'../原稿'),path.join(__dirname,'../../20261029_立体残7/原稿')];const seen=new Set();const rows=[];let n=0,bad=0,skip=0;
for(const d of dirs)for(const f of fs.readdirSync(d).filter(f=>/^tokkun-math-1-.*\.json$/.test(f))){
 const u=JSON.parse(fs.readFileSync(path.join(d,f),'utf8'));
 for(const q of u.questions){if(seen.has(q.id))continue;seen.add(q.id);
  // 2回目：いちばん最後の「答え」のあとを読む（1回目は途中の「正しい答え：」なども拾った）
  const i=q.explanation.lastIndexOf('答え');
  if(i<0){skip++;rows.push({id:q.id,status:'答えの文がない'});continue;}
  let t=q.explanation.slice(i+2).replace(/^[：:\s]+/,'').replace(/。$/,'').replace(/（[^（）]*）$/,'').trim();n++;
  const r=e.grade(q,t);if(!r.correct){bad++;rows.push({id:q.id,status:'×',text:t,answer:q.answer,reason:r.reason||''});}}}
fs.writeFileSync(path.join(__dirname,'answer_vs_explanation-result.json'),JSON.stringify({checked:n,mismatch:bad,noAnswerText:skip,rows},null,1)+'\n');
// 分類
const UP=new Set(JSON.parse(fs.readFileSync(path.join(__dirname,'../単位の採点候補/scan-result.json'),'utf8')).map(h=>h.id));
for(const r of rows){if(r.status!=='×')continue;const t=r.text;
 r.category=UP.has(r.id)?'単位が登録されていない（単位の修正案に入っている）':/^およそ/.test(t)?'「およそ」をつけた答え':/^(分速|秒速|時速|毎分|毎秒)/.test(t)?'速さ・割合の「分速」「毎分」などをつけた答え':/以上|未満/.test(t)?'「以上」「未満」をつけた答え':'その他（1問ずつ確認）';}
const cat={};for(const r of rows.filter(r=>r.status==='×'))cat[r.category]=(cat[r.category]||0)+1;
fs.writeFileSync(path.join(__dirname,'answer_vs_explanation-result.json'),JSON.stringify({checked:n,mismatch:bad,noAnswerText:skip,categories:cat,rows},null,1)+'\n');console.log(JSON.stringify(cat));
console.log(`調べた ${n} 問 / 解説の答えが×になる ${bad} / 答えの文がない ${skip}`);
for(const r of rows.filter(r=>r.status==='×'&&r.category.startsWith('その他')))console.log(' ',r.id,JSON.stringify(r.text),JSON.stringify(r.answer).slice(0,80),r.reason);
