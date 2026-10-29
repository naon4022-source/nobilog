import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import engine from '../../../cf-worker/src/material-engine.cjs';
import {createParty,joinParty} from './party-core.mjs';
import {initializeEquipment} from './equipment-store.mjs';
import {ownClearHistory,readOwnParty} from './party-store.mjs';
import {leavePartyConnection} from './presence-store.mjs';
import {createQuizService} from './quiz-service.mjs';
import {createBattleService} from './battle-service.mjs';
const require=createRequire(import.meta.url),{D1SQLite}=require('../../../.claude/verify/d1-sqlite.js');
const a={uid:'synthetic_a',owner:'owner_a'},b={uid:'synthetic_b',owner:'owner_b'};
async function setup(hp=13){
 const db=new D1SQLite();let t=1000,ids=0,failNotice=false;
 for(const s of [a,b])db.seed('active-session:'+s.uid,s.owner,10000000);
 for(const s of [a,b])await initializeEquipment(db,s,s===a?'male':'female',t);
 // Synthetic pre-approved members; invitation consent has its own SQLite suite.
 let room=createParty({roomId:'synthetic_room',stageId:'story_01',host:{uid:a.uid,name:'あ'},bossHp:hp},t);
 room=joinParty(room,{uid:b.uid,name:'い'},t);db.seed('coop-story-room:'+room.id,JSON.stringify(room),0);
 const notices=[];
 const quiz=createQuizService({db,engine,bank:{units:[],sources:[]},wordBank:{grades:[{id:'5',words:[{id:'apple',w:'apple',ja:['りんご']}]}]},loadOwnWords:async s=>({ownerUid:s.uid,snapshot:{v:1,words:{apple:{c:1}}}}),randomUint32:()=>0,makeId:()=> 'synthetic_challenge_'+String(++ids).padStart(8,'0')});
 const service=createBattleService({db,quiz,clock:()=>t,notify:async(id,revision)=>{notices.push({id,revision});if(failNotice){failNotice=false;throw Error('synthetic_notification_failure');}}});
 for(const s of [a,b])await service.heartbeat(s,{roomId:room.id,connectionId:'conn'});
 await service.ready(a,room.id,true);await service.ready(b,room.id,true);
 return {db,service,room,notices,setTime:n=>{t=n;},failNotification:()=>{failNotice=true;}};
}
{
 const x=await setup();const {db,service,room}=x;try{
  const start=await service.start(a,room.id);assert.equal(start.state.phase,'countdown');
  assert.equal((await service.start(a,room.id)).state.combatOpensAt,4000);
  x.setTime(3999);await assert.rejects(()=>service.tap(a,room.id,1),/countdown/);
  x.setTime(4000);await assert.rejects(()=>service.tap(a,room.id,2),/sequence_gap/);
  x.failNotification();
  const first=await service.tap(a,room.id,1);assert.equal(first.notificationDeferred,true);assert.equal(first.state.hp,12);
  const retry=await service.tap(a,room.id,1);assert.equal(retry.replay,true);assert.equal(retry.state.hp,12);
  for(let seq=2;seq<=12;seq++)await service.tap(a,room.id,seq);
  const own=await service.view(a,room.id),peer=await service.view(b,room.id);
  assert.equal(own.state.hp,1);assert.equal(own.state.own.question.prompt,'apple');
  assert.equal(peer.state.own.question,null);assert.equal(JSON.stringify(peer).includes('りんご'),false);
  await assert.rejects(()=>service.tap(a,room.id,13),/own_question_pending/);
  await assert.rejects(()=>service.tap(b,room.id,1),/learning_pending/);
  const challengeId=own.state.own.question.challengeId;
  const wrong={challengeId,sequence:1,answer:'wrong'};
  assert.equal((await service.answer(a,room.id,wrong)).result.correct,false);
  assert.equal((await service.answer(a,room.id,wrong)).replay,true);
  await assert.rejects(()=>service.answer(a,room.id,{...wrong,answer:'りんご'}),/answer_conflict/);
  assert.equal((await service.answer(a,room.id,{challengeId,sequence:2,answer:'りんご'})).result.correct,true);
  const clear=await service.tap(b,room.id,1);assert.equal(clear.state.phase,'cleared');
  assert.equal(clear.equipment.coins,30);assert.equal(clear.state.clear.selfPresentAtClear,true);
  assert.deepEqual((await ownClearHistory(db,a,4000))[0].companions,['い']);
  assert.deepEqual((await ownClearHistory(db,b,4000))[0].companions,['あ']);
  assert.equal((await service.tap(b,room.id,1)).replay,true);
  assert.equal(db.keys().filter(k=>k.startsWith('material-attempt:')).length,0);
  assert.equal(db.keys().filter(k=>k.startsWith('coop-story-clear:')).length,2);
 }finally{db.close();}
}
// Peer disconnects between reducer and SQL. Persist a pause instead of a clear.
{
 const x=await setup(1);const {db,service,room}=x;try{
  await service.start(a,room.id);x.setTime(4000);
  db.beforeBatch=async()=>{db.beforeBatch=null;await leavePartyConnection(db,b,{roomId:room.id,connectionId:'conn'},4000);};
  await assert.rejects(()=>service.tap(a,room.id,1),/need_connected_party/);
  const saved=await readOwnParty(db,room.id,a,4000);assert.equal(saved.room.phase,'paused');assert.equal(saved.room.hp,1);
  assert.equal(db.keys().filter(k=>k.startsWith('coop-story-clear:')).length,0);
  const rejoined=await service.heartbeat(b,{roomId:room.id,connectionId:'conn'});
  assert.equal(rejoined.state.phase,'battle');assert.equal(rejoined.state.combatOpensAt,4000);
  assert.equal((await service.tap(a,room.id,1)).state.phase,'cleared');
 }finally{db.close();}
}
// Two simultaneous finishing taps create one clear and one receipt per member.
{
 const x=await setup(1);const {db,service,room}=x;try{
  await service.start(a,room.id);x.setTime(4000);
  const results=await Promise.allSettled([service.tap(a,room.id,1),service.tap(b,room.id,1)]);
  assert.equal(results.filter(x=>x.status==='fulfilled').length,1);
  assert.equal(db.keys().filter(k=>k.startsWith('coop-story-clear:')).length,2);
 }finally{db.close();}
}
// A session revoked in the final SQL gate cannot write the attack.
{
 const x=await setup(5);const {db,service,room}=x;try{
  await service.start(a,room.id);x.setTime(4000);
  db.beforeBatch=async()=>{db.beforeBatch=null;db.seed('active-session:'+a.uid,'replacement',10000000);};
  await assert.rejects(()=>service.tap(a,room.id,1),/room_unavailable/);
  const saved=JSON.parse(db.get('coop-story-room:'+room.id).v);
  assert.equal(saved.hp,5);assert.equal(saved.members[0].lastSequence,0);
 }finally{db.close();}
}
console.log('Battle service: heartbeat/ready/countdown, own prior-correct quiz/grader, attack and answer replays, notification loss, expiry at commit, pause/rejoin, concurrent clear and revoked owner passed; actual Worker/UI remain unverified.');
