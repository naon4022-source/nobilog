// Local synthetic vocabulary UI; queued microphone/recorder only; no real device.
// Run only after the current full suite is terminal.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url),{chromium}=require('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const here=new URL('./',import.meta.url),assets=new URL('../../../site-assets/',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('manifest.json',here),'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
const integrated=process.argv.includes('--integrated');
const original=await readFile(new URL(integrated?'before.js':'eiken-vocab.js',integrated?here:assets)),candidate=await readFile(new URL('eiken-vocab.js',integrated?assets:here));
assert.equal(hash(original),manifest.beforeSha256);assert.ok([manifest.afterSha256,...(integrated?(manifest.laterChanges||[]).map(c=>c.sha256):[])].includes(hash(candidate)),'eiken-vocab.js is the integrated version or a recorded later change');
const server=createServer(async(req,res)=>{
 const name=new URL(req.url,'http://local').pathname.slice(1);
 if(name==='original'||name==='candidate'){
  res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'}).end('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><section id="host"></section><script src="/'+name+'.js"></script><script>window.uid="fake-owner";window.store=null;window.saves=0;window.io={uid:()=>uid,load:()=>store,save:s=>{store=s;saves++;return true},now:()=>Date.UTC(2026,9,21),random:()=>0};NobiEikenVocab.mount(document.querySelector("#host"),io)</script>');return;
 }
 try{const body=name==='original.js'?original:name==='candidate.js'?candidate:await readFile(new URL(name,assets));if(!['original.js','candidate.js','eiken-vocab-bank.json'].includes(name)){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':name.endsWith('.js')?'text/javascript':'application/json'}).end(body);}catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;let browser,checks=0;const ok=(v,m)=>{assert(v,m);checks++;},reproductions=[];
async function open(width,kind,unsupported=false){
 const p=await browser.newPage({viewport:{width,height:900},serviceWorkers:'block'});p.outside=[];p.errors=[];
 await p.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():(p.outside.push(r.request().url()),r.abort()));p.on('pageerror',e=>p.errors.push(e.message));
 await p.addInitScript(()=>{
  window.fx={defer:false,denied:false,pending:[],streams:[],recorders:[],timers:[],urls:[],revoked:[],started:0,stopped:0,paused:0};
  const timeout=window.setTimeout.bind(window),clear=window.clearTimeout.bind(window);let timerId=-1;
  window.setTimeout=(fn,ms,...args)=>{if(ms===3000){const id=timerId--;fx.timers.push({id,fn:()=>fn(...args),active:true});return id;}return timeout(fn,ms,...args);};
  window.clearTimeout=id=>{if(id<0){const t=fx.timers.find(t=>t.id===id);if(t)t.active=false;}else clear(id);};
  fx.flush=()=>{for(const t of fx.timers.filter(t=>t.active)){t.active=false;t.fn();}};
  const stream=()=>{const track={ended:false,stop(){if(!this.ended){this.ended=true;fx.stopped++;}}};const s={track,getTracks:()=>[track]};fx.streams.push(s);return s;};
  Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:()=>{if(fx.denied)return Promise.reject(Error('denied'));if(fx.defer)return new Promise(resolve=>fx.pending.push(()=>resolve(stream())));return Promise.resolve(stream());}}});
  window.MediaRecorder=class{constructor(s){this.stream=s;this.state='inactive';this.mimeType='audio/webm';fx.recorders.push(this);}start(){this.state='recording';fx.started++;}stop(){if(this.state==='inactive')return;this.state='inactive';this.ondataavailable?.({data:new Blob(['synthetic'],{type:this.mimeType})});this.onstop?.();}};
  Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{cancel(){},speak(){},getVoices:()=>[]}});window.SpeechSynthesisUtterance=function(t){this.text=t;};
  const make=URL.createObjectURL.bind(URL),revoke=URL.revokeObjectURL.bind(URL);URL.createObjectURL=b=>{const u=make(b);fx.urls.push(u);return u;};URL.revokeObjectURL=u=>{fx.revoked.push(u);revoke(u);};
  HTMLMediaElement.prototype.pause=function(){fx.paused++;};
 });
 await p.goto(origin+'/'+kind);await p.getByRole('button',{name:'5級を10問はじめる'}).click();if(unsupported)await p.evaluate(()=>{window.MediaRecorder=undefined;});await p.getByRole('button',{name:'わからないので答えを見る'}).click();return p;
}
const press=p=>p.getByRole('button',{name:'お手本を聞いたあと、自分の声を3秒録音して聞き返す'}).click();
const settle=p=>p.evaluate(async()=>{await Promise.resolve();await new Promise(r=>setTimeout(r,0));});
async function finish(p){ok(!p.outside.length&&!p.errors.length,'no outside calls or page errors');ok(await p.evaluate(()=>saves===1),'recording never adds learning writes');await p.close();}
try{
 browser=await chromium.launch({headless:true});
 for(const width of [390,1440]){
  // Reproduce real old code before applying any candidate expectations.
  let p=await open(width,'original');await p.evaluate(()=>fx.defer=true);await press(p);await p.evaluate(()=>{NobiEikenVocab.stopSentencePractice();fx.pending.shift()();});await settle(p);
  const before=await p.evaluate(()=>({started:fx.started,stopped:fx.stopped,recording:fx.recorders[0]?.state}));
  ok(before.started===1&&before.stopped===0&&before.recording==='recording','original late permission starts recording after teardown');reproductions.push({width,...before});await finish(p);
  p=await open(width,'candidate');await p.evaluate(()=>fx.defer=true);await press(p);await p.evaluate(()=>{NobiEikenVocab.stopSentencePractice();fx.pending.shift()();});await settle(p);
  ok(await p.evaluate(()=>fx.started===0&&fx.stopped===1),'late permission after exit releases stream without starting');ok(await p.locator('.ev-shadow audio').count()===0,'no old-owner audio published after exit');await finish(p);
  p=await open(width,'candidate');await press(p);await settle(p);await p.evaluate(()=>NobiEikenVocab.stopSentencePractice());
  ok(await p.evaluate(()=>fx.stopped===1&&fx.recorders[0].state==='inactive'),'active recorder stopped immediately at exit');
  await p.evaluate(()=>{fx.recorders[0].ondataavailable?.({data:new Blob(['late'])});fx.recorders[0].onstop?.();fx.flush();});
  ok(await p.locator('.ev-shadow audio').count()===0,'late recorder events and timer cannot publish after exit');await finish(p);
  p=await open(width,'candidate');await p.evaluate(()=>fx.defer=true);await press(p);await p.evaluate(()=>{uid='different-owner';fx.pending.shift()();});await settle(p);
  ok(await p.evaluate(()=>fx.started===0&&fx.stopped===1),'late permission for changed owner never records');await finish(p);
  p=await open(width,'candidate');await press(p);await settle(p);await p.evaluate(()=>fx.flush());
  ok(await p.locator('.ev-shadow audio').count()===1,'normal3second completion provides one local playback');ok(await p.evaluate(()=>fx.stopped===1),'normal completion releases mic');
  await press(p);await settle(p);await p.evaluate(()=>fx.flush());
  ok(await p.locator('.ev-shadow audio').count()===1,'retry replaces playback without duplicates');ok(await p.evaluate(()=>fx.stopped===2&&fx.revoked.length===1),'retry releases old objectURL');
  await p.evaluate(()=>NobiEikenVocab.stopSentencePractice());ok(await p.evaluate(()=>fx.revoked.length===2&&fx.paused>0),'exit pauses playback and releases last URL');await finish(p);
  p=await open(width,'candidate');await press(p);await settle(p);await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  ok(await p.evaluate(()=>fx.stopped===1&&fx.recorders[0].state==='inactive'),'hidden screen stops active mic');
  await p.evaluate(()=>Object.defineProperty(document,'hidden',{configurable:true,value:false}));await press(p);await settle(p);ok(await p.evaluate(()=>fx.started===2),'visible screen can retry after cancellation');
  await p.evaluate(()=>document.querySelector('#host').replaceChildren());await settle(p);ok(await p.evaluate(()=>fx.stopped===2),'detached feedback stops active mic');await finish(p);
  p=await open(width,'candidate');await p.evaluate(()=>fx.denied=true);await press(p);ok(await p.getByRole('button',{name:'お手本を聞いたあと、自分の声を3秒録音して聞き返す'}).isEnabled(),'denied mic allows retry');await p.evaluate(()=>fx.denied=false);await press(p);await settle(p);
  await p.evaluate(()=>fx.recorders[0].onerror());ok(await p.evaluate(()=>fx.stopped===1),'recorder error releases mic');await press(p);await settle(p);await p.evaluate(()=>dispatchEvent(new Event('pagehide')));ok(await p.evaluate(()=>fx.stopped===2),'pagehide releases retry mic');await finish(p);
  p=await open(width,'candidate');await p.evaluate(()=>fx.defer=true);await press(p);
  await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));Object.defineProperty(document,'hidden',{configurable:true,value:false});});
  await press(p);await p.evaluate(()=>fx.pending[1]());await settle(p);await p.evaluate(()=>fx.pending[0]());await settle(p);
  ok(await p.evaluate(()=>fx.started===1&&fx.stopped===1&&fx.recorders[0].state==='recording'),'late first permission releases only first stream and preserves newer recording');
  await p.evaluate(()=>fx.flush());ok(await p.locator('.ev-shadow audio').count()===1&&await p.evaluate(()=>fx.stopped===2),'new recording completes after stale permission without teardown collision');await finish(p);
  p=await open(width,'candidate',true);ok(await p.locator('.ev-shadow').count()===0,'unsupported recorder hides optional recording without breaking vocabulary');await finish(p);
  console.log(width+': original leak reproduced; candidate exit/late permission/owner/retry/hide/detach/error passed');
 }
 await writeFile(new URL(integrated?'integrated-browser-result.json':'browser-result.json',here),JSON.stringify({status:'passed',integrated,checks,reproductions,originalSha256:hash(original),candidateSha256:hash(candidate),realDevices:false,realUsers:false,outsideRequests:0},null,2)+'\n');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
