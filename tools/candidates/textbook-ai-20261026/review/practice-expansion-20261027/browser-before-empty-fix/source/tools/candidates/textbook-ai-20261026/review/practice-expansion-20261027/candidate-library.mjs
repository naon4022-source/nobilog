// Server-only educational library. Callers MUST first verify their owned,
// completed review and its AI-selected practiceId. No HTTP route is exposed.
import data from './ai-review-practice-data.mjs';
import engine from '../../../../../cf-worker/src/material-engine.cjs';
const copy=v=>JSON.parse(JSON.stringify(v)),questions=new Map([...(data.legacyQuestions||[]),...data.questions].map(q=>[q.id,q])),patterns=new Map(data.patterns.map(p=>[p.id,p])),legacyPatterns=new Map((data.legacyPatterns||[]).map(p=>[p.id,p])),bindings=new Map();
for(const ref of data.references){const rows=bindings.get(ref.questionId)||[];rows.push(ref);bindings.set(ref.questionId,rows);}
async function digest(q){try{if(typeof q?.id!=='string'||typeof q.prompt!=='string'||q.prompt.length>12000||!q.answer||typeof q.answer!=='object'||JSON.stringify(q.answer).length>12000)return null;const body=JSON.stringify({id:q.id,prompt:q.prompt,answer:q.answer});return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(body))),b=>b.toString(16).padStart(2,'0')).join('');}catch{return null;}}
export async function reviewPracticeOptions(source,{legacy=false}={}){
 const refs=bindings.get(source?.id);if(!refs)return [];const hash=await digest(source);if(!hash)return [];
 const ids=new Set(),out=[];for(const ref of refs){if(ref.sha256!==hash)continue;const pattern=(legacy?legacyPatterns:patterns).get(ref.patternId);if(!pattern)continue;for(const id of pattern.practiceIds){const q=questions.get(id);if(ids.has(id)||!q.appliesToSourceIds.includes(source.id))continue;ids.add(id);out.push({id,purpose:pattern.purpose,focus:q.whyThisChecksCause});}}
 return copy(out);
}
async function allowed(source,id){if(typeof id!=='string')return null;const q=questions.get(id),refs=bindings.get(source?.id);if(!q||!refs||!q.appliesToSourceIds.includes(source.id)||!patterns.has(q.patternId))return null;const hash=await digest(source);return hash&&refs.some(ref=>ref.sha256===hash&&ref.patternId===q.patternId)?q:null;}
export async function publicReviewPractice(source,id){const q=await allowed(source,id);return q?{id:q.id,type:q.type,prompt:q.prompt}:null;}
export async function gradeReviewPractice(source,id,answer){
 if(typeof answer!=='string'||!answer.trim()||answer.length>4000||/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(answer))throw Error('invalid_practice_answer');
 const q=await allowed(source,id);if(!q)throw Error('practice_not_found');const result=engine.grade(q,answer);
 return {practiceId:id,correct:result.correct,answer:copy(q.answer),explanation:q.explanation};
}
