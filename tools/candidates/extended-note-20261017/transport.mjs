// Candidate only. The authenticated note service must reserve the global
// budget and supply the shared trial signal before any provider request.
import {requestBody,readiness,reserveMicroYen,MODELS} from '../../../cf-worker/src/openai-policy.mjs';
import {ownedVisionInput,countedVision} from '../../../cf-worker/src/openai-vision.mjs';
import {moderate,post} from '../../../cf-worker/src/openai-transport.mjs';
import {extendedNoteContent} from './content.mjs';
export async function prepareNoteReview(db,uid,plan,note){
 const spec=extendedNoteContent(note);if(spec.noteExact!==true)throw Error('use_text_note_path');
 // Reuse the fixed minors' safety instructions and authenticated model policy.
 // The complete source is bounded separately; it is never silently truncated.
 const policy=requestBody(plan,'note-analysis',{...spec.content,input:'{}'}),pictures=spec.imageIds.length?await ownedVisionInput(db,uid,spec.imageIds):[];
 const body={...policy.body,input:pictures.length?[{role:'user',content:[{type:'input_text',text:spec.content.input},...pictures]}]:spec.content.input};
 return {noteExact:true,body,countBody:{model:body.model,instructions:body.instructions,input:body.input,text:body.text},imageCount:pictures.length,validate:spec.validate};
}
export function noteReviewCeiling(prepared){
 const body=prepared?.body;
 if(prepared?.noteExact!==true||!Number.isInteger(prepared.imageCount)||prepared.imageCount<0||prepared.imageCount>3||body?.model!==MODELS.sol||body.store!==false||body.service_tier!=='default'||body.max_output_tokens!==2048||typeof body.instructions!=='string'||!body.instructions.length||body.instructions.length>12000||JSON.stringify(body.reasoning)!=='{"effort":"low"}'||JSON.stringify(body.text)!=='{"format":{"type":"json_object"}}'||Object.keys(body).sort().join(',')!=='input,instructions,max_output_tokens,model,reasoning,service_tier,store,text')throw Error('invalid_note_policy');
 if(!prepared.imageCount){if(typeof body.input!=='string'||!body.input.length||body.input.length>27000)throw Error('invalid_note_input');}
 else{
  if(!Array.isArray(body.input)||body.input.length!==1||body.input[0]?.role!=='user'||Object.keys(body.input[0]).sort().join(',')!=='content,role')throw Error('invalid_note_input');
  const parts=body.input[0].content;
  if(!Array.isArray(parts)||parts.length!==prepared.imageCount+1||parts[0]?.type!=='input_text'||typeof parts[0].text!=='string'||!parts[0].text.length||parts[0].text.length>27000||Object.keys(parts[0]).sort().join(',')!=='text,type'||parts.slice(1).some(p=>p.type!=='input_image'||p.detail!=='high'||typeof p.image_url!=='string'||!p.image_url.startsWith('data:image/png;base64,')||Object.keys(p).sort().join(',')!=='detail,image_url,type'))throw Error('invalid_note_input');
 }
 if(JSON.stringify(prepared.countBody)!==JSON.stringify({model:body.model,instructions:body.instructions,input:body.input,text:body.text}))throw Error('invalid_note_count_policy');
 // The exact-count endpoint is not assumed free. Keep a separate input ceiling
 // for it, plus the generation ceiling, even after a successful note response.
 return reserveMicroYen(body.model,32000,2048)+reserveMicroYen(body.model,32000,1);
}
export async function generateNoteReview(env,prepared,{fetcher,reserve,signal,authorized}={}){
 if(!readiness(env)||env.OPENAI_BILLING_READY!=='1'||env.GEMINI_ENABLED==='1')return {error:'provider_not_ready'};
 if(typeof fetcher!=='function'||typeof reserve!=='function'||typeof authorized!=='function'||typeof prepared?.validate!=='function'||!signal||signal.aborted)return {error:'control_unavailable'};
 let held=false;
 const guard=async()=>{if(signal.aborted||await authorized()!==true)throw Error('session_changed');};
 const guardedFetch=async(...args)=>{await guard();return fetcher(...args);};
 try{
  const ceiling=noteReviewCeiling(prepared),copy=structuredClone({body:prepared.body,countBody:prepared.countBody}),body=copy.body;
  await guard();if(await reserve(ceiling)!==true)return {error:'ai_budget'};held=true;
  const input=prepared.imageCount?[{type:'text',text:body.input[0].content[0].text},...body.input[0].content.slice(1).map(p=>({type:'image_url',image_url:{url:p.image_url}}))]:body.input;
  await moderate(guardedFetch,input,env.OPENAI_API_KEY,signal);await guard();
  const count=await post(guardedFetch,'responses/input_tokens',copy.countBody,env.OPENAI_API_KEY,signal);await guard();
  const request=countedVision({body},count);
  const raw=await post(guardedFetch,'responses',request.body,env.OPENAI_API_KEY,signal);await guard();
  if(raw.status!=='completed'||raw.model!==body.model||!Array.isArray(raw.output)||(raw.service_tier!==undefined&&raw.service_tier!=='default'))throw Error('provider_invalid');
  const parts=[];
  for(const item of raw.output){
   if(item.type==='reasoning')continue;
   if(item.type!=='message'||item.role!=='assistant'||!Array.isArray(item.content))throw Error('provider_invalid');
   for(const p of item.content){if(p.type!=='output_text'||typeof p.text!=='string')throw Error('provider_invalid');parts.push(p.text);}
  }
  const text=parts.join('\n'),u=raw.usage;
  if(!text.trim()||text.length>12000||!u||!Number.isSafeInteger(u.input_tokens)||u.input_tokens<1||u.input_tokens>request.inputUpperBound||!Number.isSafeInteger(u.output_tokens)||u.output_tokens<0||u.output_tokens>2048)throw Error('provider_invalid');
  const value=prepared.validate(text);await moderate(guardedFetch,text,env.OPENAI_API_KEY,signal);await guard();
  return {real:true,model:body.model,value,usage:{input:u.input_tokens,output:u.output_tokens},countedInputTokens:count.input_tokens,reservedMicroYen:ceiling};
 }catch(error){
  const code=['content_blocked','safety_unavailable','billing_not_ready','session_changed'].includes(error?.message)?error.message:'provider_failed';
  // Preflight may already have been billed; never make an unknown call free.
  return {error:code,budgetReserved:held};
 }
}
