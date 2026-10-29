// Authorized server curriculum and attempt only; no client-supplied answers/bank.
import {explanationContext,explanationRequest,explanationResponse,hintContext,hintRequest,hintResponse} from '../../../cf-worker/src/gemini-tutor.mjs';
export function tutorContent(source,purpose,selection){
 let request,validate;
 if(purpose==='hint'){
  const found=hintContext(source,selection.unitId,selection.questionId);
  request=hintRequest(found.context);
  validate=raw=>({hints:hintResponse(raw,found.question)});
 }else if(purpose==='explanation'){
  request=explanationRequest(explanationContext(source,selection.attempt));
  validate=explanationResponse;
 }else throw Error('unsupported_tutor_purpose');
 return {content:{instructions:request.systemInstruction.parts.map(p=>p.text).join('\n'),input:request.contents[0].parts[0].text,maxOutputTokens:1024},validate};
}
