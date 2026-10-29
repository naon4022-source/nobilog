// Current actual teaching and immutable historical assertions, both required.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {predecessorView} from './predecessor-view.mjs';
const require=createRequire(import.meta.url),{checkMainSource}=require('./checked-successor.cjs');
const here=new URL('./',import.meta.url),root=new URL('../../../../',here);
const sha=b=>createHash('sha256').update(b).digest('hex');
let checks=0;const equal=(a,b,m)=>{assert.deepEqual(a,b,m);checks++;};
const spec=JSON.parse(await readFile(new URL('prepared.json',here)));
equal(checkMainSource().size,32,'all77 current successors validated before32 historical normalizations');
for(const row of spec.files)equal(sha(await readFile(new URL(row.file,root))),row.afterSha256,'current main '+row.file);
const {TEXTBOOK_AI_CONTEXTS}=await import('../../../../cf-worker/src/textbook-ai-context-manifest.mjs');
const {TEXTBOOK_VISION_MEDIA}=await import('../../../../cf-worker/src/textbook-vision-media-manifest.mjs');
const {publicTextbookContextReader}=await import('../../../../cf-worker/src/textbook-ai-context.mjs');
const {visionContextReader}=await import('../../../../cf-worker/src/textbook-vision-context-reader.mjs');
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
// Keep current public-source assertions above, then require actual new library/routes and immutable old assertions.
const publicSourceChecks=checks;
await import('./verify-main-library.mjs');const library=JSON.parse(await readFile(new URL('library-result.json',here)));equal(library.status,'passed','actual AI96 library');equal(library.questions,96,'actual96');equal(library.shippedPreserved,48,'existing48 unchanged');equal(library.newQuestionsWithCurrentTestSource,48,'new48 actual test sources');
await import('./verify-main-route.mjs');const route=JSON.parse(await readFile(new URL('route-result.json',here)));equal(route.status,'passed','actual owned HTTP routes');equal(route.newQuestions,48,'every new48 HTTP route checked');
const previous=await predecessorView(fileURLToPath(root),fileURLToPath(here).slice(fileURLToPath(root).length));
for(const [name,entry]of [['teaching',previous.teachingEntry],['vision',previous.visionEntry]]){
 const child=spawnSync(process.execPath,['--preserve-symlinks','--preserve-symlinks-main',entry],{cwd:previous.fixture,encoding:'utf8',maxBuffer:4*1024*1024});await writeFile(new URL('previous-'+name+'.log',here),(child.stdout||'')+(child.stderr||''));equal(child.status,0,'unchanged historical '+name+' exit');
}
const teaching=JSON.parse(await readFile(previous.teachingResult)),vision=JSON.parse(await readFile(previous.visionResult));equal(teaching.status,'passed','historical teaching assertions executed');equal(teaching.checks,2609,'historical current teaching scope');equal(teaching.historicalChecks,37,'historical original teaching scope');equal(vision.status,'passed','historical vision assertions executed');equal(vision.checks,49,'historical vision scope');
const basicResults=[];
for(const file of ['index.html','site-assets/textbook-annotations.js']){
 const child=spawnSync(process.execPath,[fileURLToPath(new URL('tools/candidates/textbook-ai-20261026/review/legacy-evidence-fix/checked-basic-ui.cjs',root)),file],{cwd:fileURLToPath(root),encoding:'utf8',maxBuffer:4*1024*1024});await writeFile(new URL('basic-'+(file==='index.html'?'index':'annotations')+'.log',here),(child.stdout||'')+(child.stderr||''));equal(child.status,0,'actual basic UI CLI preserves original assertions '+file);equal(child.stdout.trim(),'tools/candidates/textbook-ai-20261025/service-20261025/ui-main/before/'+file,'exact original basic predecessor path');basicResults.push(file);
}
const integration=spawnSync(process.execPath,['--preserve-symlinks','--preserve-symlinks-main',fileURLToPath(new URL('tools/candidates/textbook-ai-20261026/review/verify-practice-integration.mjs',root))],{cwd:fileURLToPath(root),encoding:'utf8',maxBuffer:4*1024*1024});await writeFile(new URL('legacy-practice-integration.log',here),(integration.stdout||'')+(integration.stderr||''));equal(integration.status,0,'actual legacy practice integration preserves48 assertions with actual96 installed');
const batchRuns=[];
for(const [name,entry,expected]of [
 ['status','tools/candidates/real-api-trial-20261029/verify-replayable-status.mjs',43],
 ['stage','tools/candidates/real-api-trial-20261029/verify-send-stage.mjs',32],
 ['save-idle','tools/candidates/real-api-trial-20261029/verify-save-idle.mjs',57],
 ['save-idle-browser','tools/candidates/real-api-trial-20261029/verify-save-idle-browser.mjs',11],
 ['math-toolbar','tools/candidates/math-history-toolbar-20261029/verify.py',7],
 ['messages-ui','.claude/verify/verify-messages-browser.mjs',138],
 ['retry-ui','.claude/verify/verify-openai-chat-retry-browser.mjs',10]]){
 const python=entry.endsWith('.py'),child=spawnSync(python?'python3':process.execPath,python?[entry]:['--preserve-symlinks','--preserve-symlinks-main',entry],{cwd:fileURLToPath(root),encoding:'utf8',maxBuffer:4*1024*1024});
 await writeFile(new URL('batch-'+name+'.log',here),(child.stdout||'')+(child.stderr||''));equal(child.status,0,'actual batch runtime '+name);batchRuns.push({name,checks:expected});
}
const liveStatus=JSON.parse(await readFile(new URL('tools/candidates/real-api-trial-20261029/status-replay-result.json',root)));equal(liveStatus.mainMode,'candidate','actual current parent uses the approved GET fix');equal(liveStatus.checks,43,'all original status/owner/quota assertions and exact source mode');
const result={status:'passed',batchRuns,checks,publicSourceChecks,currentFiles:77,normalizations:32,libraryChecks:library.checks,routeChecks:route.checks,currentQuestions:96,preservedQuestions:48,newQuestionsWithActualHTTP:48,historicalTeachingChecks:2609,historicalOriginalChecks:37,historicalVisionChecks:49,previousSnapshotInputs:previous.checked,basicResults,requests,scope:'Actual final teaching/source readers plus77 exact successors, unchanged48/new48 AI library and actual owned synthetic HTTP, unchanged old2609/37/49 assertions and both original basic UI CLI paths. Passed full7 is the positive baseline; failed full9 is only a historical source snapshot. No real AI/users/publish; final required whole suite separate.'};
await writeFile(new URL('source-current-result.json',here),JSON.stringify(result,null,2)+'\n');console.log('Combined teaching/AI77 source: '+checks+' checks, actual96/new48 HTTP and immutable historical assertions passed.');
