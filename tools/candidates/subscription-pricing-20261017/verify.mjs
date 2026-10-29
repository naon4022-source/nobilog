import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const main=process.argv.includes('--main');
const {planStatus}=await import(main?'../../../cf-worker/src/plans.mjs':'./plans.mjs');
const {D1SQLite}=createRequire(import.meta.url)('../../../.claude/verify/d1-sqlite.js');
const ctx={};vm.runInNewContext(await readFile(new URL(main?'../../../site-assets/subscription-catalog.js':'./catalog.js',import.meta.url),'utf8'),ctx);
const C=ctx.NobiSubscriptionCatalog,ids=['free','mini','standard','pro','unlimit'],net=[0,500,1000,1500,2000],gross=[0,500,1000,1500,2000],daily=[0,20,100,500,5000];
let checks=0;const eq=(a,b)=>{assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)));checks++;};
for(let i=0;i<ids.length;i++){
 const p=C.find(ids[i]);eq(p.yen,net[i]);eq(p.listedPrice,{basis:'tax-inclusive',currency:'JPY',totalYen:gross[i]});eq(p.daily,daily[i]);eq(C.priceLabel(p),i?gross[i].toLocaleString()+'円（税込）':'無料');
 for(const kind of ['none','500','1000','full'])for(const months of [1,3,6,12]){
  const v=C.subsidy(ids[i],kind,months),amount=kind==='full'?gross[i]:kind==='none'?0:Math.min(gross[i],Number(kind));eq(v.monthly,amount);eq(v.ownMonthly,gross[i]-amount);eq(v.total,amount*months);eq(v.target,kind==='full'?99:kind==='1000'?95:kind==='500'?85:null);
 }
 for(let j=0;j<ids.length;j++){const d=C.compare(ids[i],ids[j]);eq(d.yenDifference,net[j]-net[i]);eq(d.yenDifference,gross[j]-gross[i]);}
}
eq(C.subsidy('mini','500',3).ownMonthly,0);eq(C.subsidy('standard','1000',3).ownMonthly,0);eq(C.subsidy('unlimit','full',6).total,12000);eq(C.subsidy('pro','500',3).total,1500);
const db=new D1SQLite(),now=Date.now(),env={AUTH_DB:db,SUBSCRIPTION_PREVIEW:'1',PREVIEW_PLAN_ACCOUNTS:'1',PLAN_CREDITS_V2:'1'};
try{
 for(let i=0;i<ids.length;i++){
  const uid='p_'+ids[i],key='plan:'+uid,row=JSON.stringify({plan:ids[i],start:now-1000,end:null,revision:9,next:null});db.seed(key,row);
  const p=await planStatus(env,uid,now);eq(p.plan,ids[i]);eq(p.yen,net[i]);eq(p.listedPrice,C.find(ids[i]).listedPrice);eq(p.dailyLimit,daily[i]);eq(db.get(key).v,row);
 }
}finally{db.close();}
console.log('Subscription price: '+checks+' checks passed; five fixed tax-inclusive payment totals, frontend/server parity, all subsidy choices/periods, payment comparison, unchanged daily credits and existing contract rows; no payment/API/network');
