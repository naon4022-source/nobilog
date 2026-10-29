const assert=require('node:assert/strict'),{create}=require('./lifecycle.cjs');
let n=0;function eq(a,b){assert.deepEqual(a,b);n++;}
function setup(){let at=100000,actor=true,serial=0,fail=false,putFail=false,hold=null;const starts=[],sent=[],rows=new Map();
 const id=()=>`00000000-0000-4000-8000-${String(++serial).padStart(12,'0')}`,serverStarts=new Map();
 const storage={async put(uid,p){if(putFail)throw Error('storage');rows.set(p.id,p);},async list(){return [...rows.values()];},async remove(uid,p){rows.delete(p.id);}};
 const c=create({uid:'synthetic',same:()=>actor,storage,catalog:['textbook:math1'],newId:id,now:()=>at,send:async p=>{sent.push(p);return {id:p.id,acceptedAt:1};},start:async p=>{starts.push(p.id);if(!serverStarts.has(p.id))serverStarts.set(p.id,at);if(hold)await hold;if(fail)throw Error('lost');return {session:{id:p.id,startedAt:serverStarts.get(p.id)},serverTime:at};}});
 return {c,starts,sent,set(x){if(x.at!==undefined)at=x.at;if(x.actor!==undefined)actor=x.actor;if(x.fail!==undefined)fail=x.fail;if(x.putFail!==undefined)putFail=x.putFail;if(x.hold!==undefined)hold=x.hold;}};
}
(async()=>{
 let t=setup();eq(t.c.sample('textbook:math1',{visible:true,focused:true}),false);t.set({fail:true});eq(!!(await t.c.ensure()).error,true);t.set({fail:false,at:101000});await t.c.ensure();eq(t.starts[0],t.starts[1]);
 t.c.sample('textbook:math1',{visible:true,focused:true});t.set({at:102000});t.c.sample('textbook:math1',{visible:true,focused:true});await t.c.flush();eq(t.sent[0].spans,[{activity:'textbook:math1',startOffset:1000,endOffset:2000}]);
 let release;const wait=new Promise(r=>release=r);t=setup();t.set({hold:wait});const a=t.c.ensure(),b=t.c.ensure();eq(a,b);eq(t.starts.length,1);t.set({actor:false});release();eq((await a).stopped,true);eq(t.c.state().ready,false);
 t=setup();await t.c.ensure();t.c.sample('textbook:math1',{visible:true,focused:true});t.set({at:101000});t.c.sample('textbook:math1',{visible:true,focused:true});await t.c.stop();eq(t.sent.length,1);eq(t.c.sample('textbook:math1',{}),false);eq((await t.c.ensure()).stopped,true);
 t=setup();let unblock;t.set({hold:new Promise(r=>unblock=r)});const pending=t.c.ensure();await t.c.stop();unblock();eq((await pending).stopped,true);eq(t.c.state().ready,false);
 t=setup();await t.c.ensure();const boundary=100000+4*3600000;t.set({at:boundary-1000});t.c.sample('textbook:math1',{visible:true,focused:true});t.set({at:boundary});t.c.sample('textbook:math1',{visible:true,focused:true});t.set({putFail:true});eq(!!(await t.c.flush()).error,true);eq(t.starts.length,1);t.set({putFail:false});await t.c.flush();eq(t.starts.length,2);eq(t.starts[0]===t.starts[1],false);eq(t.sent[0].spans[0].endOffset,4*3600000);
 t=setup();t.set({fail:true});await t.c.ensure();t.set({fail:false,at:100000+4*3600000});eq(!!(await t.c.ensure()).error,true);eq(t.c.state().pendingStart,false);await t.c.ensure();eq(t.starts.length,3);eq(t.starts[0]===t.starts[2],false);eq(t.c.state().ready,true);
 console.log('Timeline lifecycle candidate: '+n+' checks passed; confirmed start, fixed start replay, no pre-start counting and identity/stop races; synthetic only');
})().catch(e=>{console.error(e);process.exitCode=1;});
