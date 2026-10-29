import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const mainMode=process.argv.includes('--main');
const {noteJobRoute}=await import(mainMode?'../../../cf-worker/src/openai-note-jobs.mjs':'./note-jobs.mjs');
const {D1SQLite}=createRequire(import.meta.url)('../../../.claude/verify/d1-sqlite.js'),db=new D1SQLite();
const context=vm.createContext({});vm.runInContext(await readFile(new URL(mainMode?'../../../site-assets/note-analysis-api.js':'./note-browser-api.js',import.meta.url),'utf8'),context);
const now=Date.now(),owner='synthetic-owner',origin='https://fixture.test',env={AUTH_DB:db,APP_ORIGIN:origin,SUBSCRIPTION_PREVIEW:'1',PREVIEW_PLAN_ACCOUNTS:'1'},note={id:'note_fixture',revision:1,title:'数直線',text:'右ほど大きい。',images:[]};
let live=true,allowed=true,requests=[],loseReadback=false,n=0;
const eq=(a,b)=>{assert.deepEqual(a,b);n++;},reject=async(fn)=>{await assert.rejects(fn);n++;};
db.seed('active-session:p_pro',owner,now+60000);db.seed('learning-note:p_pro:'+note.id,JSON.stringify(note));
const api=context.NobiNoteAnalysisAPI.create({same:()=>live,saved:()=>note,draft:()=>note,allowed:()=>allowed,request:async(path,options)=>{
 requests.push({path,options});
 if(path.startsWith('/learning-note-analysis-job')){
  const r=await noteJobRoute(new Request(origin+path,options?.method==='POST'?{...options,headers:{...options.headers,Origin:origin}}:options),env,{uid:'p_pro'},{owner,now});
  if(loseReadback&&options?.method!=='POST')return Response.json({job:null});return r;
 }
 if(path==='/learning-chat?status=1')return Response.json({ready:true});
 if(path==='/plan')return Response.json({dailyLeft:500,dailyLimit:500});
 if(path.startsWith('/learning-note-analysis?id='))return Response.json({error:'not_found'},{status:404});
 if(path==='/learning-note-analysis')return Response.json({item:{id:JSON.parse(options.body).id}});
 throw Error('unexpected fixture request');
}});
try{
 eq((await api.status()).ready,true);eq(await api.loadJob(),null);
 const job={id:'request_first',noteId:note.id,revision:1,state:'pending'};
 eq(await api.saveJob(job),true);eq((await api.loadJob()).id,job.id);
 eq(JSON.stringify(JSON.parse(requests.find(r=>r.options?.method==='POST').options.body)),JSON.stringify({id:job.id,noteId:note.id,revision:1}));
 eq(await api.readResult(job.id),null);
 eq((await api.analyze({id:job.id,noteId:note.id,revision:1})).item.id,job.id);
 loseReadback=true;await reject(()=>api.saveJob(job));loseReadback=false;
 await reject(()=>api.saveJob({...job,id:'different_request'}));
 const before=requests.length;live=false;await reject(()=>api.status());eq(requests.length,before);live=true;
 allowed=false;eq((await api.status()).ready,false);eq(await api.loadJob(),null);eq(requests.length,before);
 eq(requests.some(r=>JSON.stringify(r).includes(note.text)),false);
}finally{db.close();}
console.log('Note analysis browser API: '+n+' checks passed; real SQLite job registration/readback, no note text/model/UID in request, unconfirmed save and owner changes closed');
