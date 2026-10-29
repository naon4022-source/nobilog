// Candidate D1 adapter. Not wired to Worker routes or real databases.
import {partyView} from './party-core.mjs';
const active='EXISTS (SELECT 1 FROM auth_kv WHERE k=? AND v=? AND expires_at>?)';
const identifier=/^[A-Za-z0-9_-]{1,80}$/;
function ident(x){if(typeof x!=='string'||!identifier.test(x))throw Error('invalid_id');return x;}
function guarded(session,now){
 ident(session.uid);
 if(typeof session.owner!=='string'||!session.owner||!Number.isSafeInteger(now)||now<0)throw Error('session_guard');
 return ['active-session:'+session.uid,session.owner,now];
}
function roomKey(id){return 'coop-story-room:'+ident(id);}

// Invitation/approval has a separate guarded path. Ordinary reads must be
// member-only even when a stranger knows the room's public ID.
export async function readOwnParty(db,roomId,session,now){
 const row=await db.prepare("SELECT v FROM auth_kv WHERE k=? AND json_extract(v,'$.closedAt') IS NULL AND "+active+" AND EXISTS (SELECT 1 FROM json_each(auth_kv.v,'$.members') m WHERE json_extract(m.value,'$.uid')=?)").bind(roomKey(roomId),...guarded(session,now),session.uid).first('v');
 if(!row)return null;
 const parsed=JSON.parse(row);partyView(parsed,session.uid);
 return {raw:row,room:parsed};
}

// A read result's exact raw bytes are the CAS expectation, not a value supplied
// by the browser. All clear rows are inserted in the same atomic D1 batch.
export async function commitParty(db,previous,next,session,now){
 const guard=guarded(session,now),key=roomKey(next.id);
 partyView(next,session.uid);
 if(next.updatedAt!==now)throw Error('invalid_commit_time');
 const serialized=JSON.stringify(next),statements=[];
 if(previous){
  if(typeof previous.raw!=='string')throw Error('invalid_previous');
  const before=JSON.parse(previous.raw);partyView(before,session.uid);
  if(before.id!==next.id||next.revision!==before.revision+1||before.phase==='cleared')throw Error('invalid_transition');
  statements.push(db.prepare('UPDATE auth_kv SET v=? WHERE k=? AND v=? AND '+active).bind(serialized,key,previous.raw,...guard));
 }else{
  if(next.phase!=='lobby'||next.revision!==1||next.hostUid!==session.uid||next.members.length!==1)throw Error('invalid_create');
  statements.push(db.prepare('INSERT INTO auth_kv(k,v,expires_at) SELECT ?,?,0 WHERE '+active+' ON CONFLICT(k) DO NOTHING').bind(key,serialized,...guard));
 }
 if(next.phase==='cleared'){
  // Persistent clear receipts are the source for progression/reward accounting.
  // Never separately increment a learner's existing study/economy balances.
  for(const member of next.clear.presentMembers){
   const receipt={version:1,roomId:next.id,stageId:next.stageId,at:next.clear.at,companions:next.clear.presentMembers.filter(p=>p.uid!==member.uid),startedMembers:next.clear.startedMembers,presentMembers:next.clear.presentMembers,contributors:next.clear.contributors};
   statements.push(db.prepare('INSERT INTO auth_kv(k,v,expires_at) SELECT ?,?,0 WHERE EXISTS (SELECT 1 FROM auth_kv WHERE k=? AND v=?) AND '+active+' ON CONFLICT(k) DO NOTHING').bind('coop-story-clear:'+ident(member.uid)+':'+next.id,JSON.stringify(receipt),key,serialized,...guard));
  }
 }
 const result=await db.batch(statements);
 if(result.some(r=>r.success===false))throw Error('party_store_failure');
 return {committed:result[0]?.meta?.changes===1};
}

export async function ownClearHistory(db,session,now){
 const prefix='coop-story-clear:'+ident(session.uid)+':';
 const rows=(await db.prepare('SELECT v FROM auth_kv WHERE k>=? AND k<? AND '+active+" ORDER BY CAST(json_extract(v,'$.at') AS INTEGER) DESC,k DESC LIMIT 50").bind(prefix,prefix+'\uffff',...guarded(session,now)).all()).results||[];
 // Remove every internal identity, including peers', from the public history.
 return rows.map(row=>{const x=JSON.parse(row.v);return {roomId:x.roomId,stageId:x.stageId,at:x.at,companions:x.companions.map(p=>p.name),presentAtClear:x.presentMembers.filter(p=>p.uid!==session.uid).map(p=>p.name)};});
}
