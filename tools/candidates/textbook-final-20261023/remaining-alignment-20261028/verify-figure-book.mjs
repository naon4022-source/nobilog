// Real reader, isolated two books and eight selected diagrams; no account or grading APIs.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
const {chromium}=createRequire(import.meta.url)('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const here=new URL('./',import.meta.url),root=new URL('../../../../',here),assets=new URL('site-assets/',root);
const sha=b=>createHash('sha256').update(b).digest('hex'),inputs=new Map(),overrides=new Map();
async function pin(url){const bytes=await readFile(url);inputs.set(url.href,sha(bytes));return bytes;}
const selected=JSON.parse(await pin(new URL('figures/selected-visual-result.json',here))).selectedFigures;
assert.equal(new Set(selected.map(r=>r.id)).size,8);
const groups=new Map([['kokugo1',[]],['english1',[]]]);
for(const row of selected){
 const book=row.id.startsWith('K1-')?'kokugo1':'english1',url=new URL(row.file,root);
 assert.equal(sha(await pin(url)),row.sha256);
 const name=`textbook-book-${book}-${row.id.toLowerCase()}.svg`;
 overrides.set(name,url);groups.get(book).push({...row,name});
}
const proof=JSON.parse(await pin(new URL('book-result.json',here)));
for(const book of groups.keys()){
 const url=new URL(`candidate-books/textbook-book-${book}.json`,here);
 assert.equal(sha(await pin(url)),proof.books.find(r=>r.book===book).candidateSha256);
 overrides.set(`textbook-book-${book}.json`,url);
}
for(const name of ['textbook-book.js','textbook-book.css','textbook-books.json'])await pin(new URL(name,assets));
const html='<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/textbook-book.css"><div id="textbook-app" class="tb-app"></div><script src="/textbook-book.js"></script>';
const types={js:'text/javascript',css:'text/css',json:'application/json',svg:'image/svg+xml',png:'image/png',jpg:'image/jpeg',webp:'image/webp',mp4:'video/mp4'},served=new Map();
const server=createServer(async(req,res)=>{
 const name=decodeURIComponent(new URL(req.url,'http://fixture.invalid').pathname.slice(1));
 if(!name){res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'}).end(html);return;}
 const extension=name.split('.').pop();
 if(!/^[a-zA-Z0-9._-]+$/.test(name)||!types[extension]){res.writeHead(404).end();return;}
 try{const bytes=await readFile(overrides.get(name)||new URL(name,assets));if(overrides.has(name))served.set(name,sha(bytes));res.writeHead(200,{'Content-Type':types[extension],'Content-Length':bytes.length}).end(bytes);}catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port,shots=new URL('figure-book-screens/',here);
await mkdir(shots);let browser,checks=0;const results=[],errors=[],outside=[];
const ok=(value,message)=>{assert.ok(value,message);checks++;};
try{
 browser=await chromium.launch({headless:true});const page=await browser.newPage();
 await page.addInitScript(()=>{Element.prototype.requestFullscreen=undefined;Element.prototype.webkitRequestFullscreen=undefined;});
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',route=>{if(route.request().url().startsWith(origin+'/'))return route.continue();outside.push(route.request().url());return route.abort();});
 await page.goto(origin);
 for(const width of [390,820,1180,1440])for(const [book,rows]of groups){
  await page.setViewportSize({width,height:900});
  await page.getByRole('button',{name:'全画面で教科書を開く',exact:true}).click();
  await page.getByRole('button',{name:(book==='kokugo1'?'国語 1':'英語 1')+'を開く',exact:true}).evaluate(b=>b.click());
  await page.locator('.tb-spread').waitFor({timeout:240000});
  for(const row of rows){
   const n=await page.evaluate(id=>NobiTextbook._state.book.phys.find(p=>p.blocks?.some(b=>b.id===id))?.n,row.id);ok(Number.isInteger(n),'selected diagram retains a real physical-page slot');
   await page.evaluate(n=>{const form=document.querySelector('.tb-jump');form.querySelector('input').value=String(n);form.requestSubmit();},n);
   const selector=`img[src="/${row.name}"]`,img=page.locator(selector);
   await img.waitFor();await page.waitForFunction(selector=>{const img=document.querySelector(selector);return img?.complete&&img.naturalWidth===960&&img.naturalHeight===540;},selector);
   await page.evaluate(async()=>{await Promise.all(document.getAnimations().filter(a=>Number.isFinite(a.effect?.getTiming().iterations)).map(a=>a.finished.catch(()=>{})));});
   ok(await img.evaluate(img=>{const a=img.getBoundingClientRect(),b=img.closest('.tb-body').getBoundingClientRect();return a.width>0&&a.left>=b.left-1&&a.right<=b.right+1&&a.top>=b.top-1&&a.bottom<=b.bottom+1;}),'diagram fits actual page');
   ok(await page.locator('.tb-sheet-back').count()===0,'answers remain closed');
   const screenshot=`${row.id}-${width}.png`;await page.screenshot({path:new URL(screenshot,shots).pathname});
   await img.click();const zoom=page.locator('.tb-zoom-img');await zoom.waitFor();
   ok(await zoom.getAttribute('src')==='/'+row.name,'zoom opens same selected diagram');
   ok(await page.getByRole('dialog').evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=-1&&r.right<=innerWidth+1&&r.top>=-1&&r.bottom<=innerHeight+1;}),'zoom dialog fits viewport');
   const zoomScreenshot=`${row.id}-${width}-zoom.png`;
   if(width===390||width===1440)await page.screenshot({path:new URL(zoomScreenshot,shots).pathname});
   await page.getByRole('button',{name:'図を大きくする',exact:true}).click();ok(await page.getByLabel('拡大率',{exact:true}).textContent()==='150%','zoom slider button increases to150%');
   await page.getByRole('button',{name:'図を元の大きさに戻す',exact:true}).click();ok(await page.getByLabel('拡大率',{exact:true}).textContent()==='100%','reset restores100%');
   await page.getByRole('button',{name:'閉じる',exact:true}).click();ok(await page.locator('.tb-sheet-back').count()===0,'zoom closes');
   results.push({id:row.id,book,width,physicalPage:n,screenshot,zoomScreenshot:(width===390||width===1440)?zoomScreenshot:null});
   console.log(row.id,width,'real-book figure and zoom passed');
  }
  await page.evaluate(()=>NobiTextbook.leave());
 }
 ok(!errors.length,errors.join('|'));ok(!outside.length,'localhost only');
 for(const row of selected){const book=row.id.startsWith('K1-')?'kokugo1':'english1';ok(served.get(`textbook-book-${book}-${row.id.toLowerCase()}.svg`)===row.sha256,'served diagram SHA matches selected manifest');}
 for(const [url,digest]of inputs)ok(sha(await readFile(new URL(url)))===digest,'input unchanged');
 await writeFile(new URL('figure-book-result.json',here),JSON.stringify({status:'passed; direct screenshot review pending',checks,results,inputs:[...inputs].map(([url,sha256])=>({url,sha256})),scope:'Actual unchanged reader,2 candidate books,8 selected diagrams at4 widths; native diagram click/zoom/reset/close and bound checks.48 screenshots for direct review; no login/learning API/main edits. Other-page answer exposure, physical devices and whole verification are separate.'},null,2)+'\n');
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
