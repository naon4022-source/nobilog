import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import bank from '../../../../../cf-worker/src/material-bank.mjs';
const here=new URL('./',import.meta.url),base='tools/candidates/textbook-ai-20261026/review/math-order-followup/',ids=['drill-math-1-signedcalc','workbook-math-1-calc1','workbook-math-1-calc2','workbook-math-1-review'],old='累乗 → かっこの中 → 乗除 → 加減',fixed='かっこの内側から、その中では累乗 → 乗除 → 加減（同じ順位は左から）';
let checks=0,count=0,guides=0,questions=0;const check=(v,m)=>{assert.ok(v,m);checks++;},inputs=[];
const same=(a,b)=>assert.deepEqual(a,b),sha=b=>createHash('sha256').update(b).digest('hex');
same(JSON.parse(await readFile('site-assets/material-bank.json','utf8')),bank);checks++;
for(const id of ids){const source='教材整理/確認済み/'+id+'.json',file=base+'candidate/'+source,before=bank.units.find(u=>u.id===id),after=JSON.parse(await readFile(file,'utf8'));same(JSON.parse(await readFile(source,'utf8')),before);checks++;
 const strip=u=>Object.fromEntries(Object.entries(u).filter(([k])=>!['questions','tests','guide'].includes(k)));same(strip(before),strip(after));checks++;
 same(after.guide,before.guide?.map(g=>({...g,body:g.body.replaceAll(old,fixed)})));checks++;guides+=(before.guide||[]).filter(g=>g.body.includes(old)).length;
 for(const area of ['questions','tests']){same(before[area].length,after[area].length);checks++;for(let i=0;i<before[area].length;i++){const b=before[area][i],a=after[area][i];questions++;const strip=q=>Object.fromEntries(Object.entries(q).filter(([k])=>k!=='explanation'));same(strip(b),strip(a));checks++;if(b.explanation!==a.explanation){check(b.explanation.includes(old),'only old-order explanations change');check(a.explanation.includes(fixed)&&!a.explanation.includes(old),'corrected order present');count++;}}}
 for(const name of [file,source])inputs.push({file:name,sha256:sha(await readFile(name))});
}
check(questions===325&&count===132&&guides===1,'exact325 questions,132 explanations and one guide');
const arithmetic=JSON.parse(await readFile(new URL('candidate-result.json',here)));check(arithmetic.status==='passed'&&arithmetic.checks>1000,'independent golden/generated-expression arithmetic passed');
const edits=JSON.parse(await readFile(new URL('source-edits.json',here)));for(const row of edits.files){check(sha(await readFile(row.file))===row.beforeSha256,'main generator untouched');check(sha(await readFile(row.candidateFile))===row.candidateSha256,'reviewed candidate generator hash');inputs.push({file:row.file,sha256:row.beforeSha256},{file:row.candidateFile,sha256:row.candidateSha256});}
for(const file of ['site-assets/material-bank.json','cf-worker/src/material-bank.mjs',base+'verify-candidate.py',base+'candidate-result.json'])inputs.push({file,sha256:sha(await readFile(file))});
await writeFile(new URL('regeneration-result.json',here),JSON.stringify({status:'passed',checks,questions,explanationChanges:count,guideChanges:guides,inputs,scope:'Candidate only. Real four-unit generator output versus current canonical reviewed JSON and matching browser/server package. Every field including prompts, answers, near answers, numbers, sources, order and metadata retained except132 explanation texts and one explicitly corrected guide. Independent AST/Fraction arithmetic proof bound. Main source unchanged; no main/browser/full integration claim.'},null,2)+'\n');console.log('Math order regeneration preservation: '+checks+' checks passed');
