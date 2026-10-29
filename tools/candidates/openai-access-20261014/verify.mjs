import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {registerPreviewApproval} from './access.mjs';
const {D1SQLite}=createRequire(import.meta.url)('../../../.claude/verify/d1-sqlite.js');
const db=new D1SQLite();let n=0;const eq=(a,b)=>{assert.deepEqual(a,b);n++;};
const env={AUTH_DB:db,APP_ORIGIN:'https://nobilog-preview.naon4022.workers.dev',SUBSCRIPTION_PREVIEW:'1',PREVIEW_PLAN_ACCOUNTS:'1',OPENAI_ENABLED:'0',GEMINI_ENABLED:'0'},yes={ageBand:'13-17',guardianConsent:true,minimumAgeConfirmed:true};
const run=(uid='u1',a=yes,e=env,options={operatorConfirmed:true})=>registerPreviewApproval(e,uid,a,options);
try{
 eq(await run(),{ok:true,created:true});eq(await run(),{ok:true,created:false});
 eq(await run('u1',{...yes,ageBand:'adult'}),{error:'approval_conflict'});
 const raced=await Promise.all(Array.from({length:8},()=>run('u2')));eq(raced.filter(x=>x.created).length,1);eq(raced.every(x=>x.ok),true);
 for(const patch of [{guardianConsent:false},{minimumAgeConfirmed:false},{ageBand:'under13'},{extra:'learner-controlled'}]){
  const before=db.keys().length;eq((await run('p_pro',{...yes,...patch})).error,'consent_required');eq(db.keys().length,before);
 }
 for(const patch of [{APP_ORIGIN:'https://nobilog.pages.dev'},{OPENAI_ENABLED:'1'},{GEMINI_ENABLED:'1'},{SUBSCRIPTION_PREVIEW:'0'}]){
  eq((await run('p_pro',yes,{...env,...patch})).error,'approval_not_authorized');
 }
 eq((await run('p_pro',yes,env,{})).error,'approval_not_authorized');eq((await run('wrong-user')).error,'approval_not_authorized');
 db.seed('openai-access:p_pro',JSON.stringify({approved:false,version:'2026-10-14'}));eq((await run('p_pro')).error,'approval_conflict');
 const bad={...env,AUTH_DB:{prepare(){throw Error('SECRET_STORAGE_DETAIL');}}};eq(await run('p_unlimit',yes,bad),{error:'approval_save_unconfirmed'});
 console.log(`AI access registration candidate: ${n} checks passed; confirmed age/guardian, preview-only/off-only, idempotence, conflict preservation, concurrency, no content readback`);
}finally{db.close();}
