import {planAllows} from '../../../cf-worker/src/plans.mjs';
import {extendedNoteContent as noteContent} from './content.mjs';
const ID=/^[a-zA-Z0-9_-]{8,64}$/,UID=/^(u[12]|p_(free|mini|standard|pro|unlimit))$/;
const reply=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
const key=(uid,noteId)=>'learning-note-job:'+uid+':'+noteId;
export async function readNoteJob(db,uid,noteId){
 if(!UID.test(uid)||typeof noteId!=='string'||!ID.test(noteId))throw Error('invalid_note_job');
 const raw=await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind(key(uid,noteId)).first('v');
 if(!raw)return null;if(raw.length>500)throw Error('invalid_note_job');
 const v=JSON.parse(raw);
 if(Object.keys(v).sort().join(',')!=='id,noteId,revision,state'||typeof v.id!=='string'||!ID.test(v.id)||v.noteId!==noteId||!Number.isSafeInteger(v.revision)||v.revision<1||!['pending','done'].includes(v.state))throw Error('invalid_note_job');
 return v;
}
export async function completeNoteJob(db,uid,selection){
 const job=await readNoteJob(db,uid,selection.noteId);
 if(!job||job.id!==selection.id||job.revision!==selection.revision)return false;
 if(job.state==='done')return true;
 return !!await db.prepare('UPDATE auth_kv SET v=? WHERE k=? AND v=? RETURNING v').bind(JSON.stringify({...job,state:'done'}),key(uid,selection.noteId),JSON.stringify(job)).first('v');
}
// Metadata only: no AI calls or learner text is accepted in this endpoint.
export async function noteJobRoute(request,env,session,{owner,now=Date.now()}={}){
 const uid=session?.uid,db=env.AUTH_DB,url=new URL(request.url),began=performance.now(),clock=()=>now+Math.ceil(performance.now()-began);
 if(!UID.test(uid)||!db||typeof owner!=='string'||!owner)return reply({error:'unauthorized'},401);
 if(url.pathname!=='/learning-note-analysis-job')return reply({error:'not_found'},404);
 const active=async()=>!!await db.prepare('SELECT 1 AS x FROM auth_kv WHERE k=? AND v=? AND expires_at>?').bind('active-session:'+uid,owner,clock()).first('x');
 try{
  if(!await active())return reply({error:'session_changed'},409);
  if(!await planAllows(env,uid,'notes',now))return reply({error:'plan_required',required:'pro'},403);
  if(request.method==='GET'){
   const noteId=url.searchParams.get('noteId');
   if(url.searchParams.size!==1||typeof noteId!=='string'||!ID.test(noteId))return reply({error:'invalid_query'},400);
   const job=await readNoteJob(db,uid,noteId);
   if(!await active()||!await planAllows(env,uid,'notes',clock()))return reply({error:'session_changed'},409);
   return reply({job});
  }
  if(url.search)return reply({error:'invalid_query'},400);
  if(request.method!=='POST')return reply({error:'method_not_allowed'},405);
  if(!env.APP_ORIGIN||request.headers.get('Origin')!==env.APP_ORIGIN)return reply({error:'origin'},403);
  if(!/^application\/json\b/.test(request.headers.get('Content-Type')||''))return reply({error:'content_type'},415);
  let b;
  try{
   if(!request.body||Number(request.headers.get('Content-Length'))>2000)throw Error('body');
   const reader=request.body.getReader(),decoder=new TextDecoder('utf-8',{fatal:true});let size=0,text='';
   try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>2000){await reader.cancel();throw Error('body');}text+=decoder.decode(value,{stream:true});}text+=decoder.decode();}finally{reader.releaseLock();}
   b=JSON.parse(text);
  }catch(_){return reply({error:'invalid_body'},400);}
  if(!b||Object.keys(b).sort().join(',')!=='id,noteId,revision'||typeof b.id!=='string'||!ID.test(b.id)||typeof b.noteId!=='string'||!ID.test(b.noteId)||!Number.isSafeInteger(b.revision)||b.revision<1)return reply({error:'invalid_body'},400);
  const previous=await readNoteJob(db,uid,b.noteId);
  if(previous?.id===b.id&&previous.revision===b.revision){if(!await active()||!await planAllows(env,uid,'notes',clock()))return reply({error:'session_changed'},409);return reply({job:previous,cached:true});}
  if(previous?.id===b.id)return reply({error:'id_conflict'},409);
  if(previous&&(previous.state==='pending'||previous.revision===b.revision))return reply({error:'job_exists',job:previous},409);
  const raw=await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind('learning-note:'+uid+':'+b.noteId).first('v');
  if(!raw)return reply({error:'note_not_found'},404);
  const note=JSON.parse(raw);
  if(note.id!==b.noteId||note.revision!==b.revision)return reply({error:'revision_conflict'},409);
  try{noteContent(note);}catch(_){return reply({error:'unsupported_note'},400);}
  const job={...b,state:'pending'},lease='EXISTS(SELECT 1 FROM auth_kv WHERE k=? AND v=? AND expires_at>?)';
  if(previous)await db.prepare('UPDATE auth_kv SET v=? WHERE k=? AND v=? AND '+lease+' RETURNING v').bind(JSON.stringify(job),key(uid,b.noteId),JSON.stringify(previous),'active-session:'+uid,owner,clock()).first('v');
  else await db.prepare('INSERT INTO auth_kv(k,v,expires_at) SELECT ?,?,0 WHERE '+lease+' ON CONFLICT(k) DO NOTHING RETURNING v').bind(key(uid,b.noteId),JSON.stringify(job),'active-session:'+uid,owner,clock()).first('v');
  if(!await active()||!await planAllows(env,uid,'notes',clock()))return reply({error:'session_changed'},409);
  const authoritative=await readNoteJob(db,uid,b.noteId);
  if(!authoritative||authoritative.id!==b.id||authoritative.revision!==b.revision)return reply({error:'job_exists',job:authoritative},409);
  return reply({job:authoritative,cached:false});
 }catch(_){return reply({error:'job_unavailable'},503);}
}
