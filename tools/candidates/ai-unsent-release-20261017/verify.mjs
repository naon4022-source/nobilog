// Production service/SQL with in-memory SQLite and synthetic provider replies.
// No account, secret store, network, grading or application browser operations.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {deflateSync} from 'node:zlib';
const main=process.argv.includes('--main')||process.argv.includes('--baseline');
const {serveTextChat,serveNoteAnalysis}=await import(main?'../../../cf-worker/src/openai-tutor-service.mjs':'./openai-tutor-service.mjs');
const {serveImageChat}=await import(main?'../../../cf-worker/src/openai-image-service.mjs':'./openai-image-service.mjs');
import {canonicalImage} from '../../../cf-worker/src/learning-images.mjs';
import {planStatus} from '../../../cf-worker/src/plans.mjs';
import {monthKey} from '../../../cf-worker/src/openai-budget.mjs';
const {D1SQLite}=createRequire(import.meta.url)('../../../.claude/verify/d1-sqlite.js');
const uid='p_pro',owner='synthetic-owner',now=Date.now(),id='unsent_operation',key='openai-operation:'+uid+':'+id;
const approval={version:'2026-10-14',ageBand:'13-17',approved:true,guardianConsent:true};
const image=await canonicalImage({width:1,height:1,data:deflateSync(Buffer.from([0,0,0,255])).toString('base64')});
let checks=0;const eq=(a,b,m)=>{assert.deepEqual(a,b,m);checks++;};
async function fixture(kind,mode){
 const db=new D1SQLite(),env={AUTH_DB:db,SUBSCRIPTION_PREVIEW:'1',PREVIEW_PLAN_ACCOUNTS:'1',PLAN_CREDITS_V2:'1',OPENAI_ENABLED:'1',OPENAI_TRIAL_ONLY:'1',OPENAI_SAFETY_READY:'1',OPENAI_TERMS_READY:'1',OPENAI_BILLING_READY:'1',OPENAI_MONTHLY_LIMIT_YEN:'800',OPENAI_API_KEY:'synthetic-only'};
 db.seed('active-session:'+uid,owner,now+600000);db.seed('openai-access:'+uid,JSON.stringify(approval));
 db.seed('learning-image:'+uid+':'+image.id,JSON.stringify(image));
 db.seed('learning-note:'+uid+':note_fixture',JSON.stringify({id:'note_fixture',revision:1,title:'まとめ',text:kind==='note'?'学び'.repeat(6000):'学び',images:kind==='photo'?[image.id]:[]}));
 const quota=await planStatus(env,uid,now);let phase=mode,moderations=0,calls=[],fault=true;
 if(['owner-before','quota-before'].includes(mode)){
  const prepare=db.prepare.bind(db);db.prepare=sql=>{
   const s=prepare(sql);if(!sql.startsWith("UPDATE auth_kv SET v=json_set(v,'$.state','started')"))return s;
   const bind=s.bind.bind(s);s.bind=(...args)=>{const b=bind(...args),first=b.first.bind(b);b.first=async(...values)=>{const row=await first(...values);if(row&&fault){fault=false;if(mode==='owner-before')db.seed('active-session:'+uid,'different-owner',now+600000);else db.seed(quota.quotaKey,JSON.stringify({version:2,units:1000,calls:500}));}return row;};return b;};return s;
  };
 }
 if(['release-rollback','release-lost-ack'].includes(mode)){
  const batch=db.batch.bind(db);db.batch=async statements=>{
   // Inject at the budget release, after the quota refund has completed.
   const started=JSON.parse(db.get(key)?.v||'{}').state==='started';
   const refunded=JSON.parse(db.get(quota.quotaKey)?.v||'{}').units===0;
   if(started&&refunded&&calls.length===1&&fault){fault=false;if(mode==='release-rollback')db.failBatchAt=1;const value=await batch(statements);if(mode==='release-lost-ack')throw Error('Synthetic release acknowledgement lost');return value;}
   return batch(statements);
  };
 }
 const fetcher=async(url,options)=>{
  calls.push(url);const body=JSON.parse(options.body);
  if(url.endsWith('/moderations')){
   moderations++;
   if(moderations===1){
    if(phase==='network-before')throw Error('Synthetic moderation network error');
    if(phase==='malformed-moderation')return Response.json({results:[]});
    if(phase==='owner-after-moderation')db.seed('active-session:'+uid,'different-owner',now+600000);
    if(['flagged-before','release-rollback','release-lost-ack'].includes(phase))return Response.json({results:[{flagged:true}]});
   }
   return Response.json({results:[{flagged:phase==='flagged-after'&&moderations>1}]});
  }
  if(url.endsWith('/input_tokens')){
   if(phase==='count-network')throw Error('Synthetic count response lost');
   return Response.json({object:'response.input_tokens',input_tokens:13000});
  }
  if(phase==='generation-network')throw Error('Synthetic generated response lost');
  const value=['note','photo'].includes(kind)?{summary:'考え方を確かめよう。',strengths:[],checks:[],practice:[],...(kind==='photo'?{imageChecks:[{image:0,readable:false,observation:'文字を判読できません。',reason:'式を確認できません。',nextStep:'明るい場所で撮り直そう。'}]}:{})}:{answer:'最初に条件を確かめよう。'};
  return Response.json({status:'completed',model:body.model,service_tier:'default',output:[{type:'message',role:'assistant',content:[{type:'output_text',text:JSON.stringify(value)}]}],usage:{input_tokens:kind==='text'?100:13000,output_tokens:100}});
 };
 const run=()=>kind==='image'?serveImageChat(env,{uid},{text:'見える問題を説明してください。',images:[image.id]},{requestId:id,owner,now,fetcher}):kind==='text'?serveTextChat(env,{uid},{text:'式の見方を教えてください。',images:[]},{requestId:id,owner,now,fetcher}):serveNoteAnalysis(env,{uid},{noteId:'note_fixture',revision:1},{requestId:id,owner,now,fetcher});
 return {db,env,run,calls,quota,ok:()=>{phase='ok';moderations=0;db.failBatchAt=-1;},row:()=>JSON.parse(db.get(key)?.v||'{}'),amount:()=>Number(db.get(monthKey(now))?.v||0)};
}
for(const kind of ['text','note','photo','image']){
 for(const mode of ['flagged-before','network-before','malformed-moderation','owner-before','quota-before','owner-after-moderation','generation-network','flagged-after','release-rollback','release-lost-ack',...(kind==='text'?[]:['count-network'])]){
  const f=await fixture(kind,mode);
  try{
   const r=await f.run();assert(r.error,kind+' '+mode);checks++;
   const held=['generation-network','flagged-after','count-network','release-rollback'].includes(mode);
   eq(f.row().state,held?'started':'rejected',kind+' '+mode+' journal checkpoint');
   eq(f.amount(),held?f.row().amount:0,kind+' '+mode+' local budget');
   if(mode!=='quota-before')eq((await planStatus(f.env,uid,now)).dailyUsed,0,kind+' '+mode+' credits');
   const requests=f.calls.filter(u=>!u.endsWith('/moderations'));
   eq(requests.length,held?(mode==='count-network'?1:mode==='release-rollback'?0:kind==='text'?1:2):0,kind+' '+mode+' billable request count');
   if(held){const n=f.calls.length;eq((await f.run()).error,'request_outcome_unknown');eq(f.calls.length,n);eq(f.amount(),f.row().amount);}
   else if(['flagged-before','network-before','malformed-moderation','release-lost-ack'].includes(mode)){
    f.ok();const result=await f.run();eq(result.real,true,kind+' '+mode+' explicit retry');
    eq((await planStatus(f.env,uid,now)).dailyUsed,kind==='text'?1:3);
    eq(f.calls.filter(u=>u.endsWith('/responses')).length,1,'only one generation');
    const n=f.calls.length,budget=f.amount();eq((await f.run()).cached,true);eq(f.calls.length,n);eq(f.amount(),budget);
   }
  }finally{f.db.close();}
 }
}
console.log('Unsent AI reservation release: '+checks+' SQLite checks passed; text/long-note/photo-note/image, pre-send refusal/network/owner/quota, counted/issued unknown holds, rollback/lost-ack, explicit retry and cached replay; no network');
