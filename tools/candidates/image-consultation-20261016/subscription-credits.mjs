// 日次の「回分」。内部は0.5回分＝1単位の整数。旧月次記録は変更しない。
const DAY=86400000,JST=9*3600000;
const UID=/^(u[12]|p_(free|mini|standard|pro|unlimit))$/;
export const CREDIT_LIMITS=Object.freeze({free:0,mini:20,standard:100,pro:500,unlimit:5000});
export const creditPolicyOn=env=>env?.SUBSCRIPTION_PREVIEW==='1'&&env?.PLAN_CREDITS_V2==='1';
export function creditUnits(purpose,imageCount){
 if(purpose==='image_analysis'){const n=imageCount===undefined?1:imageCount;if(!Number.isSafeInteger(n)||n<1||n>3)throw Error('invalid image count');return 6*n;}
 if(imageCount!==undefined)throw Error('unexpected image count');
 return purpose==='hint'?1:['note_analysis','deep_explain'].includes(purpose)?6:2;
}
const dayOf=now=>Math.floor((now+JST)/DAY);
const keyFor=(uid,now)=>'plan-credit-day:'+uid+':'+dayOf(now);
function validate(uid,plan,now,units=2){if(!UID.test(uid)||!Object.hasOwn(CREDIT_LIMITS,plan)||!Number.isSafeInteger(now)||now<0||![1,2,6,12,18].includes(units))throw Error('invalid credit request');}
function parse(raw){if(!raw)return {version:2,units:0,calls:0};const r=JSON.parse(raw);if(r.version!==2||!Number.isSafeInteger(r.units)||r.units<0||!Number.isSafeInteger(r.calls)||r.calls<0)throw Error('invalid credit record');return r;}
export async function creditStatus(db,uid,plan,now){validate(uid,plan,now);const r=parse(await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind(keyFor(uid,now)).first('v'));const limit=CREDIT_LIMITS[plan];return {creditsVersion:'daily-v2',quotaKey:keyFor(uid,now),dailyLimit:limit,dailyUsed:r.units/2,dailyLeft:Math.max(0,limit-r.units/2),callsToday:r.calls,resetAt:(dayOf(now)+1)*DAY-JST,costs:{light:.5,normal:1,heavy:3}};}
export async function chargeCredits(db,uid,plan,now,receipt,units=2,commit=null){
 validate(uid,plan,now,units);const limit=CREDIT_LIMITS[plan]*2;if(!limit)return false;
 const key=keyFor(uid,now),token=crypto.randomUUID(),receiptKey='plan-credit-charge:'+uid+':'+token,expiry=(dayOf(now)+1)*DAY-JST+400*DAY;
 const guard=commit?' AND EXISTS(SELECT 1 FROM auth_kv WHERE k=? AND v=?)':'';
 const guardArgs=commit?[commit.key,commit.pending]:[];
 const statement=db.prepare("INSERT INTO auth_kv(k,v,expires_at) SELECT ?,?,? WHERE ?<=?"+guard+" ON CONFLICT(k) DO UPDATE SET v=json_object('version',2,'units',CAST(json_extract(auth_kv.v,'$.units') AS INTEGER)+CAST(? AS INTEGER),'calls',CAST(json_extract(auth_kv.v,'$.calls') AS INTEGER)+1,'lastCharge',?) WHERE json_extract(auth_kv.v,'$.version')=2 AND json_type(auth_kv.v,'$.units')='integer' AND json_extract(auth_kv.v,'$.units')>=0 AND json_type(auth_kv.v,'$.calls')='integer' AND json_extract(auth_kv.v,'$.calls')>=0 AND CAST(json_extract(auth_kv.v,'$.units') AS INTEGER)+CAST(? AS INTEGER)<=?"+guard);
 const statements=[statement.bind(key,JSON.stringify({version:2,units,calls:1,lastCharge:token}),expiry,units,limit,...guardArgs,units,token,units,limit,...guardArgs)];
 if(receipt)statements.push(db.prepare("INSERT INTO auth_kv(k,v,expires_at) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM auth_kv WHERE k=? AND json_extract(v,'$.lastCharge')=?)").bind(receiptKey,JSON.stringify({uid,key,units,refunded:false}),expiry,key,token));
 if(commit)statements.push(db.prepare("UPDATE auth_kv SET v=? WHERE k=? AND v=? AND EXISTS(SELECT 1 FROM auth_kv WHERE k=? AND json_extract(v,'$.lastCharge')=?)").bind(commit.result,commit.key,commit.pending,key,token));
 const result=await db.batch(statements),allowed=result[0]?.meta?.changes===1&&(!commit||result.at(-1)?.meta?.changes===1);
 if(allowed&&receipt)Object.assign(receipt,{key,day:dayOf(now),units,receiptKey});return allowed;
}
export async function refundCredits(db,uid,receipt){
 if(!UID.test(uid)||!receipt||!new RegExp('^plan-credit-day:'+uid+':\\d+$').test(receipt.key)||!new RegExp('^plan-credit-charge:'+uid+':[a-f0-9-]{36}$').test(receipt.receiptKey)||![1,2,6,12,18].includes(receipt.units))throw Error('invalid credit refund');
 const raw=await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind(receipt.receiptKey).first('v');if(!raw)return false;const r=JSON.parse(raw);if(r.uid!==uid||r.key!==receipt.key||r.units!==receipt.units||typeof r.refunded!=='boolean')throw Error('invalid credit refund');if(r.refunded)return false;
 const results=await db.batch([
  db.prepare("UPDATE auth_kv SET v=json_set(v,'$.units',MAX(0,CAST(json_extract(v,'$.units') AS INTEGER)-CAST(? AS INTEGER)),'$.calls',MAX(0,CAST(json_extract(v,'$.calls') AS INTEGER)-1)) WHERE k=? AND EXISTS(SELECT 1 FROM auth_kv WHERE k=? AND json_extract(v,'$.refunded')=0)").bind(r.units,r.key,receipt.receiptKey),
  db.prepare("UPDATE auth_kv SET v=json_set(v,'$.refunded',json('true')) WHERE k=? AND json_extract(v,'$.refunded')=0").bind(receipt.receiptKey)
 ]);return results[1]?.meta?.changes===1;
}
