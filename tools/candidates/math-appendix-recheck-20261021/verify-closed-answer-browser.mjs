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
  let bytes;try{bytes=await readFile(new URL('candidate/'+name,here));}catch{bytes=await readFile(new URL(name,assets));}
  const headers={'Content-Type':mime[name.split('.').pop()]||'application/octet-stream','Accept-Ranges':'bytes'};
  const range=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range||'');
  if(range){const a=Number(range[1]),b=Math.min(bytes.length-1,range[2]?Number(range[2]):bytes.length-1);if(a>b){res.writeHead(416).end();return;}res.writeHead(206,{...headers,'Content-Range':`bytes ${a}-${b}/${bytes.length}`,'Content-Length':b-a+1});res.end(bytes.subarray(a,b+1));}
  else{res.writeHead(200,{...headers,'Content-Length':bytes.length});res.end(bytes);}
 }catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
let browser,checks=0;const ok=(value,message)=>{assert(value,message);checks++;};const layouts=[];
const fig='/textbook-book-math1-m1-app3-fig07.svg',movie='/textbook-book-math1-m1-app3-v03.mp4';
try{
 for(const body of saved){const result=await textbookAnnotationsRoute(new Request(origin+'/textbook-annotations',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)}),{...env,APP_ORIGIN:origin},{uid});ok(result.status===200,'seed an actual old-note identity into isolated SQLite');}
 await mkdir(new URL('screens/',here),{recursive:true});browser=await chromium.launch({headless:true});
 for(const [width,height,large]of [[390,844,false],[820,1180,false],[1180,820,false],[1440,900,false],[390,844,true],[1440,900,true]]){
  const page=await browser.newPage({viewport:{width,height},serviceWorkers:'block'}),errors=[],outside=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>{if(new URL(r.request().url()).origin===origin)return r.continue();outside.push(r.request().url());return r.abort();});
  await page.addInitScript(()=>{Element.prototype.requestFullscreen=undefined;Element.prototype.webkitRequestFullscreen=undefined;});
  await page.goto(origin);if(large)await page.evaluate(()=>NobiTextSettings.apply(true));
  const open=async()=>{await page.getByRole('button',{name:'全画面で教科書を開く',exact:true}).click();await page.getByRole('button',{name:'数学 1を開く',exact:true}).click();await page.locator('.tb-spread').waitFor({timeout:240000});};
  await open();
  const target=await page.evaluate(id=>{const p=NobiTextbook._state.book.phys.find(p=>(p.blocks||[]).some(b=>b.t==='details'&&b.body?.some(b=>b.id===id)));if(!p)return null;const q=p.blocks.find(b=>b.x?.startsWith('**問1**'));return {n:p.n,code:q?.code};},'M1-APP3-V03');
  ok(target?.code,'matching question remains adjacent to its own closed answer');
  if(width>900){
   await page.getByRole('textbox',{name:'コードでページへ移動'}).fill(String(target.n));await page.getByRole('button',{name:'コードで移動',exact:true}).click();
  }else{
   // Mobile intentionally hides code entry. Use the existing note navigation,
   // then close its answer to inspect the ordinary page at the actual width.
   await page.getByRole('button',{name:'マーカー・メモ',exact:true}).click();
   await page.locator('.tb-ann-record').filter({hasText:saved[0].note}).getByRole('button',{name:'この文章を見る',exact:true}).click();
   await page.locator('.tb-sheet-close').click();
  }
  const spread=page.locator('.tb-spread');
  ok(await spread.locator('img[src="'+fig+'"]').count()===0,'answer diagram absent before opening');
  ok(await spread.locator('video[src="'+movie+'"]').count()===0,'answer video absent before opening');
  ok(!/最大公約数.*24/.test(await spread.innerText()),'specific answer-bearing steps absent before opening');
  if(!large&&(width===390||width===1440))await page.screenshot({path:new URL('screens/'+width+'-closed.png',here).pathname,animations:'disabled'});
  // Navigate to each old note: the reader must find and open its matching answer.
  for(const row of saved){
   await page.getByRole('button',{name:'マーカー・メモ',exact:true}).click();
   await page.locator('.tb-ann-record').filter({hasText:row.note}).getByRole('button',{name:'この文章を見る',exact:true}).click();
   await page.locator('.tb-sheet').waitFor();
   const node=page.locator('.tb-sheet [data-annotation-anchor="'+row.anchor+'"]');
   ok(await node.count()===1,'old inherited note locates exactly one nested source block');
   ok(await node.getAttribute('data-annotation-color')==='blue','old saved marker color repaints inside answer');
   ok(await page.locator('.tb-sheet').getByText('24cm、6枚（縦 2枚×横 3枚）',{exact:true}).count()===1,'original answer unchanged and present once');
   await page.locator('.tb-sheet-close').click();
  }
  const answer=spread.locator('[data-code="'+target.code+'"]').locator('xpath=following-sibling::*[1]');
  await answer.click();const sheet=page.locator('.tb-sheet');await sheet.waitFor();
  const image=sheet.locator('img[src="'+fig+'"]');await image.waitFor();
  await page.waitForFunction(src=>{const im=document.querySelector('.tb-sheet img[src="'+src+'"]');return im?.complete&&im.naturalWidth>0;},fig);
  ok(await image.count()===1,'existing SVG occurs once in own answer');
  const video=sheet.locator('video[src="'+movie+'"]');
  await video.evaluate(async v=>{window.__closedVideo=v;v.muted=true;await v.play();});
  await page.waitForFunction(()=>window.__closedVideo.currentTime>.1);
  ok(await video.evaluate(v=>v.duration>40&&v.duration<50),'real existing video decodes with plausible full duration');
  await video.evaluate(v=>{v.currentTime=v.duration-.3;});
  await page.waitForFunction(()=>!window.__closedVideo.seeking&&window.__closedVideo.readyState>=2);
  ok(await video.count()===1,'one actual video, successful near-end seek');
  ok(await sheet.evaluate(n=>{const r=n.getBoundingClientRect();return r.left>=-1&&r.right<=innerWidth+1&&r.top>=-1&&r.bottom<=innerHeight+1;}),'own answer dialog fits viewport');
  if(!large&&(width===390||width===1440))await page.screenshot({path:new URL('screens/'+width+'-open.png',here).pathname,animations:'disabled'});
  // Explicit close and screen exit must pause even the detached media element.
  await video.evaluate(async v=>{v.currentTime=0;await v.play();});await page.locator('.tb-sheet-close').click();
  ok(await page.evaluate(()=>window.__closedVideo.paused),'closing answer pauses the previous media element');
  ok(await spread.locator('img[src="'+fig+'"],video[src="'+movie+'"]').count()===0,'both answer media hidden again after close');
  await answer.click();await page.locator('.tb-sheet video').evaluate(async v=>{window.__closedVideo=v;v.muted=true;await v.play();});
  // A parent screen switch calls the actual exported reader exit while its
  // modal is open; the modal correctly blocks background toolbar clicks.
  await page.evaluate(()=>NobiTextbook.leave());
  ok(await page.evaluate(()=>window.__closedVideo.paused),'leaving reader pauses embedded answer video');
  ok(errors.length===0,errors.join('|'));ok(outside.length===0,'no external requests');
  layouts.push({width,height,large,page:target.n,questionCode:target.code});
  console.log(width+(large?' large':'')+': closed answer, three inherited notes, video playback/seek/stop passed');
  await page.close();
 }
 ok(calls.every(c=>c.method==='GET'),'opening, locating and playing never writes or revises saved notes');
 ok(db.keys().filter(k=>k.startsWith('textbook-annotation:')).length===3,'three original records retained without duplicates');
 await writeFile(new URL('closed-answer-browser-result.json',here),JSON.stringify({status:'passed',checks,layouts,realUserData:false,externalRequests:0,scope:'real reader/model/API/SQLite; synthetic old notes and local media; hardware listening not tested'},null,2)+'\n');
 console.log('Appendix closed answer and inherited notes:',checks,'checks passed');
}finally{await browser?.close();await new Promise(r=>server.close(r));db.close();}
