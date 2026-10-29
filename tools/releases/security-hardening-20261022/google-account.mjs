// Candidate domain logic. Inject only server-verified session and active-owner hash.
const USERS=new Set(['u1','u2','u4']);
export async function claimGoogleLink(db,session,{ticket,ownerHash,state,record,now=Date.now()}){
 if(!db||!USERS.has(session?.uid)||!session.token||typeof ticket!=='string'||!ticket||ticket.length>256)return {status:403,error:'verification_required'};
 const uid=session.uid,key='oauth:'+state,value=JSON.stringify(record);
 const results=await db.batch([
  db.prepare(`INSERT INTO auth_kv(k,v,expires_at) SELECT ?,?,? WHERE
  EXISTS(SELECT 1 FROM auth_kv WHERE k=? AND v=? AND expires_at>?) AND
  EXISTS(SELECT 1 FROM auth_kv WHERE k=? AND json_valid(v) AND json_extract(v,'$.uid')=? AND expires_at>?) AND
  EXISTS(SELECT 1 FROM auth_kv WHERE k=? AND v=? AND expires_at>?) ON CONFLICT(k) DO NOTHING`).bind(key,value,now+600000,'legacy:'+ticket,uid,now,'session:'+session.token,uid,now,'active-session:'+uid,ownerHash,now),
  db.prepare("UPDATE auth_kv SET v='',expires_at=0 WHERE k=? AND v=? AND EXISTS(SELECT 1 FROM auth_kv WHERE k=? AND v=?)").bind('legacy:'+ticket,uid,key,value)
 ]);
 return results[0]?.meta?.changes===1?{status:200}:{status:403,error:'verification_expired'};
}
export async function googleStatus(db,session,now=Date.now()){
 if(!db||!USERS.has(session?.uid))return {status:403,error:'forbidden'};
 const row=await db.prepare('SELECT 1 AS linked FROM auth_kv WHERE k>=? AND k<? AND v=? AND (expires_at=0 OR expires_at>?) LIMIT 1').bind('identity:google:','identity:google:\uFFFF',session.uid,now).first();
 return {status:200,linked:!!row};
}
export async function unlinkGoogle(db,session,{ticket,ownerHash,operationId,now=Date.now()}){
 if(!db||!USERS.has(session?.uid)||!session.token||typeof ticket!=='string'||!ticket||ticket.length>256||typeof ownerHash!=='string'||!ownerHash||!/^[-a-zA-Z0-9_]{16,100}$/.test(operationId||''))return {status:403,error:'verification_required'};
 const uid=session.uid,op='google-unlink-op:'+operationId;
 // Claim a one-use reauthentication ticket only while this exact session owns the lease.
 const claim=db.prepare(`INSERT INTO auth_kv(k,v,expires_at) SELECT ?,?,? WHERE
 EXISTS(SELECT 1 FROM auth_kv WHERE k=? AND v=? AND expires_at>?) AND
 EXISTS(SELECT 1 FROM auth_kv WHERE k=? AND json_valid(v) AND json_extract(v,'$.uid')=? AND expires_at>?) AND
 EXISTS(SELECT 1 FROM auth_kv WHERE k=? AND v=? AND expires_at>?) ON CONFLICT(k) DO NOTHING`).bind(op,uid,now+600000,'legacy:'+ticket,uid,now,'session:'+session.token,uid,now,'active-session:'+uid,ownerHash,now);
 const allowed='EXISTS(SELECT 1 FROM auth_kv WHERE k=? AND v=?)';
 const statements=[claim,
  db.prepare(`UPDATE auth_kv SET v='',expires_at=0 WHERE k>=? AND k<? AND v=? AND ${allowed}`).bind('identity:google:','identity:google:\uFFFF',uid,op,uid),
  db.prepare(`UPDATE auth_kv SET v='',expires_at=0 WHERE k>=? AND k<? AND json_valid(v) AND json_extract(v,'$.uid')=? AND json_extract(v,'$.provider')='google' AND k<>? AND ${allowed}`).bind('session:','session:\uFFFF',uid,'session:'+session.token,op,uid),
  db.prepare(`UPDATE auth_kv SET v='',expires_at=0 WHERE k>=? AND k<? AND v=? AND ${allowed}`).bind('legacy:','legacy:\uFFFF',uid,op,uid),
  db.prepare(`UPDATE auth_kv SET v='',expires_at=0 WHERE k>=? AND k<? AND json_valid(v) AND json_extract(v,'$.uid')=? AND json_extract(v,'$.provider')='google' AND ${allowed}`).bind('oauth:','oauth:\uFFFF',uid,op,uid),
  db.prepare(`INSERT INTO auth_kv(k,v,expires_at) SELECT ?,'1',0 WHERE ${allowed} ON CONFLICT(k) DO UPDATE SET v='1',expires_at=0`).bind('google-reset:'+uid,op,uid),
  db.prepare(`INSERT INTO auth_kv(k,v,expires_at) SELECT ?,?,0 WHERE ${allowed} ON CONFLICT(k) DO UPDATE SET v=excluded.v,expires_at=0`).bind('google-link-version:'+uid,operationId,op,uid),
  db.prepare('DELETE FROM auth_kv WHERE k=? AND v=?').bind(op,uid)
 ];
 const result=await db.batch(statements);
 if(result[0]?.meta?.changes!==1)return {status:403,error:'verification_expired'};
 return {status:200,linked:false};
}
