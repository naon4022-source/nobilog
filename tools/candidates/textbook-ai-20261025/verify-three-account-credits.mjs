import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
import {planStatus,planUse,planRefund} from '../../../cf-worker/src/plans.mjs';
import {creditStatus,refundCredits} from '../../../cf-worker/src/subscription-credits.mjs';
import {textbookInkRoute} from '../../../cf-worker/src/textbook-ink.mjs';
const require=createRequire(import.meta.url),{D1SQLite}=require('../../../.claude/verify/d1-sqlite.js');
const db=new D1SQLite(),time=1800000000000,origin='https://fixture.test',env={AUTH_DB:db,SUBSCRIPTION_PREVIEW:'1',PLAN_CREDITS_V2:'1',APP_ORIGIN:origin};
let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++;};
const contract={plan:'pro',start:time-86400000,end:time+30*86400000,next:null,revision:2,initializedAt:time-86400000};
const ink=(uid,method='GET')=>textbookInkRoute(new Request(origin+'/textbook-ink'+(method==='GET'?'?book=math1':''),{method,headers:{Origin:origin,'Content-Type':'application/json'},...(method==='POST'?{body:JSON.stringify({book:'math1',anchor:'a'.repeat(64),quote:'synthetic '+uid+' excerpt',revision:0,doc:{version:1,width:1000,height:700,background:null,strokes:[]}})}:{})}),env,{uid},{owner:'fixture-owner-'+uid,now:()=>time});
try{
 db.seed('active-session:u4','fixture-owner-u4',time+60000);
 const initial=await planStatus(env,'u4',time);
 ok(initial.plan==='free'&&initial.dailyLeft===0&&initial.features.annotations===false,'new u4 remains Free under daily credits; no accidental upgrade');
 const freeRead=await ink('u4');ok(freeRead.status===200&&(await freeRead.json()).writable===false,'u4 Free handwriting read no longer fails with daily credits');
 ok((await ink('u4','POST')).status===403,'u4 Free still cannot write');
 ok(await planUse(env,db,'u4',time,{})===false,'u4 Free cannot spend credits');
 for(const uid of ['u1','u2','u4']){
  db.seed('active-session:'+uid,'fixture-owner-'+uid,time+60000);db.seed('plan:'+uid,JSON.stringify(contract),0);
  const before=await planStatus(env,uid,time);ok(before.plan==='pro'&&before.dailyLeft===500,'same daily Pro limit for '+uid);
  const receipt={};ok(await planUse(env,db,uid,time,receipt,2)===true,'actual nonadmin plan charge accepts '+uid);
  const charged=await creditStatus(db,uid,'pro',time);ok(charged.dailyUsed===1&&charged.callsToday===1,'normal call counted exactly once for '+uid);
  const other=uid==='u1'?'u2':'u1';await assert.rejects(()=>refundCredits(db,other,receipt),/invalid credit refund/);checks++;
  ok((await creditStatus(db,uid,'pro',time)).dailyUsed===1,'other account cannot refund owner credit');
  ok(await planRefund(env,db,uid,time,receipt)===true,'actual failure refund restores '+uid);
  ok(await planRefund(env,db,uid,time,receipt)===false,'same refund cannot apply twice');
  ok((await creditStatus(db,uid,'pro',time)).dailyUsed===0,'credit total restored');
  const r=await ink(uid);ok(r.status===200&&(await r.json()).writable===true,'paid '+uid+' can use handwriting with V2 quota');
  ok((await ink(uid,'POST')).status===200,'private handwriting save works for '+uid);
  ok((await creditStatus(db,uid,'pro',time)).dailyUsed===0,'handwriting does not spend AI credits');
  ok(await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind('plan:'+uid).first('v')===JSON.stringify(contract),'contract row preserved byte-for-byte');
 }
 ok((await planStatus(env,'u3',time)).provisional===false,'unknown account is not initialized');
 await assert.rejects(()=>creditStatus(db,'u3','pro',time),/invalid credit request/);checks++;
 ok(await planUse(env,db,'u3',time,{})===false,'unknown account cannot charge');
 ok(db.keys().filter(k=>k.startsWith('textbook-ink:')).length===3,'one isolated handwriting record per owner');
 const result={status:'passed',checks,scope:'real nonadmin planStatus/planUse/refund and private handwriting routes with daily V2 enabled; u1/u2/u4, Free gate, identical limits, own refund once, contracts unchanged; synthetic SQLite only'};
 await writeFile(new URL('./three-account-credit-result.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log('Three-account daily credits/book handwriting: '+checks+' checks passed');
}finally{db.close();}
