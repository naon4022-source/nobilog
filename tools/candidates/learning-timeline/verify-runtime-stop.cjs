'use strict';
const assert=require('node:assert/strict'),{create}=require('./runtime.cjs');
class Target{constructor(){this.listeners=new Map();}addEventListener(n,f){this.listeners.set(n,f);}removeEventListener(n){this.listeners.delete(n);}}
let n=0;const eq=(a,b)=>{assert.deepEqual(a,b);n++;},settle=()=>new Promise(r=>setImmediate(r));
(async()=>{
 const doc=new Target(),win=new Target();doc.visibilityState='visible';doc.hasFocus=()=>true;
 let at=100000,same=true,fail=true,clears=0,serial=0;const puts=[],sends=[],reports=[];
 const rt=create({uid:'old-owner',same:()=>same,storage:{async put(uid,p){puts.push({uid,p:structuredClone(p)});if(fail)throw Error('disk blocked');},async list(){return [];},async remove(){}},send:async p=>{sends.push(p);return {id:p.id,acceptedAt:at};},start:async p=>({session:{id:p.id,startedAt:at},serverTime:at}),catalog:['textbook:math1'],newId:()=>`00000000-0000-4000-8000-${String(++serial).padStart(12,'0')}`,now:()=>at,activity:()=> 'textbook:math1',document:doc,window:win,setInterval:()=>1,clearInterval:()=>clears++,report:x=>reports.push(x)});
 await settle();rt.tick();at+=1000;rt.tick();same=false;
 const first=rt.stop();eq(rt.stop()===first,true);eq(!!(await first).error,true);eq(rt.state().runtimeClosed,true);eq(!!rt.state().stopError,true);eq(clears,1);eq(doc.listeners.size,0);eq(win.listeners.size,0);eq(reports.length,1);eq(sends.length,0);eq(puts.length,1);
 fail=false;eq((await rt.stop()).retired,true);eq(rt.state().stopError,null);eq(puts.length,2);eq(puts[0],puts[1]);eq(puts[1].uid,'old-owner');eq(sends.length,0);eq((await rt.stop()).retired,true);eq(puts.length,2);eq(clears,1);
 console.log('Timeline runtime stop: '+n+' checks passed; failed retirement retained, explicit same-ID retry, no new-owner send, single cleanup and concurrent stop deduplication');
})().catch(e=>{console.error(e);process.exitCode=1;});
