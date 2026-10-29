import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{D1SQLite}=require('../../../.claude/verify/d1-sqlite.js');
const {chromium}=require('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=new URL('./',import.meta.url),base=new URL('candidate/pages/',root),source=await readFile(new URL('candidate/cf-worker/src/index.js',root),'utf8');
const M=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const db=new D1SQLite(),kv=new Map([['save:u1',JSON.stringify({v:7,keys:{'u1:appData':'synthetic-protected-nao'}})],['save:u2',JSON.stringify({v:9,keys:{'u2:appData':'synthetic-protected-riran'}})]]);
const protectedBefore=JSON.stringify([...kv.entries()]),env={AUTH_DB:db,BOARD:{get:async k=>kv.get(k)||null,put:async(k,v)=>kv.set(k,v),delete:async k=>kv.delete(k)},APP_ORIGIN:'https://nobilog.pages.dev'};
db.seed('session:synthetic-souta-flow',JSON.stringify({uid:'u4',name:'そうた',provider:'test'}),Date.now()+3600000);
const server=createServer(async(req,res)=>{const name=new URL(req.url,'http://local').pathname.slice(1)||'index.html';if(!/^[a-z0-9.-]+$/.test(name)){res.writeHead(404).end();return;}try{const b=await readFile(new URL(name,base));res.writeHead(200,{'Content-Type':name.endsWith('.js')?'text/javascript':name.endsWith('.json')?'application/json':name.endsWith('.html')?'text/html':'application/octet-stream'}).end(b);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true});let checks=0,requests=0;const ok=(v,m)=>{assert.ok(v,m);checks++;};
const dialogTasks=new Set(),dialogFailures=[];let closing=false;
const drainDialogs=async()=>{while(dialogTasks.size)await Promise.all([...dialogTasks]);};
try{
 const page=await browser.newPage({viewport:{width:390,height:900}});
 // Await default-equivalent dialog handling before destroying the target.
 page.on('dialog',dialog=>{
  const task=(dialog.type()==='beforeunload'?dialog.accept():dialog.dismiss()).catch(error=>{dialogFailures.push({duringClose:closing,message:String(error?.message||error)});}).finally(()=>dialogTasks.delete(task));
  dialogTasks.add(task);
 });
 await page.route('**/*',async route=>{
  const original=route.request(),url=new URL(original.url());
  if(url.hostname==='127.0.0.1')return route.continue();
  if(!url.hostname.endsWith('workers.dev'))return route.abort();
  requests++;
  const headers=await original.allHeaders();
  const response=await M.default.fetch(new Request(original.url(),{method:original.method(),headers,...(['GET','HEAD'].includes(original.method())?{}:{body:original.postData()||''})}),env,{waitUntil:p=>p.catch(()=>{})});
  return route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:Buffer.from(await response.arrayBuffer())});
 });
 const url='http://127.0.0.1:'+server.address().port+'/';
 await page.goto(url,{waitUntil:'load'});
 await page.evaluate(async()=>{recordStorage.setItem(AUTH_KEY,'synthetic-souta-flow');await completeLogin(APP_USERS.find(u=>u.id==='u4'));});
 await page.waitForFunction(()=>serverBootReady&&!authLeaseBlocked&&currentUserId==='u4');
 const first=await page.evaluate(()=>({cash:mLoad().cash,base:M_EMPTY().cash,grants:mLoad().grants,overlay:document.getElementById('login-overlay').classList.contains('on')}));
 ok(!first.overlay,'normal login opens app');
 ok(first.cash===first.base+1000000,'real money loader/save applies one million');
 ok(first.grants.filter(id=>id==='20261018-souta-start-cash').length===1,'one grant in real money record');
 await page.waitForFunction(()=>!cloudState.busy);
 await page.evaluate(()=>cloudPush());
 await page.waitForFunction(()=>!cloudState.busy&&!cloudDirty(),null,{timeout:10000});
 await page.evaluate(()=>{if(cloudDirty()||cloudState.busy)throw Error('synthetic save not acknowledged');});
 ok(db.keys().some(k=>k.startsWith('cloud-save:u4')),'real Worker SQL stores own record');
 await page.reload({waitUntil:'load'});
 await page.waitForFunction(()=>serverBootReady&&!authLeaseBlocked&&currentUserId==='u4');
 const second=await page.evaluate(()=>({cash:mLoad().cash,grants:mLoad().grants}));
 ok(second.cash===first.cash,'normal session restore does not regrant');
 ok(second.grants.filter(id=>id==='20261018-souta-start-cash').length===1,'grant survives actual server reload');
 ok(JSON.stringify([...kv.entries()].filter(([k])=>k==='save:u1'||k==='save:u2'))===protectedBefore,'both other snapshots byte-for-byte preserved');
 ok(!db.keys().some(k=>k.startsWith('cloud-save:u1')||k.startsWith('cloud-save:u2')),'no D1 migration or write for other accounts');
 await drainDialogs();
 ok(dialogFailures.length===0,'dialog handling completes before teardown');
 closing=true;await page.close();await drainDialogs();
 ok(page.isClosed()&&dialogFailures.every(x=>x.duringClose&&/Not attached to an active page/.test(x.message)),'only a detached closed target may end a pending dialog');
 await writeFile(new URL('login-flow-current-result.json',root),JSON.stringify({checks,passed:true,requests,realApiCalls:0,realUserData:false,source:'actual published candidate frontend and Worker, in-memory SQLite and KV'},null,2)+'\n');
 console.log('Souta normal login:',checks,'checks passed; real cloudBoot/grant/save/session restore, memory-only SQL, both other accounts unchanged');
}finally{closing=true;await browser.close();await drainDialogs();server.close();db.close();}
