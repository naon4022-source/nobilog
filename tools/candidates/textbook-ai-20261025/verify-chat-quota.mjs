import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
import {textbookAccess} from '../../../cf-worker/src/textbook-access.mjs';
import {textbookChatQuota,reserveTextbookChat,refundTextbookChat} from '../../../cf-worker/src/textbook-ai-quota.mjs';
const require=createRequire(import.meta.url),{D1SQLite}=require('../../../.claude/verify/d1-sqlite.js');
const now=1800000000000,epoch=now-10000,dbs=[];
let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++;};
const make=()=>{const db=new D1SQLite();dbs.push(db);return db;};
const env=db=>({AUTH_DB:db,SUBSCRIPTION_PREVIEW:'0',PREVIEW_PLAN_ACCOUNTS:'1',TEXTBOOK_RELEASE_STAGE:'early',TEXTBOOK_RELEASE_EPOCH:String(epoch)});
const options=(uid='u4',requestId='request_0001',time=now)=>({uid,owner:'fixture-owner-'+uid,now:time,requestId,fingerprint:'a'.repeat(64)});
const active=(db,uid)=>db.seed('active-session:'+uid,'fixture-owner-'+uid,now+3*86400000);
async function rejected(fn){await assert.rejects(fn,/invalid_textbook_quota|invalid_entitlement|plan_required/);checks++;}
try{
 const db=make(),e=env(db);
 for(const uid of ['u1','u2','u4']){
  active(db,uid);const access=await textbookAccess(e,uid,now),o=options(uid);
  ok((await textbookChatQuota(db,access,o)).dailyLeft===5000,'full early book quota even when global subscription disabled: '+uid);
  const r=await reserveTextbookChat(db,access,o);ok(!!r.receipt,'actual atomic reserve: '+uid);
  ok((await textbookChatQuota(db,access,o)).dailyUsed===1,'one textbook chat charged: '+uid);
  ok((await reserveTextbookChat(db,access,o)).error==='request_outcome_unknown','same request cannot dispatch twice');
  ok((await reserveTextbookChat(db,access,{...o,fingerprint:'b'.repeat(64)})).error==='id_conflict','same id different content rejected');
  await rejected(()=>refundTextbookChat(db,uid==='u1'?'u2':'u1',r.receipt));
  ok(await refundTextbookChat(db,uid,r.receipt),'known safe failure refunded');
  ok(!await refundTextbookChat(db,uid,r.receipt),'refund only once');
  ok((await textbookChatQuota(db,access,o)).dailyUsed===0,'refund restores own day');
  ok((await reserveTextbookChat(db,access,o)).error==='request_refunded','refunded id remains terminal');
  ok(!db.get('plan:'+uid),'book charges never initialize normal plans');
 }
 for(const uid of ['p_free','p_mini','p_standard']){
  active(db,uid);const denied=await textbookAccess(e,uid,now);
  await rejected(()=>reserveTextbookChat(db,denied,options(uid)));
 }
 const mini=make(),me=env(mini),uid='p_pro';active(mini,uid);const ma=await textbookAccess(me,uid,now);
 const results=await Promise.all(Array.from({length:505},(_,i)=>reserveTextbookChat(mini,ma,options(uid,'parallel_'+String(i).padStart(4,'0')))));
 ok(results.filter(r=>r.receipt).length===500,'parallel requests enforce exact Pro 500/day ceiling');
 ok((await textbookChatQuota(mini,ma,options(uid))).dailyUsed===500,'quota ledger matches all successful reservations');
 const reset=(await textbookChatQuota(mini,ma,options(uid))).resetAt;
 ok(reset%86400000===15*3600000,'daily reset is midnight Japan time');
 const tomorrow=await textbookAccess(me,uid,reset);
 ok((await textbookChatQuota(mini,tomorrow,options(uid,'next_day_0001',reset))).dailyUsed===0,'next Japan day starts independently');
 const old=results.find(r=>r.receipt).receipt;
 ok(await refundTextbookChat(mini,uid,old),'late refund addresses original day');
 ok((await textbookChatQuota(mini,tomorrow,options(uid,'next_day_0001',reset))).dailyUsed===0,'late refund does not decrease new day');
 const retry=make(),re=env(retry);active(retry,'u4');const ra=await textbookAccess(re,'u4',now),ro=options();
 const duplicate=await Promise.all(Array.from({length:5},()=>reserveTextbookChat(retry,ra,ro)));
 ok(duplicate.filter(r=>r.receipt).length===1,'concurrent identical id reserves once');
 ok((await textbookChatQuota(retry,ra,ro)).dailyUsed===1,'concurrent duplicate counts one');
 const own=duplicate.find(r=>r.receipt).receipt;
 await rejected(()=>refundTextbookChat(retry,'u4',{...own,token:crypto.randomUUID()}));
 const refunds=await Promise.all(Array.from({length:5},()=>refundTextbookChat(retry,'u4',own)));
 ok(refunds.filter(Boolean).length===1,'concurrent refunds restore exactly one call');
 ok((await textbookChatQuota(retry,ra,ro)).dailyUsed===0,'concurrent refunds cannot make usage negative');
 retry.seed('active-session:u4','rotated-owner',now+60000);
 ok((await reserveTextbookChat(retry,ra,{...ro,requestId:'revoked_0001'})).error==='quota_or_access_changed','revoked owner rejected by final SQL');
 active(retry,'u4');await textbookAccess({...re,TEXTBOOK_RELEASE_STAGE:'v3',TEXTBOOK_RELEASE_EPOCH:String(epoch+1)},'u4',now);
 ok((await reserveTextbookChat(retry,ra,{...ro,requestId:'cutover_0001'})).error==='quota_or_access_changed','old early snapshot cannot charge after V3');
 const rollback=make(),be=env(rollback);active(rollback,'u4');const ba=await textbookAccess(be,'u4',now);rollback.failBatchAt=1;
 await assert.rejects(()=>reserveTextbookChat(rollback,ba,options()),/Synthetic transaction failure/);checks++;
 ok(!rollback.keys().some(k=>k.startsWith('textbook-ai-quota:')),'receipt transaction failure rolls back charge');
 rollback.failBatchAt=-1;const real=rollback.batch.bind(rollback);let lost=true;rollback.batch=async statements=>{const value=await real(statements);if(lost){lost=false;throw Error('synthetic lost response');}return value;};
 await assert.rejects(()=>reserveTextbookChat(rollback,ba,options()),/synthetic lost response/);checks++;
 ok((await reserveTextbookChat(rollback,ba,options())).error==='request_outcome_unknown','lost reply cannot reserve or dispatch again');
 ok((await textbookChatQuota(rollback,ba,options())).dailyUsed===1,'unknown outcome retains charge');
 const broken=make(),ce=env(broken);active(broken,'u4');const ca=await textbookAccess(ce,'u4',now),day=Math.floor((now+9*3600000)/86400000),k='textbook-ai-quota:u4:'+epoch+':'+day;
 broken.seed(k,'broken quota',0);await rejected(()=>reserveTextbookChat(broken,ca,options()));ok(broken.get(k).v==='broken quota','corrupt quota never reset to free usage');
 await rejected(()=>reserveTextbookChat(db,JSON.parse(JSON.stringify(ra)),options()));
 const report={status:'passed',checks,scope:'Synthetic real SQLite: textbook chat quota with global subscriptions off, three users, exact Pro ceiling/concurrency, JST midnight, one-time own refund, stale release/session, corrupt records, rollback and unknown commit outcome. No provider or user data.'};
 await writeFile(new URL('./chat-quota-result.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log('Textbook chat quota: '+checks+' checks passed');
}finally{for(const db of dbs)db.close();}
