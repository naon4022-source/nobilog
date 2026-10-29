// Actual reader and current books, isolated localhost only. No learner APIs or storage.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
const {chromium}=createRequire(import.meta.url)('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const here=new URL('./',import.meta.url),root=new URL('../../../',here),assets=new URL('site-assets/',root),hash=b=>createHash('sha256').update(b).digest('hex');
const inputs={};
for(const file of ['textbook-book.js','textbook-book.css','textbook-books.json','textbook-book-kokugo1.json'])inputs[file]=hash(await readFile(new URL(file,assets)));
const html='<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/textbook-book.css"><div id="textbook-app" class="tb-app"></div><script src="/textbook-book.js"></script>';
const types={js:'text/javascript',css:'text/css',json:'application/json',svg:'image/svg+xml',png:'image/png',jpg:'image/jpeg',webp:'image/webp',mp4:'video/mp4'};
const server=createServer(async(req,res)=>{
 const name=decodeURIComponent(new URL(req.url,'http://fixture.invalid').pathname.slice(1));
 if(!name){res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'}).end(html);return;}
 const type=types[name.split('.').pop()];if(!/^[a-zA-Z0-9._-]+$/.test(name)||!type){res.writeHead(404).end();return;}
 try{const bytes=await readFile(new URL(name,assets));res.writeHead(200,{'Content-Type':type,'Content-Length':bytes.length}).end(bytes);}catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port;
let browser,checks=0;const cases=[],errors=[],outside=[],ok=(v,m)=>{assert.ok(v,m);checks++;};
await mkdir(new URL('screens-attempt3/',here));
try{
 browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:390,height:900}});
 await page.addInitScript(()=>{Element.prototype.requestFullscreen=undefined;Element.prototype.webkitRequestFullscreen=undefined;});
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():(outside.push(r.request().url()),r.abort()));
 await page.goto(origin);await page.getByRole('button',{name:'全画面で教科書を開く',exact:true}).click();
 await page.getByRole('button',{name:'国語 1を開く',exact:true}).evaluate(b=>b.click());await page.locator('.tb-spread').waitFor({timeout:240000});
 for(const width of [320,390,700]){
  await page.setViewportSize({width,height:900});
  const bar=page.locator('.tb-bar-actions');
  await bar.evaluate(b=>b.scrollLeft=0);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const before=await bar.evaluate(b=>({client:b.clientWidth,scroll:b.scrollWidth,left:b.scrollLeft,overflow:getComputedStyle(b).overflowX}));
  ok(before.client>0&&before.overflow==='auto','existing mobile bar has a usable horizontal scroller');
  const buttons=await bar.getByRole('button').all();ok(buttons.length>=4,'all reader actions retained');
  for(const [index,button] of buttons.entries()){
   if(index===0)await button.focus();else await page.keyboard.press('Tab');
   ok(await button.evaluate(b=>b===document.activeElement),'real Tab selects the expected next toolbar action');
   await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   const metrics=await button.evaluate(b=>{const r=b.getBoundingClientRect(),p=b.parentElement.getBoundingClientRect();return {label:b.innerText,left:r.left,right:r.right,parentLeft:p.left,parentRight:p.right,scroll:b.parentElement.scrollLeft,width:innerWidth};});
   console.log(JSON.stringify(metrics));
   if(metrics.left<metrics.parentLeft-1||metrics.right>metrics.parentRight+1)await page.screenshot({path:new URL(`screens-attempt3/focus-failure-${width}.png`,here).pathname});
   ok(await button.evaluate(b=>{const r=b.getBoundingClientRect(),p=b.parentElement.getBoundingClientRect();return r.left>=p.left-1&&r.right<=p.right+1;}),'real keyboard Tab scrolls each control fully into view');
  }
  await bar.evaluate(b=>b.scrollLeft=0);await bar.hover();await page.mouse.wheel(10000,0);
  await page.waitForFunction(()=>{const b=document.querySelector('.tb-bar-actions');return b&&Math.abs(b.scrollLeft-(b.scrollWidth-b.clientWidth))<2;},null,{timeout:10000});
  const end=page.getByRole('button',{name:'全画面を終わる',exact:true});
  ok(await end.evaluate(b=>{const r=b.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight;}),'rightmost exit fully reachable by horizontal wheel/trackpad event');
  const shot=`toolbar-${width}-right.png`;await page.screenshot({path:new URL('screens-attempt3/'+shot,here).pathname});
  cases.push({width,before,buttons:await Promise.all(buttons.map(b=>b.innerText())),screenshot:shot,sha256:hash(await readFile(new URL('screens-attempt3/'+shot,here)))});
 }
 await page.getByRole('button',{name:'全画面を終わる',exact:true}).click();
 ok(await page.getByRole('button',{name:'全画面で教科書を開く',exact:true}).isVisible(),'reachable exit returns to the textbook entry');
 ok(!errors.length,errors.join('|'));ok(!outside.length,'localhost only');
 for(const [name,digest]of Object.entries(inputs))ok(hash(await readFile(new URL(name,assets)))===digest,'main source unchanged');
 await writeFile(new URL('result-attempt3.json',here),JSON.stringify({status:'passed; existing toolbar is horizontally scrollable, no runtime fix applied',checks,inputs,cases,scope:'Actual unchanged reader/current book;320/390/700px, real keyboard Tab and horizontal mouse-wheel events, final exit click. Physical touch-device testing and discoverability remain separate. No login/grading/provider/learner API.'},null,2)+'\n');
 console.log('Existing toolbar',checks,'checks passed; no main change');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
