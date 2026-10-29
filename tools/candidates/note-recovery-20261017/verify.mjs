import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {deflateSync} from 'node:zlib';
import {serveNoteAnalysis} from '../../../cf-worker/src/openai-tutor-service.mjs';
import {canonicalImage} from '../../../cf-worker/src/learning-images.mjs';
import {planStatus} from '../../../cf-worker/src/plans.mjs';
const {noteJobRoute,readNoteJob}=await import(process.argv.includes('--main')?'../../../cf-worker/src/openai-note-jobs.mjs':'./jobs.mjs');
const {noteAnalysisRoute}=await import(process.argv.includes('--main')?'../../../cf-worker/src/openai-note-route.mjs':'./route.mjs');
const {completedNoteResult,commitCompletedNote}=await import(process.argv.includes('--main')?'../../../cf-worker/src/openai-note-recovery.mjs':'./recovery.mjs');
const {D1SQLite}=createRequire(import.meta.url)('../../../.claude/verify/d1-sqlite.js');
let checks=0;const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
const now=Date.now(),uid='p_pro',owner='synthetic-owner',origin='https://synthetic.invalid';
async function fixture(kind='short'){
 const db=new D1SQLite(),env={AUTH_DB:db,APP_ORIGIN:origin,SUBSCRIPTION_PREVIEW:'1',PREVIEW_PLAN_ACCOUNTS:'1',PLAN_CREDITS_V2:'1',OPENAI_ENABLED:'1',OPENAI_TRIAL_ONLY:'1',OPENAI_SAFETY_READY:'1',OPENAI_TERMS_READY:'1',OPENAI_BILLING_READY:'1',OPENAI_API_KEY:'synthetic-only',OPENAI_MONTHLY_LIMIT_YEN:'800'};
 db.seed('active-session:'+uid,owner,now+600000);db.seed('openai-access:'+uid,JSON.stringify({version:'2026-10-14',ageBand:'13-17',guardianConsent:true,approved:true}));
 const images=[];
 if(kind==='photo'){const image=await canonicalImage({width:1,height:1,data:deflateSync(Buffer.from([0,0,0,255])).toString('base64')});images.push(image.id);db.seed('learning-image:'+uid+':'+image.id,JSON.stringify(image));}
 const note={id:'note_fixture',revision:1,title:'まとめ',text:kind==='long'?'学び'.repeat(6000):'数直線の向きを確かめよう。',images},body={id:'request_fixture',noteId:note.id,revision:1};
 db.seed('learning-note:'+uid+':'+note.id,JSON.stringify(note));
 const req=(path,b)=>new Request(origin+path,{method:b?'POST':'GET',headers:{Origin:origin,'Content-Type':'application/json'},...(b?{body:JSON.stringify(b)}:{})});
 const value={summary:'考えを確かめよう。',strengths:[],checks:[],practice:[],...(images.length?{imageChecks:[{image:0,readable:false,observation:'文字を判読できません。',reason:'式を確認できません。',nextStep:'明るい場所で撮り直そう。'}]}:{})};
 let calls=0;
 const fetcher=async(url,options)=>{
  calls++;if(url.endsWith('moderations'))return Response.json({results:[{flagged:false}]});
  if(url.endsWith('input_tokens'))return Response.json({object:'response.input_tokens',input_tokens:13000});
  const b=JSON.parse(options.body);return Response.json({status:'completed',model:b.model,service_tier:'default',output:[{type:'message',role:'assistant',content:[{type:'output_text',text:JSON.stringify(value)}]}],usage:{input_tokens:kind==='short'?100:13000,output_tokens:300}});
 };
 eq((await noteJobRoute(req('/learning-note-analysis-job',body),env,{uid},{owner,now})).status,200);
 const r=await serveNoteAnalysis(env,{uid},{noteId:note.id,revision:1},{owner,now,requestId:body.id,fetcher});eq(r.real,true);eq(db.get('learning-note-analysis:'+uid+':'+body.id),null);
 return {db,env,note,body,req,value,calls:()=>calls};
}
for(const kind of ['short','long','photo']){
 const f=await fixture(kind),{db,env,note,body,req,value}=f;
 try{
  const beforeCalls=f.calls(),beforeUsage=(await planStatus(env,uid,now)).dailyUsed;
  db.seed('learning-note:'+uid+':'+note.id,JSON.stringify({...note,text:'新しく編集した版',revision:2}));
  env.OPENAI_ENABLED='0';env.OPENAI_BILLING_READY='0';db.seed('openai-access:'+uid,JSON.stringify({version:'2026-10-14',approved:false}));
  const beforeKeys=db.keys(),beforeRows=beforeKeys.map(k=>db.get(k));
  const get=await noteAnalysisRoute(req('/learning-note-analysis?id='+body.id),env,{uid},{owner,now,fetcher:()=>{throw Error('must not call provider');}});
  eq(get.status,200);const shown=await get.json();eq(shown.item.analysis,value);eq(shown.item.revision,1);eq(shown.creditsUsed,0);eq(shown.cached,true);
  eq(db.keys(),beforeKeys);eq(db.keys().map(k=>db.get(k)),beforeRows);eq(f.calls(),beforeCalls);
  const complete=await noteJobRoute(req('/learning-note-analysis-job',body),env,{uid},{owner,now});eq(complete.status,200);eq((await complete.json()).job.state,'done');
  eq(JSON.parse(db.get('learning-note-analysis:'+uid+':'+body.id).v).analysis,value);eq((await readNoteJob(db,uid,note.id)).state,'done');
  eq((await planStatus(env,uid,now)).dailyUsed,beforeUsage);eq(f.calls(),beforeCalls);
  eq((await noteJobRoute(req('/learning-note-analysis-job',body),env,{uid},{owner,now})).status,200);eq((await planStatus(env,uid,now)).dailyUsed,beforeUsage);
  const next={id:'new_request_fixture',noteId:note.id,revision:2};eq((await noteJobRoute(req('/learning-note-analysis-job',next),env,{uid},{owner,now})).status,200);eq((await readNoteJob(db,uid,note.id)).revision,2);eq(f.calls(),beforeCalls);
 }finally{db.close();}
}
for(const scenario of ['post','mismatch','unknown','rollback','lost_commit','owner','source_race','plan','concurrent','reserved','rejected']){
 const f=await fixture(),{db,env,note,body,req}=f;
 try{
  const opKey='openai-operation:'+uid+':'+body.id,before=f.calls();
  if(scenario==='mismatch'){const row=JSON.parse(db.get(opKey).v);row.digest='f'.repeat(64);db.seed(opKey,JSON.stringify(row));await assert.rejects(()=>completedNoteResult(db,uid,body.id),/mismatch/);checks++;eq(db.get('learning-note-analysis:'+uid+':'+body.id),null);}
  else if(['unknown','reserved','rejected'].includes(scenario)){const row=JSON.parse(db.get(opKey).v);row.state=scenario==='unknown'?'started':scenario;delete row.value;db.seed(opKey,JSON.stringify(row));eq(await completedNoteResult(db,uid,body.id),null);eq((await noteAnalysisRoute(req('/learning-note-analysis?id='+body.id),env,{uid},{owner,now})).status,404);eq((await readNoteJob(db,uid,note.id)).state,'pending');}
  else if(scenario==='post'){env.OPENAI_ENABLED='0';const r=await noteAnalysisRoute(req('/learning-note-analysis',body),env,{uid},{owner,now});eq(r.status,200);eq((await r.json()).creditsUsed,0);eq((await readNoteJob(db,uid,note.id)).state,'done');}
  else if(scenario==='plan'){db.seed('plan:'+uid,JSON.stringify({plan:'free',start:now-1000,end:null,revision:2,next:null}));eq((await noteAnalysisRoute(req('/learning-note-analysis?id='+body.id),env,{uid},{owner,now})).status,403);eq(db.get('learning-note-analysis:'+uid+':'+body.id),null);}
  else{
   const job=await readNoteJob(db,uid,note.id),proof=await completedNoteResult(db,uid,body.id);
   if(scenario==='concurrent'){eq(await Promise.all([commitCompletedNote(db,uid,owner,job,proof,now),commitCompletedNote(db,uid,owner,job,proof,now)]),[true,true]);eq((await readNoteJob(db,uid,note.id)).state,'done');}
   if(scenario==='rollback'){db.failBatchAt=1;await assert.rejects(()=>commitCompletedNote(db,uid,owner,job,proof,now));checks++;eq(db.get(proof.recordKey),null);eq((await readNoteJob(db,uid,note.id)).state,'pending');db.failBatchAt=-1;eq(await commitCompletedNote(db,uid,owner,job,proof,now),true);}
   if(scenario==='lost_commit'){
    const original=db.batch.bind(db);db.batch=async statements=>{await original(statements);throw Error('lost response');};await assert.rejects(()=>commitCompletedNote(db,uid,owner,job,proof,now));checks++;db.batch=original;
    eq((await readNoteJob(db,uid,note.id)).state,'done');eq((await noteJobRoute(req('/learning-note-analysis-job',body),env,{uid},{owner,now})).status,200);
   }
   if(scenario==='owner'){db.seed('active-session:'+uid,'different-owner',now+600000);eq(await commitCompletedNote(db,uid,owner,job,proof,now),false);eq(db.get(proof.recordKey),null);}
   if(scenario==='source_race'){db.beforeBatch=()=>{db.beforeBatch=null;db.seed(proof.contextKey,JSON.stringify({...JSON.parse(proof.contextRaw),text:'変更された出典'}));};eq(await commitCompletedNote(db,uid,owner,job,proof,now),false);eq(db.get(proof.recordKey),null);}
  }
  eq(f.calls(),before);eq(JSON.parse(db.get('learning-note:'+uid+':'+note.id).v),note);
  eq(await completedNoteResult(db,'p_unlimit',body.id),null);
 }finally{db.close();}
}
console.log('Note recovery: '+checks+' checks passed; actual completed operations, short/long/photo source, read-only GET, atomic metadata completion, edited revision, no extra quota/provider call, rollback, lost response, owner/source/plan guards; fake HTTP only');
