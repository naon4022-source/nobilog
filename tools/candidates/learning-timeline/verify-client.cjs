'use strict';
const assert=require('node:assert/strict'),{create}=require('./client.cjs');
class Target{constructor(){this.listeners=new Map();}addEventListener(n,f){this.listeners.set(n,f);}removeEventListener(n){this.listeners.delete(n);}}
let n=0;const eq=(a,b)=>{assert.deepEqual(a,b);n++;},settle=()=>new Promise(r=>setImmediate(r));
(async()=>{
 let uid='a',ready=true,at=100000,serial=0,fail=false,openFail=false;const doc=new Target(),win=new Target(),opens=[],closed=[],requests=[],rows=new Map(),reports=[],timers=new Map();doc.visibilityState='visible';doc.hasFocus=()=>true;
 const client=create({context:()=>{const owner=uid;return owner?{uid:owner,same:()=>uid===owner,ready:()=>ready}:null;},openStorage:async owner=>{opens.push(owner);if(openFail)throw Error('unavailable');return {async put(who,p){assert.equal(who,owner);if(fail)throw Error('full');rows.set(owner+':'+p.id,p);},async list(who){assert.equal(who,owner);return [];},async remove(){},close(){closed.push(owner);}};},request:async(path,body)=>{requests.push({uid,path,body});return path==='/learning-time-start'?{session:{id:body.id,startedAt:at},serverTime:at}:{id:body.id,acceptedAt:at};},activity:()=> 'textbook:math1',catalog:[{id:'textbook:math1',kind:'textbook',subject:'数学'}],document:doc,window:win,now:()=>at,newId:()=>`00000000-0000-4000-8000-${String(++serial).padStart(12,'0')}`,setInterval:f=>{const id=++serial;timers.set(id,f);return id;},clearInterval:id=>timers.delete(id),report:e=>reports.push(e)});
 eq((await client.refresh()).ready,true);await settle();eq(opens,['a']);eq(requests.length,1);await client.refresh();eq(opens.length,1);
 for(const f of [...timers.values()])f();await settle();at+=1000;for(const f of [...timers.values()])f();await settle();
 fail=true;uid='b';eq((await client.refresh()).pending,true);eq(opens,['a']);eq(closed,[]);eq(client.state().pendingRetirement,true);eq(requests.every(r=>r.uid==='a'),true);
 fail=false;eq((await client.retry()).ready,true);await settle();eq(closed,['a']);eq(opens,['a','b']);eq([...rows.keys()].every(k=>k.startsWith('a:')),true);eq(requests.filter(r=>r.uid==='b').every(r=>r.path==='/learning-time-start'),true);
 uid=null;eq((await client.refresh()).waiting,true);eq(closed,['a','b']);eq(client.state().active,false);
 uid='c';openFail=true;eq(!!(await client.refresh()).error,true);const attempts=opens.length;await client.refresh();eq(opens.length,attempts);at+=30000;openFail=false;eq((await client.refresh()).ready,true);await settle();eq(opens.at(-1),'c');
 const beforeRestore=opens.length;win.listeners.get('pagehide')();await settle();eq((await client.refresh()).ready,true);await settle();eq(opens.length,beforeRestore+1);eq(client.state().active,true);
 eq((await client.stop()).stopped,true);eq(closed.at(-1),'c');eq(timers.size,0);eq((await client.retry()).stopped,true);eq(client.state().disposed,true);
 console.log('Timeline client: '+n+' checks passed; real runtime/bridge wiring, one mount per owner, failed retirement blocks replacement, explicit retry, startup backoff and complete timer cleanup; synthetic only');
})().catch(e=>{console.error(e);process.exitCode=1;});
