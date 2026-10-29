import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {serveImageChat} from '../../../cf-worker/src/openai-image-service.mjs';
import {canonicalImage} from '../../../cf-worker/src/learning-images.mjs';
import {creditStatus} from '../../../cf-worker/src/subscription-credits.mjs';
import {trialStatus} from '../../../cf-worker/src/ai-trial-control.mjs';
import {monthKey} from '../../../cf-worker/src/openai-budget.mjs';
const {D1SQLite}=createRequire(import.meta.url)('../../../.claude/verify/d1-sqlite.js');
let n=0;const eq=(a,b)=>{assert.deepEqual(a,b);n++;},now=Date.parse('2026-10-16T03:00:00Z');
const pictures=[];
for(const red of [10,20,30]){const stream=new Blob([new Uint8Array([red,0,0,255])]).stream().pipeThrough(new CompressionStream('deflate'));pictures.push(await canonicalImage({width:1,height:1,data:Buffer.from(await new Response(stream).arrayBuffer()).toString('base64')}));}
function fixture(){
 const db=new D1SQLite(),env={AUTH_DB:db,APP_ORIGIN:'https://fixture.test',SUBSCRIPTION_PREVIEW:'1',PREVIEW_PLAN_ACCOUNTS:'1',PLAN_CREDITS_V2:'1',OPENAI_ENABLED:'1',OPENAI_TRIAL_ONLY:'1',OPENAI_SAFETY_READY:'1',OPENAI_TERMS_READY:'1',OPENAI_BILLING_READY:'1',OPENAI_API_KEY:'synthetic-only',OPENAI_MONTHLY_LIMIT_YEN:'800'};
 const calls=[];
 for(const uid of ['p_pro','p_unlimit','p_standard']){
  db.seed('active-session:'+uid,'fixture-owner',now+86400000);db.seed('openai-access:'+uid,JSON.stringify({version:'2026-10-14',ageBand:'13-17',guardianConsent:true,approved:true}));
  for(const image of pictures)db.seed('learning-image:'+uid+':'+image.id,JSON.stringify(image));
 }
 let fail=false,after=null;
 const fetcher=async(url,options)=>{calls.push({url,body:JSON.parse(options.body)});await after?.(calls.length);if(fail)throw Error('private-provider-detail');if(url.endsWith('moderations'))return Response.json({results:[{flagged:false}]});if(url.endsWith('responses/input_tokens'))return Response.json({object:'response.input_tokens',input_tokens:300});return Response.json({status:'completed',model:'gpt-6.1-sol',output:[{type:'message',role:'assistant',content:[{type:'output_text',text:'{"answer":"Synthetic first step."}'}]}],usage:{input_tokens:300,output_tokens:20}});};
 const run=(id='image_req_1',count=1,{uid='p_pro',text='Explain this visible exercise.',images=pictures.slice(0,count).map(p=>p.id),owner='fixture-owner'}={})=>serveImageChat(env,{uid},{text,images},{requestId:id,owner,fetcher,now});
 return {db,env,calls,run,fail:()=>fail=true,after:fn=>after=fn};
}
let f=fixture();
try{
 for(const count of [1,2,3]){const result=await f.run('image_req_'+count,count);eq(result.real,true);eq(result.model,'gpt-6.1-sol');eq(result.creditsUsed,count*3);}
 eq(f.calls.length,12);eq((await creditStatus(f.db,'p_pro','pro',now)).dailyUsed,18);eq((await trialStatus(f.db,now)).used,3);
 const budget=f.db.get(monthKey(now)).v;
 const cached=await f.run();eq(cached.cached,true);eq(cached.creditsUsed,0);eq(f.calls.length,12);eq(f.db.get(monthKey(now)).v,budget);
 eq((await f.run('image_req_1',1,{text:'Changed question'})).error,'id_conflict');eq(f.calls.length,12);
 eq((await f.run('other_req',1,{uid:'p_standard'})).error,'plan_required');eq((await f.run('other_req',1,{owner:'other'})).error,'session_changed');
 eq((await f.run('other_req',1,{images:['a'.repeat(64)]})).error,'ai_unsupported');eq(f.calls.length,12);
 eq((await f.run('other_req',1,{images:[pictures[0].id,pictures[0].id]})).error,'ai_unsupported');
}finally{f.db.close();}
f=fixture();try{
 const status=await creditStatus(f.db,'p_pro','pro',now);f.db.seed(status.quotaKey,JSON.stringify({version:2,units:989,calls:1}),0);
 eq((await f.run('image_req_1',2)).error,'ai_plan');eq(f.calls.length,0);eq(f.db.get(monthKey(now)),null);
 f.env.OPENAI_MONTHLY_LIMIT_YEN='1';eq((await f.run()).error,'ai_budget');eq(f.calls.length,0);
}finally{f.db.close();}
f=fixture();try{
 f.fail();for(let i=1;i<=3;i++)eq((await f.run('failed_req_'+i)).error,'provider_failed');
 eq((await trialStatus(f.db,now)).stopped,true);eq((await creditStatus(f.db,'p_pro','pro',now)).dailyUsed,0);eq(f.calls.length,3);
 eq((await f.run('failed_req_4')).error,'ai_stopped');eq(f.calls.length,3);
 // Unknown provider outcomes are never automatically submitted again.
 eq((await f.run('failed_req_1')).error,'request_outcome_unknown');eq(f.calls.length,3);
}finally{f.db.close();}
f=fixture();try{
 const prepare=f.db.prepare.bind(f.db);let lost=true;
 f.db.prepare=sql=>{const statement=prepare(sql);if(sql.startsWith("UPDATE auth_kv SET v=json_set(v,'$.state','done'")){const bind=statement.bind.bind(statement);statement.bind=(...args)=>{const bound=bind(...args),first=bound.first.bind(bound);bound.first=async(...args)=>{const value=await first(...args);if(lost){lost=false;throw Error('synthetic lost receipt reply');}return value;};return bound;};}return statement;};
 eq((await f.run()).error,'ai_failed');eq(f.calls.length,4);eq((await f.run()).cached,true);eq(f.calls.length,4);eq((await creditStatus(f.db,'p_pro','pro',now)).dailyUsed,3);
}finally{f.db.close();}
for(const change of ['owner','consent','plan']){f=fixture();try{
 f.after(c=>{if(c!==1)return;if(change==='owner')f.db.seed('active-session:p_pro','new-owner',now+86400000);if(change==='consent')f.db.seed('openai-access:p_pro',JSON.stringify({approved:false}));if(change==='plan'){const row=JSON.parse(f.db.get('plan:p_pro').v);f.db.seed('plan:p_pro',JSON.stringify({...row,plan:'free',revision:row.revision+1}),0);}});
 eq((await f.run()).error,'session_changed');eq(f.calls.length,1);eq((await creditStatus(f.db,'p_pro','pro',now)).dailyUsed,0);
}finally{f.db.close();}}
console.log('Image consultation service: '+n+' checks passed; actual owned-image reader, plans/consent, shared trial/budget/journal, 3/6/9 credits, lost completion replay and circuit stop; synthetic SQLite/provider only');
