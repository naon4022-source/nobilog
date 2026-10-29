// 類題の拡大候補の検証（Claude 2026-10-28）。候補フォルダの写し（ライブラリ・採点エンジン・データ）だけを使う。実ユーザーの記録・通信なし。
import fs from 'node:fs';
const lib=await import('./候補/ai-review-practice-library.mjs');
const add=JSON.parse(fs.readFileSync('./追加分.json','utf8'));
const bank=JSON.parse(fs.readFileSync('/Users/shimizunaotomoo/Desktop/my-app/site-assets/material-bank.json','utf8'));
const tq=new Map();for(const u of (bank.units||bank))for(const t of (u.tests||[]))tq.set(t.id,t);
const F=(e)=>Function('"use strict";return ('+e+')')();
let n=0,bad=[];const res=[];
for(const p of add.patterns){
  for(const s of p.sources){
    const src=tq.get(s.questionId);const opts=await lib.reviewPracticeOptions(src);n++;
    const got=opts.map(o=>o.id).filter(id=>p.practiceIds.includes(id));
    if(got.length!==3)bad.push(`${s.questionId}: 類題が${got.length}問しか出ない`);
    // 元問題の本文を1文字変えると出ない（指紋の照合）
    const tampered={...src,prompt:src.prompt+'。'};const o2=await lib.reviewPracticeOptions(tampered);n++;
    if(o2.some(o=>p.practiceIds.includes(o.id)))bad.push(`${s.questionId}: 本文を変えても出てしまう`);
    res.push({source:s.questionId,options:got.length});
  }
  for(const id of p.practiceIds){
    const src=tq.get(p.sources[0].questionId);const q=add.questions.find(x=>x.id===id);
    const pub=await lib.publicReviewPractice(src,id);n++;if(!pub||pub.answer)bad.push(id+': 公開用に答えが入っている/取れない');
    for(const L of ['ア','イ','ウ']){const g=await lib.gradeReviewPractice(src,id,L);n++;const want=L===q.answer.accepted[0];if(!!g?.correct!==want)bad.push(`${id}: ${L} の採点が ${g?.correct}`);}
    if(q.numericCheck){n++;const v=F(q.numericCheck.expression);if(Math.abs(v-Number(q.numericCheck.expected))>1e-9)bad.push(`${id}: 数の検算 ${v}`);}
    // ほかのパターンの元問題では、この類題は出ない
    const other=add.patterns.find(x=>x.id!==p.id);const os=tq.get(other.sources[0].questionId);n++;
    if(await lib.publicReviewPractice(os,id))bad.push(id+': 別の元問題でも開けてしまう');
  }
}
fs.writeFileSync('./verify-result.json',JSON.stringify({checks:n,mismatch:bad.length,bad,res},null,1));
console.log(`検査 ${n} / 不一致 ${bad.length}`);bad.forEach(b=>console.log(' ',b));
process.exit(bad.length?1:0);
