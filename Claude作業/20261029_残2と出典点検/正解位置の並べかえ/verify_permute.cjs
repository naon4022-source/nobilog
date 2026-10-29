// 1回目は解説の最後の「（…）」の補足を取りのぞかずに比べた検査側の誤り（verify_permute_1.log の2件）。取りのぞいてから比べる
// 並べかえの検査（Claude 2026-10-29）：選択肢の文は同じ集合・正解の文は同じ・解説の最後の答えの記号が新しい正解・本物のエンジンで新しい記号だけ○・ほかの項目は変わらない
const fs=require('fs'),path=require('path');const e=require('/Users/shimizunaotomoo/Desktop/my-app/教材整理/実装/material-engine.js');
const A=path.join(__dirname,'../反映用_まとめ候補/原稿'),B=path.join(__dirname,'原稿');let n=0,bad=0,changed=0;const fails=[];
const ok=(c,m)=>{n++;if(!c){bad++;fails.push(m);console.log('✗',m);}};
const opts=p=>Object.fromEntries(p.split('\n').filter(l=>/^[アイウエオ]\s/.test(l)).map(l=>[l[0],l.slice(1).trim()]));
for(const f of fs.readdirSync(A).filter(f=>f.endsWith('.json'))){
 const ua=JSON.parse(fs.readFileSync(path.join(A,f),'utf8')),ub=JSON.parse(fs.readFileSync(path.join(B,f),'utf8'));
 ok(JSON.stringify({...ua,questions:0})===JSON.stringify({...ub,questions:0}),f+' 単元の項目が同じ');
 ua.questions.forEach((qa,i)=>{const qb=ub.questions[i];
  const keys=new Set([...Object.keys(qa),...Object.keys(qb)]);const diff=[...keys].filter(k=>JSON.stringify(qa[k])!==JSON.stringify(qb[k]));
  if(!diff.length)return;changed++;
  ok(diff.every(k=>['prompt','answer','explanation'].includes(k)),qa.id+' 変わった項目は prompt・answer・explanation だけ ('+diff+')');
  const oa=opts(qa.prompt),ob=opts(qb.prompt);
  ok(JSON.stringify(Object.values(oa).sort())===JSON.stringify(Object.values(ob).sort()),qa.id+' 選択肢の文の集合が同じ');
  ok(qa.prompt.split('\n').filter(l=>!/^[アイウエオ]\s/.test(l)).join('\n')===qb.prompt.split('\n').filter(l=>!/^[アイウエオ]\s/.test(l)).join('\n'),qa.id+' 選択肢以外の問題文は同じ');
  const la=qa.answer.accepted[0],lb=qb.answer.accepted[0];ok(oa[la]===ob[lb],qa.id+' 正解の選択肢の文が同じ');
  ok(JSON.stringify({...qa.answer,accepted:0})===JSON.stringify({...qb.answer,accepted:0}),qa.id+' 答えのほかの項目は同じ');
  const t=qb.explanation.slice(qb.explanation.lastIndexOf('答え')+2).replace(/^[：:\s]+/,'').replace(/。$/,'').replace(/（[^（）]*）$/,'').trim();ok(t===lb,qa.id+' 解説の最後の答えが新しい記号 ('+t+'/'+lb+')');
  for(const L of Object.keys(ob))ok(e.grade(qb,L).correct===(L===lb),qa.id+' 記号 '+L+' の採点');
  // 解説の中の選択肢の記号が、同じ文の選択肢を指している（ひとりで立つ記号を、もとの文→新しい記号でたどる）
  const inv=Object.fromEntries(Object.entries(ob).map(([k,v])=>[v,k]));const mp=Object.fromEntries(Object.entries(oa).map(([k,v])=>[k,inv[v]]));
  const ISO=/(?<![ァ-ヶー〜・])([アイウエオ])(?![ァ-ヶー〜・])/g;const want=qa.explanation.replace(ISO,(m,c)=>mp[c]||c);ok(want===qb.explanation,qa.id+' 解説の記号の書きかえが選択肢の対応どおり');
 });}
console.log(`並べかえた問題 ${changed} / 検査 ${n} / ✗ ${bad}`);fs.writeFileSync(path.join(__dirname,'verify_permute-result.json'),JSON.stringify({changed,checks:n,failed:bad,fails},null,1)+'\n');process.exit(bad?1:0);
