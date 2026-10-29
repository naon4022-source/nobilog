import {countOwnedVision} from './count.mjs';
import {chatResponse} from '../../../cf-worker/src/openai-chat-content.mjs';
import {readiness} from '../../../cf-worker/src/openai-policy.mjs';
async function json(response,signal){
 if(!response.ok||!response.body){await response.body?.cancel();throw Error('provider_failed');}
 const reader=response.body.getReader(),chunks=[];let size=0;
 const cancel=()=>{reader.cancel().catch(()=>{});};signal.addEventListener('abort',cancel,{once:true});
 try{while(true){if(signal.aborted)throw Error('provider_failed');const {done,value}=await reader.read();if(signal.aborted)throw Error('provider_failed');if(done)break;size+=value.byteLength;if(size>65536){await reader.cancel();throw Error('provider_failed');}chunks.push(value);}}finally{signal.removeEventListener('abort',cancel);reader.releaseLock();}
 const bytes=new Uint8Array(size);let at=0;for(const part of chunks){bytes.set(part,at);at+=part.length;}
 return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
}
export async function generateOwnedVision(env,uid,plan,content,ids,options={}){
 const {authorize,screenBeforeUpload,reservePreflight,reserveGeneration,startGeneration,signal,fetcher=fetch}=options;
 if(!readiness(env)||env.OPENAI_BILLING_READY!=='1'||env.OPENAI_VISION_READY!=='1')return {error:'provider_not_ready'};
 if(!signal||signal.aborted||[authorize,screenBeforeUpload,reservePreflight,reserveGeneration,startGeneration].some(f=>typeof f!=='function'))return {error:'control_unavailable'};
 let accepted=false;
 try{
  if(await authorize()!==true)return {error:'not_authorized'};
  // A dedicated local child-safety/privacy screen must reject known or
  // suspected prohibited material before any upload, including token count.
  const counted=await countOwnedVision(env,uid,plan,content,ids,{authorize,screenBeforeUpload,reservePreflight,signal,fetcher});
  if(counted.error)return counted;
  if(await reserveGeneration(counted.reservation)!==true)return {error:'ai_budget'};
  const post=async(path,body)=>{
   if(signal.aborted||await authorize()!==true)throw Error('not_authorized');
   return json(await fetcher('https://api.openai.com/v1/'+path,{method:'POST',redirect:'error',signal,headers:{'Content-Type':'application/json',Authorization:'Bearer '+env.OPENAI_API_KEY},body:JSON.stringify(body)}),signal);
  };
  const check=async input=>{const r=await post('moderations',{model:'omni-moderation-latest',input});if(!Array.isArray(r.results)||r.results.length!==1||typeof r.results[0]?.flagged!=='boolean')throw Error('safety_unavailable');if(r.results[0].flagged)throw Error('content_blocked');};
  const parts=counted.body.input[0].content;
  await check(parts.map(p=>p.type==='input_text'?{type:'text',text:p.text}:{type:'image_url',image_url:{url:p.image_url}}));
  // The caller must CAS the paid operation from reserved to started. A retry
  // may replay saved results, but it cannot invoke this generator twice.
  if(await startGeneration()!==true)return {error:'request_outcome_unknown'};
  const raw=await post('responses',counted.body);accepted=true;
  if(raw.status!=='completed'||raw.model!==counted.body.model||!Array.isArray(raw.output))throw Error('provider_failed');
  const text=[];for(const item of raw.output){if(item.type==='reasoning')continue;if(item.type!=='message'||item.role!=='assistant'||!Array.isArray(item.content))throw Error('provider_failed');for(const p of item.content){if(p.type!=='output_text'||typeof p.text!=='string')throw Error('provider_failed');text.push(p.text);}}
  const usage=raw.usage;if(!usage||!Number.isSafeInteger(usage.input_tokens)||usage.input_tokens<0||usage.input_tokens>counted.inputUpperBound||!Number.isSafeInteger(usage.output_tokens)||usage.output_tokens<0||usage.output_tokens>counted.body.max_output_tokens)throw Error('provider_failed');
  const answer=text.join('\n'),value=chatResponse(answer);
  await check(answer);
  if(signal.aborted||await authorize()!==true)throw Error('not_authorized');
  return {real:true,model:counted.body.model,value,usage:{input:usage.input_tokens,output:usage.output_tokens},reservedMicroYen:counted.reservation};
 }catch(error){return {error:['content_blocked','safety_unavailable','not_authorized'].includes(error?.message)?error.message:'provider_failed',responseAccepted:accepted};}
}
