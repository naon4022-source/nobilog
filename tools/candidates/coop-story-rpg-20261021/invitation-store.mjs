// Isolated candidate, no live routes. Invite codes request host approval;
// they never replace authentication and are not included in any URL.
import {createParty,joinParty,partyView} from './party-core.mjs';
import {readOwnParty} from './party-store.mjs';
import story from './story-catalog.mjs';
const active='EXISTS (SELECT 1 FROM auth_kv WHERE k=? AND v=? AND expires_at>?)';
const id=x=>{if(typeof x!=='string'||!/^[A-Za-z0-9_-]{1,80}$/.test(x))throw Error('invalid_id');return x;};
const roomKey=x=>'coop-story-room:'+id(x);
const joinKey=(room,request)=>'coop-story-join:'+id(room)+':'+id(request);
function guard(s,now){id(s.uid);if(typeof s.owner!=='string'||!s.owner||!Number.isSafeInteger(now)||now<0)throw Error('session_guard');return ['active-session:'+s.uid,s.owner,now];}
async function lease(db,s,now){if(!await db.prepare('SELECT v FROM auth_kv WHERE k=? AND v=? AND expires_at>?').bind(...guard(s,now)).first('v'))throw Error('active_session');}
async function digest(code){
 if(typeof code!=='string'||!/^[A-Z2-7]{8}$/.test(code))throw Error('invite_code');
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(code));
 return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
async function unlocked(db,s,stageId,now){
 const stage=story.stages.find(x=>x.id===stageId);if(!stage)throw Error('stage_unknown');
 await lease(db,s,now);
 const prefix='coop-story-clear:'+s.uid+':';
 const rows=(await db.prepare("SELECT DISTINCT json_extract(v,'$.stageId') stageId FROM auth_kv WHERE k>=? AND k<? AND "+active).bind(prefix,prefix+'\uffff',...guard(s,now)).all()).results||[];
 const cleared=new Set(rows.map(r=>r.stageId));
 if(story.stages.some(x=>x.number<stage.number&&!cleared.has(x.id)))throw Error('stage_locked');
 return stage;
}
export async function createInvitedParty(db,s,actor,{roomId,stageId,inviteCode},now){
 if(actor.uid!==s.uid)throw Error('identity');
 const stage=await unlocked(db,s,stageId,now),hash=await digest(inviteCode),g=guard(s,now);
 const existing=await readOwnParty(db,roomId,s,now);
 if(existing){
  if(existing.room.hostUid!==s.uid||existing.room.inviteHash!==hash||existing.room.stageId!==stageId)throw Error('create_conflict');
  return partyView(existing.room,s.uid);
 }
 const room={...createParty({roomId,stageId,host:actor,bossHp:160+(stage.number-1)*100},now),inviteHash:hash,inviteExpiresAt:now+1800000};
 const raw=JSON.stringify(room),key=roomKey(roomId),invite='coop-story-invite:'+hash;
 const link=JSON.stringify({roomId,hostUid:s.uid,expiresAt:room.inviteExpiresAt});
 const out=await db.batch([
  db.prepare('INSERT INTO auth_kv(k,v,expires_at) SELECT ?,?,0 WHERE '+active+' AND NOT EXISTS (SELECT 1 FROM auth_kv WHERE k=?) ON CONFLICT(k) DO NOTHING').bind(key,raw,...g,invite),
  db.prepare('INSERT INTO auth_kv(k,v,expires_at) SELECT ?,?,? WHERE EXISTS (SELECT 1 FROM auth_kv WHERE k=? AND v=?) AND '+active+' ON CONFLICT(k) DO NOTHING').bind(invite,link,room.inviteExpiresAt,key,raw,...g)
 ]);
 if(out.some(x=>x.success===false))throw Error('room_store');
 if(out[0]?.meta?.changes!==1){await lease(db,s,now);throw Error('create_conflict');}
 return partyView(room,s.uid);
}
export async function requestPartyJoin(db,s,actor,{inviteCode,requestId,consent},now){
 if(actor.uid!==s.uid||consent!==true)throw Error('join_consent');id(requestId);
 const hash=await digest(inviteCode),g=guard(s,now);
 const raw=await db.prepare('SELECT r.v FROM auth_kv i JOIN auth_kv r ON r.k=?||json_extract(i.v,\'$.roomId\') WHERE i.k=? AND i.expires_at>? AND '+active).bind('coop-story-room:','coop-story-invite:'+hash,now,...g).first('v');
 if(!raw){await lease(db,s,now);throw Error('invite_unavailable');}
 const room=JSON.parse(raw);if(room.hostUid===s.uid)throw Error('same_participant');
 if(room.phase!=='lobby'||room.inviteHash!==hash||room.inviteExpiresAt<=now)throw Error('invite_unavailable');
 await unlocked(db,s,room.stageId,now);
 if(room.members.some(p=>p.uid===s.uid))return {roomId:room.id,requestId,status:'approved'};
 const prefix='coop-story-join:'+room.id+':';
 const ownPending=async()=>{
  const row=await db.prepare("SELECT v FROM auth_kv WHERE k>=? AND k<? AND expires_at>? AND json_extract(v,'$.uid')=? AND json_extract(v,'$.inviteHash')=? AND json_extract(v,'$.status')='pending' AND "+active+' LIMIT 1').bind(prefix,prefix+'\uffff',now,s.uid,hash,...guard(s,now)).first('v');
  if(!row)return null;const pending=JSON.parse(row);return {roomId:room.id,requestId:pending.requestId,status:'pending'};
 };
 const priorPending=await ownPending();if(priorPending)return priorPending;
 // Use the same strict player/name validation as actual approval, without
 // mutating the room or making a pending requester into a member.
 joinParty(room,actor,now);
 const key=joinKey(room.id,requestId),pending={uid:s.uid,name:actor.name,requestId,roomId:room.id,inviteHash:hash,consent:true,status:'pending',createdAt:now,expiresAt:Math.min(now+300000,room.inviteExpiresAt)};
 await db.prepare('INSERT INTO auth_kv(k,v,expires_at) SELECT ?,?,? WHERE '+active+' AND EXISTS (SELECT 1 FROM auth_kv WHERE k=? AND v=?)'+" AND (SELECT COUNT(*) FROM auth_kv WHERE k>=? AND k<? AND expires_at>? AND json_extract(v,'$.status')='pending')<10 AND NOT EXISTS (SELECT 1 FROM auth_kv WHERE k>=? AND k<? AND expires_at>? AND json_extract(v,'$.status')='pending' AND json_extract(v,'$.uid')=?) ON CONFLICT(k) DO NOTHING").bind(key,JSON.stringify(pending),pending.expiresAt,...g,roomKey(room.id),raw,prefix,prefix+'\uffff',now,prefix,prefix+'\uffff',now,s.uid).run();
 const saved=await db.prepare('SELECT v FROM auth_kv WHERE k=? AND '+active).bind(key,...g).first('v');
 if(!saved){const retry=await ownPending();if(retry)return retry;await lease(db,s,now);throw Error('room_conflict');}
 const actual=JSON.parse(saved);
 if(actual.uid!==s.uid||actual.inviteHash!==hash)throw Error('request_conflict');
 return {roomId:room.id,requestId,status:actual.status};
}
export async function ownJoinStatus(db,s,{roomId,requestId},now){
 const raw=await db.prepare("SELECT v FROM auth_kv WHERE k=? AND json_extract(v,'$.uid')=? AND "+active).bind(joinKey(roomId,requestId),s.uid,...guard(s,now)).first('v');
 if(!raw){await lease(db,s,now);throw Error('request_unknown');}
 const pending=JSON.parse(raw);
 if(pending.status==='approved'){
  const room=await readOwnParty(db,roomId,s,now);return {roomId,requestId,status:room?'approved':'left'};
 }
 const currentInvite=await db.prepare('SELECT 1 AS present FROM auth_kv WHERE k=? AND json_extract(v,\'$.inviteHash\')=? AND json_extract(v,\'$.closedAt\') IS NULL AND json_extract(v,\'$.inviteExpiresAt\')>? AND '+active).bind(roomKey(roomId),pending.inviteHash,now,...guard(s,now)).first();
 await lease(db,s,now);
 if(!currentInvite)return {roomId,requestId,status:'closed'};
 return {roomId,requestId,status:pending.expiresAt<=now?'expired':pending.status};
}
export async function pendingPartyJoins(db,s,roomId,now){
 const room=await readOwnParty(db,roomId,s,now);if(!room||room.room.hostUid!==s.uid)throw Error('host_only');
 const prefix='coop-story-join:'+id(roomId)+':';
 const rows=(await db.prepare("SELECT v FROM auth_kv WHERE k>=? AND k<? AND expires_at>? AND json_extract(v,'$.status')='pending' AND "+active+' ORDER BY k LIMIT 10').bind(prefix,prefix+'\uffff',now,...guard(s,now)).all()).results||[];
 return rows.map(row=>JSON.parse(row.v)).filter(x=>x.inviteHash===room.room.inviteHash).map(x=>({requestId:x.requestId,name:x.name}));
}
export async function approvePartyJoin(db,s,{roomId,requestId},now){
 const before=await readOwnParty(db,roomId,s,now);if(!before||before.room.hostUid!==s.uid)throw Error('host_only');
 const key=joinKey(roomId,requestId),g=guard(s,now);
 const raw=await db.prepare('SELECT v FROM auth_kv WHERE k=? AND '+active).bind(key,...g).first('v');
 if(!raw)throw Error('request_unknown');const pending=JSON.parse(raw);
 if(pending.status==='approved'&&before.room.members.some(p=>p.uid===pending.uid))return partyView(before.room,s.uid);
 if(pending.status!=='pending'||pending.consent!==true||pending.expiresAt<=now||pending.inviteHash!==before.room.inviteHash||before.room.inviteExpiresAt<=now)throw Error('request_expired');
 const next=joinParty(before.room,{uid:pending.uid,name:pending.name},now);
 if(next.revision===before.room.revision)throw Error('already_member');
 next.lastApprovedJoinId=requestId;
 const nextRaw=JSON.stringify(next),approved=JSON.stringify({...pending,status:'approved',approvedAt:now});
 const out=await db.batch([
  db.prepare('UPDATE auth_kv SET v=? WHERE k=? AND v=? AND '+active+' AND EXISTS (SELECT 1 FROM auth_kv WHERE k=? AND v=? AND expires_at>?)').bind(nextRaw,roomKey(roomId),before.raw,...g,key,raw,now),
  db.prepare('UPDATE auth_kv SET v=? WHERE k=? AND v=? AND '+active+' AND EXISTS (SELECT 1 FROM auth_kv WHERE k=? AND v=?)').bind(approved,key,raw,...g,roomKey(roomId),nextRaw)
 ]);
 if(out.some(x=>x.success===false))throw Error('room_store');
 if(out[0]?.meta?.changes!==1){await lease(db,s,now);throw Error('room_conflict');}
 return partyView(next,s.uid);
}
export async function rejectPartyJoin(db,s,{roomId,requestId},now){
 const room=await readOwnParty(db,roomId,s,now);if(!room||room.room.hostUid!==s.uid)throw Error('host_only');
 const key=joinKey(roomId,requestId),g=guard(s,now);
 const raw=await db.prepare('SELECT v FROM auth_kv WHERE k=? AND '+active).bind(key,...g).first('v');
 if(!raw)throw Error('request_unknown');const pending=JSON.parse(raw);
 if(pending.status==='declined')return {requestId,status:'declined'};
 if(pending.status!=='pending')throw Error('request_conflict');
 const result=await db.prepare('UPDATE auth_kv SET v=? WHERE k=? AND v=? AND '+active).bind(JSON.stringify({...pending,status:'declined',declinedAt:now}),key,raw,...g).run();
 if(result.meta?.changes!==1){await lease(db,s,now);throw Error('request_conflict');}
 return {requestId,status:'declined'};
}
