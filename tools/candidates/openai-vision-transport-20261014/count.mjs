import {readiness} from '../../../cf-worker/src/openai-policy.mjs';
import {prepareVision,countedVision} from '../../../cf-worker/src/openai-vision.mjs';
// Isolated candidate. Not imported by the application or enabled by key presence.
// Endpoint pricing/permissions must be confirmed before TOKEN_COUNT_READY=1.
export async function countOwnedVision(env,uid,plan,content,ids,{fetcher=fetch,signal,authorize,screenBeforeUpload,reservePreflight}={}){
 if(!readiness(env)||env.OPENAI_BILLING_READY!=='1'||env.OPENAI_TOKEN_COUNT_READY!=='1')return {error:'provider_not_ready'};
 if(!signal||signal.aborted||[authorize,screenBeforeUpload,reservePreflight].some(f=>typeof f!=='function'))return {error:'control_unavailable'};
 let reader;
 try{
  if(await authorize()!==true)return {error:'not_authorized'};
  const prepared=await prepareVision(env.AUTH_DB,uid,plan,content,ids);
  if(await screenBeforeUpload(prepared)!==true)return {error:'content_blocked'};
  // Both rate/trial and the confirmed endpoint charge allowance must be held
  // before uploading image bytes, even though this does not generate an answer.
  if(await reservePreflight()!==true)return {error:'ai_budget'};
  if(signal.aborted||await authorize()!==true)return {error:'not_authorized'};
  const response=await fetcher('https://api.openai.com/v1/responses/input_tokens',{method:'POST',redirect:'error',signal,headers:{'Content-Type':'application/json',Authorization:'Bearer '+env.OPENAI_API_KEY},body:JSON.stringify(prepared.countBody)});
  if(!response.ok||!response.body){await response.body?.cancel();throw Error('count_failed');}
  reader=response.body.getReader();const chunks=[];let size=0;
  const cancel=()=>{reader.cancel().catch(()=>{});};signal.addEventListener('abort',cancel,{once:true});
  try{while(true){if(signal.aborted)throw Error('count_failed');const {done,value}=await reader.read();if(signal.aborted)throw Error('count_failed');if(done)break;size+=value.byteLength;if(size>4096){await reader.cancel();throw Error('count_failed');}chunks.push(value);}}finally{signal.removeEventListener('abort',cancel);reader.releaseLock();reader=null;}
  const bytes=new Uint8Array(size);let at=0;for(const chunk of chunks){bytes.set(chunk,at);at+=chunk.length;}
  const result=countedVision(prepared,JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)));
  if(signal.aborted||await authorize()!==true)return {error:'not_authorized'};
  return result;
 }catch(_){return {error:'image_count_unavailable'};}
}
