// Server orchestration candidate; no Worker route or real-user DB is wired yet.
import {readyParty} from './party-core.mjs';
import {readOwnParty} from './party-store.mjs';
import {heartbeatParty,leavePartyConnection,livePartyMembers} from './presence-store.mjs';
import {readEquipment} from './equipment-store.mjs';
import {tapDamage} from './equipment.mjs';
import {syncBattlePresence,startCountdown,attackBattle,answerBattle,battleView,wantsOwnQuestion} from './battle-core.mjs';
import {commitBattle} from './battle-store.mjs';

const digest=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(x=>x.toString(16).padStart(2,'0')).join('');
export function createBattleService({db,quiz,clock=()=>Date.now(),notify}){
 if(!db||typeof notify!=='function'||!['choose','project','grade'].every(k=>typeof quiz?.[k]==='function'))throw Error('battle_configuration');
 function now(){const n=clock();if(!Number.isSafeInteger(n)||n<0)throw Error('invalid_server_time');return n;}
 async function project(session,room,notificationDeferred=false){
  const t=now(),pending=room.rpg?.players?.[session.uid]?.question;
  const question=pending?await quiz.project(session,pending,t):null;
  const gear=await readEquipment(db,session,now());
  // Projection may have awaited a bank/snapshot read. Check the same owner
  // again before returning any personalized state from that asynchronous work.
  if(!await readOwnParty(db,room.id,session,now()))throw Error('room_unavailable');
  return {state:battleView(room,session.uid,Math.max(t,room.updatedAt),()=>question),equipment:gear?.view||null,canHost:room.hostUid===session.uid,notificationDeferred};
 }
 async function change(session,roomId,kind,body={}){
  for(let attempt=0;attempt<3;attempt++){
   const readAt=now(),previous=await readOwnParty(db,roomId,session,readAt);
   if(!previous)throw Error('room_unavailable');
   const raw=previous.room,actor=raw.members.find(m=>m.uid===session.uid);
   let gear=null,chosen=null,grade=null,hash=null;
   if(kind==='tap'&&Number.isSafeInteger(body.sequence)&&body.sequence>actor.lastSequence){
    gear=await readEquipment(db,session,now());if(!gear)throw Error('profile_missing');
    if(raw.rpg&&wantsOwnQuestion(raw,session.uid))chosen=await quiz.choose(session,now());
   }
   if(kind==='answer'){
    if(typeof body.answer!=='string'||body.answer.length>4000)throw Error('quiz_answer');
    hash=await digest(body.answer);
    const old=raw.rpg?.players?.[session.uid]?.receipts.find(r=>r.sequence===body.sequence);
    if(!old){
     const q=raw.rpg?.players?.[session.uid]?.question;
     if(!q||q.challengeId!==body.challengeId)throw Error('question_changed');
     grade=await quiz.grade(session,q,body.answer,now());
    }
   }
   const t=now(),live=await livePartyMembers(db,session,roomId,t);
   const base=syncBattlePresence(raw,session.uid,live,t);
   let next=base,error=null,replay=false,quizUnavailable=false,result=null;
   try{
    if(kind==='ready')next=readyParty(base,session.uid,body.ready,t);
    else if(kind==='start')next=startCountdown(base,session.uid,t);
    else if(kind==='tap'){
     const hit=attackBattle(base,session.uid,{sequence:body.sequence},{damage:gear?tapDamage(gear.profile,session.uid):1,quizCandidate:chosen},t);
     next=hit.room;replay=hit.replay;quizUnavailable=hit.quizUnavailable;
    }else if(kind==='answer'){
     const answer=answerBattle(base,session.uid,{challengeId:body.challengeId,sequence:body.sequence},{answerDigest:hash,grade},t);
     next=answer.room;replay=answer.replay;result=answer.result;
    }else if(kind!=='read')throw Error('battle_action');
   }catch(e){error=e;next=base;}
   let notificationDeferred=false;
   if(next.revision!==raw.revision){
    // Presence plus an action is one transaction and one externally visible
    // revision; intermediate reducer revisions are never persisted separately.
    next={...next,revision:raw.revision+1,updatedAt:t};
    const saved=await commitBattle(db,previous,next,session,t,{equipmentRaw:kind==='tap'&&!error?gear?.raw||null:null,requireLiveActor:['tap','answer','start'].includes(kind)&&!error});
    if(!saved.committed)continue;
    try{await notify(roomId,next.revision);}catch(_){notificationDeferred=true;}
   }
   if(error)throw error;
   return {...await project(session,next,notificationDeferred),replay,quizUnavailable,result};
  }
  throw Error('room_conflict');
 }
 return Object.freeze({
  view:(s,roomId)=>change(s,roomId,'read'),
  ready:(s,roomId,ready)=>change(s,roomId,'ready',{ready}),
  start:(s,roomId)=>change(s,roomId,'start'),
  tap:(s,roomId,sequence)=>change(s,roomId,'tap',{sequence}),
  answer:(s,roomId,body)=>change(s,roomId,'answer',body),
  async heartbeat(s,{roomId,connectionId}){await heartbeatParty(db,s,{roomId,connectionId},now());return change(s,roomId,'read');},
  async disconnect(s,{roomId,connectionId}){await leavePartyConnection(db,s,{roomId,connectionId},now());return change(s,roomId,'read');}
 });
}
