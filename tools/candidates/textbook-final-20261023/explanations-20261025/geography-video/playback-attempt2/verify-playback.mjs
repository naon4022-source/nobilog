import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
const {chromium}=createRequire(import.meta.url)('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const here=new URL('./',import.meta.url),ROOT=new URL('../../../../../',here),ASSETS=new URL('site-assets/',ROOT),hash=b=>createHash('sha256').update(b).digest('hex');
const integration=JSON.parse(await readFile(new URL('integration.json',here))),timeline=JSON.parse(await readFile(new URL('timeline.json',here)));
const inputs={};for(const file of ['site-assets/textbook-book.js','site-assets/textbook-book-geography.json',...integration.files.map(r=>r.file)])inputs[file]=hash(await readFile(new URL(file,ROOT)));
assert.equal(inputs['site-assets/textbook-book-geography-g-c2-s1-vp.mp4'],integration.candidateMovieSha256);
const html='<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/textbook-book.css"><div id="textbook-app" class="tb-app"></div><script src="/textbook-book.js"></script>';
const types={js:'text/javascript',css:'text/css',json:'application/json',svg:'image/svg+xml',png:'image/png',jpg:'image/jpeg',webp:'image/webp',mp4:'video/mp4'};
let rangeRequests=0;
const server=createServer(async(req,res)=>{
 const name=decodeURIComponent(new URL(req.url,'http://fixture.test').pathname.slice(1));
 if(!name){res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'}).end(html);return;}
 if(!/^[a-zA-Z0-9._-]+$/.test(name)){res.writeHead(404).end();return;}
 try{
  const bytes=await readFile(new URL(name,ASSETS)),headers={'Content-Type':types[name.split('.').pop()]||'application/octet-stream','Accept-Ranges':'bytes'};
  const match=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range||'');
  if(req.headers.range&&!match){res.writeHead(416,{'Content-Range':'bytes */'+bytes.length}).end();return;}
  if(match){const start=Number(match[1]),end=Math.min(bytes.length-1,match[2]?Number(match[2]):bytes.length-1);if(start>end){res.writeHead(416,{'Content-Range':'bytes */'+bytes.length}).end();return;}rangeRequests++;res.writeHead(206,{...headers,'Content-Length':end-start+1,'Content-Range':`bytes ${start}-${end}/${bytes.length}`}).end(bytes.subarray(start,end+1));}
  else res.writeHead(200,{...headers,'Content-Length':bytes.length}).end(bytes);
 }catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
let browser,checks=0;const results=[],outside=[],errors=[],ok=(v,m)=>{assert.ok(v,m);checks++;};
await mkdir(new URL('playback-screens/',here),{recursive:true});
async function seek(page,time){await page.evaluate(time=>{window.examinedMovie.pause();window.examinedMovie.currentTime=time;},time);await page.waitForFunction(t=>!examinedMovie.seeking&&Math.abs(examinedMovie.currentTime-t)<.12&&examinedMovie.readyState>=2,time,{timeout:30000});}
try{
 browser=await chromium.launch({headless:true});const page=await browser.newPage();
 await page.addInitScript(()=>{Element.prototype.requestFullscreen=undefined;Element.prototype.webkitRequestFullscreen=undefined;});
 page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>{if(r.request().url().startsWith(origin+'/'))return r.continue();outside.push(r.request().url());return r.abort();});
 await page.goto(origin);
 for(const width of [390,820,1180,1440]){
  await page.setViewportSize({width,height:900});await page.getByRole('button',{name:'全画面で教科書を開く',exact:true}).click();await page.getByRole('button',{name:'社会 地理を開く',exact:true}).evaluate(b=>b.click());await page.locator('.tb-spread').waitFor({timeout:240000});
  const n=await page.evaluate(()=>NobiTextbook._state.book.phys.find(p=>p.blocks?.some(b=>b.id==='G-C2-S1-VP'))?.n);ok(Number.isInteger(n),'existing movie slot found in current book');
  await page.evaluate(n=>{const f=document.querySelector('.tb-jump');f.querySelector('input').value=String(n);f.requestSubmit();},n);
  await page.locator('video[src*="geography-g-c2-s1-vp.mp4"]').waitFor();
  await page.evaluate(()=>{window.examinedMovie=document.querySelector('video[src*="geography-g-c2-s1-vp.mp4"]');examinedMovie.muted=true;});
  await page.waitForFunction(()=>examinedMovie.readyState>=2&&Number.isFinite(examinedMovie.duration),null,{timeout:30000});
  const meta=await page.evaluate(()=>({duration:examinedMovie.duration,width:examinedMovie.videoWidth,height:examinedMovie.videoHeight,src:examinedMovie.currentSrc}));
  ok(Math.abs(meta.duration-timeline.total)<.15,'actual corrected duration loaded');ok(meta.width===1280&&meta.height===720,'actual movie decoded, no still-image substitute');ok(meta.src===origin+'/textbook-book-geography-g-c2-s1-vp.mp4','current existing book reference used');
  await page.evaluate(()=>examinedMovie.play());await page.waitForFunction(()=>examinedMovie.currentTime>.2&&!examinedMovie.paused,null,{timeout:10000});ok(true,'actual playback time advances');
  const tip=timeline.steps[4].start+1;await seek(page,tip);
  await page.evaluate(async()=>{await Promise.all(document.getAnimations().filter(a=>Number.isFinite(a.effect?.getTiming().iterations)).map(a=>a.finished.catch(()=>{})));});
  const box=await page.evaluate(()=>{const r=examinedMovie.getBoundingClientRect(),b=examinedMovie.closest('.tb-body').getBoundingClientRect();return {fits:r.width>0&&r.left>=b.left-1&&r.right<=b.right+1&&r.top>=b.top-1&&r.bottom<=b.bottom+1};});ok(box.fits,'movie fits the actual page');
  const screenshot='playback-screens/'+width+'.png';await page.screenshot({path:new URL(screenshot,here).pathname});
  await seek(page,meta.duration-.25);ok(await page.evaluate(()=>examinedMovie.readyState>=2&&!examinedMovie.error),'tail decodes inside book');
  await seek(page,tip);await page.evaluate(()=>examinedMovie.play());await page.waitForFunction(t=>examinedMovie.currentTime>t+.15&&!examinedMovie.paused,tip,{timeout:10000});
  await page.evaluate(()=>NobiTextbook.leave());ok(await page.evaluate(()=>examinedMovie.paused&&!examinedMovie.isConnected),'leaving book stops active movie');
  results.push({width,physicalPage:n,duration:meta.duration,screenshot});console.log(width+': corrected actual book movie play/seek/tail/leave-stop passed');
 }
 ok(errors.length===0,errors.join('|'));ok(outside.length===0,'all requests stayed in isolated localhost fixture');ok(rangeRequests>0,'actual browser byte-range requests served');
 for(const [file,digest]of Object.entries(inputs))ok(hash(await readFile(new URL(file,ROOT)))===digest,'input remained stable');
 await writeFile(new URL('playback-result.json',here),JSON.stringify({status:'passed',checks,inputs,results,rangeRequests,movieSha256:integration.candidateMovieSha256,scope:'Actual current geography book movie at4widths; real decode/play/time/seek/end/leave-stop. Synthetic local reader only; no login, grading, real data or outside requests.'},null,2)+'\n');
 console.log('Corrected geography book playback: '+checks+' checks passed');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
