// Server-internal operation journal. Caller supplies authenticated uid and a
// SHA-256 digest of the validated request, never a client-selected plan/model.
import {monthKey,budgetLimit} from './openai-budget.mjs';
const UID=/^(u[12]|p_(free|mini|standard|pro|unlimit))$/;
const ID=/^[a-zA-Z0-9_-]{8,64}$/;
const HASH=/^[a-f0-9]{64}$/;
const validCounter="expires_at=0 AND length(v) BETWEEN 1 AND 9 AND v GLOB '[0-9]*' AND v NOT GLOB '*[^0-9]*'";
function operationKey(uid,id){if(!UID.test(uid)||!ID.test(id))throw Error('invalid_operation');return 'openai-operation:'+uid+':'+id;}
export async function reserveOperation(db,env,uid,id,digest,amount,now=Date.now()){
 const key=operationKey(uid,id),limit=budgetLimit(env);
 if(!db||!limit||!HASH.test(digest)||!Number.isSafeInteger(amount)||amount<1||amount>limit)return {error:'invalid_operation'};
 const month=monthKey(now),token=crypto.randomUUID();
 const row={digest,amount,month,token,state:'reserved',at:now};
 // All statements are in one D1 transaction. A fresh nonce means a competing
 // duplicate cannot increment the global budget using an earlier receipt.
 const exists="EXISTS(SELECT 1 FROM auth_kv WHERE k=? AND json_extract(v,'$.token')=?)";
 const results=await db.batch([
  db.prepare("INSERT INTO auth_kv(k,v,expires_at) SELECT ?,?,0 WHERE (NOT EXISTS(SELECT 1 FROM auth_kv WHERE k=?) OR EXISTS(SELECT 1 FROM auth_kv WHERE k=? AND "+validCounter+" AND CAST(v AS INTEGER)+?<=?)) ON CONFLICT(k) DO NOTHING").bind(key,JSON.stringify(row),month,month,amount,limit),
  db.prepare("INSERT INTO auth_kv(k,v,expires_at) SELECT ?,CAST(CAST(? AS INTEGER) AS TEXT),0 WHERE "+exists+" ON CONFLICT(k) DO UPDATE SET v=CAST(CAST(auth_kv.v AS INTEGER)+CAST(? AS INTEGER) AS TEXT) WHERE "+exists).bind(month,amount,key,token,amount,key,token)
 ]);
 if(results[0]?.meta?.changes===1&&results[1]?.meta?.changes===1)return {state:'reserved',token};
 const raw=await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind(key).first('v');
 if(!raw)return {error:'ai_budget'};
 const previous=JSON.parse(raw);
 if(previous.digest!==digest||previous.amount!==amount)return {error:'id_conflict'};
 if(!['reserved','started','done'].includes(previous.state))return {error:'operation_invalid'};
 // Resuming a reservation is safe only before the external-call checkpoint.
 if(previous.state==='reserved')return {state:'reserved',token:previous.token,cached:true};
 return {state:previous.state,cached:true,...(previous.state==='done'?{value:previous.value}:{})};
}
export async function startOperation(db,uid,id,token){
 if(typeof token!=='string'||!/^[a-f0-9-]{36}$/.test(token))return false;
 return !!await db.prepare("UPDATE auth_kv SET v=json_set(v,'$.state','started') WHERE k=? AND json_extract(v,'$.token')=? AND json_extract(v,'$.state')='reserved' RETURNING v").bind(operationKey(uid,id),token).first('v');
}
export async function completeOperation(db,uid,id,token,value){
 // Only validated educational results enter this function. Never prompts/keys.
 const text=JSON.stringify(value);
 if(!text||text.length>12000)throw Error('invalid_result');
 const saved=await db.prepare("UPDATE auth_kv SET v=json_set(v,'$.state','done','$.value',json(?)) WHERE k=? AND json_extract(v,'$.token')=? AND json_extract(v,'$.state')='started' RETURNING v").bind(text,operationKey(uid,id),token).first('v');
 return !!saved;
}
