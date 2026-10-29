// Discover only a room containing the authenticated owner. A local room hint
// never grants membership, and no peer identity leaves this query.
import {readOwnParty} from './party-store.mjs';
export async function findOwnResume(db,session,clock=()=>Date.now()){
 const now=clock(),prefix='coop-story-room:';
 if(typeof session?.uid!=='string'||!/^[A-Za-z0-9_-]{1,80}$/.test(session.uid)||typeof session.owner!=='string'||!session.owner||!Number.isSafeInteger(now)||now<0)throw Error('session_guard');
 const row=await db.prepare("SELECT json_extract(v,'$.id') id FROM auth_kv WHERE k>=? AND k<? AND json_extract(v,'$.phase')!='cleared' AND json_extract(v,'$.closedAt') IS NULL AND EXISTS (SELECT 1 FROM json_each(auth_kv.v,'$.members') m WHERE json_extract(m.value,'$.uid')=?) AND EXISTS (SELECT 1 FROM auth_kv WHERE k=? AND v=? AND expires_at>?) ORDER BY CAST(json_extract(v,'$.updatedAt') AS INTEGER) DESC,k DESC LIMIT 1").bind(prefix,prefix+'\uffff',session.uid,'active-session:'+session.uid,session.owner,now).first();
 const fresh=clock();
 if(!Number.isSafeInteger(fresh)||fresh<now)throw Error('invalid_server_time');
 if(!await db.prepare('SELECT v FROM auth_kv WHERE k=? AND v=? AND expires_at>?').bind('active-session:'+session.uid,session.owner,fresh).first('v'))throw Error('active_session');
 if(!row)return {roomId:null};
 const owned=await readOwnParty(db,row.id,session,fresh);
 if(!owned)throw Error('room_unavailable');
 return {roomId:owned.room.id};
}
