// Conservative reservations remain charged locally when the outcome is unknown.
// No refund/settlement until authoritative provider usage has been validated.
export function monthKey(now){
 if(!Number.isSafeInteger(now)||now<0)throw Error('invalid_time');
 return 'openai-budget:'+new Date(now+32400000).toISOString().slice(0,7);
}
export function budgetLimit(env){
 const v=env?.OPENAI_MONTHLY_LIMIT_YEN;
 if(typeof v!=='string'||!/^\d{1,3}$/.test(v))return null;
 const yen=Number(v);
 return Number.isInteger(yen)&&yen>=1&&yen<=800?yen*1000000:null;
}
export async function reserveBudget(db,env,amount,now=Date.now()){
 const limit=budgetLimit(env);
 if(!db||!limit||!Number.isSafeInteger(amount)||amount<1||amount>limit)return false;
 const key=monthKey(now);
 return !!await db.prepare("INSERT INTO auth_kv(k,v,expires_at) SELECT ?,CAST(CAST(? AS INTEGER) AS TEXT),0 WHERE ?<=? ON CONFLICT(k) DO UPDATE SET v=CAST(CAST(auth_kv.v AS INTEGER)+CAST(? AS INTEGER) AS TEXT) WHERE auth_kv.expires_at=0 AND length(auth_kv.v) BETWEEN 1 AND 9 AND auth_kv.v GLOB '[0-9]*' AND auth_kv.v NOT GLOB '*[^0-9]*' AND CAST(auth_kv.v AS INTEGER)+CAST(? AS INTEGER)<=? RETURNING v").bind(key,amount,amount,limit,amount,amount,limit).first();
}
