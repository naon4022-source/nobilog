// Actual index.html/menu/settings/entry/bundle with detached main Worker data.
// No real login, grading, problem start, microphone or external network.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import worker from '../../../cf-worker/src/index.js';
import {createInvalidationHub} from './invalidation-hub.mjs';
const require=createRequire(import.meta.url),{D1SQLite}=require('../../../.claude/verify/d1-sqlite.js'),{chromium}=require('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,'../../..'),assets=path.join(root,'site-assets');
const types={'.html':'text/html;charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
 const p=new URL(req.url,'http://localhost').pathname;
 try{
  const file=p==='/'||p==='/index.html'?path.join(root,'index.html'):path.resolve(assets,'.'+decodeURIComponent(p));
  if(file!==path.join(root,'index.html')&&!file.startsWith(assets+path.sep)){res.writeHead(403);res.end();return;}
  const bytes=await fs.readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(bytes);
 }catch(_){res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port,images=path.join(here,'main-browser-images');await fs.mkdir(images,{recursive:true});
const browser=await chromium.launch({headless:true});let checks=0,blocked=0;const realFetch=globalThis.fetch;let outbound=0;
globalThis.fetch=async()=>{outbound++;throw Error('No external server fetch');};
try{
 for(const width of [320,390,820,1280]){
  const db=new D1SQLite(),token='synthetic_main_ui_session',owner=createHash('sha256').update(token).digest('base64url'),hub=new Map(),errors=[];
  db.seed('session:'+token,JSON.stringify({uid:'u1',name:'検証の旅人',provider:'synthetic'}),Date.now()+3600000);db.seed('active-session:u1',owner,Date.now()+3600000);
  const env={AUTH_DB:db,APP_ORIGIN:base,BOARD:{get:async()=>null},COOP_STORY_EVENTS:{idFromName:id=>id,get:id=>{if(!hub.has(id))hub.set(id,createInvalidationHub());return hub.get(id);}}};
  const context=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block'}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.dismiss());
  await page.route('**/*',async route=>{
   const req=route.request(),url=new URL(req.url());if(url.origin===base)return route.continue();
   if(url.hostname.endsWith('.workers.dev')){
    if(url.pathname.startsWith('/coop-story/')){
     const headers=new Headers(await req.allHeaders());headers.set('Origin',base);
     const response=await worker.fetch(new Request(req.url(),{method:req.method(),headers,...(['GET','HEAD','OPTIONS'].includes(req.method())?{}:{body:req.postData()||''})}),env,{waitUntil:()=>{}});
     let bytes;if(response.headers.get('Content-Type')?.startsWith('text/event-stream')){const reader=response.body.getReader();bytes=(await reader.read()).value||new Uint8Array();await reader.cancel();}else bytes=new Uint8Array(await response.arrayBuffer());
     return route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:Buffer.from(bytes)});
    }
    const allowed={'Access-Control-Allow-Origin':base,'Access-Control-Allow-Headers':'Authorization,Content-Type','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Content-Type':'application/json'};
    if(req.method()==='OPTIONS')return route.fulfill({status:204,headers:allowed});
    if(['/auth/heartbeat','/learning-presence'].includes(url.pathname))return route.fulfill({status:200,headers:allowed,body:'{"ok":true}'});
    return route.fulfill({status:503,headers:allowed,body:'{"error":"synthetic_unavailable"}'});
   }
   blocked++;return route.abort();
  });
  try{
   await page.goto(base+'/?demo=1');await page.waitForFunction(()=>typeof switchView==='function'&&currentUserId==='u3');
   await page.evaluate(()=>switchView('coop'));assert.notEqual(await page.locator('.view.active').getAttribute('id'),'view-coop');checks++;
   await page.evaluate(token=>{window.NobiMaterialEntry?.stop();clearInterval(authLeaseTimer);clearInterval(presenceTimer);currentUserId='u1';currentUser={id:'u1',name:'検証の旅人',trial:false};recordStorage.setItem(AUTH_KEY,token);serverBootReady=true;authLeaseResume();applyUserNav();},token);
   const menu=page.getByRole('button',{name:'メニュー',exact:true});if(await menu.getAttribute('aria-expanded')!=='true')await menu.click();await page.locator('#nav-coop').click();
   await page.getByRole('button',{name:'男性の体で始める',exact:true}).waitFor();await page.getByRole('button',{name:'男性の体で始める',exact:true}).click();
   await page.getByRole('button',{name:'仲間を招待する部屋を作る',exact:true}).click();await page.getByRole('button',{name:'全員で出発する',exact:true}).waitFor();
   assert.equal(await page.getByRole('button',{name:'全員で出発する',exact:true}).isEnabled(),false);checks++;
   const titleSize=()=>page.locator('#coop-story-host h2').evaluate(el=>Math.max(...[el,...el.querySelectorAll('*')].map(n=>parseFloat(getComputedStyle(n).fontSize))));
   const beforeText=await titleSize();await page.evaluate(()=>{appSettingChange('largeText',true);appSettingChange('reduceMotion',true);});await page.waitForTimeout(300);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);checks++;
   assert.ok(await titleSize()>=beforeText*1.15,'the real text setting enlarges the cooperation title');checks++;
   assert.equal(await page.locator('.nobi-coop').evaluate(el=>{const probe=document.createElement('button');probe.className='nobi-coop-tap';probe.textContent='style probe';el.append(probe);const stopped=parseFloat(getComputedStyle(probe).transitionDuration)===0;probe.remove();return stopped;}),true,'the real motion setting also stops the attack button transition');checks++;
   await page.screenshot({path:path.join(images,'lobby-'+width+'.png'),fullPage:true});
   await page.evaluate(()=>authLeasePause({checking:true}));await page.waitForTimeout(2200);assert.equal(await page.locator('#coop-story-host h2').count(),1);await page.evaluate(()=>authLeaseResume());checks++;
   await page.evaluate(()=>switchView('settings'));assert.equal(await page.locator('#coop-story-host').evaluate(el=>el.childElementCount),0);checks++;
   await page.evaluate(()=>switchView('coop'));await page.getByRole('button',{name:'招待コードを作り直す',exact:true}).waitFor();await page.getByRole('button',{name:'招待コードを作り直す',exact:true}).click();await page.getByText(/^招待コード：[A-Z2-7]{8}$/).waitFor();checks++;
   await page.getByRole('button',{name:'この部屋を閉じる',exact:true}).click();await page.getByRole('button',{name:'仲間を招待する部屋を作る',exact:true}).waitFor();checks++;
   assert.equal(db.keys().some(k=>k.startsWith('material-attempt:')||k.startsWith('coop-story-clear:')),false);checks++;
   assert.deepEqual(errors,[]);checks++;
  }finally{await context.close();db.close();}
 }
 assert.equal(outbound,0);
 console.log('V3 main UI: '+checks+' checks passed at 320/390/820/1280; real menu, trial gate, synthetic authenticated Worker/profile/room, solo block, settings, temporary lease check, navigation teardown/recovery, renewed invitation and close; ordinary attempts/clears 0, outbound 0 ('+blocked+' external browser requests blocked).');
}finally{globalThis.fetch=realFetch;await browser.close();await new Promise(resolve=>server.close(resolve));}
