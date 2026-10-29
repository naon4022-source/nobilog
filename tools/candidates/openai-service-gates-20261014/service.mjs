import {readiness,requestBody} from '../../../cf-worker/src/openai-policy.mjs';
import {generate} from '../../../cf-worker/src/openai-transport.mjs';
import {tutorContent} from '../../../cf-worker/src/openai-tutor-bridge.mjs';
import {planStatus,planUse,planRefund} from '../../../cf-worker/src/plans.mjs';
import {runRealAITrial,trialStatus} from '../../../cf-worker/src/ai-trial-control.mjs';
import {reserveOperation,startOperation,completeOperation,rejectUnchargedOperation} from '../../../cf-worker/src/openai-receipts.mjs';
import {hintContext,revealsAnswer} from '../../../cf-worker/src/gemini-tutor.mjs';
import {chatContent,chatResponse} from '../../../cf-worker/src/openai-chat-content.mjs';
import {capturedChatHistory} from '../../../cf-worker/src/openai-chat-context.mjs';
const UID=/^(u[12]|p_(free|mini|standard|pro|unlimit))$/;
async function digest(text){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),v=>v.toString(16).padStart(2,'0')).join('');}
// Internal service only; caller supplies authenticated session and authoritative
// curriculum/attempt, and must validate Origin/body before reaching this method.
async function serveStudyAI(env,session,purpose,feature,buildSpec,{requestId,owner,fetcher=fetch,now=Date.now()}={}){
 if(!readiness(env)||env.GEMINI_ENABLED==='1'||env.OPENAI_BILLING_READY!=='1')return {error:'provider_not_ready'};
 if(!UID.test(session?.uid)||!env.AUTH_DB||typeof owner!=='string'||!owner||typeof requestId!=='string'||!/^[a-zA-Z0-9_-]{8,64}$/.test(requestId))return {error:'invalid_request'};
 const began=performance.now(),clock=()=>now+Math.ceil(performance.now()-began);
 const db=env.AUTH_DB,uid=session.uid;
 const active=await db.prepare('SELECT 1 AS x FROM auth_kv WHERE k=? AND v=? AND expires_at>?').bind('active-session:'+uid,owner,clock()).first('x');
 if(!active)return {error:'session_changed'};
 // This approval record is operator-controlled, not a body field or checkbox.
 const raw=await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind('openai-access:'+uid).first('v');
 let access;try{access=JSON.parse(raw);}catch(_){return {error:'ai_consent_required'};}
 if(!access||access.version!=='2026-10-14'||!['13-17','adult'].includes(access.ageBand)||access.approved!==true||(access.ageBand==='13-17'&&access.guardianConsent!==true))return {error:'ai_consent_required'};
 const status=await planStatus(env,uid,now);
 if(!status.provisional||!status.features?.[feature])return {error:'plan_required'};
 const key='openai-operation:'+uid+':'+requestId;
 const priorRaw=await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind(key).first('v');
 if(!priorRaw){
  if(status.aiLeft===0||status.dailyLeft===0)return {error:'ai_plan'};
  const gate=await trialStatus(db,now);
  if(gate.stopped)return {error:'ai_stopped'};
  if(gate.used>=gate.limit)return {error:'ai_trial_daily',trial:gate};
 }
 let spec,policy;
 try{spec=await buildSpec();policy=requestBody(status.plan,purpose,spec.content);}catch(error){return {error:error?.message==='chat_context_conflict'?'id_conflict':'ai_unsupported'};}
 const hash=await digest(JSON.stringify(policy.body));
 if(priorRaw){
  let prior;try{prior=JSON.parse(priorRaw);}catch(_){return {error:'operation_invalid'};}
  if(prior.digest!==hash)return {error:'id_conflict'};
  if(prior.state==='done'){
   try{return {real:true,model:policy.body.model,value:spec.validate(JSON.stringify(prior.value)),cached:true};}catch(_){return {error:'operation_invalid'};}
  }
  if(prior.state==='started')return {error:'request_outcome_unknown'};
 }
 if(status.aiLeft===0||status.dailyLeft===0)return {error:'ai_plan'};
 return runRealAITrial(db,async signal=>{
  const operation=await reserveOperation(db,env,uid,requestId,hash,policy.reservation,now);
  if(operation.error)return operation;
  if(operation.state!=='reserved')return {error:'request_outcome_unknown'};
  if(!await startOperation(db,uid,requestId,operation.token))return {error:'request_in_progress'};
  if(!await db.prepare('SELECT 1 AS x FROM auth_kv WHERE k=? AND v=? AND expires_at>?').bind('active-session:'+uid,owner,clock()).first('x'))return {error:'session_changed'};
  const receipt={};
  if(!await planUse(env,db,uid,now,receipt))return {error:'ai_plan'};
  const result=await generate(env,status.plan,purpose,spec.content,{fetcher,validate:spec.validate,signal,reserve:async amount=>amount===policy.reservation});
  if(result.error){
   await planRefund(env,db,uid,now,receipt);
   if(result.error==='billing_not_ready'&&result.retrySafe===true&&!await rejectUnchargedOperation(db,uid,requestId,operation.token))result.retrySafe=false;
   return result;
  }
  if(!await db.prepare('SELECT 1 AS x FROM auth_kv WHERE k=? AND v=? AND expires_at>?').bind('active-session:'+uid,owner,clock()).first('x')){await planRefund(env,db,uid,now,receipt);return {error:'session_changed'};}
  // Do not refund an unknown storage outcome: retry reads the committed receipt.
  if(!await completeOperation(db,uid,requestId,operation.token,result.value))return {error:'save_failed'};
  return {...result,cached:false};
 },now);
}

export function serveTutor(env,session,source,purpose,selection,options){
 return serveStudyAI(env,session,purpose,'hints',()=>{
  const spec=tutorContent(source,purpose,selection);
  if(purpose==='hint'){
   const validate=spec.validate,question=hintContext(source,selection.unitId,selection.questionId).question;
   spec.validate=raw=>{const value=validate(raw);if(value.hints.some(h=>/\b(?:answer|solution|correct answer)\s*(?:is|:|=)/i.test(h))||revealsAnswer(value.hints.join(' '),question))throw Error('hint_reveals_answer');return value;};
  }
  return spec;
 },options);
}
export function serveTextChat(env,session,body,options){
 return serveStudyAI(env,session,'chat','chat',async()=>{
  const history=await capturedChatHistory(env.AUTH_DB,session.uid,options.requestId,body);
  return {content:chatContent(body,history),validate:chatResponse};
 },options);
}
