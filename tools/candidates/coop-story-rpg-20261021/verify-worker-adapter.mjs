import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import engine from '../../../cf-worker/src/material-engine.cjs';
import {createWorkerAdapter} from './worker-adapter.mjs';
const {D1SQLite}=createRequire(import.meta.url)('../../../.claude/verify/d1-sqlite.js');
const db=new D1SQLite(),people=[{uid:'synthetic_a',owner:'owner_a',name:'旅人A'},{uid:'synthetic_b',owner:'owner_b',name:'旅人B'}];
const names=[],watched=[];
const env={AUTH_DB:db,APP_ORIGIN:'https://synthetic.invalid',COOP_STORY_EVENTS:{idFromName:id=>id,get:id=>({invalidate:async revision=>{names.push([id,revision]);},watch:async()=>{watched.push(id);return new ReadableStream({start(c){c.close();}});}})}};
for(const s of people)db.seed('active-session:'+s.uid,s.owner,Date.now()+3600000);
const adapter=createWorkerAdapter({bank:{units:[],sources:[]},engine,wordBank:{grades:[]},snapshot:async()=>null});
const json=(data,status=200)=>Response.json(data,{status});
async function call(who,action,body,bindings=env,origin=env.APP_ORIGIN){
 const get=body===undefined;
 return adapter(new Request('https://synthetic.invalid/coop-story/'+action,{method:get?'GET':'POST',headers:{Origin:origin,'Content-Type':'application/json'},...(get?{}:{body:JSON.stringify(body)})}),bindings,who,{owner:who?.owner,json,requestJson:r=>r.json()});
}
try{
 assert.equal((await call(people[0],'resume',undefined,{...env,COOP_STORY_EVENTS:null})).status,503,'missing namespace fails closed');
 assert.equal((await call(null,'resume')).status,401);
 assert.equal((await call(people[0],'profile',{body:'male'},env,'https://outsider.invalid')).status,403);
 for(const [i,s]of people.entries()){
  assert.equal((await call(s,'profile',{body:i?'female':'male'})).status,200);
  assert.equal((await call(s,'create',{roomId:'adapter_room_'+i,stageId:'story_01',inviteCode:i?'BBBBBBBB':'AAAAAAAA'})).status,200);
 }
 for(const [i,s]of people.entries()){
  assert.deepEqual(await(await call(s,'resume')).json(),{roomId:'adapter_room_'+i},'cached bindings do not cache the previous owner');
  const room=JSON.parse(db.get('coop-story-room:adapter_room_'+i).v);assert.equal(room.members[0].name,s.name);
 }
 const event=await call(people[0],'events?roomId=adapter_room_0');assert.equal(event.status,200);await event.body.cancel();
 assert.deepEqual(watched,['adapter_room_0']);
 assert.equal((await call(people[1],'events?roomId=adapter_room_0')).status,404);assert.equal(watched.length,1,'nonmember cannot reach namespace RPC');
 db.seed('active-session:'+people[0].uid,'replacement',Date.now()+3600000);
 assert.equal((await call(people[0],'resume')).status,409);
 assert.equal(names.length,2);assert.equal(db.keys().some(k=>k.startsWith('material-attempt:')),false);
}finally{db.close();}
console.log('Worker integration adapter: unavailable binding/auth/origin gates, cached binding owner separation, namespace member gating, revoked owner and no ordinary learning writes passed; main mounting remains separate.');
