import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {SUBSCRIPTION_TERMS,period,planStatus,planUse} from '../../../cf-worker/src/plans.mjs';
const {D1SQLite}=createRequire(import.meta.url)('../../../.claude/verify/d1-sqlite.js');
const J=s=>Date.parse(s+'+09:00'),DAY=86400000;let n=0;const eq=(a,b)=>{assert.deepEqual(a,b);n++;};
eq(SUBSCRIPTION_TERMS,{version:'2026-10-18',cycle:'start-date-month',graceDays:7,afterGrace:'free',preserveLearningRecords:true});
for(const [start,now,from,to] of [
 ['2026-01-31','2026-02-28','2026-02-28','2026-03-31'],
 ['2028-01-31','2028-02-29','2028-02-29','2028-03-31'],
 ['2026-10-18','2026-11-17','2026-10-18','2026-11-18'],
 ['2026-10-18','2026-11-18','2026-11-18','2026-12-18'],
 ['2026-12-31','2027-01-31','2027-01-31','2027-02-28']
])eq(period(J(start+'T00:00:00'),J(now+'T00:00:00')),{from:J(from+'T00:00:00'),to:J(to+'T00:00:00')});
for(const plan of ['mini','standard','pro','unlimit']){
 const db=new D1SQLite(),uid='p_'+plan,start=J('2026-10-18T00:00:00'),end=J('2026-11-18T00:00:00'),env={AUTH_DB:db,SUBSCRIPTION_PREVIEW:'1',PREVIEW_PLAN_ACCOUNTS:'1',PLAN_CREDITS_V2:'1'};
 const row=JSON.stringify({plan,start,end,anchor:start,next:null,revision:7});
 const preserved={['learning-note:'+uid+':fixture']:'synthetic note',['appData:'+uid]:'synthetic grades'};
 db.seed('plan:'+uid,row);for(const [key,value] of Object.entries(preserved))db.seed(key,value);
 try{
  for(const [time,state,effective] of [[start-1,'before','free'],[end-1,'active',plan],[end,'grace',plan],[end+7*DAY-1,'grace',plan],[end+7*DAY,'expired','free']]){
   const status=await planStatus(env,uid,time);eq(status.state,state);eq(status.plan,effective);eq(status.graceUntil,end+7*DAY);eq(status.contractTerms,SUBSCRIPTION_TERMS);eq(db.get('plan:'+uid).v,row);
   for(const [key,value] of Object.entries(preserved))eq(db.get(key).v,value);
  }
  eq(await planUse(env,db,uid,end+7*DAY),false);
 }finally{db.close();}
}
console.log('Confirmed subscription terms: '+n+' SQLite checks passed; start-date monthly/short months/leap years, exact 7-day grace boundary, paid-to-Free entitlement and unchanged contract/learning rows; no payment/network');
