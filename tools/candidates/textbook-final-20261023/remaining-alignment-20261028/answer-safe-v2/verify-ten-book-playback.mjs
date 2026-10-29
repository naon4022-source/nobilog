// Answer-safe successor 10 movie playback, derived from chapter2 v4 harness.
// Chapter2-only candidate derived from SHA256 4a7c13a5b3321e11868c70c64b87931eb4590ed5da2cb67a90a7ce0f35b7bd1a
// Actual-main successor of SHA256 7032a05a016ff84a786c81debfb17a246c60af29a7dc89a61a877a6413a5bd2d
// Derived from SHA256 b89c25ceef0f6d3adbd72f8cbfe7ba19c011ae29f150e88faf980372bde0437b
// Real reader + isolated candidate book/figure/movies. No login or grading APIs.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
const {chromium}=createRequire(import.meta.url)('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const here=new URL('./',import.meta.url),root=new URL('../../../../../',here),assets=new URL('site-assets/',root),hash=b=>createHash('sha256').update(b).digest('hex');
const ids=['K1-C2-S5-VP','K1-C6-S1-V01','K1-C6-S1-VP','K1-C7-S3-V01','K1-C7-S3-VP','K1-C8-S4-V01','K1-C8-S4-VP','E1-L2-S3-V01','E1-L8-S2-V01','E1-L8-S2-VP'],inputs={},timelines={};
const groups=new Map([['kokugo1',ids.filter(id=>id.startsWith('K1-'))],['english1',ids.filter(id=>id.startsWith('E1-'))]]), overrides=new Map();
const proof=JSON.parse(await readFile(new URL('book-result.json',here)));
for(const book of groups.keys()){
 const file=new URL(`candidate-books/textbook-book-${book}.json`,here),bytes=await readFile(file);
 assert.equal(hash(bytes),proof.books.find(r=>r.book===book).candidateSha256);
 overrides.set(`textbook-book-${book}.json`,file);
}
const figures=JSON.parse(await readFile(new URL('figures/selected-visual-result.json',here))).selectedFigures;
for(const row of figures){
 const file=new URL(row.file,root),book=row.id.startsWith('K1-')?'kokugo1':'english1';
 assert.equal(hash(await readFile(file)),row.sha256);
 overrides.set(`textbook-book-${book}-${row.id.toLowerCase()}.svg`,file);
}
for(const id of ids){
 const directory=id==='K1-C2-S5-VP'?new URL(`tools/candidates/textbook-final-20261023/kokugo-intonation-20261027/videos-caption-v4/${id}/`,root):new URL(`movies-final/${id}/`,here),receipt=JSON.parse(await readFile(new URL('technical-media-result.json',directory)));
 const movie=new URL('candidate.mp4',directory);assert.equal(hash(await readFile(movie)),receipt.movieSha256);
 assert.equal(receipt.fullAVDecode,'passed');timelines[id]=JSON.parse(await readFile(new URL('timeline.json',directory)));
 const book=id.startsWith('K1-')?'kokugo1':'english1';
 overrides.set(`textbook-book-${book}-${id.toLowerCase()}.mp4`,movie);
 inputs[movie.pathname]=receipt.movieSha256;
}
for(const file of ['site-assets/textbook-book.js','site-assets/textbook-book.css','site-assets/textbook-books.json'])inputs[file]=hash(await readFile(new URL(file,root)));
for(const file of overrides.values())inputs[file.pathname]=hash(await readFile(file));
const html='<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/textbook-book.css"><div id="textbook-app" class="tb-app"></div><script src="/textbook-book.js"></script>';
const types={js:'text/javascript',css:'text/css',json:'application/json',svg:'image/svg+xml',png:'image/png',jpg:'image/jpeg',webp:'image/webp',mp4:'video/mp4'};
let ranges=0;
const server=createServer(async(req,res)=>{
 const name=decodeURIComponent(new URL(req.url,'http://fixture.test').pathname.slice(1));
 if(!name){res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'}).end(html);return;}
 const extension=name.split('.').pop();
 if(!/^[a-zA-Z0-9._-]+$/.test(name)||!types[extension]){res.writeHead(404).end();return;}
 try{
  const bytes=await readFile(overrides.get(name)||new URL(name,assets));
  const headers={'Content-Type':types[extension],'Accept-Ranges':'bytes'},match=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range||'');
  if(req.headers.range&&!match){res.writeHead(416,{'Content-Range':'bytes */'+bytes.length}).end();return;}
  if(match){const start=Number(match[1]),end=Math.min(bytes.length-1,match[2]?Number(match[2]):bytes.length-1);if(start>end){res.writeHead(416).end();return;}ranges++;res.writeHead(206,{...headers,'Content-Length':end-start+1,'Content-Range':`bytes ${start}-${end}/${bytes.length}`}).end(bytes.subarray(start,end+1));}
  else res.writeHead(200,{...headers,'Content-Length':bytes.length}).end(bytes);
 }catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
let browser,checks=0;const results=[],outside=[],errors=[],ok=(v,m)=>{assert.ok(v,m);checks++;};
const screenshotFolder=new URL('playback-screens/',here);await mkdir(screenshotFolder,{recursive:true});
async function seek(page,time){
 const actual=await page.evaluate(time=>new Promise((resolve,reject)=>{
  const video=window.examinedMovie;video.pause();let callback;
  const timer=setTimeout(()=>{video.cancelVideoFrameCallback(callback);reject(Error('candidate video frame not painted'));},30000);
  const frame=(_,metadata)=>{if(Math.abs(metadata.mediaTime-time)<.15){clearTimeout(timer);resolve(metadata.mediaTime);}else callback=video.requestVideoFrameCallback(frame);};
  callback=video.requestVideoFrameCallback(frame);video.currentTime=time;
 }),time);
 ok(Math.abs(actual-time)<.15,'requested encoded frame painted');
 await page.waitForFunction(t=>!examinedMovie.seeking&&Math.abs(examinedMovie.currentTime-t)<.12&&examinedMovie.readyState>=2,time,{timeout:30000});
 await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
}
try{
 browser=await chromium.launch({headless:true});const page=await browser.newPage();
 await page.addInitScript(()=>{Element.prototype.requestFullscreen=undefined;Element.prototype.webkitRequestFullscreen=undefined;});
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>{if(r.request().url().startsWith(origin+'/'))return r.continue();outside.push(r.request().url());return r.abort();});
 await page.goto(origin);
 for(const width of [390,820,1180,1440])for(const [book,bookIds] of groups){
  await page.setViewportSize({width,height:900});
  await page.getByRole('button',{name:'全画面で教科書を開く',exact:true}).click();
  await page.getByRole('button',{name:book==='kokugo1'?'国語 1を開く':'英語 1を開く',exact:true}).evaluate(b=>b.click());
  await page.locator('.tb-spread').waitFor({timeout:240000});
  for(const id of bookIds){
  const n=await page.evaluate(id=>NobiTextbook._state.book.phys.find(p=>p.blocks?.some(b=>b.id===id))?.n,id);ok(Number.isInteger(n),'original movie slot retained');
  await page.evaluate(n=>{const f=document.querySelector('.tb-jump');f.querySelector('input').value=String(n);f.requestSubmit();},n);
  const name=`textbook-book-${book}-${id.toLowerCase()}.mp4`,selector=`video[src*="${name}"]`;
  await page.locator(selector).waitFor();
  await page.evaluate(selector=>{window.examinedMovie=document.querySelector(selector);examinedMovie.muted=true;},selector);
  await page.waitForFunction(()=>examinedMovie.readyState>=2&&Number.isFinite(examinedMovie.duration),null,{timeout:30000});
  const meta=await page.evaluate(()=>({duration:examinedMovie.duration,width:examinedMovie.videoWidth,height:examinedMovie.videoHeight,src:examinedMovie.currentSrc}));
  ok(Math.abs(meta.duration-timelines[id].total)<.15,'candidate duration loaded');ok(meta.width===1280&&meta.height===720,'actual movie, no still-image replacement');ok(meta.src===origin+'/'+name,'same book reference');
  await page.evaluate(()=>examinedMovie.play());await page.waitForFunction(()=>examinedMovie.currentTime>.2&&!examinedMovie.paused,null,{timeout:10000});ok(true,'playback advances');
  const scene=Math.min(3,...timelines[id].steps.map(s=>s.sceneIndex).filter(i=>i>=3)),step=timelines[id].steps.find(s=>s.sceneIndex===scene),tip=step.sceneStart+(step.sceneEnd-step.sceneStart)*.65;
  await seek(page,tip);
  await page.evaluate(async()=>{await Promise.all(document.getAnimations().filter(a=>Number.isFinite(a.effect?.getTiming().iterations)).map(a=>a.finished.catch(()=>{})));});
  ok(await page.evaluate(()=>{const r=examinedMovie.getBoundingClientRect(),b=examinedMovie.closest('.tb-body').getBoundingClientRect();return r.width>0&&r.left>=b.left-1&&r.right<=b.right+1&&r.top>=b.top-1&&r.bottom<=b.bottom+1;}),'movie fits actual reader page');
  const screenshot=`${id}-${width}.png`;await page.screenshot({path:new URL(screenshot,screenshotFolder).pathname});
  // Keep native controls enabled; let the browser hide them naturally while playing.
  await seek(page,step.sceneStart+.05);
  await page.mouse.move(1,1);await page.evaluate(()=>examinedMovie.play());
  await page.waitForTimeout(3500);
  ok(await page.evaluate(()=>examinedMovie.controls&&!examinedMovie.paused&&!examinedMovie.ended),'natural playback with native controls retained');
  const playingScreenshot=`${id}-${width}-playing.png`;await page.screenshot({path:new URL(playingScreenshot,screenshotFolder).pathname});
  await seek(page,meta.duration-.25);ok(await page.evaluate(()=>examinedMovie.readyState>=2&&!examinedMovie.error),'tail decodes in book');
  await seek(page,tip);await page.evaluate(()=>examinedMovie.play());await page.waitForFunction(t=>examinedMovie.currentTime>t+.15&&!examinedMovie.paused,tip,{timeout:10000});
  await page.evaluate(()=>{const f=document.querySelector('.tb-jump');f.querySelector('input').value='1';f.requestSubmit();});
  ok(await page.evaluate(()=>examinedMovie.paused&&!examinedMovie.isConnected),'turning away from movie page stops and detaches playback');
  results.push({id,width,physicalPage:n,duration:meta.duration,screenshot,playingScreenshot});console.log(id,width,'candidate real-reader playback passed');
  }
  await page.evaluate(()=>NobiTextbook.leave());
  ok(await page.evaluate(()=>examinedMovie.paused&&!examinedMovie.isConnected),'leaving reader preserves paused detached movie');
 }
 ok(!errors.length,errors.join('|'));ok(!outside.length,'localhost requests only');ok(ranges>0,'actual byte-range serving');
 for(const [file,digest]of Object.entries(inputs))ok(hash(await readFile(file.startsWith('/')?file:new URL(file,root)))===digest,'input unchanged');
 await writeFile(new URL('playback-result.json',here),JSON.stringify({status:'passed',checks,inputs,results,ranges,scope:'Actual unchanged main reader + combined kokugo/English candidate books + 8 selected figures + 10 exact AV-decoded MP4s at4 widths, opened once per subject/width. Native controls preserved, play/seek/tail/page departure tested. Main promotion, physical device and audio listening separate. No login/grading/data/API.'},null,2)+'\n');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
