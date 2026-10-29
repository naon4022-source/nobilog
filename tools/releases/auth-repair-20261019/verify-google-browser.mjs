import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{D1SQLite}=require('../../../.claude/verify/d1-sqlite.js');
const {chromium}=require('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=new URL('./',import.meta.url),base=new URL('candidate/pages/',root),source=await readFile(new URL('candidate/cf-worker/src/index.js',root),'utf8');
const M=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const server=createServer(async(req,res)=>{const name=new URL(req.url,'http://local').pathname.slice(1)||'index.html';if(!/^[a-z0-9.-]+$/.test(name)){res.writeHead(404).end();return;}try{const b=await readFile(new URL(name,base));res.writeHead(200,{'Content-Type':name.endsWith('.js')?'text/javascript':name.endsWith('.json')?'application/json':name.endsWith('.html')?'text/html':'application/octet-stream'}).end(b);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const app='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true}),originalFetch=globalThis.fetch;let checks=0,intercepted=0;
const ok=(v,label)=>{assert.ok(v,label);checks++;};
globalThis.fetch=async url=>{if(String(url).includes('/token'))return Response.json({access_token:'synthetic-only'});if(String(url).includes('/userinfo'))return Response.json({sub:'synthetic-google-choice',name:'Synthetic'});throw Error('unexpected provider request');};
try{
 await mkdir(new URL('screens/',root),{recursive:true});
 for(const round of [1,2])for(const width of [390,1440]){
  const db=new D1SQLite(),kv=new Map([['save:u1','{"v":4,"keys":{"u1:appData":"synthetic-protected"}}']]);
  const env={AUTH_DB:db,BOARD:{get:async k=>kv.get(k)||null,put:async(k,v)=>kv.set(k,v),delete:async k=>kv.delete(k)},APP_ORIGIN:'https://nobilog.pages.dev',GOOGLE_CLIENT_ID:'synthetic-client',GOOGLE_CLIENT_SECRET:'synthetic-only'};
  db.seed('session:synthetic-google-browser',JSON.stringify({uid:'u4',name:'そうた',provider:'pin'}),Date.now()+3600000);
  console.log('Browser round',round,'width',width);
  const page=await browser.newPage({viewport:{width,height:900},serviceWorkers:'block'});page.setDefaultTimeout(20000);page.on('dialog',d=>d.dismiss());
  let choice='cancel',failSave=false,starts=0,delayed=false,releaseStart,started;
  await page.addInitScript(()=>{if(location.hostname==='127.0.0.1')localStorage.setItem('nobilogAuthSession','synthetic-google-browser');});
  await page.route('**/*',async route=>{
   const original=route.request(),url=new URL(original.url());if(url.hostname==='127.0.0.1')return route.continue();
   intercepted++;
   if(url.hostname==='accounts.google.com'){
    const tail=choice==='cancel'?'error=access_denied':'code=synthetic-code';
    const callback='https://nobilog-board.naon4022.workers.dev/auth/callback/google?state='+url.searchParams.get('state')+'&'+tail;
    return route.fulfill({status:200,contentType:'text/html',body:'<script>location.replace('+JSON.stringify(callback)+')</script>'});
   }
   if(!url.hostname.endsWith('workers.dev'))return route.abort();
   if(failSave&&url.pathname==='/save'&&original.method()==='POST')return route.fulfill({status:503,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:'{"error":"synthetic save failure"}'});
   const response=await M.default.fetch(new Request(original.url(),{method:original.method(),headers:await original.allHeaders(),...(['GET','HEAD'].includes(original.method())?{}:{body:original.postData()||''})}),env,{waitUntil:p=>p.catch(()=>{})});
   if(url.pathname==='/auth/link/google'){
    starts++;
    if(delayed){started?.();await new Promise(r=>releaseStart=r);}
   }
   return route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:Buffer.from(await response.arrayBuffer())});
  });
  const ready=async()=>{await page.waitForFunction(()=>typeof serverBootReady!=='undefined'&&serverBootReady&&!authLeaseBlocked&&currentUserId==='u4'&&document.getElementById('view-study')?.classList.contains('active'));await page.waitForTimeout(1600);const install=page.locator('#pwa-overlay.on .pwa-later');if(await install.isVisible())await install.click();};
  const prompt=()=>page.locator('.notice-toast').filter({hasText:'Googleアカウントと連携してください'});
  const openPrompt=async()=>{await prompt().locator('.notice-copy').click();await page.locator('#google-link-go').waitFor({state:'visible'});};
  const go=async()=>{const returned=page.waitForEvent('framenavigated',{predicate:f=>f===page.mainFrame()&&f.url().startsWith(app+'/')&&f.url().includes('#google_link')});await page.locator('#google-link-go').click();await returned;await ready();};
  try{
   await page.goto(app+'/',{waitUntil:'load'});await ready();
   await prompt().waitFor({state:'visible'});
   ok(await prompt().count()===1,'one prompt on study screen');
   ok(await page.evaluate(()=>{const entry=[...noticeToastMap].find(([,n])=>n.googleLink);return !!entry&&!noticeTimers.has(entry[0]);}),'action prompt does not auto disappear');
   const initial=await page.evaluate(()=>({cash:mLoad().cash,grants:mLoad().grants}));
   await page.evaluate(()=>{const s=appSettings();s.toasts=false;recordStorage.setItem(ukey('preferences'),JSON.stringify(s));noticeToastsClear();authGoogleLinkNotice();});
   ok(await prompt().count()===0,'global toast preference respected');
   ok(await page.evaluate(()=>noticeItems().filter(n=>n.googleLink).length)===1,'bell still contains link action');
   await page.evaluate(()=>{const s=appSettings();s.toasts=true;recordStorage.setItem(ukey('preferences'),JSON.stringify(s));authGoogleLinkNotice();});
   await prompt().evaluate(async el=>{await Promise.all(el.getAnimations().map(a=>a.finished.catch(()=>{})));});
   const bounds=await prompt().boundingBox();ok(bounds&&bounds.x>=0&&bounds.x+bounds.width<=width+1,'settled notification entirely within viewport');
   if(round===2)await page.screenshot({path:new URL('screens/google-notice-'+width+'.png',root).pathname,fullPage:true});
   await openPrompt();ok((await page.locator('#game-play').innerText()).includes('そうた'),'modal identifies current account');
   ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'notification/modal fit viewport');
   if(round===2)await page.screenshot({path:new URL('screens/google-modal-'+width+'.png',root).pathname,fullPage:true});
   await page.getByRole('button',{name:'あとで',exact:true}).click();
   ok(starts===0,'later does not start OAuth');
   await page.locator('[onclick="noticeOpen()"]').first().click();
   await page.locator('.notice-list-item').filter({hasText:'Googleアカウントと連携してください'}).click();
   ok(await page.locator('#google-link-go').isVisible(),'bell reopens link modal');
   failSave=true;await page.evaluate(()=>recordStorage.setItem(ukey('wrongNotes'),'[{"q":"synthetic own draft"}]'));
   await page.locator('#google-link-go').click();
   await page.locator('#google-link-status').filter({hasText:'保存または連携の準備を確認できませんでした'}).waitFor();
   ok(starts===0&&page.url().startsWith(app),'failed save blocks Google navigation');
   failSave=false;const gate=page.locator('#session-gate');if(await gate.isVisible())await gate.getByRole('button',{name:'もう一度確認',exact:true}).click();await page.waitForFunction(()=>!authLeaseBlocked&&!cloudState.busy&&!cloudDirty());await page.locator('#google-link-go').waitFor({state:'visible'});ok(await page.locator('#google-link-go').isEnabled(),'connection recovery enables link retry');choice='cancel';await go();
   await page.locator('.notice-toast').filter({hasText:'Googleとの連携をキャンセルしました'}).waitFor();
   ok(await prompt().count()===1,'cancel returns to study with retry prompt');
   ok(!page.url().includes('google_link'),'callback flags removed from address');
   ok(!db.get('identity:google:synthetic-google-choice'),'cancel does not bind identity');
   db.seed('identity:google:synthetic-google-choice','u1',0);choice='success';
   await openPrompt();await go();
   await page.locator('.notice-toast').filter({hasText:'別の利用者と連携済み'}).waitFor();
   ok(db.get('identity:google:synthetic-google-choice').v==='u1','another user Google identity preserved');
   db.db.prepare('DELETE FROM auth_kv WHERE k=?').run('identity:google:synthetic-google-choice');
   await openPrompt();await go();
   await page.locator('.notice-toast').filter({hasText:'Googleアカウントと連携しました'}).waitFor();
   ok(db.get('identity:google:synthetic-google-choice').v==='u4','explicit action links own account');
   ok(await prompt().count()===0,'linked user no longer prompted');
   ok(await page.evaluate(()=>noticeItems().filter(n=>n.googleLink).length)===0,'linked action removed from bell');
   const linked=await page.evaluate(()=>({cash:mLoad().cash,grants:mLoad().grants}));
   ok(linked.cash===initial.cash&&JSON.stringify(linked.grants)===JSON.stringify(initial.grants),'saved money and one-time grant retained across Google round trips');
   await page.reload({waitUntil:'load'});await ready();
   ok(await prompt().count()===0,'second password-session restore suppresses linked prompt');
   ok(kv.get('save:u1')==='{"v":4,"keys":{"u1:appData":"synthetic-protected"}}','other learning snapshot untouched');
   // A late response must not navigate after the current client user/token changes.
   db.db.prepare('DELETE FROM auth_kv WHERE k=?').run('identity:google:synthetic-google-choice');
   await page.reload({waitUntil:'load'});await ready();await openPrompt();
   delayed=true;const seen=new Promise(r=>started=r);await page.locator('#google-link-go').click();await seen;
   await page.evaluate(()=>{currentUserId='u2';currentUser={id:'u2',name:'りらん',provider:'pin'};recordStorage.setItem(AUTH_KEY,'synthetic-other-browser');});
   releaseStart();await page.waitForTimeout(200);delayed=false;
   ok(page.url().startsWith(app)&&starts===4,'late response cannot navigate as another user');
   await page.evaluate(()=>{currentUserId='u4';currentUser={id:'u4',name:'そうた',provider:'pin',googleLinked:false};recordStorage.setItem(AUTH_KEY,'synthetic-google-browser');authGoogleLinkNotice();authGoogleLinkOpen();});
   db.seed('identity:google:synthetic-google-choice','u4',0);
   await page.locator('#google-link-go').click();await page.locator('#google-link-status').filter({hasText:'すでにGoogleアカウントと連携済み'}).waitFor();
   ok(await prompt().count()===0,'already-linked response clears an existing toast too');
   ok(await page.evaluate(()=>noticeItems().filter(n=>n.googleLink).length)===0,'already-linked response clears bell action');
  }catch(error){console.error('Synthetic browser failure:',{round,width,starts,url:page.url(),status:await page.locator('#google-link-status').textContent().catch(()=>null),dirty:await page.evaluate(()=>cloudDirty()).catch(()=>null)});throw error;}finally{await page.close();db.close();}
 }
 await writeFile(new URL('google-browser-result.json',root),JSON.stringify({passed:true,checks,rounds:2,widths:[390,1440],intercepted,realApiCalls:0,realUserData:false},null,2)+'\n');
 console.log('Google notice browser:',checks,'checks passed; two rounds at 390/1440, study prompt/bell/later/save failure/cancel/conflict/success/reload/late-account response; real frontend and memory-only Worker; fake provider only');
}finally{globalThis.fetch=originalFetch;await browser.close();server.close();}
