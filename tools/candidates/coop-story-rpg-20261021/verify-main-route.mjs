// Real V3 main Worker/auth/lease/router, detached SQLite and fake bindings only.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import worker from '../../../cf-worker/src/index.js';
import bank from '../../../cf-worker/src/material-bank.mjs';
import engine from '../../../cf-worker/src/material-engine.cjs';
import words from '../../../site-assets/eiken-vocab-bank.json' with {type:'json'};
import {createInvalidationHub} from './invalidation-hub.mjs';
const {D1SQLite}=createRequire(import.meta.url)('../../../.claude/verify/d1-sqlite.js');
const db=new D1SQLite(),realNow=Date.now,realFetch=globalThis.fetch;
let now=1000,outbound=0;
Date.now=()=>now;globalThis.fetch=async()=>{outbound++;throw Error('No external transport in this harness');};
const people=['u1','u2','u3'].map((uid,i)=>({uid,name:'検証の旅人'+i,token:'synthetic_main_session_'+i}));
const apple=words.grades.flatMap(g=>g.words).find(w=>w.w==='apple');assert.ok(apple);
const unit=bank.units.find(u=>u.status==='ready'&&u.subject==='数学'&&engine.validateUnit(u,{sources:bank.sources}).length===0&&u.questions.some(q=>q.answer.kind==='number'));
const question=unit.questions.find(q=>q.answer.kind==='number');assert.equal(engine.grade(question,String(question.answer.value)).correct,true);
const hubs=new Map();let snapshots=0;
const env={APP_ORIGIN:'https://synthetic.invalid',AUTH_DB:db,BOARD:{get:async key=>{
 if(!key.startsWith('save:'))return null;
 const uid=key.slice(5);assert.ok(people.some(s=>s.uid===uid));snapshots++;
 return JSON.stringify({v:1,keys:{[uid+':eikenVocab']:JSON.stringify({v:1,words:{[apple.id]:{c:1}}})}});
}},COOP_STORY_EVENTS:{idFromName:id=>id,get:id=>{if(!hubs.has(id))hubs.set(id,createInvalidationHub());return hubs.get(id);}}};
for(const s of people){
 s.owner=createHash('sha256').update(s.token).digest('base64url');
 db.seed('session:'+s.token,JSON.stringify({uid:s.uid,name:s.name,provider:'synthetic'}),1000000);
 db.seed('active-session:'+s.uid,s.owner,1000000);
 db.seed('material-attempt:'+s.uid+':fixture_correct',JSON.stringify({unitId:unit.id,questionId:question.id,mode:'study',result:{correct:true}}),0);
}
const ordinary=()=>JSON.stringify(db.keys().filter(k=>k.startsWith('material-attempt:')).sort().map(k=>[k,db.get(k)]));
const before=ordinary();let checks=0;
async function call(who,action,body,options={}){
 const url='https://worker.invalid/coop-story/'+action,request=new Request(url,{method:body===undefined?'GET':'POST',headers:{Origin:options.origin||env.APP_ORIGIN,...(who?{Authorization:'Bearer '+who.token}:{}),...(body===undefined?{}:{'Content-Type':'application/json'})},...(body===undefined?{}:{body:JSON.stringify(body)})});
 const response=await worker.fetch(request,options.env||env,{waitUntil:()=>{}});checks++;
 assert.equal(response.status,options.status||200,action+': '+response.status);
 return response;
}
try{
 const [a,b,c]=people;
 await call(null,'resume',undefined,{status:401});
 await call(a,'resume',undefined,{origin:'https://outsider.invalid',status:403});
 await call(a,'resume',undefined,{env:{...env,COOP_STORY_EVENTS:null},status:503});
 for(const [i,s]of people.entries())await call(s,'profile',{body:i%2?'female':'male'});
 const roomId='main_fixture_room',inviteCode='ABCDEFGH';
 await call(a,'create',{roomId,stageId:'story_01',inviteCode});
 assert.deepEqual(await(await call(b,'resume')).json(),{roomId:null});
 for(const s of [b,c]){const requestId='request_'+s.uid;await call(s,'join-request',{inviteCode,requestId,consent:true});await call(a,'approve',{roomId,requestId});}
 for(const s of people){await call(s,'heartbeat',{roomId,connectionId:'main_connection'});await call(s,'ready',{roomId,ready:true});assert.deepEqual(await(await call(s,'resume')).json(),{roomId});}
 await call(b,'start',{roomId},{status:403});await call(a,'start',{roomId});now=4000;
 await call(a,'tap',{roomId,sequence:1,damage:999},{status:400});
 for(let sequence=1;sequence<=12;sequence++)await call(a,'tap',{roomId,sequence});
 const own=await(await call(a,'state?roomId='+roomId)).json(),peer=await(await call(b,'state?roomId='+roomId)).json();
 assert.equal(own.state.members.length,3);assert.ok(own.state.own.question);assert.equal(peer.state.own.question,null);
 for(const who of people)assert.equal(JSON.stringify(own).includes(who.owner),false);
 const q=own.state.own.question;assert.equal(Object.hasOwn(q,'answer'),false);
 const answer=q.kind==='word'?(q.direction==='ej'?apple.ja[0]:apple.w):String(question.answer.value);
 assert.equal(q.kind==='word'||q.prompt===question.prompt,true);
 const judged=await(await call(a,'answer',{roomId,challengeId:q.challengeId,sequence:own.state.own.nextAnswerSequence,answer})).json();assert.equal(judged.result.correct,true);
 const events=await call(a,'events?roomId='+roomId);assert.equal(events.headers.get('Content-Type'),'text/event-stream');assert.equal(events.headers.get('Access-Control-Allow-Origin'),env.APP_ORIGIN);await events.body.cancel();
 db.seed('active-session:'+c.uid,'synthetic_replacement',1000000);await call(c,'state?roomId='+roomId,undefined,{status:409});
 assert.equal(ordinary(),before);assert.equal(outbound,0);assert.ok(snapshots>0,'the main owned-word snapshot adapter was actually used');
 console.log('V3 main cooperation: '+checks+' real Worker requests passed; three existing account IDs with synthetic auth/leases, origin/binding/field/host gates, resume, own real-bank question and grader, hidden peer answer, owned snapshot reader, SSE/CORS and revocation; ordinary records unchanged, outbound 0.');
}finally{Date.now=realNow;globalThis.fetch=realFetch;db.close();}
