'use strict';
const assert=require('node:assert/strict'),{create}=require('./app.cjs');
class Target{addEventListener(){}removeEventListener(){}}
let checks=0;const eq=(a,b)=>{assert.deepEqual(a,b);checks++;},settle=()=>new Promise(r=>setImmediate(r));
(async()=>{
 let uid='a',generation=1,available=true,at=Date.parse('2026-10-15T00:00:00+09:00'),serial=0,hold=null;
 const timers=new Map(),requests=[],models=[],destroyed=[],shown=[],closed=[],doc=new Target(),win=new Target();doc.visibilityState='visible';doc.hasFocus=()=>true;
 const app=create({
  context(){const owner=uid,epoch=generation;return owner?{uid:owner,same:()=>uid===owner&&generation===epoch,ready:()=>available}:null;},
  catalog:[{id:'textbook:math1',subject:'数学',kind:'textbook'}],activity:()=> 'textbook:math1',
  async openStorage(owner){return {put:async()=>{},list:async()=>[],remove:async()=>{},close:()=>closed.push(owner)};},
  async request(ctx,path,body){requests.push({owner:ctx.uid,path,method:body===undefined?'GET':'POST'});if(path==='/learning-time-start')return {session:{id:body.id,startedAt:at},serverTime:at};if(hold)return new Promise(r=>hold.resolve=r);return {items:[],next:null,serverTime:at};},
  mountCalendar({model,same}){const id=models.length;models.push(model);return {show:(...args)=>shown.push({id,args,own:same()}),destroy(){destroyed.push(id);model.dispose();}};},
  document:doc,window:win,now:()=>at,newId:()=>`00000000-0000-4000-8000-${String(++serial).padStart(12,'0')}`,
  setInterval:f=>{const id=++serial;timers.set(id,f);return id;},clearInterval:id=>timers.delete(id)
 });
 eq((await app.refresh()).ready,true);await settle();eq(requests.length,1);eq(requests[0].method,'POST');
 eq(app.show({},'2026-10','2026-10-15'),true);eq(models.length,1);
 const summary=await models[0].load('2026-10');eq(summary.totalMs,0);eq(requests.at(-1),{owner:'a',path:'/learning-time',method:'GET'});
 app.show({},'2026-10','2026-10-16');eq(models.length,1);eq(shown.at(-1).args[2],'2026-10-16');
 hold={};const pending=models[0].load('2026-10');await settle();generation++;await app.refresh();
 eq(destroyed,[0]);eq(models[0].state().snapshot,null);hold.resolve({items:[],next:null,serverTime:at});hold=null;
 await assert.rejects(pending);checks++;eq(models[0].state().snapshot,null);
 app.show({},'2026-10','2026-10-15');eq(models.length,2);await settle();eq(closed,['a']);
 uid='b';await app.refresh();eq(destroyed,[0,1]);app.show({},'2026-10','2026-10-15');eq(models.length,3);
 await models[2].load('2026-10');eq(requests.at(-1).owner,'b');
 available=false;eq(app.show({},'2026-10','2026-10-15'),false);await assert.rejects(models[2].load('2026-10'));checks++;
 uid=null;await app.refresh();eq(destroyed,[0,1,2]);eq(app.show({},'2026-10','2026-10-15'),false);
 await app.stop();eq(timers.size,0);eq(app.state().disposed,true);uid='a';available=true;eq(app.show({},'2026-10','2026-10-15'),false);
 console.log('Timeline app adapter: '+checks+' checks passed; real client/month modules, GET/POST separation, same-user session replacement, pending response invalidation, account teardown and no network');
})().catch(e=>{console.error(e);process.exitCode=1;});
