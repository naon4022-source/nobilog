import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
import {createTestSession,testSessionStatus,readCompletedTest,completedTestData} from '../../../../cf-worker/src/ai-test-session.mjs';
const {D1SQLite}=createRequire(import.meta.url)('../../../../.claude/verify/d1-sqlite.js');
const time=1800000000000,databases=[],outside=globalThis.fetch;let checks=0,fetches=0;
globalThis.fetch=async()=>{fetches++;throw Error('outside network forbidden');};
const ok=(v,m)=>{assert.ok(v,m);checks++;},bad=async(fn,code)=>{await assert.rejects(fn,code?new RegExp(code):undefined);checks++;};
const unit={id:'fixture-unit',status:'ready',mode:'textbook',subject:'数学',questions:Array.from({length:10},(_,i)=>({id:'q'+(i+1),type:'numeric',prompt:'合成問題 '+(i+1),answer:{kind:'number',value:String(i+1)},explanation:'合成の解説'}))};unit.tests=structuredClone(unit.questions);
const body={id:'fixture_request_01',unitId:unit.id,mode:'test',questionIds:unit.tests.slice(0,5).map(q=>q.id)};
const key=(uid,id)=>'ai-test-session:'+uid+':'+id;
function fixture(uid='u4'){
 const db=new D1SQLite();databases.push(db);db.seed('active-session:'+uid,'owner-'+uid,time+86400000);db.seed('material-history:'+uid+':sentinel','KEEP_GRADES',0);
 const env={AUTH_DB:db},options={owner:'owner-'+uid,now:time,readUnit:async()=>structuredClone(unit)};
 const trace=[],prepare=db.prepare.bind(db);db.prepare=sql=>{trace.push(sql);return prepare(sql);};
 return {db,uid,env,options,trace,create:(b=body,o={})=>createTestSession(env,uid,b,{...options,...o}),status:id=>testSessionStatus(env,uid,id,options),read:id=>readCompletedTest(env,uid,id,options)};
}
function seedAnswer(f,session,index,change={}){
 const slot=session.slots[index],q=unit.tests.find(q=>q.id===slot.questionId),record={id:slot.attemptId,unitId:unit.id,questionId:q.id,mode:body.mode,at:time+1,answer:'1',expected:q.answer,prompt:q.prompt,result:{correct:index===0},...change};
 f.db.seed('material-attempt:'+f.uid+':'+slot.attemptId,JSON.stringify(record),0);return record;
}
try{
 for(const uid of ['u1','u2','u4']){
  const f=fixture(uid),created=await f.create();ok(created.total===5&&created.slots.length===5,'fixed roster created '+uid);ok(!JSON.stringify(created).includes('expected')&&!JSON.stringify(created).includes('answer')&&!JSON.stringify(created).includes('explanation'),'public creation contains no answers or prompts');
  const replay=await f.create();ok(replay.id===created.id&&replay.cached&&JSON.stringify(replay.slots)===JSON.stringify(created.slots),'lost creation response retains same question/attempt IDs '+uid);
  await bad(()=>f.create({...body,questionIds:[...body.questionIds].reverse()}),'id_conflict');
  const before=f.trace.length;await bad(()=>f.read(created.id),'test_incomplete');ok(!f.trace.slice(before).some(s=>s.startsWith('SELECT a.v ')),'incomplete test never reads private answer bodies');
  for(let i=0;i<4;i++)seedAnswer(f,created,i);ok((await f.status(created.id)).answered===4,'four of five remains incomplete');await bad(()=>f.read(created.id),'test_incomplete');
  seedAnswer(f,created,4);const status=await f.status(created.id);ok(status.complete&&status.answered===5,'all submitted answers, including wrong answers, complete roster');
  const proof=await f.read(created.id),data=completedTestData(proof,uid);ok(data.records.length===5&&data.session.id===created.id,'owned complete snapshot branded');
  ok(!JSON.stringify(proof).includes('合成問題')&&!JSON.stringify(proof).includes('answer'),'proof serializes metadata only');
  data.records[0].answer='changed';ok(completedTestData(proof,uid).records[0].answer==='1','external copy cannot mutate trusted proof');
  assert.throws(()=>completedTestData(JSON.parse(JSON.stringify(proof)),uid),/completed_test_required/);checks++;
  assert.throws(()=>completedTestData(proof,uid==='u1'?'u4':'u1'),/completed_test_required/);checks++;
  const again=await f.read(created.id);ok(again.fingerprint===proof.fingerprint,'immutable attempt snapshot is stable for charge replay');
  ok(f.db.get('material-history:'+uid+':sentinel').v==='KEEP_GRADES'&&!f.db.keys().some(k=>/^(?:plan:|plan-credit|ai-trial:|openai-operation:|textbook-ai-quota:)/.test(k)),'roster does not touch plans, existing grades or AI counters');
 }
 for(const change of [{uid:'u1'},{model:'gpt-6.1-sol'},{answeredAll:true},{questionIds:['q1','q1','q2','q3','q4']},{questionIds:['q1','q2','q3','q4','unknown']},{questionIds:['q1']}]){const f=fixture();await bad(()=>f.create({...body,...change}));ok(!f.db.keys().some(k=>k.startsWith('ai-test-session:')),'bad selection never creates a session');}
 {const f=fixture();f.db.seed('qflag:'+unit.id+':q1',JSON.stringify({paused:true}),0);await bad(()=>f.create(),'unknown_test_question');}
 {const f=fixture(),readUnit=async()=>({...structuredClone(unit),mode:'kentei'});await bad(()=>f.create(body,{readUnit}),'incomplete_kentei_selection');const all=await f.create({...body,questionIds:unit.tests.map(q=>q.id)},{readUnit});ok(all.total===10,'qualification test retains full official order/count');}
 {const f=fixture();const [a,b]=await Promise.all([f.create(),f.create()]);ok(a.id===b.id&&JSON.stringify(a.slots)===JSON.stringify(b.slots),'simultaneous duplicate creation produces one roster');ok(f.db.keys().filter(k=>k.startsWith('ai-test-session:u4:')).length===1,'duplicate creation has no orphan session');}
 {const f=fixture(),created=await f.create();for(let i=0;i<5;i++)seedAnswer(f,created,i);f.db.seed('active-session:u1','owner-u1',time+86400000);await bad(()=>readCompletedTest(f.env,'u1',created.id,{owner:'owner-u1',now:time}),'test_session_not_found');}
 for(const change of [{at:time-1},{mode:'study'},{questionId:'other'},{answer:'   '}]){const f=fixture(),created=await f.create();for(let i=0;i<5;i++)seedAnswer(f,created,i,i===4?change:{});ok(!(await f.status(created.id)).complete,'old/wrong/empty record cannot complete roster');await bad(()=>f.read(created.id),'test_incomplete');}
 for(const change of [{prompt:'changed question'},{expected:{kind:'number',value:'999'}},{result:{correct:'yes'}}]){const f=fixture(),created=await f.create();for(let i=0;i<5;i++)seedAnswer(f,created,i,i===4?change:{});await bad(()=>f.read(created.id),'test_source_changed');}
 {const f=fixture();await bad(()=>f.create(body,{owner:'wrong-owner'}),'session_changed');ok(f.db.keys().filter(k=>k.startsWith('ai-test-session:')).length===0,'owner mismatch before creation stores nothing');}
 {const f=fixture();let fired=false;f.db.beforeBatch=()=>{if(fired)return;fired=true;f.db.seed('active-session:u4','replacement',time+86400000);};await bad(()=>f.create(),'session_changed');ok(fired&&f.db.keys().filter(k=>k.startsWith('ai-test-session:')).length===0,'owner change at final transaction prevents roster write');}
 {const f=fixture();f.db.failBatchAt=1;await bad(()=>f.create());ok(f.db.keys().filter(k=>k.startsWith('ai-test-session')).length===0,'request mapping failure rolls back roster too');}
 {const f=fixture();let lost=true;const batch=f.db.batch.bind(f.db);f.db.batch=async rows=>{const r=await batch(rows);if(lost){lost=false;throw Error('synthetic lost committed acknowledgement');}return r;};await bad(()=>f.create());const replay=await f.create();ok(replay.cached&&f.db.keys().filter(k=>k.startsWith('ai-test-session:u4:')).length===1,'lost commit acknowledgement recovers same roster');}
 {const f=fixture(),created=await f.create(),stored=JSON.parse(f.db.get(key('u4',created.id)).v);stored.questions[0].attemptId=crypto.randomUUID();f.db.seed(key('u4',created.id),JSON.stringify(stored),0);await bad(()=>f.status(created.id),'invalid_test_session');}
 {const f=fixture();for(let i=0;i<50;i++)await f.create({...body,id:'session_limit_'+String(i).padStart(8,'0')});await bad(()=>f.create({...body,id:'session_limit_over'}),'test_session_limit');ok((await f.create({...body,id:'session_limit_00000000'})).cached,'daily creation cap still permits existing request recovery');}
 ok(fetches===0,'no provider or outside network');
 await writeFile(new URL('./session-result.json',import.meta.url),JSON.stringify({status:'passed',checks,scope:'Actual immutable roster/admission SQL with isolated SQLite and fake canonical unit. Three user IDs, all-answered proof, first reserved attempt IDs, old/foreign/source mismatch rejection, metadata-only partial status, immutable snapshots, creation replay/race/rollback/lost ack and daily cap. No routes/front-end/100-credit charging/background/real-user proof.'},null,2)+'\n');console.log('AI test session/admission: '+checks+' checks passed');
}finally{globalThis.fetch=outside;for(const db of databases)db.close();}
