// Isolated candidate: typed money journal only. Session/consent/entitlement,
// shared daily trial and plan-credit receipts belong to the trusted service.
import {reserveOperation,startOperation,completeOperation} from '../../../cf-worker/src/openai-receipts.mjs';
import {readiness} from '../../../cf-worker/src/openai-policy.mjs';
import {chatResponse} from '../../../cf-worker/src/openai-chat-content.mjs';
import {textbookVisionCeiling} from './textbook-vision-input.mjs';
import {generateTextbookVision} from './textbook-vision-transport.mjs';
const UID=/^(u[124]|p_(free|mini|standard|pro|unlimit))$/,ID=/^[a-zA-Z0-9_-]{8,64}$/;
const counter="expires_at=0 AND length(v) BETWEEN 1 AND 9 AND v GLOB '[0-9]*' AND v NOT GLOB '*[^0-9]*'";
const enabled=env=>readiness(env)&&env.OPENAI_BILLING_READY==='1'&&env.GEMINI_ENABLED!=='1';
const sha=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),x=>x.toString(16).padStart(2,'0')).join('');
const keyFor=(uid,id)=>{
 if(typeof uid!=='string'||!UID.test(uid)||typeof id!=='string'||!ID.test(id))throw Error('invalid_operation');
 return 'openai-operation:'+uid+':'+id;
};
async function record(db,key){
 const raw=await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind(key).first('v');
 try{return {raw,row:JSON.parse(raw)};}catch(_){return {raw,row:null};}
}
function matches(row,prepared,price,amount){
 return row?.digest===prepared.requestDigest&&row.amount===amount&&JSON.stringify(row.visionPricing)===JSON.stringify(price)&&!Object.hasOwn(row,'pricing')&&row.visionBillable!==undefined&&typeof row.visionBillable==='boolean';
}
function validatedResult(result,prepared,amount){
 try{
  const usage=result?.usage,value=chatResponse(JSON.stringify(result?.value));
  if(result?.real!==true||result.model!==prepared.body.model||result.reservedMicroYen!==amount||result.billingTier!=='default'||result.billableRequestIssued!==true||!Number.isSafeInteger(result.countedInputTokens)||result.countedInputTokens<1||result.countedInputTokens>31936||!usage||Object.keys(usage).sort().join(',')!=='input,output'||!Number.isSafeInteger(usage.input)||usage.input<1||usage.input>result.countedInputTokens+64||!Number.isSafeInteger(usage.output)||usage.output<0||usage.output>1024||JSON.stringify(value)!==JSON.stringify(result.value))return false;
  return true;
 }catch(_){return false;}
}
// Exact original row + fresh nonce makes a proven-unissued release atomic.
// No release after token counting, even if generation has not started.
async function rejectUnissued(db,key,raw,row){
 if(row?.state!=='started'||row.visionBillable!==false||!Number.isSafeInteger(row.amount)||row.amount<1||!/^openai-budget:20\d{2}-(0[1-9]|1[0-2])$/.test(row.month||''))return false;
 const nonce=crypto.randomUUID(),results=await db.batch([
  db.prepare("UPDATE auth_kv SET v=json_set(v,'$.state','rejected','$.releaseToken',?) WHERE k=? AND v=? AND EXISTS(SELECT 1 FROM auth_kv WHERE k=? AND "+counter+" AND CAST(v AS INTEGER)>=?)").bind(nonce,key,raw,row.month,row.amount),
  db.prepare("UPDATE auth_kv SET v=CAST(CAST(v AS INTEGER)-CAST(? AS INTEGER) AS TEXT) WHERE k=? AND EXISTS(SELECT 1 FROM auth_kv WHERE k=? AND json_extract(v,'$.state')='rejected' AND json_extract(v,'$.releaseToken')=?)").bind(row.amount,row.month,key,nonce)
 ]);
 return results[0]?.meta?.changes===1&&results[1]?.meta?.changes===1;
}
export async function runTextbookVisionOperation(db,env,uid,id,prepared,{fetcher,signal,authorized,now=Date.now()}={}){
 if(!enabled(env))return {error:'provider_not_ready'};
 if(typeof fetcher!=='function'||typeof authorized!=='function'||typeof signal?.aborted!=='boolean'||typeof signal?.addEventListener!=='function'||signal.aborted)return {error:'control_unavailable'};
 let key,fixed,price,amount,token;
 const allowed=async()=>!signal.aborted&&enabled(env)&&await authorized()===true&&!signal.aborted&&enabled(env);
 try{
  key=keyFor(uid,id);fixed=structuredClone(prepared);amount=textbookVisionCeiling(fixed);
  price={version:1,kind:'textbook-vision',model:fixed.body.model,imageCount:fixed.imageCount,bodySha256:await sha(JSON.stringify(fixed.body)),ceilingMicroYen:amount,settlement:'hold-preflight-and-generation'};
  if(!await allowed())return {error:'session_changed'};
  const reserved=await reserveOperation(db,env,uid,id,fixed.requestDigest,amount,now);
  if(reserved.error)return reserved;
  if(reserved.state==='reserved'){
   // Separate typed property keeps legacy text-only settlement unable to
   // consume or release this two-request reservation.
   await db.prepare("UPDATE auth_kv SET v=json_set(v,'$.visionPricing',json(?),'$.visionBillable',json('false')) WHERE k=? AND json_extract(v,'$.token')=? AND json_extract(v,'$.state')='reserved' AND json_type(v,'$.visionPricing') IS NULL AND json_type(v,'$.pricing') IS NULL RETURNING v").bind(JSON.stringify(price),key,reserved.token).first('v');
  }
  const saved=await record(db,key),row=saved.row;
  if(!matches(row,fixed,price,amount))return {error:'operation_invalid'};
  if(!await allowed())return {error:'session_changed'};
  if(row.state==='done'){
   const value=chatResponse(JSON.stringify(row.value));
   if(row.visionBillable!==true||JSON.stringify(value)!==JSON.stringify(row.value))return {error:'operation_invalid'};
   return {real:true,cached:true,value,heldMicroYen:amount};
  }
  if(row.state==='started')return {error:'outcome_unknown',heldMicroYen:amount};
  if(row.state!=='reserved'||row.token!==reserved.token||row.visionBillable!==false)return {error:'operation_invalid'};
  token=row.token;
  if(!await startOperation(db,uid,id,token))return {error:'request_in_progress'};
  const guardedFetch=async(url,options)=>{
   if(!await allowed())throw Error('session_changed');
   if(url==='https://api.openai.com/v1/responses/input_tokens'||url==='https://api.openai.com/v1/responses'){
    const current=await record(db,key);
    if(current.row?.state!=='started'||current.row.token!==token||!matches(current.row,fixed,price,amount))throw Error('operation_invalid');
    // Persist before dispatch. A crash after this checkpoint is unknown,
    // never a reason to retry/release the count or generation reservation.
    const pinned=await db.prepare("UPDATE auth_kv SET v=json_set(v,'$.visionBillable',json('true')) WHERE k=? AND v=? RETURNING v").bind(key,current.raw).first('v');
    if(!pinned)throw Error('operation_invalid');
   }
   if(!await allowed())throw Error('session_changed');
   return fetcher(url,options);
  };
  const result=await generateTextbookVision(env,fixed,{fetcher:guardedFetch,signal,authorized,validate:chatResponse,reserve:async held=>{
   const current=await record(db,key);
   return held===amount&&current.row?.state==='started'&&current.row.token===token&&matches(current.row,fixed,price,amount)&&await allowed();
  }});
  const current=await record(db,key);
  if(current.row?.token!==token||!matches(current.row,fixed,price,amount))return {error:'outcome_unknown',heldMicroYen:amount};
  if(result.real===true){
   if(current.row.state!=='started'||current.row.visionBillable!==true||!validatedResult(result,fixed,amount)||!await allowed())return {error:'outcome_unknown',heldMicroYen:amount};
   if(!await completeOperation(db,uid,id,token,result.value)||!await allowed())return {error:'outcome_unknown',heldMicroYen:amount};
   // Full conservative hold includes the preflight request. No inferred
   // provider invoice or automatic monetary/plan-credit settlement here.
   return {...result,cached:false,heldMicroYen:amount};
  }
  if(current.row.state==='started'&&current.row.visionBillable===false&&await rejectUnissued(db,key,current.raw,current.row))return {error:result.error||'provider_failed',uncharged:true};
  return {error:result.error||'outcome_unknown',heldMicroYen:amount};
 }catch(_){
  // Storage/network exceptions never imply that an issued request was free.
  return {error:token?'outcome_unknown':'operation_unavailable',...(token?{heldMicroYen:amount}:{})};
 }
}
