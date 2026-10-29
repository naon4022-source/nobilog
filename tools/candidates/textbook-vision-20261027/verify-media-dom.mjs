// Browser identity boundaries only; actual book/panel is verified separately.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {TEXTBOOK_VISION_MEDIA} from './textbook-vision-media-manifest.mjs';
const require=createRequire(import.meta.url),{chromium}=require('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const here=new URL('./',import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex'),sources=new Map(),inputs=[];
for(const name of ['textbook-vision-media-context.mjs','textbook-vision-media-dom.mjs','textbook-vision-media-manifest.mjs','textbook-vision-media-browser.mjs'])sources.set('/'+name,await readFile(new URL(name,here)));
for(const entry of Object.values(TEXTBOOK_VISION_MEDIA))sources.set(entry.src,await readFile(new URL('media-contexts'+entry.src,here)));
const server=createServer((req,res)=>{const path=new URL(req.url,'http://fixture').pathname;if(path==='/'){res.writeHead(200,{'Content-Type':'text/html'}).end('<!doctype html><main id="app"></main>');return;}const bytes=sources.get(path);if(!bytes){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':path.endsWith('.mjs')?'text/javascript':'application/json'}).end(bytes);});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({headless:true});
let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++;};
try{
 const page=await browser.newPage();await page.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());await page.goto(origin);
 for(const [book,entry]of Object.entries(TEXTBOOK_VISION_MEDIA)){
  const result=await page.evaluate(async({book,entry})=>{
   const {checkedMediaCatalog}=await import('/textbook-vision-media-context.mjs'),{attachMediaIdentities}=await import('/textbook-vision-media-dom.mjs'),catalog=await checkedMediaCatalog(new Uint8Array(await(await fetch(entry.src)).arrayBuffer()),book),app=document.getElementById('app');app.replaceChildren();
   const article=document.createElement('article');article.className='tb-page';app.append(article);
   function figure(row){const n=document.createElement('figure');n.className='tb-media';const img=document.createElement('img');img.src=row.src;n.append(img);return n;}
   for(const row of catalog.contexts)article.append(figure(row));
   const old=document.createElement('p');old.dataset.annotationAnchor='a'.repeat(64);old.dataset.annotationQuote='original marker';article.append(old);const oldBefore=old.outerHTML;
   const assigned=attachMediaIdentities(app,catalog,{current:()=>true}),all=catalog.contexts.every(row=>article.querySelector('[data-vision-anchor="'+row.anchor+'"]')?.querySelector('img').getAttribute('src')===row.src);
   const first=catalog.contexts[0],duplicate=figure(first);article.append(duplicate);attachMediaIdentities(app,catalog,{current:()=>true});const ambiguous=app.querySelectorAll('[data-vision-anchor="'+first.anchor+'"]').length===0;duplicate.remove();
   const details=document.createElement('details');details.append(figure(first));article.append(details);const hidden=document.createElement('div');hidden.hidden=true;hidden.append(figure(first));article.append(hidden);attachMediaIdentities(app,catalog,{current:()=>true});
   const hiddenExcluded=!details.querySelector('[data-vision-anchor]')&&!hidden.querySelector('[data-vision-anchor]')&&app.querySelectorAll('[data-vision-anchor="'+first.anchor+'"]').length===1;
   const marker=figure(first);marker.dataset.annotationAnchor='b'.repeat(64);marker.dataset.annotationQuote='old figure';article.append(marker);const markerBefore=marker.outerHTML;attachMediaIdentities(app,catalog,{current:()=>true});const oldPreserved=old.outerHTML===oldBefore&&marker.outerHTML===markerBefore;
   let unverified=false;try{attachMediaIdentities(app,JSON.parse(JSON.stringify(catalog)),{current:()=>true});}catch(_){unverified=true;}
   let wrongOwner=false;const before=app.innerHTML;try{attachMediaIdentities(app,catalog,{current:()=>false});}catch(_){wrongOwner=app.innerHTML===before;}
   const {prepare}=await import('/textbook-vision-media-browser.mjs');let changed=false,stale=false,calls=0;try{await prepare(app,book,entry.annotationSignature,{current:()=>++calls===1});}catch(e){changed=e.message==='account_changed';}
   try{await prepare(app,book,'0'.repeat(64),{current:()=>true});}catch(e){stale=e.message==='context_changed';}
   return {assigned,all,ambiguous,hiddenExcluded,oldPreserved,unverified,wrongOwner,changed,stale};
  },{book,entry});
  ok(result.assigned===entry.count,'all root identities attached '+book);for(const key of ['all','ambiguous','hiddenExcluded','oldPreserved','unverified','wrongOwner','changed','stale'])ok(result[key],key+' '+book);
 }
 for(const [path,bytes]of sources)inputs.push({file:'tools/candidates/textbook-vision-20261027/'+(path.endsWith('.json')?'media-contexts':'')+path,sha256:sha(bytes)});
 inputs.push({file:'tools/candidates/textbook-vision-20261027/verify-media-dom.mjs',sha256:sha(await readFile(new URL('verify-media-dom.mjs',here)))});
 await writeFile(new URL('media-dom-result.json',here),JSON.stringify({status:'passed',checks,media:504,inputs,scope:'Real browser, synthetic root image DOM from six exact catalogs. No image content or real-book visual completion claim. Duplicate/hidden/closed-answer/old-marker/owner/source boundaries checked. No provider or main writes.'},null,2)+'\n');console.log('Media DOM identity supplement: '+checks+' checks passed.');
}finally{await browser.close();await new Promise(r=>server.close(r));}
