import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const mainMode=process.argv.includes('--main'),url=new URL('../../../cf-worker/src/plans.mjs',import.meta.url);
let source=await readFile(url,'utf8');
if(!mainMode){
 const patches=[["standard:{label:'Standard'","standard:{label:'Student'"],["const plan=PREVIEW_PROFILES[uid]||'free';","const plan=PREVIEW_PROFILES[uid]||(uid==='u1'?'unlimit':'free');"],["end:plan==='free'?null:start+365*DAY","end:plan==='free'||uid==='u1'?null:start+365*DAY"],["reason:PREVIEW_PROFILES[uid]?'確認版のテスト':'初回設定'","reason:PREVIEW_PROFILES[uid]?'確認版のテスト':uid==='u1'?'運営者':'初回設定'"]];
 for(const [a,b] of patches){assert.equal(source.split(a).length-1,1);source=source.replace(a,b);}
}
source=source.replace(/from '(\.\/[^']+)'/g,(_,p)=>'from '+JSON.stringify(new URL(p,url).href));
const {planStatus}=await import(mainMode?url.href:'data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const {D1SQLite}=createRequire(import.meta.url)('../../../.claude/verify/d1-sqlite.js'),db=new D1SQLite(),now=Date.now();
const env={AUTH_DB:db,SUBSCRIPTION_PREVIEW:'1',PREVIEW_PLAN_ACCOUNTS:'1',PLAN_CREDITS_V2:'1'};
let n=0;const eq=(a,b)=>{assert.deepEqual(a,b);n++;};
try{
 const nao=await planStatus(env,'u1',now);eq(nao.plan,'unlimit');eq(nao.end,null);eq(nao.dailyLimit,5000);eq(nao.features.nao,true);
 eq((await planStatus(env,'u2',now)).plan,'free');
 for(const [uid,plan,limit] of [['p_free','free',0],['p_mini','mini',20],['p_standard','standard',100],['p_pro','pro',500],['p_unlimit','unlimit',5000]]){const r=await planStatus(env,uid,now);eq(r.plan,plan);eq(r.dailyLimit,limit);eq(r.aiUsed,0);}
 eq((await planStatus(env,'p_standard',now)).label,'Student');
 const existing={plan:'mini',start:now-1000,end:now+100000,next:null,revision:12,reason:'既存の確認済み契約'};
 db.seed('plan:u1',JSON.stringify(existing));eq((await planStatus(env,'u1',now)).plan,'mini');eq(JSON.parse(await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind('plan:u1').first('v')),existing);
 eq((await planStatus({...env,SUBSCRIPTION_PREVIEW:'0'},'u1',now)).provisional,false);
}finally{db.close();}
console.log('Subscription initialization: '+n+' SQLite checks passed; nao starts UNLIMIT, others Free, five daily quotas, Student display, existing contracts untouched');
