// Current local production assets only. No accounts, grading, live storage or external requests.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=new URL('../../../',import.meta.url),here=new URL('./',import.meta.url),assets=new URL('site-assets/',root);
const hash=b=>createHash('sha256').update(b).digest('hex'),read=async p=>JSON.parse(await readFile(p,'utf8'));
const manifestURL=new URL('current-math-playback-manifest.json',here),manifestBytes=await readFile(manifestURL),manifest=JSON.parse(manifestBytes);
assert.equal(manifest.items.length,75);assert.equal(new Set(manifest.items.map(x=>x.id)).size,75);
const inputs={};for(const f of ['textbook-book.js','textbook-book.css','vertical-fractions.js','textbook-book-math1.json'])inputs[f]=hash(await readFile(new URL(f,assets)));
assert.equal(inputs['textbook-book-math1.json'],manifest.bookSha256);
for(const x of manifest.items)assert.equal(hash(await readFile(new URL(x.src.slice(1),assets))),x.sha256,x.id+' production movie');
const html='<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/textbook-book.css"><style>body{margin:0;font:16px sans-serif}</style><div id="textbook-app" class="tb-app"></div><script src="/vertical-fractions.js"></script><script src="/textbook-book.js"></script>';
const mime={js:'text/javascript',css:'text/css',json:'application/json',svg:'image/svg+xml',jpg:'image/jpeg',png:'image/png',webp:'image/webp',mp4:'video/mp4'};
const server=createServer(async(req,res)=>{
 try{
  const name=new URL(req.url,'http://localhost').pathname.slice(1);
  if(!name){res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'}).end(html);return;}
  if(!/^(?:textbook-[a-z0-9-]+\.(?:js|css|json|svg|jpg|png|webp|mp4)|vertical-fractions\.js|nobi-[a-z]+\.svg)$/.test(name)){res.writeHead(404).end();return;}
  const data=await readFile(new URL(name,assets)),headers={'Content-Type':mime[name.split('.').pop()],'Accept-Ranges':'bytes'};
  const match=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range||'');
  if(match){const start=Number(match[1]),end=Math.min(data.length-1,match[2]?Number(match[2]):data.length-1);if(start>end){res.writeHead(416,{'Content-Range':'bytes */'+data.length}).end();return;}res.writeHead(206,{...headers,'Content-Length':end-start+1,'Content-Range':`bytes ${start}-${end}/${data.length}`}).end(data.subarray(start,end+1));}
  else res.writeHead(200,{...headers,'Content-Length':data.length}).end(data);
 }catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
const results=[],surfaces=[],errors=[],outside=[];let browser;
async function settled(page){await page.evaluate(async()=>{for(const a of document.getAnimations())if(Number.isFinite(a.effect?.getTiming().iterations))a.finish();await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});}
async function jump(page,n){await page.evaluate(n=>{const f=document.querySelector('.tb-jump');f.querySelector('input').value=String(n);f.requestSubmit();},n);await settled(page);}
const save=async(status,extra={})=>writeFile(new URL('current-math-playback-result.json',here),JSON.stringify({status,manifestSha256:hash(manifestBytes),inputs,results,errors,outside,scope:'Muted start/end playback in current local book; prior same-SHA full AV and1805 reviewed scenes are separate. Not fresh listening or real iPhone verification.',navigation:'Fixture submits actual jump form, including mobile-hidden form; not mobile entry UX certification.',...extra},null,2)+'\n');
try{
 browser=await chromium.launch({headless:true});const context=await browser.newContext({serviceWorkers:'block'});
 for(const [width,height]of [[390,844],[820,1180],[1180,820],[1440,900]]){
  const page=await context.newPage();await page.setViewportSize({width,height});page.on('pageerror',e=>errors.push({width,message:e.message}));
  await page.route('**/*',r=>{if(new URL(r.request().url()).origin===origin)return r.continue();outside.push(r.request().url());return r.abort();});
  await page.addInitScript(()=>{Element.prototype.requestFullscreen=undefined;Element.prototype.webkitRequestFullscreen=undefined;});
  await page.goto(origin);assert(await page.evaluate(()=>!!globalThis.NobiFractions));await page.getByRole('button',{name:'全画面で教科書を開く',exact:true}).click();await page.getByRole('button',{name:'数学 1を開く',exact:true}).click();await page.locator('.tb-spread').waitFor({timeout:240000});await settled(page);
  surfaces.push({page,width,height});console.log(width+'px current reader ready');
 }
 for(const group of ['C1','C2','C3','C4','C5','APP']){
  const items=manifest.items.filter(x=>x.group===group);assert(items.length);
  for(const {page,width,height}of surfaces){
   await page.bringToFront();
   for(const item of items){
    const found=await page.evaluate(id=>{
     const hits=[];function walk(blocks,physical,parentQuestion=null,closed=false){for(let i=0;i<blocks.length;i++){const b=blocks[i];if(b.id===id&&b.kind==='video')hits.push({page:physical.n,closed,code:parentQuestion});if(Array.isArray(b.body))walk(b.body,physical,b.t==='details'?blocks[i-1]?.code:parentQuestion,closed||b.t==='details');}}
     for(const p of NobiTextbook._state.book.phys)walk(p.blocks||[],p);return hits;
    },item.id);
    assert.equal(found.length,1,item.id+' one physical location');const target=found[0];assert.equal(target.closed,item.inAnswer);
    await jump(page,target.page);const selector='video[src="'+item.src+'"]';assert.equal(await page.locator('.tb-sheet').count(),0);
    if(item.inAnswer){assert.equal(await page.locator('.tb-spread '+selector).count(),0,'answer movie hidden initially');assert(target.code);const q=page.locator('.tb-spread [data-code="'+target.code+'"]');assert.equal(await q.count(),1);const button=q.locator('xpath=following-sibling::*[1]');assert(await button.evaluate(n=>n.classList.contains('tb-answer-btn')));await button.click();await page.locator('.tb-sheet').waitFor();await settled(page);}
    const video=page.locator((item.inAnswer?'.tb-sheet ':'.tb-spread ')+selector);await video.waitFor();await video.scrollIntoViewIfNeeded();
    await page.waitForFunction(src=>{const v=document.querySelector('video[src="'+src+'"]');return v&&v.readyState>=2&&v.duration>0;},item.src,{timeout:30000});
    const playback=await video.evaluate(async(v)=>{
     window.__checkedMovie=v;v.muted=true;await v.play();const begin=v.currentTime;await new Promise((resolve,reject)=>{const until=performance.now()+6000;function wait(){if(v.error)return reject(Error(v.error.message));if(v.currentTime>begin+.1)return resolve();if(performance.now()>until)return reject(Error('movie did not advance'));setTimeout(wait,40);}wait();});const advanced=v.currentTime-begin;v.pause();
     await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('end seek timed out')),6000);v.addEventListener('seeked',()=>{clearTimeout(timer);resolve();},{once:true});v.currentTime=v.duration-.5;});
     const box=v.getBoundingClientRect(),body=v.closest('.tb-sheet-body,.tb-body').getBoundingClientRect(),sheet=!!v.closest('.tb-sheet');
     const fitWidth=box.left>=body.left-1&&box.right<=body.right+1,fitHeight=sheet?box.top>=-1&&box.bottom<=innerHeight+1:box.top>=body.top-1&&box.bottom<=body.bottom+1;
     const result={advanced,duration:v.duration,time:v.currentTime,width:v.videoWidth,height:v.videoHeight,controls:v.controls,inline:v.playsInline,error:v.error?.code||0,fitWidth,fitHeight,readyState:v.readyState,seeking:v.seeking};await v.play();return result;
    });
    assert.equal(playback.width,1280);assert.equal(playback.height,720);assert(playback.controls&&playback.inline&&playback.fitWidth&&playback.fitHeight,JSON.stringify({id:item.id,width,playback}));assert.equal(playback.error,0);assert(playback.readyState>=2&&!playback.seeking);assert(Math.abs(playback.duration-item.seconds)<.2);assert(Math.abs(playback.time-(playback.duration-.5))<.2);assert(playback.advanced>.1);
    assert(await video.evaluate(v=>!v.paused),'playing before real close/page navigation');
    if(item.inAnswer){await page.getByRole('button',{name:'閉じる',exact:true}).click();assert.equal(await page.locator('.tb-sheet').count(),0);assert.equal(await page.locator('.tb-spread '+selector).count(),0);}
    else await page.getByRole('button',{name:'前のページ',exact:true}).click();
    assert(await page.evaluate(()=>window.__checkedMovie.paused),'close/page navigation pauses detached movie');
    results.push({id:item.id,group,viewport:[width,height],page:target.page,inAnswer:item.inAnswer,...playback,stoppedBy:item.inAnswer?'own answer close':'previous page'});
   }
   assert.equal(errors.length,0,JSON.stringify(errors));assert.equal(outside.length,0);await save('running');console.log(group+' '+width+'px: '+items.length+' actual plays/end seeks/fit/stop passed');
  }
 }
 assert.equal(results.length,300);for(const x of manifest.items)assert.equal(results.filter(r=>r.id===x.id).length,4);assert.equal(results.filter(x=>x.inAnswer).length,4);
 for(const [f,digest]of Object.entries(inputs))assert.equal(hash(await readFile(new URL(f,assets))),digest,'reader input changed during check');assert.equal(hash(await readFile(manifestURL)),hash(manifestBytes));
 for(const x of manifest.items)assert.equal(hash(await readFile(new URL(x.src.slice(1),assets))),x.sha256,'movie changed during check');
 await save('passed',{plays:300,movies:75,hiddenAnswerPlays:4,noRealUserData:true,claude19Excluded:true});console.log('All75 current movies x4 widths passed;300 plays, including own closed answer x4.');
}catch(error){await save('failed',{failure:error.stack});throw error;}finally{await browser?.close();await new Promise(r=>server.close(r));}
