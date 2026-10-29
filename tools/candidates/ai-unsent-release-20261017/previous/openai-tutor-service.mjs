import {capturedNote} from './openai-note-context.mjs';
import {extendedNoteContent} from './openai-note-extended-content.mjs';
import {prepareNoteReview,noteReviewCeiling,generateNoteReview} from './openai-note-extended-transport.mjs';
import {reserveOperation,completeOperation} from './openai-receipts.mjs';
import {readiness,requestBody} from './openai-policy.mjs';
import {generate} from './openai-transport.mjs';
import {tutorContent} from './openai-tutor-bridge.mjs';
import {planStatus,planUse,planRefund} from './plans.mjs';
import {runRealAITrial,trialStatus} from './ai-trial-control.mjs';
import {startOperation,rejectUnchargedOperation} from './openai-receipts.mjs';
import {reservePricedOperation,completePricedOperation} from './openai-priced-operation.mjs';
import {hintContext,revealsAnswer} from './gemini-tutor.mjs';
import {chatContent,chatResponse} from './openai-chat-content.mjs';
import {capturedChatHistory} from './openai-chat-context.mjs';
import {creditPolicyOn,creditUnits} from './subscription-credits.mjs';
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
 let units=creditUnits(purpose),needs=creditPolicyOn(env)?units/2:1;
 if(!status.provisional||!status.features?.[feature])return {error:'plan_required'};
 const authorized=async()=>{
  if(!await db.prepare('SELECT 1 AS x FROM auth_kv WHERE k=? AND v=? AND expires_at>?').bind('active-session:'+uid,owner,clock()).first('x'))return false;
  let currentAccess;try{currentAccess=JSON.parse(await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind('openai-access:'+uid).first('v'));}catch(_){return false;}
  if(!currentAccess||currentAccess.version!=='2026-10-14'||currentAccess.approved!==true||!['13-17','adult'].includes(currentAccess.ageBand)||(currentAccess.ageBand==='13-17'&&currentAccess.guardianConsent!==true))return false;
  const current=await planStatus(env,uid,clock());
  return current.provisional&&current.plan===status.plan&&current.revision===status.revision&&current.features?.[feature]===true;
 };
 const guardedFetcher=async(...args)=>{if(!await authorized())throw Error('session_changed');return fetcher(...args);};
 const key='openai-operation:'+uid+':'+requestId;
 const priorRaw=await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind(key).first('v');
 if(!priorRaw){
  if(status.aiLeft===0||status.dailyLeft<needs)return {error:'ai_plan'};
  const gate=await trialStatus(db,now);
  if(gate.stopped)return {error:'ai_stopped',trial:gate};
  if(gate.used>=gate.limit)return {error:'ai_trial_daily',trial:gate};
 }
 let spec,policy;
 try{
  spec=await buildSpec(status.plan);
  if(spec.noteExact===true){
   if(purpose!=='note-analysis'||feature!=='notes')throw Error('invalid_note_policy');
   policy={body:spec.body,reservation:noteReviewCeiling(spec)};
   units=6*Math.max(1,spec.imageCount);needs=creditPolicyOn(env)?units/2:1;
  }else policy=requestBody(status.plan,purpose,spec.content);
 }catch(error){return {error:['chat_context_conflict','note_context_conflict'].includes(error?.message)?'id_conflict':'ai_unsupported'};}
 const hash=await digest(JSON.stringify(policy.body));
 if(priorRaw){
  let prior;try{prior=JSON.parse(priorRaw);}catch(_){return {error:'operation_invalid'};}
  if(prior.digest!==hash)return {error:'id_conflict'};
  if(prior.state==='done'){
   if(!await authorized())return {error:'session_changed'};
   try{return {real:true,model:policy.body.model,value:spec.validate(JSON.stringify(prior.value)),cached:true};}catch(_){return {error:'operation_invalid'};}
  }
  if(prior.state==='started')return {error:'request_outcome_unknown'};
 }
 if(status.aiLeft===0||status.dailyLeft<needs)return {error:'ai_plan'};
 return runRealAITrial(db,async signal=>{
  const operation=spec.noteExact===true?await reserveOperation(db,env,uid,requestId,hash,policy.reservation,now):await reservePricedOperation(db,env,uid,requestId,hash,policy,now);
  if(operation.error)return operation;
  if(operation.state!=='reserved')return {error:'request_outcome_unknown'};
  if(!await startOperation(db,uid,requestId,operation.token))return {error:'request_in_progress'};
  if(!await authorized())return {error:'session_changed'};
  const receipt={};
  if(!await planUse(env,db,uid,now,receipt,units))return {error:'ai_plan'};
  const controls={fetcher:guardedFetcher,validate:spec.validate,signal,reserve:async amount=>amount===policy.reservation,authorized};
  const result=spec.noteExact===true?await generateNoteReview(env,spec,controls):await generate(env,status.plan,purpose,spec.content,controls);
  if(result.error){
   await planRefund(env,db,uid,now,receipt);
   if(result.error==='billing_not_ready'&&result.retrySafe===true&&!await rejectUnchargedOperation(db,uid,requestId,operation.token))result.retrySafe=false;
   return result;
  }
  if(!await authorized()){await planRefund(env,db,uid,now,receipt);return {error:'session_changed'};}
  // Do not refund an unknown storage outcome: retry reads the committed receipt.
  if(!(spec.noteExact===true?await completeOperation(db,uid,requestId,operation.token,result.value):await completePricedOperation(db,uid,requestId,operation.token,result)))return {error:'save_failed'};
  return {...result,cached:false,creditsUsed:needs};
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


export function serveNoteAnalysis(env,session,selection,options){
 return serveStudyAI(env,session,'note-analysis','notes',async plan=>{
  const snapshot=await capturedNote(env.AUTH_DB,session.uid,options.requestId,selection);
  const spec=extendedNoteContent(snapshot);
  return spec.noteExact===true?prepareNoteReview(env.AUTH_DB,session.uid,plan,snapshot):spec;
 },options);
}
