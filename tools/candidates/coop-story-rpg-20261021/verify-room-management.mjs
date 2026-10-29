import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import engine from '../../../cf-worker/src/material-engine.cjs';
import {createInvitedParty,requestPartyJoin,approvePartyJoin,ownJoinStatus} from './invitation-store.mjs';
import {renewInvite,leaveLobby,closeOwnRoom} from './room-management.mjs';
import {readOwnParty} from './party-store.mjs';
import {findOwnResume} from './resume-store.mjs';
import {initializeEquipment} from './equipment-store.mjs';
import {createQuizService} from './quiz-service.mjs';
import {createBattleService} from './battle-service.mjs';
const {D1SQLite}=createRequire(import.meta.url)('../../../.claude/verify/d1-sqlite.js');
const db=new D1SQLite(),people=['a','b','c'].map(x=>({uid:'synthetic_'+x,owner:'owner_'+x,name:'旅人'+x})),[a,b,c]=people;
let now=1000,ids=0;
for(const s of people){db.seed('active-session:'+s.uid,s.owner,1000000);await initializeEquipment(db,s,'male',now);}
const actor=s=>({uid:s.uid,name:s.name}),roomId='managed_room';
const quiz=createQuizService({db,engine,bank:{units:[],sources:[]},wordBank:{grades:[{id:'5',words:[{id:'apple',w:'apple',ja:['りんご']}]}]},loadOwnWords:async s=>({ownerUid:s.uid,snapshot:{v:1,words:{apple:{c:1}}}}),randomUint32:()=>0,makeId:()=> 'managed_challenge_'+String(++ids).padStart(10,'0')});
const battle=createBattleService({db,quiz,clock:()=>now,notify:async()=>{}});
async function join(s,code,requestId){await requestPartyJoin(db,s,actor(s),{inviteCode:code,requestId,consent:true},now);await approvePartyJoin(db,a,{roomId,requestId},now);}
try{
 await createInvitedParty(db,a,actor(a),{roomId,stageId:'story_01',inviteCode:'ABCDEFGH'},now);
 await requestPartyJoin(db,b,actor(b),{inviteCode:'ABCDEFGH',requestId:'old_request',consent:true},now);
 await assert.rejects(()=>renewInvite(db,c,{roomId,inviteCode:'CCCCCCCC'},now),/room_unavailable/);
 now=1100;const fresh=await renewInvite(db,a,{roomId,inviteCode:'BBBBBBBB'},now);
 assert.equal((await renewInvite(db,a,{roomId,inviteCode:'BBBBBBBB'},now)).revision,fresh.revision,'lost reply replays without rotation');
 assert.equal((await ownJoinStatus(db,b,{roomId,requestId:'old_request'},now)).status,'closed');
 await assert.rejects(()=>requestPartyJoin(db,c,actor(c),{inviteCode:'ABCDEFGH',requestId:'stale',consent:true},now),/invite_unavailable/);
 await join(b,'BBBBBBBB','join_b');await join(c,'BBBBBBBB','join_c');
 await assert.rejects(()=>renewInvite(db,b,{roomId,inviteCode:'CCCCCCCC'},now),/host_only/);
 await assert.rejects(()=>closeOwnRoom(db,b,{roomId},now),/host_only/);
 await assert.rejects(()=>leaveLobby(db,a,{roomId},now),/host_must_cancel_room/);
 now=1200;await leaveLobby(db,b,{roomId},now);const afterLeave=db.get('coop-story-room:'+roomId).v;
 await leaveLobby(db,b,{roomId},now);assert.equal(db.get('coop-story-room:'+roomId).v,afterLeave,'leave replay has no extra effect');
 assert.equal((await readOwnParty(db,roomId,a,now)).room.members.length,2);
 assert.deepEqual(await findOwnResume(db,b,()=>now),{roomId:null});
 await join(b,'BBBBBBBB','join_b_again');
 for(const s of people){await battle.heartbeat(s,{roomId,connectionId:'connection'});await battle.ready(s,roomId,true);}
 await battle.start(a,roomId);now+=3000;
 await assert.rejects(()=>leaveLobby(db,b,{roomId},now),/roster_locked/);
 await assert.rejects(()=>renewInvite(db,a,{roomId,inviteCode:'CCCCCCCC'},now),/roster_locked/);
 for(let sequence=1;sequence<=12;sequence++)await battle.tap(a,roomId,sequence);
 const closed=await closeOwnRoom(db,a,{roomId},now);assert.equal((await closeOwnRoom(db,a,{roomId},now)).revision,closed.revision);
 assert.ok(db.get('coop-story-room:'+roomId),'closed room audit data is retained');
 for(const s of people){assert.equal(await readOwnParty(db,roomId,s,now),null);assert.deepEqual(await findOwnResume(db,s,()=>now),{roomId:null});}
 await assert.rejects(()=>battle.heartbeat(b,{roomId,connectionId:'connection'}),/presence_unavailable/);
 await assert.rejects(()=>battle.tap(b,roomId,1),/room_unavailable/);
 await assert.rejects(()=>requestPartyJoin(db,b,actor(b),{inviteCode:'BBBBBBBB',requestId:'closed_join',consent:true},now),/invite_unavailable/);
 assert.equal(db.keys().filter(k=>k.startsWith('coop-story-clear:')||k.startsWith('material-attempt:')).length,0,'closing unfinished play creates no award or learning attempt');
 // A failed atomic rotation/close preserves the old room and invite.
 now+=1000;const rollbackId='rollback_room';await createInvitedParty(db,a,actor(a),{roomId:rollbackId,stageId:'story_01',inviteCode:'DDDDDDDD'},now);
 const before=db.get('coop-story-room:'+rollbackId).v;db.failBatchAt=1;
 await assert.rejects(()=>renewInvite(db,a,{roomId:rollbackId,inviteCode:'EEEEEEEE'},now));db.failBatchAt=-1;
 assert.equal(db.get('coop-story-room:'+rollbackId).v,before);
 db.failBatchAt=1;await assert.rejects(()=>closeOwnRoom(db,a,{roomId:rollbackId},now));db.failBatchAt=-1;assert.equal(db.get('coop-story-room:'+rollbackId).v,before);
 db.beforeBatch=()=>{db.beforeBatch=null;db.seed('active-session:'+a.uid,'replacement',1000000);};
 await assert.rejects(()=>closeOwnRoom(db,a,{roomId:rollbackId},now),/room_conflict/);assert.equal(db.get('coop-story-room:'+rollbackId).v,before,'revoked owner cannot close at commit');
}finally{db.close();}
console.log('Room management: host invite recovery/replay, stale pending/code invalidation, peer leave/rejoin, battle role gates and host close, no rewards/deletion, atomic rollback and revoked-owner commit passed.');
