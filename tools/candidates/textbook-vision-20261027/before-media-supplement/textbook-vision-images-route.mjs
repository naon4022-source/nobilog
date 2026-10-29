// Candidate only: the application's authenticated router is not connected.
// These endpoints store pixels; they never call an AI provider or change plans.
import {textbookAccess,textbookWriteGuard} from '../../../cf-worker/src/textbook-access.mjs';
import {readPublicTextbookContext} from '../../../cf-worker/src/textbook-ai-context.mjs';
import {textbookChatRequest,textbookReference} from '../../../cf-worker/src/textbook-ai-chat-content.mjs';
import {textbookImageRecord,textbookImageKey,ownedTextbookVisionParts} from './textbook-vision-input.mjs';
const UID=/^(u[124]|p_(free|mini|standard|pro|unlimit))$/,HASH=/^[a-f0-9]{64}$/;
const MAX_BODY=580000;
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cross-Origin-Resource-Policy':'same-origin'};
const reply=(value,status=200)=>Response.json(value,{status,headers});
const keys=(v,names)=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join(',')===names;
function selection(body){
 const {book,anchor,annotationSignature,contextSha256}=body;
 const r=textbookChatRequest({book,anchor,annotationSignature,contextSha256,id:'image_selection_01',text:'図の確認'});
 return {book:r.book,anchor:r.anchor,annotationSignature:r.annotationSignature,contextSha256:r.contextSha256};
}
async function boundedBody(request){
 const declared=request.headers.get('Content-Length');
 if(declared!==null&&(!/^\d+$/.test(declared)||Number(declared)>MAX_BODY))throw Error('invalid_image');
 if(!request.body)throw Error('invalid_image');
 const reader=request.body.getReader(),parts=[];let size=0;
 try{for(;;){const next=await reader.read();if(next.done)break;size+=next.value.byteLength;if(size>MAX_BODY){await reader.cancel();throw Error('invalid_image');}parts.push(next.value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let at=0;for(const part of parts){bytes.set(part,at);at+=part.length;}
 return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
}
async function approved(db,uid,now){
 const raw=await db.prepare('SELECT v FROM auth_kv WHERE k=? AND (expires_at=0 OR expires_at>?)').bind('openai-access:'+uid,now).first('v');
 let row;try{row=JSON.parse(raw);}catch(_){return null;}
 return row?.version==='2026-10-14'&&row.approved===true&&['13-17','adult'].includes(row.ageBand)&&(row.ageBand==='adult'||row.guardianConsent===true)?raw:null;
}
export async function textbookVisionImagesRoute(request,env,session,{owner,readContext=readPublicTextbookContext,now=Date.now()}={}){
 const uid=session?.uid,url=new URL(request.url),saving=url.pathname==='/textbook-ai/images';
 if(!saving&&url.pathname!=='/textbook-ai/image')return reply({error:'not_found'},404);
 if(request.method!==(saving?'POST':'GET'))return reply({error:'method_not_allowed'},405);
 if(typeof uid!=='string'||!UID.test(uid)||(uid.startsWith('p_')&&env.PREVIEW_PLAN_ACCOUNTS!=='1'))return reply({error:'unauthorized'},401);
 if(!env.AUTH_DB||typeof owner!=='string'||!owner||!Number.isSafeInteger(now)||now<0||typeof readContext!=='function')return reply({error:'unavailable'},503);
 if(saving&&(url.search||request.headers.get('Origin')!==env.APP_ORIGIN||!/^https:\/\//.test(env.APP_ORIGIN||'')))return reply({error:'origin'},403);
 if(saving&&!/^application\/json\b/i.test(request.headers.get('Content-Type')||''))return reply({error:'content_type'},415);
 const db=env.AUTH_DB,began=performance.now(),clock=()=>now+Math.ceil(performance.now()-began);
 const active=async()=>!!await db.prepare('SELECT 1 AS x FROM auth_kv WHERE k=? AND v=? AND expires_at>?').bind('active-session:'+uid,owner,clock()).first('x');
 try{
  if(!await active())return reply({error:'session_changed'},409);
  let body;
  try{
   if(saving){body=await boundedBody(request);if(!keys(body,'anchor,annotationSignature,book,contextSha256,pixels'))throw Error();}
   else{
    const names=[...url.searchParams.keys()];
    if(names.length!==5||new Set(names).size!==5||names.sort().join(',')!=='anchor,annotationSignature,book,contextSha256,id')throw Error();
    body=Object.fromEntries(url.searchParams);if(!HASH.test(body.id))throw Error();
   }
   selection(body);
  }catch(_){return reply({error:'invalid_image'},400);}
  const select=selection(body),rights=await textbookAccess(env,uid,clock());
  // Existing owned images remain readable on Free. A new upload is an AI
  // input operation, so it requires the current chat right and consent.
  if(!rights.enabled||saving&&!rights.features.chat)return reply({error:'plan_required'},403);
  const consent=saving?await approved(db,uid,clock()):null;
  if(saving&&!consent)return reply({error:'ai_consent_required'},403);
  const ref=textbookReference(await readContext(env,select));
  if(ref.book!==select.book||ref.anchor!==select.anchor||ref.annotationSignature!==select.annotationSignature||ref.contextSha256!==select.contextSha256)return reply({error:'context_changed'},409);
  if(ref.kind!=='fig')return reply({error:'figure_required'},400);
  const authorized=async()=>{
   if(!await active())return false;
   const current=await textbookAccess(env,uid,clock());
   return current.accessVersion===rights.accessVersion&&current.enabled&&(!saving||current.features.chat&&await approved(db,uid,clock())===consent);
  };
  if(!await authorized())return reply({error:'session_changed'},409);
  if(saving){
   let row;try{row=await textbookImageRecord(ref,body.pixels);}catch(error){return reply({error:error?.message==='context_changed'?'context_changed':'invalid_image'},error?.message==='context_changed'?409:400);}
   const image=row.image,key=textbookImageKey(uid,ref,image.id),prefix='textbook-ai-image:'+uid+':',at=clock();
   const guard=textbookWriteGuard(rights,{uid,owner,feature:'chat',now:at});
   const sql=guard.sql+' AND EXISTS(SELECT 1 FROM auth_kv WHERE k=? AND v=? AND (expires_at=0 OR expires_at>?))';
   const stored=await db.prepare('INSERT INTO auth_kv(k,v,expires_at) SELECT ?,?,0 WHERE '+sql+' AND (SELECT COUNT(*) FROM auth_kv WHERE k>=? AND k<?)<300 ON CONFLICT(k) DO NOTHING RETURNING k').bind(key,JSON.stringify(row),...guard.values,'openai-access:'+uid,consent,at,prefix,prefix+'\uffff').first('k');
   if(!await authorized())return reply({error:'session_changed'},409);
   if(!stored&&!await db.prepare('SELECT 1 AS x FROM auth_kv WHERE k=?').bind(key).first('x'))return reply({error:'image_limit'},409);
   // Validate an existing duplicate too; never acknowledge a corrupt row.
   await ownedTextbookVisionParts(db,uid,{...select,id:'image_check_01',text:'図の確認',images:[image.id]},ref);
   if(!await authorized())return reply({error:'session_changed'},409);
   return reply({item:{id:image.id,width:image.width,height:image.height,bytes:image.bytes},cached:!stored});
  }
  const parts=await ownedTextbookVisionParts(db,uid,{...select,id:'image_read_01',text:'図の確認',images:[body.id]},ref);
  if(!await authorized())return reply({error:'session_changed'},409);
  return new Response(Uint8Array.from(atob(parts[0].image_url.slice('data:image/png;base64,'.length)),c=>c.charCodeAt(0)),{headers:{...headers,'Content-Type':'image/png','Content-Disposition':'inline; filename="nobilog-textbook-figure.png"'}});
 }catch(error){
  const code=error?.message;
  if(['context_changed','context_not_found','release_changed','plan_changed'].includes(code))return reply({error:code},409);
  if(['invalid_textbook_image','invalid_textbook_chat'].includes(code))return reply({error:'image_unavailable'},404);
  return reply({error:'image_unavailable'},503);
 }
}
