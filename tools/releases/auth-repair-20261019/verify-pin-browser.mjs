// Synthetic PIN, synthetic Turnstile, actual frontend + Worker, no live API.
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {createServer} from 'node:http';
import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{D1SQLite}=require('../../../.claude/verify/d1-sqlite.js');
const {chromium}=require('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=new URL('./',import.meta.url),base=new URL('candidate/pages/',root),source=await readFile(new URL('candidate/cf-worker/src/index.js',root),'utf8');
const M=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const server=createServer(async(req,res)=>{const name=new URL(req.url,'http://local').pathname.slice(1)||'index.html';if(!/^[a-z0-9.-]+$/.test(name)){res.writeHead(404).end();return;}try{const b=await readFile(new URL(name,base));res.writeHead(200,{'Content-Type':name.endsWith('.js')?'text/javascript':name.endsWith('.json')?'application/json':name.endsWith('.html')?'text/html':'application/octet-stream'}).end(b);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const app='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true}),originalFetch=globalThis.fetch;let checks=0;
const ok=(v,label)=>{assert.ok(v,label);checks++;};
try{
 for(const width of [390,1440]){
  const db=new D1SQLite(),kv=new Map(),env={AUTH_DB:db,BOARD:{get:async k=>kv.get(k)||null,put:async(k,v)=>kv.set(k,v),delete:async k=>kv.delete(k)},APP_ORIGIN:'https://nobilog.pages.dev',PIN_PEPPER:'synthetic-pepper',TURNSTILE_SECRET:'synthetic-secret'};
  for(const [name,pin]of [['NAO','synthetic-nao'],['RIRAN','synthetic-riran'],['SOUTA','0000']])env['LEGACY_'+name+'_PIN_HASH']=createHmac('sha256',env.PIN_PEPPER).update(pin).digest('base64url');
  let passChallenge=false,legacyCalls=0;
  globalThis.fetch=async url=>{assert.ok(String(url).includes('/siteverify'));return Response.json({success:passChallenge,hostname:'nobilog.pages.dev',action:'legacy_login',challenge_ts:new Date().toISOString()});};
  const page=await browser.newPage({viewport:{width,height:900},serviceWorkers:'block'});page.setDefaultTimeout(15000);
  // A late synthetic-app alert may arrive while closing the fixture. Handle it
  // explicitly so Chromium's automatic dismissal cannot reject after target close.
  page.on('dialog',dialog=>{void dialog.dismiss().catch(()=>{});});
  await page.addInitScript(()=>{window.tsOptions=null;window.tsResets=0;window.turnstile={render:(selector,options)=>{window.tsOptions=options;return 'synthetic-widget';},reset:()=>{window.tsResets++;}};});
  await page.route('**/*',async route=>{
   const r=route.request(),u=new URL(r.url());if(u.hostname==='127.0.0.1')return route.continue();
   if(!u.hostname.endsWith('workers.dev'))return route.abort();
   if(u.pathname==='/auth/legacy')legacyCalls++;
   const response=await M.default.fetch(new Request(r.url(),{method:r.method(),headers:await r.allHeaders(),...(['GET','HEAD'].includes(r.method())?{}:{body:r.postData()||''})}),env,{waitUntil:p=>p.catch(()=>{})});
   return route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:Buffer.from(await response.arrayBuffer())});
  });
  try{
   await page.goto(app+'/',{waitUntil:'load'});await page.evaluate(()=>authShowLegacy());await page.waitForFunction(()=>!!window.tsOptions);
   ok(await page.evaluate(()=>tsOptions.action==='legacy_login'&&tsOptions.sitekey===TURNSTILE_LOCAL_TEST_KEY),'localhost official test key and correct action');
   await page.locator('#login-pin').fill('0000');await page.evaluate(()=>tryLogin());ok(legacyCalls===0,'missing challenge blocks Worker request');
   await page.evaluate(()=>tsOptions['expired-callback']());ok((await page.locator('#login-err').innerText()).includes('有効時間'),'expiry explains retry');
   await page.evaluate(()=>tsOptions['error-callback']());ok((await page.locator('#login-err').innerText()).includes('やり直す'),'widget error explains retry');
   await page.getByRole('button',{name:'本人確認をやり直す',exact:true}).click();ok(await page.evaluate(()=>tsResets>0),'visible retry resets widget');
   await page.evaluate(()=>{tsOptions.callback('synthetic-old-token-000000');turnstileLoadedAt=Date.now()-300001;});await page.evaluate(()=>tryLogin());ok(legacyCalls===0,'expired local token never submitted');
   await page.evaluate(()=>tsOptions.callback('synthetic-denied-token-000000'));await page.evaluate(()=>tryLogin());
   ok(legacyCalls===1,'actual Worker receives fresh challenge');ok(await page.evaluate(()=>pinFail===0),'challenge rejection does not count as wrong PIN');ok(await page.locator('#login-pin').inputValue()==='0000','challenge failure preserves typed PIN only in form');
   ok(await page.evaluate(()=>currentUserId!=='u4'),'challenge rejection cannot open study');
   passChallenge=true;await page.evaluate(()=>tsOptions.callback('synthetic-approved-token-000000'));await page.evaluate(()=>Promise.all([tryLogin(),tryLogin()]));
   await page.waitForFunction(()=>serverBootReady&&!authLeaseBlocked&&currentUserId==='u4'&&document.getElementById('view-study').classList.contains('active'));
   ok(legacyCalls===2,'double click sends one attempt');ok(await page.locator('#login-pin').inputValue()==='','PIN cleared after success');
   await page.locator('.notice-toast').filter({hasText:'Googleアカウントと連携してください'}).waitFor();ok(true,'PIN lands on study with Google linking notice');
   ok(await page.evaluate(()=>authLegacyTicket===''),'consumed ticket cleared');
   ok(!db.keys().some(k=>k.startsWith('cloud-save:u1')||k.startsWith('cloud-save:u2')),'no writes to other learning accounts');
   console.log('Actual PIN form + fake challenge/Worker passed at width',width);
  }finally{await page.close();db.close();}
 }
 await writeFile(new URL('pin-browser-result.json',root),JSON.stringify({passed:true,checks,widths:[390,1440],realApiCalls:0,realSecretsRead:false,realPinUsed:false},null,2)+'\n');
 console.log('PIN/browser recovery:',checks,'checks passed');
}finally{globalThis.fetch=originalFetch;await browser.close();server.close();}
