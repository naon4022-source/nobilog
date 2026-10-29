// Stage the exact reviewed units only in this process, never in served assets.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import bank from '../../../cf-worker/src/material-bank.mjs';
const require=createRequire(import.meta.url),{D1SQLite}=require('../../../.claude/verify/d1-sqlite.js');
const engine=require('../../../cf-worker/src/material-engine.cjs');
const english=process.argv.includes('--english');
const root=new URL('../../../',import.meta.url),plan=JSON.parse(await readFile(new URL(english?'../english-tokkun-integration-20261016/integration-plan.json':'integration-plan.json',import.meta.url),'utf8'));
const corrections=JSON.parse(await readFile(new URL('../answer-forms-20261021/corrections.json',import.meta.url),'utf8'));
const db=new D1SQLite(),before=bank.units.length,now=Date.now();let checks=0,serial=0;
const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
const right=q=>q.answer.kind==='number'?q.answer.value:q.answer.kind==='set'?q.answer.items.map(x=>x[0]).join('、'):q.answer.accepted[0];
const helpers={json:(data,status=200)=>Response.json(data,{status}),requestJson:r=>r.json(),invalidBody:()=>Response.json({error:'bad body'},{status:400}),owner:'fixture-owner'};
db.seed('active-session:synthetic','fixture-owner',now+86400000);
let route;
const call=(path,body)=>route(new Request('https://fixture.test'+path,{method:body?'POST':'GET',body:body?JSON.stringify(body):undefined,headers:body?{'Content-Type':'application/json'}:{}}),{AUTH_DB:db},{uid:'synthetic'},helpers);
try{
 const units=[];
 for(const entry of plan.readyForIntegration||plan.entries){
  const raw=await readFile(new URL(entry.destination,root)),sha=createHash('sha256').update(raw).digest('hex'),later=corrections.files[entry.destination];
  // 2026-10-21 Claude：採点条件だけの後日の修正（answer-forms-20261021/corrections.json）を元に戻すと、取り込んだときと同じバイトになることを確かめる。
  if(later&&sha===later.afterSha256){const back=JSON.parse(raw);for(const k of ['questions','tests'])for(const q of back[k]||[])if(corrections.questions[q.id])q.answer=corrections.questions[q.id].before;eq(createHash('sha256').update(JSON.stringify(back,null,1)+'\n').digest('hex'),entry.sha256||entry.destinationSha256);}
  else eq(sha,entry.sha256||entry.destinationSha256);
  const unit=JSON.parse(raw);eq(engine.validateUnit(unit,{sources:bank.sources}),[]);eq(unit.questions.length,70);
  if(bank.units.some(u=>u.id===unit.id))assert.deepEqual(bank.units.find(u=>u.id===unit.id),unit);else bank.units.push(unit);
  units.push(unit);
 }
 ({materialRecordsRoute:route}=await import('../../../cf-worker/src/material-records.mjs?japanese-staging'));
 for(const unit of units){
  for(const question of unit.questions)eq(engine.grade(question,right(question)).correct,true);
  const q=unit.questions.at(-1),body={id:'00000000-0000-4000-8000-'+String(++serial).padStart(12,'0'),unitId:unit.id,questionId:q.id,mode:'study',answer:String(right(q)),elapsedMs:1250};
  let response=await call('/material-records',body);eq(response.status,200);
  const saved=await response.json();eq(saved.record.result.correct,true);eq(saved.record.questionId,q.id);eq(saved.record.unitId,unit.id);
  response=await call('/material-records',body);eq(response.status,200);
  response=await call('/material-marks?unitId='+encodeURIComponent(unit.id));eq(response.status,200);
  const marks=await response.json();eq(marks.items.find(x=>x.questionId===q.id).mark,'○');eq(marks.items.find(x=>x.questionId===q.id).views,1);
 }
 eq(db.keys().filter(k=>k.startsWith('material-attempt:')).length,units.length);
 console.log(`${english?'English':'Japanese'} import: ${checks} checks passed; exact copied SHA, strict sources, ${units.reduce((n,u)=>n+u.questions.length,0)} accepted inputs, actual record route with isolated SQLite, saved correct marks and duplicate replay; no served-file writes, real accounts or network`);
}finally{bank.units.length=before;db.close();}
