// Isolated implementation candidate. No HTTP route imports this module.
import {readiness} from '../../../cf-worker/src/openai-policy.mjs';
import {planStatus,planUse,planRefund} from '../../../cf-worker/src/plans.mjs';
import {creditPolicyOn} from '../../../cf-worker/src/subscription-credits.mjs';
import {reserveOperation,startOperation,rejectUnchargedOperation} from '../../../cf-worker/src/openai-receipts.mjs';
import {runAvatarAITrial,trialStatus} from './trial-control.mjs';
import {avatarRequest,generateAvatar,AVATAR_RESERVATION_MICROYEN,AVATAR_MODEL} from '../../../cf-worker/src/openai-avatar-transport.mjs';
const UID=/^(u[12]|p_(free|mini|standard|pro|unlimit))$/,ID=/^[a-f0-9-]{36}$/,HASH=/^[a-f0-9]{64}$/;
const approved=x=>x?.version==='2026-10-14'&&x.approved===true&&['13-17','adult'].includes(x.ageBand)&&(x.ageBand!=='13-17'||x.guardianConsent===true);
const digest=async x=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(x))),v=>v.toString(16).padStart(2,'0')).join('');
const result=value=>({real:true,model:AVATAR_MODEL,candidates:[{src:'/learning-image?id='+value.imageId,width:value.width,height:value.height}]});
export async function serveAvatar(env,session,body,{owner,fetcher=fetch,now=Date.now()}={}){
 if(!readiness(env)||env.OPENAI_BILLING_READY!=='1'||env.OPENAI_AVATAR_READY!=='1'||env.GEMINI_ENABLED==='1')return {error:'generator_not_ready'};
 if(!UID.test(session?.uid)||!env.AUTH_DB||!creditPolicyOn(env)||typeof owner!=='string'||!owner||!body||Object.keys(body).sort().join(',')!=='id,intro'||!ID.test(body.id||''))return {error:'invalid_request'};
 const db=env.AUTH_DB,uid=session.uid,began=performance.now(),clock=()=>now+Math.ceil(performance.now()-began);
 const active=()=>db.prepare('SELECT 1 x FROM auth_kv WHERE k=? AND v=? AND expires_at>?').bind('active-session:'+uid,owner,clock()).first('x');
 const consent=async()=>{try{return approved(JSON.parse(await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind('openai-access:'+uid).first('v')));}catch(_){return false;}};
 if(!await active())return {error:'session_changed'};if(!await consent())return {error:'ai_consent_required'};
 const status=await planStatus(env,uid,clock());if(!status.provisional||status.plan!=='unlimit')return {error:'plan_required'};
 const authorized=async()=>{if(!await active()||!await consent())return false;const p=await planStatus(env,uid,clock());return p.provisional&&p.plan==='unlimit'&&p.revision===status.revision;};
 let request;try{request=avatarRequest(body.intro);}catch(_){return {error:'invalid_intro'};}
 const hash=await digest(JSON.stringify(request)),key='openai-operation:'+uid+':'+body.id;
 const raw=await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind(key).first('v');
 if(raw){
  let prior;try{prior=JSON.parse(raw);}catch(_){return {error:'operation_invalid'};}
  if(prior.digest!==hash)return {error:'id_conflict'};
  if(prior.state==='done'){
   const value=prior.value;
   if(value?.version!==1||value.model!==AVATAR_MODEL||!HASH.test(value.imageId||'')||!Number.isSafeInteger(value.width)||value.width<1||value.width>384||value.height!==value.width||!await db.prepare('SELECT 1 x FROM auth_kv WHERE k=?').bind('learning-image:'+uid+':'+value.imageId).first('x'))return {error:'operation_invalid'};
   if(!await authorized())return {error:'session_changed'};return {...result(value),cached:true,creditsUsed:0};
  }
  if(prior.state==='started')return {error:'request_outcome_unknown'};
 }
 if(status.dailyLeft<3)return {error:'ai_plan'};
 const trial=await trialStatus(db,now);if(trial.stopped)return {error:'ai_stopped',trial};if(trial.used>=trial.limit)return {error:'ai_trial_daily',trial};
 return runAvatarAITrial(db,async signal=>{
  const op=await reserveOperation(db,env,uid,body.id,hash,AVATAR_RESERVATION_MICROYEN,now);
  if(op.error)return op;if(op.state!=='reserved')return {error:'request_outcome_unknown'};
  const tagged=await db.prepare("UPDATE auth_kv SET v=json_set(v,'$.kind','avatar','$.imageModel',?) WHERE k=? AND json_extract(v,'$.token')=? AND json_extract(v,'$.state')='reserved' AND (json_type(v,'$.kind') IS NULL OR json_extract(v,'$.kind')='avatar') RETURNING v").bind(AVATAR_MODEL,key,op.token).first('v');
  if(!tagged)return {error:'operation_invalid'};
  if(!await startOperation(db,uid,body.id,op.token))return {error:'request_in_progress'};
  if(!await authorized()){await rejectUnchargedOperation(db,uid,body.id,op.token);return {error:'session_changed'};}
  const receipt={};if(!await planUse(env,db,uid,now,receipt,6)){await rejectUnchargedOperation(db,uid,body.id,op.token);return {error:'ai_plan'};}
  const generated=await generateAvatar(env,body.intro,{fetcher,authorized,signal,reserve:async amount=>amount===AVATAR_RESERVATION_MICROYEN});
  if(generated.error){await planRefund(env,db,uid,now,receipt);if(generated.requestIssued===false)await rejectUnchargedOperation(db,uid,body.id,op.token);return generated;}
  if(!await authorized()){await planRefund(env,db,uid,now,receipt);return {error:'session_changed'};}
  const image=generated.image,prefix='learning-image:'+uid+':',imageKey=prefix+image.id;
  const value={version:1,model:AVATAR_MODEL,imageId:image.id,width:image.width,height:image.height,at:clock()};
  const saved=JSON.stringify({...JSON.parse(await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind(key).first('v')),state:'done',value});
  // The candidate is private and does not replace the current avatar. Store
  // pixels and the completed receipt together, so a lost reply can be replayed.
  const contract=await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind('plan:'+uid).first('v');
  const access=await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind('openai-access:'+uid).first('v');
  if(!contract||!access||!await authorized())return {error:'session_changed'};
  const guard="EXISTS(SELECT 1 FROM auth_kv WHERE k=? AND json_extract(v,'$.token')=? AND json_extract(v,'$.state')='started') AND EXISTS(SELECT 1 FROM auth_kv WHERE k=? AND v=? AND expires_at>?) AND EXISTS(SELECT 1 FROM auth_kv WHERE k=? AND v=?) AND EXISTS(SELECT 1 FROM auth_kv WHERE k=? AND v=?)";
  const args=[key,op.token,'active-session:'+uid,owner,clock(),'plan:'+uid,contract,'openai-access:'+uid,access];
  const commit=await db.batch([
   db.prepare('INSERT INTO auth_kv(k,v,expires_at) SELECT ?,?,0 WHERE '+guard+' AND (EXISTS(SELECT 1 FROM auth_kv WHERE k=?) OR (SELECT COUNT(*) FROM auth_kv WHERE k>=? AND k<?)<300) ON CONFLICT(k) DO NOTHING').bind(imageKey,JSON.stringify(image),...args,imageKey,prefix,prefix+'\uffff'),
   db.prepare('UPDATE auth_kv SET v=? WHERE k=? AND '+guard+' AND EXISTS(SELECT 1 FROM auth_kv WHERE k=?)').bind(saved,key,...args,imageKey)
  ]);
  if(commit[1]?.meta?.changes!==1)return {error:'save_failed'};
  if(!await authorized())return {error:'session_changed'};
  return {...result(value),cached:false,creditsUsed:3};
 },now);
}
