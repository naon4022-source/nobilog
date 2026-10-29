import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {textbookInkRoute} from '../../../../cf-worker/src/textbook-ink.mjs';
import {planStatus,planRoute} from '../../../../cf-worker/src/plans.mjs';
import {textbookAnnotationsRoute} from '../../../../cf-worker/src/textbook-annotations.mjs';
const require=createRequire(import.meta.url),{D1SQLite}=require('../../../../.claude/verify/d1-sqlite.js'),F=require('../../../../cf-worker/src/textbook-ink-format.cjs');
const db=new D1SQLite(),time=Date.now(),env={AUTH_DB:db,APP_ORIGIN:'https://fixture.test',SUBSCRIPTION_PREVIEW:'1',PREVIEW_PLAN_ACCOUNTS:'1'};
let checks=0;const eq=(a,b)=>{assert.deepEqual(a,b);checks++;},ok=v=>{assert(v);checks++;};
const owner=uid=>'synthetic-owner-'+uid;
for(const uid of ['u1','u2','u4','p_free','p_mini','p_standard','p_pro','p_unlimit','u3'])db.seed('active-session:'+uid,owner(uid),time+3600000);
const body={book:'math1',anchor:'a'.repeat(64),quote:'合成の図',revision:0,doc:F.empty()};body.doc.strokes=[{tool:'pen',color:F.COLORS[0],size:4,points:[[0,0,512],[9000,7000,800]]}];
const call=(uid,method='GET',b=null,query='?book=math1',extra={},headers={})=>textbookInkRoute(new Request('https://fixture.test/textbook-ink'+query,{method,headers:{Origin:env.APP_ORIGIN,'Content-Type':'application/json',...headers},...(b!==null?{body:typeof b==='string'?b:JSON.stringify(b)}:{})}),{...env,...extra},uid?{uid}:null,{owner:uid?owner(uid):null,now:()=>time,capacity:2});
const post=(uid,b,extra={})=>call(uid,'POST',b,'',extra);
function interceptWrite(action){let fired=false;return {get fired(){return fired;},prepare(sql){let statement=db.prepare(sql),args=[];const wrap=()=>({bind(...values){args=values;statement=statement.bind(...values);return wrap();},async first(col){if(!fired&&sql.includes('RETURNING v')&&sql.includes('EXISTS')&&args.some(v=>typeof v==='string'&&v.startsWith('textbook-ink:'))){fired=true;action();}return statement.first(col);},all(){return statement.all();},run(){return statement.run();},_run(){return statement._run();}});return wrap();},batch:s=>db.batch(s)};}
try{
 eq(await readFile(new URL('../../../../site-assets/textbook-ink-format.js',import.meta.url),'utf8'),await readFile(new URL('../../../../cf-worker/src/textbook-ink-format.cjs',import.meta.url),'utf8'));
 eq((await call(null)).status,401);eq((await call('u3')).status,403);eq((await call('p_pro','GET',null,'?book=math1',{SUBSCRIPTION_PREVIEW:'0'})).status,404);eq((await call('p_pro','GET',null,'?book=math1',{AUTH_DB:null})).status,503);
 eq((await call('p_pro','GET',null,'?book=math1',{PREVIEW_PLAN_ACCOUNTS:'0'})).status,403);
 for(const q of ['','?book=math1&uid=u1','?book=math1&book=history','?book=bad','?book=math1&anchor=../x','?book=math1&anchor='])eq((await call('p_pro','GET',null,q)).status,400);
 eq((await call('p_pro','PUT',null,'')).status,405);eq((await call('p_pro','POST',body,'?book=math1')).status,400);
 eq((await call('p_pro','POST',body,'',{}, {Origin:'https://wrong.test'})).status,403);eq((await call('p_pro','POST',body,'',{}, {'Content-Type':'text/plain'})).status,415);
 eq((await post('p_pro','{')).status,400);eq((await post('p_pro','x'.repeat(360001))).status,400);
 const invalid=[{...body,uid:'u1'},{...body,revision:-1},{...body,quote:''},{...body,doc:{...body.doc,width:Infinity}},{...body,doc:{...body.doc,background:{src:'https://outside.test/a.svg',sha256:'a'.repeat(64)}}},{...body,doc:{...body.doc,background:{src:'/textbook-book-history-a.svg',sha256:'a'.repeat(64)}}},{...body,doc:{...body.doc,strokes:[{...body.doc.strokes[0],color:'url(javascript:x)'}]}},{...body,doc:{...body.doc,strokes:[{...body.doc.strokes[0],points:[[10001,0,512]]}]}},{...body,doc:{...body.doc,strokes:[{...body.doc.strokes[0],points:Array(12001).fill([0,0,512])}]}},{...body,doc:{...body.doc,strokes:Array(513).fill(body.doc.strokes[0])}}];
 for(const b of invalid)eq((await post('p_pro',b)).status,400);
 for(const uid of ['p_free','p_mini','p_standard'])eq((await post(uid,body)).status,403);
 const u4=await planStatus(env,'u4',time);eq(u4.plan,'free');eq(u4.features.annotations,false);eq((await call('u4')).status,200);eq((await post('u4',body)).status,403);
 db.seed('plan:u4',JSON.stringify({plan:'pro',start:time-10000,end:null,revision:2,next:null}));
 for(const uid of ['u1','u2','u4']){
  if(uid==='u2')db.seed('plan:u2',JSON.stringify({plan:'pro',start:time-10000,end:null,revision:2,next:null}));
  const first=await post(uid,body);eq(first.status,200);eq(first.headers.get('Cache-Control'),'no-store');const saved=(await first.json()).item;ok(F.rowValid(saved,'math1'));eq(saved.revision,1);
  const replay=await post(uid,body);eq(replay.status,200);const retry=await replay.json();eq(retry.cached,true);eq(retry.item,saved);
 }
 const note={book:'science1',anchor:'e'.repeat(64),quote:'合成教材',color:'blue',note:'そうた用の合成メモ',revision:0};
 eq((await textbookAnnotationsRoute(new Request('https://fixture.test/textbook-annotations',{method:'POST',headers:{Origin:env.APP_ORIGIN,'Content-Type':'application/json'},body:JSON.stringify(note)}),env,{uid:'u4'})).status,200);
 const ownNote=await(await textbookAnnotationsRoute(new Request('https://fixture.test/textbook-annotations?book=science1'),env,{uid:'u4'})).json();eq(ownNote.items.length,1);eq(ownNote.items[0].note,note.note);
 eq((await(await textbookAnnotationsRoute(new Request('https://fixture.test/textbook-annotations?book=science1'),env,{uid:'u1'})).json()).items,[]);
 eq((await (await call('p_pro','GET',null,'?book=math1&anchor='+body.anchor)).json()).item,null);
 const list=await (await call('u4')).json();eq(list.items.length,1);ok(!Object.hasOwn(list.items[0],'doc'));eq(list.items[0].quote,body.quote);
 const race=await Promise.all(['A','B'].map(quote=>post('u4',{...body,revision:1,quote})));eq(race.map(r=>r.status).sort(),[200,409]);
 const current=(await (await call('u4','GET',null,'?book=math1&anchor='+body.anchor)).json()).item;eq(current.revision,2);
 db.seed('plan:u4',JSON.stringify({plan:'free',start:time-10000,end:null,revision:3,next:null}));
 const downgraded=await (await call('u4','GET',null,'?book=math1&anchor='+body.anchor)).json();eq(downgraded.item,current);eq(downgraded.writable,false);eq((await post('u4',{...body,revision:2})).status,403);
 eq((await post('p_pro',{...body,anchor:'b'.repeat(64)})).status,200);eq((await post('p_pro',{...body,anchor:'c'.repeat(64)})).status,200);eq((await post('p_pro',{...body,anchor:'d'.repeat(64)})).status,409);eq((await post('p_pro',{...body,book:'history',doc:F.empty()})).status,200);
 const firstKey='textbook-ink:u1:math1:'+body.anchor,unchanged=db.get(firstKey).v;
 const revoke=interceptWrite(()=>db.seed('active-session:u1','another-synthetic-owner',time+3600000));
 eq((await post('u1',{...body,revision:1,quote:'not saved'}, {AUTH_DB:revoke})).status,409);ok(revoke.fired);eq(db.get(firstKey).v,unchanged);
 db.seed('active-session:u1',owner('u1'),time+3600000);
 const reduce=interceptWrite(()=>db.seed('plan:u1',JSON.stringify({plan:'free',start:time-10000,end:null,revision:2,next:null})));
 eq((await post('u1',{...body,revision:1,quote:'not saved'}, {AUTH_DB:reduce})).status,409);ok(reduce.fired);eq(db.get(firstKey).v,unchanged);
 const admin=await planRoute(new Request('https://fixture.test/admin/plans'),env,{uid:'u1'});eq(admin.status,200);ok(!(await admin.json()).people.some(x=>x.uid==='u4'));
 const report={status:'passed',checks,scope:'real isolated SQLite; exact production routes/format; three users including legacy marker/memo, CAS/replay, plan/lease revocation, limits and read-only downgrade; no real records/network',routeInvocation:'Direct isolated route; actual index adapter/book integration covered separately'};
 await writeFile(new URL('api-result.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log('Textbook handwriting API:',checks,'isolated checks passed');
}finally{db.close();}
