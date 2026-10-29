// 既存（前回候補の66問・87参照・legacy）の出方が、今回の候補でも1文字も変わらないか（Claude 2026-10-28）
import fs from 'node:fs';
const a=await import('./土台/ai-review-practice-library.mjs');   // 前回候補データ＋本体と同じライブラリ
const b=await import('./候補/ai-review-practice-library.mjs');
const base=(await import('./土台/ai-review-practice-data.mjs')).default;
const cand=(await import('./候補/ai-review-practice-data.mjs')).default;
const bank=JSON.parse(fs.readFileSync('/Users/shimizunaotomoo/Desktop/my-app/site-assets/material-bank.json','utf8'));
const all=new Map();for(const u of (bank.units||bank)){for(const q of [...(u.questions||[]),...(u.tests||[])])all.set(q.id,q);}
let n=0;const diff=[];
const J=JSON.stringify;
// データの既存部分がそのまま
for(const k of ['patterns','questions','references']){n++;if(J(cand[k].slice(0,base[k].length))!==J(base[k]))diff.push(k+' の既存部分が変わった');}
for(const k of ['legacyQuestions','legacyPatterns','version']){n++;if(J(cand[k])!==J(base[k]))diff.push(k+' が変わった');}
n++;if(J(Object.keys(cand).sort())!==J(Object.keys(base).sort()))diff.push('キーが変わった');
// 既存の元問題ごとの出方・公開データ・採点が同じ（legacy経由もふくむ）
const seen=new Set();
for(const r of base.references){const s=all.get(r.questionId);if(!s||seen.has(r.questionId))continue;seen.add(r.questionId);
  for(const legacy of [false,true]){n++;const x=J(await a.reviewPracticeOptions(s,{legacy})),y=J(await b.reviewPracticeOptions(s,{legacy}));if(x!==y)diff.push(r.questionId+(legacy?'(legacy)':''));}
  for(const o of await a.reviewPracticeOptions(s)){n++;if(J(await a.publicReviewPractice(s,o.id))!==J(await b.publicReviewPractice(s,o.id)))diff.push(o.id+' 公開');
    for(const L of ['ア','イ','ウ']){n++;if(J(await a.gradeReviewPractice(s,o.id,L))!==J(await b.gradeReviewPractice(s,o.id,L)))diff.push(o.id+' 採点'+L);}}
}
// 今回の対象10単元のうち、既存では1問も出ていなかったこと（土台では空）
console.log(`既存の元問題 ${seen.size} / 検査 ${n} / 変わったもの ${diff.length}`,diff.join(' '));
fs.writeFileSync('./regress-result.json',J({sources:seen.size,checks:n,changed:diff},null,1)+'\n');
process.exit(diff.length?1:0);
