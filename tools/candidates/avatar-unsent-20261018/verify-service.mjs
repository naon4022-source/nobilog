import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {monthKey} from '../../../cf-worker/src/openai-budget.mjs';
import {planStatus} from '../../../cf-worker/src/plans.mjs';
const main=new URL('../../../cf-worker/src/openai-avatar-service.mjs',import.meta.url);
let source=await readFile(main,'utf8');
source=source.replace("'./openai-avatar-transport.mjs'",JSON.stringify(new URL('./transport.mjs',import.meta.url).href));
source=source.replace(/from '(\.\/[^']+)'/g,(_,p)=>'from '+JSON.stringify(new URL(p,main).href));
const {serveAvatar}=await import(process.argv.includes('--main')?main.href:'data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const {D1SQLite}=createRequire(import.meta.url)('../../../.claude/verify/d1-sqlite.js');
let n=0;const eq=(a,b)=>{assert.deepEqual(a,b);n++;};
for(const stopAt of [2,3,4,5,6]){
 const db=new D1SQLite(),uid='p_unlimit',owner='synthetic-owner',now=Date.now(),id='11111111-1111-4111-8111-111111111111';
 const env={AUTH_DB:db,SUBSCRIPTION_PREVIEW:'1',PREVIEW_PLAN_ACCOUNTS:'1',PLAN_CREDITS_V2:'1',OPENAI_ENABLED:'1',OPENAI_TRIAL_ONLY:'1',OPENAI_SAFETY_READY:'1',OPENAI_TERMS_READY:'1',OPENAI_BILLING_READY:'1',OPENAI_AVATAR_READY:'1',OPENAI_API_KEY:'synthetic-only',OPENAI_MONTHLY_LIMIT_YEN:'800'};
 db.seed('active-session:'+uid,owner,now+60000);db.seed('openai-access:'+uid,JSON.stringify({version:'2026-10-14',ageBand:'13-17',guardianConsent:true,approved:true}));
 let reads=0,calls=[];const prepare=db.prepare.bind(db);
 db.prepare=sql=>{const statement=prepare(sql);if(!sql.startsWith('SELECT 1 x FROM auth_kv WHERE k=? AND v=? AND expires_at>?'))return statement;
  const bind=statement.bind.bind(statement);statement.bind=(...values)=>{const bound=bind(...values),first=bound.first.bind(bound);bound.first=async(...args)=>{if(++reads===stopAt)db.seed('active-session:'+uid,'synthetic-new-device',now+60000);return first(...args);};return bound;};return statement;};
 try{
  const result=await serveAvatar(env,{uid},{id,intro:'青い猫と本'},{owner,now,fetcher:async url=>{calls.push(url);return Response.json({results:[{flagged:false}]});}});
  eq(result.error,'session_changed');eq(calls.filter(x=>x.endsWith('/generations')).length,0);
  eq(JSON.parse(db.get('openai-operation:'+uid+':'+id).v).state,'rejected');
  eq(Number(db.get(monthKey(now)).v),0);eq((await planStatus(env,uid,now)).dailyUsed,0);
 }finally{db.close();}
}
console.log('Avatar unsent service: '+n+' SQLite checks passed; session loss at five post-start/pre-generation gates releases monthly hold and plan credits; no network');
