import {partyView,leaveWaitingParty} from './party-core.mjs';
const active='EXISTS (SELECT 1 FROM auth_kv WHERE k=? AND v=? AND expires_at>?)';
function id(value){if(typeof value!=='string'||!/^[A-Za-z0-9_-]{1,80}$/.test(value))throw Error('invalid_id');return value;}
function guard(s,now){id(s.uid);if(typeof s.owner!=='string'||!s.owner||!Number.isSafeInteger(now)||now<0)throw Error('session_guard');return ['active-session:'+s.uid,s.owner,now];}
const roomKey=value=>'coop-story-room:'+id(value);
async function read(db,s,roomId,now){
 const raw=await db.prepare('SELECT v FROM auth_kv WHERE k=? AND '+active+" AND EXISTS (SELECT 1 FROM json_each(auth_kv.v,'$.members') m WHERE json_extract(m.value,'$.uid')=?)").bind(roomKey(roomId),...guard(s,now),s.uid).first('v');
 if(!raw){if(!await db.prepare('SELECT v FROM auth_kv WHERE k=? AND v=? AND expires_at>?').bind(...guard(s,now)).first('v'))throw Error('active_session');return null;}
 const room=JSON.parse(raw);partyView(room,s.uid);if(now<room.updatedAt)throw Error('invalid_server_time');return {room,raw};
}
async function digest(code){if(typeof code!=='string'||!/^[A-Z2-7]{8}$/.test(code))throw Error('invite_code');return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(code)))].map(x=>x.toString(16).padStart(2,'0')).join('');}
export async function renewInvite(db,s,{roomId,inviteCode},now){
 const before=await read(db,s,roomId,now);if(!before||before.room.closedAt!=null)throw Error('room_unavailable');
 const room=before.room;if(room.hostUid!==s.uid)throw Error('host_only');if(room.phase!=='lobby')throw Error('roster_locked');
 const hash=await digest(inviteCode);if(hash===room.inviteHash)return partyView(room,s.uid);
 const next={...room,revision:room.revision+1,updatedAt:now,inviteHash:hash,inviteExpiresAt:now+1800000};partyView(next,s.uid);if(!Number.isSafeInteger(next.inviteExpiresAt))throw Error('invalid_server_time');const raw=JSON.stringify(next),g=guard(s,now),key=roomKey(roomId),invite='coop-story-invite:'+hash,joins='coop-story-join:'+roomId+':';
 const out=await db.batch([
  db.prepare('UPDATE auth_kv SET v=? WHERE k=? AND v=? AND '+active+' AND NOT EXISTS (SELECT 1 FROM auth_kv WHERE k=?)').bind(raw,key,before.raw,...g,invite),
  db.prepare('INSERT INTO auth_kv(k,v,expires_at) SELECT ?,?,? WHERE EXISTS (SELECT 1 FROM auth_kv WHERE k=? AND v=?) AND '+active+' ON CONFLICT(k) DO NOTHING').bind(invite,JSON.stringify({roomId,hostUid:s.uid,expiresAt:next.inviteExpiresAt}),next.inviteExpiresAt,key,raw,...g),
  db.prepare('UPDATE auth_kv SET expires_at=? WHERE k=? AND EXISTS (SELECT 1 FROM auth_kv WHERE k=? AND v=?) AND '+active).bind(now,'coop-story-invite:'+room.inviteHash,key,raw,...g),
  db.prepare("UPDATE auth_kv SET expires_at=? WHERE k>=? AND k<? AND json_extract(v,'$.status')='pending' AND EXISTS (SELECT 1 FROM auth_kv WHERE k=? AND v=?) AND "+active).bind(now,joins,joins+'\uffff',key,raw,...g)
 ]);
 if(out.some(x=>x.success===false))throw Error('room_store');if(out[0]?.meta?.changes!==1)throw Error('room_conflict');return partyView(next,s.uid);
}
export async function leaveLobby(db,s,{roomId},now){
 const before=await read(db,s,roomId,now);if(!before||before.room.closedAt!=null)return {id:roomId,left:true};
 const next=leaveWaitingParty(before.room,s.uid,now),raw=JSON.stringify(next);partyView(next,next.hostUid);
 const result=await db.prepare('UPDATE auth_kv SET v=? WHERE k=? AND v=? AND '+active).bind(raw,roomKey(roomId),before.raw,...guard(s,now)).run();
 if(result.meta?.changes!==1)throw Error('room_conflict');return {id:roomId,left:true,revision:next.revision};
}
export async function closeOwnRoom(db,s,{roomId},now){
 const before=await read(db,s,roomId,now);if(!before)throw Error('room_unavailable');const room=before.room;
 if(room.hostUid!==s.uid)throw Error('host_only');if(room.closedAt!=null)return {id:roomId,closed:true,revision:room.revision};if(room.phase==='cleared')throw Error('already_finished');
 const next={...room,revision:room.revision+1,updatedAt:now,closedAt:now};partyView(next,s.uid);const raw=JSON.stringify(next),key=roomKey(roomId),g=guard(s,now),joins='coop-story-join:'+roomId+':';
 const out=await db.batch([
  db.prepare('UPDATE auth_kv SET v=? WHERE k=? AND v=? AND '+active).bind(raw,key,before.raw,...g),
  db.prepare('UPDATE auth_kv SET expires_at=? WHERE k=? AND EXISTS (SELECT 1 FROM auth_kv WHERE k=? AND v=?) AND '+active).bind(now,'coop-story-invite:'+room.inviteHash,key,raw,...g),
  db.prepare('UPDATE auth_kv SET expires_at=? WHERE k>=? AND k<? AND EXISTS (SELECT 1 FROM auth_kv WHERE k=? AND v=?) AND '+active).bind(now,joins,joins+'\uffff',key,raw,...g)
 ]);
 if(out.some(x=>x.success===false))throw Error('room_store');if(out[0]?.meta?.changes!==1)throw Error('room_conflict');return {id:roomId,closed:true,revision:next.revision};
}
