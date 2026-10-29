import bank from '../../../cf-worker/src/material-bank.mjs';
import {planStatus} from '../../../cf-worker/src/plans.mjs';
import {trialStatus} from '../../../cf-worker/src/ai-trial-control.mjs';
import {readiness,requestBody} from './openai-policy.mjs';
import {budgetLimit} from './openai-budget.mjs';
import {tutorContent} from './openai-tutor-bridge.mjs';
import {serveTutor} from './openai-tutor-service.mjs';
const UID=/^(u[12]|p_(free|mini|standard|pro|unlimit))$/,ID=/^[a-z0-9][a-z0-9_-]{0,120}$/;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const reply=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
async function requestJson(request){
 if(!request.body||Number(request.headers.get('Content-Length'))>512)throw Error('body');
 const reader=request.body.getReader(),parts=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>512){await reader.cancel();throw Error('body');}parts.push(value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let at=0;for(const p of parts){bytes.set(p,at);at+=p.length;}
 return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
}
async function hash(value){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');}
async function tutorRoute(request,env,session,{owner,fetchImpl,now=Date.now()}={}){
 const began=performance.now(),clock=()=>now+Math.ceil(performance.now()-began);
 const uid=session?.uid,db=env.AUTH_DB,url=new URL(request.url),path=url.pathname.replace(/\/+$/,'');
 if(!UID.test(uid)||!db||typeof owner!=='string'||!owner)return reply({error:'unauthorized'},401);
 if(url.search)return reply({error:'invalid_query'},400);
 if(!await db.prepare('SELECT 1 AS x FROM auth_kv WHERE k=? AND v=? AND expires_at>?').bind('active-session:'+uid,owner,clock()).first('x'))return reply({error:'session_changed'},409);
 const status=await planStatus(env,uid,now);
 if(path==='/material-ai-status'){
  if(request.method!=='GET')return reply({error:'method_not_allowed'},405);
  const raw=await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind('openai-access:'+uid).first('v');let access;
  try{access=JSON.parse(raw);}catch(_){access=null;}
  const approved=access?.version==='2026-10-14'&&access.approved===true&&['13-17','adult'].includes(access.ageBand)&&(access.ageBand!=='13-17'||access.guardianConsent===true);
  const available=!!status.features?.hints&&readiness(env)&&env.OPENAI_BILLING_READY==='1'&&env.GEMINI_ENABLED!=='1'&&!!budgetLimit(env)&&approved;
  return reply({available,mock:false,provider:'openai',features:{hints:available,weakness:false},trial:await trialStatus(db,now)});
 }
 if(!['/material-hint','/material-explain'].includes(path))return reply({error:'ai_unsupported'},422);
 if(request.method!=='POST')return reply({error:'method_not_allowed'},405);
 if(!env.APP_ORIGIN||request.headers.get('Origin')!==env.APP_ORIGIN)return reply({error:'origin'},403);
 if(!/^application\/json\b/.test(request.headers.get('Content-Type')||''))return reply({error:'content_type'},415);
 if(!status.features?.hints)return reply({error:'plan_required'},403);
 let b;try{b=await requestJson(request);}catch(_){return reply({error:'invalid_body'},400);}
 if(!b||Array.isArray(b)||typeof b!=='object')return reply({error:'invalid_body'},400);
 const purpose=path==='/material-hint'?'hint':'explanation';let selection,stepKey;
 if(purpose==='hint'){
  if(Object.keys(b).sort().join(',')!=='level,questionId,unitId'||typeof b.unitId!=='string'||!ID.test(b.unitId)||typeof b.questionId!=='string'||!ID.test(b.questionId)||![1,2,3].includes(b.level))return reply({error:'invalid_body'},400);
  selection={unitId:b.unitId,questionId:b.questionId};stepKey='openai-hint-step:'+uid+':'+b.unitId+':'+b.questionId;
  const raw=await db.prepare('SELECT v FROM auth_kv WHERE k=? AND expires_at>?').bind(stepKey,now).first('v');
  if(raw!==null&&!/^[0-3]$/.test(raw))return reply({error:'step_unavailable'},503);
  if(b.level>Number(raw||0)+1)return reply({error:'hint_order'},409);
 }else{
  if(Object.keys(b).join(',')!=='attemptId'||typeof b.attemptId!=='string'||!UUID.test(b.attemptId))return reply({error:'invalid_body'},400);
  const raw=await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind('material-attempt:'+uid+':'+b.attemptId).first('v');
  if(!raw)return reply({error:'unknown_attempt'},404);
  const attempt=JSON.parse(raw);
  if(attempt.result?.correct!==false)return reply({error:'ai_not_needed'},409);
  selection={attempt};
 }
 let id;
 try{
  const spec=tutorContent(bank,purpose,selection);
  if(purpose==='explanation'&&JSON.parse(spec.content.input).correct!==false)return reply({error:'ai_not_needed'},409);
  // One operation contains all three hints. Reloads and subsequent steps reuse
  // it without another paid request; curriculum or model changes change the ID.
  id=await hash(JSON.stringify(requestBody(status.plan,purpose,spec.content).body));
 }catch(_){return reply({error:'ai_unsupported'},422);}
 const result=await serveTutor(env,session,bank,purpose,selection,{requestId:id,owner,fetcher:fetchImpl,now});
 if(result.error){const errors={ai_budget:429,ai_trial_daily:429,ai_busy:429,ai_plan:429,plan_required:403,request_outcome_unknown:409,session_changed:409};return reply({error:result.error,...(result.trial?{trial:result.trial}:{})},errors[result.error]||503);}
 if(purpose==='explanation')return reply({explanation:result.value,real:true,mock:false,model:result.model,cached:result.cached,...(result.trial?{trial:result.trial}:{})});
 const at=clock(),eventId=Array.from(crypto.getRandomValues(new Uint8Array(6)),x=>x.toString(16).padStart(2,'0')).join('');
 const saved=await db.batch([
  db.prepare("INSERT INTO auth_kv(k,v,expires_at) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM auth_kv WHERE k=? AND v=? AND expires_at>?) ON CONFLICT(k) DO UPDATE SET v=CAST(MAX(CAST(auth_kv.v AS INTEGER),CAST(excluded.v AS INTEGER)) AS TEXT),expires_at=excluded.expires_at WHERE EXISTS(SELECT 1 FROM auth_kv WHERE k=? AND v=? AND expires_at>?)").bind(stepKey,String(b.level),at+7*86400000,'active-session:'+uid,owner,at,'active-session:'+uid,owner,at),
  db.prepare("INSERT INTO auth_kv(k,v,expires_at) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM auth_kv WHERE k=? AND v=? AND expires_at>?)").bind('activity:'+uid+':'+String(at).padStart(15,'0')+':'+eventId,JSON.stringify({type:'hint',unitId:b.unitId,questionId:b.questionId,level:b.level,at,mock:false}),at+3650*86400000,'active-session:'+uid,owner,at)
 ]);
 if(saved[0]?.meta?.changes!==1||saved[1]?.meta?.changes!==1)return reply({error:'session_changed'},409);
 return reply({level:b.level,hint:result.value.hints[b.level-1],more:b.level<3,real:true,mock:false,model:result.model,cached:result.cached,...(result.trial?{trial:result.trial}:{})});
}

export async function openaiTutorRoute(request,env,session,helpers){
 try{return await tutorRoute(request,env,session,helpers);}
 catch(_){return reply({error:"ai_control_unavailable"},503);}
}
