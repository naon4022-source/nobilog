// Claude 2026-10-26：追加18問＋Codex候補30問の点検（合成入力だけ。実AI・実データなし）
const fs=require('fs'),path=require('path');const ROOT='/Users/shimizunaotomoo/Desktop/my-app';
const E={client:require(path.join(ROOT,'site-assets/material-engine.js')),server:require(path.join(ROOT,'cf-worker/src/material-engine.cjs'))};
const bank=JSON.parse(fs.readFileSync(path.join(ROOT,'site-assets/material-bank.json'),'utf8'));
const ids=new Set(bank.units.flatMap(u=>[...u.questions,...(u.tests||[])].map(q=>q.id)));
let n=0,f=0;const ok=(c,m)=>{n++;if(!c){f++;console.log('❌',m);}};
for(const file of [path.join(__dirname,'practice-bank.json'),path.join(ROOT,'tools/candidates/textbook-ai-20261026/review/practice-five-subjects-candidate.json')]){
 const d=JSON.parse(fs.readFileSync(file,'utf8'));const tag=path.basename(file);
 ok(d.displayPolicy&&d.displayPolicy.explanationInitiallyHidden===true&&d.displayPolicy.sendAnswerBeforeSubmit===false,tag+' answers hidden until submit');
 const pids=new Set(d.patterns.map(p=>p.id));
 for(const p of d.patterns){
  ok([...p.commentExample].length<=70,p.id+' comment ≤70 ('+[...p.commentExample].length+')');
  ok(!/バカ|だめ|できない子|才能/.test(p.commentExample),p.id+' comment does not judge the student');
  for(const s of p.sources)ok(ids.has(s.questionId),p.id+' source exists '+s.questionId);
  ok(p.practiceIds.length===3&&p.practiceIds.every(id=>d.questions.some(q=>q.id===id&&q.patternId===p.id)),p.id+' maps to its 3 practice questions');
 }
 const letters=d.questions.map(q=>q.answer.accepted[0]);
 for(const q of d.questions){
  ok(pids.has(q.patternId),q.id+' pattern exists');
  ok(q.explanation&&q.whyThisChecksCause,q.id+' has explanation and purpose');
  const opts=['ア','イ','ウ'].filter(l=>q.prompt.includes(l+'　'));ok(opts.length===3,q.id+' has 3 options');
  ok(q.explanation.startsWith(q.answer.accepted[0]),q.id+' explanation names the same answer');
  for(const l of ['ア','イ','ウ'])for(const k of ['client','server']){const r=E[k].grade(q,l);ok(!!r.correct===(l===q.answer.accepted[0]),q.id+' '+k+' grades '+l);}
  for(const s of q.appliesToSourceIds)ok(ids.has(s),q.id+' applies to existing '+s);
 }
 const runs=d.patterns.map(p=>p.practiceIds.map(id=>d.questions.find(q=>q.id===id).answer.accepted[0]).join(''));
 console.log(tag,'answer order per pattern:',runs.join(' '));
}
console.log('Practice check: '+n+' checks ❌ '+f);process.exit(f?1:0);
