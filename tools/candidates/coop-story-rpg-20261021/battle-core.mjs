// Candidate reducer. All presence, time, damage, question descriptors and grading
// results are server inputs. Routes must never accept these from request JSON.
import {partyView,setConnection,startParty,attackParty} from './party-core.mjs';
const id=/^[A-Za-z0-9_-]{1,80}$/;
const validId=value=>typeof value==='string'&&id.test(value);
export const battleTuning=Object.freeze({countdownMs:3000,tapsPerQuestion:12,maxTapsPerSecond:20});
const need=(yes,code)=>{if(!yes)throw Error(code);};
const int=(n,min=0)=>Number.isSafeInteger(n)&&n>=min;
function base(raw,uid,now){
 partyView(raw,uid);
 need(int(now)&&now>=raw.updatedAt,'invalid_server_time');
 return structuredClone(raw);
}
function member(room,uid){const p=room.members.find(p=>p.uid===uid);need(p,'not_member');return p;}
function finish(previous,next,now){
 next.revision=previous.revision+1;next.updatedAt=now;
 need(int(next.revision,1),'revision_overflow');
 partyView(next,next.hostUid);
 return next;
}
function descriptor(q,uid){
 need(q&&q.ownerUid===uid&&validId(q.challengeId),'invalid_quiz_owner');
 const common=['kind','ownerUid','challengeId'];
 if(q.kind==='word'){
  need(validId(q.wordId)&&['ej','je'].includes(q.direction)&&q.provenance==='owner_saved_correct_count'&&q.historicalDirection===null,'invalid_word_quiz');
  need(Object.keys(q).every(k=>[...common,'wordId','direction','provenance','historicalDirection'].includes(k)),'invalid_quiz_fields');
 }else{
  need(q.kind==='material'&&validId(q.unitId)&&validId(q.questionId)&&['study','test'].includes(q.mode),'invalid_material_quiz');
  need(Object.keys(q).every(k=>[...common,'unitId','questionId','mode'].includes(k)),'invalid_quiz_fields');
 }
 return structuredClone(q);
}
function state(room){
 const s=room.rpg;
 need(s?.version===1&&int(s.combatOpensAt)&&s.combatOpensAt>=room.startedAt&&s.combatOpensAt<=room.startedAt+60000,'invalid_battle_state');
 need(s.players&&Object.keys(s.players).length===room.members.length,'invalid_battle_players');
 for(const m of room.members){
  const p=s.players[m.uid];
  need(p&&int(p.taps)&&p.taps===m.lastSequence&&int(p.answerSequence)&&Array.isArray(p.receipts)&&p.receipts.length<=16,'invalid_battle_player');
  need(p.rate&&int(p.rate.openedAt)&&p.rate.openedAt<=room.updatedAt&&int(p.rate.count)&&p.rate.count<=battleTuning.maxTapsPerSecond,'invalid_tap_rate');
  if(p.question)descriptor(p.question,m.uid);
 }
 return s;
}
function battle(room,uid,now){
 const p=member(room,uid);
 need(room.phase==='battle'&&p.connected&&room.members.filter(m=>m.connected).length>=2,'need_connected_party');
 const s=state(room);need(now>=s.combatOpensAt,'countdown');
 return s.players[uid];
}

// Lease expiry may change several members at once. Persist exactly one revision
// for this reconciliation, not one revision per member in the same transaction.
export function syncBattlePresence(raw,uid,connectedUids,now){
 let room=base(raw,uid,now);need(connectedUids instanceof Set,'invalid_presence_set');
 for(const m of room.members)room=setConnection(room,m.uid,connectedUids.has(m.uid),now);
 return room.revision===raw.revision?room:finish(raw,room,now);
}
export function startCountdown(raw,uid,now){
 const room=base(raw,uid,now);
 if(room.phase!=='lobby'){
  need(uid===room.hostUid&&['battle','paused'].includes(room.phase),'start_not_allowed');
  state(room);return room;
 }
 const next=startParty(room,uid,now);
 need(int(now+battleTuning.countdownMs),'invalid_server_time');
 next.rpg={version:1,combatOpensAt:now+battleTuning.countdownMs,players:Object.fromEntries(next.members.map(m=>[m.uid,{
  taps:0,question:null,answerSequence:0,receipts:[],lastResult:null,rate:{openedAt:now,count:0}
 }]))};
 state(next);return next;
}

export function wantsOwnQuestion(raw,uid){
 member(raw,uid);const p=state(raw).players[uid];
 return !p.question&&(p.taps+1)%battleTuning.tapsPerQuestion===0;
}

export function attackBattle(raw,uid,{sequence},{damage,quizCandidate=null},now){
 let room=base(raw,uid,now);const m=member(room,uid);
 need(int(sequence,1),'invalid_sequence');
 if(sequence<=m.lastSequence)return {room,replay:true,clearEffect:null,quizUnavailable:false};
 let p=battle(room,uid,now);
 need(sequence===m.lastSequence+1,'sequence_gap');
 need(!p.question,'own_question_pending');need(int(damage,1),'invalid_damage');
 const rate=now-p.rate.openedAt>=1000?{openedAt:now,count:0}:{...p.rate};
 need(rate.count<battleTuning.maxTapsPerSecond,'tap_rate');
 const due=wantsOwnQuestion(room,uid);
 need(due||quizCandidate===null,'quiz_not_due');
 if(quizCandidate!==null)p.question=descriptor(quizCandidate,uid);
 const gated=room.members.some(other=>other.connected&&room.rpg.players[other.uid].question);
 let clearEffect=null;
 if(gated&&room.hp===1){
  // A tap that itself opens a question must be acknowledged even at 1 HP.
  // Existing pending questions block further finishing taps from companions.
  need(due&&p.question,'learning_pending');
  m.lastSequence=sequence;
 }else{
  const actualDamage=gated?Math.min(damage,room.hp-1):damage;
  const hit=attackParty(room,uid,{sequence},{damage:actualDamage,quizLocked:false},now);
  room=hit.room;clearEffect=hit.clearEffect;
 }
 p=room.rpg.players[uid];p.taps=sequence;p.rate={...rate,count:rate.count+1};
 return {room:finish(raw,room,now),replay:false,clearEffect,quizUnavailable:due&&quizCandidate===null};
}

// answerDigest must be computed from the bounded submitted answer on the server.
// Grades are produced by the existing material/word graders, never request data.
export function answerBattle(raw,uid,{challengeId,sequence},{answerDigest,grade},now){
 const room=base(raw,uid,now);const p=state(room).players[uid];
 need(int(sequence,1)&&typeof answerDigest==='string'&&/^[a-f0-9]{64}$/.test(answerDigest),'invalid_answer_operation');
 const old=p.receipts.find(r=>r.sequence===sequence);
 if(old){
  need(old.challengeId===challengeId&&old.answerDigest===answerDigest,'answer_conflict');
  return {room,replay:true,result:structuredClone(old.result)};
 }
 need(sequence>p.answerSequence,'stale_answer');
 battle(room,uid,now);
 need(sequence===p.answerSequence+1,'answer_sequence_gap');
 need(p.question?.challengeId===challengeId,'question_changed');
 need(grade&&typeof grade.correct==='boolean','invalid_grade');
 const result={challengeId,correct:grade.correct,retrySameMeaning:grade.retrySameMeaning===true,near:grade.near===true,empty:grade.empty===true,at:now};
 p.answerSequence=sequence;p.lastResult=result;
 p.receipts.push({sequence,challengeId,answerDigest,result});p.receipts=p.receipts.slice(-16);
 if(grade.correct)p.question=null;
 return {room:finish(raw,room,now),replay:false,result:structuredClone(result)};
}

export function battleView(raw,uid,now,projectOwnQuestion){
 const room=base(raw,uid,now),view=partyView(room,uid);
 if(room.phase==='lobby')return {...view,serverNow:now};
 const s=state(room),p=s.players[uid];
 need(typeof projectOwnQuestion==='function','question_projector_required');
 return {...view,phase:room.phase==='battle'&&now<s.combatOpensAt?'countdown':room.phase,
  serverNow:now,combatOpensAt:s.combatOpensAt,
  clear:room.clear?{...view.clear,selfPresentAtClear:room.clear.presentMembers.some(m=>m.uid===uid)}:null,
  members:view.members.map((m,i)=>({...m,questionPending:Boolean(s.players[room.members[i].uid].question)})),
  own:{lastSequence:member(room,uid).lastSequence,nextAnswerSequence:p.answerSequence+1,
   question:p.question?projectOwnQuestion(structuredClone(p.question)):null,
   lastResult:p.lastResult?structuredClone(p.lastResult):null}
 };
}
