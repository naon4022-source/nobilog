// Reproduce toolbar gesture interception, then test the one-line independent candidate.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
const {chromium}=createRequire(import.meta.url)('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const here=new URL('./',import.meta.url),root=new URL('../../../',here),assets=new URL('site-assets/',root),sha=b=>createHash('sha256').update(b).digest('hex');
const candidate=process.argv[2]==='--candidate';assert(candidate||process.argv[2]==='--baseline');
const label=candidate?'candidate':'baseline',screens=new URL(label+'-screens/',here);await mkdir(screens);
const original=await readFile(new URL('textbook-book.js',assets)),js=candidate?await readFile(new URL('textbook-book.candidate.js',here)):original;
const manifest=JSON.parse(await readFile(new URL('candidate-manifest.json',here)));assert.equal(sha(original),manifest.beforeSha256);if(candidate)assert.equal(sha(js),manifest.candidateSha256);
const html='<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/textbook-book.css"><div id="textbook-app" class="tb-app"></div><script src="/textbook-book.js"></script>';
const types={js:'text/javascript',css:'text/css',json:'application/json',svg:'image/svg+xml',png:'image/png',jpg:'image/jpeg',webp:'image/webp',mp4:'video/mp4'};
const server=createServer(async(req,res)=>{
 const name=decodeURIComponent(new URL(req.url,'http://fixture.invalid').pathname.slice(1));
 if(!name){res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'}).end(html);return;}
 const type=types[name.split('.').pop()];if(!/^[a-zA-Z0-9._-]+$/.test(name)||!type){res.writeHead(404).end();return;}
 try{const bytes=name==='textbook-book.js'?js:await readFile(new URL(name,assets));res.writeHead(200,{'Content-Type':type,'Content-Length':bytes.length}).end(bytes);}catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
let browser,checks=0;const cases=[],errors=[],outside=[],ok=(v,m)=>{assert.ok(v,m);checks++;};
try{
 browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:390,height:900}});
 await page.addInitScript(()=>{Element.prototype.requestFullscreen=undefined;Element.prototype.webkitRequestFullscreen=undefined;});
 page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():(outside.push(r.request().url()),r.abort()));
 await page.goto(origin);await page.getByRole('button',{name:'全画面で教科書を開く',exact:true}).click();await page.getByRole('button',{name:'国語 1を開く',exact:true}).evaluate(b=>b.click());await page.locator('.tb-spread').waitFor({timeout:240000});
 for(const width of candidate?[320,390,700]:[390]){
  await page.setViewportSize({width,height:900});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const bar=page.locator('.tb-bar-actions');await bar.evaluate(b=>b.scrollLeft=0);const start=await page.evaluate(()=>NobiTextbook._state.spread);
  const initial=await bar.evaluate(b=>({left:b.scrollLeft,max:b.scrollWidth-b.clientWidth,client:b.clientWidth,scroll:b.scrollWidth}));
  ok(initial.max>=0,'bar dimensions available');await bar.hover();await page.mouse.wheel(10000,0);
  if(candidate){
   await page.waitForFunction(()=>{const b=document.querySelector('.tb-bar-actions');return b&&Math.abs(b.scrollLeft-(b.scrollWidth-b.clientWidth))<2;},null,{timeout:10000});
   ok(await page.evaluate(()=>NobiTextbook._state.spread)===start,'toolbar horizontal wheel does not turn book page');
   ok(await page.getByRole('button',{name:'全画面を終わる',exact:true}).evaluate(b=>{const r=b.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1;}),'last action fully reachable');
  }else{
   await page.waitForFunction(n=>NobiTextbook._state.spread!==n,start,{timeout:10000});
   ok(await bar.evaluate(b=>b.scrollLeft===0),'baseline prevents toolbar scrolling');ok(initial.max>0,'baseline rightmost actions initially overflow');
  }
  const shot=`toolbar-${width}.png`;await page.screenshot({path:new URL(shot,screens).pathname});
  const end=await page.evaluate(()=>({spread:NobiTextbook._state.spread,left:document.querySelector('.tb-bar-actions').scrollLeft}));
  cases.push({width,start,initial,end,screenshot:shot,sha256:sha(await readFile(new URL(shot,screens)))});
  console.log(label,width,JSON.stringify(cases.at(-1)));
 }
 if(candidate){
  const start=await page.evaluate(()=>NobiTextbook._state.spread);await page.locator('.tb-stage').hover();await page.mouse.wheel(200,0);
  await page.waitForFunction(n=>NobiTextbook._state.spread!==n,start,{timeout:10000});ok(true,'page-area horizontal gesture still turns a page');
  await page.locator('.tb-bar-actions').evaluate(b=>b.scrollLeft=b.scrollWidth);await page.getByRole('button',{name:'全画面を終わる',exact:true}).click();ok(await page.getByRole('button',{name:'全画面で教科書を開く',exact:true}).isVisible(),'native reachable exit works');
 }
 ok(!errors.length,errors.join('|'));ok(!outside.length,'localhost only');ok(sha(await readFile(new URL('textbook-book.js',assets)))===manifest.beforeSha256,'main reader unchanged');
 await writeFile(new URL(label+'-result.json',here),JSON.stringify({status:candidate?'passed; candidate only':'reproduced existing toolbar wheel interception',checks,cases,servedJsSha256:sha(js),scope:'Actual reader/current book; real horizontal wheel events. Candidate excludes toolbar only; page gestures and exit retained. No main changes, live APIs or learner data. Earlier programmatic/native-focus failures remain separate and are not claimed fixed.'},null,2)+'\n');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
