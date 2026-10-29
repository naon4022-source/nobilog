import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {noteJobRoute,readNoteJob,completeNoteJob}=await import(process.argv.includes('--main')?'../../../cf-worker/src/openai-note-jobs.mjs':'./note-jobs.mjs');
const {D1SQLite}=createRequire(import.meta.url)('../../../.claude/verify/d1-sqlite.js'),db=new D1SQLite();
const now=Date.now(),owner='synthetic-owner',origin='https://fixture.test',env={AUTH_DB:db,APP_ORIGIN:origin,SUBSCRIPTION_PREVIEW:'1',PREVIEW_PLAN_ACCOUNTS:'1'};
let n=0;const eq=(a,b)=>{assert.deepEqual(a,b);n++;};
const note={id:'note_fixture',revision:1,title:'数直線',text:'右ほど大きい。',images:[]},body={id:'request_first',noteId:note.id,revision:1};
const call=(uid,method,b=body,extra={})=>noteJobRoute(new Request(origin+'/learning-note-analysis-job'+(method==='GET'?'?noteId='+encodeURIComponent(b.noteId):''),{method,headers:{Origin:extra.origin||origin,'Content-Type':'application/json'},...(method==='POST'?{body:JSON.stringify(b)}:{})}),env,{uid},{owner:extra.owner||owner,now});
try{
 for(const uid of ['p_pro','p_unlimit','p_standard']){db.seed('active-session:'+uid,owner,now+60000);db.seed('learning-note:'+uid+':'+note.id,JSON.stringify(note));}
 eq((await call('p_standard','POST')).status,403);eq((await call('p_pro','POST',body,{origin:'https://wrong.test'})).status,403);eq((await call('p_pro','POST',body,{owner:'different-owner'})).status,409);
 eq((await (await call('p_pro','GET')).json()).job,null);
 eq((await call('p_pro','POST',{...body,text:'injected content'})).status,400);eq((await call('p_pro','POST',{...body,state:'done'})).status,400);
 const concurrent=await Promise.all(['request_first','request_other'].map(id=>call('p_pro','POST',{...body,id})));
 eq(concurrent.map(r=>r.status).sort(),[200,409]);
 const job=(await (await call('p_pro','GET')).json()).job;eq(job.state,'pending');
 eq((await (await call('p_unlimit','GET')).json()).job,null);
 eq((await call('p_pro','POST',{...body,id:job.id})).status,200);
 db.seed('learning-note:p_pro:'+note.id,JSON.stringify({...note,revision:2,text:'更新したノート'}));
 eq((await call('p_pro','POST',{...body,id:'request_newer',revision:2})).status,409);
 eq(await completeNoteJob(db,'p_pro',{...body,id:'request_other_unknown'}),false);
 eq(await completeNoteJob(db,'p_pro',{...body,id:job.id}),true);eq(await completeNoteJob(db,'p_pro',{...body,id:job.id}),true);
 eq((await call('p_pro','POST',{...body,id:'request_newer',revision:1})).status,409);
 eq((await call('p_pro','POST',{...body,id:job.id,revision:2})).status,409);
 eq((await call('p_pro','POST',{...body,id:'request_newer',revision:2})).status,200);
 eq((await readNoteJob(db,'p_pro',note.id)).id,'request_newer');
 eq((await call('p_pro','POST',{...body,noteId:'absent_note1'})).status,404);
 const imageNote={...note,id:'photo_note01',images:['a'.repeat(64)]};db.seed('learning-note:p_pro:'+imageNote.id,JSON.stringify(imageNote));
 eq((await call('p_pro','POST',{...body,noteId:imageNote.id})).status,process.argv.includes('--main')?200:400);
 db.seed('plan:p_pro',JSON.stringify({plan:'free',start:now-1000,end:null,revision:2,next:null}));eq((await call('p_pro','GET')).status,403);
 db.seed('plan:p_pro',JSON.stringify({plan:'pro',start:now-1000,end:null,revision:3,next:null}));eq((await call('p_pro','GET')).status,200);eq((await (await call('p_pro','GET')).json()).job.id,'request_newer');
 eq(JSON.parse(await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind('learning-note:p_pro:'+note.id).first('v')).text,'更新したノート');
}finally{db.close();}
console.log('Note analysis jobs: '+n+' SQLite checks passed; one pending ID per own note, CAS races, source revision, plan/session/origin protection, no AI calls');
