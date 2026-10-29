// 残り10単元の類題候補の検証（Claude 2026-10-28）。候補フォルダの写し（ライブラリ・採点エンジン・データ）だけを使う。実ユーザーの記録・通信なし。
import fs from 'node:fs';
const lib=await import('./候補/ai-review-practice-library.mjs');
const data=(await import('./候補/ai-review-practice-data.mjs')).default;
const add=JSON.parse(fs.readFileSync('./追加分.json','utf8'));
const ROOT='/Users/shimizunaotomoo/Desktop/my-app';
const bank=JSON.parse(fs.readFileSync(ROOT+'/site-assets/material-bank.json','utf8'));
const server=(await import(ROOT+'/cf-worker/src/material-bank.mjs')).default;
const tq=new Map();for(const u of (bank.units||bank))for(const t of (u.tests||[]))tq.set(t.id,t);
const su=new Map((server.units||server).map(u=>[u.id,u]));
const F=(e)=>Function('"use strict";return ('+e+')')();
let n=0;const bad=[],res=[],pos={ア:0,イ:0,ウ:0};
const L=['ア','イ','ウ'];
for(const p of add.patterns){
  for(const s of p.sources){
    // 実際のテスト導線：サーバーのバンクで ready・同じ問題がテストにある
    const u=su.get(s.unitId);n++;const st=u&&u.status==='ready'&&u.subject!=='保健体育'&&(u.tests||[]).some(t=>JSON.stringify(t)===JSON.stringify(tq.get(s.questionId)));
    if(!st)bad.push(`${s.questionId}: サーバーのテスト導線で同じ問題が見つからない`);
    const src=tq.get(s.questionId);const opts=await lib.reviewPracticeOptions(src);n++;
    const got=opts.map(o=>o.id).filter(id=>p.practiceIds.includes(id));
    if(got.length!==3)bad.push(`${s.questionId}: 類題が${got.length}問しか出ない`);
    const foreign=opts.map(o=>o.id).filter(id=>!p.practiceIds.includes(id));n++;
    if(foreign.length)bad.push(`${s.questionId}: 別パターンの類題も出る ${foreign}`);
    if(JSON.stringify(opts).includes('accepted')){bad.push(s.questionId+': 選択肢一覧に答えが入る');}
    for(const [k,f] of [['prompt',x=>({...x,prompt:x.prompt+'。'})],['answer',x=>({...x,answer:{...x.answer,accepted:[...(x.answer.accepted||[]),'0']}})],['id',x=>({...x,id:x.id+'x'})]]){
      const o2=await lib.reviewPracticeOptions(f(src));n++;
      if(o2.some(o=>p.practiceIds.includes(o.id)))bad.push(`${s.questionId}: ${k}を変えても出てしまう`);
    }
    res.push({source:s.questionId,options:got.length});
  }
  for(const id of p.practiceIds){
    const src=tq.get(p.sources[0].questionId);const q=add.questions.find(x=>x.id===id);
    const pub=await lib.publicReviewPractice(src,id);n++;
    if(!pub||JSON.stringify(pub).includes('accepted')||pub.answer||pub.explanation)bad.push(id+': 公開用に答え/解説が入っている/取れない');
    const ans=q.answer.accepted[0];pos[ans]++;
    for(const l of L){const g=await lib.gradeReviewPractice(src,id,l);n++;if(!!g?.correct!==(l===ans))bad.push(`${id}: ${l} の採点が ${g?.correct}`);}
    for(const w of ['',' ','アイウ','a','1',ans+ans,'エ']){let g;try{g=await lib.gradeReviewPractice(src,id,w);}catch(e){g={correct:false,rejected:true};}n++;if(g?.correct)bad.push(`${id}: 壊れた入力「${w}」が正解`);}
    // 選択肢の形：3行・正解だけが一番長い手がかりがない
    const opts=q.prompt.split('\n').slice(-3);n++;
    if(!opts.every((o,i)=>o.startsWith(L[i]+'　')))bad.push(id+': 選択肢の形');
    const len=opts.map(o=>o.length),ai=L.indexOf(ans);n++;
    if(len[ai]===Math.max(...len)&&len.filter(x=>x===len[ai]).length===1&&len[ai]-Math.max(...len.filter((_,i)=>i!==ai))>8)bad.push(`${id}: 正解だけが目立って長い ${len}`);
    if(q.numericCheck){n++;const v=F(q.numericCheck.expression);if(Math.abs(v-Number(q.numericCheck.expected))>1e-9)bad.push(`${id}: 数の検算 ${v}`);}
    // 元テストの答えを問題文へ漏らしていないか（元問題の正解文字列が類題の問題文に丸ごと出ない）
    for(const s of p.sources){const t=tq.get(s.questionId);n++;
      for(const a of (t.answer?.accepted||[]).map(String))if(a.length>=4&&!t.prompt.includes(a)&&q.prompt.includes(a))bad.push(`${id}: 元問題 ${s.questionId} の答え「${a}」が問題文にある`);}
    for(const other of add.patterns.filter(x=>x.id!==p.id)){const os=tq.get(other.sources[0].questionId);n++;
      if(await lib.publicReviewPractice(os,id))bad.push(id+': 別の元問題でも開けてしまう');
      n++;let g;try{g=await lib.gradeReviewPractice(os,id,ans);}catch(e){g=null;}if(g?.correct)bad.push(id+': 別の元問題で採点できてしまう');}
  }
}
n++;if(Object.values(pos).some(v=>v<5))bad.push('正解の位置が偏っている '+JSON.stringify(pos));
n++;if(data.legacyQuestions.length!==30||data.legacyPatterns.length!==10)bad.push('legacyの数');
n++;const ids=[...data.patterns.map(x=>x.id),...data.questions.map(x=>x.id)];if(new Set(ids).size!==ids.length)bad.push('IDの重複');
fs.writeFileSync('./verify-result.json',JSON.stringify({checks:n,mismatch:bad.length,answerPositions:pos,bad,res},null,1)+'\n');
console.log(`検査 ${n} / 不一致 ${bad.length} / 正解の位置 ${JSON.stringify(pos)}`);bad.forEach(b=>console.log(' ',b));
process.exit(bad.length?1:0);
