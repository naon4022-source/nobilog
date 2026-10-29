// 類題の拡大候補をつくる（Claude 2026-10-28）。本体のデータは読むだけで、変えない。
import fs from 'node:fs'; import crypto from 'node:crypto'; import path from 'node:path';
const ROOT='/Users/shimizunaotomoo/Desktop/my-app';
const base=(await import(ROOT+'/cf-worker/src/ai-review-practice-data.mjs')).default;
const bank=JSON.parse(fs.readFileSync(ROOT+'/site-assets/material-bank.json','utf8'));
const units=(bank.units||bank);const testQ=new Map(),unitOf=new Map(),gradeOf=new Map();
for(const u of units){gradeOf.set(u.id,u.grade);for(const t of (u.tests||[])){testQ.set(t.id,t);unitOf.set(t.id,u.id);}}
const add=JSON.parse(fs.readFileSync(new URL('./add.json',import.meta.url),'utf8'));
const L=['ア','イ','ウ'];
function perm(key){const h=crypto.createHash('sha256').update(key).digest()[0];return [[0,1,2],[1,0,2],[1,2,0],[2,0,1],[0,2,1],[2,1,0]][h%6];}
function relabel(text,map){return text.replace(/(?<![ァ-ヶー])[アイウ](?![ァ-ヶー])/g,c=>L[map[L.indexOf(c)]]);}
const digest=q=>crypto.createHash('sha256').update(JSON.stringify({id:q.id,prompt:q.prompt,answer:q.answer})).digest('hex');
const out={patterns:[],questions:[],references:[]};const errs=[];
for(const p of add.patterns){
  for(const s of p.sources){if(!testQ.has(s))errs.push('テストにない元問題 '+s);}
  const grade=gradeOf.get(unitOf.get(p.sources[0]));
  const pid=[];
  for(const pr of p.practices){
    const id=`review-${pr.key}-c1`;pid.push(id);
    const lines=pr.prompt.split('\n');const head=lines.slice(0,-3),opts=lines.slice(-3);
    if(!opts.every((o,i)=>o.startsWith(L[i]+'　')))errs.push('選択肢の形 '+id);
    const order=perm(id);              // order[旧位置]=新位置
    const newOpts=[];opts.forEach((o,i)=>{newOpts[order[i]]=L[order[i]]+o.slice(1);});
    const ans=L[order[L.indexOf(pr.answer)]];
    const q={id,patternId:p.id,type:'input',difficulty:'hard',prompt:[...head,...newOpts].join('\n'),answer:{kind:'exact',accepted:[ans]},
      explanation:relabel(pr.explanation,order),whyThisChecksCause:pr.why,appliesToSourceIds:p.sources};
    if(pr.numeric)q.numericCheck={expression:pr.numeric[0],expected:pr.numeric[1]};
    out.questions.push(q);
  }
  out.patterns.push({id:p.id,subject:p.subject,grade,purpose:p.purpose,commentExample:p.commentExample,causeToCheck:p.causeToCheck,
    sources:p.sources.map(s=>({unitId:unitOf.get(s),questionId:s})),practiceIds:pid});
  for(const s of p.sources){const t=testQ.get(s);out.references.push({unitId:unitOf.get(s),questionId:s,patternId:p.id,reviewEligibleViaCurrentMaterialTest:true,sha256:digest(t)});}
}
const ids=new Set([...base.patterns.map(x=>x.id),...base.questions.map(x=>x.id)]);
for(const x of [...out.patterns,...out.questions])if(ids.has(x.id))errs.push('IDが既存と重なる '+x.id);
const merged={...base,patterns:[...base.patterns,...out.patterns],questions:[...base.questions,...out.questions],references:[...base.references,...out.references]};
fs.writeFileSync(new URL('./追加分.json',import.meta.url),JSON.stringify(out,null,1)+'\n');
fs.mkdirSync(new URL('./候補/',import.meta.url),{recursive:true});
fs.writeFileSync(new URL('./候補/ai-review-practice-data.mjs',import.meta.url),'export default '+JSON.stringify(merged)+';\n');
console.log(JSON.stringify({patterns:out.patterns.length,questions:out.questions.length,references:out.references.length,errors:errs}));
if(errs.length)process.exit(1);
