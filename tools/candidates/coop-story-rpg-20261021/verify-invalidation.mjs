// Prepared only. Run serially after the live full suite ends.
// Native byte streams, fake clock; no network, Worker runtime or user records.
import assert from 'node:assert/strict';
import {createInvalidationHub} from './invalidation-hub.mjs';
let clockId=0;const timers=new Map();
const clock={setTimeout(fn,ms){const id=++clockId;timers.set(id,{fn,ms});return id;},clearTimeout(id){timers.delete(id);}};
const hub=createInvalidationHub(clock),decoder=new TextDecoder();
function decode(bytes){const lines=decoder.decode(bytes).split('\n');return {event:lines.find(s=>s.startsWith('event:')).slice(7),data:JSON.parse(lines.find(s=>s.startsWith('data:')).slice(6))};}
const first=hub.watch(),r=first.getReader();
assert.deepEqual(decode((await r.read()).value),{event:'ready',data:{revision:0}});
assert.ok([...timers.values()].every(t=>t.ms===55000));
hub.invalidate(1);assert.deepEqual(decode((await r.read()).value),{event:'refresh',data:{revision:1}});
hub.invalidate(1);hub.invalidate(2);assert.equal(decode((await r.read()).value).data.revision,2);
for(const bad of [0,-1,1.5,Infinity,'3',{}])assert.throws(()=>hub.invalidate(bad),{message:'invalid_revision'});
const slow=hub.watch(),slowReader=slow.getReader();
for(let n=3;n<=200;n++)hub.invalidate(n);
let maximum=0,messages=0;
while(maximum<200){const {done,value}=await slowReader.read();assert.equal(done,false);maximum=Math.max(maximum,decode(value).data.revision);messages++;assert.ok(messages<=12,'slow receiver has bounded notifications instead of 198 queued events');}
assert.equal(maximum,200);
const extras=Array.from({length:10},()=>hub.watch());
assert.throws(()=>hub.watch(),{message:'too_many_watchers'});
await r.cancel();await slowReader.cancel();for(const s of extras)await s.cancel();
assert.equal(timers.size,0);assert.equal(hub.invalidate(201).notified,0);
const expiring=hub.watch(),er=expiring.getReader();await er.read();
const [timerId,timer]=[...timers][0];timers.delete(timerId);timer.fn();
assert.equal((await er.read()).done,true);assert.equal(hub.invalidate(202).notified,0);
console.log('Invalidation candidate: byte-stream delivery, revision validation, duplicate suppression, bounded slow receiver, cap, cancel and finite lease passed; actual Cloudflare RPC remains unverified.');
