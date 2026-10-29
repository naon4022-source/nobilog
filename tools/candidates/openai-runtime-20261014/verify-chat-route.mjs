import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {openaiChatRoute} from './openai-chat-route.mjs';
import {planStatus} from '../../../cf-worker/src/plans.mjs';
const {D1SQLite}=createRequire(import.meta.url)('../../../.claude/verify/d1-sqlite.js');
const db=new D1SQLite(),now=Date.now(),origin='https://fixture.test';
const env={AUTH_DB:db,APP_ORIGIN:origin,SUBSCRIPTION_PREVIEW:'1',PREVIEW_PLAN_ACCOUNTS:'1',OPENAI_ENABLED:'1',OPENAI_TRIAL_ONLY:'1',OPENAI_SAFETY_READY:'1',OPENAI_TERMS_READY:'1',OPENAI_BILLING_READY:'1',OPENAI_API_KEY:'synthetic-only',OPENAI_MONTHLY_LIMIT_YEN:'800'};
for(const uid of ['p_standard','p_pro','p_unlimit']){db.seed('active-session:'+uid,'test-owner',now+60000);db.seed('openai-access:'+uid,JSON.stringify({version:'2026-10-14',ageBand:'13-17',guardianConsent:true,approved:true}));}
let n=0,calls=0;const eq=(a,b)=>{assert.deepEqual(a,b);n++;};
const fetcher=async(url,opts)=>{calls++;if(url.endsWith('moderations'))return Response.json({results:[{flagged:false}]});return Response.json({status:'completed',model:JSON.parse(opts.body).model,output:[{type:'message',role:'assistant',content:[{type:'output_text',text:'{"answer":"Synthetic answer."}'}]}],usage:{input_tokens:100,output_tokens:20}});};
async function call(uid,{method='POST',body={id:'request_1',text:'Explain negative numbers.'},requestOrigin=origin,path='/learning-chat',owner='test-owner',contentType='application/json'}={}){
 const r=await openaiChatRoute(new Request(origin+path,{method,headers:{Origin:requestOrigin,'Content-Type':contentType},...(method==='GET'?{}:{body:JSON.stringify(body)})}),env,{uid},{owner,fetcher,now});return {status:r.status,json:await r.json()};
}
try{
 eq((await call('p_standard')).status,403);eq((await call('p_pro',{requestOrigin:'https://other.test'})).status,403);
 eq((await call('p_pro',{contentType:'text/plain'})).status,415);eq((await call('p_pro',{owner:'other'})).status,409);
 eq((await call('p_pro',{body:{id:'request_1',text:'Question',model:'gpt-6.1-sol'}})).status,400);eq(calls,0);
 eq((await call('p_pro',{body:{id:12345678,text:'Question'}})).status,400);eq(calls,0);
 let r=await call('p_pro');eq(r.status,200);eq(r.json.item.mock,false);eq(r.json.item.real,true);eq(r.json.item.model,'gpt-6-luna');eq(calls,3);
 eq((await call('p_pro')).json.cached,true);eq(calls,3);eq((await planStatus(env,'p_pro',now)).aiUsed,1);
 eq((await call('p_pro',{method:'GET'})).json.items.length,1);eq((await call('p_unlimit',{method:'GET'})).json.items.length,0);
 eq((await call('p_pro',{body:{id:'request_1',text:'Different content'}})).status,409);eq(calls,3);
 const prepare=db.prepare.bind(db);let lose=true;
 db.prepare=sql=>{const s=prepare(sql);if(sql.startsWith('INSERT INTO auth_kv(k,v,expires_at) SELECT ?,?,? WHERE EXISTS')){const bind=s.bind.bind(s);s.bind=(...args)=>{const b=bind(...args),first=b.first.bind(b);b.first=async(...a)=>{const result=await first(...a);if(lose){lose=false;throw Error('Synthetic lost transcript save reply');}return result;};return b;};}return s;};
 r=await call('p_pro',{body:{id:'request_2',text:'Another learning question.'}});eq(r.status,503);eq(calls,6);
 r=await call('p_pro',{body:{id:'request_2',text:'Another learning question.'}});eq(r.status,200);eq(r.json.cached,true);eq(calls,6);eq((await planStatus(env,'p_pro',now)).aiUsed,2);
 eq((await call('p_pro',{method:'GET'})).json.items.length,2);
}finally{db.close();}
console.log(`OpenAI chat API candidate: ${n} isolated checks passed; Origin/body/plan/owner gates, real labels, saved-history loss/replay, fake API only`);
