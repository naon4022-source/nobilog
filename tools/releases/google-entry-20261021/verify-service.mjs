import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {writeFile} from 'node:fs/promises';
import worker from './candidate/cf-worker/src/index.js';
const {D1SQLite}=createRequire(import.meta.url)('../../../.claude/verify/d1-sqlite.js');
let checks=0;const ok=(v,m)=>{assert(v,m);checks++;};
for(const uid of ['u1','u2','u4']){
 const db=new D1SQLite(),kv=new Map(),env={AUTH_DB:db,BOARD:{get:async k=>kv.get(k)||null,put:async(k,v)=>kv.set(k,v),delete:async k=>kv.delete(k)},APP_ORIGIN:'https://nobilog.pages.dev'};
 const token='synthetic-'+uid;db.seed('session:'+token,JSON.stringify({uid,name:'Synthetic',provider:'pin'}),Date.now()+3600000);db.seed('legacy:synthetic-proof',uid,Date.now()+60000);
 db.seed('identity:google:synthetic-'+uid,uid);kv.set('identity:google:old-only-'+uid,uid);kv.set('session:old-only-'+uid,JSON.stringify({uid,name:'Synthetic',provider:'google'}));
 db.seed('cloud-save:'+uid,'synthetic-learning');
 const call=(path,body,session=token,origin=env.APP_ORIGIN)=>worker.fetch(new Request('https://synthetic.test'+path,{method:body===undefined?'GET':'POST',headers:{Origin:origin,'Content-Type':'application/json',...(session?{Authorization:'Bearer '+session}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})}),env,{});
 ok((await call('/auth/google',undefined,'')).status===401,'unauthenticated status denied');
 let r=await call('/auth/google');ok(r.status===200&&(await r.json()).linked,'own status connected');
 ok((await call('/auth/google/unlink',{ticket:'synthetic-proof',uid:'other'})).status===400,'client cannot choose another user');
 ok((await call('/auth/google/unlink',{ticket:'synthetic-proof'},token,'https://evil.invalid')).status===403,'foreign origin rejected');
 ok((await call('/auth/google/unlink',{ticket:'bad'})).status===403,'proof rejected by real route');
 r=await call('/auth/google/unlink',{ticket:'synthetic-proof'});ok(r.status===200&&(await r.json()).linked===false,'own unlink through real Worker');
 r=await call('/auth/google');ok(r.status===200&&(await r.json()).linked===false,'real status now disconnected');
 ok(db.get('cloud-save:'+uid).v==='synthetic-learning','learning record untouched');
 ok((await call('/auth/me',undefined,'old-only-'+uid)).status===401,'old KV Google session cannot revive');
 ok(db.get('session:'+token).v.includes('pin'),'PIN session retained');
 db.close();
}
await writeFile(new URL('service-result.json',import.meta.url),JSON.stringify({status:'passed',checks,scope:'current downloaded Worker candidate; isolated SQLite and KV; no live store/provider'},null,2)+'\n');console.log('Google settings Worker:',checks,'isolated checks passed');
