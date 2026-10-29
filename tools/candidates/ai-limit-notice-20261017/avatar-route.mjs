// Candidate route, not yet registered in the Worker.
import {planStatus,subscriptionOn} from '../../../cf-worker/src/plans.mjs';
import {creditPolicyOn} from '../../../cf-worker/src/subscription-credits.mjs';
import {connectionStatus} from '../../../cf-worker/src/openai-connection-status.mjs';
import {trialStatus} from '../../../cf-worker/src/ai-trial-control.mjs';
import {budgetLimit,monthKey} from '../../../cf-worker/src/openai-budget.mjs';
import {serveAvatar} from './avatar-service.mjs';
import {AVATAR_MODEL,AVATAR_RESERVATION_MICROYEN} from '../../../cf-worker/src/openai-avatar-transport.mjs';
const UID=/^(u[12]|p_(free|mini|standard|pro|unlimit))$/,HASH=/^[a-f0-9]{64}$/;
const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
async function body(request){
 if(!request.body||Number(request.headers.get('Content-Length'))>4000)throw Error('invalid_body');
 const reader=request.body.getReader(),parts=[];let size=0;
 try{for(;;){const r=await reader.read();if(r.done)break;size+=r.value.length;if(size>4000){await reader.cancel();throw Error('invalid_body');}parts.push(r.value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let at=0;for(const p of parts){bytes.set(p,at);at+=p.length;}return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
}
export async function avatarRoute(request,env,session,{owner,fetcher,now=Date.now()}={}){
 if(!subscriptionOn(env))return reply({error:'not_found'},404);
 const uid=session?.uid,db=env.AUTH_DB,url=new URL(request.url),began=performance.now(),clock=()=>now+Math.ceil(performance.now()-began);
 if(!UID.test(uid)||!db)return reply({error:'unauthorized'},401);
 if(url.search||!['/avatar-generate','/avatar-generations'].includes(url.pathname))return reply({error:'invalid_query'},400);
 try{
  const plan=await planStatus(env,uid,clock());if(!plan.provisional||plan.plan!=='unlimit')return reply({error:'plan_required',required:'unlimit'},403);
  if(url.pathname==='/avatar-generate'){
   if(request.method!=='POST')return reply({error:'method_not_allowed'},405);
   if(!env.APP_ORIGIN||request.headers.get('Origin')!==env.APP_ORIGIN)return reply({error:'origin'},403);
   if(!/^application\/json\b/.test(request.headers.get('Content-Type')||''))return reply({error:'content_type'},415);
   let input;try{input=await body(request);}catch(_){return reply({error:'invalid_body'},400);}
   const r=await serveAvatar(env,session,input,{owner,fetcher,now});
   if(r.error){const code={plan_required:403,ai_consent_required:403,invalid_intro:400,invalid_request:400,session_changed:409,id_conflict:409,request_outcome_unknown:409,request_in_progress:409,ai_plan:429,ai_budget:429,ai_busy:429,ai_trial_daily:429};return reply({error:r.error,real:false,candidates:[],...(r.trial?{trial:r.trial}:{})},code[r.error]||503);}
   return reply(r);
  }
  if(request.method!=='GET')return reply({error:'method_not_allowed'},405);
  const active=()=>typeof owner==='string'&&owner&&db.prepare('SELECT 1 x FROM auth_kv WHERE k=? AND v=? AND expires_at>?').bind('active-session:'+uid,owner,clock()).first('x');
  if(!await active())return reply({error:'session_changed'},409);
  let approved=false;const access=await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind('openai-access:'+uid).first('v');
  if(access){const a=JSON.parse(access);approved=a?.version==='2026-10-14'&&a.approved===true&&['13-17','adult'].includes(a.ageBand)&&(a.ageBand!=='13-17'||a.guardianConsent===true);}
  const trial=await trialStatus(db,clock()),connection=connectionStatus(env,approved,trial),limit=budgetLimit(env),usedRaw=await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind(monthKey(clock())).first('v');
  const used=usedRaw===null?0:/^\d{1,9}$/.test(usedRaw)?Number(usedRaw):Infinity;
  const prefix='openai-operation:'+uid+':';
  const rows=(await db.prepare("SELECT k,v FROM auth_kv WHERE k>=? AND k<? AND json_extract(v,'$.kind')='avatar' ORDER BY CAST(json_extract(v,'$.at') AS INTEGER) DESC,k DESC LIMIT 20").bind(prefix,prefix+'\uffff').all()).results||[];
  const items=[];
  for(const row of rows){
   const r=JSON.parse(row.v),id=row.k.slice(prefix.length);
   if(!/^[a-f0-9-]{36}$/.test(id)||!Number.isSafeInteger(r.at)||r.imageModel!==AVATAR_MODEL||!['reserved','started','done','rejected'].includes(r.state))throw Error('invalid_avatar_record');
   if(r.state!=='done'){items.push({id,at:r.at,state:r.state==='rejected'?'not_sent':'unknown'});continue;}
   const v=r.value;if(v?.version!==1||v.model!==AVATAR_MODEL||!HASH.test(v.imageId||'')||!Number.isSafeInteger(v.width)||v.width<1||v.width>384||v.height!==v.width)throw Error('invalid_avatar_record');
   if(!await db.prepare('SELECT 1 x FROM auth_kv WHERE k=?').bind('learning-image:'+uid+':'+v.imageId).first('x'))throw Error('missing_avatar_image');
   items.push({id,at:r.at,state:'done',src:'/learning-image?id='+v.imageId,width:v.width,height:v.height});
  }
  const latest=await planStatus(env,uid,clock());if(!await active()||latest.plan!=='unlimit'||latest.revision!==plan.revision)return reply({error:'session_changed'},409);
  const ready=connection.ready&&env.OPENAI_AVATAR_READY==='1'&&creditPolicyOn(env)&&!!limit&&used+AVATAR_RESERVATION_MICROYEN<=limit&&latest.dailyLeft>=3;
  const reason=!connection.ready?connection.reason:env.OPENAI_AVATAR_READY!=='1'?'generator_setup':!creditPolicyOn(env)?'controls_unavailable':!limit||!Number.isFinite(used)?'controls_unavailable':used+AVATAR_RESERVATION_MICROYEN>limit?'budget_limit':latest.dailyLeft<3?'plan_limit':null;
  return reply({ready,reason,items,credits:3,trial,trialLeft:Math.max(0,trial.limit-trial.used),dailyLeft:latest.dailyLeft});
 }catch(_){return reply({error:'unavailable'},503);}
}
