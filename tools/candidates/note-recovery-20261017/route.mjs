import {completedNoteResult,commitCompletedNote} from './recovery.mjs';
import {planAllows} from '../../../cf-worker/src/plans.mjs';
import {extendedNoteResponse} from '../../../cf-worker/src/openai-note-extended-content.mjs';
import {readNoteJob,completeNoteJob} from './jobs.mjs';
const ID=/^[a-zA-Z0-9_-]{8,64}$/,UID=/^(u[12]|p_(free|mini|standard|pro|unlimit))$/;
const reply=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
async function readBody(request){
 if(!request.body||Number(request.headers.get('Content-Length'))>2000)throw Error('invalid_body');
 const reader=request.body.getReader(),parts=[];let n=0;
 try{while(true){const r=await reader.read();if(r.done)break;n+=r.value.byteLength;if(n>2000){await reader.cancel();throw Error('invalid_body');}parts.push(r.value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(n);let at=0;for(const p of parts){bytes.set(p,at);at+=p.length;}
 return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
}
// Candidate dependency injection is mandatory: a missing service stays closed.
export async function noteAnalysisRoute(request,env,session,{owner,serve,fetcher,now=Date.now()}={}){
 const uid=session?.uid,db=env.AUTH_DB,url=new URL(request.url),began=performance.now(),clock=()=>now+Math.ceil(performance.now()-began);
 if(!UID.test(uid)||!db||typeof owner!=='string'||!owner)return reply({error:'unauthorized'},401);
 const getId=url.searchParams.get('id');
 if(url.pathname!=='/learning-note-analysis'||(url.search&&!(request.method==='GET'&&url.searchParams.size===1&&typeof getId==='string'&&ID.test(getId))))return reply({error:'invalid_query'},400);
 const active=async()=>!!await db.prepare('SELECT 1 AS x FROM auth_kv WHERE k=? AND v=? AND expires_at>?').bind('active-session:'+uid,owner,clock()).first('x');
 try{
  if(!await active())return reply({error:'session_changed'},409);
  if(!await planAllows(env,uid,'notes',now))return reply({error:'plan_required',required:'pro'},403);
  const readResult=async id=>(await completedNoteResult(db,uid,id))?.item||null;
  if(request.method==='GET'){
   if(!getId)return reply({error:'invalid_query'},400);
   const item=await readResult(getId);
   if(!await active()||!await planAllows(env,uid,'notes',clock()))return reply({error:'session_changed'},409);
   return item?reply({item,cached:true,creditsUsed:0}):reply({error:'not_found'},404);
  }
  if(request.method!=='POST')return reply({error:'method_not_allowed'},405);
  if(!env.APP_ORIGIN||request.headers.get('Origin')!==env.APP_ORIGIN)return reply({error:'origin'},403);
  if(!/^application\/json\b/.test(request.headers.get('Content-Type')||''))return reply({error:'content_type'},415);
  let b;try{b=await readBody(request);}catch(_){return reply({error:'invalid_body'},400);}
  if(!b||Object.keys(b).sort().join(',')!=='id,noteId,revision'||typeof b.id!=='string'||!ID.test(b.id)||typeof b.noteId!=='string'||!ID.test(b.noteId)||!Number.isSafeInteger(b.revision)||b.revision<1)return reply({error:'invalid_body'},400);
  const prior=await readResult(b.id);
  if(prior){if(prior.noteId!==b.noteId||prior.revision!==b.revision)return reply({error:'id_conflict'},409);const job=await readNoteJob(db,uid,b.noteId);if(job?.state==='pending'){const proof=await completedNoteResult(db,uid,b.id);if(!proof||!await commitCompletedNote(db,uid,owner,job,proof,clock()))return reply({error:'save_failed'},503);}else if(!await completeNoteJob(db,uid,b))return reply({error:'save_failed'},503);if(!await active()||!await planAllows(env,uid,'notes',clock()))return reply({error:'session_changed'},409);return reply({item:prior,cached:true,creditsUsed:0});}
  if(typeof serve!=='function')return reply({error:'provider_not_ready'},503);
  const job=await readNoteJob(db,uid,b.noteId);
  if(!job||job.id!==b.id||job.revision!==b.revision)return reply({error:'job_required'},409);
  const result=await serve(env,session,{noteId:b.noteId,revision:b.revision},{owner,fetcher,now,requestId:b.id});
  if(result.error){const status={plan_required:403,ai_consent_required:403,session_changed:409,id_conflict:409,request_outcome_unknown:409,request_in_progress:409,ai_plan:429,ai_budget:429,ai_busy:429,ai_trial_daily:429,ai_unsupported:400};return reply({error:result.error,...(result.trial?{trial:result.trial}:{})},status[result.error]||503);}
  if(!await active()||!await planAllows(env,uid,'notes',clock()))return reply({error:'session_changed'},409);
  const item={id:b.id,noteId:b.noteId,revision:b.revision,analysis:result.value,model:result.model,real:true};
  const saved=await db.prepare('INSERT INTO auth_kv(k,v,expires_at) SELECT ?,?,0 WHERE EXISTS(SELECT 1 FROM auth_kv WHERE k=? AND v=? AND expires_at>?) ON CONFLICT(k) DO NOTHING RETURNING v').bind('learning-note-analysis:'+uid+':'+b.id,JSON.stringify(item),'active-session:'+uid,owner,clock()).first('v');
  const authoritative=await readResult(b.id);
  if(!authoritative)return reply({error:'save_failed'},503);
  if(!await completeNoteJob(db,uid,b))return reply({error:'save_failed'},503);
  if(!await active()||!await planAllows(env,uid,'notes',clock()))return reply({error:'session_changed'},409);
  return reply({item:authoritative,cached:!saved||result.cached===true,creditsUsed:result.cached?0:result.creditsUsed,trial:result.trial});
 }catch(_){return reply({error:'analysis_unavailable'},503);}
}
