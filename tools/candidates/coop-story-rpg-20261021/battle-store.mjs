// Dedicated guarded battle commit. No production database is used by tests.
// Presence/active-session/equipped inventory are checked at the actual CAS,
// closing the gap between a prior read and a tap/clear being persisted.
import {partyView} from './party-core.mjs';
import {profileView} from './equipment.mjs';
const active='EXISTS (SELECT 1 FROM auth_kv WHERE k=? AND v=? AND expires_at>?)';
const id=x=>{if(typeof x!=='string'||!/^[A-Za-z0-9_-]{1,80}$/.test(x))throw Error('invalid_id');return x;};
function guard(s,now){id(s.uid);if(typeof s.owner!=='string'||!s.owner||!Number.isSafeInteger(now)||now<0)throw Error('session_guard');return ['active-session:'+s.uid,s.owner,now];}

export async function commitBattle(db,previous,next,session,now,{equipmentRaw=null,requireLiveActor=false}={}){
 const g=guard(session,now);
 if(typeof previous?.raw!=='string')throw Error('battle_previous');
 const before=JSON.parse(previous.raw);
 partyView(before,session.uid);partyView(next,session.uid);
 if(before.id!==next.id||before.phase==='cleared'||next.revision!==before.revision+1||next.updatedAt!==now)throw Error('battle_transition');
 if(requireLiveActor&&!next.members.find(m=>m.uid===session.uid)?.connected)throw Error('need_connected_party');
 const key='coop-story-room:'+id(next.id),serialized=JSON.stringify(next);
 const prefix='coop-story-presence:'+next.id+':';
 // Compare each member's exact connection flag with live leases owned by their
 // current session. It is not sufficient to count two stale cached flags.
 const presence="NOT EXISTS (SELECT 1 FROM json_each(?,'$.members') m WHERE json_extract(m.value,'$.connected') <> EXISTS (SELECT 1 FROM auth_kv p JOIN auth_kv a ON a.k='active-session:'||json_extract(m.value,'$.uid') AND a.v=json_extract(p.v,'$.owner') AND a.expires_at>? WHERE p.k>=? AND p.k<? AND p.expires_at>? AND json_extract(p.v,'$.uid')=json_extract(m.value,'$.uid')))";
 let sql='UPDATE auth_kv SET v=? WHERE k=? AND v=? AND '+active+' AND '+presence;
 const args=[serialized,key,previous.raw,...g,serialized,now,prefix,prefix+'\uffff',now];
 if(equipmentRaw!==null){
  if(typeof equipmentRaw!=='string')throw Error('battle_equipment');
  profileView(JSON.parse(equipmentRaw),session.uid);
  sql+=' AND EXISTS (SELECT 1 FROM auth_kv WHERE k=? AND v=?)';
  args.push('coop-story-profile:'+session.uid,equipmentRaw);
 }
 const statements=[db.prepare(sql).bind(...args)];
 if(next.phase==='cleared'){
  for(const m of next.clear.presentMembers){
   const receipt={version:1,roomId:next.id,stageId:next.stageId,at:next.clear.at,
    companions:next.clear.presentMembers.filter(other=>other.uid!==m.uid),
    startedMembers:next.clear.startedMembers,presentMembers:next.clear.presentMembers,contributors:next.clear.contributors};
   statements.push(db.prepare('INSERT INTO auth_kv(k,v,expires_at) SELECT ?,?,0 WHERE EXISTS (SELECT 1 FROM auth_kv WHERE k=? AND v=?) AND '+active+' ON CONFLICT(k) DO NOTHING').bind('coop-story-clear:'+id(m.uid)+':'+next.id,JSON.stringify(receipt),key,serialized,...g));
  }
 }
 const out=await db.batch(statements);
 if(out.some(r=>r.success===false))throw Error('battle_store_failure');
 return {committed:out[0]?.meta?.changes===1};
}
