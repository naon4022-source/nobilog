// Authenticated HTTP adapter candidate, not mounted in the main Worker.
// The caller supplies existing authorization/origin/body-reader contracts.
import {createBattleService} from './battle-service.mjs';
import {createQuizService} from './quiz-service.mjs';
import {readEquipment,initializeEquipment,purchaseEquipment,saveEquippedItem} from './equipment-store.mjs';
import {equipment} from './equipment.mjs';
import {createInvitedParty,requestPartyJoin,ownJoinStatus,pendingPartyJoins,approvePartyJoin,rejectPartyJoin} from './invitation-store.mjs';
import {readOwnParty} from './party-store.mjs';
import story from './story-catalog.mjs';
import {findOwnResume} from './resume-store.mjs';
import {readCampaignProgress} from './progress-store.mjs';
import {readHistoryPage} from './history-store.mjs';
import {renewInvite,leaveLobby,closeOwnRoom} from './room-management.mjs';

const getFields={state:['roomId'],resume:[],progress:[],profile:[],history:[],'history-more':['cursor'],story:[],pending:['roomId'],'join-status':['roomId','requestId'],events:['roomId']};
const postFields={profile:['body'],create:['roomId','stageId','inviteCode'],invite:['roomId','inviteCode'],leave:['roomId'],cancel:['roomId'],'join-request':['inviteCode','requestId','consent'],approve:['roomId','requestId'],reject:['roomId','requestId'],heartbeat:['roomId','connectionId'],disconnect:['roomId','connectionId'],ready:['roomId','ready'],start:['roomId'],tap:['roomId','sequence'],answer:['roomId','challengeId','sequence','answer'],purchase:['itemId','operationId'],equip:['itemId']};
const has=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);
const invalid=new Set(['invalid_id','invalid_name','invalid_create','session_guard','invalid_ready','invalid_sequence','invalid_server_time','quiz_answer','invalid_answer_operation','invite_code','join_consent','invalid_body','profile_create','unknown_equipment','purchase_id','invalid_body_fields','invalid_answer','invalid_equipment','quiz_random','quiz_id']);
const unavailable=new Set(['room_unavailable','room_unknown','invite_unavailable','request_unknown','stage_unknown']);
const forbidden=new Set(['host_only','not_member','pool_owner','quiz_owner','word_challenge_owner','profile_owner','identity']);
const conflict=new Set(['active_session','profile_missing','profile_exists','party_full','room_conflict','create_conflict','request_conflict','request_expired','already_member','same_participant','stage_locked','need_ready_party','need_connected_party','disconnected','roster_locked','countdown','sequence_gap','own_question_pending','learning_pending','tap_rate','answer_conflict','answer_sequence_gap','stale_answer','question_changed','question_not_eligible','word_not_eligible','quiz_not_due','attack_not_allowed','start_not_allowed','already_finished','not_live','inventory_conflict','purchase_conflict','insufficient_coins','item_not_owned']);
function responseError(json,error){
 const code=typeof error?.message==='string'?error.message:'';
 const status=invalid.has(code)||code==='history_cursor'?400:unavailable.has(code)?404:forbidden.has(code)?403:conflict.has(code)||['not_owned','presence_unavailable','host_must_cancel_room'].includes(code)?409:503;
 return json({error:status===503?'coop_unavailable':code},status);
}
function exactObject(body,fields){
 if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).length!==fields.length||Object.keys(body).some(k=>!fields.includes(k)))throw Error('invalid_body_fields');
 return body;
}

export function createCoopRouter(config){
 const {db,authorize,checkOrigin,displayName,watch,clock=()=>Date.now()}=config;
 if(typeof authorize!=='function'||typeof checkOrigin!=='function'||typeof displayName!=='function')throw Error('coop_configuration');
 const quiz=createQuizService(config),battle=createBattleService({...config,quiz,clock});
 function now(){const n=clock();if(!Number.isSafeInteger(n)||n<0)throw Error('invalid_server_time');return n;}
 return async function route(request,session,helpers){
  const url=new URL(request.url),prefix='/coop-story/';
  if(!url.pathname.startsWith(prefix))return null;
  const action=url.pathname.slice(prefix.length),json=helpers?.json;
  if(typeof json!=='function'||typeof helpers.requestJson!=='function')return Response.json({error:'coop_unavailable'},{status:503});
  if(!has(getFields,action)&&!has(postFields,action))return json({error:'not_found'},404);
  if(!['GET','POST'].includes(request.method)||!has(request.method==='GET'?getFields:postFields,action))return json({error:'method_not_allowed'},405);
  if(typeof session?.uid!=='string'||!/^[A-Za-z0-9_-]{1,80}$/.test(session.uid)||typeof helpers.owner!=='string'||!helpers.owner)return json({error:'unauthorized'},401);
  const s={uid:session.uid,owner:helpers.owner};
  try{
   if(await authorize(request,session,action)!==true)return json({error:'forbidden'},403);
   if(request.method==='POST'&&await checkOrigin(request)!==true)return json({error:'origin'},403);
   if(!await db.prepare('SELECT v FROM auth_kv WHERE k=? AND v=? AND expires_at>?').bind('active-session:'+s.uid,s.owner,now()).first('v'))throw Error('active_session');
   let body;
   if(request.method==='GET'){
    const fields=getFields[action];
    if([...url.searchParams.keys()].some(k=>!fields.includes(k))||fields.some(k=>url.searchParams.getAll(k).length!==1))return json({error:'invalid_query'},400);
    body=Object.fromEntries(fields.map(k=>[k,url.searchParams.get(k)]));
   }else{
    if(url.search)return json({error:'invalid_query'},400);
    if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type')||''))return json({error:'content_type'},415);
    let parsed;try{parsed=await helpers.requestJson(request,16384);}catch(error){return typeof helpers.invalidBody==='function'?helpers.invalidBody(error):json({error:'invalid_body'},400);}
    body=exactObject(parsed,postFields[action]);
   }
   const t=now(),actor=()=>({uid:s.uid,name:displayName(session)});
   let result;
   if(action==='state')result=await battle.view(s,body.roomId);
   else if(action==='resume')result=await findOwnResume(db,s,now);
   else if(action==='progress')result=await readCampaignProgress(db,s,now);
   else if(action==='profile'){
    if(request.method==='POST')result=await initializeEquipment(db,s,body.body,t);
    else result=(await readEquipment(db,s,t))?.view||null;
    result={profile:result,shop:Object.values(equipment).map(x=>({...x}))};
   }else if(action==='create')result=await createInvitedParty(db,s,actor(),body,t);
   else if(action==='invite')result=await renewInvite(db,s,body,t);
   else if(action==='leave')result=await leaveLobby(db,s,body,t);
   else if(action==='cancel')result=await closeOwnRoom(db,s,body,t);
   else if(action==='join-request')result=await requestPartyJoin(db,s,actor(),body,t);
   else if(action==='join-status')result=await ownJoinStatus(db,s,body,t);
   else if(action==='pending')result={requests:await pendingPartyJoins(db,s,body.roomId,t)};
   else if(action==='approve')result=await approvePartyJoin(db,s,body,t);
   else if(action==='reject')result=await rejectPartyJoin(db,s,body,t);
   else if(action==='heartbeat')result=await battle.heartbeat(s,body);
   else if(action==='disconnect')result=await battle.disconnect(s,body);
   else if(action==='ready')result=await battle.ready(s,body.roomId,body.ready);
   else if(action==='start')result=await battle.start(s,body.roomId);
   else if(action==='tap')result=await battle.tap(s,body.roomId,body.sequence);
   else if(action==='answer')result=await battle.answer(s,body.roomId,{challengeId:body.challengeId,sequence:body.sequence,answer:body.answer});
   else if(action==='purchase')result=await purchaseEquipment(db,s,body,t);
   else if(action==='equip')result=await saveEquippedItem(db,s,body.itemId,t);
   else if(action==='history'||action==='history-more')result=await readHistoryPage(db,s,body.cursor||'',now);
   else if(action==='story'){
    // Do not provide authenticated content to a revoked session merely because
    // this particular route only needs static story data.
    if(!await db.prepare('SELECT v FROM auth_kv WHERE k=? AND v=? AND expires_at>?').bind('active-session:'+s.uid,s.owner,t).first('v'))throw Error('active_session');
    result=story;
   }else if(action==='events'){
    if(typeof watch!=='function')return json({error:'coop_notifications_unavailable'},503);
    if(!await readOwnParty(db,body.roomId,s,t))throw Error('room_unavailable');
    const stream=await watch(body.roomId);
    if(!await readOwnParty(db,body.roomId,s,now())){await stream.cancel();throw Error('room_unavailable');}
    return new Response(stream,{headers:{'Content-Type':'text/event-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
   }
   if(['create','approve','invite','leave','cancel'].includes(action)&&Number.isSafeInteger(result.revision)){
    try{await config.notify(result.id,result.revision);}catch(_){result={...result,notificationDeferred:true};}
   }
   return json(result);
  }catch(error){return responseError(json,error);}
 };
}
