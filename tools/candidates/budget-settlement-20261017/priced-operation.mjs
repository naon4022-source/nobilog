import {reserveOperation} from '../../../cf-worker/src/openai-receipts.mjs';
import {reserveMicroYen} from '../../../cf-worker/src/openai-policy.mjs';
const UID=/^(u[12]|p_(free|mini|standard|pro|unlimit))$/,ID=/^[a-zA-Z0-9_-]{8,64}$/;
const validCounter="expires_at=0 AND length(v) BETWEEN 1 AND 9 AND v GLOB '[0-9]*' AND v NOT GLOB '*[^0-9]*'";
const opKey=(uid,id)=>{if(!UID.test(uid)||typeof id!=='string'||!ID.test(id))throw Error('invalid_operation');return 'openai-operation:'+uid+':'+id;};
function validPrice(p,amount){
 if(!p||Object.keys(p).sort().join(',')!=='inputUpperBound,maxOutputTokens,model,version'||p.version!==1)return false;
 try{return reserveMicroYen(p.model,p.inputUpperBound,p.maxOutputTokens)===amount;}catch(_){return false;}
}
export async function reservePricedOperation(db,env,uid,id,digest,policy,now=Date.now()){
 const key=opKey(uid,id),p={version:1,model:policy?.body?.model,inputUpperBound:policy?.inputUpperBound,maxOutputTokens:policy?.body?.max_output_tokens},amount=policy?.reservation;
 if(policy?.body?.service_tier!=='default'||policy?.body?.store!==false||typeof policy?.body?.input!=='string'||typeof policy?.body?.instructions!=='string'||Object.hasOwn(policy.body,'tools')||new TextEncoder().encode(policy.body.instructions+policy.body.input).length+512!==p.inputUpperBound||!validPrice(p,amount))return {error:'invalid_operation'};
 const reserved=await reserveOperation(db,env,uid,id,digest,amount,now);
 if(reserved.error||reserved.state!=='reserved')return reserved;
 // The price is pinned before startOperation can permit a provider call.
 await db.prepare("UPDATE auth_kv SET v=json_set(v,'$.pricing',json(?)) WHERE k=? AND json_extract(v,'$.token')=? AND json_extract(v,'$.state')='reserved' AND json_type(v,'$.pricing') IS NULL RETURNING v").bind(JSON.stringify(p),key,reserved.token).first('v');
 const raw=await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind(key).first('v');
 let row;try{row=JSON.parse(raw);}catch(_){return {error:'operation_invalid'};}
 if(row.token!==reserved.token||row.state!=='reserved')return {error:'request_in_progress'};
 if(!validPrice(row.pricing,row.amount)||JSON.stringify(row.pricing)!==JSON.stringify(p))return {error:'operation_invalid'};
 return reserved;
}
// Successful text-only results only. This is a conservative local estimate,
// not a provider refund or an exact invoice amount. Unknown calls stay held.
export async function completePricedOperation(db,uid,id,token,result){
 const key=opKey(uid,id),text=JSON.stringify(result?.value);
 if(!text||text.length>12000||result?.real!==true||!result.usage||Object.keys(result.usage).sort().join(',')!=='input,output')return false;
 const raw=await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind(key).first('v');
 let row;try{row=JSON.parse(raw);}catch(_){return false;}
 const {input,output}=result.usage,p=row?.pricing;
 if(!row||row.token!==token||!['started','done'].includes(row.state)||!validPrice(p,row.amount)||result.model!==p.model||result.reservedMicroYen!==row.amount||!Number.isSafeInteger(input)||input<0||input>p.inputUpperBound||!Number.isSafeInteger(output)||output<0||output>p.maxOutputTokens||!/^openai-budget:20\d{2}-(0[1-9]|1[0-2])$/.test(row.month||''))return false;
 // A request's desired tier alone is not proof of the tier actually billed.
 // Older successful replies without tier evidence keep the full reservation.
 if(result.billingTier===undefined){
  if(row.state==='done')return !row.settlement&&JSON.stringify(row.value)===text;
  const saved=await db.prepare("UPDATE auth_kv SET v=json_set(v,'$.state','done','$.value',json(?)) WHERE k=? AND v=? AND EXISTS(SELECT 1 FROM auth_kv WHERE k=? AND "+validCounter+" AND CAST(v AS INTEGER)>=?) RETURNING v").bind(text,key,raw,row.month,row.amount).first('v');
  if(saved)return true;
  const latestRaw=await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind(key).first('v');let latest;try{latest=JSON.parse(latestRaw);}catch(_){return false;}
  return latest?.state==='done'&&latest.token===token&&!latest.settlement&&JSON.stringify(latest.value)===text;
 }
 if(result.billingTier!=='default')return false;
 // A minimum token in each direction keeps zero-usage replies conservative.
 const amount=reserveMicroYen(p.model,Math.max(1,input),Math.max(1,output));
 if(amount>row.amount)return false;
 const settlement={version:1,model:p.model,input,output,estimatedMicroYen:amount};
 if(row.state==='done')return JSON.stringify(row.value)===text&&JSON.stringify(row.settlement)===JSON.stringify(settlement);
 const release=row.amount-amount,nonce=crypto.randomUUID();
 const results=await db.batch([
  db.prepare("UPDATE auth_kv SET v=json_set(v,'$.state','done','$.value',json(?),'$.settlement',json(?),'$.settleToken',?) WHERE k=? AND v=? AND EXISTS(SELECT 1 FROM auth_kv WHERE k=? AND "+validCounter+" AND CAST(v AS INTEGER)>=?)").bind(text,JSON.stringify(settlement),nonce,key,raw,row.month,row.amount),
  db.prepare("UPDATE auth_kv SET v=CAST(CAST(v AS INTEGER)-CAST(? AS INTEGER) AS TEXT) WHERE k=? AND EXISTS(SELECT 1 FROM auth_kv WHERE k=? AND json_extract(v,'$.state')='done' AND json_extract(v,'$.settleToken')=?)").bind(release,row.month,key,nonce)
 ]);
 if(results[0]?.meta?.changes===1&&results[1]?.meta?.changes===1)return true;
 // Concurrent completion is accepted only if the same value and estimate won.
 const latestRaw=await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind(key).first('v');
 let latest;try{latest=JSON.parse(latestRaw);}catch(_){return false;}
 return latest?.state==='done'&&latest.token===token&&JSON.stringify(latest.value)===text&&JSON.stringify(latest.settlement)===JSON.stringify(settlement);
}
