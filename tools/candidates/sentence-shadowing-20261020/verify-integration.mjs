// 📚 英検の英単語カード：画面の検証（Claude・2026-10-07）。localhost の合成ページで本物の部品と本物の単語データを使う。外部通信なし・実データなし。
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=new URL('../../../site-assets/',import.meta.url);
const bank=JSON.parse(await readFile(new URL('eiken-vocab-bank.json',base),'utf8'));
const J=(y,m,d,h=0,mi=0)=>Date.UTC(y,m-1,d,h-9,mi);   // 日本時間 → ms
const T0=J(2026,10,6,20);
const html=`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/eiken-vocab.css"><style>body{margin:0;padding:16px;font:16px sans-serif}</style>
<section id="eiken-vocab"></section><script src="/sentence-shadowing.js"></script><script src="/eiken-vocab.js"></script>
<script>window.__store=null;window.__saves=0;window.__failSave=false;window.__uid='v_test';window.__now=${T0};window.__seed=7;
window.io={uid:()=>window.__uid,now:()=>window.__now,random:()=>{window.__seed=(window.__seed*1103515245+12345)>>>0;return window.__seed/4294967296;},
 load:()=>window.__store?JSON.parse(window.__store):null,save:v=>{if(window.__failSave)return false;window.__store=JSON.stringify(v);window.__saves++;return true;}};
window.remount=()=>NobiEikenVocab.mount(document.getElementById('eiken-vocab'),window.io);remount();</script>`;
const server=createServer(async(req,res)=>{const name=req.url.split('?')[0].slice(1);if(!name){res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'});res.end(html);return;}
 try{let body;try{if(process.argv.includes('--main'))throw Error('main');body=await readFile(new URL('integration-candidate/site-assets/'+name,import.meta.url));}catch{body=await readFile(new URL(name,base));}res.writeHead(200,{'Content-Type':name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'application/json'});res.end(body);}catch(_){res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port+'/';
let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++;};
const g5=bank.grades.find(g=>g.id==='5').words,W=s=>[].concat(...bank.grades.map(g=>g.words)).find(w=>w.w===s);
let browser;const shots=process.argv.includes('--shots')?'/tmp/nobi-eiken-vocab':null;if(shots)(await import('node:fs')).mkdirSync(shots,{recursive:true});
const shot=async(page,n)=>{if(shots)await page.screenshot({path:shots+'/'+n+'.png',fullPage:true});};
async function openPage(width,height){
 const page=await browser.newPage({viewport:{width,height}});page.__errors=[];page.on('pageerror',e=>page.__errors.push(e.message));
 page.__outside=[];await page.route('**/*',r=>{if(new URL(r.request().url()).hostname==='127.0.0.1')return r.continue();page.__outside.push(r.request().url());return r.abort();});
 await page.goto(url);await page.locator('.ev-tab').first().waitFor();return page;
}
const noOverflow=async(page,m)=>ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no sideways scroll: '+m);
const stat=async(page,cls)=>Number(await page.locator('.ev-'+cls+' .ev-num').textContent());
const store=async page=>JSON.parse(await page.evaluate(()=>window.__store)||'{"words":{}}');
const word=async page=>(await page.locator('.ev-word').count())?await page.locator('.ev-word').textContent():await page.locator('.ev-mean').textContent();
async function type(page,v){await page.getByRole('textbox',{name:'答え'}).fill(v);await page.getByRole('button',{name:'答え合わせ'}).click();}
const next=page=>page.getByRole('button',{name:/^(次の単語へ|結果を見る)$/}).click();
try{
 browser=await chromium.launch({headless:true});
 for(const width of [390,820,1440]){
  const page=await openPage(width,900);
  await page.evaluate(()=>{
   window.micStops=0;Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async()=>({getTracks:()=>[{stop:()=>micStops++}]})}});
   window.MediaRecorder=class{constructor(){this.state='inactive';this.mimeType='audio/webm';}start(){this.state='recording';}stop(){if(this.state==='inactive')return;this.state='inactive';this.ondataavailable?.({data:new Blob(['synthetic'])});this.onstop?.();}};
  });
  await page.getByRole('button',{name:'5級を10問はじめる'}).click();
  ok(await page.locator('.ev-sentence-shadow').count()===0,'sentence controls hidden before answer '+width);
  await page.getByRole('button',{name:'わからないので答えを見る'}).click();
  ok(await page.locator('.ev-ex').textContent()===g5[0].ex,'existing sentence unchanged '+width);
  const practice=page.locator('.ev-sentence-shadow');
  const before=await page.evaluate(()=>__saves);
  await practice.getByRole('button',{name:'録音する',exact:true}).click();
  await practice.getByText('録音中です。',{exact:false}).waitFor();
  await practice.getByRole('button',{name:'録音を止める',exact:true}).click();
  ok(await practice.locator('audio').isVisible(),'sentence playback available '+width);
  ok(await page.evaluate(()=>micStops===1&&__saves===1),'recording adds no learning save '+width);
  await practice.getByRole('button',{name:'録音する',exact:true}).click();await practice.getByText('録音中です。',{exact:false}).waitFor();
  await page.getByRole('button',{name:'次の単語へ'}).click();
  ok(await page.evaluate(()=>micStops===2),'next question stops microphone '+width);
  ok(await page.locator('.ev-sentence-shadow').count()===0,'next unanswered question has no previous recording '+width);
  await page.getByRole('button',{name:'わからないので答えを見る'}).click();
  await practice.getByRole('button',{name:'録音する',exact:true}).click();await practice.getByText('録音中です。',{exact:false}).waitFor();
  await page.evaluate(()=>NobiEikenVocab.stopSentencePractice());
  ok(await page.evaluate(()=>micStops===3),'screen switch teardown stops microphone '+width);
  await page.evaluate(()=>{__uid='synthetic-other';__store=null;remount();});
  ok(await page.locator('.ev-sentence-shadow audio').count()===0,'new owner sees no recording '+width);
  await noOverflow(page,'sentence integration '+width);
  ok(page.__errors.length===0,'integration no page errors '+width);
  ok(page.__outside.length===0,'integration no outside requests '+width);
  await page.close();
 }
 console.log('Sentence integration candidate:',checks,'checks passed; synthetic only');
}finally{await browser?.close();server.close();}
