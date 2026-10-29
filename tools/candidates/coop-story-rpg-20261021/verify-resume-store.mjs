import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createParty,joinParty} from './party-core.mjs';
import {findOwnResume} from './resume-store.mjs';
const {D1SQLite}=createRequire(import.meta.url)('../../../.claude/verify/d1-sqlite.js');
const db=new D1SQLite(),a={uid:'synthetic_a',owner:'owner_a'},b={uid:'synthetic_b',owner:'owner_b'},c={uid:'synthetic_c',owner:'owner_c'};
for(const s of [a,b,c])db.seed('active-session:'+s.uid,s.owner,10000);
try{
 assert.deepEqual(await findOwnResume(db,a,()=>1000),{roomId:null});
 let old=createParty({roomId:'old_room',stageId:'story_01',host:{uid:a.uid,name:'旅人A'},bossHp:160},1000);
 old=joinParty(old,{uid:b.uid,name:'旅人B'},1001);db.seed('coop-story-room:'+old.id,JSON.stringify(old),0);
 const stranger=createParty({roomId:'stranger_room',stageId:'story_01',host:{uid:c.uid,name:'旅人C'},bossHp:160},2000);db.seed('coop-story-room:'+stranger.id,JSON.stringify(stranger),0);
 assert.deepEqual(await findOwnResume(db,b,()=>2500),{roomId:'old_room'});
 assert.deepEqual(await findOwnResume(db,c,()=>2500),{roomId:'stranger_room'});
 const own=createParty({roomId:'new_room',stageId:'story_01',host:{uid:a.uid,name:'旅人A'},bossHp:160},3000);db.seed('coop-story-room:'+own.id,JSON.stringify(own),0);
 assert.deepEqual(await findOwnResume(db,a,()=>3500),{roomId:'new_room'});
 assert.deepEqual(await findOwnResume(db,b,()=>3500),{roomId:'old_room'},'another owner new room never replaces this member room');
 let reads=0;
 await assert.rejects(()=>findOwnResume(db,a,()=>{if(++reads===2)db.seed('active-session:'+a.uid,'replacement',10000);return 3500;}),/active_session/);
 reads=0;await assert.rejects(()=>findOwnResume(db,b,()=>++reads===1?3500:10000),/active_session/);
 assert.equal(db.keys().filter(k=>!k.startsWith('active-session:')&&!k.startsWith('coop-story-room:')).length,0,'resume is read-only');
}finally{db.close();}
console.log('Room recovery: own latest membership only, no local hint, host/peer/stranger separation, fresh-clock expiry and revocation, no writes passed.');
