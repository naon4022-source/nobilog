const assert=require('node:assert/strict'),{create}=require('./outbox.cjs');
let checks=0;function equal(a,b){assert.deepEqual(a,b);checks++;}
const data=new Map(),key=(uid,id)=>uid+':'+id;
const storage={async put(uid,p){const k=key(uid,p.id),old=data.get(k);if(old&&JSON.stringify(old)!==JSON.stringify(p))throw Error('conflict');data.set(k,structuredClone(p));},async list(uid,n){return [...data].filter(([k])=>k.startsWith(uid+':')).slice(0,n).map(([,v])=>structuredClone(v));},async remove(uid,p){const k=key(uid,p.id);if(JSON.stringify(data.get(k))!==JSON.stringify(p))throw Error('changed');data.delete(k);}};
const id='00000000-0000-4000-8000-000000000001',sid='00000000-0000-4000-8000-000000000002';
const payload={id,sessionId:sid,spans:[{activity:'textbook:math1',startOffset:0,endOffset:1000}]};
(async()=>{
 let active=true,fail=true,calls=0;
 const send=async p=>{calls++;if(fail)throw Error('offline');return {id:p.id,acceptedAt:100000};};
 const q=create({uid:'a',same:()=>active,storage,send});equal(await q.enqueue(payload),true);payload.spans[0].activity='changed';equal(data.get(key('a',id)).spans[0].activity,'textbook:math1');payload.spans[0].activity='textbook:math1';
 equal(await q.enqueue(payload),true);equal(data.size,1);const failed=await q.flush();equal(!!failed.error,true);equal(data.size,1);
 fail=false;const first=q.flush(),second=q.flush();equal(first===second,true);equal((await first).sent,1);equal(data.size,0);equal(calls,2);
 await q.enqueue(payload);const b=create({uid:'b',same:()=>true,storage,send});await b.enqueue(payload);equal(data.size,2);active=false;equal((await q.flush()).stopped,true);equal(data.size,2);equal(await q.enqueue(payload),false);
 equal((await b.flush()).sent,1);equal(data.has(key('a',id)),true);equal(data.has(key('b',id)),false);
 const resumed=create({uid:'a',same:()=>true,storage,send});equal((await resumed.flush()).sent,1);equal(data.size,0);
 const wrong=create({uid:'a',same:()=>true,storage,send:async()=>({id:sid,acceptedAt:100000})});await wrong.enqueue(payload);equal(!!(await wrong.flush()).error,true);equal(data.size,1);
 await assert.rejects(()=>resumed.enqueue({...payload,token:'private'}));checks++;
 await assert.rejects(()=>resumed.enqueue({...payload,spans:[{...payload.spans[0],answer:'private'}]}));checks++;
 console.log('Timeline outbox candidate: '+checks+' checks passed; offline/reload/retry, immutable payload, concurrent flush once, owner isolation, bad receipt retention, no credentials/answers; synthetic storage only');
})().catch(e=>{console.error(e);process.exit(1);});
