// Real unchanged context-reader modules + candidate manifests, synthetic public fetch only.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const here=new URL('./',import.meta.url),root=new URL('../../../../',here),stage=new URL('integration-contexts/',here);
const sha=b=>createHash('sha256').update(b).digest('hex');
const evidence=JSON.parse(await readFile(new URL('result.json',stage))),inputs=new Map();
let checks=0;
const equal=(a,b,m)=>{assert.deepEqual(a,b,m);checks++;};
const ok=(v,m)=>{assert.ok(v,m);checks++;};
async function rejects(action,reason){await assert.rejects(action,reason);checks++;}
async function pinned(url){const bytes=await readFile(url);inputs.set(url.href,sha(bytes));return bytes;}
for(const row of evidence.outputs)equal(sha(await pinned(new URL('output/'+row.file,stage))),row.sha256,'catalog candidate matches generation receipt');
const fixture=new URL('reader-fixture/',stage);await mkdir(fixture);
const moduleFiles=['textbook-ai-context.mjs','textbook-vision-media-context.mjs','textbook-vision-context-reader.mjs'];
for(const name of moduleFiles)await writeFile(new URL(name,fixture),await pinned(new URL('cf-worker/src/'+name,root)));
for(const name of ['textbook-ai-context-manifest.mjs','textbook-vision-media-manifest.mjs'])await writeFile(new URL(name,fixture),await pinned(new URL('output/cf-worker/src/'+name,stage)));
const {TEXTBOOK_AI_CONTEXTS}=await import(new URL('textbook-ai-context-manifest.mjs',fixture));
const {TEXTBOOK_VISION_MEDIA}=await import(new URL('textbook-vision-media-manifest.mjs',fixture));
const {publicTextbookContextReader}=await import(new URL('textbook-ai-context.mjs',fixture));
const {publicMediaContextReader,checkedMediaCatalog}=await import(new URL('textbook-vision-media-context.mjs',fixture));
const {visionContextReader,currentVisionEntry}=await import(new URL('textbook-vision-context-reader.mjs',fixture));
const summaries=[];
const bookProof=JSON.parse(await pinned(new URL('book-result.json',here)));
for(const book of ['kokugo1','english1']){
 const item=evidence.books.find(b=>b.book===book);
 equal(item.sourceSha256,bookProof.books.find(b=>b.book===book).candidateSha256,'exact original-builder candidate book receipt');
 const textEntry=TEXTBOOK_AI_CONTEXTS[book],mediaEntry=TEXTBOOK_VISION_MEDIA[book];
const textBytes=await pinned(new URL('output/site-assets'+textEntry.src,stage)),mediaBytes=await pinned(new URL('output/site-assets'+mediaEntry.src,stage));
const text=JSON.parse(textBytes),media=JSON.parse(mediaBytes),env={APP_ORIGIN:'https://candidate.invalid'};
const catalogs=new Map([[textEntry.src,textBytes],[mediaEntry.src,mediaBytes]]),requests=[];
const fetcher=async request=>{
 const url=new URL(request.url);equal(url.origin,env.APP_ORIGIN,'only fixed synthetic public origin');
 ok(catalogs.has(url.pathname),'only fixed catalog paths');
 equal(request.method,'GET','public metadata request only');
 ok(!request.headers.has('Cookie')&&!request.headers.has('Authorization'),'no credentials forwarded');
 requests.push(url.pathname);return new Response(catalogs.get(url.pathname),{headers:{'Content-Type':'application/json'}});
};
const readText=publicTextbookContextReader({fetcher}),reader=visionContextReader({readText,fetcher});
function selection(row,entry){return {book,anchor:row.anchor,annotationSignature:entry.annotationSignature,contextSha256:entry.sha256};}
for(const row of text.contexts){
 const value=await reader(env,selection(row,textEntry));
 equal(value.quote,row.quote,'actual text reader returns exact candidate excerpt');
 equal(value.sourceSha256,item.sourceSha256,'text belongs to aligned book');
}
for(const row of media.contexts){
 const value=await reader(env,selection(row,mediaEntry));
 equal(value.quote,row.quote,'actual media reader returns exact candidate caption');
 equal(value.sourceSha256,item.sourceSha256,'image metadata belongs to aligned book');
 ok(!Object.hasOwn(value,'src')&&!Object.hasOwn(value,'assetSha256'),'raw asset location stripped from public reference');
 const image=await pinned(new URL('sources/site-assets'+row.src,stage));
 equal(sha(image),row.assetSha256,'every referenced image matches actual candidate/current image bytes');
}
equal(requests.length,2,'completed catalogs fetched once each');
equal(currentVisionEntry(book,textEntry.sha256),textEntry,'text digest dispatches to candidate text entry');
equal(currentVisionEntry(book,mediaEntry.sha256),mediaEntry,'image digest dispatches to candidate media entry');
const firstText=selection(text.contexts[0],textEntry),firstMedia=selection(media.contexts[0],mediaEntry);
for(const value of [firstText,firstMedia]){
 await rejects(()=>reader(env,{...value,annotationSignature:'0'.repeat(64)}),/context_changed/);
 await rejects(()=>reader(env,{...value,contextSha256:'0'.repeat(64)}),/context_changed/);
 await rejects(()=>reader(env,{...value,url:'https://outside.invalid/'}),/invalid_context/);
 await rejects(()=>reader(env,{...value,anchor:'0'.repeat(64)}),/context_not_found/);
}
const oldText=JSON.parse(await pinned(new URL(`site-assets/textbook-ai-context-${book}.json`,root)));
const oldMediaBytes=await pinned(new URL(`site-assets/textbook-ai-media-context-${book}.json`,root));
await rejects(()=>reader(env,{...firstText,annotationSignature:oldText.annotationSignature}),/context_changed/);
await rejects(()=>checkedMediaCatalog(new Uint8Array(oldMediaBytes),book),/context_changed/);
const badText=publicTextbookContextReader({fetcher:async()=>new Response(Buffer.concat([textBytes,Buffer.from(' ')]),{headers:{'Content-Type':'application/json'}})});
await rejects(()=>badText(env,firstText),/context_changed/);
const badMedia=publicMediaContextReader({fetcher:async()=>new Response(Buffer.concat([mediaBytes,Buffer.from(' ')]),{headers:{'Content-Type':'application/json'}})});
await rejects(()=>badMedia(env,firstMedia),/context_changed/);
const oldAnchors=new Map(oldText.contexts.map(row=>[row.anchor,row.quote]));
const retained=text.contexts.filter(row=>oldAnchors.get(row.anchor)===row.quote).length;
ok(retained<text.contexts.length&&retained>text.contexts.length*.9,'bounded explanation corrections preserve over90% public anchors');
summaries.push({book,textRows:text.contexts.length,imageRows:media.contexts.length,retainedTextAnchors:retained,publicCatalogRequests:requests.length,sourceSha256:item.sourceSha256});
}
for(const [url,digest]of inputs)equal(sha(await readFile(new URL(url))),digest,'public input unchanged during verification');
const result={status:'passed',checks,books:summaries,preparedReceiptSha256:sha(await readFile(new URL('result.json',stage))),inputs:[...inputs].map(([url,sha256])=>({url,sha256})),scope:'Byte-identical actual text/media readers with isolated two-book candidate manifests. Every excerpt/image binding, actual asset SHA, stale signature/catalog, modified bytes, unknown anchor and injected URL tested. Other source/closed-answer/page checks remain separate. No real API/provider/auth/user data or main changes.'};
await writeFile(new URL('reader-result.json',stage),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({status:result.status,checks,books:summaries}));
