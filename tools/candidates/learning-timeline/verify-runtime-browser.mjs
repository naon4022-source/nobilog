import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const runtime=await readFile(new URL('runtime-browser.js',import.meta.url),'utf8'),storage=await readFile(new URL('storage.js',import.meta.url),'utf8');
const server=createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end('<meta charset="utf-8"><button id="touch">touch</button><script>'+storage+'</script><script>'+runtime+'</script>');});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser,n=0;const eq=(a,b)=>{assert.deepEqual(a,b);n++;};
try{
 browser=await chromium.launch({headless:true});
 for(const width of [390,1280]){
  const context=await browser.newContext({viewport:{width,height:844}}),page=await context.newPage();
  await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());await page.goto('http://127.0.0.1:'+server.address().port);await page.bringToFront();
  await page.evaluate(async()=>{window.at=100000;window.actor=true;window.fail=true;window.view='textbook:math1';window.storage=await NobiLearningTimeStorage.open('synthetic');window.sends=[];window.starts=0;
   window.runtime=NobiLearningTimeRuntime.create({uid:'synthetic',same:()=>actor,storage,send:async p=>{sends.push(structuredClone(p));if(fail)throw Error('lost response');return {id:p.id,acceptedAt:100000};},start:async p=>{starts++;return {session:{id:p.id,startedAt:at},serverTime:at};},catalog:['textbook:math1'],newId:()=>crypto.randomUUID(),now:()=>at,activity:()=>view,document,window,setInterval:()=>1,clearInterval:()=>{}});
  });await page.waitForFunction(()=>runtime.state().ready);
  await page.locator('#touch').click();await page.evaluate(async()=>{at+=1000;runtime.tick();await runtime.flush();});
  eq(await page.evaluate(()=>(sends[0].spans[0].endOffset-sends[0].spans[0].startOffset)),1000);
  eq(await page.evaluate(async()=>(await storage.list('synthetic',20)).length),1);
  const id=await page.evaluate(()=>sends[0].id);await page.reload();
  await page.evaluate(async()=>{window.storage=await NobiLearningTimeStorage.open('synthetic');window.sent=[];});
  // 再読込後もruntimeの依存outboxを通して既存の永続キューを送る。
  await page.evaluate(async()=>{window.at=200000;window.runtime=NobiLearningTimeRuntime.create({uid:'synthetic',same:()=>true,storage,send:async p=>{sent.push(p);return {id:p.id,acceptedAt:200000};},start:async p=>({session:{id:p.id,startedAt:at},serverTime:at}),catalog:['textbook:math1'],newId:()=>crypto.randomUUID(),now:()=>at,activity:()=> 'textbook:math1',document,window,setInterval:()=>1,clearInterval:()=>{}});});await page.waitForFunction(()=>runtime.state().ready);await page.evaluate(()=>runtime.flush());
  eq(await page.evaluate(()=>sent[0].id),id);eq(await page.evaluate(async()=>(await storage.list('synthetic',20)).length),0);
  await page.evaluate(async()=>{
   await runtime.stop();window.actor=true;window.blockSave=true;window.at=300000;
   window.retryRuntime=NobiLearningTimeRuntime.create({uid:'synthetic',same:()=>actor,storage:{put:async(...args)=>{if(blockSave)throw Error('synthetic storage failure');return storage.put(...args);},list:(...args)=>storage.list(...args),remove:(...args)=>storage.remove(...args)},send:async()=>{throw Error('must not send after owner changed');},start:async p=>({session:{id:p.id,startedAt:at},serverTime:at}),catalog:['textbook:math1'],newId:()=>crypto.randomUUID(),now:()=>at,activity:()=> 'textbook:math1',document,window,setInterval:()=>1,clearInterval:()=>{}});
  });await page.waitForFunction(()=>retryRuntime.state().ready);await page.locator('#touch').click();
  await page.evaluate(async()=>{at+=1000;retryRuntime.tick();actor=false;window.stopReply=await retryRuntime.stop();});
  eq(await page.evaluate(()=>!!stopReply.error),true);
  eq(await page.evaluate(async()=>(await storage.list('synthetic',20)).length),0);
  await page.evaluate(async()=>{blockSave=false;window.retryReply=await retryRuntime.stop();});
  eq(await page.evaluate(()=>retryReply.retired),true);
  eq(await page.evaluate(async()=>(await storage.list('synthetic',20)).length),1);
  await page.evaluate(()=>storage.close());
  await page.evaluate(async()=>{
   window.clientActor='client-a';window.clientRequests=[];window.clientTimers=new Map();window.clientSerial=0;at=400000;
   window.client=NobiLearningTimeClient.create({context:()=>{const owner=clientActor;return owner?{uid:owner,same:()=>clientActor===owner,ready:()=>true}:null;},openStorage:uid=>NobiLearningTimeStorage.open(uid),request:async(path,body)=>{clientRequests.push({owner:clientActor,path});return path==='/learning-time-start'?{session:{id:body.id,startedAt:at},serverTime:at}:{id:body.id,acceptedAt:at};},activity:()=> 'textbook:math1',catalog:[{id:'textbook:math1',subject:'数学',kind:'textbook'}],document,window,now:()=>at,newId:()=>crypto.randomUUID(),setInterval:f=>{const id=++clientSerial;clientTimers.set(id,f);return id;},clearInterval:id=>clientTimers.delete(id)});
   await client.refresh();
  });await page.waitForFunction(()=>clientRequests.length===1);await page.locator('#touch').click();
  await page.evaluate(async()=>{at+=1000;for(const f of [...clientTimers.values()])f();clientActor='client-b';await client.refresh();});
  await page.waitForFunction(()=>clientRequests.some(r=>r.owner==='client-b'));
  eq(await page.evaluate(async()=>{const old=await NobiLearningTimeStorage.open('client-a');try{return (await old.list('client-a',20)).length;}finally{old.close();}}),1);
  eq(await page.evaluate(()=>clientRequests.filter(r=>r.owner==='client-b').every(r=>r.path==='/learning-time-start')),true);
  await page.evaluate(()=>client.stop());eq(await page.evaluate(()=>clientTimers.size),0);
  const monthly=await page.evaluate(async()=>{
   const t=Date.parse('2026-10-01T00:00:00+09:00'),serverTime=Date.parse('2026-11-01T00:00:00+09:00');
   let pages=0,fail=false,owner=true;
   const rows=Array.from({length:1000},(_,i)=>{const id='00000000-0000-4000-8000-'+String(i+1).padStart(12,'0');return {id,acceptedAt:serverTime,content:'private metadata',spans:Array.from({length:50},(_,j)=>({id:id+':'+j,activity:'textbook:math1',kind:'textbook',subject:'数学',start:t+(i*50+j)*5000,end:t+(i*50+j+1)*5000,acceptedAt:serverTime}))};});
   const view=NobiLearningTimeMonth.create({same:()=>owner,ready:()=>true,catalog:[{id:'textbook:math1',kind:'textbook',subject:'数学'}],request:async path=>{if(fail)throw Error('fake offline');pages++;const cursor=path.includes('?')?new URL('http://fixture'+path).searchParams.get('cursor'):null,offset=cursor?rows.findIndex(r=>r.id===cursor)+1:0,items=rows.slice(offset,offset+200);return {items,next:offset+200<rows.length?items.at(-1).id:null,serverTime};}});
   const summary=await view.load('2026-10');fail=true;let rejected=false;try{await view.load('2026-10');}catch(_){rejected=true;}
   const retained=view.state().snapshot.totalMs===summary.totalMs;owner=false;const cleared=view.state().snapshot===null;view.dispose();
   return {pages,totalMs:summary.totalMs,matched:summary.matchedSpans,days:Object.keys(summary.days).length,rejected,retained,cleared,privateLeak:JSON.stringify(summary).includes('private metadata')};
  });
  eq(monthly,{pages:5,totalMs:250000000,matched:50000,days:31,rejected:true,retained:true,cleared:true,privateLeak:false});
  await context.close();
 }
 console.log('Timeline runtime browser candidate: '+n+' checks passed; actual DOM events, real IndexedDB, fixed-ID resend across reload, failed retirement/retry, client owner replacement and cleanup, 390/1280px, no external API');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
