import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {randomUUID} from 'node:crypto';
import {geminiTutorRoute} from './gemini-tutor.mjs';
import {materialRecordsRoute} from '/Users/shimizunaotomoo/Desktop/my-app/cf-worker/src/material-records.mjs';
import bank from '/Users/shimizunaotomoo/Desktop/my-app/cf-worker/src/material-bank.mjs';
import {trialStatus} from './ai-trial-control.mjs';
const {D1SQLite}=createRequire(import.meta.url)('/Users/shimizunaotomoo/Desktop/my-app/.claude/verify/d1-sqlite.js');
let checks=0,calls=0,now=Date.UTC(2026,9,12,3);const oldNow=Date.now;Date.now=()=>now;
const ok=(v,name)=>{assert(v,name);checks++;};
const unit=bank.units[0],q=unit.questions[0];
const helpers=uid=>({owner:'synthetic-owner-'+uid,json:(b,s=200)=>Response.json(b,{status:s}),requestJson:r=>r.json(),invalidBody:()=>Response.json({error:'body'},{status:400})});
const environment=()=>{
 const db=new D1SQLite();for(const uid of ['p_mini','p_pro','p_unlimit'])db.seed('active-session:'+uid,'synthetic-owner-'+uid,now+86400000);
 return {AUTH_DB:db,GEMINI_ENABLED:'1',GEMINI_API_KEY:'synthetic-test-only',GEMINI_MONTHLY_LIMIT_YEN:'500',SUBSCRIPTION_PREVIEW:'1',PREVIEW_PLAN_ACCOUNTS:'1'};
};
const response=value=>new Response(JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify(value)}]},finishReason:'STOP'}],usageMetadata:{promptTokenCount:0,candidatesTokenCount:0}}));
const explanation={reason:'fixture',steps:['first','second'],tip:'fixture'};
const fake=async()=>{calls++;return response(explanation);};
async function attempt(env,uid,answer){const id=randomUUID();const r=await materialRecordsRoute(new Request('https://fixture.test/material-records',{method:'POST',body:JSON.stringify({id,unitId:unit.id,questionId:q.id,mode:'study',answer,elapsedMs:1000})}),env,{uid},helpers(uid));assert.equal(r.status,200);return id;}
const call=(env,uid,id,fetchImpl=fake)=>geminiTutorRoute(new Request('https://fixture.test/material-explain',{method:'POST',body:JSON.stringify({attemptId:id})}),env,{uid},{...helpers(uid),fetchImpl});
try{
 const env=environment(),users=['p_mini','p_pro','p_unlimit'];
 let tenth;
 for(let i=0;i<10;i++){const uid=users[i%3];now+=11000;const id=await attempt(env,uid,String(100+i));const r=await call(env,uid,id);const v=await r.json();ok(r.status===200&&v.trial.used===i+1,'all plans share trial gate');if(i===9)tenth={uid,id};}
 const before=calls;now+=11000;const id=await attempt(env,'p_unlimit','777');let r=await call(env,'p_unlimit',id);let v=await r.json();
 ok(r.status===429&&v.error==='ai_trial_daily'&&calls===before,'UNLIMIT cannot bypass trial limit');
 r=await call(env,tenth.uid,tenth.id);v=await r.json();ok(r.status===200&&v.cached&&calls===before,'cached response does not spend trial count');
 ok(!!env.AUTH_DB.get('ai-trial:notice:2026-10-12'),'tenth-call notice persisted');
 const status=await(await geminiTutorRoute(new Request('https://fixture.test/material-ai-status'),env,{uid:'p_unlimit'},helpers('p_unlimit'))).json();
 ok(status.trial.used===10&&status.trial.limit===10,'status exposes count without credentials');
 const concurrent=environment();let release;const gate=new Promise(resolve=>release=resolve);
 const a=await attempt(concurrent,'p_pro','201'),b=await attempt(concurrent,'p_unlimit','202');
 const held=call(concurrent,'p_pro',a,async()=>{calls++;await gate;return response(explanation);});
 await new Promise(resolve=>setTimeout(resolve,0));r=await call(concurrent,'p_unlimit',b);v=await r.json();ok(v.error==='ai_busy','cross-account concurrent provider call refused');
 release();ok((await held).status===200,'first call completes');
 const invalid=environment();
 for(let i=0;i<3;i++){now+=11000;const id=await attempt(invalid,'p_pro',String(300+i));r=await call(invalid,'p_pro',id,async()=>{calls++;return response({...explanation,reason:'<script>unsafe</script>'});});ok(r.status===502,'invalid content is rejected inside common gate');}
 now+=11000;const invalidId=await attempt(invalid,'p_pro','400');const prior=calls;r=await call(invalid,'p_pro',invalidId);v=await r.json();ok(v.error==='ai_stopped'&&calls===prior,'three invalid responses stop further provider calls');
 const oversized=environment();const huge=await attempt(oversized,'p_pro','501');r=await call(oversized,'p_pro',huge,async()=>{calls++;return new Response('x'.repeat(70000));});
 ok((await r.json()).error==='ai_failed','oversized provider response refused');
 ok((await trialStatus(oversized.AUTH_DB,now)).used===1,'oversized response still counts');
 const hanging=environment();let canceled=false;const hid=await attempt(hanging,'p_pro','550');
 const started=performance.now();r=await call(hanging,'p_pro',hid,async()=>{calls++;return new Response(new ReadableStream({start(c){c.enqueue(new TextEncoder().encode('{'));},cancel(){canceled=true;}}));});
 ok((await r.json()).error==='ai_failed'&&canceled,'timeout cancels stalled response stream');
 ok(performance.now()-started<15000,'whole response wait is bounded');
 ok((await trialStatus(hanging.AUTH_DB,now)).used===1,'timed-out call counts once');
 const mock=environment();mock.GEMINI_ENABLED='0';mock.GEMINI_MOCK='1';const mid=await attempt(mock,'p_pro','601');const priorMock=calls;r=await call(mock,'p_pro',mid);v=await r.json();
 ok(r.status===200&&v.explanation.reason.startsWith('（模擬AI）')&&calls===priorMock,'mock sends nothing externally');
 ok((await trialStatus(mock.AUTH_DB,now)).used===0,'mock does not spend real trial quota');
 console.log('AI trial integration: '+checks+' checks passed; real tutor/records/plans with fake provider, no network');
}finally{Date.now=oldNow;}
