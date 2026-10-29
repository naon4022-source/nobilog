import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {deflateSync} from 'node:zlib';
const {serveAvatar}=await import(process.argv.includes('--main')?new URL('../../../cf-worker/src/openai-avatar-service.mjs',import.meta.url):new URL('./service.mjs',import.meta.url));
import {canonicalImage} from '../../../cf-worker/src/learning-images.mjs';
import {planStatus} from '../../../cf-worker/src/plans.mjs';
import {monthKey} from '../../../cf-worker/src/openai-budget.mjs';
import {trialStatus} from './trial-control.mjs';
const {D1SQLite}=createRequire(import.meta.url)('../../../.claude/verify/d1-sqlite.js');
let checks=0;const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
const now=Date.now(),owner='synthetic-owner',uid='p_unlimit',id='11111111-1111-4111-8111-111111111111';
const approval={version:'2026-10-14',ageBand:'13-17',approved:true,guardianConsent:true};
const rawImage=await canonicalImage({width:1024,height:1024,data:deflateSync(Buffer.alloc(1024*1024*4,255)).toString('base64')});
const image=await canonicalImage({width:384,height:384,data:deflateSync(Buffer.alloc(384*384*4,255)).toString('base64')});
const body={id,intro:'青と猫と読書が好きです。'};
function setup(){
 const db=new D1SQLite(),env={AUTH_DB:db,SUBSCRIPTION_PREVIEW:'1',PREVIEW_PLAN_ACCOUNTS:'1',PLAN_CREDITS_V2:'1',OPENAI_ENABLED:'1',OPENAI_TRIAL_ONLY:'1',OPENAI_SAFETY_READY:'1',OPENAI_TERMS_READY:'1',OPENAI_BILLING_READY:'1',OPENAI_AVATAR_READY:'1',OPENAI_MONTHLY_LIMIT_YEN:'800',OPENAI_API_KEY:'synthetic-only'};
 for(const user of ['p_free','p_mini','p_standard','p_pro','p_unlimit']){db.seed('active-session:'+user,owner,now+120000);db.seed('openai-access:'+user,JSON.stringify(approval));}
 let calls=0;
 const options={owner,now,fetcher:async(url,opts)=>{calls++;if(url.endsWith('moderations'))return Response.json({results:[{flagged:false}]});eq(JSON.parse(opts.body).n,1);return Response.json({data:[{b64_json:rawImage.png}]});}};
 return {db,env,options,calls:()=>calls};
}
{
 const x=setup(),{db,env,options}=x;
 try{
  for(const user of ['p_free','p_mini','p_standard','p_pro'])eq((await serveAvatar(env,{uid:user},body,options)).error,'plan_required');eq(x.calls(),0);
  eq((await serveAvatar(env,{uid},body,{...options,owner:'other-device'})).error,'session_changed');
  const r=await serveAvatar(env,{uid},body,options);eq(r.real,true);eq(r.cached,false);eq(r.creditsUsed,3);eq(x.calls(),3);eq(r.candidates[0].src,'/learning-image?id='+image.id);
  eq((await planStatus(env,uid,now)).dailyUsed,3);eq((await trialStatus(db,now)).used,1);eq(Number(db.get(monthKey(now)).v),50000000);
  eq(!!db.get('learning-image:'+uid+':'+image.id),true);eq(db.get('avatar:'+uid),null);
  const again=await serveAvatar(env,{uid},body,options);eq(again.cached,true);eq(again.creditsUsed,0);eq(x.calls(),3);eq((await planStatus(env,uid,now)).dailyUsed,3);eq(Number(db.get(monthKey(now)).v),50000000);
  eq((await serveAvatar(env,{uid},{...body,intro:'別の色'},options)).error,'id_conflict');eq(x.calls(),3);
  const contract=JSON.parse(db.get('plan:'+uid).v);db.seed('plan:'+uid,JSON.stringify({...contract,plan:'pro',revision:2}));eq((await serveAvatar(env,{uid},body,options)).error,'plan_required');eq(!!db.get('learning-image:'+uid+':'+image.id),true);
  db.seed('plan:'+uid,JSON.stringify({...contract,revision:3}));eq((await serveAvatar(env,{uid},body,options)).cached,true);eq(x.calls(),3);
 }finally{db.close();}
}
for(const kind of ['budget','trial','no-consent','lost-commit','rollback','commit-revoke','capacity','network']){
 const x=setup(),{db,env,options}=x;
 try{
  if(kind==='budget')db.seed(monthKey(now),'799000000');
  if(kind==='trial'){const s=await trialStatus(db,now);db.seed('ai-trial:day:'+s.date,'10');}
  if(kind==='no-consent')db.seed('openai-access:'+uid,JSON.stringify({...approval,guardianConsent:false}));
  if(kind==='capacity')for(let i=0;i<300;i++)db.seed('learning-image:'+uid+':'+String(i).padStart(64,'0'),'{}');
  if(kind==='network'){const original=options.fetcher;options.fetcher=async(...args)=>{const r=await original(...args);if(args[0].endsWith('images/generations'))throw Error('unknown network outcome');return r;};}
  const batch=db.batch.bind(db);let once=true;
  db.batch=async statements=>{
   const completion=x.calls()===3&&statements.length===2;
   if(completion&&once){once=false;if(kind==='rollback')db.failBatchAt=1;if(kind==='commit-revoke')db.seed('openai-access:'+uid,JSON.stringify({...approval,approved:false}));}
   const r=await batch(statements);if(completion&&kind==='lost-commit')throw Error('lost committed reply');return r;
  };
  const r=await serveAvatar(env,{uid},body,options),expected={budget:'ai_budget',trial:'ai_trial_daily','no-consent':'ai_consent_required','lost-commit':'ai_failed',rollback:'ai_failed','commit-revoke':'save_failed',capacity:'save_failed',network:'provider_failed'}[kind];eq(r.error,expected);
  const before=x.calls();db.failBatchAt=-1;
  const retry=await serveAvatar(env,{uid},body,options);eq(x.calls(),before);
  if(kind==='lost-commit'){eq(retry.cached,true);eq((await planStatus(env,uid,now)).dailyUsed,3);eq(!!db.get('learning-image:'+uid+':'+image.id),true);}
  if(['rollback','capacity'].includes(kind)){eq(retry.error,'request_outcome_unknown');eq(db.get('learning-image:'+uid+':'+image.id),null);}
  if(kind==='commit-revoke'){eq(retry.error,'ai_consent_required');eq(db.get('learning-image:'+uid+':'+image.id),null);}
  if(['budget','trial','no-consent'].includes(kind))eq((await planStatus(env,uid,now)).dailyUsed,0);
  if(kind==='network'){eq(retry.error,'request_outcome_unknown');eq(Number(db.get(monthKey(now)).v),50000000);}
 }finally{db.close();}
}
{
 const x=setup(),{db,env,options}=x;let blocked=true,requests=0;const original=options.fetcher;
 options.fetcher=async(...args)=>{requests++;if(blocked)return Response.json({results:[{flagged:true}]});return original(...args);};
 try{
  eq((await serveAvatar(env,{uid},body,options)).error,'content_blocked');eq(requests,1);
  eq((await planStatus(env,uid,now)).dailyUsed,0);eq(Number(db.get(monthKey(now)).v),0);
  eq(JSON.parse(db.get('openai-operation:'+uid+':'+id).v).state,'rejected');
  blocked=false;const retry=await serveAvatar(env,{uid},body,options);eq(retry.real,true);eq(retry.cached,false);eq(requests,4);eq((await planStatus(env,uid,now)).dailyUsed,3);eq(Number(db.get(monthKey(now)).v),50000000);
 }finally{db.close();}
}
console.log('Avatar service candidate: '+checks+' SQLite checks passed; UNLIMIT/consent/owner gates, shared trial/budget, 3 credits, private candidate storage, replay, downgrade/rejoin, lost commit/rollback/revocation/capacity; fake provider only');
