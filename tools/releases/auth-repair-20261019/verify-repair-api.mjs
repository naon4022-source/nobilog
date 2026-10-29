// Actual reset SQL + actual Worker. Memory-only SQL/KV and fake providers, never real credentials.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createHash,createHmac} from 'node:crypto';
const require=createRequire(import.meta.url),{D1SQLite}=require('../../../.claude/verify/d1-sqlite.js'),root=new URL('./',import.meta.url);
const source=await readFile(new URL('candidate/cf-worker/src/index.js',root),'utf8'),M=await import('data:text/javascript;base64,'+Buffer.from(source+'\nexport {authGet};').toString('base64'));
const sql=await readFile(new URL('reset-nao-google.sql',root),'utf8'),originalFetch=globalThis.fetch;
let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++;};
const hash=s=>createHash('sha256').update(s).digest('base64url');
try{
 for(const round of [1,2]){
  const db=new D1SQLite(),kv=new Map(),env={AUTH_DB:db,BOARD:{get:async k=>kv.get(k)||null,put:async(k,v)=>kv.set(k,v),delete:async k=>kv.delete(k)},APP_ORIGIN:'https://nobilog.pages.dev',PIN_PEPPER:'synthetic-repair-pepper',TURNSTILE_SECRET:'synthetic-turnstile',GOOGLE_CLIENT_ID:'synthetic-client',GOOGLE_CLIENT_SECRET:'synthetic-only'};
  for(const [name,pin]of [['NAO','synthetic-nao'],['RIRAN','synthetic-riran'],['SOUTA','0000']])env['LEGACY_'+name+'_PIN_HASH']=createHmac('sha256',env.PIN_PEPPER).update(pin).digest('base64url');
  let sub='synthetic-shared-google',ticketCounter=0;
  globalThis.fetch=async url=>{
   if(String(url).includes('/siteverify'))return Response.json({success:true,hostname:'nobilog.pages.dev',action:'legacy_login',challenge_ts:new Date().toISOString()});
   if(String(url).includes('/token'))return Response.json({access_token:'synthetic-only'});
   if(String(url).includes('/userinfo'))return Response.json({sub,name:'Synthetic'});
   throw Error('unexpected outbound request');
  };
  const call=async(path,token,body)=>M.default.fetch(new Request('https://worker.test'+path,{method:body===undefined?'GET':'POST',headers:{Origin:env.APP_ORIGIN,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})}),env,{});
  const json=async(...args)=>{const r=await call(...args);return {status:r.status,data:await r.json()};};
  const pinLogin=async pin=>{const first=await json('/auth/legacy',null,{pin,turnstile:'synthetic-turnstile-'+round+'-'+(++ticketCounter)});ok(first.status===200,'synthetic PIN accepted');return json('/auth/legacy/login',null,{ticket:first.data.ticket});};
  const link=async token=>{const a=await json('/auth/link/google',token,{return:env.APP_ORIGIN+'/'});ok(a.status===200&&a.data.url,'authenticated link begins');const state=new URL(a.data.url).searchParams.get('state');return call('/auth/callback/google?state='+state+'&code=synthetic-code');};
  try{
   db.seed('identity:google:synthetic-nao-d1','u1',0);db.seed('session:synthetic-old-nao-google',JSON.stringify({uid:'u1',name:'なお',provider:'google'}),Date.now()+60000);
   db.seed('session:synthetic-nao-pin',JSON.stringify({uid:'u1',name:'なお',provider:'pin'}),Date.now()+60000);db.seed('active-session:u1',hash('synthetic-old-nao-google'),Date.now()+180000);
   db.seed('legacy:synthetic-nao-ticket','u1',Date.now()+60000);db.seed('oauth:synthetic-nao-link',JSON.stringify({uid:'u1',provider:'google',mode:'session-link'}),Date.now()+60000);
   const protectedRows={'identity:google:synthetic-riran':'u2','identity:google:synthetic-existing-souta':'u4','identity:line:synthetic-nao-line':'u1','session:synthetic-riran':JSON.stringify({uid:'u2',provider:'google'}),'session:synthetic-souta':JSON.stringify({uid:'u4',provider:'google'}),'legacy:synthetic-riran-ticket':'u2','school-result:u1:synthetic':'synthetic-protected-marks','school-calendar:synthetic':'synthetic-protected-calendar','cloud-save:u1':'synthetic-protected-save','cloud-save:u4':'synthetic-protected-souta-save'};
   for(const [k,v]of Object.entries(protectedRows))db.seed(k,v,0);
   kv.set('identity:google:synthetic-shared-google','u1');kv.set('session:synthetic-kv-nao-google',JSON.stringify({uid:'u1',provider:'google'}));kv.set('legacy:synthetic-kv-nao-ticket','u1');kv.set('session:synthetic-kv-nao-pin',JSON.stringify({uid:'u1',provider:'pin'}));kv.set('identity:line:synthetic-kv-nao-line','u1');kv.set('identity:google:synthetic-kv-riran','u2');
   ok(await M.authGet(env,'identity:google:synthetic-shared-google')==='u1','reproduces KV-only old Google identity before reset');
   const protectedKv=JSON.stringify([...kv]);db.db.exec(sql);
   ok(db.get('google-reset:u1')?.v==='1','scoped fallback revocation marker set');
   ok(db.get('identity:google:synthetic-nao-d1')?.v==='','D1 Google identity tombstoned');
   ok(db.get('session:synthetic-old-nao-google')?.v==='','D1 Google session tombstoned');
   ok(db.get('legacy:synthetic-nao-ticket')?.v==='','old pending password proof invalidated');
   ok(db.get('oauth:synthetic-nao-link')?.v==='','pending own Google link invalidated');
   ok(db.get('active-session:u1')?.expires_at===1,'old account lease released without reading owner');
   for(const [k,v]of Object.entries(protectedRows))ok(db.get(k)?.v===v,'unrelated record preserved '+k);
   ok(JSON.stringify([...kv])===protectedKv,'no bulk KV reads/deletes or learning writes');
   for(const k of ['identity:google:synthetic-shared-google','session:synthetic-kv-nao-google','legacy:synthetic-kv-nao-ticket'])ok(await M.authGet(env,k)===null,'old KV Google/proof cannot resurrect '+k);
   for(const k of ['session:synthetic-kv-nao-pin','identity:line:synthetic-kv-nao-line','identity:google:synthetic-kv-riran'])ok(await M.authGet(env,k)===kv.get(k),'other identity or password session remains valid '+k);
   ok((await call('/auth/me','synthetic-old-nao-google')).status===401,'revoked Google login rejected');
   ok((await call('/auth/me','synthetic-kv-nao-google')).status===401,'revoked KV Google login rejected');
   const nao=await json('/auth/me','synthetic-nao-pin');ok(nao.status===200&&nao.data.user.id==='u1'&&!nao.data.user.googleLinked,'Nao PIN session retained and reports unlinked');
   const login=await pinLogin('0000');ok(login.status===200&&login.data.user.id==='u4'&&login.data.user.name==='そうた','PIN ticket logs into Souta, never Nao');
   // Existing other Souta identity does not affect the current link test.
   db.db.prepare('UPDATE auth_kv SET v=\'\' WHERE k=?').run('identity:google:synthetic-existing-souta');
   let result=await link(login.data.session);ok(result.headers.get('location')?.endsWith('#google_link=ok'),'previously mislinked Google can now link to authenticated Souta');
   ok(db.get('identity:google:synthetic-shared-google')?.v==='u4','new Google mapping belongs to Souta');
   await call('/auth/logout',login.data.session,{});
   db.seed('oauth:synthetic-new-google-login',JSON.stringify({provider:'google',mode:'login',nonce:'synthetic-nonce',back:env.APP_ORIGIN+'/'}),Date.now()+60000);
   result=await call('/auth/callback/google?state=synthetic-new-google-login&code=synthetic-code');
   const token=new URLSearchParams(new URL(result.headers.get('location')).hash.slice(1)).get('auth');
   const me=await json('/auth/me',token);ok(me.status===200&&me.data.user.id==='u4'&&me.data.user.provider==='google','next Google login resolves to Souta');
   sub='synthetic-nao-new-google';result=await link('synthetic-nao-pin');ok(result.headers.get('location')?.endsWith('#google_link=ok'),'Nao can re-link own different Google after reset');
   ok(db.get('identity:google:'+sub)?.v==='u1','new verified D1 Nao identity accepted despite old reset marker');
   db.db.exec(sql);ok(db.get('identity:google:'+sub)?.v==='u1','retry of same reset cannot delete a fresh legitimate relink');
   ok(db.get('identity:google:synthetic-shared-google')?.v==='u4','retry cannot remove Souta link');
   // Failure of the authoritative reset check must not restore a revoked KV identity.
   const prepare=db.prepare.bind(db);db.prepare=s=>{if(s.includes('SELECT 1 AS revoked'))throw Error('synthetic D1 outage');return prepare(s);};
   ok(await M.authGet(env,'identity:google:synthetic-shared-google-missing')===null,'missing KV stays absent');
   kv.set('identity:google:synthetic-failure','u1');ok(await M.authGet(env,'identity:google:synthetic-failure')===null,'reset lookup failure denies old Nao KV Google');db.prepare=prepare;
  }finally{db.close();}
 }
}finally{globalThis.fetch=originalFetch;}
await writeFile(new URL('repair-api-result.json',root),JSON.stringify({passed:true,checks,rounds:2,realCalls:0,realUserDataRead:false,realSecretsRead:false},null,2)+'\n');
console.log('Authentication repair:',checks,'checks passed; actual reset SQL, no old Google resurrection, correct Souta PIN/Google identity, Nao re-link, unrelated data and retry preservation; synthetic only');
