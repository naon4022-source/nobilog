import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createHmac} from 'node:crypto';
import vm from 'node:vm';
const require=createRequire(import.meta.url),{D1SQLite}=require('../../../.claude/verify/d1-sqlite.js');
let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++;};
const root=new URL('./',import.meta.url),source=await readFile(new URL('candidate/cf-worker/src/index.js',root),'utf8');
const M=await import('data:text/javascript;base64,'+Buffer.from(source+'\nexport {keyedDigest,oauthCallback};').toString('base64'));
const db=new D1SQLite(),kv=new Map(),env={AUTH_DB:db,BOARD:{get:async k=>kv.get(k)||null,put:async(k,v)=>kv.set(k,v),delete:async k=>kv.delete(k)},APP_ORIGIN:'https://nobilog.pages.dev',PIN_PEPPER:'synthetic-only-pepper',TURNSTILE_SECRET:'synthetic-only-turnstile'};
for(const [name,pin]of [['NAO','synthetic-nao'],['RIRAN','synthetic-riran'],['SOUTA','synthetic-souta']])env['LEGACY_'+name+'_PIN_HASH']=createHmac('sha256',env.PIN_PEPPER).update(pin).digest('base64url');
const originalFetch=globalThis.fetch;let ts=0,challenge={success:true,hostname:'nobilog.pages.dev',action:'legacy_login',challenge_ts:new Date().toISOString()};
globalThis.fetch=async(url)=>{
 if(String(url).includes('/siteverify'))return Response.json(challenge);
 if(String(url).includes('/userinfo'))return Response.json({sub:'synthetic-google',name:'untrusted-display'});
 if(String(url).includes('/v2.1/verify'))return Response.json({sub:'synthetic-line',name:'untrusted-display'});
 if(String(url).includes('/token'))return Response.json({access_token:'synthetic-only',id_token:'synthetic-only'});
 throw Error('Unexpected synthetic request');
};
const call=async(path,token,body,origin='https://nobilog.pages.dev')=>{
 const r=await M.default.fetch(new Request('https://worker.test'+path,{method:body===undefined?'GET':'POST',headers:{Origin:origin,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})}),env,{});
 return {status:r.status,data:await r.json()};
};
const start=pin=>call('/auth/legacy',null,{pin,turnstile:'synthetic-turnstile-token-'+(++ts)});
try{
 ok(await M.keyedDigest('synthetic-souta',env.PIN_PEPPER)===env.LEGACY_SOUTA_PIN_HASH,'HMAC format matches production');
 for(const [pin,uid,name]of [['synthetic-nao','u1','なお'],['synthetic-riran','u2','りらん'],['synthetic-souta','u4','そうた']]){
  const a=await start(pin);ok(a.status===200&&a.data.name===name,'PIN identifies '+uid);
  const login=await call('/auth/legacy/login',null,{ticket:a.data.ticket});ok(login.status===200&&login.data.user.id===uid&&login.data.user.name===name,'ticket login '+uid);
  ok((await call('/auth/legacy/login',null,{ticket:a.data.ticket})).status===400,'single-use ticket '+uid);
  await call('/auth/logout',login.data.session,{});
 }
 ok((await start('synthetic-wrong')).status===401,'wrong PIN rejected');
 const originalSoutaHash=env.LEGACY_SOUTA_PIN_HASH;env.LEGACY_SOUTA_PIN_HASH=env.LEGACY_NAO_PIN_HASH;
 ok((await start('synthetic-nao')).status===503,'duplicate configured PIN cannot log in as a different person');env.LEGACY_SOUTA_PIN_HASH=originalSoutaHash;
 const hash=env.LEGACY_SOUTA_PIN_HASH;delete env.LEGACY_SOUTA_PIN_HASH;ok((await start('synthetic-souta')).status===401,'missing Souta verifier fails closed');env.LEGACY_SOUTA_PIN_HASH=hash;
 for(const patch of [{hostname:'evil.test'},{action:'wrong'},{success:false},{challenge_ts:'2000-01-01'}]){
  const before=challenge;challenge={...before,...patch};ok((await start('synthetic-souta')).status===403,'Turnstile rejects invalid field');challenge=before;
 }
 // Linking exercises the existing verified-ticket flow, not a uid chosen by the client.
 for(const provider of ['google','line']){
  const a=await start('synthetic-souta'),state='state-'+provider;
  db.seed('oauth:'+state,JSON.stringify({provider,mode:'link',ticket:a.data.ticket,nonce:'synthetic-nonce',back:'https://nobilog.pages.dev/'}),Date.now()+60000);
  const r=await M.oauthCallback(new Request('https://worker.test/auth/callback/'+provider+'?state='+state+'&code=synthetic-code'),env,provider);
  ok(r.status===302&&!r.headers.get('location').includes('auth_error'),'verified '+provider+' link succeeds');
  const location=new URL(r.headers.get('location')),token=new URLSearchParams(location.hash.slice(1)).get('auth');
  const me=await call('/auth/me',token);ok(me.data.user.id==='u4'&&me.data.user.name==='そうた','provider display name cannot replace Souta identity');
  ok(db.get('identity:'+provider+':synthetic-'+provider).v==='u4','identity linked to verified uid');
  await call('/auth/logout',token,{});
 }
 db.seed('session:synthetic-souta-session',JSON.stringify({uid:'u4',name:'そうた',provider:'test'}),Date.now()+60000);
 db.seed('session:synthetic-other-session',JSON.stringify({uid:'x_other',name:'Synthetic',provider:'test'}),Date.now()+60000);
 db.seed('school-result:u1:2026-09',JSON.stringify({id:'synthetic-result',name:'Synthetic term',s:{one:71,two:83},c:'PRIVATE'}),0);
 let r=await call('/school-calendar','synthetic-souta-session');ok(r.status===200&&r.data.events.length===0&&Object.keys(r.data.details).length===0,'Souta calendar starts empty');
 ok((await call('/school-calendar','synthetic-souta-session',{})).status===401,'Souta cannot edit family calendar');
 r=await call('/school-results','synthetic-souta-session');ok(r.data.records.u4.teiki.length===0,'no inherited Souta marks');
 ok(r.data.records.u1.teiki[0].total===154&&!JSON.stringify(r.data).includes('PRIVATE')&&!('s'in r.data.records.u1.teiki[0]),'competition shares totals only');
 ok((await call('/school-results','synthetic-other-session')).status===401,'unrelated account excluded');
 for(const route of ['/chat','/transfer','/september-test','/september-review-pdf'])ok((await call(route,'synthetic-souta-session')).status>=400,'family-only resource remains separate '+route);
 ok((await call('/school-results','synthetic-souta-session',undefined,'https://evil.test')).status===403,'hostile origin denied');
 ok((await call('/save?user=u1','synthetic-souta-session')).status===401,'cannot read another save');
 ok((await call('/save','synthetic-souta-session',{user:'u4',v:1,keys:{'u1:money':'forbidden'}})).status===400,'cannot write another save');
 r=await call('/save','synthetic-souta-session',{user:'u4',v:1,keys:{'u4:money':'synthetic-own'}});ok(r.data.ok,'own synthetic state saves');
 ok((await call('/save?user=u4','synthetic-souta-session')).data.keys['u4:money']==='synthetic-own','own synthetic state reloads');
}finally{globalThis.fetch=originalFetch;db.close();}

const page=await readFile(new URL('candidate/pages/index.html',root),'utf8');
function fn(name){const start=page.indexOf('    function '+name+'(');assert.ok(start>=0,name);const end=page.indexOf('\n    }',start);assert.ok(end>start);return page.slice(start,end+6);}
const grantStart=page.indexOf('    const M_GRANTS = ['),grantEnd=page.indexOf('\n    ];',grantStart);
const C=vm.createContext({currentUserId:'u4',cash:350000,grantIds:[],log:[],mLoad(){return {cash:this.cash,grants:this.grantIds};},mSave(m){C.cash=m.cash;C.grantIds=[...m.grants];},mLog(m,label,amount){C.log.push(amount);},celebrate(){},playSfx(){},setTimeout(){},mYen:n=>String(n),alert(){}});
// bind the synthetic fixture explicitly; production grant function runs unchanged.
C.mLoad=()=>({cash:C.cash,grants:C.grantIds});
vm.runInContext(page.slice(grantStart,grantEnd+7)+'\n'+fn('mApplyGrants'),C);
ok(C.mApplyGrants()===true&&C.cash===1350000,'exactly one million added to cash');
ok(C.grantIds.filter(id=>id==='20261018-souta-start-cash').length===1,'grant id recorded once');
ok(C.mApplyGrants()===false&&C.cash===1350000,'reload does not add again');
C.grantIds=JSON.parse(JSON.stringify(C.grantIds));ok(C.mApplyGrants()===false&&C.cash===1350000,'serialized saved record prevents regrant');
C.currentUserId='x_other';const cash=C.cash;ok(C.mApplyGrants()===false&&C.cash===cash,'grant cannot apply to unrelated account');
ok(page.includes('name="application-version" content="2.15.1"'),'release version');
ok((await readFile(new URL('candidate/pages/sw.js',root),'utf8')).includes('nobilog-app-v2.15.1'),'cache version matches');
await writeFile(new URL('isolated-result.json',root),JSON.stringify({checks,passed:true,network:'synthetic only',realUserData:false},null,2)+'\n');
console.log('Souta release:',checks,'isolated checks passed; synthetic SQLite/auth/providers/grants only; no live secrets or data');
