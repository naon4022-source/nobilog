// Prepared only; run after live full exits. No network or application DB.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createInvitedParty,requestPartyJoin,pendingPartyJoins,approvePartyJoin,rejectPartyJoin,ownJoinStatus} from './invitation-store.mjs';
import {readOwnParty} from './party-store.mjs';
const require=createRequire(import.meta.url),{D1SQLite}=require('../../../.claude/verify/d1-sqlite.js');
const actors=['a','b','c','d'].map(x=>({uid:'synthetic_'+x,name:x.toUpperCase()}));
const sessions=actors.map(x=>({uid:x.uid,owner:'owner_'+x.uid}));
const [a,b,c,d]=actors,[sa,sb,sc,sd]=sessions;
const invitation={roomId:'synthetic_room',stageId:'story_01',inviteCode:'ABCDEFG2'};
const request=(requestId,more={})=>({inviteCode:invitation.inviteCode,requestId,consent:true,...more});
async function setup(){const db=new D1SQLite();for(const s of sessions)db.seed('active-session:'+s.uid,s.owner,10000000);await createInvitedParty(db,sa,a,invitation,100);return db;}
{
 const db=await setup();try{
  const retry=await createInvitedParty(db,sa,a,invitation,101);assert.equal(retry.members.length,1);
  const pending=await requestPartyJoin(db,sb,b,request('requestB'),102);assert.equal(pending.status,'pending');
  assert.equal(await readOwnParty(db,invitation.roomId,sb,103),null,'invite does not grant membership');
  assert.deepEqual(await requestPartyJoin(db,sb,b,request('differentRequest'),103),pending,'one pending request per account');
  const list=await pendingPartyJoins(db,sa,invitation.roomId,103);assert.deepEqual(list,[{requestId:'requestB',name:'B'}]);assert.ok(!JSON.stringify(list).includes('synthetic_b'));
  await assert.rejects(()=>pendingPartyJoins(db,sb,invitation.roomId,103),{message:'host_only'});
  await assert.rejects(()=>ownJoinStatus(db,sc,{roomId:invitation.roomId,requestId:'requestB'},103),{message:'request_unknown'});
  await assert.rejects(()=>approvePartyJoin(db,sb,{roomId:invitation.roomId,requestId:'requestB'},103),{message:'host_only'});
  const approved=await approvePartyJoin(db,sa,{roomId:invitation.roomId,requestId:'requestB'},104);assert.equal(approved.members.length,2);
  assert.equal((await ownJoinStatus(db,sb,{roomId:invitation.roomId,requestId:'requestB'},105)).status,'approved');
  assert.equal((await approvePartyJoin(db,sa,{roomId:invitation.roomId,requestId:'requestB'},105)).members.length,2);
  await requestPartyJoin(db,sc,c,request('requestC'),106);assert.equal((await approvePartyJoin(db,sa,{roomId:invitation.roomId,requestId:'requestC'},107)).members.length,3);
  await assert.rejects(()=>requestPartyJoin(db,sd,d,request('requestD'),108),{message:'party_full'});
  await assert.rejects(()=>createInvitedParty(db,sa,a,{...invitation,roomId:'other_room'},108),{message:'create_conflict'});
 }finally{db.close();}
}
{
 const db=await setup();try{
  await assert.rejects(()=>requestPartyJoin(db,sb,b,request('noConsent',{consent:false}),101),{message:'join_consent'});
  await assert.rejects(()=>requestPartyJoin(db,sb,b,request('badCode',{inviteCode:'1234'}),101),{message:'invite_code'});
  await requestPartyJoin(db,sb,b,request('expire'),102);
  assert.equal((await ownJoinStatus(db,sb,{roomId:invitation.roomId,requestId:'expire'},300103)).status,'expired');
  await assert.rejects(()=>approvePartyJoin(db,sa,{roomId:invitation.roomId,requestId:'expire'},300103),{message:'request_expired'});
  await assert.rejects(()=>requestPartyJoin(db,sb,b,request('oldInvite'),1800101),{message:'invite_unavailable'});
 }finally{db.close();}
}
{
 const db=await setup();try{
  await requestPartyJoin(db,sb,b,request('decline'),102);
  assert.equal((await rejectPartyJoin(db,sa,{roomId:invitation.roomId,requestId:'decline'},103)).status,'declined');
  assert.equal((await ownJoinStatus(db,sb,{roomId:invitation.roomId,requestId:'decline'},104)).status,'declined');
  assert.equal(await readOwnParty(db,invitation.roomId,sb,104),null);
  await assert.rejects(()=>approvePartyJoin(db,sa,{roomId:invitation.roomId,requestId:'decline'},105),{message:'request_expired'});
 }finally{db.close();}
}
{
 const db=await setup();try{
  await requestPartyJoin(db,sb,b,request('rollback'),102);const before=db.get('coop-story-room:'+invitation.roomId).v;db.failBatchAt=1;
  await assert.rejects(()=>approvePartyJoin(db,sa,{roomId:invitation.roomId,requestId:'rollback'},103),/Synthetic transaction failure/);
  assert.equal(db.get('coop-story-room:'+invitation.roomId).v,before);db.failBatchAt=-1;
  assert.equal((await ownJoinStatus(db,sb,{roomId:invitation.roomId,requestId:'rollback'},104)).status,'pending');
 }finally{db.close();}
}
{
 const db=await setup();try{
  await requestPartyJoin(db,sb,b,request('revoked'),102);const before=db.get('coop-story-room:'+invitation.roomId).v;
  db.beforeBatch=()=>db.seed('active-session:'+sa.uid,'replacement',10000000);
  await assert.rejects(()=>approvePartyJoin(db,sa,{roomId:invitation.roomId,requestId:'revoked'},103),{message:'active_session'});
  assert.equal(db.get('coop-story-room:'+invitation.roomId).v,before);
  assert.equal((await ownJoinStatus(db,sb,{roomId:invitation.roomId,requestId:'revoked'},104)).status,'pending');
 }finally{db.close();}
}
{
 const db=await setup();try{
  const next={roomId:'next_stage',stageId:'story_02',inviteCode:'BCDEFG23'};
  await assert.rejects(()=>createInvitedParty(db,sa,a,next,101),{message:'stage_locked'});
  db.seed('coop-story-clear:'+sa.uid+':old_clear',JSON.stringify({stageId:'story_01'}));await createInvitedParty(db,sa,a,next,102);
  await assert.rejects(()=>requestPartyJoin(db,sb,b,request('locked',{inviteCode:next.inviteCode}),103),{message:'stage_locked'});
 }finally{db.close();}
}
console.log('Invitation candidate: consent without membership, host approval/rejection, 2/3-person cap, private projection, replay/collision/expiry, stage progression, rollback and stale owner passed in-memory; actual API and UI remain unverified.');
