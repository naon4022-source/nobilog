import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {deflateSync} from 'node:zlib';
const {avatarRoute}=await import(process.argv.includes('--main')?new URL('../../../cf-worker/src/openai-avatar-route.mjs',import.meta.url):new URL('./route.mjs',import.meta.url));
import {canonicalImage} from '../../../cf-worker/src/learning-images.mjs';
import {planStatus} from '../../../cf-worker/src/plans.mjs';
import {monthKey} from '../../../cf-worker/src/openai-budget.mjs';
const {D1SQLite}=createRequire(import.meta.url)('../../../.claude/verify/d1-sqlite.js');
let checks=0;const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
const db=new D1SQLite(),now=Date.now(),owner='synthetic-owner',origin='https://fixture.test',uid='p_unlimit';
const env={AUTH_DB:db,APP_ORIGIN:origin,SUBSCRIPTION_PREVIEW:'1',PREVIEW_PLAN_ACCOUNTS:'1',PLAN_CREDITS_V2:'1',OPENAI_ENABLED:'1',OPENAI_TRIAL_ONLY:'1',OPENAI_SAFETY_READY:'1',OPENAI_TERMS_READY:'1',OPENAI_BILLING_READY:'1',OPENAI_AVATAR_READY:'1',OPENAI_MONTHLY_LIMIT_YEN:'800',OPENAI_API_KEY:'synthetic-only'};
const rawImage=await canonicalImage({width:1024,height:1024,data:deflateSync(Buffer.alloc(1024*1024*4,255)).toString('base64')});
const image=await canonicalImage({width:384,height:384,data:deflateSync(Buffer.alloc(384*384*4,255)).toString('base64')});
let calls=0;const options={owner,now,fetcher:async url=>{calls++;return Response.json(url.endsWith('moderations')?{results:[{flagged:false}]}:{data:[{b64_json:rawImage.png}]});}};
const approval={version:'2026-10-14',ageBand:'13-17',guardianConsent:true,approved:true};
for(const user of ['u1','p_free','p_mini','p_standard','p_pro','p_unlimit']){db.seed('active-session:'+user,owner,now+120000);db.seed('openai-access:'+user,JSON.stringify(approval));}
async function call(path='/avatar-generations',method='GET',body,over={}){
 const response=await avatarRoute(new Request(origin+path,{method,headers:{Origin:over.origin||origin,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})}),over.env||env,{uid:over.uid||uid},{...options,...over});return {status:response.status,data:await response.json(),cache:response.headers.get('Cache-Control')};
}
try{
 let r=await call();eq(r.status,200);eq(r.data.ready,true);eq(r.data.items,[]);eq(r.data.credits,3);eq(calls,0);eq(r.cache,'private, no-store');
 for(const user of ['p_free','p_mini','p_standard','p_pro'])eq((await call('/avatar-generations','GET',undefined,{uid:user})).status,403);
 eq((await call('/avatar-generations','GET',undefined,{owner:'other-device'})).status,409);
 eq((await call('/avatar-generations?uid=u1')).status,400);eq((await call('/avatar-generations','POST',{})).status,405);
 eq((await call('/avatar-generate','GET')).status,405);
 const request={id:'11111111-1111-4111-8111-111111111111',intro:'青と猫が好きです。'};
 eq((await call('/avatar-generate','POST',request,{origin:'https://outside.invalid'})).status,403);eq(calls,0);
 r=await call('/avatar-generate','POST',{...request,intro:'x'.repeat(4500)});eq(r.status,400);eq(calls,0);
 r=await call('/avatar-generate','POST',request);eq(r.status,200);eq(r.data.creditsUsed,3);eq(calls,3);
 r=await call();eq(r.data.items.length,1);eq(r.data.items[0].state,'done');eq(r.data.items[0].src,'/learning-image?id='+image.id);eq(r.data.dailyLeft,4997);eq(r.data.trialLeft,9);eq(calls,3);
 eq(JSON.stringify(r.data).includes(request.intro),false);eq(JSON.stringify(r.data).includes('synthetic-only'),false);
 eq((await call('/avatar-generations','GET',undefined,{uid:'u1'})).data.items,[]);
 eq((await call('/avatar-generate','POST',request)).data.cached,true);eq(calls,3);
 const plan=JSON.parse(db.get('plan:'+uid).v);db.seed('plan:'+uid,JSON.stringify({...plan,plan:'pro',revision:2}));eq((await call()).status,403);db.seed('plan:'+uid,JSON.stringify({...plan,revision:3}));eq((await call()).data.items.length,1);
 r=await call('/avatar-generations','GET',undefined,{env:{...env,OPENAI_AVATAR_READY:'0'}});eq(r.data.ready,false);eq(r.data.reason,'generator_setup');eq(r.data.items.length,1);
 db.seed('openai-access:'+uid,JSON.stringify({...approval,approved:false}));r=await call();eq(r.data.ready,false);eq(r.data.reason,'consent_required');eq(r.data.items.length,1);db.seed('openai-access:'+uid,JSON.stringify(approval));
 db.seed(monthKey(now),'invalid');r=await call();eq(r.data.ready,false);eq(r.data.reason,'controls_unavailable');db.seed(monthKey(now),'799000000');r=await call();eq(r.data.ready,false);eq(r.data.reason,'budget_limit');db.seed(monthKey(now),'50000000');
 const st=await planStatus(env,uid,now);db.seed(st.quotaKey,JSON.stringify({version:2,units:9996,calls:2}));r=await call();eq(r.data.ready,false);eq(r.data.reason,'plan_limit');eq(r.data.dailyLeft,2);
 db.seed('openai-operation:'+uid+':22222222-2222-4222-8222-222222222222',JSON.stringify({kind:'avatar',imageModel:'gpt-image-2.5-sunburst',state:'rejected',at:now-1}));r=await call();eq(r.status,200);eq(r.data.items.find(x=>x.id.startsWith('2222')).state,'not_sent');eq(r.data.items.length,2);
 eq(calls,3);
}finally{db.close();}
console.log('Avatar route candidate: '+checks+' SQLite/API checks passed; private metadata/history, explicit POST only, own results, replay, downgrade/rejoin, origin/size/session/consent/budget/daily gates; no live API');
