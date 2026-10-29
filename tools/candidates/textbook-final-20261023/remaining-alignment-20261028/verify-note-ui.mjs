// Actual annotation UI/model with revised-book anchors and synthetic old notes only.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
const {chromium}=createRequire(import.meta.url)('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const here=new URL('./',import.meta.url),root=new URL('../../../../',here),stage=new URL('integration-contexts/',here),sha=b=>createHash('sha256').update(b).digest('hex');
const inputs=[];
async function pinned(url){const bytes=await readFile(url);inputs.push({url:url.href,sha256:sha(bytes)});return bytes;}
const datasets=new Map();
for(const [book,changed]of [['kokugo1',9],['english1',12]]){
 const old=JSON.parse(await pinned(new URL(`site-assets/textbook-ai-context-${book}.json`,root)));
 const next=JSON.parse(await pinned(new URL(`output/site-assets/textbook-ai-context-${book}.json`,stage)));
 const anchors=next.contexts.map(r=>r.anchor),set=new Set(anchors);
 const orphaned=old.contexts.filter(r=>!set.has(r.anchor)),kept=old.contexts.find(r=>set.has(r.anchor));
 assert.equal(orphaned.length,changed);
 const rows=[...orphaned,kept].map((r,i)=>({book,anchor:r.anchor,quote:r.quote,color:'yellow',note:'Synthetic retained note '+String(i).padStart(3,'0'),revision:1,updatedAt:1}));
 datasets.set(book,{anchors,rows,kept,changed});
}
const assets=new Map();
for(const name of ['textbook-annotation-model.js','textbook-annotations.js','textbook-annotations.css'])assets.set('/'+name,await pinned(new URL('site-assets/'+name,root)));
const html='<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/textbook-annotations.css"><div id="fixture"><div class="tb-bar-actions"></div><p id="retained"></p></div><script src="/textbook-annotation-model.js"></script><script src="/textbook-annotations.js"></script>';
const server=createServer((req,res)=>{
 if(req.url==='/')return res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'}).end(html);
 const bytes=assets.get(req.url);if(!bytes)return res.writeHead(404).end();
 res.writeHead(200,{'Content-Type':req.url.endsWith('.css')?'text/css':'text/javascript'}).end(bytes);
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
const screenshots=new URL('note-ui-screens-attempt2/',stage);await mkdir(screenshots);
const results=[],outside=[],errors=[];let browser,checks=0;
const ok=(v,m)=>{assert.ok(v,m);checks++;};
try{
 browser=await chromium.launch({headless:true});
 for(const [book,{anchors,rows,kept,changed}]of datasets)for(const width of [390,1180]){
  const page=await browser.newPage({viewport:{width,height:900}});
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>{if(r.request().url().startsWith(origin+'/'))return r.continue();outside.push(r.request().url());return r.abort();});
  await page.addInitScript(({rows,anchors})=>{
   const owner=Object.freeze({uid:'fixture-synthetic-only'});
   window.fixtureNotes=rows;window.fixtureAnchors=new Set(anchors);window.fixtureGets=0;window.fixturePosts=0;
   window.nobiTextbookAnnotationAPI={available:()=>true,snapshot:()=>owner,matches:o=>o===owner,
    get:async book=>{window.fixtureGets++;return {book,items:structuredClone(rows),writable:true};},
    post:async()=>{window.fixturePosts++;throw Error('unexpected synthetic write');}};
  },{rows,anchors});
  await page.goto(origin);
  await page.evaluate(({kept,book})=>{
   const node=document.querySelector('#retained');node.dataset.annotationAnchor=kept.anchor;node.dataset.annotationQuote=kept.quote;node.textContent=kept.quote;
   NobiTextbookAnnotations.mount(document.querySelector('#fixture'),book,{locate:anchor=>fixtureAnchors.has(anchor)});
  },{kept,book});
  await page.getByRole('button',{name:'マーカー・メモ',exact:true}).click();
  await page.waitForFunction(count=>document.querySelectorAll('.tb-ann-record').length===count,rows.length);
  for(const row of rows.slice(0,changed)){
   const record=page.locator('.tb-ann-record').filter({hasText:row.note});
   ok(await record.locator('blockquote').textContent()===row.quote,'old quote retained in actual list');
   await record.getByRole('button',{name:'この文章を見る',exact:true}).click();
   await page.getByText('原稿が更新されたため、今の本に同じ文章が見つかりません。メモは保存されています。',{exact:true}).waitFor();
   ok(await page.locator('.tb-ann-record').count()===rows.length,'missing current anchor does not remove saved notes');
   await page.locator('.tb-ann-record').filter({hasText:row.note}).getByRole('button',{name:'メモを開く',exact:true}).click();
   ok(await page.getByRole('textbox',{name:'教科書メモ',exact:true}).inputValue()===row.note,'orphaned text memo still opens');
   ok(await page.getByRole('dialog').locator('blockquote').textContent()===row.quote,'editor keeps old quote');
   await page.getByRole('button',{name:'閉じる',exact:true}).click();
   await page.getByRole('button',{name:'マーカー・メモ',exact:true}).click();
   await page.waitForFunction(count=>document.querySelectorAll('.tb-ann-record').length===count,rows.length);
  }
  // Capture the source-update explanation without hiding or replacing actual UI.
  await page.locator('.tb-ann-record').filter({hasText:rows[0].note}).getByRole('button',{name:'この文章を見る',exact:true}).click();
  await page.getByText('原稿が更新されたため、今の本に同じ文章が見つかりません。メモは保存されています。',{exact:true}).waitFor();
  const screenshot='notes-'+book+'-'+width+'.png';await page.screenshot({path:new URL(screenshot,screenshots).pathname});
  await page.locator('.tb-ann-record').filter({hasText:rows[changed].note}).getByRole('button',{name:'この文章を見る',exact:true}).click();
  ok(await page.locator('#retained').evaluate(n=>n.classList.contains('tb-ann-locate')),'unchanged anchor still locates original block');
  ok(await page.evaluate(()=>fixturePosts===0),'no automatic note write or migration');
  ok(await page.evaluate(count=>fixtureNotes.length===count,rows.length),'fixture records unchanged');
  results.push({book,width,orphanedNotes:changed,savedNotes:rows.length,screenshot,sha256:sha(await readFile(new URL(screenshot,screenshots)))});
  await page.close();
 }
 ok(!outside.length,'no external request');ok(!errors.length,errors.join('|'));
 for(const row of inputs)ok(sha(await readFile(new URL(row.url)))===row.sha256,'public input unchanged');
 await writeFile(new URL('note-ui-result.json',stage),JSON.stringify({status:'passed',checks,results,inputs,scope:'Actual unchanged annotation UI/model,2 candidate catalogs,390/1180 widths. All21 changed-text notes retain original quotes/editor and source-update notice; unchanged anchors locate. Synthetic API only;0 writes/no real storage/login/AI/network. Full reader/pagination and main integration separate.'},null,2)+'\n');
 console.log('Synthetic old-note actual UI: '+checks+' checks passed;2 books,2 widths;0 writes.');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
