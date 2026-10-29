import {readiness,requestBody} from './openai-policy.mjs';
const BASE='https://api.openai.com/v1/';
async function boundedJson(response,signal){
  if(signal.aborted||!response.ok||!response.body){
    // Release an error response without copying its potentially sensitive body.
    if(response.body)await response.body.cancel();
    throw Error('provider_failed');
  }
  const reader=response.body.getReader(),pieces=[];let size=0;
  const cancel=()=>{reader.cancel().catch(()=>{});};
  signal.addEventListener('abort',cancel,{once:true});
  try{while(true){if(signal.aborted)throw Error('provider_failed');const {done,value}=await reader.read();if(signal.aborted)throw Error('provider_failed');if(done)break;size+=value.byteLength;if(size>65536){await reader.cancel();throw Error('provider_invalid');}pieces.push(value);}}finally{signal.removeEventListener('abort',cancel);reader.releaseLock();}
  const bytes=new Uint8Array(size);let at=0;for(const p of pieces){bytes.set(p,at);at+=p.length;}
  return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
}
async function post(fetcher,path,body,key,signal){
  return boundedJson(await fetcher(BASE+path,{method:'POST',redirect:'error',signal,headers:{'Content-Type':'application/json',Authorization:'Bearer '+key},body:JSON.stringify(body)}),signal);
}
async function moderate(fetcher,text,key,signal){
  const r=await post(fetcher,'moderations',{model:'omni-moderation-latest',input:text},key,signal);
  // Missing safety verdict closes the gate; not treated as safe by default.
  if(!Array.isArray(r.results)||r.results.length!==1||typeof r.results[0]?.flagged!=='boolean')throw Error('safety_unavailable');
  if(r.results[0].flagged)throw Error('content_blocked');
}
export async function generate(env,plan,purpose,content,{fetcher=fetch,reserve,validate,signal}={}){
  if(!readiness(env))return {error:'provider_not_ready'};
  if(typeof reserve!=='function'||typeof validate!=='function'||!signal||signal.aborted)return {error:'control_unavailable'};
  let budgetReserved=false;
  try{
    const request=requestBody(plan,purpose,content);
    // Caller must atomically reserve the global monthly budget before any call.
    if(await reserve(request.reservation)!==true)return {error:'ai_budget'};
    budgetReserved=true;
    await moderate(fetcher,content.input,env.OPENAI_API_KEY,signal);
    if(signal.aborted)throw Error('provider_failed');
    const raw=await post(fetcher,'responses',request.body,env.OPENAI_API_KEY,signal);
    if(raw.status!=='completed'||raw.model!==request.body.model||!Array.isArray(raw.output))throw Error('provider_invalid');
    const parts=[];
    for(const item of raw.output){
      if(item.type==='reasoning')continue;
      if(item.type!=='message'||item.role!=='assistant'||!Array.isArray(item.content))throw Error('provider_invalid');
      for(const p of item.content){if(p.type!=='output_text'||typeof p.text!=='string')throw Error('provider_invalid');parts.push(p.text);}
    }
    const answer=parts.join('\n');if(!answer.trim()||answer.length>12000)throw Error('provider_invalid');
    const u=raw.usage;
    if(!u||!Number.isSafeInteger(u.input_tokens)||u.input_tokens<0||u.input_tokens>request.inputUpperBound||!Number.isSafeInteger(u.output_tokens)||u.output_tokens<0||u.output_tokens>request.body.max_output_tokens)throw Error('provider_invalid');
    const value=validate(answer); // Existing tutor JSON/answer-leak checks remain mandatory.
    await moderate(fetcher,answer,env.OPENAI_API_KEY,signal);
    if(signal.aborted)throw Error('provider_failed');
    return {real:true,model:request.body.model,value,usage:{input:u.input_tokens,output:u.output_tokens},reservedMicroYen:request.reservation};
  }catch(error){
    // Never return the provider body, exception detail, key or learner input.
    const code=['content_blocked','safety_unavailable'].includes(error?.message)?error.message:'provider_failed';
    return {error:code,budgetReserved};
  }
}
