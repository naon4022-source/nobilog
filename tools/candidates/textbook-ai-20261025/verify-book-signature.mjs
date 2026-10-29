// Actual book renderer/model; no login, grades, submissions, private records, or provider requests.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {TEXTBOOK_AI_CONTEXTS} from '../../../cf-worker/src/textbook-ai-context-manifest.mjs';
const require=createRequire(import.meta.url);
const {chromium}=require('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const ROOT=new URL('../../../',import.meta.url),ASSETS=new URL('site-assets/',ROOT);
const modelTag='<script src="/textbook-annotation-model.js"></script>';
const html='<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="/textbook-book.css">'+modelTag+'<script>window.nobiTextbookAnnotationAPI={};window.signatureBoundaries=[];window.NobiTextbookAnnotations={unmount(){},mount(app,book,context){signatureBoundaries.push({book,signature:context.annotationSignature,canLocate:typeof context.locate===\'function\'});}};</script><section id="view-textbook"><div id="textbook-app" class="tb-app"></div></section><script src="/textbook-book.js"></script>';
const types={js:'text/javascript',css:'text/css',json:'application/json',svg:'image/svg+xml',png:'image/png',jpg:'image/jpeg',webp:'image/webp',mp4:'video/mp4',mp3:'audio/mpeg',woff2:'font/woff2'};
const server=createServer(async(req,res)=>{
 const url=new URL(req.url,'http://fixture.test'),name=decodeURIComponent(url.pathname.slice(1));
 if(!name){res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'});res.end(url.searchParams.has('no-model')?html.replace(modelTag,''):html);return;}
 if(!/^[a-zA-Z0-9._/-]+$/.test(name)||name.split('/').includes('..')){res.writeHead(404).end();return;}
 try{const bytes=await readFile(new URL(name,ASSETS));res.writeHead(200,{'Content-Type':types[name.split('.').pop()]||'application/octet-stream'});res.end(bytes);}catch(_){res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port,errors=[],outside=[],results=[];
let browser,checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++;};
async function pageOf(options={}){
 const context=await browser.newContext({viewport:{width:390,height:900}}),page=await context.newPage();
 await page.addInitScript(noStorage=>{Element.prototype.requestFullscreen=undefined;Element.prototype.webkitRequestFullscreen=undefined;if(noStorage)Storage.prototype.setItem=function(){throw Error('synthetic storage unavailable');};},!!options.noStorage);
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',route=>{if(route.request().url().startsWith(origin+'/'))return route.continue();outside.push(new URL(route.request().url()).origin);return route.abort();});
 await page.goto(origin+(options.noModel?'/?no-model=1':'/'));
 return {page,context};
}
async function open(page,title){
 await page.getByRole('button',{name:'全画面で教科書を開く',exact:true}).click();
 await page.getByRole('button',{name:title+'を開く',exact:true}).evaluate(button=>button.click());
 await page.locator('.tb-spread').waitFor({timeout:240000});
}
async function snapshot(page){return page.evaluate(()=>({book:NobiTextbook._state.book.meta.id,signature:NobiTextbook._state.book.annotationSignature,boundary:signatureBoundaries.at(-1)}));}
try{
 browser=await chromium.launch({headless:true});
 const {page,context}=await pageOf();
 for(const book of Object.keys(TEXTBOOK_AI_CONTEXTS)){
  const data=JSON.parse(await readFile(new URL('textbook-book-'+book+'.json',ASSETS),'utf8'));
  await open(page,data.title);
  for(const width of [390,1440]){
   await page.setViewportSize({width,height:900});const s=await snapshot(page);
   ok(s.book===book&&s.boundary.book===book,'selected actual book preserved');
   ok(s.signature===TEXTBOOK_AI_CONTEXTS[book].annotationSignature&&s.boundary.signature===s.signature,'actual source signature reaches boundary at '+width);
   ok(s.boundary.canLocate,'existing locate callback preserved');
  }
  results.push({book,widths:[390,1440],signature:TEXTBOOK_AI_CONTEXTS[book].annotationSignature});
  await page.evaluate(()=>NobiTextbook.leave());
 }
 await context.close();
 const noStorage=await pageOf({noStorage:true});
 await open(noStorage.page,'理科 1');const stored=await snapshot(noStorage.page);
 ok(stored.signature===TEXTBOOK_AI_CONTEXTS.science1.annotationSignature&&stored.boundary.signature===stored.signature,'source identity works with layout storage unavailable');
 await noStorage.context.close();
 const noModel=await pageOf({noModel:true});await open(noModel.page,'理科 1');const missing=await snapshot(noModel.page);
 ok(missing.signature===''&&missing.boundary.signature==='','missing source identity is explicit; never invented from cache');
 await noModel.context.close();ok(errors.length===0,'no renderer errors');ok(outside.length===0,'no external requests');
 const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
 const edit=JSON.parse(await readFile(new URL('./book-signature-edit.json',import.meta.url),'utf8'));
 let expected=await readFile(new URL(edit.beforeFile,ROOT),'utf8');for(const e of edit.edits){ok(expected.split(e.before).length===2,'unique metadata edit');expected=expected.replace(e.before,e.after);}
 const actual=await readFile(new URL(edit.file,ROOT),'utf8');ok(expected===actual&&sha(actual)===edit.afterSha256,'entire renderer equals its predecessor plus only two metadata edits');
 const result={status:'passed',checks,results,storageUnavailable:true,missingIdentityClosed:true,rendererSha256:sha(actual),scope:'actual six books/model/renderer at390/1440; source metadata only; no real user data, grading, provider calls or AI UI'};
 await writeFile(new URL('./book-signature-result.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log('Actual book source signature: '+checks+' checks passed');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
