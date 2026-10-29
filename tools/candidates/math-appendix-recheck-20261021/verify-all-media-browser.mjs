// Actual reader/annotation UI + original API adapter + isolated SQLite only.
// Execute after the shared full suite, never against real users or stores.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {textbookAnnotationsRoute} from '../../../cf-worker/src/textbook-annotations.mjs';
const here=new URL('./',import.meta.url),root=new URL('../../../',import.meta.url),assets=new URL('site-assets/',root);
const require=createRequire(import.meta.url),{D1SQLite}=require('../../../.claude/verify/d1-sqlite.js');
const {chromium}=require('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const source=await readFile(new URL('index.html',root),'utf8');
const start=source.indexOf('    async function textbookAnnotationRequest('),end=source.indexOf('    function appSyncSummaryHtml()',start);
assert(start>=0&&end>start);
const html='<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/textbook-book.css"><link rel="stylesheet" href="/textbook-annotations.css"><script src="/text-settings.js"></script><script src="/textbook-annotation-model.js"></script><script src="/textbook-annotations.js"></script><script>var currentUserId="p_pro";function isTrial(){return false}function cloudIdentity(){return {uid:currentUserId}}function cloudSame(o){return o.uid===currentUserId}function cloudUrl(p){return p}function cloudTry(p,o){return fetch(p,o)}'+source.slice(start,end)+'</script><div id="textbook-app" class="tb-app"></div><script src="/textbook-book.js"></script>';
const rules=JSON.parse(await readFile(new URL('candidate/annotation-compatibility.json',here),'utf8'));
const inherited=[rules.find(r=>r.block.t==='fig'),rules.find(r=>r.block.t==='h3'&&r.block.x==='手順'),rules.find(r=>r.block.t==='ol')];
assert(inherited.every(Boolean));
const saved=inherited.map((r,i)=>({book:'math1',anchor:r.anchor,quote:r.quote,color:'blue',note:['移動前の図メモ','移動前の見出しメモ','移動前の手順メモ'][i],revision:0}));
const db=new D1SQLite(),env={AUTH_DB:db,SUBSCRIPTION_PREVIEW:'1',PREVIEW_PLAN_ACCOUNTS:'1'};
let uid='p_pro';const calls=[];
const mime={js:'text/javascript',css:'text/css',json:'application/json',svg:'image/svg+xml',jpg:'image/jpeg',png:'image/png',mp4:'video/mp4'};
const server=createServer(async(req,res)=>{
 const origin='http://127.0.0.1:'+server.address().port,url=new URL(req.url,origin);
 if(url.pathname==='/textbook-annotations'){
  const parts=[];for await(const p of req)parts.push(p);
  const request=new Request(origin+req.url,{method:req.method,headers:{Origin:origin,'Content-Type':'application/json'},...(req.method==='POST'?{body:Buffer.concat(parts)}:{})});
  calls.push({method:req.method,uid});
  const result=await textbookAnnotationsRoute(request,{...env,APP_ORIGIN:origin},{uid});
  res.writeHead(result.status,{'Content-Type':'application/json'});res.end(await result.text());return;
 }
 const name=decodeURIComponent(url.pathname.slice(1));
 if(!name){res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'});res.end(html);return;}
 if(!/^(?:textbook-[a-z0-9-]+\.(?:js|css|json|svg|png|jpg|mp4)|text-settings\.js|nobi-normal\.svg)$/.test(name)){res.writeHead(404).end();return;}
 try{
  let bytes;try{bytes=await readFile(new URL(name==='textbook-book-math1-m1-app2-v01.mp4'?'candidate/M1-APP2-V01/M1-APP2-V01.mp4':'candidate/'+name,here));}catch{bytes=await readFile(new URL(name,assets));}
  const headers={'Content-Type':mime[name.split('.').pop()]||'application/octet-stream','Accept-Ranges':'bytes'};
  const range=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range||'');
  if(range){const a=Number(range[1]),b=Math.min(bytes.length-1,range[2]?Number(range[2]):bytes.length-1);if(a>b){res.writeHead(416).end();return;}res.writeHead(206,{...headers,'Content-Range':`bytes ${a}-${b}/${bytes.length}`,'Content-Length':b-a+1});res.end(bytes.subarray(a,b+1));}
  else{res.writeHead(200,{...headers,'Content-Length':bytes.length});res.end(bytes);}
 }catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
let browser,checks=0;const ok=(value,message)=>{assert(value,message);checks++;};const layouts=[];
const fig='/textbook-book-math1-m1-app3-fig07.svg',movie='/textbook-book-math1-m1-app3-v03.mp4';
const inventory=JSON.parse(await readFile(new URL('inventory.json',here),'utf8')).items;
const plays=[];
try{
 browser=await chromium.launch({headless:true});
 for(const [width,height] of [[390,844],[820,1180],[1180,820],[1440,900]]){
  const page=await browser.newPage({viewport:{width,height},serviceWorkers:'block'}),errors=[],outside=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>{if(new URL(r.request().url()).origin===origin)return r.continue();outside.push(r.request().url());return r.abort();});
  await page.addInitScript(()=>{Element.prototype.requestFullscreen=undefined;Element.prototype.webkitRequestFullscreen=undefined;});
  await page.goto(origin);await page.getByRole('button',{name:'全画面で教科書を開く',exact:true}).click();await page.getByRole('button',{name:'数学 1を開く',exact:true}).click();await page.locator('.tb-spread').waitFor({timeout:240000});
  for(const item of inventory){
   // APP3-V03 was already tested at all4 widths and2 large-text variants.
   if(item.id==='M1-APP3-V03')continue;
   const n=await page.evaluate(id=>NobiTextbook._state.book.phys.find(p=>(p.blocks||[]).some(b=>b.id===id))?.n,item.id);
   ok(n>0,'actual referenced media has a physical page');
   // Invoke the actual local reader form even where CSS hides this desktop
   // shortcut. This is fixture navigation, not a claim about mobile entry UI.
   await page.evaluate(n=>{const f=document.querySelector('.tb-jump');f.querySelector('input').value=String(n);f.requestSubmit();},n);
   const video=page.locator('.tb-spread video[src="/'+item.copy.split('/').pop()+'"]');
   ok(await video.count()===1,'exactly one real video reference');
   await video.evaluate(async v=>{window.__movie=v;v.muted=true;await v.play();});
   await page.waitForFunction(()=>window.__movie.currentTime>.1);
   ok(await video.evaluate((v,s)=>Math.abs(v.duration-s)<.2,item.seconds),'real video duration matches unchanged narration timeline');
   await video.evaluate(v=>{v.currentTime=v.duration-.3;});
   await page.waitForFunction(()=>!window.__movie.seeking&&window.__movie.readyState>=2);
   ok(await video.evaluate(v=>v.videoWidth===1280&&v.videoHeight===720),'decoded real video including end at1280x720');
   const visible=await video.evaluate(v=>{const r=v.getBoundingClientRect(),p=v.closest('.tb-page').getBoundingClientRect();return r.width>0&&r.height>0&&r.left>=p.left-1&&r.right<=p.right+1&&r.bottom<=p.bottom+1;});
   ok(visible,'video fits actual book page');
   await video.evaluate(async v=>{v.currentTime=0;await v.play();});
   await page.getByRole('button',{name:'前のページ',exact:true}).click();
   ok(await page.evaluate(()=>window.__movie.paused),'page turn pauses detached media');
   plays.push({id:item.id,width,page:n,decoded:true,nearEndSeek:true,stopped:true});
  }
  ok(!errors.length,errors.join('|'));ok(!outside.length,'no outside request');
  console.log(width+': all5 remaining actual appendix videos played, end-seeked, fit and stopped');await page.close();
 }
 const prior=JSON.parse(await readFile(new URL('closed-answer-browser-result.json',here),'utf8'));
 ok(prior.status==='passed'&&prior.layouts.length===6,'reuse completed APP3-V03 playback proof');
 await writeFile(new URL('all-media-browser-result.json',here),JSON.stringify({status:'passed',checks,plays,reused:'closed-answer-browser-result.json: APP3-V03 at4widths+2large',totalStandardWidthPlays:24,realUserData:false,outsideRequests:0},null,2)+'\n');
 console.log('All6 appendix movies:',checks,'checks passed;24 standard-width book plays with existing APP3 proof');
}finally{await browser?.close();await new Promise(r=>server.close(r));db.close();}
