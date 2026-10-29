// 既存の類題の出方が、候補データでも同じか（Claude 2026-10-28）
import fs from 'node:fs';
const a=await import('/Users/shimizunaotomoo/Desktop/my-app/cf-worker/src/ai-review-practice-library.mjs');
const b=await import('./候補/ai-review-practice-library.mjs');
const base=(await import('/Users/shimizunaotomoo/Desktop/my-app/cf-worker/src/ai-review-practice-data.mjs')).default;
const bank=JSON.parse(fs.readFileSync('/Users/shimizunaotomoo/Desktop/my-app/site-assets/material-bank.json','utf8'));
const all=new Map();for(const u of (bank.units||bank)){for(const q of [...(u.questions||[]),...(u.tests||[])])all.set(q.id,q);}
let n=0,diff=[];
for(const r of base.references){const s=all.get(r.questionId);if(!s)continue;n++;
  const x=JSON.stringify(await a.reviewPracticeOptions(s)),y=JSON.stringify(await b.reviewPracticeOptions(s));if(x!==y)diff.push(r.questionId);}
console.log(`既存の元問題 ${n} / 出方が変わったもの ${diff.length}`,diff.join(' '));process.exit(diff.length?1:0);
