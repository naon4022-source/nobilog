import assert from 'node:assert/strict';
import {createCoopActions} from './client-actions.mjs';
import {createRequire} from 'node:module';
import engine from '../../../cf-worker/src/material-engine.cjs';
import {createCoopRouter} from './route.mjs';
import {createOwnedWordReader} from './owned-word-reader.mjs';
function fixture(options={}){
 let current=true,ids=0,inFlight=0,peak=0,drop=options.drop||{},unavailable=false;
 const calls=[],updates=[],receipts=new Set();let roomId='synthetic_room',last=0,revision=1,hits=0,answerSeq=1;
 let profile={revision:1,body:'male',weapon:'素手',armor:'装備なし',damage:1,coins:30,owned:[{id:'bare'},{id:'none'}]},question=null;
 const view=()=>({canHost:true,state:{id:roomId,stageId:'story_01',phase:'battle',revision,own:{lastSequence:last,nextAnswerSequence:answerSeq,question},hp:100-hits,maxHp:100,members:[{name:'A',self:true,connected:true},{name:'B',self:false,connected:true}]},equipment:structuredClone(profile)});
 const api={request:async(action,request)=>{
  calls.push({action,...structuredClone({...request,signal:undefined})});inFlight++;peak=Math.max(peak,inFlight);
  try{
   await Promise.resolve();if(options.barrier&&action==='tap')await options.barrier;
   if(unavailable&&action==='tap')return Response.json({error:'coop_unavailable'},{status:503});
   let result;
   if(action==='profile')result={profile,shop:[]};
   else if(action==='history')result=options.history||{items:[]};
   else if(action==='history-more')result=options.historyMore;
   else if(action==='progress')result={completedStageIds:[]};
   else if(action==='create'){roomId=request.body.roomId;result={id:roomId};}
   else if(action==='invite')result={id:roomId,revision};
   else if(action==='leave'||action==='cancel')result={id:roomId,left:action==='leave',closed:action==='cancel'};
   else if(action==='state')result=view();
   else if(action==='join-request')result={roomId,requestId:request.body.requestId,status:'pending'};
   else if(action==='join-status')result={...request.query,status:'approved'};
   else if(action==='purchase'){
    if(!receipts.has(request.body.operationId)){receipts.add(request.body.operationId);profile={...profile,revision:profile.revision+1,coins:10,owned:[...profile.owned,{id:request.body.itemId}]};}
    result={view:profile};
   }else if(action==='tap'){
    if(request.body.sequence>last){assert.equal(request.body.sequence,last+1);last++;hits++;revision++;if(last===2)question={challengeId:'synthetic_question',kind:'word',prompt:'apple'};}
    result=view();
   }else if(action==='answer'){assert.equal(request.body.sequence,answerSeq++);assert.equal(request.body.challengeId,question.challengeId);question=null;revision++;result=view();}
   else throw Error('Unexpected fixture action '+action);
   if(drop[action]){drop[action]--;throw Error('Synthetic response loss after commit');}
   return Response.json(result);
  }finally{inFlight--;}
 },isCurrent:()=>current,onState:s=>updates.push(s)};
 const client=createCoopActions(api,{makeId:()=>String(++ids).padStart(20,'0'),makeInvite:()=> 'ABCDEFG2',maxQueued:options.maxQueued||20});
 return {client,calls,updates,view,receipts,setCurrent:x=>{current=x;},unavailable:x=>{unavailable=x;},stats:()=>({ids,hits,last,peak,profile})};
}

// Own acknowledgements update state without an extra GET after every tap.
const f=fixture({drop:{tap:1,purchase:1}});await f.client.load();await f.client.open('synthetic_room');
const hist=fixture({history:{items:[{roomId:'old_room',stageId:'story_01'}],next:'0000000001000:old_room'},historyMore:{items:[{roomId:'old_room',stageId:'story_01'},{roomId:'older_room',stageId:'story_02'}],next:null}});
await hist.client.load();await hist.client.act('history-more');assert.equal(hist.client.read().history.length,2);assert.equal(hist.client.read().historyCursor,null);assert.equal(hist.calls.find(x=>x.action==='history-more').query.cursor,'0000000001000:old_room');await assert.rejects(()=>hist.client.act('history-more'),e=>e.code==='history_complete');hist.client.stop();
const managed=fixture({drop:{invite:1,cancel:1}});await managed.client.load();await managed.client.open('synthetic_room');await managed.client.act('invite');assert.equal(managed.client.read().inviteCode,'ABCDEFG2');const rotations=managed.calls.filter(x=>x.action==='invite');assert.deepEqual(rotations[0].body,rotations[1].body);await managed.client.act('cancel');assert.equal(managed.client.read().state,null);assert.deepEqual(managed.calls.filter(x=>x.action==='cancel').map(x=>x.body),[{roomId:'synthetic_room'},{roomId:'synthetic_room'}]);managed.client.stop();
const initialReads=f.calls.filter(c=>c.action==='state').length;
await Promise.all([f.client.act('tap',{sequence:999}),f.client.act('tap'),f.client.act('tap'),f.client.act('tap')]);
assert.equal(f.stats().hits,2);assert.equal(f.stats().peak,1);
assert.deepEqual(f.calls.filter(c=>c.action==='tap').map(c=>c.body.sequence),[1,1,2]);
assert.equal(f.calls.filter(c=>c.action==='state').length,initialReads);
assert.equal(f.client.read().state.own.question.prompt,'apple');
await f.client.act('answer',{challengeId:'synthetic_question',answer:'synthetic answer',sequence:500});
const answer=f.calls.find(c=>c.action==='answer').body;assert.equal(answer.sequence,1);assert.equal(Object.hasOwn(answer,'correct'),false);assert.equal(f.client.read().state.own.question,null);
const purchase={itemId:'practiceSword'};const purchased=f.client.act('purchase',purchase);purchase.itemId='ironSword';await purchased;
const writes=f.calls.filter(c=>c.action==='purchase');assert.equal(writes.length,2);assert.deepEqual(writes[0].body,writes[1].body);assert.equal(writes[0].body.itemId,'practiceSword');assert.equal(f.receipts.size,1);assert.equal(f.client.read().equipment.coins,10);
const out=f.client.read();out.state.hp=999;assert.notEqual(f.client.read().state.hp,999);
f.updates.at(-1).equipment.coins=999;assert.equal(f.client.read().equipment.coins,10);
// A later room revision cannot roll back newer equipment.
f.client.accept({...f.view(),state:{...f.view().state,revision:99},equipment:{...f.view().equipment,revision:1,coins:30}});assert.equal(f.client.read().equipment.coins,10);
f.client.stop();await assert.rejects(()=>f.client.act('tap'),e=>e.code==='active_session');

// Unknown outcomes block new operations until the identical command is retried.
const p=fixture();await p.client.open('synthetic_room');p.unavailable(true);
await assert.rejects(()=>p.client.act('tap'),e=>e.status===503);assert.equal(p.client.read().retryPending,true);
const attempts=p.calls.filter(c=>c.action==='tap');assert.equal(attempts.length,2);
await assert.rejects(()=>p.client.act('purchase',{itemId:'practiceSword'}),e=>e.code==='retry_required');
p.unavailable(false);await p.client.act('retry');assert.equal(p.stats().hits,1);assert.equal(p.client.read().retryPending,false);assert.deepEqual(p.calls.filter(c=>c.action==='tap')[2].body,attempts[0].body);p.client.stop();

// Creation and join requests keep their random IDs across a lost response.
const c=fixture({drop:{create:1,'join-request':1}});await c.client.act('create',{stageId:'story_01'});
const creates=c.calls.filter(x=>x.action==='create');assert.equal(creates.length,2);assert.deepEqual(creates[0].body,creates[1].body);assert.equal(c.client.read().inviteCode,'ABCDEFG2');assert.equal(c.client.read().canHost,true);
await c.client.act('join-request',{inviteCode:'ABCDEFG2',consent:true});const joins=c.calls.filter(x=>x.action==='join-request');assert.equal(joins.length,2);assert.deepEqual(joins[0].body,joins[1].body);assert.equal(c.client.read().joinStatus,'pending');await c.client.act('join-status');assert.equal(c.client.read().joinStatus,'approved');c.client.stop();

// Queue capacity is bounded; account replacement never delivers an old reply.
let release;const barrier=new Promise(resolve=>{release=resolve;});const q=fixture({barrier,maxQueued:2});await q.client.open('synthetic_room');const one=q.client.act('tap'),two=q.client.act('tap');await assert.rejects(()=>q.client.act('tap'),e=>e.code==='client_queue_full');release();await Promise.all([one,two]);assert.equal(q.stats().hits,2);q.client.stop();
let releaseOwner;const hold=new Promise(resolve=>{releaseOwner=resolve;});let allowed=true,delivered=0;
const owner=createCoopActions({isCurrent:()=>allowed,onState:()=>{delivered++;},request:async()=>{await hold;return Response.json({profile:null,shop:[]});}});
const pending=owner.act('profile',{body:'male'});await Promise.resolve();allowed=false;releaseOwner();await assert.rejects(()=>pending,e=>e.code==='active_session');assert.equal(delivered,0);
const revoked=[];let revokedCallback=0;const revokedClient=createCoopActions({isCurrent:()=>true,onState:x=>revoked.push(x),onSessionChanged:()=>{revokedCallback++;},request:async()=>Response.json({error:'active_session'},{status:409})});
await assert.rejects(()=>revokedClient.act('profile',{body:'male'}),e=>e.code==='active_session');assert.equal(revokedCallback,1);assert.deepEqual(revoked.at(-1),{state:null,connection:'session_changed',retryPending:false});assert.throws(()=>revokedClient.read(),e=>e.code==='active_session');
const deniedClient=createCoopActions({isCurrent:()=>true,onState:()=>{},request:async()=>Response.json({error:'host_only'},{status:403})});await assert.rejects(()=>deniedClient.act('profile',{body:'male'}),e=>e.code==='host_only');assert.equal(deniedClient.read().state,null);deniedClient.stop();

// Actual route, reducers and SQL: two synthetic learners, with response loss
// after an authoritative tap. This is still not a three-browser playthrough.
const require=createRequire(import.meta.url),{D1SQLite}=require('../../../.claude/verify/d1-sqlite.js');
const db=new D1SQLite(),sessions=[{uid:'fixture_host',owner:'opaque_fixture_host',name:'H'},{uid:'fixture_peer',owner:'opaque_fixture_peer',name:'P'}];
let time=1000,challengeIds=0,nonce=0,loseTap=true;
for(const s of sessions)db.seed('active-session:'+s.uid,s.owner,1000000);
const route=createCoopRouter({db,bank:{units:[],sources:[]},engine,wordBank:{grades:[{id:'5',words:[{id:'apple',w:'apple',ja:['りんご']}]}]},clock:()=>time,authorize:async()=>true,checkOrigin:r=>r.headers.get('Origin')==='https://fixture.test',displayName:s=>s.name,randomUint32:()=>0,makeId:()=> 'fixture_challenge_'+String(++challengeIds).padStart(8,'0'),notify:async()=>{},loadOwnWords:createOwnedWordReader({db,clock:()=>time,snapshot:async uid=>({v:1,keys:{[uid+':eikenVocab']:JSON.stringify({v:1,words:{apple:{c:1}}})}})})});
const clients=sessions.map(s=>createCoopActions({isCurrent:()=>true,onState:()=>{},request:async(action,options)=>{
 const url=new URL('https://fixture.test/coop-story/'+action);for(const [k,v] of Object.entries(options.query||{}))url.searchParams.set(k,v);
 const request=new Request(url,{method:options.method,headers:{Origin:'https://fixture.test',...(options.method==='POST'?{'Content-Type':'application/json'}:{})},...(options.method==='POST'?{body:JSON.stringify(options.body)}:{})});
 const response=await route(request,s,{owner:s.owner,json:(value,status=200)=>Response.json(value,{status}),requestJson:async r=>JSON.parse(await r.text())});
 if(action==='tap'&&loseTap&&response.ok){loseTap=false;throw Error('Synthetic post-commit response loss');}return response;
}},{makeId:()=>String(++nonce).padStart(20,'0'),makeInvite:()=> 'ABCDEFG2'}));
try{
 const [host,peer]=clients;await host.act('profile',{body:'male'});await peer.act('profile',{body:'female'});
 await host.act('create',{stageId:'story_01'});assert.equal(host.read().canHost,true);
 await peer.act('join-request',{inviteCode:host.read().inviteCode,consent:true});assert.equal(peer.read().joinStatus,'pending');
 await host.act('pending');const requestId=host.read().pendingRequests[0].requestId;await host.act('approve',{requestId});await peer.act('join-status');assert.equal(peer.read().canHost,false);
 await host.act('heartbeat',{connectionId:'fixture_conn_h'});await peer.act('heartbeat',{connectionId:'fixture_conn_p'});
 await host.act('ready',{ready:true});await peer.act('ready',{ready:true});await host.act('start');assert.equal(host.read().state.phase,'countdown');
 time=4000;await host.refresh();
 for(let i=0;i<12;i++)await host.act('tap');
 assert.equal(host.read().state.own.lastSequence,12);assert.equal(host.read().state.hp,148);assert.equal(host.read().state.own.question.prompt,'apple');
 await peer.refresh();assert.equal(peer.read().state.own.question,null);assert.equal(JSON.stringify(peer.read()).includes('りんご'),false);
 await host.act('answer',{challengeId:host.read().state.own.question.challengeId,answer:'りんご'});assert.equal(host.read().state.own.question,null);
 db.seed('active-session:'+sessions[0].uid,'different_fixture_owner',1000000);
 await assert.rejects(()=>host.act('tap'),e=>e.code==='active_session');assert.equal(db.keys().filter(k=>k.startsWith('material-attempt:')).length,0);
}finally{for(const client of clients)client.stop();db.close();}
console.log('Coop command adapter: bounded serialized writes, exact loss replay/IDs, pending lock, gear/owner isolation plus actual route/SQLite two-learner consent, host approval, countdown, 12 taps without double damage and private word answer passed; three-browser/main integration remains separate.');
