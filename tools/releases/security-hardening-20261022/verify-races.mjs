import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {writeFile} from 'node:fs/promises';import worker from './candidate/cf-worker/src/index.js';
const {D1SQLite}=createRequire(import.meta.url)('../../../.claude/verify/d1-sqlite.js');let checks=0;const ok=(v,m)=>{assert(v,m);checks++;},originalFetch=globalThis.fetch;
try{for(const uid of ['u1','u2','u4']){
 const db=new D1SQLite(),kv=new Map(),token='synthetic-current-'+uid,env={AUTH_DB:db,BOARD:{get:async k=>kv.get(k)||null,put:async(k,v)=>kv.set(k,v),delete:async k=>kv.delete(k)},APP_ORIGIN:'https://nobilog.pages.dev',GOOGLE_CLIENT_ID:'synthetic-client',GOOGLE_CLIENT_SECRET:'synthetic-secret'};
 db.seed('session:'+token,JSON.stringify({uid,name:'Synthetic',provider:'pin'}),Date.now()+3600000);let subject='new-'+uid,block=null;
 globalThis.fetch=async url=>{if(String(url).includes('/token'))return Response.json({access_token:'synthetic-access'});if(String(url).includes('/userinfo')){if(block){block.enter();await block.wait;}return Response.json({sub:subject,name:'Synthetic'});}throw Error('unexpected provider request');};
 const call=(path,body)=>worker.fetch(new Request('https://synthetic.test'+path,{method:body===undefined?'GET':'POST',headers:{Origin:env.APP_ORIGIN,Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})}),env,{});
 db.seed('legacy:proof','other-user',Date.now()+60000);ok((await call('/auth/google/link',{ticket:'proof'})).status===403,'other user proof cannot link');
 db.seed('legacy:proof',uid,Date.now()+60000);let r=await call('/auth/google/link',{ticket:'proof'}),d=await r.json();ok(r.status===200&&!!d.url,'fresh proof starts own link');let url=new URL(d.url);ok(url.origin==='https://accounts.google.com'&&!d.url.includes(token)&&!d.url.includes('ticket='),'no session/proof in Google URL');
 ok((await call('/auth/google/link',{ticket:'proof'})).status===403,'proof consumed once');
 const callback=state=>worker.fetch(new Request('https://synthetic.test/auth/callback/google?state='+state+'&code=synthetic-code',{headers:{Origin:env.APP_ORIGIN}}),env,{});
 r=await callback(url.searchParams.get('state'));ok(r.headers.get('location').endsWith('#google_link=ok'),'own callback succeeds');ok(db.get('identity:google:'+subject)?.v===uid,'existing account bound');
 subject='late-'+uid;db.seed('legacy:race',uid,Date.now()+60000);r=await call('/auth/google/link',{ticket:'race'});url=new URL((await r.json()).url);
 let enter,release;const entered=new Promise(r=>enter=r),wait=new Promise(r=>release=r);block={enter,wait};const pending=callback(url.searchParams.get('state'));await entered;
 db.seed('legacy:unlink',uid,Date.now()+60000);ok((await call('/auth/google/unlink',{ticket:'unlink'})).status===200,'unlink commits while OAuth is at provider');release();r=await pending;block=null;
 ok(r.headers.get('location').includes('google_link_error='),'old in-flight callback rejected');ok(!db.get('identity:google:'+subject),'old callback cannot restore binding');
 db.seed('legacy:relink',uid,Date.now()+60000);r=await call('/auth/google/link',{ticket:'relink'});url=new URL((await r.json()).url);r=await callback(url.searchParams.get('state'));ok(r.headers.get('location').endsWith('#google_link=ok'),'fresh relink allowed after unlink');
 db.close();
}
await writeFile(new URL('races-result.json',import.meta.url),JSON.stringify({status:'passed',checks,scope:'actual candidate Worker, isolated SQLite/KV and paused fake Google; no live data'},null,2)+'\n');console.log('Google proof and OAuth races:',checks,'checks passed');
}finally{globalThis.fetch=originalFetch;}
