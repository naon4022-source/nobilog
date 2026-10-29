import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash,webcrypto} from 'node:crypto';
import vm from 'node:vm';
import {build} from './build-media-contexts.mjs';
import {TEXTBOOK_VISION_MEDIA} from './textbook-vision-media-manifest.mjs';
import {checkedMediaCatalog,isCheckedMediaCatalog,mediaReference,publicMediaContextReader} from './textbook-vision-media-context.mjs';
import {TEXTBOOK_AI_CONTEXTS} from '../../../cf-worker/src/textbook-ai-context-manifest.mjs';
import {textbookReference} from '../../../cf-worker/src/textbook-ai-chat-content.mjs';
const root=new URL('../../../',import.meta.url),here=new URL('./',import.meta.url),sha=x=>createHash('sha256').update(x).digest('hex');
let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++;},same=(a,b,m)=>{assert.deepEqual(a,b,m);checks++;};
const bytesByPath=new Map(),protectedFiles=new Map(),inputs=[];
for(const book of Object.keys(TEXTBOOK_AI_CONTEXTS))for(const file of ['site-assets/textbook-book-'+book+'.json','site-assets'+TEXTBOOK_AI_CONTEXTS[book].src])protectedFiles.set(file,sha(await readFile(new URL(file,root))));
for(const file of ['site-assets/textbook-annotation-model.js','site-assets/textbook-ai.js','site-assets/textbook-book.js','cf-worker/src/textbook-ai-context-manifest.mjs'])protectedFiles.set(file,sha(await readFile(new URL(file,root))));
await build('--check');checks++;
const box=vm.createContext({crypto:webcrypto,TextEncoder});vm.runInContext(await readFile(new URL('site-assets/textbook-annotation-model.js',root),'utf8'),box);
for(const [book,entry]of Object.entries(TEXTBOOK_VISION_MEDIA)){
 const bytes=await readFile(new URL('media-contexts'+entry.src,here));bytesByPath.set(entry.src,bytes);
 const catalog=await checkedMediaCatalog(bytes,book);ok(isCheckedMediaCatalog(catalog),'SHA verified catalog');ok(!isCheckedMediaCatalog(JSON.parse(bytes)),'unverified parsed copy refused');
 assert.throws(()=>mediaReference(JSON.parse(bytes),catalog.contexts[0].anchor),/context_unavailable/);checks++;
 same(catalog.contexts.length,entry.count,'fixed source count');
 const raw=await readFile(new URL('site-assets/textbook-book-'+book+'.json',root),'utf8'),source=JSON.parse(raw),before=JSON.stringify(source),prepared=await box.NobiTextbookAnnotationModel.prepare(source,book);
 same(JSON.stringify(source),before,'prepare never mutates raw source');same(prepared.signature,entry.annotationSignature,'old signature unchanged');
 const old=JSON.parse(await readFile(new URL('site-assets'+TEXTBOOK_AI_CONTEXTS[book].src,root))),oldAnchors=new Set(old.contexts.map(x=>x.anchor));
 const roots=new Map(source.pages.flatMap(p=>(p.blocks||[]).filter(b=>b.t==='media'&&b.kind!=='video'&&/^\/textbook-book-[a-z0-9-]+\.(svg|jpg|png)$/.test(b.src||'')).map(b=>[b.src,b])));
 same(roots.size,entry.count,'all root media covered exactly once');
 for(const row of catalog.contexts){
  ok(roots.has(row.src),'root source exists');ok(!oldAnchors.has(row.anchor),'separate namespace has no marker collision');
  same(sha(await readFile(new URL('site-assets'+row.src,root))),row.assetSha256,'actual image bytes match');
  const ref=mediaReference(catalog,row.anchor);same(textbookReference(ref),ref,'exact original 13-field reference shape');
  ok(!Object.hasOwn(ref,'src')&&!Object.hasOwn(ref,'assetSha256'),'public provider reference contains no extra source transport fields');
 }
 const changed=Buffer.from(bytes);changed[changed.length-2]^=1;await assert.rejects(()=>checkedMediaCatalog(changed,book),/context_changed/);checks++;
 inputs.push({file:'tools/candidates/textbook-vision-20261027/media-contexts'+entry.src,sha256:sha(bytes)});
}
let calls=0;
const reader=publicMediaContextReader({fetcher:async request=>{calls++;ok(request.method==='GET','public GET only');ok(!request.headers.has('Authorization')&&!request.headers.has('Cookie'),'no private header forwarding');ok(request.redirect==='error','no redirects');return new Response(bytesByPath.get(new URL(request.url).pathname),{headers:{'Content-Type':'application/json'}});}});
for(const [book,entry]of Object.entries(TEXTBOOK_VISION_MEDIA)){
 const row=JSON.parse(bytesByPath.get(entry.src)).contexts[0],selection={book,anchor:row.anchor,annotationSignature:entry.annotationSignature};
 const [a,b]=await Promise.all([reader({APP_ORIGIN:'https://fixture.invalid'},selection),reader({APP_ORIGIN:'https://fixture.invalid'},selection)]);same(a,b,'concurrent immutable public cache');
 await assert.rejects(()=>reader({APP_ORIGIN:'https://fixture.invalid'},{...selection,contextSha256:'0'.repeat(64)}),/context_changed/);checks++;
 await assert.rejects(()=>reader({APP_ORIGIN:'https://fixture.invalid'},{...selection,anchor:'0'.repeat(64)}),/context_not_found/);checks++;
 await assert.rejects(()=>reader({APP_ORIGIN:'https://fixture.invalid'},{...selection,url:'https://evil.invalid'}),/invalid_context/);checks++;
 await assert.rejects(()=>reader({APP_ORIGIN:'http://fixture.invalid'},selection),/context_unavailable/);checks++;
}
same(calls,12,'concurrent request I/O is separate; only completed public data cached');
const first=TEXTBOOK_VISION_MEDIA.math1,sel={book:'math1',anchor:JSON.parse(bytesByPath.get(first.src)).contexts[0].anchor,annotationSignature:first.annotationSignature};
for(const response of [()=>Response.redirect('https://evil.invalid'),()=>new Response('x',{headers:{'Content-Type':'text/html'}}),()=>new Response('x',{headers:{'Content-Type':'application/json','Content-Length':'2000001'}}),()=>new Response('x',{headers:{'Content-Type':'application/json'}})]){
 const bad=publicMediaContextReader({fetcher:async()=>response()});await assert.rejects(()=>bad({APP_ORIGIN:'https://fixture.invalid'},sel));checks++;
}
let attempts=0;const retry=publicMediaContextReader({fetcher:async()=>{if(++attempts===1)throw Error('fixture_network');return new Response(bytesByPath.get(first.src),{headers:{'Content-Type':'application/json'}});}});
await assert.rejects(()=>retry({APP_ORIGIN:'https://fixture.invalid'},sel),/fixture_network/);checks++;ok(!!await retry({APP_ORIGIN:'https://fixture.invalid'},sel),'failed cache can recover');same(attempts,2,'no poisoned promise cache');
for(const [file,digest]of protectedFiles){same(sha(await readFile(new URL(file,root))),digest,'main source preserved');inputs.push({file,sha256:digest});}
for(const file of ['build-media-contexts.mjs','textbook-vision-media-context.mjs','textbook-vision-media-dom.mjs','textbook-vision-media-manifest.mjs','verify-media-contexts.mjs'])inputs.push({file:'tools/candidates/textbook-vision-20261027/'+file,sha256:sha(await readFile(new URL(file,here)))});
await writeFile(new URL('media-context-result.json',here),JSON.stringify({status:'passed',checks,media:504,books:6,inputs,scope:'Candidate identity/reference supplement only. All root images exist and match source SHA; root-only extraction excludes closed answers/videos. Original source/catalog/marker IDs preserved. Not image content review, provider connection or main integration.'},null,2)+'\n');
console.log('Media context supplement: '+checks+' checks passed.');
