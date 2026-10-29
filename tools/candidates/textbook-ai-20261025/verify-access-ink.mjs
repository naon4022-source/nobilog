import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
import {textbookAccess} from '../../../cf-worker/src/textbook-access.mjs';
import {textbookInkRoute} from '../../../cf-worker/src/textbook-ink.mjs';
const require=createRequire(import.meta.url),{D1SQLite}=require('../../../.claude/verify/d1-sqlite.js');
const time=1800000000000,epoch=time-10000,origin='https://fixture.test',databases=[];
let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++;};
const make=()=>{const db=new D1SQLite();databases.push(db);return db;};
const config=(db,stage='early',at=epoch)=>({AUTH_DB:db,APP_ORIGIN:origin,SUBSCRIPTION_PREVIEW:'0',TEXTBOOK_RELEASE_STAGE:stage,TEXTBOOK_RELEASE_EPOCH:String(at)});
const anchor='a'.repeat(64),key=uid=>'textbook-ink:'+uid+':math1:'+anchor;
const draft=(revision=0)=>({book:'math1',anchor,quote:'Synthetic public textbook excerpt',revision,doc:{version:1,width:1000,height:700,background:null,strokes:[]}});
const active=(db,uid)=>db.seed('active-session:'+uid,'fixture-owner-'+uid,time+86400000);
async function call(env,uid,method='GET',body=draft()){
 const request=new Request(origin+'/textbook-ink'+(method==='GET'?'?book=math1&anchor='+anchor:''),{method,headers:{Origin:origin,'Content-Type':'application/json'},...(method==='POST'?{body:JSON.stringify(body)}:{})});
 const response=await textbookInkRoute(request,env,{uid},{owner:'fixture-owner-'+uid,now:()=>time});
 ok(response.headers.get('Cache-Control')==='no-store','private response never cached');
 return {status:response.status,body:await response.json()};
}
function beforeWrite(db,action){
 let fired=false;
 return {get fired(){return fired;},prepare(sql){let values=[];const prepared=db.prepare(sql);const wrap=statement=>({bind(...next){values=next;return wrap(statement.bind(...next));},async first(column){if(!fired&&sql.includes('RETURNING v')&&values.some(v=>typeof v==='string'&&v.startsWith('textbook-ink:'))){fired=true;await action();}return statement.first(column);},all:()=>statement.all(),run:()=>statement.run(),_run:()=>statement._run()});return wrap(prepared);},batch:statements=>db.batch(statements)};
}
const originalFetch=globalThis.fetch;globalThis.fetch=async()=>{throw Error('unexpected network');};
try{
 const db=make(),early=config(db),v3=config(db,'v3',epoch+1);
 db.seed('synthetic-grades','keep grades unchanged',0);db.seed('synthetic-calendar','keep calendar unchanged',0);
 for(const uid of ['u1','u2','u4']){
  active(db,uid);const read=await call(early,uid);
  ok(read.status===200&&read.body.writable&&read.body.item===null,'early own empty notebook writable: '+uid);
  const saved=await call(early,uid,'POST');ok(saved.status===200&&saved.body.item.revision===1,'early actual SQL save: '+uid);
  ok(!db.get('plan:'+uid),'book-only access never initializes normal subscription: '+uid);
 }
 const saved=new Map(['u1','u2','u4'].map(uid=>[uid,db.get(key(uid)).v]));
 for(const uid of ['u1','u2','u4']){
  const read=await call(v3,uid);ok(read.status===200&&!read.body.writable&&read.body.item.revision===1,'V3 Free preserves and reads own saved note: '+uid);
  const denied=await call(v3,uid,'POST',draft(1));ok(denied.status===403&&denied.body.error==='plan_required','V3 unconfirmed write denied: '+uid);
  ok(db.get(key(uid)).v===saved.get(uid),'denial preserves exact saved bytes: '+uid);
 }
 const stale=await call(early,'u4','POST',draft(1));ok(stale.status===409&&stale.body.error==='plan_changed','stale early worker cannot revive writes');
 ok(db.get(key('u4')).v===saved.get('u4'),'stale release leaves note unchanged');
 const contract={plan:'pro',start:time-86400000,end:time+30*86400000,next:null,revision:2,initializedAt:time-86400000};
 db.seed('plan:u4',JSON.stringify(contract),0);
 const at=time-1000,entry={by:'admin（なお）',uid:'u4',from:'free',to:'pro',start:contract.start,end:contract.end,at,reason:'支払い確認（なお）',applies:at};
 db.seed('plan-log:'+String(at).padStart(15,'0')+':aabbccddeeff',JSON.stringify(entry),0);
 const confirmed=await call(v3,'u4');ok(confirmed.status===200&&confirmed.body.writable,'post-cutover operator approval unlocks actual route');
 const updated=await call(v3,'u4','POST',draft(1));ok(updated.status===200&&updated.body.item.revision===2,'approved own note updates');
 ok(db.get('plan:u4').v===JSON.stringify(contract),'handwriting preserves exact contract bytes');
 const other=await call(v3,'u2');ok(other.body.item.revision===1&&!other.body.writable,'approval does not cross to another account');
 ok(!db.keys().some(k=>/^(?:credits:|plan-credits|ai-|openai|trial:)/.test(k)),'handwriting never consumes provider/trial/AI credits');
 ok(db.get('synthetic-grades').v==='keep grades unchanged'&&db.get('synthetic-calendar').v==='keep calendar unchanged','unrelated learning data preserved');
 const race=make(),re=config(race);active(race,'u4');await call(re,'u4','POST');const before=race.get(key('u4')).v;
 const crossing=beforeWrite(race,()=>textbookAccess(config(race,'v3',epoch+1),'u4',time));
 const conflict=await call({...re,AUTH_DB:crossing},'u4','POST',draft(1));
 ok(crossing.fired,'cutover race actually fires immediately before guarded SQL write');
 ok(conflict.status===409&&conflict.body.error==='plan_changed','cutover wins in-flight old save');
 ok(race.get(key('u4')).v===before,'in-flight denial preserves previous note bytes');
 const invalid=await call({...v3,TEXTBOOK_RELEASE_STAGE:'invalid'},'u4','POST',draft(2));ok(invalid.status===503,'invalid release fails closed');
 ok((await call(v3,'u3')).status===403,'unknown account denied');
 ok((await call(v3,'p_pro')).status===403,'preview account requires explicit preview flag');
 const result={status:'passed',checks,scope:'Actual textbookInkRoute and real in-memory SQLite: three-account early access with global subscription off, V3 read preservation/write denial, explicit operator approval, stale and in-flight cutover, ownership, unrelated records and no provider calls. Synthetic data only.'};
 await writeFile(new URL('./access-ink-result.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log('Textbook release/handwriting integration: '+checks+' checks passed');
}finally{globalThis.fetch=originalFetch;for(const db of databases)db.close();}
