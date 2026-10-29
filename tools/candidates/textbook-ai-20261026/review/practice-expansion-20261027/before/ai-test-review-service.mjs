import {readiness} from './openai-policy.mjs';
import {budgetLimit,monthKey} from './openai-budget.mjs';
import {generate} from './openai-transport.mjs';
import {trialStatus,runTestReviewAITrial} from './ai-trial-control.mjs';
import {reservePricedOperation,completePricedOperation} from './openai-priced-operation.mjs';
import {startOperation,rejectUnchargedOperation} from './openai-receipts.mjs';
import {readCompletedTest,completedTestData} from './ai-test-session.mjs';
import {reserveTestReviewCredits,linkTestReviewOperation,refundTestReviewCredits,testReviewCreditSnapshot} from './ai-test-review-credits.mjs';
import {buildTestReviewChunks,testReviewDigest} from './ai-test-review-content.mjs';
import {testReviewRequest,parseTestReviewReply} from './ai-test-review-format.mjs';
import {readTestReviewJob,openTestReviewJob,publicTestReviewJob,testReviewJobAccess,claimTestReviewJob,completeTestReviewChunk,pauseTestReviewJob,requeueTestReviewJob,deferUnclaimedTestReviewJob,finishedTestReviewResult} from './ai-test-review-jobs.mjs';
const UID=/^(?:u[124]|p_(?:free|mini|standard|pro|unlimit))$/,UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const errors=new Set(['invalid_review_request','test_incomplete','test_session_not_found','test_source_changed','plan_required','plan_changed','ai_consent_required','session_changed','id_conflict','content_changed','review_input_too_large','private_chat_input','unsupported_chat_input','review_quota_exhausted','provider_not_ready','ai_trial_daily','ai_stopped','ai_budget']);
const safeError=error=>errors.has(error?.message)?error.message:'save_failed';
const fail=code=>{throw Error(code);};
const ready=env=>env.AI_TEST_REVIEW_ENABLED==='1'&&readiness(env)&&env.GEMINI_ENABLED!=='1'&&env.OPENAI_BILLING_READY==='1';
const queueReady=env=>typeof env.AI_TEST_REVIEW_QUEUE?.send==='function';
const clockFrom=now=>{const began=performance.now();return ()=>now+Math.ceil(performance.now()-began);};
export function testReviewQueueMessage(uid,testSessionId){
 if(typeof uid!=='string'||!UID.test(uid)||typeof testSessionId!=='string'||!UUID.test(testSessionId))fail('invalid_review_request');return {version:1,uid,testSessionId};
}
function messageValid(m){return !!m&&typeof m==='object'&&!Array.isArray(m)&&Object.keys(m).sort().join(',')==='testSessionId,uid,version'&&m.version===1&&typeof m.uid==='string'&&UID.test(m.uid)&&typeof m.testSessionId==='string'&&UUID.test(m.testSessionId);}
const operationRaw=(db,uid,id)=>db.prepare('SELECT v FROM auth_kv WHERE k=?').bind('openai-operation:'+uid+':'+id).first('v');
function operation(raw){try{return raw?JSON.parse(raw):null;}catch{return {state:'invalid'};}}
async function refundWhollyUnissued(env,uid,id,receipt){
 const job=await readTestReviewJob(env.AUTH_DB,uid,id);
 // Unknown/reserved/complete monetary work is not proof of an unissued call.
 if(job)for(const c of job.row.chunks){const op=operation(await operationRaw(env.AUTH_DB,uid,c.id));if(op&&op.state!=='rejected')return false;}
 return refundTestReviewCredits(env,uid,receipt);
}
export async function admitTestReview(env,session,body,{owner,now=Date.now()}={}){
 const uid=session?.uid;if(typeof uid!=='string'||!UID.test(uid)||(uid.startsWith('p_')&&env.PREVIEW_PLAN_ACCOUNTS!=='1')||!env.AUTH_DB||typeof owner!=='string'||!owner||!Number.isSafeInteger(now))return {error:'invalid_review_request'};
 let request;try{request=testReviewRequest(body);testReviewQueueMessage(uid,request.testSessionId);}catch{return {error:'invalid_review_request'};}
 const db=env.AUTH_DB,clock=clockFrom(now);let proof,reservation,queueAttempted=false;
 try{
  const old=await readTestReviewJob(db,uid,request.testSessionId);
  if(old?.row.state==='done')return {...await finishedTestReviewResult(env,uid,request.testSessionId,{owner,now:clock()}),cached:true,creditsUsed:0};
  if(!queueReady(env))return {error:'background_unavailable'};
  const rights=await testReviewJobAccess(env,uid,{owner,now:clock()});
  proof=await readCompletedTest(env,uid,request.testSessionId,{owner,now:clock()});
  const compiled=await buildTestReviewChunks(proof,uid,rights.plan),pending=old?.row.chunks.find(c=>!c.done),prior=pending?operation(await operationRaw(db,uid,pending.id)):null;
  const recoverable=prior?.state==='done'&&prior.digest===pending.digest&&prior.pricing?.model===rights.model;
  if(!ready(env)&&!recoverable)return {error:'provider_not_ready'};
  const credit=await testReviewCreditSnapshot(db,uid,request.testSessionId),held=credit?.row.state==='charged'&&credit.row.fingerprint===compiled.fingerprint;
  if(!held){
   const gate=await trialStatus(db,clock());if(gate.stopped)return {error:'ai_stopped',trial:gate};if(gate.used>=gate.limit)return {error:'ai_trial_daily',trial:gate};
   const cap=budgetLimit(env),raw=await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind(monthKey(clock())).first('v');
   if(!cap||raw!==null&&!/^\d{1,9}$/.test(raw))return {error:'ai_control_unavailable'};
   if((Number(raw)||0)+compiled.chunks[0].policy.reservation>cap)return {error:'ai_budget'};
  }
  reservation=await reserveTestReviewCredits(env,uid,proof,{owner,now:clock()});
  const opened=await openTestReviewJob(env,uid,proof,reservation,{owner,requestId:request.id,now:clock()});
  queueAttempted=true;
  try{await env.AI_TEST_REVIEW_QUEUE.send(testReviewQueueMessage(uid,request.testSessionId));}
  catch{return {error:'enqueue_pending',job:opened.job,creditsUsed:reservation.cached?0:100,retrySafe:true};}
  return {...opened,creditsUsed:reservation.cached?0:100};
 }catch(error){
  // Only an orphaned, still-unissued admission may be returned automatically.
  // If enqueue may have succeeded, keep the receipt for idempotent recovery.
  if(proof&&!queueAttempted){try{
   const snapshot=await testReviewCreditSnapshot(db,uid,request.testSessionId),job=await readTestReviewJob(db,uid,request.testSessionId);
   if(!job&&snapshot?.row.fingerprint===completedTestData(proof,uid).fingerprint)await refundWhollyUnissued(env,uid,request.testSessionId,{key:snapshot.key,token:snapshot.row.token});
  }catch{/* Unknown storage result stays reserved. */}}
  return {error:safeError(error)};
 }
}
const nextDayDelay=now=>Math.max(1,Math.min(43200,Math.ceil((86400000-(now+32400000)%86400000)/1000)+1));
export async function processTestReviewMessage(env,message,{now=Date.now(),fetcher=fetch,canRun=async()=>true}={}){
 if(!messageValid(message)||!env.AUTH_DB||(message.uid.startsWith('p_')&&env.PREVIEW_PLAN_ACCOUNTS!=='1'))return {action:'ack',error:'invalid_review_request'};
 const {uid,testSessionId:id}=message,db=env.AUTH_DB,clock=clockFrom(now);let lease=null,chunk=null,issued=false,started=null,ambiguousCheckpoint=false,knownUnissued=false,blockedReason=null;
 const status=async()=>{const s=await readTestReviewJob(db,uid,id);return s?publicTestReviewJob(s.row):null;};
 const defer=async(code,token=lease?.token)=>{
  if(['ai_busy','ai_trial_daily'].includes(code)){
   if(token)await requeueTestReviewJob(db,uid,id,token,{code,now:clock()});else await deferUnclaimedTestReviewJob(db,uid,id,code,{now:clock()});
   return {action:'retry',delaySeconds:code==='ai_busy'?60:nextDayDelay(clock()),job:await status(),error:code};
  }
  if(token)await pauseTestReviewJob(db,uid,id,token,code,{now:clock()});else await deferUnclaimedTestReviewJob(db,uid,id,code,{now:clock()});
  return {action:'ack',job:await status(),error:code};
 };
 const continueJob=async()=>{
  const current=await readTestReviewJob(db,uid,id);if(current?.row.state==='done')return {action:'ack',job:publicTestReviewJob(current.row)};
  if(!await requeueTestReviewJob(db,uid,id,lease.token,{now:clock()}))return {action:'retry',delaySeconds:60};
  try{await env.AI_TEST_REVIEW_QUEUE.send(testReviewQueueMessage(uid,id));return {action:'ack',job:await status()};}
  catch{return {action:'retry',delaySeconds:60,job:await status()};}
 };
 const stopBeforeWork=async code=>{
  const reply=await defer(code);
  if(reply.job?.state==='paused'){const current=await readTestReviewJob(db,uid,id);if(current)await refundWhollyUnissued(env,uid,id,current.row.receipt);}
  return reply;
 };
 try{
  const saved=await readTestReviewJob(db,uid,id);if(!saved)return {action:'ack',error:'not_found'};
  if(['done','paused','unknown'].includes(saved.row.state)){if(saved.row.state==='paused')await refundWhollyUnissued(env,uid,id,saved.row.receipt);return {action:'ack',job:publicTestReviewJob(saved.row)};}
  if(saved.row.lease&&saved.row.lease.until>clock())return {action:'retry',delaySeconds:Math.max(1,Math.ceil((saved.row.lease.until-clock())/1000))};
  let row=saved.row,index=row.chunks.findIndex(c=>!c.done);chunk=row.chunks[index];
  const old=operation(await operationRaw(db,uid,chunk.id));
  if(old&&old.digest!==chunk.digest)return stopBeforeWork('content_changed');
  // Recover a completed paid result before checking provider flags/daily usage.
  let recoverable=old?.state==='done';
  if(old?.state==='started')return defer('request_outcome_unknown');
  if(!await canRun())return stopBeforeWork('provider_not_ready');
  if(!recoverable&&!ready(env))return stopBeforeWork('provider_not_ready');
  if(!queueReady(env))return stopBeforeWork('provider_not_ready');
  if(!recoverable){const gate=await trialStatus(db,clock());if(gate.stopped)return stopBeforeWork('ai_stopped');if(gate.used>=gate.limit)return defer('ai_trial_daily');}
  lease=await claimTestReviewJob(env,uid,id,{now:clock()});if(!lease)return {action:'retry',delaySeconds:60};
  const claimed=await readTestReviewJob(db,uid,id);if(claimed?.row.lease?.token!==lease.token)return {action:'retry',delaySeconds:60};
  row=claimed.row;index=row.chunks.findIndex(c=>!c.done);
  const proof=await readCompletedTest(env,uid,id,{owner:row.owner,now:clock()}),compiled=await buildTestReviewChunks(proof,uid,row.plan);
  const same=compiled.fingerprint===row.sourceFingerprint&&compiled.model===row.model&&compiled.chunks.length===row.chunks.length&&compiled.chunks.every((c,i)=>c.id===row.chunks[i].id&&c.digest===row.chunks[i].digest);
  if(!same)return defer('content_changed');
  chunk=compiled.chunks[index];
  const currentOperation=operation(await operationRaw(db,uid,chunk.id));recoverable=currentOperation?.state==='done';
  if(currentOperation&&currentOperation.digest!==chunk.digest)return stopBeforeWork('content_changed');
  if(currentOperation?.state==='started')return defer('request_outcome_unknown');
  if(recoverable){if(!await completeTestReviewChunk(env,uid,id,index,lease.token,{now:clock()}))return defer('save_failed');return continueJob();}
  const authorized=async()=>{
   if(!await canRun()){blockedReason='provider_not_ready';return false;}
   try{
    const r=await testReviewJobAccess(env,uid,{owner:row.owner,now:clock()}),current=await readTestReviewJob(db,uid,id),credit=await testReviewCreditSnapshot(db,uid,id);
    const allowed=r.plan===row.plan&&r.model===row.model&&current?.row.state==='running'&&current.row.lease.token===lease.token&&current.row.lease.until>clock()&&credit?.row.token===row.receipt.token&&credit.row.state==='charged';
    if(!allowed)blockedReason='session_changed';return allowed;
   }catch(error){blockedReason=error?.message==='plan_required'?'plan_changed':safeError(error);throw error;}
  };
  const result=await runTestReviewAITrial(db,async signal=>{
   try{
   let op=await reservePricedOperation(db,env,uid,chunk.id,chunk.digest,chunk.policy,clock());if(op.error)return op;
   // A reservation made last month has not authorized new-month spending.
   // Before any dispatch, safely release it and reserve under the current cap.
   for(let turn=0;turn<2&&op.state==='reserved';turn++){
    const reserved=operation(await operationRaw(db,uid,chunk.id));if(reserved?.month===monthKey(clock()))break;
    if(reserved?.state!=='reserved'||reserved.token!==op.token||!await startOperation(db,uid,chunk.id,op.token))return {error:'request_outcome_unknown'};
    started={id:chunk.id,token:op.token};if(!await rejectUnchargedOperation(db,uid,chunk.id,op.token))return {error:'request_outcome_unknown'};started=null;
    op=await reservePricedOperation(db,env,uid,chunk.id,chunk.digest,chunk.policy,clock());if(op.error){
     knownUnissued=true;const cap=budgetLimit(env),budget=await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind(monthKey(clock())).first('v');
     return {error:cap&&/^\d{1,9}$/.test(budget||'0')&&Number(budget||0)+chunk.policy.reservation>cap?'ai_budget':op.error,safeUnissued:true};
    }
   }
   if(op.state==='done')return {cached:true};
   if(op.state!=='reserved'||!await startOperation(db,uid,chunk.id,op.token))return {error:'request_outcome_unknown'};
   started={id:chunk.id,token:op.token};
   if(!await authorized()){knownUnissued=await rejectUnchargedOperation(db,uid,chunk.id,op.token);return {error:'session_changed',safeUnissued:knownUnissued};}
   if(!await linkTestReviewOperation(env,uid,proof,row.receipt,started,{owner:row.owner,now:clock()})){ambiguousCheckpoint=true;return {error:'request_outcome_unknown'};}
   const guardedFetcher=async(...args)=>{
    if(!ready(env)){blockedReason='provider_not_ready';throw Error('generation_not_authorized');}
    if(!await authorized())throw Error('generation_not_authorized');
    if((await trialStatus(db,clock())).stopped){blockedReason='ai_stopped';throw Error('generation_not_authorized');}
    if(args[0]==='https://api.openai.com/v1/responses'&&operation(await operationRaw(db,uid,chunk.id))?.month!==monthKey(clock()))throw Error('month_changed_before_dispatch');
    if(args[0]!=='https://api.openai.com/v1/moderations')issued=true;return fetcher(...args);
   };
   const value=await generate(env,row.plan,'test-review',chunk.content,{fetcher:guardedFetcher,signal,reserve:async amount=>amount===chunk.policy.reservation,validate:raw=>({items:parseTestReviewReply(raw,{questionIds:chunk.questionIds,practiceIdsByQuestion:new Map(chunk.practices.map(p=>[p.questionId,p.ids]))})})});
   if(value.error){
    const safe=!issued||value.error==='billing_not_ready'&&value.retrySafe===true;
    if(safe&&await rejectUnchargedOperation(db,uid,chunk.id,op.token)){knownUnissued=true;return {...value,error:blockedReason||value.error,safeUnissued:true};}
    return {error:'request_outcome_unknown'};
   }
   if(!await authorized())return {error:'request_outcome_unknown'};
   if(!await completePricedOperation(db,uid,chunk.id,op.token,value))return {error:'request_outcome_unknown'};
   return {completed:true};
   }catch(error){
    if(started&&!issued&&!ambiguousCheckpoint&&await rejectUnchargedOperation(db,uid,started.id,started.token)){knownUnissued=true;return {error:safeError(error),safeUnissued:true};}
    return {error:'request_outcome_unknown'};
   }
  },clock());
  // A lost acknowledgement after the priced journal committed is recoverable
  // even if the trial wrapper timed out or returned a storage error afterward.
  const latest=operation(await operationRaw(db,uid,chunk.id));
  if(latest?.state==='done'&&latest.digest===chunk.digest){
   if(!await completeTestReviewChunk(env,uid,id,index,lease.token,{now:clock()}))return defer('save_failed');return continueJob();
  }
  if(latest?.state==='reserved'&&latest.digest===chunk.digest){
   if(!await requeueTestReviewJob(db,uid,id,lease.token,{now:clock()}))return {action:'retry',delaySeconds:60};
   return {action:'retry',delaySeconds:60,job:await status()};
  }
  const code=['ai_busy','ai_trial_daily','ai_stopped','ai_budget','billing_not_ready'].includes(result.error)?result.error:result.safeUnissued?result.error==='plan_required'?'plan_changed':['session_changed','plan_changed','ai_consent_required','provider_not_ready','save_failed'].includes(result.error)?result.error:'provider_failed':'request_outcome_unknown';
  const reply=await defer(code);
  if(result.safeUnissued||result.error==='ai_budget')await refundWhollyUnissued(env,uid,id,row.receipt);
  return reply;
 }catch(error){
  try{const saved=await readTestReviewJob(db,uid,id);if(saved?.row.state==='done')return {action:'ack',job:publicTestReviewJob(saved.row)};}catch{/* Continue with unknown-state handling. */}
  // Before issuance, our own successful start checkpoint can be rejected as
  // uncharged. A repeated/unknown checkpoint is never permission to do this.
  if(started&&!issued&&!ambiguousCheckpoint){try{await rejectUnchargedOperation(db,uid,started.id,started.token);}catch{/* Keep unknown reservation. */}}
  const code=issued&&!knownUnissued?'request_outcome_unknown':error?.message==='plan_required'?'plan_changed':['session_changed','ai_consent_required','plan_changed'].includes(error?.message)?error.message:'save_failed';
  const reply=await defer(code);
  if((!issued||knownUnissued)&&!ambiguousCheckpoint&&reply.job?.state==='paused'){try{const row=await readTestReviewJob(db,uid,id);if(row)await refundWhollyUnissued(env,uid,id,row.row.receipt);}catch{/* Keep unknown reservation. */}}
  return reply;
 }
}
export async function testReviewQueue(batch,env,options={}){
 const expected=env.AI_TEST_REVIEW_QUEUE_NAME||'nobilog-ai-test-review';if(batch.queue!==expected)throw Error('unexpected_review_queue');
 for(const message of batch.messages){
  try{const result=await processTestReviewMessage(env,message.body,options);if(result.action==='retry')message.retry({delaySeconds:result.delaySeconds});else message.ack();}
  catch{message.retry({delaySeconds:60});}
 }
}
