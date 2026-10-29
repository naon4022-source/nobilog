import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {testSessionRoute} from '../../../../cf-worker/src/ai-test-session-route.mjs';
const {D1SQLite}=createRequire(import.meta.url)('../../../../.claude/verify/d1-sqlite.js');
const at=1800000000000,origin='https://fixture.invalid',dbs=[],outside=globalThis.fetch;let checks=0,fetches=0;
globalThis.fetch=async()=>{fetches++;throw Error('outside network forbidden');};
const ok=(v,m)=>{assert.ok(v,m);checks++;};
const unit={id:'route-fixture-unit',status:'ready',mode:'textbook',questions:Array.from({length:5},(_,i)=>({id:'q'+i,prompt:'合成問題 '+i,type:'numeric',answer:{kind:'number',value:String(i)},explanation:'合成の解説'}))};unit.tests=unit.questions;
const body={id:'route_request_01',unitId:unit.id,mode:'test',questionIds:unit.tests.map(q=>q.id)};
function fixture(uid='u4'){
 const db=new D1SQLite();dbs.push(db);db.seed('active-session:'+uid,'fixture-owner-'+uid,at+86400000);db.seed('material-history:'+uid+':sentinel','KEEP_GRADES',0);
 const env={AUTH_DB:db,APP_ORIGIN:origin},session={uid},options={owner:'fixture-owner-'+uid,now:()=>at,readUnit:async()=>structuredClone(unit)};
 return {db,env,session,options,call:async(request,opt={})=>{const r=await testSessionRoute(request,env,session,{...options,...opt}),j=await r.json();ok(r.headers.get('Cache-Control')==='private, no-store'&&r.headers.get('X-Content-Type-Options')==='nosniff','private response never cacheable');return {r,j};}};
}
const post=(b=body,extra={})=>new Request(origin+'/material-test-session',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify(b),...extra});
const get=id=>new Request(origin+'/material-test-session?id='+id);
try{
 for(const uid of ['u1','u2','u4']){
  const f=fixture(uid),created=await f.call(post());ok(created.r.status===200&&created.j.total===5&&created.j.slots.length===5,'authenticated roster '+uid);
  const replay=await f.call(post());ok(replay.j.cached&&replay.j.id===created.j.id&&JSON.stringify(replay.j.slots)===JSON.stringify(created.j.slots),'POST replay preserves first-attempt IDs');
  let status=await f.call(get(created.j.id));ok(status.r.status===200&&!status.j.complete&&status.j.answered===0,'initial metadata only');
  for(const [i,slot] of created.j.slots.entries()){
   f.db.seed('material-attempt:'+uid+':'+slot.attemptId,JSON.stringify({id:slot.attemptId,unitId:unit.id,questionId:slot.questionId,mode:'test',at:at+1,answer:'synthetic learner text',expected:unit.tests[i].answer,prompt:unit.tests[i].prompt,result:{correct:false}}),0);
  }
  status=await f.call(get(created.j.id));ok(status.r.status===200&&status.j.complete&&status.j.answered===5,'wrong answers still count as submitted');
  ok(!JSON.stringify(status.j).includes('synthetic learner text')&&!JSON.stringify(created.j).includes('合成'),'HTTP never discloses question/answer text');
  f.db.seed('active-session:'+uid,'fixture-replacement',at+86400000);const stale=await f.call(get(created.j.id));ok(stale.r.status===409&&stale.j.error==='active_session','replaced owner cannot read metadata');
  ok(f.db.get('material-history:'+uid+':sentinel').v==='KEEP_GRADES'&&!f.db.keys().some(k=>/^(?:plan|openai|ai-trial|textbook-ai-quota)[-:]/.test(k)),'grades/plans/credits/providers untouched');
 }
 for(const extra of [{uid:'u1'},{answeredAll:true},{cost:0},{questionIds:['q0']},{questionIds:['q0','q0','q1','q2','q3']}]){const f=fixture(),r=await f.call(post({...body,...extra}));ok(r.r.status===400&&!f.db.keys().some(k=>k.startsWith('ai-test-session:')),'untrusted admission/body flags refused');}
 for(const headers of [{'Content-Type':'text/plain',Origin:origin},{'Content-Type':'application/json'},{'Content-Type':'application/json',Origin:'https://foreign.invalid'},{'Content-Type':'application/json',Origin:'null'}]){const f=fixture(),r=await f.call(post(body,{headers}));ok([400,403].includes(r.r.status),'invalid content type/origin refused');}
 for(const query of ['','?id=invalid','?id='+crypto.randomUUID()+'&id='+crypto.randomUUID(),'?id='+crypto.randomUUID()+'&uid=u1']){const f=fixture(),r=await f.call(new Request(origin+'/material-test-session'+query));ok(r.r.status===400,'strict GET query');}
 {const f=fixture(),r=await f.call(get(crypto.randomUUID()));ok(r.r.status===404,'unknown owned ID does not reveal foreign data');}
 {const f=fixture(),r=await f.call(post(body,{body:'{'}));ok(r.r.status===400,'malformed JSON safe');}
 {const f=fixture(),r=await f.call(post(body,{body:new Uint8Array([255,254])}));ok(r.r.status===400,'invalid UTF8 safe');}
 {const f=fixture(),r=await f.call(post(body,{body:' '.repeat(90001)}));ok(r.r.status===400,'body byte limit');}
 {const f=fixture();let cancelled=false,index=0;const chunks=[new Uint8Array(50000),new Uint8Array(50000)];const stream=new ReadableStream({pull(c){if(index<chunks.length)c.enqueue(chunks[index++]);},cancel(){cancelled=true;}});const r=await f.call(post(body,{body:stream,duplex:'half'}));ok(r.r.status===400&&cancelled,'stream cancelled immediately on byte overflow');}
 {const f=fixture();const r=await f.call(new Request(origin+'/material-test-session?id='+crypto.randomUUID(),{headers:{Origin:'https://foreign.invalid'}}));ok(r.r.status===403,'cross-origin GET refused');}
 {const f=fixture();const r=await f.call(new Request(origin+'/material-test-session?uid=u1',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)}));ok(r.r.status===400,'POST query cannot select another user');}
 {const f=fixture();f.options.owner='';const r=await f.call(post());ok(r.r.status===401,'opaque authenticated owner required');}
 for(const uid of ['u3','p_pro']){const f=fixture(uid),r=await f.call(post());ok(r.r.status===403,'unknown or unconfigured preview identity refused');}
 {const f=fixture('p_pro');f.env.PREVIEW_PLAN_ACCOUNTS='1';const r=await f.call(post());ok(r.r.status===200,'explicit isolated preview identity supported');}
 {const f=fixture(),r=await f.call(new Request(origin+'/material-test-session',{method:'DELETE'}));ok(r.r.status===405,'no deletion endpoint');}
 {const f=fixture(),r=await f.call(new Request(origin+'/other'));ok(r.r.status===404,'exact route only');}
 {const f=fixture();f.env.AUTH_DB=null;const r=await f.call(post());ok(r.r.status===503,'missing storage fails closed');}
 {const f=fixture();f.options.readUnit=async()=>{throw Error('synthetic private DB detail');};const r=await f.call(post());ok(r.r.status===503&&!JSON.stringify(r.j).includes('private DB detail'),'internal errors not disclosed');}
 {const f=fixture();for(let i=0;i<50;i++){const r=await f.call(post({...body,id:'route_limit_'+String(i).padStart(8,'0')}));assert.equal(r.r.status,200);}const r=await f.call(post());ok(r.r.status===429,'bounded session creation');}
 ok(fetches===0,'no external/provider traffic');
 const inputs=[];for(const file of ['cf-worker/src/ai-test-session.mjs','cf-worker/src/ai-test-session-route.mjs'])inputs.push({file,sha256:createHash('sha256').update(await readFile(file)).digest('hex')});
 await writeFile(new URL('./session-route-result.json',import.meta.url),JSON.stringify({status:'passed',checks,inputs,scope:'Actual HTTP handler and SQLite. Three identities, immutable creation replay, wrong/all-answered metadata, owner replacement, byte-bounded/cancelled streams, strict body/query/origin, preview separation and rate cap. No main parent route/front-end/AI provider proof.'},null,2)+'\n');console.log('AI test-session HTTP: '+checks+' checks passed');
}finally{globalThis.fetch=outside;for(const db of dbs)db.close();}
