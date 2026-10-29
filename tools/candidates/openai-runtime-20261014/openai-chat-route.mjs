import {serveTextChat} from './openai-tutor-service.mjs';
import {planAllows} from '../../../cf-worker/src/plans.mjs';
const UID=/^(u[12]|p_(free|mini|standard|pro|unlimit))$/;
const ID=/^[a-zA-Z0-9_-]{8,64}$/;
const reply=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
async function boundedBody(request){
 if(!request.body||Number(request.headers.get('Content-Length'))>15000)throw Error('body');
 const reader=request.body.getReader(),chunks=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>15000){await reader.cancel();throw Error('body');}chunks.push(value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let at=0;for(const c of chunks){bytes.set(c,at);at+=c.length;}
 return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
}
function publicItem(row){
 if(!row||row.state!=='done'||typeof row.id!=='string'||!ID.test(row.id)||typeof row.text!=='string'||row.text.length>3000||typeof row.answer!=='string'||row.answer.length>3000||typeof row.mock!=='boolean'||(row.mock===false&&!['gpt-6-luna','gpt-6.1-sol'].includes(row.model))||!Number.isSafeInteger(row.at)||!Array.isArray(row.images||[]))throw Error('invalid_chat_record');
 return {id:row.id,text:row.text,images:row.images||[],answer:row.answer,at:row.at,mock:row.mock===true,...(row.mock===false?{real:true,model:row.model}:{})};
}
export async function openaiChatRoute(request,env,session,{owner,fetcher,now=Date.now()}={}){
 const began=performance.now(),clock=()=>now+Math.ceil(performance.now()-began);
 const uid=session?.uid,db=env.AUTH_DB,url=new URL(request.url);
 if(!UID.test(uid)||!db||typeof owner!=='string'||!owner)return reply({error:'unauthorized'},401);
 if(url.pathname!=='/learning-chat'||url.search)return reply({error:'invalid_query'},400);
 if(!await db.prepare('SELECT 1 AS x FROM auth_kv WHERE k=? AND v=? AND expires_at>?').bind('active-session:'+uid,owner,clock()).first('x'))return reply({error:'session_changed'},409);
 if(!await planAllows(env,uid,'chat',now))return reply({error:'plan_required',required:'pro'},403);
 const prefix='learning-chat:'+uid+':';
 if(request.method==='GET'){
  const rows=(await db.prepare('SELECT v FROM auth_kv WHERE k>=? AND k<? ORDER BY k LIMIT 100').bind(prefix,prefix+'\uffff').all()).results||[];
  try{return reply({items:rows.map(r=>JSON.parse(r.v)).filter(r=>r.state==='done').map(publicItem),provider:'openai'});}catch(_){return reply({error:'record_unavailable'},503);}
 }
 if(request.method!=='POST')return reply({error:'method_not_allowed'},405);
 if(!env.APP_ORIGIN||request.headers.get('Origin')!==env.APP_ORIGIN)return reply({error:'origin'},403);
 if(!/^application\/json\b/.test(request.headers.get('Content-Type')||''))return reply({error:'content_type'},415);
 let b;try{b=await boundedBody(request);}catch(_){return reply({error:'invalid_body'},400);}
 if(!b||!['id,text','id,images,text'].includes(Object.keys(b).sort().join(','))||typeof b.id!=='string'||!ID.test(b.id)||typeof b.text!=='string'||!b.text.trim()||b.text.length>3000||!Array.isArray(b.images||[])||(b.images||[]).length)return reply({error:'invalid_body'},400);
 const key=prefix+b.id;
 try{
  const old=await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind(key).first('v');
  if(old){const row=JSON.parse(old);if(row.text!==b.text||JSON.stringify(row.images||[])!==JSON.stringify(b.images||[]))return reply({error:'id_conflict'},409);if(row.state==='done')return reply({item:publicItem(row),cached:true,mock:row.mock===true});return reply({error:'request_in_progress'},409);}
  const result=await serveTextChat(env,session,b,{requestId:b.id,owner,fetcher,now});
  if(result.error){const status={plan_required:403,ai_plan:429,ai_budget:429,ai_busy:429,ai_trial_daily:429,id_conflict:409,session_changed:409,request_outcome_unknown:409,request_in_progress:409};return reply({error:result.error,...(result.trial?{trial:result.trial}:{})},status[result.error]||503);}
  const item={id:b.id,text:b.text,images:[],at:now,state:'done',mock:false,real:true,model:result.model,answer:result.value.answer};
  const saved=await db.prepare("INSERT INTO auth_kv(k,v,expires_at) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM auth_kv WHERE k=? AND v=? AND expires_at>?) ON CONFLICT(k) DO NOTHING RETURNING v").bind(key,JSON.stringify(item),now+31*86400000,'active-session:'+uid,owner,clock()).first('v');
  if(saved)return reply({item:publicItem(item),cached:result.cached,mock:false,...(result.trial?{trial:result.trial}:{})});
  const latest=await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind(key).first('v');
  if(latest){const row=JSON.parse(latest);if(row.text===b.text)return reply({item:publicItem(row),cached:true,mock:row.mock===true});}
  return reply({error:'save_failed'},503);
 }catch(_){return reply({error:'save_failed'},503);}
}
