const assert=require('node:assert/strict'),{create}=require('./collector.cjs');
let n=0;const eq=(a,b)=>{assert.deepEqual(a,b);n++;};
function setup(){let same=true,putFail=false,sendFail=false,puts=0,sends=0,serial=0;const rows=new Map(),sent=[];
 const storage={async put(uid,p){puts++;if(putFail)throw Error('offline storage');const old=rows.get(p.id);if(old)assert.deepEqual(old.p,p);else rows.set(p.id,{uid,p:structuredClone(p)});},async list(uid,limit){return [...rows.values()].filter(x=>x.uid===uid).slice(0,limit).map(x=>structuredClone(x.p));},async remove(uid,p){const old=rows.get(p.id);assert.equal(old.uid,uid);assert.deepEqual(old.p,p);rows.delete(p.id);}};
 const c=create({uid:'a',sessionId:'00000000-0000-4000-8000-000000000001',origin:1000,same:()=>same,storage,catalog:['textbook:math1','question:math-unit'],newId:()=>`00000000-0000-4000-8000-${String(++serial).padStart(12,'0')}`,send:async p=>{sends++;sent.push(structuredClone(p));if(sendFail)throw Error('response lost');return {id:p.id,acceptedAt:10000};}});
 return {c,rows,sent,set:v=>{if(v.same!==undefined)same=v.same;if(v.putFail!==undefined)putFail=v.putFail;if(v.sendFail!==undefined)sendFail=v.sendFail;},stats:()=>({puts,sends})};}
(async()=>{
 let t=setup();t.c.sample(1000,'textbook:math1',{visible:true,focused:true});t.c.sample(2000,'textbook:math1',{visible:true,focused:true});
 eq(t.c.state().totalMs,1000);await Promise.all([t.c.flush(),t.c.flush()]);eq(t.stats().puts,1);eq(t.stats().sends,1);eq(t.sent[0].spans,[{activity:'textbook:math1',startOffset:0,endOffset:1000}]);
 await t.c.flush();eq(t.stats().sends,1);
 t.c.sample(3000,'question:math-unit',{visible:true,focused:true});t.c.sample(4000,'question:math-unit',{visible:true,focused:true});await t.c.flush();
 eq(t.sent[1].spans,[{activity:'textbook:math1',startOffset:1000,endOffset:2000},{activity:'question:math-unit',startOffset:2000,endOffset:3000}]);
 t.c.sample(4000,null);t.c.sample(5000,null);eq(t.c.state().totalMs,3000);
 t=setup();t.set({putFail:true});t.c.sample(1000,'textbook:math1',{visible:true,focused:true});t.c.sample(2000,'textbook:math1',{visible:true,focused:true});eq(!!(await t.c.flush()).error,true);eq(t.stats().sends,0);
 t.set({putFail:false,sendFail:true});await t.c.flush();eq(t.rows.size,1);const id=t.sent[0].id;t.set({sendFail:false});await t.c.flush();eq(t.sent[1].id,id);eq(t.rows.size,0);
 t=setup();t.c.sample(1000,'textbook:math1',{visible:true,focused:true});t.c.sample(2000,'textbook:math1',{visible:false,focused:false});t.c.sample(3000,'textbook:math1',{visible:false,focused:false});eq(t.c.state().totalMs,1000);
 t.set({same:false});eq(t.c.sample(4000,'textbook:math1',{visible:true,focused:true}),false);eq((await t.c.flush()).stopped,true);eq(t.stats().sends,0);
 t=setup();const limit=1000+4*3600000;t.c.sample(1000,'textbook:math1',{visible:true,focused:true});t.c.sample(limit-1000,'textbook:math1',{visible:true,focused:true,touch:true});t.c.sample(limit+1000,'textbook:math1',{visible:true,focused:true});eq(t.c.state().rotationRequired,true);await t.c.flush();eq(t.sent.every(p=>p.spans.every(s=>s.endOffset<=4*3600000)),true);eq(t.c.sample(limit+2000,'textbook:math1'),false);
 eq(t.c.sample(limit+3000,'unknown'),false);
 t=setup();t.c.sample(1000,'textbook:math1',{visible:true,focused:true});t.c.sample(2000,'textbook:math1',{visible:true,focused:true});t.set({same:false});await t.c.retire(3000);eq(t.stats().sends,0);eq(t.rows.size,1);eq([...t.rows.values()][0].uid,'a');eq([...t.rows.values()][0].p.spans,[{activity:'textbook:math1',startOffset:0,endOffset:1000}]);
 t=setup();t.c.sample(1000,'textbook:math1',{visible:true,focused:true});t.c.sample(2000,'textbook:math1',{visible:true,focused:true});t.set({same:false,putFail:true});eq(!!(await t.c.retire(3000)).error,true);const held=t.c.state().pendingChunks;t.set({putFail:false});await t.c.retire(4000);eq(held,1);eq(t.rows.size,1);eq(t.stats().sends,0);
 const unknown=setup();assert.throws(()=>unknown.c.sample(1000,'unknown'));n++;
 console.log('Timeline collector candidate: '+n+' checks passed; foreground, durable before send, fixed retry IDs, cursor dedup, owner isolation and four-hour boundary; synthetic only');
})().catch(e=>{console.error(e);process.exitCode=1;});
