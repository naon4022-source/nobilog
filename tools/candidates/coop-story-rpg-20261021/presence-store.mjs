// Isolated candidate. One learner counts once, even with multiple tabs.
// Presence cannot outlive its active-session owner or authorize room membership.
const active='EXISTS (SELECT 1 FROM auth_kv WHERE k=? AND v=? AND expires_at>?)';
function id(x){if(typeof x!=='string'||!/^[A-Za-z0-9_-]{1,80}$/.test(x))throw Error('invalid_id');return x;}
function guard(s,now){id(s.uid);if(typeof s.owner!=='string'||!s.owner||!Number.isSafeInteger(now)||now<0||!Number.isSafeInteger(now+8000))throw Error('session_guard');return ['active-session:'+s.uid,s.owner,now];}
const roomKey=r=>'coop-story-room:'+id(r);
const prefix=r=>'coop-story-presence:'+id(r)+':';
const key=(r,s,c)=>prefix(r)+id(s.uid)+':'+id(c);
export async function heartbeatParty(db,s,{roomId,connectionId},now){
 const value=JSON.stringify({uid:s.uid,owner:s.owner,connectionId:id(connectionId)});
 const result=await db.prepare('INSERT INTO auth_kv(k,v,expires_at) SELECT ?,?,? WHERE '+active+" AND EXISTS (SELECT 1 FROM auth_kv r,json_each(r.v,'$.members') m WHERE r.k=? AND json_extract(m.value,'$.uid')=? AND json_extract(r.v,'$.closedAt') IS NULL AND json_extract(r.v,'$.phase') IN ('lobby','battle','paused')) ON CONFLICT(k) DO UPDATE SET v=excluded.v,expires_at=excluded.expires_at").bind(key(roomId,s,connectionId),value,now+8000,...guard(s,now),roomKey(roomId),s.uid).run();
 if(result.meta?.changes!==1)throw Error('presence_unavailable');
 return {expiresAt:now+8000};
}
export async function leavePartyConnection(db,s,{roomId,connectionId},now){
 const result=await db.prepare("UPDATE auth_kv SET expires_at=? WHERE k=? AND json_extract(v,'$.owner')=? AND "+active).bind(now,key(roomId,s,connectionId),s.owner,...guard(s,now)).run();
 return {changed:result.meta?.changes===1};
}
export async function livePartyMembers(db,s,roomId,now){
 const p=prefix(roomId);
 const rows=(await db.prepare("SELECT DISTINCT json_extract(p.v,'$.uid') uid FROM auth_kv p JOIN auth_kv a ON a.k='active-session:'||json_extract(p.v,'$.uid') AND a.v=json_extract(p.v,'$.owner') AND a.expires_at>? JOIN auth_kv r ON r.k=? JOIN json_each(r.v,'$.members') m ON json_extract(m.value,'$.uid')=json_extract(p.v,'$.uid') WHERE p.k>=? AND p.k<? AND p.expires_at>? AND "+active+" AND EXISTS (SELECT 1 FROM json_each(r.v,'$.members') self WHERE json_extract(self.value,'$.uid')=?)").bind(now,roomKey(roomId),p,p+'\uffff',now,...guard(s,now),s.uid).all()).results||[];
 // This internal set is consumed by the server reducer, never serialized as IDs.
 return new Set(rows.map(r=>r.uid));
}
