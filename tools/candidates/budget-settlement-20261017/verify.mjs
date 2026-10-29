import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {reservePricedOperation,completePricedOperation}=await import(process.argv.includes('--main')?'../../../cf-worker/src/openai-priced-operation.mjs':'./priced-operation.mjs');
import {startOperation} from '../../../cf-worker/src/openai-receipts.mjs';
import {requestBody,reserveMicroYen} from '../../../cf-worker/src/openai-policy.mjs';
import {monthKey} from '../../../cf-worker/src/openai-budget.mjs';
const {D1SQLite}=createRequire(import.meta.url)('../../../.claude/verify/d1-sqlite.js');
let n=0;const eq=(a,b)=>{assert.deepEqual(a,b);n++;};
const now=Date.now(),uid='p_pro',id='priced_operation',digest='a'.repeat(64),env={OPENAI_MONTHLY_LIMIT_YEN:'800'};
const policy=requestBody('pro','note-analysis',{instructions:'Fixed educational instructions.',input:'確認用の架空の入力',maxOutputTokens:1024});
const amount=reserveMicroYen(policy.body.model,100,20);
const makeResult=()=>({real:true,model:policy.body.model,value:{answer:'架空の確認結果'},usage:{input:100,output:20},reservedMicroYen:policy.reservation,billingTier:'default'});
const opKey='openai-operation:'+uid+':'+id,budget=monthKey(now);
async function setup(start=true){const db=new D1SQLite();const op=await reservePricedOperation(db,env,uid,id,digest,policy,now);eq(op.state,'reserved');if(start)eq(await startOperation(db,uid,id,op.token),true);return {db,op};}
{
 const {db,op}=await setup();try{
  eq(Number(db.get(budget).v),policy.reservation);eq(JSON.parse(db.get(opKey).v).pricing.model,policy.body.model);
  eq(await completePricedOperation(db,uid,id,op.token,makeResult()),true);eq(Number(db.get(budget).v),amount);
  eq(JSON.parse(db.get(opKey).v).settlement.estimatedMicroYen,amount);
  eq(await completePricedOperation(db,uid,id,op.token,makeResult()),true);eq(Number(db.get(budget).v),amount);
  eq(await completePricedOperation(db,uid,id,op.token,{...makeResult(),value:{answer:'different'}}),false);eq(Number(db.get(budget).v),amount);
 }finally{db.close();}
}
{
 const {db,op}=await setup();try{
  const results=await Promise.all(Array.from({length:8},()=>completePricedOperation(db,uid,id,op.token,makeResult())));
  eq(results.every(Boolean),true);eq(Number(db.get(budget).v),amount);
 }finally{db.close();}
}
for(const patch of [{real:false},{model:'gpt-6-luna'},{billingTier:'fast'},{reservedMicroYen:policy.reservation-1},{usage:{input:-1,output:20}},{usage:{input:policy.inputUpperBound+1,output:20}},{usage:{input:100,output:1025}},{usage:{input:1.5,output:20}},{usage:{input:100,output:20,discount:1}}]){
 const {db,op}=await setup();try{eq(await completePricedOperation(db,uid,id,op.token,{...makeResult(),...patch}),false);eq(Number(db.get(budget).v),policy.reservation);eq(JSON.parse(db.get(opKey).v).state,'started');}finally{db.close();}
}
{
 const {db,op}=await setup();try{const result=makeResult();delete result.billingTier;eq(await completePricedOperation(db,uid,id,op.token,result),true);eq(Number(db.get(budget).v),policy.reservation);eq(JSON.parse(db.get(opKey).v).settlement,undefined);eq(await completePricedOperation(db,uid,id,op.token,result),true);eq(Number(db.get(budget).v),policy.reservation);}finally{db.close();}
}
{
 const {db,op}=await setup();try{const result=makeResult();delete result.billingTier;eq((await Promise.all([completePricedOperation(db,uid,id,op.token,result),completePricedOperation(db,uid,id,op.token,result)])).every(Boolean),true);eq(Number(db.get(budget).v),policy.reservation);}finally{db.close();}
}
{
 const {db,op}=await setup();try{const result=makeResult();delete result.billingTier;db.seed(budget,'0');eq(await completePricedOperation(db,uid,id,op.token,result),false);eq(JSON.parse(db.get(opKey).v).state,'started');}finally{db.close();}
}
{
 const {db,op}=await setup(false);try{eq(await completePricedOperation(db,uid,id,op.token,makeResult()),false);eq(Number(db.get(budget).v),policy.reservation);}finally{db.close();}
}
{
 const {db,op}=await setup();try{
  db.failBatchAt=1;await assert.rejects(()=>completePricedOperation(db,uid,id,op.token,makeResult()));n++;
  eq(Number(db.get(budget).v),policy.reservation);eq(JSON.parse(db.get(opKey).v).state,'started');
 }finally{db.close();}
}
{
 const {db,op}=await setup();try{
  const batch=db.batch.bind(db);db.batch=async statements=>{await batch(statements);throw Error('synthetic lost commit reply');};
  await assert.rejects(()=>completePricedOperation(db,uid,id,op.token,makeResult()));n++;
  eq(Number(db.get(budget).v),amount);eq(JSON.parse(db.get(opKey).v).state,'done');db.batch=batch;
  eq(await completePricedOperation(db,uid,id,op.token,makeResult()),true);eq(Number(db.get(budget).v),amount);
 }finally{db.close();}
}
for(const counter of ['-1','NaN','1e9','2000000000','10.5','',String(policy.reservation-1)]){
 const {db,op}=await setup();try{db.seed(budget,counter);eq(await completePricedOperation(db,uid,id,op.token,makeResult()),false);eq(db.get(budget).v,counter);eq(JSON.parse(db.get(opKey).v).state,'started');}finally{db.close();}
}
{
 const {db,op}=await setup();try{
  const next=monthKey(now+40*86400000);db.seed(next,'12345');
  eq(await completePricedOperation(db,uid,id,op.token,{...makeResult(),usage:{input:0,output:0}}),true);
  eq(Number(db.get(budget).v),reserveMicroYen(policy.body.model,1,1));eq(db.get(next).v,'12345');
 }finally{db.close();}
}
for(const patch of [{reservation:1},{body:{...policy.body,service_tier:'fast'}},{body:{...policy.body,store:true}},{body:{...policy.body,model:'unapproved-model'}},{body:{...policy.body,input:[]}},{body:{...policy.body,tools:[]}},{body:{...policy.body,input:'changed input'}}]){
 const db=new D1SQLite();try{eq((await reservePricedOperation(db,env,uid,id,digest,{...policy,...patch},now)).error,'invalid_operation');eq(db.keys().length,0);}finally{db.close();}
}
console.log('Budget settlement candidate: '+n+' SQLite checks passed; conservative validated usage, concurrent/lost-ack completion once, rollback, corrupt-counter stop, old-month isolation; no API');
