// 本人のパスワード変更（2026-10-22 Claude・準備コード。admin ができるまで使えない状態）
// ・原文のPINは保存しない／返さない。PIN_PEPPER で署名した検証値だけを、認証用ストア（AUTH_DB の auth_kv）へ保存する。
// ・PASSWORD_CHANGE_ENABLED==="1" と PASSWORD_CHANGE_ADMIN_READY==="1" の両方がそろうまで、何も読まず何も変えずに 503 を返す。
// ・本人（ログイン中のセッションのUID）だけ。今のパスワードの確認、5回まちがえると15分止める、版番号（rev）で同時変更を防ぐ。
const FAMILY=new Set(['u1','u2','u4']);
const MAX_FAIL=5,LOCK_MS=15*60*1000;
export function passwordChangeEnabled(env){return env&&env.PASSWORD_CHANGE_ENABLED==='1'&&env.PASSWORD_CHANGE_ADMIN_READY==='1'&&!!env.PIN_PEPPER;}
export function validNewPin(pin){
 const s=String(pin??'');
 if(!/^\d{4,8}$/.test(s))return '新しいパスワードは4〜8けたの数字にしてください。';
 if(/^(\d)\1+$/.test(s))return '同じ数字だけのパスワードは使えません。';
 if('01234567890'.includes(s)||'09876543210'.includes(s))return '1234 や 9876 のように並んだ数字は使えません。';
 return '';
}
// deps: {store:{get(k),put(k,v),cas(k,expectedRaw,newRaw)}, keyedDigest(value,secret), constantEqual(a,b), legacyVerifier(uid,env), now()}
export function createPasswordChange(deps){
 const {store,keyedDigest,constantEqual,legacyVerifier}=deps,now=deps.now||(()=>Date.now());
 async function currentVerifier(uid,env){
  const raw=await store.get('pin-override:'+uid);
  if(raw){try{const r=JSON.parse(raw);if(r&&r.v===1&&typeof r.verifier==='string')return {verifier:r.verifier,salted:true,raw,rev:r.rev|0};}catch{}}
  return {verifier:legacyVerifier(uid,env),salted:false,raw:null,rev:0};
 }
 async function digestFor(uid,pin,salted,env){return salted?keyedDigest(uid+':'+pin,env.PIN_PEPPER):keyedDigest(pin,env.PIN_PEPPER);}   // 今のSecretsの値は uid なしの形
 async function verify(uid,pin,env){const cur=await currentVerifier(uid,env);if(!cur.verifier)return {ok:false,cur};return {ok:constantEqual(await digestFor(uid,pin,cur.salted,env),cur.verifier),cur};}
 async function handle(body,env,owner){
  if(!passwordChangeEnabled(env))return {status:503,body:{error:'パスワードの変更は、管理画面ができてから使えます。'}};
  const uid=owner&&owner.uid;if(!FAMILY.has(uid))return {status:403,body:{error:'この機能は使えません。'}};
  if(!body||typeof body!=='object'||typeof body.current!=='string'||typeof body.next!=='string'||!Number.isInteger(body.rev))return {status:400,body:{error:'入力を確認してください。'}};
  const lockKey='pin-change-fail:'+uid;let fail={n:0,until:0};try{fail=JSON.parse(await store.get(lockKey)||'{"n":0,"until":0}');}catch{}
  if(fail.until>now())return {status:429,body:{error:'まちがいが多すぎます。15分待ってください。'}};
  const msg=validNewPin(body.next);if(msg)return {status:400,body:{error:msg}};
  if(body.next===body.current)return {status:400,body:{error:'今と同じパスワードにはできません。'}};
  const {ok,cur}=await verify(uid,body.current,env);
  if(!ok){const n=fail.n+1;await store.put(lockKey,JSON.stringify(n>=MAX_FAIL?{n:0,until:now()+LOCK_MS}:{n,until:0}));return {status:401,body:{error:'今のパスワードがちがいます。'}};}
  if(body.rev!==cur.rev)return {status:409,body:{error:'ほかの画面で変更されました。読み直してください。',rev:cur.rev}};
  const record=JSON.stringify({v:1,verifier:await digestFor(uid,body.next,true,env),rev:cur.rev+1,at:now()});
  if(!(await store.cas('pin-override:'+uid,cur.raw,record)))return {status:409,body:{error:'ほかの画面で変更されました。読み直してください。'}};
  await store.put(lockKey,JSON.stringify({n:0,until:0}));
  return {status:200,body:{ok:true,rev:cur.rev+1}};   // 原文も検証値も返さない
 }
 return {handle,verify};
}
