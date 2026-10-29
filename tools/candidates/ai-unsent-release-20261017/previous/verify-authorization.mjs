import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {planStatus} from '../../../cf-worker/src/plans.mjs';
const mainMode=process.argv.includes('--main'),main=new URL('../../../cf-worker/src/openai-tutor-service.mjs',import.meta.url);
let source=await readFile(main,'utf8');
if(!mainMode)for(const patch of JSON.parse(await readFile(new URL('./service-authorization-patches.json',import.meta.url),'utf8'))){assert.equal(source.split(patch.old).length-1,patch.count);source=source.split(patch.old).join(patch.new);}
source=source.replace(/from '(\.\/[^']+)'/g,(_,p)=>'from '+JSON.stringify(new URL(p,main).href));
source=source.replace('const units=creditUnits(purpose)',"const units=creditUnits(purpose==='note-analysis'?'note_analysis':purpose)");
source='import {capturedNote} from '+JSON.stringify(new URL('./note-context.mjs',import.meta.url).href)+';\nimport {noteContent} from '+JSON.stringify(new URL('./note-content.mjs',import.meta.url).href)+';\n'+source+'\n'+await readFile(new URL('./service-export.txt',import.meta.url),'utf8');
const {serveNoteAnalysis}=await import(mainMode?main.href:'data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const {D1SQLite}=createRequire(import.meta.url)('../../../.claude/verify/d1-sqlite.js');
let n=0;const eq=(a,b)=>{assert.deepEqual(a,b);n++;};
const note={id:'note_fixture',revision:1,title:'数直線',text:'右ほど大きい。',images:[]},value={summary:'向きを確認します。',strengths:[],checks:[],practice:[]};
for(const scenario of ['consent-before-generation','plan-before-generation','revision-before-generation','lease-before-generation','consent-before-output-check','plan-after-output-check']){
 const db=new D1SQLite(),now=Date.now(),owner='synthetic-owner',uid='p_pro';let calls=0;
 const env={AUTH_DB:db,SUBSCRIPTION_PREVIEW:'1',PREVIEW_PLAN_ACCOUNTS:'1',PLAN_CREDITS_V2:'1',OPENAI_ENABLED:'1',OPENAI_TRIAL_ONLY:'1',OPENAI_SAFETY_READY:'1',OPENAI_TERMS_READY:'1',OPENAI_BILLING_READY:'1',OPENAI_API_KEY:'synthetic-only',OPENAI_MONTHLY_LIMIT_YEN:'800'};
 db.seed('active-session:'+uid,owner,now+60000);db.seed('openai-access:'+uid,JSON.stringify({version:'2026-10-14',ageBand:'13-17',guardianConsent:true,approved:true}));db.seed('learning-note:'+uid+':'+note.id,JSON.stringify(note));
 const revoke=()=>{
  if(scenario.startsWith('consent'))db.seed('openai-access:'+uid,JSON.stringify({version:'2026-10-14',ageBand:'13-17',guardianConsent:false,approved:false}));
  else if(scenario.startsWith('lease'))db.seed('active-session:'+uid,'different-owner',now+60000);
  else db.seed('plan:'+uid,JSON.stringify({plan:scenario.startsWith('revision')?'pro':'free',start:now-1000,end:null,revision:2,next:null}));
 };
 const stage=scenario.endsWith('before-output-check')?2:scenario.endsWith('after-output-check')?3:1;
 const options={owner,now,requestId:'request_authorization',fetcher:async(url,opts)=>{
  calls++;if(calls===stage)revoke();
  if(url.endsWith('moderations'))return Response.json({results:[{flagged:false}]});
  return Response.json({status:'completed',model:JSON.parse(opts.body).model,output:[{type:'message',role:'assistant',content:[{type:'output_text',text:JSON.stringify(value)}]}],usage:{input_tokens:100,output_tokens:50}});
 }};
 try{
  const result=await serveNoteAnalysis(env,{uid},{noteId:note.id,revision:1},options);
  eq(typeof result.error,'string');eq(Object.hasOwn(result,'value'),false);eq(calls,stage);
  const before=calls;await serveNoteAnalysis(env,{uid},{noteId:note.id,revision:1},options);eq(calls,before);
  eq((await planStatus(env,uid,now)).dailyUsed,0);
  eq(JSON.parse(await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind('learning-note:'+uid+':'+note.id).first('v')),note);
 }finally{db.close();}
}
console.log('Text AI authorization: '+n+' checks passed; consent/plan/revision/owner rechecked before each provider step and before result, no live API');
