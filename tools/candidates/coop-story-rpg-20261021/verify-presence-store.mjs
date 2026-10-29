// Prepared only; run after the current full suite ends. Synthetic SQLite.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createParty,joinParty} from './party-core.mjs';
import {heartbeatParty,leavePartyConnection,livePartyMembers} from './presence-store.mjs';
const require=createRequire(import.meta.url),{D1SQLite}=require('../../../.claude/verify/d1-sqlite.js');
const a={uid:'synthetic_a',name:'A'},b={uid:'synthetic_b',name:'B'};
const sa={uid:a.uid,owner:'owner_a'},sb={uid:b.uid,owner:'owner_b'},outsider={uid:'synthetic_c',owner:'owner_c'};
const roomId='synthetic_room',input=c=>({roomId,connectionId:c});
const db=new D1SQLite();
try{
 for(const s of [sa,sb,outsider])db.seed('active-session:'+s.uid,s.owner,10000000);
 let room=createParty({roomId,stageId:'story_01',host:a,bossHp:100},100);room=joinParty(room,b,101);
 db.seed('coop-story-room:'+roomId,JSON.stringify(room));
 assert.equal((await livePartyMembers(db,sa,roomId,102)).size,0,'membership flags alone do not prove a live peer');
 await heartbeatParty(db,sa,input('tab_a'),103);
 await heartbeatParty(db,sb,input('tab_b1'),104);
 await heartbeatParty(db,sb,input('tab_b2'),105);
 assert.deepEqual(await livePartyMembers(db,sa,roomId,106),new Set([a.uid,b.uid]));
 await leavePartyConnection(db,sb,input('tab_b1'),107);
 assert.equal((await livePartyMembers(db,sa,roomId,108)).size,2,'closing one tab keeps another live tab');
 await leavePartyConnection(db,sb,input('tab_b2'),109);
 assert.deepEqual(await livePartyMembers(db,sa,roomId,110),new Set([a.uid]));
 assert.equal((await livePartyMembers(db,sa,roomId,8200)).size,0,'dropped connection expires without a client goodbye');
 await heartbeatParty(db,sb,input('tab_b2'),8201);
 assert.deepEqual(await livePartyMembers(db,sa,roomId,8202),new Set([b.uid]));
 db.seed('active-session:'+b.uid,'replacement',10000000);
 assert.equal((await livePartyMembers(db,sa,roomId,8203)).size,0,'revoked owner loses presence before TTL');
 await assert.rejects(()=>heartbeatParty(db,sb,input('tab_b2'),8204),{message:'presence_unavailable'});
 const replacement={uid:b.uid,owner:'replacement'};await heartbeatParty(db,replacement,input('tab_b2'),8205);
 assert.equal((await leavePartyConnection(db,sb,input('tab_b2'),8206)).changed,false,'old owner cannot close the new owner connection');
 assert.deepEqual(await livePartyMembers(db,sa,roomId,8207),new Set([b.uid]));
 await assert.rejects(()=>heartbeatParty(db,outsider,input('stranger'),8208),{message:'presence_unavailable'});
 assert.equal((await livePartyMembers(db,outsider,roomId,8208)).size,0);
 await assert.rejects(()=>heartbeatParty(db,{uid:a.uid,owner:'owner_c'},input('forged'),8209),{message:'presence_unavailable'});
 assert.ok(!db.keys().some(k=>k.includes('stranger')||k.includes('forged')));
 console.log('Presence candidate: live peers distinct by account, multiple tabs, own close, expiry, revoked owner/new owner, no membership or identity bypass passed in-memory; actual browser lifecycle wiring remains unverified.');
}finally{db.close();}
