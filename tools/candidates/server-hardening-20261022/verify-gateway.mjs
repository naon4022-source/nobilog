// Synthetic streams/identities only. No network, live account or production DB.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readBoundedOAuthForm} from './oauth-form-body.mjs';
import {consumeGate} from './rate-policy.mjs';
import {createSecurityGateway} from './security-gateway.mjs';
import {attachGateway} from './attach-gateway.mjs';
const enc=new TextEncoder(),origin='https://nobilog.pages.dev';
const formType='application/x-www-form-urlencoded';
const request=(path='/auth/callback/google',body='state=synthetic_state&code=synthetic_code',headers={})=>new Request('https://fixture.test'+path,{method:'POST',headers:{'Content-Type':formType,Origin:origin,'CF-Connecting-IP':'203.0.113.40',...headers},body,...(body instanceof ReadableStream?{duplex:'half'}:{})});
const allowed=async()=>({allowed:true,retryAfter:0});
const originalPaths=['../../../cf-worker/src/index.js','../../releases/google-entry-20261021/nobilog-board/src/index.js'];
// Prove the pre-existing public path reads an oversized form before checking state.
for(const path of originalPaths){
 const source=fs.readFileSync(new URL(path,import.meta.url),'utf8');
 const original=await import('data:text/javascript;base64,'+Buffer.from(source+'\nexport {oauthCallback};').toString('base64'));
 let reads=0,forwarded=0;
 const env={BOARD:{get:async()=>{reads++;return null;}},APP_ORIGIN:origin};
 const huge='state=synthetic_state&code=synthetic_code&pad='+'x'.repeat(65536);
 assert.equal((await original.oauthCallback(request(undefined,huge),env,'google')).status,400);
 assert.equal(reads,1,'original reaches a synthetic store only after reading the large form');
 const gate=createSecurityGateway({consume:allowed,upstream:(r,e)=>{forwarded++;return original.oauthCallback(r,e,'google');}});
 assert.equal((await gate(request(undefined,huge),env)).status,413);
 assert.equal(reads,1);assert.equal(forwarded,0,'guard rejects before the original application');
 const privateGate=createSecurityGateway({consume:allowed,upstream:(r,e,c)=>original.default.fetch(r,e,c)});
 const unauthenticated=await privateGate(new Request('https://fixture.test/save',{headers:{Origin:origin}}),env);
 assert.equal(unauthenticated.status,401,'the existing application still rejects an unauthenticated private read');
 const getUrl='https://fixture.test/auth/callback/google?state=synthetic_state&code=synthetic_code';
 const getBefore=await original.oauthCallback(new Request(getUrl),env,'google');
 const getAfter=await gate(new Request(getUrl),env);
 assert.equal(getAfter.status,getBefore.status);assert.equal(await getAfter.text(),await getBefore.text());
}

const normal='code=a%2Bb%2F%3D&state=synthetic_state&scope=openid+email';
assert.equal((await readBoundedOAuthForm(request(undefined,normal))).get('code'),'a+b/=');
for(const provider of ['google','line']){
 let forwardedForm;
 const validGate=createSecurityGateway({consume:allowed,upstream:async r=>{forwardedForm=new URLSearchParams(await r.text());return new Response(null,{status:302,headers:{Location:origin}});}});
 const redirect=await validGate(request('/auth/callback/'+provider,normal),{});
 assert.equal(redirect.status,302);assert.equal(redirect.headers.get('Location'),origin);
 assert.equal(forwardedForm.get('code'),'a+b/=');assert.equal(forwardedForm.get('scope'),'openid email');
}
// Split a multi-byte form value across every byte without corrupting the body.
const unicode=enc.encode('state=検証用&code=synthetic_code');let index=0;
const split=new ReadableStream({pull(c){if(index===unicode.length)c.close();else c.enqueue(unicode.slice(index,++index));}});
assert.equal((await readBoundedOAuthForm(request(undefined,split))).get('state'),'検証用');
for(const body of ['state=a&state=b&code=c','state=a&code=b&code=c'])await assert.rejects(()=>readBoundedOAuthForm(request(undefined,body)),e=>e.oauthBodyStatus===400);
for(const value of ['-1','NaN','Infinity'])await assert.rejects(()=>readBoundedOAuthForm(request(undefined,normal,{'Content-Length':value})),e=>e.oauthBodyStatus===400);
await assert.rejects(()=>readBoundedOAuthForm(request(undefined,normal,{'Content-Length':'16385'})),e=>e.oauthBodyStatus===413);
await assert.rejects(()=>readBoundedOAuthForm(request(undefined,normal,{'Content-Type':'text/plain'})),e=>e.oauthBodyStatus===415);
const invalidUtf8=new ReadableStream({start(c){c.enqueue(new Uint8Array([0xc3,0x28]));c.close();}});
await assert.rejects(()=>readBoundedOAuthForm(request(undefined,invalidUtf8)),e=>e.oauthBodyStatus===400);
let cancelled=0;
const stuck=new ReadableStream({pull(){return new Promise(()=>{});},cancel(){cancelled++;}});
const started=Date.now();await assert.rejects(()=>readBoundedOAuthForm(request(undefined,stuck),{timeoutMs:20}),e=>e.oauthBodyStatus===408);
assert.ok(Date.now()-started<1000);assert.equal(cancelled,1);
// A hostile cancellation hook may never resolve; oversize rejection must still finish.
const stuckCancel=new ReadableStream({start(c){c.enqueue(new Uint8Array(16385));},cancel(){return new Promise(()=>{});}});
await assert.rejects(()=>readBoundedOAuthForm(request(undefined,stuckCancel)),e=>e.oauthBodyStatus===413);

let state;
for(let i=0;i<20;i++){const x=consumeGate(state,'auth',1000);assert.equal(x.allowed,true);state=x.state;}
assert.equal(consumeGate(state,'auth',1000).allowed,false);
assert.equal(consumeGate(state,'auth',3999).allowed,false);
assert.equal(consumeGate(state,'auth',4000).allowed,true);
assert.equal(consumeGate(state,'auth',0).allowed,false,'a backwards clock does not refill');
assert.throws(()=>consumeGate(null,'__proto__',1000),/gate_input/);
assert.throws(()=>consumeGate({tokens:999,at:1},'auth',1000),/gate_state/);

const buckets=new Map(),keys=new Set();let calls=0;
const limited=createSecurityGateway({clock:()=>1000,consume:async(key,group,time)=>{
 keys.add(key);const k=key+':'+group,out=consumeGate(buckets.get(k),group,time);if(out.allowed)buckets.set(k,out.state);return out;
},upstream:async()=>{calls++;return Response.json({ok:true});}});
for(let i=0;i<20;i++)assert.equal((await limited(request('/auth/legacy','{}',{'X-Forwarded-For':'synthetic_'+i}),{APP_ORIGIN:origin})).status,200);
const throttled=await limited(request('/auth/legacy','{}'),{APP_ORIGIN:origin});
assert.equal(throttled.status,429);assert.equal(calls,20);assert.equal(keys.size,1);
assert.equal(throttled.headers.get('Access-Control-Allow-Origin'),origin);assert.ok(Number(throttled.headers.get('Retry-After'))>=1);
assert.ok([...keys].every(k=>/^[a-f0-9]{64}$/.test(k)&&!k.includes('203.0.113.40')));
const outage=createSecurityGateway({consume:async()=>{throw Error('synthetic internal details');},upstream:async()=>{throw Error('must not run');}});
assert.equal((await outage(new Request('https://fixture.test/save'),{})).status,503);
assert.equal((await outage(new Request('https://fixture.test/save'),{})).status,503);

// Ordinary large saves, response bytes, status, cookies and framing remain intact.
const largeSave=JSON.stringify({v:1,keys:{'synthetic_a:fixture':'x'.repeat(100000)}});let received;
const passthrough=createSecurityGateway({consume:allowed,upstream:async r=>{received=await r.text();return new Response('unchanged application bytes',{status:201,headers:{'Set-Cookie':'fixture=value; Secure; HttpOnly','Content-Type':'application/pdf','X-Frame-Options':'SAMEORIGIN'}});}});
const preserved=await passthrough(request('/save',largeSave,{'Content-Type':'application/json'}),{});
assert.equal(received,largeSave);assert.equal(preserved.status,201);assert.equal(await preserved.text(),'unchanged application bytes');
assert.equal(preserved.headers.get('Set-Cookie'),'fixture=value; Secure; HttpOnly');assert.equal(preserved.headers.get('X-Frame-Options'),'SAMEORIGIN');
assert.equal(preserved.headers.get('X-Content-Type-Options'),'nosniff');
const scheduled=()=>{};const attached=attachGateway({fetch:async()=>Response.json({ok:true}),scheduled});assert.equal(attached.scheduled,scheduled);
assert.equal((await attached.fetch(new Request('https://fixture.test/'),{})).status,503,'missing security binding never silently disables the guard');
const upgrade={status:101};const ws=createSecurityGateway({consume:allowed,upstream:async()=>upgrade});assert.equal(await ws(new Request('https://fixture.test/'),{}),upgrade);
console.log('Security gateway: both original unbounded forms reproduced; size/type/UTF-8/deadline/cancel guards, token-policy boundaries, trusted quota key, fail-closed backend and unchanged ordinary payload/handlers passed; main/public code and deployment unchanged.');
