import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {route} from './store.mjs';
const {D1SQLite}=createRequire(import.meta.url)('../../../.claude/verify/d1-sqlite.js');
const origin='https://fixture.test',now=100000,sid='00000000-0000-4000-8000-000000000001',id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const catalog=[{id:'question:math1',subject:'数学',kind:'question'}];let checks=0;function equal(a,b){assert.deepEqual(a,b);checks++;}
function fixture(limits){const db=new D1SQLite();db.seed('active-session:a','owner',now+86400000);db.seed('learning-time-start:a:'+sid,JSON.stringify({id:sid,startedAt:now}));return {db,call:(n,time=now+1000)=>route(new Request(origin+'/learning-time',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({id:id(n),sessionId:sid,spans:[{activity:'question:math1',startOffset:0,endOffset:1000}]})}),{AUTH_DB:db},{uid:'a'},{owner:'owner',catalog,now:time,limits})};}
const count=db=>db.keys().filter(k=>k.startsWith('learning-time:a:')).length;
const quota=db=>db.keys().filter(k=>k.startsWith('learning-time-budget:a:')).map(k=>JSON.parse(db.get(k).v).n);
{
 const {db,call}=fixture({perMinute:1,capacity:10});const results=await Promise.all([call(2),call(3)]);equal(results.map(r=>r.status).sort(),[200,429]);equal(count(db),1);equal(quota(db),[1]);
 const success=results[0].status===200?2:3;equal((await call(success)).status,200);equal(quota(db),[1]);equal((await call(4,now+61000)).status,200);equal(count(db),2);db.close();
}
{
 const {db,call}=fixture({perMinute:20,capacity:1});equal((await call(2)).status,200);equal((await call(3)).status,429);equal(count(db),1);equal(quota(db),[1]);equal((await call(2)).status,200);equal(quota(db),[1]);db.close();
}
{
 const {db,call}=fixture({perMinute:20,capacity:10});db.failBatchAt=1;equal((await call(2)).status,503);equal(count(db),0);equal(quota(db),[]);db.failBatchAt=-1;equal((await call(2)).status,200);equal(quota(db),[1]);db.close();
}
{
 const {db,call}=fixture({perMinute:20,capacity:10});db.beforeBatch=()=>{db.seed('active-session:a','new-owner',now+86400000);};equal((await call(2)).status,409);equal(count(db),0);equal(quota(db),[]);db.close();
}
{
 const {db,call}=fixture({perMinute:20,capacity:10});let committed=false,failed=false;db.beforeBatch=()=>{committed=true;};const original=db.prepare.bind(db);db.prepare=sql=>{if(committed&&!failed&&sql.startsWith('SELECT v FROM auth_kv WHERE k=? AND EXISTS')){failed=true;throw Error('receipt lost');}return original(sql);};
 equal((await call(2)).status,503);equal(count(db),1);equal(quota(db),[1]);equal((await call(2)).status,200);equal(count(db),1);equal(quota(db),[1]);db.close();
}
{
 const {db}=fixture({perMinute:20,capacity:10}),key='learning-time-start-budget:a:'+Math.floor((now+32400000)/86400000);
 db.seed(key,JSON.stringify({n:95,nonce:'fixture'}),now+86400000);
 const start=n=>route(new Request(origin+'/learning-time-start',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({id:id(n)})}),{AUTH_DB:db},{uid:'a'},{owner:'owner',catalog,now});
 const responses=await Promise.all([start(2),start(3)]);equal(responses.map(r=>r.status).sort(),[200,429]);equal(JSON.parse(db.get(key).v).n,96);
 const winner=responses[0].status===200?2:3;equal((await start(winner)).status,200);equal(JSON.parse(db.get(key).v).n,96);db.close();
}
{
 const {db}=fixture({perMinute:20,capacity:10}),key='learning-time-start-budget:a:'+Math.floor((now+32400000)/86400000);db.failBatchAt=1;
 const response=await route(new Request(origin+'/learning-time-start',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({id:id(2)})}),{AUTH_DB:db},{uid:'a'},{owner:'owner',catalog,now});
 equal(response.status,503);equal(db.get(key),null);equal(db.get('learning-time-start:a:'+id(2)),null);db.close();
}
console.log('Timeline limits candidate: '+checks+' checks passed; actual SQLite concurrency, quota/capacity, atomic rollback, lost receipt replay, bounded start creation and stale owner; no network');
