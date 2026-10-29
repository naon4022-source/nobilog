// Current actual teaching and immutable historical assertions, both required.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {legacyView} from './legacy-view.mjs';
const require=createRequire(import.meta.url),{checkMainSource}=require('./checked-successor.cjs');
const here=new URL('./',import.meta.url),root=new URL('../../../../../../',here);
const sha=b=>createHash('sha256').update(b).digest('hex');
let checks=0;const equal=(a,b,m)=>{assert.deepEqual(a,b,m);checks++;};
const spec=JSON.parse(await readFile(new URL('compat-spec.json',here)));
equal(checkMainSource().size,27,'all67 current successors validated before27 historical normalizations');
for(const row of spec.files)equal(sha(await readFile(new URL(row.file,root))),row.afterSha256,'current main '+row.file);
const {TEXTBOOK_AI_CONTEXTS}=await import('../../../../../../cf-worker/src/textbook-ai-context-manifest.mjs');
const {TEXTBOOK_VISION_MEDIA}=await import('../../../../../../cf-worker/src/textbook-vision-media-manifest.mjs');
const {publicTextbookContextReader}=await import('../../../../../../cf-worker/src/textbook-ai-context.mjs');
const {visionContextReader}=await import('../../../../../../cf-worker/src/textbook-vision-context-reader.mjs');
const catalogs=new Map(),books=new Map();
for(const book of ['kokugo1','english1']){
 const bytes=await readFile(new URL('site-assets/textbook-book-'+book+'.json',root));books.set(book,JSON.parse(bytes));
 for(const entry of [TEXTBOOK_AI_CONTEXTS[book],TEXTBOOK_VISION_MEDIA[book]]){
  equal(entry.sourceSha256,sha(bytes),'actual final book binding '+book);
  const data=await readFile(new URL('site-assets'+entry.src,root));equal(sha(data),entry.sha256,'actual final public catalog '+book);catalogs.set(entry.src,data);
 }
}
const requests=[],env={APP_ORIGIN:'https://current-teaching.invalid'};
const fetcher=async request=>{const url=new URL(request.url);equal(url.origin,env.APP_ORIGIN,'synthetic origin');assert(catalogs.has(url.pathname));assert(!request.headers.has('Cookie')&&!request.headers.has('Authorization'));requests.push(url.pathname);return new Response(catalogs.get(url.pathname),{headers:{'Content-Type':'application/json'}});};
const reader=visionContextReader({readText:publicTextbookContextReader({fetcher}),fetcher});
for(const book of books.keys()){
 for(const entry of [TEXTBOOK_AI_CONTEXTS[book],TEXTBOOK_VISION_MEDIA[book]]){
  const catalog=JSON.parse(catalogs.get(entry.src));
  for(const row of catalog.contexts){
   const actual=await reader(env,{book,anchor:row.anchor,annotationSignature:entry.annotationSignature,contextSha256:entry.sha256});
   equal(actual.quote,row.quote,'actual final public reader '+book+':'+row.anchor);
   if(row.src)equal(sha(await readFile(new URL('site-assets'+row.src,root))),row.assetSha256,'current referenced image '+row.src);
  }
 }
}
const index=JSON.parse(await readFile(new URL('site-assets/textbook-books.json',root)));
for(const [book,value] of books)equal(index.books.find(b=>b.id===book).pageCount,value.pages.length,'final page count '+book);
const fixture=await legacyView(fileURLToPath(root),fileURLToPath(here).slice(fileURLToPath(root).length));
const child=spawnSync(process.execPath,['--preserve-symlinks','--preserve-symlinks-main',fixture.verifier],{cwd:fixture.fixture,encoding:'utf8',maxBuffer:4*1024*1024});
await writeFile(new URL('historical-integration.log',here),(child.stdout||'')+(child.stderr||''));
equal(child.status,0,'byte-identical historical integration exit');
const historical=JSON.parse(await readFile(fixture.output));equal(historical.status,'passed','historical assertions executed');
const result={status:'passed',checks,currentFiles:67,historicalChecks:historical.checks,historicalInputs:fixture.checked,requests,scope:'Actual final two-book public text/image readers, exact67 successor and unchanged historical integration. Synthetic public transport; no provider or real user data; final whole verification separate.'};
await writeFile(new URL('source-current-result.json',here),JSON.stringify(result,null,2)+'\n');
console.log('Current final teaching integration: '+checks+' checks passed; historical '+historical.checks+' checks preserved.');
