import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {creditUnits,creditStatus,chargeCredits,refundCredits} from '../../../cf-worker/src/subscription-credits.mjs';
const {D1SQLite}=createRequire(import.meta.url)('../../../.claude/verify/d1-sqlite.js');
const db=new D1SQLite(),now=Date.parse('2026-10-16T03:00:00Z'),uid='p_pro';
let n=0;const eq=(a,b)=>{assert.deepEqual(a,b);n++;};
try{
 for(const count of [1,2,3])eq(creditUnits('image_analysis',count)/2,count*3);
 for(const invalid of [0,-1,4,1.5,'2',null,NaN]){assert.throws(()=>creditUnits('image_analysis',invalid));n++;}
 eq(creditUnits('image_analysis'),6);eq(creditUnits('hint'),1);eq(creditUnits('chat'),2);eq(creditUnits('deep_explain'),6);
 assert.throws(()=>creditUnits('chat',2));n++;
 const receipts=[];
 for(const count of [1,2,3]){const receipt={};eq(await chargeCredits(db,uid,'pro',now,receipt,creditUnits('image_analysis',count)),true);receipts.push(receipt);}
 let status=await creditStatus(db,uid,'pro',now);eq(status.dailyUsed,18);eq(status.callsToday,3);
 eq(await refundCredits(db,uid,receipts[2]),true);eq(await refundCredits(db,uid,receipts[2]),false);
 status=await creditStatus(db,uid,'pro',now);eq(status.dailyUsed,9);eq(status.callsToday,2);
 const key=status.quotaKey;db.seed(key,JSON.stringify({version:2,units:989,calls:10}),0);
 eq(await chargeCredits(db,uid,'pro',now,{},12),false);eq((await creditStatus(db,uid,'pro',now)).dailyUsed,494.5);
 eq(await chargeCredits(db,uid,'pro',now,{},6),true);eq((await creditStatus(db,uid,'pro',now)).dailyUsed,497.5);
 const before=db.get(key).v;eq(await chargeCredits(db,uid,'pro',now,{},18),false);eq(db.get(key).v,before);
 // A pending-operation commit is atomic with the entire multi-image charge.
 const other='p_unlimit',operation='synthetic-operation';db.seed(operation,'pending',0);
 const pending={key:operation,pending:'pending',result:'done'};
 eq(await chargeCredits(db,other,'unlimit',now,null,18,pending),true);
 eq(await chargeCredits(db,other,'unlimit',now,null,18,pending),false);
 eq((await creditStatus(db,other,'unlimit',now)).dailyUsed,9);eq((await creditStatus(db,other,'unlimit',now)).callsToday,1);
 eq((await creditStatus(db,uid,'pro',now+86400000)).dailyUsed,0);
 console.log('Multi-image credit candidate: '+n+' checks passed; 3/6/9 credits, one call per send, atomic quota/commit, no partial charge, one-time receipt refund and JST reset; real isolated SQLite only');
}finally{db.close();}
