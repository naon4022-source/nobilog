import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import engine from '../../../cf-worker/src/material-engine.cjs';
import {createCoopRouter} from './route.mjs';
import {createOwnedWordReader} from './owned-word-reader.mjs';
const require=createRequire(import.meta.url),{D1SQLite}=require('../../../.claude/verify/d1-sqlite.js');
const db=new D1SQLite(),players=['a','b','c','d'].map(x=>({uid:'synthetic_'+x,owner:'owner_'+x,name:x.toUpperCase()}));
const [a,b,c,d]=players;
for(const s of players)db.seed('active-session:'+s.uid,s.owner,10000000);
let time=1000,allowed=true,watchCalls=0,ids=0;
const notices=[];
const config={db,bank:{units:[],sources:[]},engine,wordBank:{grades:[{id:'5',words:[{id:'apple',w:'apple',ja:['りんご']}]}]},
 clock:()=>time,authorize:async()=>allowed,checkOrigin:async r=>r.headers.get('Origin')==='https://fixture.test',displayName:s=>s.name,
 loadOwnWords:createOwnedWordReader({db,clock:()=>time,snapshot:async uid=>({v:1,keys:{[uid+':eikenVocab']:JSON.stringify({v:1,words:{apple:{c:1}}})}})}),randomUint32:()=>0,makeId:()=> 'synthetic_challenge_'+String(++ids).padStart(8,'0'),
 notify:async(roomId,revision)=>{notices.push({roomId,revision});},watch:async()=>{watchCalls++;return new ReadableStream({type:'bytes',start(controller){controller.enqueue(new TextEncoder().encode('event: ready\ndata: {"revision":0}\n\n'));controller.close();}});}};
const route=createCoopRouter(config);
const helpers=s=>({owner:s?.owner,json:(x,status=200)=>Response.json(x,{status}),requestJson:async(r,limit)=>{const text=await r.text();if(Buffer.byteLength(text)>limit)throw Object.assign(Error('oversize'),{status:413});return JSON.parse(text);},invalidBody:e=>Response.json({error:'invalid_body'},{status:e.status===413?413:400})});
function call(action,{who=a,method='GET',body,query='',headers={}}={}){
 const options={method,headers:{Origin:'https://fixture.test',...(method==='POST'?{'Content-Type':'application/json'}:{}),...headers}};
 if(body!==undefined)options.body=typeof body==='string'?body:JSON.stringify(body);
 return route(new Request('https://fixture.test/coop-story/'+action+query,options),who,helpers(who));
}
const post=(action,body,who=a)=>call(action,{method:'POST',body,who});
try{
 assert.equal(await route(new Request('https://fixture.test/other'),a,helpers(a)),null);
 assert.equal((await call('constructor')).status,404);
 assert.equal((await call('state',{who:null,query:'?roomId=synthetic_room'})).status,401);
 assert.equal((await call('resume',{who:null})).status,401);
 assert.equal((await call('resume',{query:'?uid=synthetic_b'})).status,400);
 assert.deepEqual(await(await call('resume')).json(),{roomId:null});
 assert.equal((await call('profile',{method:'DELETE'})).status,405);
 allowed=false;assert.equal((await call('profile')).status,403);allowed=true;
 assert.equal((await call('profile',{method:'POST',body:{body:'male'},headers:{Origin:'https://evil.test'}})).status,403);
 assert.equal((await call('profile',{method:'POST',body:{body:'male'},headers:{'Content-Type':'text/plain'}})).status,415);
 assert.equal((await call('profile',{method:'POST',body:'{broken'})).status,400);
 assert.equal((await call('profile',{method:'POST',body:'x'.repeat(16385)})).status,413);
 assert.equal((await call('profile',{query:'?owner=leak'})).status,400);
 assert.equal((await call('state',{query:'?roomId=x&roomId=y'})).status,400);
 for(const s of players)assert.equal((await post('profile',{body:s===a?'male':'female'},s)).status,200);
 assert.equal((await post('purchase',{itemId:'unknown',operationId:'synthetic_op'})).status,400);
 assert.equal((await post('equip',{itemId:'ironSword'})).status,409);
 const create={roomId:'synthetic_room',stageId:'story_01',inviteCode:'ABCDEFG2'};
 assert.equal((await post('create',{...create,uid:b.uid})).status,400);
 assert.equal((await post('create',create)).status,200);
 assert.deepEqual(await(await call('resume')).json(),{roomId:create.roomId});
 assert.deepEqual(await(await call('resume',{who:b})).json(),{roomId:null});
 assert.equal((await call('state',{who:b,query:'?roomId='+create.roomId})).status,404);
 for(const s of [b,c]){
  const requestId='request_'+s.uid;
  assert.equal((await post('join-request',{inviteCode:create.inviteCode,requestId,consent:true},s)).status,200);
  assert.equal((await call('events',{who:s,query:'?roomId='+create.roomId})).status,404);
  assert.equal((await post('approve',{roomId:create.roomId,requestId},s)).status,403);
  assert.equal((await post('approve',{roomId:create.roomId,requestId})).status,200);
 }
 assert.equal((await post('join-request',{inviteCode:create.inviteCode,requestId:'request_d',consent:true},d)).status,409);
 for(const s of [a,b,c])assert.equal((await post('heartbeat',{roomId:create.roomId,connectionId:'conn'},s)).status,200);
 for(const s of [a,b,c])assert.equal((await post('ready',{roomId:create.roomId,ready:true},s)).status,200);
 assert.equal((await post('start',{roomId:create.roomId},b)).status,403);
 assert.equal((await post('start',{roomId:create.roomId})).status,200);
 assert.equal((await post('tap',{roomId:create.roomId,sequence:1,damage:999})).status,400);
 time=4000;
 for(let sequence=1;sequence<=12;sequence++)assert.equal((await post('tap',{roomId:create.roomId,sequence})).status,200);
 const state=await(await call('state',{query:'?roomId='+create.roomId})).json();
 assert.equal(state.canHost,true);
 assert.equal((await(await call('state',{who:b,query:'?roomId='+create.roomId})).json()).canHost,false);
 assert.equal(state.state.members.length,3);assert.equal(state.state.own.question.prompt,'apple');
 for(const privateValue of ['owner_a','owner_b','owner_c','answerDigest','りんご'])assert.equal(JSON.stringify(state).includes(privateValue),false);
 const answer={roomId:create.roomId,sequence:1,challengeId:state.state.own.question.challengeId,answer:'りんご'};
 assert.equal((await post('answer',{...answer,correct:true})).status,400);
 assert.equal((await post('answer',answer)).status,200);
 const events=await call('events',{query:'?roomId='+create.roomId});assert.equal(events.status,200);assert.equal(events.headers.get('Cache-Control'),'no-store');assert.equal(watchCalls,1);
 assert.equal(await events.text(),'event: ready\ndata: {"revision":0}\n\n');
 assert.equal((await call('events',{who:d,query:'?roomId='+create.roomId})).status,404);assert.equal(watchCalls,1);
 db.seed('active-session:'+a.uid,'replacement',10000000);
 assert.equal((await call('profile')).status,409);
 assert.equal((await call('story')).status,409);
 assert.equal((await call('resume')).status,409);
 assert.equal((await post('tap',{roomId:create.roomId,sequence:13})).status,409);
 assert.equal(db.keys().filter(k=>k.startsWith('material-attempt:')).length,0);
 assert.ok(notices.length>0);
}finally{db.close();}
console.log('Coop route: auth/plan callback, origin/method/size/strict fields, consent/host approval, three-player countdown/taps/own quiz, member-only events, revocation and no ordinary grade writes passed; main Worker integration unverified.');
