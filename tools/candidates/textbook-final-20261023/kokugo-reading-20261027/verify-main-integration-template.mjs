// Main teaching integration: fixed public catalogs, synthetic transport, no provider calls.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{checkMainSource}=require('./checked-successor.cjs');
const here=new URL('./',import.meta.url),root=new URL('../../../../../',here),sha=b=>createHash('sha256').update(b).digest('hex');
const before=checkMainSource(),spec=JSON.parse(await readFile(new URL('prepared.json',here)));
let checks=0;const equal=(a,b,m)=>{assert.deepEqual(a,b,m);checks++;};
equal(before.size,26,'19 exact successors plus8 original vision predecessors with one runner overlap');
for(const row of spec.files)equal(sha(await readFile(new URL(row.file,root))),row.afterSha256,'current main bytes '+row.file);
const bookBytes=await readFile(new URL('site-assets/textbook-book-kokugo1.json',root));
const {TEXTBOOK_AI_CONTEXTS}=await import('../../../../../cf-worker/src/textbook-ai-context-manifest.mjs');
const {TEXTBOOK_VISION_MEDIA}=await import('../../../../../cf-worker/src/textbook-vision-media-manifest.mjs');
const {publicTextbookContextReader}=await import('../../../../../cf-worker/src/textbook-ai-context.mjs');
const {visionContextReader}=await import('../../../../../cf-worker/src/textbook-vision-context-reader.mjs');
const textEntry=TEXTBOOK_AI_CONTEXTS.kokugo1,mediaEntry=TEXTBOOK_VISION_MEDIA.kokugo1,catalogs=new Map();
for(const entry of [textEntry,mediaEntry]){
 equal(entry.sourceSha256,sha(bookBytes),'actual manifest references current main book');
 const bytes=await readFile(new URL('site-assets'+entry.src,root));equal(sha(bytes),entry.sha256,'actual catalog hash');catalogs.set(entry.src,bytes);
}
const text=JSON.parse(catalogs.get(textEntry.src)),media=JSON.parse(catalogs.get(mediaEntry.src));
equal(text.contexts.length,1433,'text excerpt count preserved');equal(media.contexts.length,129,'image reference count preserved');
const old=JSON.parse(before.get('site-assets/textbook-ai-context-kokugo1.json'));
const oldQuotes=new Set(old.contexts.map(r=>r.quote)),changed=text.contexts.filter(r=>!oldQuotes.has(r.quote));equal(changed.length,4,'only4 reviewed public text blocks changed');
const requests=[],env={APP_ORIGIN:'https://teaching-fixture.invalid'};
const fetcher=async request=>{const url=new URL(request.url);assert.equal(url.origin,env.APP_ORIGIN);assert(catalogs.has(url.pathname));assert(!request.headers.has('Cookie')&&!request.headers.has('Authorization'));requests.push(url.pathname);return new Response(catalogs.get(url.pathname),{headers:{'Content-Type':'application/json'}});};
const reader=visionContextReader({readText:publicTextbookContextReader({fetcher}),fetcher});
for(const row of changed){const value=await reader(env,{book:'kokugo1',anchor:row.anchor,annotationSignature:textEntry.annotationSignature,contextSha256:textEntry.sha256});equal(value.quote,row.quote,'actual main reader returns corrected explanation');}
const figure=media.contexts.find(r=>r.src==='/textbook-book-kokugo1-k1-c1-s1-dp.svg');assert(figure);
equal(sha(await readFile(new URL('site-assets'+figure.src,root))),figure.assetSha256,'actual current figure bytes match image metadata');
const value=await reader(env,{book:'kokugo1',anchor:figure.anchor,annotationSignature:mediaEntry.annotationSignature,contextSha256:mediaEntry.sha256});equal(value.quote,figure.quote,'actual main reader accepts corrected figure');
await assert.rejects(()=>reader(env,{book:'kokugo1',anchor:changed[0].anchor,annotationSignature:old.annotationSignature,contextSha256:textEntry.sha256}),/context_changed/);checks++;
equal(requests.length,2,'only two synthetic public catalog fetches');
const catalog=JSON.parse(await readFile(new URL('site-assets/textbook-books.json',root)));equal(catalog.books.find(b=>b.id==='kokugo1').pageCount,JSON.parse(bookBytes).pages.length,'book index pageCount still accurate');
await writeFile(new URL('source-current-result.json',here),JSON.stringify({status:'passed',checks,normalizedFiles:before.size,files:spec.files.map(r=>({file:r.file,sha256:r.afterSha256})),specSha256:sha(await readFile(new URL('prepared.json',here))),requests,scope:'Current main19-file exact teaching successor and full immutable predecessor evidence; current main text/figure readers with synthetic public transport. Actual book playback and final whole verification separate; no real AI/user/auth/publish.'},null,2)+'\n');
console.log('Main corrected teaching source: '+checks+' checks passed.');
