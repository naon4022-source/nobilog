import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const mainMode=process.argv.includes('--main');
const moduleUrl=name=>new URL(mainMode?'../../../cf-worker/src/openai-'+name+'.mjs':'./'+name+'.mjs',import.meta.url);
const {noteContent,noteAnalysisResponse}=await import(moduleUrl('note-content'));
const {capturedNote}=await import(moduleUrl('note-context'));
const {noteAnalysisRoute}=await import(moduleUrl('note-route'));
const {noteJobRoute}=await import(moduleUrl('note-jobs'));
import {planStatus} from '../../../cf-worker/src/plans.mjs';
const require=createRequire(import.meta.url),{D1SQLite}=require('../../../.claude/verify/d1-sqlite.js');
let n=0;const eq=(a,b)=>{assert.deepEqual(a,b);n++;},rejects=async(fn)=>{await assert.rejects(fn);n++;};
const note={id:'note_fixture',revision:1,title:'数直線',text:'右に進むほど数は大きい。',images:[]};
const value={summary:'数直線の向きを整理しています。',strengths:['左右の向きに注目しています。'],checks:[{quote:'右に進む',reason:'実際の数でも確かめよう。',nextStep:'0と1の位置を比べよう。'}],practice:[{question:'0と1では、どちらが右にある？',answer:'1',reason:'右ほど大きくなるからです。'}]};
eq(noteContent(note).validate(JSON.stringify(value)),value);
for(const patch of [{images:['a'.repeat(64)]},{title:''},{text:'x'.repeat(6001)},{text:'問い合わせ learner@example.com'},{text:'https://example.com'},{text:'<script>test</script>'},{text:'sk-proj-'+'a'.repeat(30)},{revision:0},{id:12345678}]){assert.throws(()=>noteContent({...note,...patch}));n++;}
eq(JSON.parse(noteContent({...note,text:'あ'.repeat(6000)}).content.input).note.text.length,6000);
for(const invalid of [{...value,score:100},{...value,strengths:Array(4).fill('確認')},{...value,checks:[{...value.checks[0],quote:'ノートに存在しない引用'}]},{...value,practice:[value.practice[0],value.practice[0]]},{...value,practice:[{...value.practice[0],answer:'<b>1</b>'}]},{...value,summary:'連絡はこちら learner@example.com'}]){assert.throws(()=>noteAnalysisResponse(JSON.stringify(invalid),note.text));n++;}
// Exercise the real shared paid-operation service, in this process only.
// No served files are edited and every HTTP operation is a fake fetcher.
const main=new URL('../../../cf-worker/src/openai-tutor-service.mjs',import.meta.url);
let source=await readFile(main,'utf8');
if(!mainMode)for(const patch of JSON.parse(await readFile(new URL('./service-authorization-patches.json',import.meta.url),'utf8'))){assert.equal(source.split(patch.old).length-1,patch.count);source=source.split(patch.old).join(patch.new);}
source=source.replace(/from '(\.\/[^']+)'/g,(_,p)=>'from '+JSON.stringify(new URL(p,main).href));
// Proposed canonical-purpose mapping: policy uses a hyphen, quota uses '_'.
// This isolated copy must charge the promised heavy-operation rate.
if(!mainMode){
 assert(source.includes('const units=creditUnits(purpose)'));
 source=source.replace('const units=creditUnits(purpose)',"const units=creditUnits(purpose==='note-analysis'?'note_analysis':purpose)");
}
source='import {capturedNote} from '+JSON.stringify(new URL('./note-context.mjs',import.meta.url).href)+';\nimport {noteContent} from '+JSON.stringify(new URL('./note-content.mjs',import.meta.url).href)+';\n'+source+'\n'+await readFile(new URL('./service-export.txt',import.meta.url),'utf8');
const {serveNoteAnalysis}=await import(mainMode?main.href:'data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const db=new D1SQLite(),now=Date.now(),owner='synthetic-owner';
const env={AUTH_DB:db,SUBSCRIPTION_PREVIEW:'1',PREVIEW_PLAN_ACCOUNTS:'1',PLAN_CREDITS_V2:'1',OPENAI_ENABLED:'1',OPENAI_TRIAL_ONLY:'1',OPENAI_SAFETY_READY:'1',OPENAI_TERMS_READY:'1',OPENAI_BILLING_READY:'1',OPENAI_API_KEY:'synthetic-only',OPENAI_MONTHLY_LIMIT_YEN:'800'};
let calls=0;
const options={owner,now,requestId:'analysis_fixture',fetcher:async(url,opts)=>{
 calls++;if(url.endsWith('moderations'))return Response.json({results:[{flagged:false}]});
 const body=JSON.parse(opts.body);eq(body.model,'gpt-6.1-sol');eq(Object.hasOwn(body,'tools'),false);
 eq(JSON.parse(body.input).note.text,note.text);
 return Response.json({status:'completed',model:body.model,output:[{type:'message',role:'assistant',content:[{type:'output_text',text:JSON.stringify(value)}]}],usage:{input_tokens:100,output_tokens:100}});
}};
const selection={noteId:note.id,revision:1};
try{
 for(const uid of ['p_pro','p_standard','p_unlimit']){db.seed('active-session:'+uid,owner,now+60000);db.seed('openai-access:'+uid,JSON.stringify({version:'2026-10-14',ageBand:'13-17',guardianConsent:true,approved:true}));db.seed('learning-note:'+uid+':'+note.id,JSON.stringify(note));}
 const jobResponse=await noteJobRoute(new Request('https://fixture.test/learning-note-analysis-job',{method:'POST',headers:{Origin:'https://fixture.test','Content-Type':'application/json'},body:JSON.stringify({id:options.requestId,...selection})}),{...env,APP_ORIGIN:'https://fixture.test'},{uid:'p_pro'},options);eq(jobResponse.status,200);
 eq((await serveNoteAnalysis(env,{uid:'p_standard'},selection,options)).error,'plan_required');eq(calls,0);eq(db.keys().some(k=>k.startsWith('openai-note-context:')),false);
 const r=await serveNoteAnalysis(env,{uid:'p_pro'},selection,options);eq(r.real,true);eq(r.value,value);eq(calls,3);
 const after=await planStatus(env,'p_pro',now);eq(after.creditsVersion,'daily-v2');eq(after.dailyUsed,3);
 eq(JSON.parse(await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind('learning-note:p_pro:'+note.id).first('v')),note);
 db.seed('learning-note:p_pro:'+note.id,JSON.stringify({...note,revision:2,text:'後から更新した原稿'}));
 eq((await serveNoteAnalysis(env,{uid:'p_pro'},selection,options)).cached,true);eq(calls,3);eq((await planStatus(env,'p_pro',now)).dailyUsed,3);
 eq((await capturedNote(db,'p_pro',options.requestId,selection)).text,note.text);
 await rejects(()=>capturedNote(db,'p_pro',options.requestId,{...selection,revision:2}));
 await rejects(()=>capturedNote(db,'p_pro','other_request',selection));
 await rejects(()=>capturedNote(db,'p_unlimit','owner_isolation',{noteId:'note_missing',revision:1}));
 await rejects(()=>capturedNote(db,'p_pro','bad_selection',{...selection,uid:'p_unlimit'}));
 eq((await serveNoteAnalysis(env,{uid:'p_pro'},selection,{...options,owner:'different-owner'})).error,'session_changed');eq(calls,3);
 eq((await serveNoteAnalysis({...env,OPENAI_BILLING_READY:'0'},{uid:'p_pro'},selection,options)).error,'provider_not_ready');eq(calls,3);
 const routeEnv={...env,APP_ORIGIN:'https://fixture.test'};
 const call=(uid,body,extra={})=>noteAnalysisRoute(new Request('https://fixture.test/learning-note-analysis',{method:'POST',headers:{Origin:extra.origin||routeEnv.APP_ORIGIN,'Content-Type':extra.type||'application/json'},body:JSON.stringify(body)}),routeEnv,{uid},{...options,serve:serveNoteAnalysis,...extra});
 const body={id:options.requestId,...selection};
 let response=await call('p_pro',body);eq(response.status,200);eq((await response.json()).creditsUsed,0);eq(calls,3);
 response=await call('p_pro',{...body,text:'client-selected note'});eq(response.status,400);eq(calls,3);
 response=await call('p_pro',body,{origin:'https://wrong.test'});eq(response.status,403);eq(calls,3);
 response=await call('p_standard',body);eq(response.status,403);eq(calls,3);
 response=await call('p_pro',body,{owner:'other-owner'});eq(response.status,409);eq(calls,3);
 response=await call('p_pro',{...body,id:'unconfigured_request'},{serve:undefined});eq(response.status,503);eq(calls,3);
 response=await call('p_pro',body,{type:'text/plain'});eq(response.status,415);eq(calls,3);
 response=await call('p_pro',{...body,revision:0});eq(response.status,400);eq(calls,3);
 response=await call('p_pro',{...body,noteId:12345678});eq(response.status,400);eq(calls,3);
 const get=(uid,id,extraEnv={})=>noteAnalysisRoute(new Request('https://fixture.test/learning-note-analysis?id='+encodeURIComponent(id)),{...routeEnv,...extraEnv},{uid},{...options});
 response=await get('p_pro',body.id,{OPENAI_ENABLED:'0'});eq(response.status,200);eq((await response.json()).item.analysis,value);eq(calls,3);
 response=await get('p_unlimit',body.id);eq(response.status,404);eq(calls,3);
 response=await get('p_standard',body.id);eq(response.status,403);eq(calls,3);
 db.seed('plan:p_pro',JSON.stringify({plan:'free',start:now-1000,end:null,revision:2,next:null}));
 response=await get('p_pro',body.id);eq(response.status,403);
 db.seed('plan:p_pro',JSON.stringify({plan:'pro',start:now-1000,end:null,revision:3,next:null}));
 response=await get('p_pro',body.id);eq(response.status,200);eq((await response.json()).item.analysis,value);eq(calls,3);
}finally{db.close();}
console.log(`Note analysis candidate: ${n} checks passed; exact source quotes, own saved revision, shared gates/3 credits, immutable replay, fake HTTP only`);
