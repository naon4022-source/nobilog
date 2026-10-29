import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
import {textbookAnnotationsRoute} from '../../../../cf-worker/src/textbook-annotations.mjs';
import {textbookAccess} from '../../../../cf-worker/src/textbook-access.mjs';
const {D1SQLite}=createRequire(import.meta.url)('../../../../.claude/verify/d1-sqlite.js');
const time=1800000000000,epoch=time-10000,origin='https://fixture.test',databases=[];let checks=0;
const ok=(v,m)=>{assert.ok(v,m);checks++;},key=uid=>'textbook-annotation:'+uid+':math1:'+'a'.repeat(64);
const body={book:'math1',anchor:'a'.repeat(64),quote:'合成の公開本文',color:'blue',note:'合成の自分用メモ',revision:0};
function fixture(){const db=new D1SQLite();databases.push(db);for(const uid of ['u1','u2','u4']){db.seed('active-session:'+uid,'owner-'+uid,time+86400000);db.seed('material-history:'+uid+':sentinel','KEEP_GRADES',0);}return {db,env:{AUTH_DB:db,APP_ORIGIN:origin,SUBSCRIPTION_PREVIEW:'0',TEXTBOOK_RELEASE_STAGE:'early',TEXTBOOK_RELEASE_EPOCH:String(epoch)}};}
const request=(method,b=body)=>new Request(origin+'/textbook-annotations'+(method==='GET'?'?book=math1':''),{method,headers:{Origin:origin,'Content-Type':'application/json'},...(method==='POST'?{body:JSON.stringify(b)}:{})});
const call=(f,uid='u4',method='GET',b=body,options={})=>textbookAnnotationsRoute(request(method,b),f.env,{uid},{owner:'owner-'+uid,now:()=>time,...options});
function hooked(db,action,read=false){let fired=false;return {get fired(){return fired;},prepare(sql){const wrap=stmt=>({bind(...args){return wrap(stmt.bind(...args));},async first(column){if(!read&&!fired&&sql.startsWith('INSERT INTO auth_kv(k,v,expires_at) SELECT ?,?,0 WHERE')){fired=true;await action();}return stmt.first(column);},async all(){const rows=await stmt.all();if(read&&!fired&&sql.includes('ORDER BY k LIMIT 2048')){fired=true;await action();}return rows;},run:()=>stmt.run(),_run:()=>stmt._run()});return wrap(db.prepare(sql));},batch:rows=>db.batch(rows)};}
try{
 const f=fixture();
 for(const uid of ['u1','u2','u4']){
  const get=await call(f,uid),data=await get.json();ok(get.ok&&data.writable===true&&data.items.length===0,'early normal-subscription-off marker access for '+uid);
  const b={...body,note:'合成の本人専用 '+uid},post=await call(f,uid,'POST',b),saved=await post.json();ok(post.ok&&saved.item.revision===1,'early marker write '+uid);
  const retry=await call(f,uid,'POST',b);ok(retry.ok&&(await retry.json()).cached===true,'lost-response replay does not increment revision '+uid);
  const own=await (await call(f,uid)).json();ok(own.items.length===1&&own.items[0].note===b.note,'only own rows returned '+uid);
  ok(!f.db.get('plan:'+uid)&&f.db.get('material-history:'+uid+':sentinel').v==='KEEP_GRADES','normal contract and grade sentinel unchanged '+uid);
 }
 f.env.TEXTBOOK_RELEASE_STAGE='v3';f.env.TEXTBOOK_RELEASE_EPOCH=String(epoch+1);
 for(const uid of ['u1','u2','u4']){
  const before=f.db.get(key(uid)).v,response=await call(f,uid),data=await response.json();ok(response.ok&&!data.writable&&data.items.length===1,'V3 Free retains saved marker '+uid);
  ok((await call(f,uid,'POST',{...body,revision:1,note:'must not save'})).status===403&&f.db.get(key(uid)).v===before,'V3 Free cannot overwrite saved marker '+uid);
 }
 const old={...f,env:{...f.env,TEXTBOOK_RELEASE_STAGE:undefined,TEXTBOOK_RELEASE_EPOCH:undefined,SUBSCRIPTION_PREVIEW:'1'}};
 ok((await call(old)).status>=400,'old normal-subscription configuration cannot bypass persisted V3 cutover');
 ok((await call(f,'u4','POST',body,{owner:undefined})).status===401,'book mode requires trusted lease owner');
 ok((await call(f,'u4','POST',body,{owner:'other-owner'})).status===409,'different active owner refused');
 ok((await call(f,'p_pro')).status===403,'preview identities require explicit flag');
 for(const change of ['owner','release','expiry']){
  const r=fixture();let at=time;
  const hook=hooked(r.db,async()=>{if(change==='owner')r.db.seed('active-session:u4','replacement',time+86400000);if(change==='release')await textbookAccess({...r.env,TEXTBOOK_RELEASE_STAGE:'v3',TEXTBOOK_RELEASE_EPOCH:String(epoch+1)},'u4',time);if(change==='expiry')r.db.seed('active-session:u4','owner-u4',time-1);});
  const response=await call({...r,env:{...r.env,AUTH_DB:hook}},'u4','POST',body,{now:()=>at});
  ok(hook.fired,'actual final marker SQL race fired '+change);ok(response.status===409&&!r.db.get(key('u4')),'final SQL prevents '+change+' race write');
 }
 {const r=fixture();await call(r,'u4','POST');const hook=hooked(r.db,()=>r.db.seed('active-session:u4','replacement',time+86400000),true);const response=await call({...r,env:{...r.env,AUTH_DB:hook}});ok(hook.fired&&response.status===409&&!Object.hasOwn(await response.json(),'items'),'owner loss during read does not return stored rows');}
 {const r=fixture();r.env={...r.env,TEXTBOOK_RELEASE_STAGE:undefined,TEXTBOOK_RELEASE_EPOCH:undefined,SUBSCRIPTION_PREVIEW:'1'};r.db.seed('plan:u4',JSON.stringify({plan:'pro',start:time-10000,end:time+86400000,revision:2,next:null}),0);ok((await call(r,'u4','POST')).ok,'legacy production caller supports explicit final lease/contract guard');}
 ok(!f.db.keys().some(k=>/^(?:ai-trial:|openai-operation:|plan-credit-|textbook-ai-quota:)/.test(k)),'marker writes never consume AI quotas or trial budget');
 await writeFile(new URL('./marker-access-result.json',import.meta.url),JSON.stringify({status:'passed',checks,scope:'Three synthetic users, early global-subscription-off, V3 Free read retention/no write, immutable ordinary contracts/grades, CAS replay, actual SQL owner/expiry/cutover races, read race, legacy trusted-parent guard, preview refusal. No live data or AI.'},null,2)+'\n');console.log('Textbook marker release access: '+checks+' checks passed');
}finally{for(const db of databases)db.close();}
