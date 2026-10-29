import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {period,planStatus} from '../../../cf-worker/src/plans.mjs';
const {D1SQLite}=createRequire(import.meta.url)('../../../.claude/verify/d1-sqlite.js');
const J=s=>Date.parse(s+'T00:00:00+09:00'),DAY=86400000;let checks=0;const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
for(const [start,at,from,to] of [
 ['2026-10-15','2026-10-16','2026-10-15','2026-11-15'],
 ['2026-10-15','2026-11-15','2026-11-15','2026-12-15'],
 ['2026-01-31','2026-02-28','2026-02-28','2026-03-31'],
 ['2028-01-31','2028-02-29','2028-02-29','2028-03-31'],
 ['2026-12-31','2027-01-31','2027-01-31','2027-02-28']])eq(period(J(start),J(at)),{from:J(from),to:J(to)});
const db=new D1SQLite(),env={AUTH_DB:db,SUBSCRIPTION_PREVIEW:'1',PREVIEW_PLAN_ACCOUNTS:'1',PLAN_CREDITS_V2:'1'},end=J('2026-11-15');
try{
 for(const plan of ['mini','standard','pro','unlimit']){
  const uid='p_'+plan,contract=JSON.stringify({plan,start:J('2026-10-15'),end,next:null,revision:4}),note=JSON.stringify({id:'note_fixture',revision:2,text:'本人が保存したまとめ'}),answer=JSON.stringify({answer:'synthetic',correct:false});
  db.seed('plan:'+uid,contract);db.seed('learning-note:'+uid+':note_fixture',note);db.seed('material-history:'+uid+':fixture',answer);
  for(const [at,state,effective] of [[end-1,'active',plan],[end,'grace',plan],[end+7*DAY-1,'grace',plan],[end+7*DAY,'expired','free']]){
   const status=await planStatus(env,uid,at);eq(status.state,state);eq(status.plan,effective);eq(status.graceUntil,end+7*DAY);eq(db.get('learning-note:'+uid+':note_fixture').v,note);eq(db.get('material-history:'+uid+':fixture').v,answer);eq(db.get('plan:'+uid).v,contract);
  }
 }
 console.log('Confirmed subscription terms: '+checks+' checks passed; anniversary months, month-end/leap/year boundaries, all four paid plans through the exact seven-day grace boundary, answers/notes/contracts retained; no provider/payment/network');
}finally{db.close();}
