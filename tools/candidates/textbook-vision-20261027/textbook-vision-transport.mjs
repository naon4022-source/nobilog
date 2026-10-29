// Internal candidate. A trusted service must own the durable money/credit
// journal and shared trial signal. This module never retries or refunds.
import {readiness} from '../../../cf-worker/src/openai-policy.mjs';
import {post,moderate} from '../../../cf-worker/src/openai-transport.mjs';
import {textbookVisionCeiling,countedTextbookVision} from './textbook-vision-input.mjs';
const enabled=env=>readiness(env)&&env.OPENAI_BILLING_READY==='1'&&env.GEMINI_ENABLED!=='1';
export async function generateTextbookVision(env,prepared,{fetcher,reserve,validate,signal,authorized}={}){
 if(!enabled(env))return {error:'provider_not_ready'};
 if(typeof fetcher!=='function'||typeof reserve!=='function'||typeof validate!=='function'||typeof authorized!=='function'||typeof signal?.aborted!=='boolean'||typeof signal?.addEventListener!=='function'||signal.aborted)return {error:'control_unavailable'};
 let reserved=false,billable=false,responseAccepted=false;
 const guard=async()=>{
  if(signal.aborted)throw Error('session_changed');
  if(!enabled(env))throw Error('provider_not_ready');
  if(await authorized()!==true||signal.aborted)throw Error('session_changed');
  if(!enabled(env))throw Error('provider_not_ready');
 };
 const controlled=async(url,options)=>{
  if(!['https://api.openai.com/v1/moderations','https://api.openai.com/v1/responses/input_tokens','https://api.openai.com/v1/responses'].includes(url))throw Error('provider_invalid');
  await guard();
  if(url!=='https://api.openai.com/v1/moderations')billable=true;
  return fetcher(url,options);
 };
 try{
  const fixed=structuredClone(prepared),held=textbookVisionCeiling(fixed),body=fixed.body,countBody=fixed.countBody,parts=body.input[0].content;
  await guard();if(await reserve(held)!==true)return {error:'ai_budget',budgetReserved:false,billableRequestIssued:false};reserved=true;
  const moderation=[{type:'text',text:parts[0].text},...parts.slice(1).map(p=>({type:'image_url',image_url:{url:p.image_url}}))];
  await moderate(controlled,moderation,env.OPENAI_API_KEY,signal);
  const count=await post(controlled,'responses/input_tokens',countBody,env.OPENAI_API_KEY,signal);
  const counted=countedTextbookVision(fixed,count);
  const raw=await post(controlled,'responses',counted.body,env.OPENAI_API_KEY,signal);responseAccepted=true;
  if(raw.status!=='completed'||raw.model!==body.model||raw.service_tier!=='default'||!Array.isArray(raw.output))throw Error('provider_invalid');
  const output=[];
  for(const item of raw.output){
   if(item?.type==='reasoning')continue;
   if(item?.type!=='message'||item.role!=='assistant'||!Array.isArray(item.content))throw Error('provider_invalid');
   for(const part of item.content){if(part?.type!=='output_text'||typeof part.text!=='string')throw Error('provider_invalid');output.push(part.text);}
  }
  const text=output.join('\n'),usage=raw.usage;
  if(!text.trim()||text.length>12000||!usage||!Number.isSafeInteger(usage.input_tokens)||usage.input_tokens<1||usage.input_tokens>counted.inputUpperBound||!Number.isSafeInteger(usage.output_tokens)||usage.output_tokens<0||usage.output_tokens>body.max_output_tokens)throw Error('provider_invalid');
  const value=validate(text);await guard();await moderate(controlled,text,env.OPENAI_API_KEY,signal);await guard();
  return {real:true,model:body.model,value,usage:{input:usage.input_tokens,output:usage.output_tokens},billingTier:'default',countedInputTokens:count.input_tokens,reservedMicroYen:held,billableRequestIssued:billable};
 }catch(error){
  const code=['content_blocked','safety_unavailable','billing_not_ready','session_changed','provider_not_ready'].includes(error?.message)?error.message:error?.message==='invalid_textbook_vision_policy'?'ai_unsupported':'provider_failed';
  return {error:code,budgetReserved:reserved,billableRequestIssued:billable,responseAccepted};
 }
}
