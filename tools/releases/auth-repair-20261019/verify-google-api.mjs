import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url),{D1SQLite}=require('../../../.claude/verify/d1-sqlite.js');
const root=new URL('./',import.meta.url),source=await readFile(new URL('candidate/cf-worker/src/index.js',root),'utf8');
const M=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
let checks=0;const ok=(v,label)=>{assert.ok(v,label);checks++;},hash=s=>createHash('sha256').update(s).digest('base64url');
const originalFetch=globalThis.fetch;
try{
 for(let round=1;round<=2;round++){
  const db=new D1SQLite(),kv=new Map(),env={AUTH_DB:db,BOARD:{get:async k=>kv.get(k)||null,put:async(k,v)=>kv.set(k,v),delete:async k=>kv.delete(k)},APP_ORIGIN:'https://nobilog.pages.dev',GOOGLE_CLIENT_ID:'synthetic-client',GOOGLE_CLIENT_SECRET:'synthetic-only'};
  let sub='synthetic-google-'+round,providerFailure=false;
  globalThis.fetch=async url=>{if(providerFailure)throw Error('synthetic provider unavailable');if(String(url).includes('/token'))return Response.json({access_token:'synthetic-only'});if(String(url).includes('/userinfo'))return Response.json({sub,name:'Untrusted display'});throw Error('unexpected outbound call');};
  const sessions=[['synthetic-nao','u1','pin'],['synthetic-riran','u2','pin'],['synthetic-souta','u4','pin'],['synthetic-guest','x_other','google']];
  for(const[token,uid,provider]of sessions)db.seed('session:'+token,JSON.stringify({uid,name:'Synthetic',provider}),Date.now()+3600000);
  const request=async(path,token,body,method=body===undefined?'GET':'POST',origin=env.APP_ORIGIN)=>M.default.fetch(new Request('https://worker.test'+path,{method,headers:{Origin:origin,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(['GET','HEAD'].includes(method)?{}:{body:JSON.stringify(body===undefined?{}:body)})}),env,{});
  const json=async(...args)=>{const r=await request(...args);return {status:r.status,data:await r.json()};};
  const start=async(token='synthetic-souta',body={return:env.APP_ORIGIN+'/'})=>{const r=await json('/auth/link/google',token,body);return {...r,state:r.data.url?new URL(r.data.url).searchParams.get('state'):null};};
  const callback=async(state,tail='code=synthetic-code')=>request('/auth/callback/google?state='+state+'&'+tail);
  try{
   ok((await request('/auth/link/google',null,{})).status===401,'unauthenticated start rejected');
   ok((await request('/auth/link/google','synthetic-guest',{})).status===401,'non-password outsider rejected');
   ok((await request('/auth/link/google','synthetic-souta',{},'GET')).status===405,'GET cannot begin link');
   ok((await request('/auth/link/google','synthetic-souta',{},'POST','https://evil.test')).status===403,'foreign origin rejected');
   for(const body of [{uid:'u1'},{return:[]},[],null])ok((await start('synthetic-souta',body)).status===400,'invalid/forged body rejected');
   const savedSecret=env.GOOGLE_CLIENT_SECRET;delete env.GOOGLE_CLIENT_SECRET;ok((await start()).status===503,'missing Google config fails closed');env.GOOGLE_CLIENT_SECRET=savedSecret;
   let a=await start();ok(a.status===200&&a.state,'own password session starts Google link');
   const target=new URL(a.data.url);ok(target.origin==='https://accounts.google.com'&&target.searchParams.get('prompt')==='select_account','official account chooser');
   ok(!a.data.url.includes('synthetic-souta')&&!a.data.url.includes('synthetic-only')&&!a.data.url.includes('legacy:'),'session/secret/legacy ticket absent from URL');
   const rec=JSON.parse(db.get('oauth:'+a.state).v);ok(rec.uid==='u4'&&rec.owner===hash('synthetic-souta')&&!JSON.stringify(rec).includes('synthetic-souta'),'intent bound to authenticated UID and hash');
   let r=await callback(a.state,'error=access_denied');ok(r.status===302&&r.headers.get('location').endsWith('#google_link_error=cancelled'),'cancel returns to app');
   ok(!db.get('identity:google:'+sub),'cancel creates no identity');
   ok((await callback(a.state)).status===400,'intent consumed once');
   a=await start('synthetic-souta',{return:'https://evil.test/'});r=await callback(a.state,'error=access_denied');ok(new URL(r.headers.get('location')).origin===env.APP_ORIGIN,'return URL cannot escape app');
   a=await start();db.seed('active-session:u4','synthetic-other-owner',Date.now()+180000);r=await callback(a.state);ok(r.headers.get('location').includes('session_changed')&&!db.get('identity:google:'+sub),'changed owner cannot link');
   db.seed('active-session:u4',hash('synthetic-souta'),Date.now()+180000);
   a=await start();db.seed('identity:google:'+sub,'u1',0);r=await callback(a.state);ok(r.headers.get('location').includes('linked_elsewhere')&&db.get('identity:google:'+sub).v==='u1','another user identity preserved');
   db.db.prepare('DELETE FROM auth_kv WHERE k=?').run('identity:google:'+sub);
   a=await start();providerFailure=true;r=await callback(a.state);providerFailure=false;ok(r.headers.get('location').includes('failed')&&!db.get('identity:google:'+sub),'provider failure returns safely without linking');
   a=await start();const oldOwner=db.get('active-session:u4').v;r=await callback(a.state);ok(r.headers.get('location').endsWith('#google_link=ok'),'verified Google link returns to study app');
   ok(db.get('identity:google:'+sub).v==='u4','identity bound to own UID');
   ok(db.get('active-session:u4').v===oldOwner,'same active lease retained');
   ok((await json('/auth/me','synthetic-souta')).data.user.googleLinked===true,'own session reports actual linked state');
   ok((await json('/auth/me','synthetic-nao')).data.user.googleLinked===false,'another user status remains separate');
   a=await start();ok(a.data.alreadyLinked===true&&!a.data.url,'linked user not sent through OAuth again');
   ok(![...db.keys()].some(k=>k.startsWith('cloud-save:')),'linking never writes learning records');
   // Race: identity changes after the preliminary read. Conditional SQL must not overwrite it.
   sub='synthetic-race-'+round;
   const begin=await start('synthetic-riran');let raced=false;
   const prepare=db.prepare.bind(db);db.prepare=sql=>{if(sql.startsWith('INSERT INTO auth_kv (k,v,expires_at) SELECT')&&!raced){raced=true;db.seed('identity:google:'+sub,'u1',0);}return prepare(sql);};
   r=await callback(begin.state);ok(raced&&r.headers.get('location').includes('failed')&&db.get('identity:google:'+sub).v==='u1','concurrent identity assignment cannot be stolen');db.prepare=prepare;
  }finally{db.close();}
 }
}finally{globalThis.fetch=originalFetch;}
await writeFile(new URL('google-api-result.json',root),JSON.stringify({passed:true,checks,rounds:2,realApiCalls:0,realUserData:false},null,2)+'\n');
console.log('Google linking API:',checks,'checks passed in two fresh SQLite rounds; owner/state/identity races, cancel, failure, existing link and no learning-record changes; fake provider only');
