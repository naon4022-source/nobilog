import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
import {textbookAccess,textbookAccessOn,textbookWriteGuard} from '../../../cf-worker/src/textbook-access.mjs';
import {planStatus,readPlanContractSnapshot} from '../../../cf-worker/src/plans.mjs';
const require=createRequire(import.meta.url),{D1SQLite}=require('../../../.claude/verify/d1-sqlite.js');
const now=1800000000000,epoch=now-10000,databases=[];
let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++;};
const make=()=>{const db=new D1SQLite();databases.push(db);return db;};
const config=(db,stage='early',at=epoch)=>({AUTH_DB:db,SUBSCRIPTION_PREVIEW:'0',TEXTBOOK_RELEASE_STAGE:stage,TEXTBOOK_RELEASE_EPOCH:String(at)});
const active=(db,uid='u4')=>db.seed('active-session:'+uid,'fixture-owner-'+uid,now+50*86400000);
async function write(db,a,key='fixture-book-write',uid='u4',owner='fixture-owner-u4',at=now){
 const g=textbookWriteGuard(a,{uid,owner,feature:'annotations',now:at});
 return (await db.prepare('INSERT INTO auth_kv(k,v,expires_at) SELECT ?,?,0 WHERE '+g.sql+' ON CONFLICT(k) DO UPDATE SET v=excluded.v').bind(key,'synthetic own book data',...g.values).run()).meta.changes;
}
const row=(plan='pro',start=now-86400000,end=now+30*86400000)=>({plan,start,end,next:null,revision:2,initializedAt:now-100000,reason:'初回設定',privateFixture:'PRIVATE_CONTRACT_SENTINEL'});
function log(db,uid,c,at=now-1000,options={}){
 const entry={by:'admin（なお）',uid,from:'free',to:c.plan,start:c.start,end:c.end,at,reason:'支払い確認（なお）',applies:Math.max(at,c.start),...options};
 const key='plan-log:'+String(at).padStart(15,'0')+':aabbccddeeff';db.seed(key,JSON.stringify(entry),0);return {key,entry};
}
async function rejected(fn,code){await assert.rejects(fn,new RegExp(code));checks++;}
try{
 const off=await textbookAccess({},'u4',now);ok(!off.enabled&&!off.features.chat,'off has no rights or DB side effects');
 await rejected(()=>textbookAccess({},'u3',now),'invalid_member');
 const bad=make();
 for(const flags of [{TEXTBOOK_RELEASE_STAGE:'early'},{TEXTBOOK_RELEASE_EPOCH:String(epoch)},{TEXTBOOK_RELEASE_STAGE:'future',TEXTBOOK_RELEASE_EPOCH:String(epoch)},{TEXTBOOK_RELEASE_STAGE:'early',TEXTBOOK_RELEASE_EPOCH:String(now+1)},{TEXTBOOK_RELEASE_STAGE:'early',TEXTBOOK_RELEASE_EPOCH:''}]){
  const env={AUTH_DB:bad,SUBSCRIPTION_PREVIEW:'1',...flags};ok(textbookAccessOn(env),'configured policy cannot fall back to legacy');await rejected(()=>textbookAccess(env,'u4',now),'book_access_unavailable');
 }
 ok(bad.keys().length===0,'bad release flags never write or initialize normal contracts');
 const early=make(),e=config(early);let saved;
 for(const uid of ['u1','u2','u4']){
  active(early,uid);const a=await textbookAccess(e,uid,now);saved=a;
  ok(a.scope==='textbook'&&a.plan==='unlimit'&&a.features.annotations&&a.features.chat&&a.dailyLimit===5000,'early textbook extras enabled for '+uid);
  ok((await planStatus(e,uid,now)).provisional===false,'normal subscription framework stays off for '+uid);
  ok(!early.keys().includes('plan:'+uid),'early access never creates/rewrites '+uid+' normal contract');
 }
 ok(early.keys().filter(k=>k.startsWith('textbook-release-log:')).length===1,'same release has one public audit record');
 await rejected(()=>textbookAccess(e,'p_pro',now),'invalid_member');
 for(const [uid,plan] of [['p_free','free'],['p_mini','mini'],['p_standard','standard'],['p_pro','pro'],['p_unlimit','unlimit']]){
  const a=await textbookAccess({...e,PREVIEW_PLAN_ACCOUNTS:'1'},uid,now);ok(a.plan===plan&&a.activation==='profile','explicit preview keeps its selected tier');
 }
 ok(!JSON.stringify(saved).includes('fixture-owner')&&!Object.hasOwn(saved,'guard'),'public snapshot contains no private guard');
 assert.throws(()=>textbookWriteGuard(JSON.parse(JSON.stringify(saved)),{uid:'u4',owner:'fixture-owner-u4',feature:'annotations',now}),/invalid_entitlement/);checks++;
 assert.throws(()=>textbookWriteGuard(saved,{uid:'u1',owner:'fixture-owner-u1',feature:'annotations',now}),/invalid_entitlement/);checks++;
 ok(await write(early,saved)===1,'live early snapshot authorizes own isolated write');
 ok(await write(early,saved,'wrong-owner','u4','other-owner')===0,'wrong owner cannot use a valid rights snapshot');
 early.seed('active-session:u4','rotated-owner',now+60000);ok(await write(early,saved,'revoked-owner')===0,'owner rotation wins final SQL guard');active(early);
 const v3=config(early,'v3',epoch+1),free=await textbookAccess(v3,'u4',now);ok(free.plan==='free'&&!free.features.annotations&&!free.features.chat,'V3 returns unconfirmed users to textbook Free');
 ok(await write(early,saved,'old-release')===0,'old early Worker cannot write after V3 marker advances');
 await rejected(()=>textbookAccess(e,'u4',now),'release_changed');
 await rejected(()=>textbookAccess(config(early,'early',epoch+2),'u4',now),'release_changed');
 assert.throws(()=>textbookWriteGuard(free,{uid:'u4',owner:'fixture-owner-u4',feature:'annotations',now}),/plan_required/);checks++;
 const legacy=make(),le={AUTH_DB:legacy,SUBSCRIPTION_PREVIEW:'1',PLAN_CREDITS_V2:'1'};active(legacy,'u1');
 const original=await textbookAccess(le,'u1',now),normal=legacy.get('plan:u1').v;
 ok(original.mode==='legacy'&&original.plan==='unlimit','existing owner tier preserved while no new release is configured');
 ok(!JSON.stringify(original).includes('rawContract')&&!JSON.stringify(original).includes('plan:u1'),'read-only raw snapshot is not a public response field');
 ok(await write(legacy,original,'legacy-own','u1','fixture-owner-u1')===1,'legacy scoped write retains normal contract guard');
 await textbookAccess(config(legacy),'u1',now);
 ok(legacy.get('plan:u1').v===normal,'activating early textbook access preserves existing normal contract bytes');
 ok(await write(legacy,original,'legacy-after-release','u1','fixture-owner-u1')===0,'legacy snapshot cannot survive new release marker');
 await rejected(()=>textbookAccess(le,'u1',now),'release_changed');
 const paid=make(),pe=config(paid,'v3');active(paid);
 const initial=row('unlimit',now-86400000,null);initial.reason='運営者';paid.seed('plan:u1',JSON.stringify(initial),0);
 ok((await textbookAccess(pe,'u1',now)).plan==='free','initial owner UNLIMIT is not a V3 subscription');
 const old=row();paid.seed('plan:u2',JSON.stringify(old),0);log(paid,'u2',old,epoch-1);
 ok((await textbookAccess(pe,'u2',now)).plan==='free','pre-cutover approval does not unlock V3');
 const c=row();paid.seed('plan:u4',JSON.stringify(c),0);const approval=log(paid,'u4',c);
 const approved=await textbookAccess(pe,'u4',now);
 ok(approved.plan==='pro'&&approved.activation==='operator-confirmed'&&approved.features.chat,'post-cutover operator approval unlocks actual active tier');
 ok(!JSON.stringify(approved).includes('PRIVATE_CONTRACT_SENTINEL')&&!JSON.stringify(approved).includes('plan-log:'),'private contract/log guards never serialize');
 ok(await write(paid,approved,'approved')===1,'confirmed source contract and log authorize write');
 paid.seed('plan:u4',JSON.stringify({...c,revision:3}),0);ok(await write(paid,approved,'changed-contract')===0,'contract race blocks old snapshot');paid.seed('plan:u4',JSON.stringify(c),0);
 paid.seed(approval.key,JSON.stringify({...approval.entry,reason:'fixture-invalid'}),0);ok(await write(paid,approved,'changed-approval')===0,'approval race blocks old snapshot');
 await rejected(()=>textbookAccess(pe,'u4',now),'book_access_unavailable');paid.seed(approval.key,JSON.stringify(approval.entry),0);
 const grace=row('pro',now-30*86400000,now-3600000);paid.seed('plan:u4',JSON.stringify(grace),0);log(paid,'u4',grace,now-999);
 const g=await textbookAccess(pe,'u4',now),end=grace.end+7*86400000;
 ok(g.state==='grace'&&g.features.chat,'confirmed plan retains exact seven-day grace');
 assert.throws(()=>textbookWriteGuard(g,{uid:'u4',owner:'fixture-owner-u4',feature:'chat',now:end}),/plan_changed/);checks++;
 ok((await textbookAccess(pe,'u4',end)).plan==='free','exact grace boundary is Free');
 const next=row('unlimit');next.next={plan:'pro',from:now+1000,start:now+1000,end:now+31*86400000};paid.seed('plan:u4',JSON.stringify(next),0);log(paid,'u4',next,now-998);
 log(paid,'u4',{plan:'pro',start:next.next.start,end:next.next.end},now-997,{from:'unlimit',applies:next.next.from});
 const beforeNext=await textbookAccess(pe,'u4',now);ok(beforeNext.plan==='unlimit','scheduled lower tier does not apply early');
 assert.throws(()=>textbookWriteGuard(beforeNext,{uid:'u4',owner:'fixture-owner-u4',feature:'chat',now:next.next.from}),/plan_changed/);checks++;
 const projection=await readPlanContractSnapshot(paid,'u4',next.next.from);ok(projection.plan==='pro'&&JSON.parse(projection.rawContract).next.plan==='pro'&&projection.row.next===null,'existing projection and exact raw source are both retained');
 ok((await textbookAccess(pe,'u4',next.next.from)).plan==='pro','operator-confirmed scheduled tier applies at its boundary');
 const corrupt=make();corrupt.seed('textbook-release-policy','not-json',0);await rejected(()=>textbookAccess(config(corrupt),'u4',now),'book_access_unavailable');ok(corrupt.get('textbook-release-policy').v==='not-json','corrupt release is never silently replaced');
 const rollback=make();rollback.failBatchAt=1;await rejected(()=>textbookAccess(config(rollback),'u4',now),'book_access_unavailable');ok(rollback.keys().length===0,'release and audit rollback together');rollback.failBatchAt=-1;ok((await textbookAccess(config(rollback),'u4',now)).plan==='unlimit','explicit retry after failed transaction works');
 const lost=make(),realBatch=lost.batch.bind(lost);let lose=true;lost.batch=async statements=>{const value=await realBatch(statements);if(lose){lose=false;throw Error('synthetic lost reply');}return value;};
 await rejected(()=>textbookAccess(config(lost),'u4',now),'book_access_unavailable');ok(lost.keys().length===2,'lost reply keeps committed release and audit');await textbookAccess(config(lost),'u4',now);ok(lost.keys().length===2,'retry does not duplicate audit or reset policy');
 const race=make();await textbookAccess(config(race),'u4',now);race.beforeBatch=async()=>{race.beforeBatch=null;await textbookAccess(config(race,'v3',epoch+2),'u4',now);};
 await rejected(()=>textbookAccess(config(race,'early',epoch+1),'u4',now),'release_changed');ok(JSON.parse(race.get('textbook-release-policy').v).stage==='v3'&&!race.get('textbook-release-log:'+(epoch+1)),'higher V3 wins CAS race without stale audit');
 const result={status:'passed',checks,scope:'actual in-memory SQLite; textbook-only early/V3/legacy/profile rights, unchanged normal plans, canonical operator confirmations, exact grace/scheduled boundaries, owner+contract+release SQL guards, private snapshot serialization, rollback/lost reply/race; no real data or activation; AI quota/service/UI not yet integrated'};
 await writeFile(new URL('./access-result.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log('Textbook-only access: '+checks+' isolated checks passed');
}finally{for(const db of databases)db.close();}
