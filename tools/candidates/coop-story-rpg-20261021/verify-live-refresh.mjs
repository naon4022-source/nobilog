// Prepared only: run after the active full suite. Fake IO, native byte streams.
import assert from 'node:assert/strict';
import {createLiveRefresh} from './live-refresh.mjs';
const defer=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function until(test){for(let i=0;i<100;i++){if(test())return;await tick();}throw Error('synthetic condition did not settle');}
function clock(){let id=0;const timers=new Map();return {timers,later(fn,ms){const key=++id;timers.set(key,{fn,ms});return key;},cancel(key){timers.delete(key);},run(){const [key,item]=timers.entries().next().value||[];if(!item)throw Error('no timer');timers.delete(key);item.fn();}};}
function stream(){
 let c,cancelled=0;const encoder=new TextEncoder();
 const body=new ReadableStream({type:'bytes',start(x){c=x;},cancel(){cancelled++;}});
 return {response:new Response(body,{headers:{'content-type':'text/event-stream'}}),emit(text){c.enqueue(encoder.encode(text));},get cancelled(){return cancelled;},end(){c.close();}};
}
const packet=(event,revision)=>`event: ${event}\ndata: ${JSON.stringify({revision})}\n\n`;
{
 const t=clock(),s=stream(),first=defer(),states=[],statuses=[];let valid=true,reads=0,signal;
 const live=createLiveRefresh({isCurrent:()=>valid,connect:async x=>{signal=x;return s.response;},fetchState:async()=>++reads===1?first.promise:{revision:2},onState:x=>states.push(x),onStatus:x=>statuses.push(x)},t);
 live.start();s.emit(packet('ready',0));await until(()=>reads===1);
 s.emit(packet('refresh',2));await tick();first.resolve({revision:2});await until(()=>states.length>0);await tick();
 assert.ok(states.every(x=>x.revision===2));const before=reads;
 s.emit(packet('refresh',1));await tick();assert.equal(reads,before);
 valid=false;s.emit(packet('refresh',3));await until(()=>signal.aborted);
 assert.ok(states.every(x=>x.revision===2));assert.equal(t.timers.size,0);
}
{
 const t=clock(),s=stream(),pending=defer(),states=[];let reads=0;
 const live=createLiveRefresh({isCurrent:()=>true,connect:async()=>s.response,fetchState:()=>{reads++;return pending.promise;},onState:x=>states.push(x),onStatus:()=>{}},t);
 live.start();s.emit(packet('ready',0));await until(()=>reads===1);live.stop();pending.resolve({revision:8});await tick();await tick();
 assert.deepEqual(states,[]);assert.ok(s.cancelled>=1);assert.equal(t.timers.size,0);
}
{
 const t=clock(),statuses=[];let connects=0;
 const live=createLiveRefresh({isCurrent:()=>true,connect:async()=>{connects++;return Response.json({error:'active_session'},{status:409});},fetchState:()=>assert.fail('expired lease must not read game'),onState:()=>assert.fail('no state'),onStatus:x=>statuses.push(x)},t);
 live.start();await until(()=>statuses.includes('session_changed'));await tick();
 assert.equal(connects,1);assert.equal(t.timers.size,0);live.start();await tick();assert.equal(connects,1);
}
{
 const t=clock(),streams=[],states=[];let active=0,maxActive=0,connects=0;
 const live=createLiveRefresh({isCurrent:()=>true,connect:async()=>{active++;maxActive=Math.max(active,maxActive);connects++;const s=stream();streams.push(s);active--;return s.response;},fetchState:async()=>({revision:3}),onState:x=>states.push(x),onStatus:()=>{}},t);
 live.start();await until(()=>streams.length===1);
 streams[0].emit('event: refresh\ndata: {"revi');streams[0].emit('sion":3}\n\n');await until(()=>states.length===1);
 assert.equal(states[0].revision,3);
 streams[0].emit('event: refresh\ndata: {"revision":4,"private":"discard"}\n\n');await until(()=>t.timers.size===1);
 assert.ok(streams[0].cancelled>=1);t.run();await until(()=>streams.length===2);
 streams[1].emit(packet('ready',0));await until(()=>states.length>=2);
 assert.equal(maxActive,1);assert.equal(connects,2);live.stop();await tick();assert.equal(t.timers.size,0);
}
console.log('Live refresh candidate: split packets, monotonic revision, coalesced state reads, owner change, late fetch disposal, expired lease stop and one reconnect loop passed; actual app adapter/RPC unverified.');
