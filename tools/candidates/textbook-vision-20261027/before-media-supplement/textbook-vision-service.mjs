// Candidate only, not routed or enabled. No default provider fetcher: tests
// and the eventual authenticated router must supply an explicitly gated one.
import {readiness} from '../../../cf-worker/src/openai-policy.mjs';
import {budgetLimit} from '../../../cf-worker/src/openai-budget.mjs';
import {trialStatus,runRealAITrial} from '../../../cf-worker/src/ai-trial-control.mjs';
import {textbookAccess,textbookWriteGuard} from '../../../cf-worker/src/textbook-access.mjs';
import {planStatus,planUse} from '../../../cf-worker/src/plans.mjs';
import {creditUnits,creditPolicyOn} from '../../../cf-worker/src/subscription-credits.mjs';
import {textbookChatQuota,reserveTextbookChat,refundTextbookChat} from '../../../cf-worker/src/textbook-ai-quota.mjs';
import {recoverTextbookRefund} from '../../../cf-worker/src/textbook-ai-refund.mjs';
import {readPublicTextbookContext} from '../../../cf-worker/src/textbook-ai-context.mjs';
import {textbookVisionRequest} from './textbook-vision-input.mjs';
import {TEXTBOOK_AI_CONTEXTS} from '../../../cf-worker/src/textbook-ai-context-manifest.mjs';
import {capturedTextbookVision,completedVisionChat,visionOperationId} from './textbook-vision-context.mjs';
import {runTextbookVisionOperation} from './textbook-vision-operation.mjs';
const UID=/^(u[124]|p_(free|mini|standard|pro|unlimit))$/;
const sha=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),v=>v.toString(16).padStart(2,'0')).join('');
const enabled=env=>readiness(env)&&env.OPENAI_BILLING_READY==='1'&&env.GEMINI_ENABLED!=='1';
async function consent(db,uid,now){
 const raw=await db.prepare('SELECT v FROM auth_kv WHERE k=? AND (expires_at=0 OR expires_at>?)').bind('openai-access:'+uid,now).first('v');let r;try{r=JSON.parse(raw);}catch(_){return null;}
 return r?.version==='2026-10-14'&&r.approved===true&&['adult','13-17'].includes(r.ageBand)&&(r.ageBand==='adult'||r.guardianConsent===true)?raw:null;
}
async function recoverVisionCredits(db,uid,id){
 const key='openai-operation:'+uid+':'+id,raw=await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind(key).first('v');let row;try{row=JSON.parse(raw);}catch(_){return false;}
 if(row?.state!=='rejected'||row.visionBillable!==false||!['charged','uncharged'].includes(row.visionCreditState))return false;
 if(row.visionCreditRefunded===true||row.visionCreditState==='uncharged')return true;
 const p=row.visionReceipt;if(p?.version!==1)return false;
 if(p.kind==='plan'){
  // Reuse the existing authoritative once-only legacy/daily credit recovery.
  if(!p.receipt||typeof p.receipt.key!=='string'||!p.receipt.key.startsWith('plan-'))return false;
  if(!Object.hasOwn(row,'textbookReceipt'))await db.prepare("UPDATE auth_kv SET v=json_set(v,'$.textbookReceipt',json(?)) WHERE k=? AND v=? RETURNING v").bind(JSON.stringify(p.receipt),key,raw).first('v');
  if(!await recoverTextbookRefund(db,uid,id))return false;
 }else if(p.kind==='textbook'){
  if(!Array.isArray(p.receipts)||p.receipts.length<1||p.receipts.length>9)return false;
  for(const receipt of p.receipts){
   await refundTextbookChat(db,uid,receipt);
   const saved=JSON.parse(await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind(receipt.receiptKey).first('v'));
   if(saved?.token!==receipt.token||saved.state!=='refunded')return false;
  }
 }else return false;
 const current=await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind(key).first('v'),r=JSON.parse(current);
 if(r.state!=='rejected'||r.token!==row.token||JSON.stringify(r.visionReceipt)!==JSON.stringify(p))return false;
 if(r.visionCreditRefunded===true)return true;
 return !!await db.prepare("UPDATE auth_kv SET v=json_set(v,'$.visionCreditRefunded',json('true')) WHERE k=? AND v=? RETURNING v").bind(key,current).first('v');
}
export async function serveTextbookVision(env,session,body,{owner,fetcher,readContext=readPublicTextbookContext,now=Date.now()}={}){
 const uid=session?.uid;
 if(typeof uid!=='string'||!UID.test(uid)||(uid.startsWith('p_')&&env.PREVIEW_PLAN_ACCOUNTS!=='1')||typeof owner!=='string'||!owner||!env.AUTH_DB||typeof fetcher!=='function'||typeof readContext!=='function'||!Number.isSafeInteger(now)||now<0)return {error:'invalid_request'};
 if(!enabled(env))return {error:'provider_not_ready'};
 if(!budgetLimit(env))return {error:'ai_control_unavailable'};
 let request;try{request=textbookVisionRequest(body);}catch(_){return {error:'invalid_request'};}
 const db=env.AUTH_DB,began=performance.now(),clock=()=>now+Math.ceil(performance.now()-began);
 const active=async()=>!!await db.prepare('SELECT 1 AS x FROM auth_kv WHERE k=? AND v=? AND expires_at>?').bind('active-session:'+uid,owner,clock()).first('x');
 try{
  if(!await active())return {error:'session_changed'};
  const consentRaw=await consent(db,uid,clock());if(!consentRaw)return {error:'ai_consent_required'};
  const rights=await textbookAccess(env,uid,clock());if(!rights.enabled||!rights.features.chat||!['pro','unlimit'].includes(rights.plan))return {error:'plan_required'};
  const authorized=async()=>{
   if(!enabled(env)||!await active()||await consent(db,uid,clock())!==consentRaw||(await trialStatus(db,clock())).stopped)return false;
   const current=await textbookAccess(env,uid,clock());return current.accessVersion===rights.accessVersion&&current.features.chat;
  };
  const id=await visionOperationId(request),key='openai-operation:'+uid+':'+id,priorRaw=await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind(key).first('v');
  const guard=()=>{const at=clock(),g=textbookWriteGuard(rights,{uid,owner,feature:'chat',now:at});return {sql:g.sql+' AND EXISTS(SELECT 1 FROM auth_kv WHERE k=? AND v=? AND (expires_at=0 OR expires_at>?))',values:[...g.values,'openai-access:'+uid,consentRaw,at]};};
  const captured=await capturedTextbookVision(db,uid,request,{plan:rights.plan,env,readContext,now:clock(),guard,operationExists:!!priorRaw}),snapshot=captured.snapshot,ref=snapshot.context;
  if(priorRaw){
   const prior=JSON.parse(priorRaw);if(prior.digest!==snapshot.policyDigest)return {error:'id_conflict'};
   if(prior.state==='done'){
    const item=await completedVisionChat(db,uid,snapshot,prior);if(!await authorized())return {error:'session_changed'};
    return {real:true,cached:true,value:{answer:item.answer},model:item.model,context:item.context,creditsUsed:0};
   }
   if(prior.state==='started')return {error:'outcome_unknown',retrySafe:false};
   if(prior.state==='rejected'&&!await recoverVisionCredits(db,uid,id))return {error:'refund_pending'};
  }
  const entry=TEXTBOOK_AI_CONTEXTS[request.book];
  if(ref.annotationSignature!==entry.annotationSignature||ref.contextSha256!==entry.sha256)return {error:'context_changed'};
  if(snapshot.plan!==rights.plan)return {error:'plan_changed'};
  // Read-only historical preparations cannot reach the transport. A source
  // and plan check above authorizes this exact frozen snapshot for sending.
  const {historical,...prepared}=captured.prepared;
  const units=creditUnits('image_analysis',request.images.length),legacy=rights.mode==='legacy';
  // Legacy monthly contracts count calls. Weighted image credits apply to
  // daily-v2 and textbook-only quotas; do not misreport three old calls.
  const cost=legacy&&!creditPolicyOn(env)?1:units/2;
  const charge=async({token,digest})=>{
   if(!await authorized())return {charged:false,canSend:false};
   if(legacy){
    const receipt={},charged=await planUse(env,db,uid,clock(),receipt,units);
    return {charged,canSend:charged,receipt:charged?{version:1,kind:'plan',receipt}:undefined};
   }
   const receipts=[];
   for(let i=0;i<cost;i++){
    if(!await authorized())break;
    const charged=await reserveTextbookChat(db,rights,{uid,owner,now:clock(),requestId:await sha(id+':'+token+':'+i),fingerprint:digest});
    if(charged.error){if(charged.error!=='quota_or_access_changed')throw Error('credit_outcome_unknown');break;}
    receipts.push(charged.receipt);
   }
   return {charged:receipts.length>0,canSend:receipts.length===cost,receipt:receipts.length?{version:1,kind:'textbook',credits:cost,receipts}:undefined};
  };
  const options={fetcher,authorized,beforeProvider:charge,now:clock()};
  const quota=legacy?await planStatus(env,uid,clock()):await textbookChatQuota(db,rights,{uid,owner,now:clock()});
  if(quota.dailyLeft<cost||quota.aiLeft===0)return {error:'ai_plan'};
  if(!await authorized())return {error:'session_changed'};
  return runRealAITrial(db,async signal=>{
   const result=await runTextbookVisionOperation(db,env,uid,id,prepared,{...options,signal});
   if(result.uncharged){
    const refunded=await recoverVisionCredits(db,uid,id);
    return {...result,creditRefunded:refunded,retrySafe:refunded};
   }
   return {...result,...(result.real?{context:ref,creditsUsed:result.cached?0:cost}:{retrySafe:false})};
  },clock());
 }catch(error){
  if(['context_changed','context_not_found','release_changed','plan_changed','invalid_textbook_image','id_conflict','figure_required'].includes(error?.message))return {error:error.message};
  return {error:'textbook_vision_unavailable'};
 }
}
