// ★3の難しめ基準（2026-10-22 Claude・候補。本体へはCodexが取り込む）
// 入力：単元（questions）と、本人の回答記録（サーバーの material-records の行：questionId, mode, correct, elapsedMs, at）
// ・★1：ちがう問題の5割以上を正解
// ・★2：8割以上を正解 かつ「はじめて解いたときに正解」した割合が6割以上
// ・★3：全問正解 かつ 初回正解率8割以上 かつ 速さの基準（計算・文章の正解の時間の中央値が基準以内）
// ・同じ問題の周回、速いだけの誤答、未回答は数えない。記述・読解には時間の基準をかけない（不公平にしない）
(function(root){
 'use strict';
 const LIMIT={calc:60000,word:120000};   // 1問あたりの時間の中央値の基準（ミリ秒）
 function kindOf(q){
  const a=q&&q.answer||{};
  if(a.kind==='rubric'||q.type==='reading')return 'free';            // 記述・読解：時間の基準なし
  const lines=String(q.prompt||'').split('\n').map(s=>s.trim()).filter(Boolean);
  const formula=/^[0-9a-zA-Z()（）+＋\-−–×÷*・=＝<>≦≧≤≥²³⁴⁵.,，、/\s|√πxyab]+$/;
  return lines.length>1&&/計算|簡単に|展開|因数分解|解こう|解きなさい/.test(lines[0])&&lines.slice(1).every(l=>formula.test(l))?'calc':'word';
 }
 function median(xs){if(!xs.length)return null;const s=[...xs].sort((a,b)=>a-b),m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2;}
 function evaluate(unit,rows){
  const questions=Array.isArray(unit&&unit.questions)?unit.questions:[],byId=new Map(questions.map(q=>[q.id,q]));
  const total=byId.size;const empty={stars:0,total,correct:0,firstTryRate:null,speed:{},reasons:['まだ記録がありません']};
  if(!total)return empty;
  const list=(Array.isArray(rows)?rows:[]).filter(r=>r&&r.mode==='study'&&byId.has(r.questionId)&&Number.isFinite(r.at)).sort((a,b)=>a.at-b.at);
  const first=new Map(),solved=new Map();
  for(const r of list){
   if(!first.has(r.questionId))first.set(r.questionId,r.correct===true);
   if(r.correct===true&&!solved.has(r.questionId))solved.set(r.questionId,Math.max(0,Number(r.elapsedMs)||0));   // 時間は最初に正解したときの1回だけ
  }
  const correct=solved.size,tried=first.size;
  const firstTryRate=tried?[...first.values()].filter(Boolean).length/total:null;   // 分母は単元の全問（解いていない問題は初回正解にならない）
  const speed={};for(const k of ['calc','word']){const t=[...solved].filter(([id])=>kindOf(byId.get(id))===k).map(([,ms])=>ms);speed[k]={median:median(t),limit:LIMIT[k],count:t.length,ok:!t.length||median(t)<=LIMIT[k]};}
  const reasons=[];let stars=0;
  if(correct>=Math.ceil(total*0.5))stars=1;else reasons.push('★1：ちがう問題を'+Math.ceil(total*0.5)+'問正解（いま'+correct+'問）');
  if(stars===1){if(correct>=Math.ceil(total*0.8)&&firstTryRate>=0.6)stars=2;else reasons.push('★2：'+Math.ceil(total*0.8)+'問正解、はじめて解いて正解した割合6割以上');}
  if(stars===2){const fast=speed.calc.ok&&speed.word.ok;if(correct===total&&firstTryRate>=0.8&&fast)stars=3;else reasons.push('★3：全問正解、はじめて解いて正解8割以上、計算は1問'+LIMIT.calc/1000+'秒・文章は'+LIMIT.word/1000+'秒以内（中央値）');}
  return {stars,total,correct,firstTryRate,speed,reasons};
 }
 const api=Object.freeze({evaluate,kindOf,LIMIT});
 if(typeof module==='object'&&module.exports)module.exports=api;else root.NobiStars=api;
})(typeof globalThis!=='undefined'?globalThis:this);
