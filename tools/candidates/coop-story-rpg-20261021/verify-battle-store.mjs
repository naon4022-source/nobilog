import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createParty,joinParty,readyParty} from './party-core.mjs';
import {startCountdown,attackBattle,syncBattlePresence} from './battle-core.mjs';
import {createProfile} from './equipment.mjs';
import {commitBattle} from './battle-store.mjs';
import {readOwnParty,ownClearHistory} from './party-store.mjs';
import {heartbeatParty,leavePartyConnection} from './presence-store.mjs';
const require=createRequire(import.meta.url),{D1SQLite}=require('../../../.claude/verify/d1-sqlite.js');
const a={uid:'synthetic_a',owner:'owner_a'},b={uid:'synthetic_b',owner:'owner_b'};
const roomKey='coop-story-room:synthetic_room';
async function setup(){
 const db=new D1SQLite();
 for(const s of [a,b])db.seed('active-session:'+s.uid,s.owner,100000);
 let r=createParty({roomId:'synthetic_room',stageId:'story_01',host:{uid:a.uid,name:'あ'},bossHp:1},1000);
 r=joinParty(r,{uid:b.uid,name:'い'},1000);
 for(const s of [a,b])r=readyParty(r,s.uid,true,1000);
 r=startCountdown(r,a.uid,1000);db.seed(roomKey,JSON.stringify(r),0);
 const equipmentRaw=JSON.stringify(createProfile(a.uid,'male'));
 db.seed('coop-story-profile:'+a.uid,equipmentRaw,0);
 for(const s of [a,b])await heartbeatParty(db,s,{roomId:r.id,connectionId:'conn'},4000);
 const previous=await readOwnParty(db,r.id,a,4000);
 const hit=attackBattle(r,a.uid,{sequence:1},{damage:1},4001);
 return {db,r,previous,next:hit.room,equipmentRaw};
}
{
 const {db,previous,next,equipmentRaw}=await setup();try{
  const result=await commitBattle(db,previous,next,a,4001,{equipmentRaw,requireLiveActor:true});
  assert.equal(result.committed,true);
  assert.equal((await ownClearHistory(db,a,4002))[0].companions[0],'い');
  assert.equal((await ownClearHistory(db,b,4002))[0].companions[0],'あ');
  assert.equal((await commitBattle(db,previous,next,a,4001,{equipmentRaw,requireLiveActor:true})).committed,false);
  assert.equal((await ownClearHistory(db,a,4002)).length,1);
 }finally{db.close();}
}
// Every race after the read must reject the clear and leave both histories empty.
for(const race of ['peer-left','peer-expired','peer-revoked','actor-revoked','gear-changed']){
 const {db,previous,next,equipmentRaw}=await setup();try{
  if(race==='peer-left')await leavePartyConnection(db,b,{roomId:next.id,connectionId:'conn'},4001);
  if(race==='peer-expired')db.seed('coop-story-presence:'+next.id+':'+b.uid+':conn',JSON.stringify({uid:b.uid,owner:b.owner,connectionId:'conn'}),4001);
  if(race==='peer-revoked')db.seed('active-session:'+b.uid,'replacement',100000);
  if(race==='actor-revoked')db.seed('active-session:'+a.uid,'replacement',100000);
  if(race==='gear-changed')db.seed('coop-story-profile:'+a.uid,JSON.stringify({...JSON.parse(equipmentRaw),revision:2}),0);
  assert.equal((await commitBattle(db,previous,next,a,4001,{equipmentRaw,requireLiveActor:true})).committed,false,race);
  assert.equal((await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind(roomKey).first('v')),previous.raw,race);
  const count=await db.prepare("SELECT count(*) n FROM auth_kv WHERE k LIKE 'coop-story-clear:%'").first('n');
  assert.equal(count,0,race);
 }finally{db.close();}
}
// Failure during receipt writes rolls back the boss and every receipt together.
{
 const {db,previous,next,equipmentRaw}=await setup();try{
  db.failBatchAt=2;
  await assert.rejects(()=>commitBattle(db,previous,next,a,4001,{equipmentRaw,requireLiveActor:true}));
  assert.equal(await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind(roomKey).first('v'),previous.raw);
  assert.equal(await db.prepare("SELECT count(*) n FROM auth_kv WHERE k LIKE 'coop-story-clear:%'").first('n'),0);
 }finally{db.close();}
}
// Presence reconciliation is allowed while paused and has its own exact CAS.
{
 const {db,r,previous}=await setup();try{
  await leavePartyConnection(db,b,{roomId:r.id,connectionId:'conn'},4001);
  const paused=syncBattlePresence(r,a.uid,new Set([a.uid]),4001);
  assert.equal((await commitBattle(db,previous,paused,a,4001)).committed,true);
  assert.equal((await readOwnParty(db,r.id,a,4002)).room.phase,'paused');
 }finally{db.close();}
}
console.log('Battle SQLite CAS: clear receipts atomic, presence expiry/leave/revocation, equipment races, rollback and pause passed; live API unverified.');
