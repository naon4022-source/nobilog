import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {deflateSync} from 'node:zlib';
const {serveNoteAnalysis}=await import(process.argv.includes('--main')?'../../../cf-worker/src/openai-tutor-service.mjs':'./service.mjs');
const {noteJobRoute}=await import(process.argv.includes('--main')?'../../../cf-worker/src/openai-note-jobs.mjs':'./jobs.mjs');
const {noteAnalysisRoute}=await import(process.argv.includes('--main')?'../../../cf-worker/src/openai-note-route.mjs':'./route.mjs');
import {canonicalImage} from '../../../cf-worker/src/learning-images.mjs';
import {planStatus} from '../../../cf-worker/src/plans.mjs';
const {D1SQLite}=createRequire(import.meta.url)('../../../.claude/verify/d1-sqlite.js');
let checks=0;const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
const now=Date.now(),uid='p_pro',owner='synthetic-owner';
function fixture(){
 const db=new D1SQLite();db.seed('active-session:'+uid,owner,now+600000);db.seed('openai-access:'+uid,JSON.stringify({version:'2026-10-14',ageBand:'13-17',guardianConsent:true,approved:true}));
 const env={AUTH_DB:db,APP_ORIGIN:'https://synthetic.invalid',SUBSCRIPTION_PREVIEW:'1',PREVIEW_PLAN_ACCOUNTS:'1',PLAN_CREDITS_V2:'1',OPENAI_ENABLED:'1',OPENAI_TRIAL_ONLY:'1',OPENAI_SAFETY_READY:'1',OPENAI_TERMS_READY:'1',OPENAI_BILLING_READY:'1',OPENAI_API_KEY:'synthetic-only',OPENAI_MONTHLY_LIMIT_YEN:'800'};return {db,env};
}
const base={summary:'考え方を確かめよう。',strengths:[],checks:[],practice:[]};
for(const n of [0,1,2,3]){
 const {db,env}=fixture(),images=[];let calls=0,generations=0,sent;
 try{
  for(let i=0;i<n;i++){const image=await canonicalImage({width:1,height:1,data:deflateSync(Buffer.from([i*70,0,0,255])).toString('base64')});images.push(image.id);db.seed('learning-image:'+uid+':'+image.id,JSON.stringify(image));}
  const note={id:'note_fixture',revision:1,title:'まとめ',text:n?'':'学び'.repeat(6000),images},id='operation_fixture',selection={id,noteId:note.id,revision:1};
  db.seed('learning-note:'+uid+':'+note.id,JSON.stringify(note));
  const fetcher=async(url,options)=>{
   calls++;const b=JSON.parse(options.body);
   if(url.endsWith('moderations'))return Response.json({results:[{flagged:false}]});
   if(url.endsWith('input_tokens'))return Response.json({object:'response.input_tokens',input_tokens:13000});
   generations++;sent=b;
   const value=n?{...base,imageChecks:images.map((_,image)=>({image,readable:false,observation:'文字を判読できません。',reason:'式を確認できません。',nextStep:'明るい場所で撮り直そう。'}))}:base;
   return Response.json({status:'completed',model:b.model,service_tier:'default',output:[{type:'message',role:'assistant',content:[{type:'output_text',text:JSON.stringify(value)}]}],usage:{input_tokens:13000,output_tokens:300}});
  };
  const req=(path,body)=>new Request(env.APP_ORIGIN+path,{method:body?'POST':'GET',headers:{Origin:env.APP_ORIGIN,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
  const options={owner,now,fetcher,serve:serveNoteAnalysis};
  eq((await noteJobRoute(req('/learning-note-analysis-job',selection),env,{uid},options)).status,200);eq(calls,0);
  let response=await noteAnalysisRoute(req('/learning-note-analysis',selection),env,{uid},options),result=await response.json();assert.equal(response.status,200,JSON.stringify(result));checks++;eq(result.creditsUsed,3*Math.max(1,n));eq(calls,4);eq(generations,1);
  eq((await planStatus(env,uid,now)).dailyUsed,3*Math.max(1,n));
  eq(JSON.parse(db.get('learning-note:'+uid+':'+note.id).v),note);
  if(n)eq(sent.input[0].content.length,n+1);else eq(JSON.parse(sent.input).note.text,note.text);
  const operation=JSON.parse(db.get('openai-operation:'+uid+':'+id).v);eq(operation.state,'done');eq(operation.amount,36098000);eq(db.get(operation.month).v,'36098000');
  response=await noteAnalysisRoute(req('/learning-note-analysis',selection),env,{uid},options);eq(response.status,200);eq((await response.json()).creditsUsed,0);eq(calls,4);
  response=await noteAnalysisRoute(req('/learning-note-analysis?id='+id),env,{uid},options);eq(response.status,200);eq((await response.json()).creditsUsed,0);eq(calls,4);
  db.seed('learning-note:'+uid+':'+note.id,JSON.stringify({...note,text:'変更した版',revision:2}));
  const replay=await serveNoteAnalysis(env,{uid},{noteId:note.id,revision:1},{owner,now,requestId:id,fetcher});eq(replay.cached,true);eq(calls,4);
  db.seed('active-session:'+uid,'different-owner',now+600000);
  eq((await noteAnalysisRoute(req('/learning-note-analysis?id='+id),env,{uid},options)).status,409);eq(calls,4);
 }finally{db.close();}
}
for(const failure of ['foreign','network','consent']){
 const {db,env}=fixture();let calls=0;
 try{
  const image=await canonicalImage({width:1,height:1,data:deflateSync(Buffer.from([0,0,0,255])).toString('base64')});db.seed('learning-image:'+ (failure==='foreign'?'p_unlimit':uid)+':'+image.id,JSON.stringify(image));
  db.seed('learning-note:'+uid+':note_fixture',JSON.stringify({id:'note_fixture',revision:1,title:'まとめ',text:'写真の式を確認したい',images:[image.id]}));
  if(failure==='consent')db.seed('openai-access:'+uid,JSON.stringify({version:'2026-10-14',ageBand:'13-17',guardianConsent:false,approved:true}));
  const run=()=>serveNoteAnalysis(env,{uid},{noteId:'note_fixture',revision:1},{owner,now,requestId:'operation_failure',fetcher:async()=>{calls++;throw Error('network');}});
  const first=await run();eq(first.error,failure==='foreign'?'ai_unsupported':failure==='consent'?'ai_consent_required':'provider_failed');eq(calls,failure==='network'?1:0);
  const second=await run();eq(second.error,failure==='network'?'request_outcome_unknown':first.error);eq(calls,failure==='network'?1:0);
  eq((await planStatus(env,uid,now)).dailyUsed,0);
  if(failure==='network'){const operation=JSON.parse(db.get('openai-operation:'+uid+':operation_failure').v);eq(operation.state,'started');eq(db.get(operation.month).v,'36098000');}
 }finally{db.close();}
}
{
 const {db,env}=fixture();let calls=0;
 try{
  const images=[];
  for(let i=0;i<3;i++){const image=await canonicalImage({width:1,height:1,data:deflateSync(Buffer.from([i*70,0,0,255])).toString('base64')});images.push(image.id);db.seed('learning-image:'+uid+':'+image.id,JSON.stringify(image));}
  const status=await planStatus(env,uid,now);db.seed(status.quotaKey,JSON.stringify({version:2,units:984,calls:492}));
  db.seed('learning-note:'+uid+':note_fixture',JSON.stringify({id:'note_fixture',revision:1,title:'まとめ',text:'写真',images}));
  const r=await serveNoteAnalysis(env,{uid},{noteId:'note_fixture',revision:1},{owner,now,requestId:'quota_fixture',fetcher:async()=>{calls++;throw Error('unexpected');}});
  eq(r.error,'ai_plan');eq(calls,0);eq((await planStatus(env,uid,now)).dailyLeft,8);eq(db.get('openai-operation:'+uid+':quota_fixture'),null);
 }finally{db.close();}
}
{
 const {db,env}=fixture();let calls=0,generations=0;
 try{
  db.seed('learning-note:'+uid+':note_fixture',JSON.stringify({id:'note_fixture',revision:1,title:'まとめ',text:'学び'.repeat(6000),images:[]}));
  const fetcher=async(url,options)=>{
   calls++;
   if(url.endsWith('moderations'))return Response.json({results:[{flagged:false}]});
   if(url.endsWith('input_tokens'))return Response.json({object:'response.input_tokens',input_tokens:13000});
   generations++;const b=JSON.parse(options.body);
   return Response.json({status:'completed',model:b.model,service_tier:'default',output:[{type:'message',role:'assistant',content:[{type:'output_text',text:JSON.stringify(base)}]}],usage:{input_tokens:13000,output_tokens:300}});
  };
  const run=()=>serveNoteAnalysis(env,{uid},{noteId:'note_fixture',revision:1},{owner,now,requestId:'concurrent_fixture',fetcher});
  const responses=await Promise.all([run(),run()]);eq(responses.filter(x=>x.real===true).length,1);eq(generations,1);eq(calls,4);eq((await planStatus(env,uid,now)).dailyUsed,3);
  eq((await run()).cached,true);eq(calls,4);
 }finally{db.close();}
}
console.log('Extended note service: '+checks+' checks passed; real candidate job/context/route/service + SQLite, whole source, photo credits, cached replay, owner isolation, consent and unknown outcome; fake HTTP only');
