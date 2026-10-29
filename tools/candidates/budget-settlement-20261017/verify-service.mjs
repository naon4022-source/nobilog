import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {reserveMicroYen} from '../../../cf-worker/src/openai-policy.mjs';
import {monthKey} from '../../../cf-worker/src/openai-budget.mjs';
import {planStatus} from '../../../cf-worker/src/plans.mjs';
const main=new URL('../../../cf-worker/src/openai-tutor-service.mjs',import.meta.url),mainMode=process.argv.includes('--main');
let source=await readFile(main,'utf8');
if(!mainMode){
 const transport=new URL('../../../cf-worker/src/openai-transport.mjs',import.meta.url);let t=await readFile(transport,'utf8');
 for(const {old,new:replacement} of JSON.parse(await readFile(new URL('./transport-patches.json',import.meta.url),'utf8'))){assert.equal(t.split(old).length-1,1);t=t.replace(old,replacement);}
 t=t.replace(/from '(\.\/[^']+)'/g,(_,p)=>'from '+JSON.stringify(new URL(p,transport).href));
 source=source.replace("'./openai-transport.mjs'",JSON.stringify('data:text/javascript;base64,'+Buffer.from(t).toString('base64')));
}
if(!mainMode)for(const {old,new:replacement} of JSON.parse(await readFile(new URL('./service-patches.json',import.meta.url),'utf8'))){assert.equal(source.split(old).length-1,1);source=source.replace(old,replacement);}
source=source.replace("'./openai-priced-operation.mjs'",JSON.stringify(new URL('./priced-operation.mjs',import.meta.url).href)).replace(/from '(\.\/[^']+)'/g,(_,p)=>'from '+JSON.stringify(new URL(p,main).href));
const {serveTextChat,serveNoteAnalysis}=await import(mainMode?main.href:'data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const {D1SQLite}=createRequire(import.meta.url)('../../../.claude/verify/d1-sqlite.js'),db=new D1SQLite(),now=Date.now(),owner='synthetic-owner',budget=monthKey(now);
const env={AUTH_DB:db,SUBSCRIPTION_PREVIEW:'1',PREVIEW_PLAN_ACCOUNTS:'1',PLAN_CREDITS_V2:'1',OPENAI_ENABLED:'1',OPENAI_TRIAL_ONLY:'1',OPENAI_SAFETY_READY:'1',OPENAI_TERMS_READY:'1',OPENAI_BILLING_READY:'1',OPENAI_API_KEY:'synthetic-only',OPENAI_MONTHLY_LIMIT_YEN:'800'};
let n=0,calls=0;const eq=(a,b)=>{assert.deepEqual(a,b);n++;};
const options={now,owner,requestId:'settled_text',fetcher:async(url,opts)=>{
 calls++;if(url.endsWith('moderations'))return Response.json({results:[{flagged:false}]});
 const b=JSON.parse(opts.body),value=b.model==='gpt-6.1-sol'?{summary:'架空のノート確認',strengths:[],checks:[],practice:[]}:{answer:'まず条件を確認しよう。'};
 return Response.json({status:'completed',service_tier:'default',model:b.model,output:[{type:'message',role:'assistant',content:[{type:'output_text',text:JSON.stringify(value)}]}],usage:{input_tokens:100,output_tokens:20}});
}};
try{
 db.seed('active-session:p_pro',owner,now+60000);db.seed('openai-access:p_pro',JSON.stringify({version:'2026-10-14',ageBand:'13-17',guardianConsent:true,approved:true}));
 const result=await serveTextChat(env,{uid:'p_pro'},{text:'数直線を説明して。',images:[]},options);
 eq(result.real,true);eq(calls,3);eq(Number(db.get(budget).v),reserveMicroYen('gpt-6-luna',100,20));eq((await planStatus(env,'p_pro',now)).dailyUsed,1);
 eq((await serveTextChat(env,{uid:'p_pro'},{text:'数直線を説明して。',images:[]},options)).cached,true);eq(calls,3);
 const note={id:'note_fixture',revision:1,title:'数直線',text:'右ほど大きい。',images:[]};db.seed('learning-note:p_pro:'+note.id,JSON.stringify(note));
 const before=Number(db.get(budget).v);
 eq((await serveNoteAnalysis(env,{uid:'p_pro'},{noteId:note.id,revision:1},{...options,requestId:'settled_note'})).real,true);eq(Number(db.get(budget).v),before+reserveMicroYen('gpt-6.1-sol',100,20));eq((await planStatus(env,'p_pro',now)).dailyUsed,4);
 let lost=true;const batch=db.batch.bind(db);
 db.batch=async statements=>{const r=await batch(statements),raw=db.get('openai-operation:p_pro:lost_completion');if(lost&&raw&&JSON.parse(raw.v).state==='done'){lost=false;throw Error('synthetic lost completion reply');}return r;};
 const lostOptions={...options,requestId:'lost_completion'},used=Number(db.get(budget).v),oldCalls=calls;
 eq(typeof (await serveTextChat(env,{uid:'p_pro'},{text:'符号について説明して。',images:[]},lostOptions)).error,'string');eq(calls,oldCalls+3);eq(Number(db.get(budget).v),used+reserveMicroYen('gpt-6-luna',100,20));
 eq((await serveTextChat(env,{uid:'p_pro'},{text:'符号について説明して。',images:[]},lostOptions)).cached,true);eq(calls,oldCalls+3);eq(Number(db.get(budget).v),used+reserveMicroYen('gpt-6-luna',100,20));db.batch=batch;
 const failedOptions={...options,requestId:'unknown_completion',fetcher:async(url,opts)=>{calls++;if(url.endsWith('moderations'))return Response.json({results:[{flagged:false}]});throw Error('synthetic response loss');}};
 const failedBefore=Number(db.get(budget).v);eq(typeof (await serveTextChat(env,{uid:'p_pro'},{text:'整数を確認したい。',images:[]},failedOptions)).error,'string');
 const row=JSON.parse(db.get('openai-operation:p_pro:unknown_completion').v);eq(row.state,'started');eq(Number(db.get(budget).v),failedBefore+row.amount);
 const count=calls;eq((await serveTextChat(env,{uid:'p_pro'},{text:'整数を確認したい。',images:[]},failedOptions)).error,'request_outcome_unknown');eq(calls,count);eq(Number(db.get(budget).v),failedBefore+row.amount);
 const noTier={...options,requestId:'missing_tier_evidence',fetcher:async(url,opts)=>{calls++;if(url.endsWith('moderations'))return Response.json({results:[{flagged:false}]});return Response.json({status:'completed',model:JSON.parse(opts.body).model,output:[{type:'message',role:'assistant',content:[{type:'output_text',text:'{"answer":"条件を確認しよう。"}'}]}],usage:{input_tokens:100,output_tokens:20}});}};
 const held=Number(db.get(budget).v);eq((await serveTextChat(env,{uid:'p_pro'},{text:'順に説明する。',images:[]},noTier)).real,true);
 const noTierRow=JSON.parse(db.get('openai-operation:p_pro:missing_tier_evidence').v);eq(noTierRow.settlement,undefined);eq(Number(db.get(budget).v),held+noTierRow.amount);
 const tierOptions={...options,requestId:'unexpected_paid_tier',fetcher:async(url,opts)=>{calls++;if(url.endsWith('moderations'))return Response.json({results:[{flagged:false}]});return Response.json({status:'completed',service_tier:'fast',model:JSON.parse(opts.body).model,output:[],usage:{input_tokens:100,output_tokens:20}});}};
 const tierBefore=Number(db.get(budget).v),tierCalls=calls;eq(typeof (await serveTextChat(env,{uid:'p_pro'},{text:'向きを確認する。',images:[]},tierOptions)).error,'string');eq(calls,tierCalls+2);
 const tierRow=JSON.parse(db.get('openai-operation:p_pro:unexpected_paid_tier').v);eq(Number(db.get(budget).v),tierBefore+tierRow.amount);eq(tierRow.state,'started');
}finally{db.close();}
console.log('Budget settlement service: '+n+' checks passed; actual text/note service with fake provider, normal usage estimate, lost-save replay and unknown reservation retained; no live API');
