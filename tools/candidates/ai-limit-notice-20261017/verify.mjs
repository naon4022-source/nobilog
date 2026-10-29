import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const main=process.argv.includes('--main');
const {avatarRoute}=await import(main?'../../../cf-worker/src/openai-avatar-route.mjs':'./avatar-route.mjs');
const {D1SQLite}=createRequire(import.meta.url)('../../../.claude/verify/d1-sqlite.js');
const {serveNoteAnalysis}=await import(main?'../../../cf-worker/src/openai-tutor-service.mjs':'./tutor-service.mjs');
const {runRealAITrial,runAvatarAITrial}=await import(main?'../../../cf-worker/src/ai-trial-control.mjs':'./trial-control.mjs');
let checks=0;const eq=(a,b)=>{assert.deepEqual(a===undefined?a:JSON.parse(JSON.stringify(a)),b===undefined?b:JSON.parse(JSON.stringify(b)));checks++;};
const status={limit:10,used:10,stopped:false,date:'2026-10-17'};
const api=await readFile(new URL(main?'../../../site-assets/note-analysis-api.js':'./note-api.js',import.meta.url),'utf8');
for(const mode of ['status','denied_status','success','failure','late_owner','no_notice']){
 let live=true;const notices=[],ctx={NobiAITrialNotice:{show:s=>{if(s)notices.push(s);}}};vm.createContext(ctx);vm.runInContext(api,ctx);
 const adapter=ctx.NobiNoteAnalysisAPI.create({same:()=>live,saved:()=>({id:'note_fixture'}),allowed:()=>mode!=='denied_status',request:async path=>({status:mode==='failure'?429:200,ok:mode!=='failure',json:async()=>{if(mode==='late_owner')live=false;return mode==='no_notice'||path==='/plan'?{}:{trial:status};}})});
 if(mode==='status'||mode==='denied_status'){await adapter.status();eq(notices,mode==='status'?[status]:[]);}
 else if(['failure','late_owner'].includes(mode)){await assert.rejects(()=>adapter.analyze({id:'request_fixture',noteId:'note_fixture',revision:1}));checks++;eq(notices,mode==='failure'?[status]:[]);}
 else{await adapter.analyze({id:'request_fixture',noteId:'note_fixture',revision:1});eq(notices,mode==='success'?[status]:[]);}
}
let photo;
if(main){const index=await readFile(new URL('../../../index.html',import.meta.url),'utf8'),start=index.indexOf('    const photoApi=who=>({'),end=index.indexOf('    function avatarApply()',start);assert(start>=0&&end>start);photo=index.slice(start,end);}
else photo=await readFile(new URL('./photo-api.js',import.meta.url),'utf8');
for(const operation of ['get','post'])for(const mode of ['success','failure','late_owner','ordinary']){
 let live=true,calls=0;const notices=[];
 const request=async()=>{calls++;return {ok:mode!=='failure',status:mode==='failure'?429:200,json:async()=>{if(mode==='late_owner')live=false;return {trial:status};}};};
 const ctx={crypto:{randomUUID:()=> 'synthetic-id'},cloudSame:()=>live,cloudUrl:p=>p,cloudTry:request,cloudFetch:request,planKnown:{uid:'p_unlimit',plan:'unlimit'},avatarRefresh(){},NobiAITrialNotice:{show:s=>{if(s)notices.push(s);}}};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(photo+'\nglobalThis.make=photoApi;',ctx);
 const p=ctx.make({uid:'p_unlimit',token:'synthetic-only'}),path=mode==='ordinary'?'/photos':operation==='get'?'/avatar-generations':'/avatar-generate';
 const action=()=>operation==='get'?p.get(path):p.post(path,{id:'request_fixture'});
 if(mode==='late_owner'||operation==='get'&&mode==='failure'){await assert.rejects(action);checks++;eq(notices,[]);}
 else{await action();eq(notices,mode==='ordinary'?[]:[status]);}
 eq(calls,1);
}
const db=new D1SQLite(),now=Date.UTC(2026,9,17,5),uid='p_unlimit',owner='synthetic-owner',origin='https://synthetic.invalid';
try{
 db.seed('active-session:'+uid,owner,now+600000);db.seed('openai-access:'+uid,JSON.stringify({version:'2026-10-14',ageBand:'13-17',approved:true,guardianConsent:true}));db.seed('ai-trial:day:2026-10-17','10');
 const env={AUTH_DB:db,APP_ORIGIN:origin,SUBSCRIPTION_PREVIEW:'1',PREVIEW_PLAN_ACCOUNTS:'1',PLAN_CREDITS_V2:'1',OPENAI_ENABLED:'1',OPENAI_TRIAL_ONLY:'1',OPENAI_SAFETY_READY:'1',OPENAI_TERMS_READY:'1',OPENAI_BILLING_READY:'1',OPENAI_AVATAR_READY:'1',OPENAI_MONTHLY_LIMIT_YEN:'800',OPENAI_API_KEY:'synthetic-only'};let calls=0;
 const options={owner,now,fetcher:async()=>{calls++;throw Error('must never call provider');}};
 let r=await avatarRoute(new Request(origin+'/avatar-generations'),env,{uid},options),body=await r.json();eq(r.status,200);eq(body.trial,status);eq(body.ready,false);eq(body.trialLeft,0);eq(calls,0);
 r=await avatarRoute(new Request(origin+'/avatar-generate',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({id:crypto.randomUUID(),intro:'落ち着いた雰囲気の動物が好きです。'})}),env,{uid},options);body=await r.json();eq(r.status,429);eq(body.error,'ai_trial_daily');eq(body.trial,status);eq(calls,0);eq(db.get('ai-trial:day:2026-10-17').v,'10');
}finally{db.close();}
// The safety stop must reach the same notice adapter even with credits left.
for(const failureValue of ['3','corrupted']){
 const db=new D1SQLite(),now=Date.UTC(2026,9,17,5),uid='p_unlimit',owner='synthetic-owner',origin='https://synthetic.invalid';
 try{
  db.seed('active-session:'+uid,owner,now+600000);db.seed('openai-access:'+uid,JSON.stringify({version:'2026-10-14',ageBand:'13-17',approved:true,guardianConsent:true}));
  db.seed('ai-trial:day:2026-10-17','2');db.seed('ai-trial:failures',failureValue);
  const env={AUTH_DB:db,APP_ORIGIN:origin,SUBSCRIPTION_PREVIEW:'1',PREVIEW_PLAN_ACCOUNTS:'1',PLAN_CREDITS_V2:'1',OPENAI_ENABLED:'1',OPENAI_TRIAL_ONLY:'1',OPENAI_SAFETY_READY:'1',OPENAI_TERMS_READY:'1',OPENAI_BILLING_READY:'1',OPENAI_AVATAR_READY:'1',OPENAI_MONTHLY_LIMIT_YEN:'800',OPENAI_API_KEY:'synthetic-only'};let calls=0;
  const options={owner,now,fetcher:async()=>{calls++;throw Error('must never call provider');}};
  const expected={limit:10,used:2,stopped:true,date:'2026-10-17'};
  let r=await avatarRoute(new Request(origin+'/avatar-generations'),env,{uid},options),body=await r.json();eq(r.status,200);eq(body.trial,expected);eq(body.ready,false);eq(calls,0);
  r=await avatarRoute(new Request(origin+'/avatar-generate',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({id:crypto.randomUUID(),intro:'落ち着いた雰囲気の動物が好きです。'})}),env,{uid},options);body=await r.json();eq(r.status,503);eq(body.error,'ai_stopped');eq(body.trial,expected);eq(calls,0);eq(db.get('ai-trial:day:2026-10-17').v,'2');eq(db.get('ai-trial:failures').v,failureValue);
 }finally{db.close();}
}
for(const failureValue of ['3','corrupted']){
 const db=new D1SQLite(),now=Date.UTC(2026,9,17,5),uid='p_pro',owner='synthetic-owner';
 try{
  db.seed('active-session:'+uid,owner,now+600000);db.seed('openai-access:'+uid,JSON.stringify({version:'2026-10-14',ageBand:'13-17',approved:true,guardianConsent:true}));db.seed('ai-trial:day:2026-10-17','2');db.seed('ai-trial:failures',failureValue);
  const env={AUTH_DB:db,SUBSCRIPTION_PREVIEW:'1',PREVIEW_PLAN_ACCOUNTS:'1',PLAN_CREDITS_V2:'1',OPENAI_ENABLED:'1',OPENAI_TRIAL_ONLY:'1',OPENAI_SAFETY_READY:'1',OPENAI_TERMS_READY:'1',OPENAI_BILLING_READY:'1',OPENAI_API_KEY:'synthetic-only',OPENAI_MONTHLY_LIMIT_YEN:'800'};let calls=0;
  const result=await serveNoteAnalysis(env,{uid},{noteId:'note_fixture',revision:1},{owner,now,requestId:'request_fixture',fetcher:async()=>{calls++;throw Error('must never call');}});
  eq(result.error,'ai_stopped');eq(result.trial,{limit:10,used:2,stopped:true,date:'2026-10-17'});eq(calls,0);eq(db.keys().some(k=>k.startsWith('openai-note-context:')),false);eq(db.get('ai-trial:day:2026-10-17').v,'2');
  for(const run of [runRealAITrial,runAvatarAITrial]){const r=await run(db,async()=>{calls++;return {ok:true};},now);eq(r.error,'ai_stopped');eq(r.trial.stopped,true);eq(calls,0);}
 }finally{db.close();}
}
// A concurrent circuit stop between initial status and lease acquisition is
// reported with current counters and never reaches the provider.
for(const run of [runRealAITrial,runAvatarAITrial]){
 const db=new D1SQLite(),now=Date.UTC(2026,9,17,5);let calls=0;
 try{
  db.seed('ai-trial:day:2026-10-17','2');
  const prepare=db.prepare.bind(db);
  db.prepare=sql=>{
   const statement=prepare(sql);
   if(sql.includes('INSERT INTO auth_kv')&&sql.includes('WHERE auth_kv.expires_at<=?')){
    const bind=statement.bind;
    statement.bind=(...args)=>{const bound=bind(...args),first=bound.first;bound.first=async column=>{const value=await first.call(bound,column);db.seed('ai-trial:failures','3');return value;};return bound;};
   }
   return statement;
  };
  const r=await run(db,async()=>{calls++;return {ok:true};},now);
  eq(r.error,'ai_stopped');eq(r.trial,{limit:10,used:2,stopped:true,date:'2026-10-17'});eq(calls,0);eq(db.get('ai-trial:day:2026-10-17').v,'2');eq(db.get('ai-trial:lease'),null);
 }finally{db.close();}
}
console.log('AI limit notice: '+checks+' checks passed; note API and exact photo adapter, success/error/status, one authorized POST, delayed owner change, avatar GET/429/stop forwards shared cap without provider calls; synthetic only');
