// Candidate only. Registration in the authenticated main router is pending.
import {textbookAccessOn,textbookAccess} from '../../../cf-worker/src/textbook-access.mjs';
import {readiness} from '../../../cf-worker/src/openai-policy.mjs';
import {textbookChatRequest} from '../../../cf-worker/src/textbook-ai-chat-content.mjs';
import {textbookVisionHistory} from './textbook-vision-context.mjs';
import {serveTextbookVision} from './textbook-vision-service.mjs';
const reply=(value,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
async function bodyOf(request){
 if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type')||'')||!request.body)throw Error();
 const declared=request.headers.get('Content-Length');if(declared!==null&&(!/^\d+$/.test(declared)||Number(declared)>18000))throw Error();
 const reader=request.body.getReader(),parts=[];let size=0;
 try{for(;;){const next=await reader.read();if(next.done)break;size+=next.value.byteLength;if(size>18000){await reader.cancel();throw Error();}parts.push(next.value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let at=0;for(const part of parts){bytes.set(part,at);at+=part.length;}return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
}
export async function textbookVisionAIRoute(request,env,session,{owner,fetcher,readContext,now=()=>Date.now()}={}){
 const url=new URL(request.url),uid=session?.uid;
 if(url.pathname!=='/textbook-ai-vision'||!textbookAccessOn(env))return reply({error:'not_found'},404);
 if(typeof uid!=='string'||typeof owner!=='string'||!owner)return reply({error:'unauthorized'},401);
 if(!/^(u[124]|p_(free|mini|standard|pro|unlimit))$/.test(uid)||(uid.startsWith('p_')&&env.PREVIEW_PLAN_ACCOUNTS!=='1'))return reply({error:'forbidden'},403);
 if(!env.AUTH_DB||typeof now!=='function')return reply({error:'unavailable'},503);
 if(!['GET','POST'].includes(request.method))return reply({error:'method_not_allowed'},405);
 const origin=request.headers.get('Origin');if((request.method==='POST'||origin!==null)&&origin!==env.APP_ORIGIN)return reply({error:'origin'},403);
 const active=async()=>!!await env.AUTH_DB.prepare('SELECT 1 AS x FROM auth_kv WHERE k=? AND v=? AND expires_at>?').bind('active-session:'+uid,owner,now()).first('x');
 try{
  if(!await active())return reply({error:'active_session'},409);
  if(request.method==='GET'){
   const names=[...url.searchParams.keys()];
   if(names.some(k=>!['book','anchor','id'].includes(k))||['book','anchor'].some(k=>url.searchParams.getAll(k).length!==1)||url.searchParams.getAll('id').length>1)return reply({error:'invalid_query'},400);
   try{textbookChatRequest({book:url.searchParams.get('book'),anchor:url.searchParams.get('anchor'),id:url.searchParams.get('id')||'history_query',text:'履歴',annotationSignature:'0'.repeat(64),contextSha256:'0'.repeat(64)});}catch(_){return reply({error:'invalid_query'},400);}
   const history=await textbookVisionHistory(env.AUTH_DB,uid,Object.fromEntries(url.searchParams));
   if(!await active())return reply({error:'active_session'},409);
   const rights=await textbookAccess(env,uid,now());if(!await active())return reply({error:'active_session'},409);
   return reply({...history,canSend:rights.enabled&&rights.features.chat&&readiness(env)&&env.OPENAI_BILLING_READY==='1'&&env.GEMINI_ENABLED!=='1'});
  }
  if(url.search)return reply({error:'invalid_query'},400);
  let body;try{body=await bodyOf(request);}catch(_){return reply({error:'invalid_body'},400);}
  const result=await serveTextbookVision(env,session,body,{owner,fetcher,readContext,now:now()});
  const status=!result.error?200:['invalid_request','figure_required'].includes(result.error)?400:['plan_required','ai_consent_required'].includes(result.error)?403:['session_changed','context_changed','id_conflict','plan_changed','outcome_unknown','request_in_progress'].includes(result.error)?409:503;
  return reply(result,status);
 }catch(_){return reply({error:request.method==='GET'?'history_unavailable':'textbook_vision_unavailable'},503);}
}
