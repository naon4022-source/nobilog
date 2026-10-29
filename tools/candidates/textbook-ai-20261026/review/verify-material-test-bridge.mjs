import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import bank from '../../../../cf-worker/src/material-bank.mjs';
import {testSessionRoute} from '../../../../cf-worker/src/ai-test-session-route.mjs';
import {materialRecordsRoute} from '../../../../cf-worker/src/material-records.mjs';
import {readCompletedTest,completedTestData} from '../../../../cf-worker/src/ai-test-session.mjs';
const {D1SQLite}=createRequire(import.meta.url)('../../../../.claude/verify/d1-sqlite.js');
const ctx={crypto:globalThis.crypto};vm.runInNewContext(await readFile('site-assets/material-bridge.js','utf8'),ctx);
const unit=bank.units.find(u=>u.id==='drill-math-1-signed'),selection={unitId:unit.id,mode:'test',questionIds:unit.tests.slice(0,5).map(q=>q.id)};
const dbs=[],origin='https://fixture.invalid',outside=globalThis.fetch;let checks=0,fetches=0;
globalThis.fetch=async()=>{fetches++;throw Error('outside network forbidden');};
const ok=(v,m)=>{assert.ok(v,m);checks++;},bad=async fn=>{await assert.rejects(fn);checks++;};
function fixture(initial='u4'){
 const db=new D1SQLite();dbs.push(db);let uid=initial,ready=true,lostCreation=false,lostRecord=false,malformed=null,holdRecord=null;
 const creations=[],attempts=[],statuses=[];db.seed('active-session:'+initial,'fixture-owner',Date.now()+3600000);db.seed('material-history:'+initial+':sentinel','KEEP_GRADES',0);
 const env={AUTH_DB:db,APP_ORIGIN:origin},session={uid:initial};
 const json=(v,status=200)=>Response.json(v,{status}),request=(path,b)=>new Request(origin+path,b?{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(b)}:{});
 const adapter={identity:()=>uid,ready:()=>ready,read(){throw Error('app data must not be read');},write(){throw Error('app data must not be replaced');},
  testSessionCreate:async body=>{creations.push(structuredClone(body));const r=await testSessionRoute(request('/material-test-session',body),env,session,{owner:'fixture-owner'});if(!r.ok)throw Error('synthetic creation rejected');const result=await r.json();if(lostCreation){lostCreation=false;throw Error('synthetic lost creation acknowledgement');}return malformed?malformed(result):result;},
  testSessionStatus:async id=>{statuses.push(id);const r=await testSessionRoute(request('/material-test-session?id='+id),env,session,{owner:'fixture-owner'});if(!r.ok)throw Error('synthetic status rejected');return r.json();},
  record:async attempt=>{attempts.push(structuredClone(attempt));const r=await materialRecordsRoute(request('/material-records',attempt),env,session,{owner:'fixture-owner',json,requestJson:r=>r.json(),invalidBody:()=>json({error:'body'},400)});if(!r.ok)throw Error('synthetic record rejected');const saved=(await r.json()).record;if(holdRecord){const wait=holdRecord;holdRecord=null;await wait;}if(lostRecord){lostRecord=false;throw Error('synthetic lost record acknowledgement');}return saved;}
 };
 return {db,env,session,creations,attempts,statuses,adapter,bridge:ctx.NobiMaterialBridge.create(adapter),setUid:v=>uid=v,setReady:v=>ready=v,loseCreation:()=>lostCreation=true,loseRecord:()=>lostRecord=true,setMalformed:v=>malformed=v,holdRecord:p=>holdRecord=p};
}
const attempt=(qid,answer='wrong')=>({id:crypto.randomUUID(),unitId:unit.id,questionId:qid,mode:'test',answer,elapsedMs:1300});
try{
 for(const uid of ['u1','u2','u4']){
  const f=fixture(uid);ok(f.bridge.testSessionAvailable(),'bridge advertises only wired support');f.loseCreation();await bad(()=>f.bridge.beginTest(selection,uid));const roster=await f.bridge.beginTest(selection,uid);
  ok(f.creations.length===2&&f.creations[0].id===f.creations[1].id&&roster.cached,'lost creation response reuses exact request ID '+uid);
  ok((await f.bridge.testStatus(uid)).answered===0,'initial status from actual owned HTTP');
  for(const slot of roster.slots){const a=attempt(slot.questionId),saved=await f.bridge.record(a,uid);ok(saved.id===slot.attemptId&&a.id!==saved.id&&!saved.result.correct,'first answer uses fixed server slot and preserves client payload');}
  const status=await f.bridge.testStatus(uid);ok(status.complete&&status.answered===5,'all wrong submitted answers complete server roster');
  const proof=await readCompletedTest(f.env,uid,roster.id,{owner:'fixture-owner'});ok(completedTestData(proof,uid).records.every(r=>r.answer==='wrong'&&!r.result.correct),'actual immutable first wrong answers admitted');
  const retry=attempt(roster.slots[0].questionId,'different attempt'),saved=await f.bridge.record(retry,uid);ok(saved.id===retry.id&&saved.id!==roster.slots[0].attemptId,'acknowledged question retry uses a new event ID');
  ok(completedTestData(await readCompletedTest(f.env,uid,roster.id,{owner:'fixture-owner'}),uid).records[0].answer==='wrong','retry never overwrites first answer');
  const next=await f.bridge.beginTest(selection,uid);ok(next.id!==roster.id&&!next.cached&&!(await f.bridge.testStatus(uid)).complete,'explicit new test creates empty independent roster');
  ok(f.db.get('material-history:'+uid+':sentinel').v==='KEEP_GRADES'&&!f.db.keys().some(k=>/^(?:plan|openai|ai-trial)[-:]/.test(k)),'unrelated data and AI counters unchanged');
 }
 {const f=fixture(),roster=await f.bridge.beginTest(selection,'u4'),first=attempt(roster.slots[0].questionId);f.loseRecord();await bad(()=>f.bridge.record(first,'u4'));const saved=await f.bridge.record(first,'u4');ok(saved.id===roster.slots[0].attemptId&&f.attempts[0].id===f.attempts[1].id,'lost first answer response retries exact fixed event');ok(f.db.keys().filter(k=>k.startsWith('material-attempt:u4:')).length===1,'answer replay stores one event');await f.bridge.record(first,'u4');ok(f.db.keys().filter(k=>k.startsWith('material-attempt:u4:')).length===1,'progress save retry still uses same immutable event');}
 {const f=fixture(),roster=await f.bridge.beginTest(selection,'u4'),first=attempt(roster.slots[0].questionId,'original wrong');f.loseRecord();await bad(()=>f.bridge.record(first,'u4'));const changed=attempt(first.questionId,'changed after interruption'),saved=await f.bridge.record(changed,'u4');ok(f.attempts.length===3&&f.attempts[0].id===f.attempts[1].id&&f.attempts[1].answer==='original wrong','editing after unknown response first recovers exact original');ok(saved.id===changed.id&&JSON.parse(f.db.get('material-attempt:u4:'+roster.slots[0].attemptId).v).answer==='original wrong','edited answer uses independent ID and preserves first text');}
 {const f=fixture(),roster=await f.bridge.beginTest(selection,'u4'),first=attempt(roster.slots[0].questionId);await f.bridge.record(first,'u4');await bad(()=>f.bridge.record({...first,answer:'mutated same client ID'},'u4'));ok(f.attempts.length===1,'same initial client ID cannot mutate immutable payload');}
 for(const change of [{id:'invalid'},{mode:'study'},{unitId:'other'},{at:-1},{total:999},{cached:'yes'},{slots:[]},{slots:Array.from({length:5},()=>({questionId:selection.questionIds[0],attemptId:crypto.randomUUID()}))}]){const f=fixture();f.setMalformed(v=>({...v,...change}));await bad(()=>f.bridge.beginTest(selection,'u4'));f.setMalformed(null);const recovered=await f.bridge.beginTest(selection,'u4');ok(recovered.cached&&f.creations[0].id===f.creations[1].id,'malformed response does not discard stable creation ID');}
 for(const change of [{uid:'u1'},{answeredAll:true},{mode:'invalid'},{questionIds:[]},{questionIds:['same','same']}]){const f=fixture();await bad(()=>f.bridge.beginTest({...selection,...change},'u4'));ok(f.creations.length===0,'invalid client selection never reaches network');}
 {const f=fixture(),exam=bank.units.find(u=>u.mode==='kentei'&&u.questions.length===20);assert.ok(exam);const roster=await f.bridge.beginTest({unitId:exam.id,mode:'study',questionIds:exam.questions.map(q=>q.id)},'u4');ok(roster.total===20&&roster.mode==='study','mock qualification keeps all official-order study-mode questions');for(const slot of roster.slots){const a={...attempt(slot.questionId,'わからない'),unitId:exam.id,mode:'study'};const saved=await f.bridge.record(a,'u4');ok(saved.id===slot.attemptId,'qualification first response uses reserved ID');}ok((await f.bridge.testStatus('u4')).complete,'all submitted mock qualification answers complete server proof');ok(completedTestData(await readCompletedTest(f.env,'u4',roster.id,{owner:'fixture-owner'}),'u4').records.length===20,'qualification proof retains all twenty immutable original answers');}
 {const f=fixture();f.setReady(false);await bad(()=>f.bridge.beginTest(selection,'u4'));ok(f.creations.length===0,'offline readiness blocks creation');}
 {const f=fixture(),create=f.adapter.testSessionCreate;let release;f.adapter.testSessionCreate=async b=>{const row=await create(b);await new Promise(r=>release=r);return row;};const pending=f.bridge.beginTest(selection,'u4');while(!release)await new Promise(r=>setTimeout(r,0));f.setUid('u1');release();await bad(()=>pending);f.setUid('u4');await bad(()=>f.bridge.testStatus('u4'));}
 {const f=fixture(),roster=await f.bridge.beginTest(selection,'u4');let release;f.holdRecord(new Promise(r=>release=r));const pending=f.bridge.record(attempt(roster.slots[0].questionId),'u4');await new Promise(r=>setTimeout(r,0));f.setUid('u1');release();await bad(()=>pending);ok(f.attempts.length===1,'old actor reply cannot be accepted as another actor');}
 {const f=fixture(),roster=await f.bridge.beginTest(selection,'u4');let release;f.holdRecord(new Promise(r=>release=r));const pending=f.bridge.record(attempt(roster.slots[0].questionId),'u4');await new Promise(r=>setTimeout(r,0));await f.bridge.beginTest(selection,'u4');release();await bad(()=>pending);ok(!(await f.bridge.testStatus('u4')).complete,'old test reply does not complete a new test');}
 {const f=fixture();await f.bridge.beginTest(selection,'u4');const status=f.adapter.testSessionStatus;f.adapter.testSessionStatus=async id=>({...await status(id),complete:true});await bad(()=>f.bridge.testStatus('u4'));}
 {const f=fixture(),legacy=ctx.NobiMaterialBridge.create({...f.adapter,testSessionCreate:null,testSessionStatus:null});ok(!legacy.testSessionAvailable(),'legacy harness advertises no new route');const a=attempt(unit.tests[0].id);ok((await legacy.record(a,'u4')).id===a.id,'ordinary legacy record keeps original ID');}
 ok(fetches===0,'no outside/provider traffic');
 const inputs=[];for(const file of ['site-assets/material-bridge.js','cf-worker/src/ai-test-session.mjs','cf-worker/src/ai-test-session-route.mjs','cf-worker/src/material-records.mjs'])inputs.push({file,sha256:createHash('sha256').update(await readFile(file)).digest('hex')});
 await writeFile(new URL('./material-test-bridge-result.json',import.meta.url),JSON.stringify({status:'passed',checks,inputs,scope:'Actual material bridge, owned session HTTP, server grading/immutable records and completed proof against public canonical questions in isolated SQLite. Three users, first wrong answers, lost acknowledgements, changed-answer recovery, new test separation, malformed reply/actor/current-test rejection, zero AI/contract changes. No browser/paid job proof.'},null,2)+'\n');console.log('Material test bridge: '+checks+' checks passed');
}finally{globalThis.fetch=outside;for(const db of dbs)db.close();}
