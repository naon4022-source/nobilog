// Internal candidate only. No route or implicit fetch. A trusted service must
// supply the shared trial signal, reservation, authorization and owned images.
import {readiness,reserveMicroYen,MODELS} from '../../../cf-worker/src/openai-policy.mjs';
import {post,moderate} from '../../../cf-worker/src/openai-transport.mjs';
import {countedVision} from '../../../cf-worker/src/openai-vision.mjs';
export function visionCeiling(prepared){
 const body=prepared?.body;
 if(body?.model!==MODELS.sol||body.store!==false||body.max_output_tokens!==1024||!Array.isArray(body.input)||body.input.length!==1||!Number.isSafeInteger(prepared.imageCount)||prepared.imageCount<1||prepared.imageCount>3||Object.keys(body).sort().join(',')!=='input,instructions,max_output_tokens,model,reasoning,service_tier,store,text'||JSON.stringify(body.reasoning)!=='{"effort":"low"}'||body.service_tier!=='default'||JSON.stringify(body.text)!=='{"format":{"type":"json_object"}}')throw Error('invalid vision policy');
 // Hold a generation ceiling and an additional input ceiling for preflight.
 // Token-count endpoint pricing is not assumed to be free. No settlement is
 // performed by this candidate when the authoritative bill is unavailable.
 return reserveMicroYen(body.model,32000,body.max_output_tokens)+reserveMicroYen(body.model,32000,1);
}
export async function generateVision(env,prepared,{fetcher,reserve,validate,signal,authorized}={}){
 if(!readiness(env)||env.OPENAI_BILLING_READY!=='1'||env.GEMINI_ENABLED==='1')return {error:'provider_not_ready'};
 if(typeof fetcher!=='function'||typeof reserve!=='function'||typeof validate!=='function'||typeof authorized!=='function'||!signal||signal.aborted)return {error:'control_unavailable'};
 let reserved=false,responseAccepted=false;
 const guard=async()=>{if(signal.aborted||await authorized()!==true)throw Error('session_changed');};
 try{
  const held=visionCeiling(prepared),body=structuredClone(prepared.body),countBody=structuredClone(prepared.countBody);
  const parts=body.input[0]?.content;
  if(!Array.isArray(parts)||parts.length!==prepared.imageCount+1||parts[0]?.type!=='input_text'||typeof parts[0].text!=='string'||!parts[0].text.trim()||parts.slice(1).some(p=>p.type!=='input_image'||p.detail!=='high'||typeof p.image_url!=='string'||!p.image_url.startsWith('data:image/png;base64,')))throw Error('invalid vision input');
  if(JSON.stringify(countBody)!==JSON.stringify({model:body.model,instructions:body.instructions,input:body.input,text:body.text}))throw Error('invalid count policy');
  await guard();if(await reserve(held)!==true)return {error:'ai_budget'};reserved=true;
  const before=[{type:'text',text:parts[0].text},...parts.slice(1).map(p=>({type:'image_url',image_url:{url:p.image_url}}))];
  await guard();await moderate(fetcher,before,env.OPENAI_API_KEY,signal);
  await guard();const count=await post(fetcher,'responses/input_tokens',countBody,env.OPENAI_API_KEY,signal);
  const request=countedVision({...prepared,body},count);
  await guard();const raw=await post(fetcher,'responses',request.body,env.OPENAI_API_KEY,signal);responseAccepted=true;
  if(raw.status!=='completed'||raw.model!==body.model||!Array.isArray(raw.output))throw Error('provider_invalid');
  const output=[];
  for(const item of raw.output){
   if(item.type==='reasoning')continue;
   if(item.type!=='message'||item.role!=='assistant'||!Array.isArray(item.content))throw Error('provider_invalid');
   for(const p of item.content){if(p.type!=='output_text'||typeof p.text!=='string')throw Error('provider_invalid');output.push(p.text);}
  }
  const text=output.join('\n'),u=raw.usage;
  if(!text.trim()||text.length>12000||!u||!Number.isSafeInteger(u.input_tokens)||u.input_tokens<1||u.input_tokens>request.inputUpperBound||!Number.isSafeInteger(u.output_tokens)||u.output_tokens<0||u.output_tokens>body.max_output_tokens)throw Error('provider_invalid');
  const value=validate(text);
  await guard();await moderate(fetcher,text,env.OPENAI_API_KEY,signal);await guard();
  return {real:true,model:body.model,value,usage:{input:u.input_tokens,output:u.output_tokens},countedInputTokens:count.input_tokens,reservedMicroYen:held};
 }catch(error){
  const code=['content_blocked','safety_unavailable','billing_not_ready','session_changed'].includes(error?.message)?error.message:'provider_failed';
  return {error:code,budgetReserved:reserved,...(code==='billing_not_ready'?{retrySafe:!responseAccepted}:{})};
 }
}
