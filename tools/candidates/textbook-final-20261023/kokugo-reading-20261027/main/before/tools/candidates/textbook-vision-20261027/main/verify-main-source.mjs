// Main integration/guard proof. Public app sources and synthetic SQLite only.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,mkdtemp,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
const require=createRequire(import.meta.url),{D1SQLite}=require('../../../../.claude/verify/d1-sqlite.js'),{checkMainSource,mainDependencyFiles}=require('./checked-source.cjs'),bridge=require('./check-expansion.cjs');
const root=new URL('../../../../',import.meta.url),here=new URL('./',import.meta.url),sha=x=>createHash('sha256').update(x).digest('hex');
let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++;},same=(a,b,m)=>{assert.deepEqual(a,b,m);checks++;};
const spec=JSON.parse(await readFile(new URL('prepared.json',here))),before=checkMainSource();same(before.size,8,'only eight exact existing files normalized, including two legacy runner readers');
const original=await readFile(new URL('tools/candidates/textbook-ai-20261026/review/practice-expansion-20261027/checked-source.cjs',root));same(sha(original),'f212e47e3dd56ff90a5490d0ee91a85fbd5786bc59ff17b5745a631ab6a853e7','original expansion verifier preserved byte-for-byte');
const historical=bridge.checkExpansionSource();
same(sha(historical.get('index.html')),spec.existing.find(r=>r.file==='index.html').beforeSha256,'historical index supplied only after full successor validation');
ok(historical.has('cf-worker/src/ai-review-practice-data.mjs'),'original48-to30 validator actually ran and returned its own predecessor');
const index=await readFile(new URL('index.html',root),'utf8'),worker=await readFile(new URL('cf-worker/src/index.js',root),'utf8');
for(const name of ['model','capture','api','panel','boot'])ok(index.includes('<script src="/textbook-vision-'+name+'.js" defer></script>'),'deferred image component registered '+name);
ok(index.includes('<script type="module" src="/textbook-vision-media-browser.mjs"></script>'),'public media module registered');
ok(index.indexOf('/textbook-ai-model.js')<index.indexOf('/textbook-vision-model.js'),'original text model precedes wrapper');
ok(index.indexOf('/textbook-vision-api.js')<index.indexOf('/textbook-vision-boot.js'),'API extension precedes boot');
const at=worker.indexOf("if(path==='/textbook-ai-vision-context')");ok(at>worker.indexOf('const session = await readSession(request, env);')&&at>worker.indexOf('if (!(await claimActiveSession(env, session.uid, session.token)))'),'new routes remain behind actual session and active-owner guards');
ok(worker.includes('textbookVisionAIRoute(request,env,session,{owner:await opaqueKey(session.token),fetcher:fetch})'),'provider transport explicitly supplied by authenticated main router');
const oldPanel=await readFile(new URL('site-assets/textbook-ai.js',root));same(sha(oldPanel),sha(await readFile(new URL('../ui-candidate/before-textbook-ai.js',here))),'original text consultation implementation unchanged');
// New API URLs cannot enter the same-origin service-worker asset cache.
const sw=await readFile(new URL('site-assets/sw.js',root),'utf8'),listeners=new Map();let cacheCalls=0;
const context={self:{location:{origin:'https://fixture.invalid'},addEventListener:(name,fn)=>listeners.set(name,fn)},URL,Response,fetch:async()=>new Response('public fixture'),caches:{open:async()=>({match:async()=>null,put:async()=>{cacheCalls++;}})}};
vm.runInNewContext(sw,context,{timeout:1000});
for(const name of ['/textbook-ai-vision','/textbook-ai-vision-context','/textbook-ai/images','/textbook-ai/image','/textbook-ai-chat','/textbook-ai-context','/textbook-annotations']){
 let intercepted=false;listeners.get('fetch')({request:new Request('https://fixture.invalid'+name),respondWith:()=>{intercepted=true;}});ok(!intercepted,'private API bypasses cache '+name);
}same(cacheCalls,0,'private lookups never access a cache');
const now=Date.now(),db=new D1SQLite(),owner='synthetic-main-image-owner';db.seed('active-session:u4',owner,now+3600000);db.seed('material-history:u4:sentinel','untouched');
const mediaManifest=await import('../../../../cf-worker/src/textbook-vision-media-manifest.mjs'),oldManifest=await import('../../../../cf-worker/src/textbook-ai-context-manifest.mjs'),catalogs=new Map();
for(const entry of [...Object.values(mediaManifest.TEXTBOOK_VISION_MEDIA),...Object.values(oldManifest.TEXTBOOK_AI_CONTEXTS)])catalogs.set(entry.src,await readFile(new URL('site-assets'+entry.src,root)));
let publicGets=0,providerCalls=0;const savedFetch=globalThis.fetch;
globalThis.fetch=async request=>{const url=new URL(typeof request==='string'?request:request.url);if(url.origin!=='https://fixture.invalid'||!catalogs.has(url.pathname)){providerCalls++;throw Error('outside_fixture');}publicGets++;return new Response(catalogs.get(url.pathname),{headers:{'Content-Type':'application/json'}});};
try{
 const {textbookVisionContextRoute}=await import('../../../../cf-worker/src/textbook-vision-context-route.mjs');
 const entry=mediaManifest.TEXTBOOK_VISION_MEDIA.kokugo1,row=JSON.parse(catalogs.get(entry.src)).contexts[0],selection={book:'kokugo1',anchor:row.anchor,annotationSignature:entry.annotationSignature,contextSha256:entry.sha256};
 const env={AUTH_DB:db,APP_ORIGIN:'https://fixture.invalid',TEXTBOOK_RELEASE_STAGE:'early',TEXTBOOK_RELEASE_EPOCH:String(now-1000),GEMINI_ENABLED:'0',OPENAI_ENABLED:'0'};
 const request=(params=selection,options={})=>new Request('https://fixture.invalid/textbook-ai-vision-context?'+(typeof params==='string'?params:new URLSearchParams(params)),{method:options.method||'GET',headers:{Origin:options.origin||env.APP_ORIGIN}});
 const call=(req=request(),session={uid:'u4'},options={})=>textbookVisionContextRoute(req,env,session,{owner,now:()=>now,...options});
 const response=await call(),value=await response.json();same(response.status,200,'actual new main metadata route works without enabling AI');same(value.context.anchor,row.anchor,'exact new-media source returned');same(value.context.contextSha256,entry.sha256,'new supplement digest bound');same(response.headers.get('Cache-Control'),'private, no-store','private metadata not cached');
 for(const [req,session,options,code]of [[request(),{}, {},401],[request(),{uid:'u4'},{owner:'different-owner'},409],[request(selection,{origin:'https://wrong.invalid'}),{uid:'u4'},{},403],[request(selection,{method:'POST'}),{uid:'u4'},{},405],[request({...selection,url:'https://wrong.invalid'}),{uid:'u4'},{},400],[request(new URLSearchParams(selection)+'&book=kokugo1'),{uid:'u4'},{},400],[request({...selection,contextSha256:'0'.repeat(64)}),{uid:'u4'},{},409]]){same((await call(req,session,options)).status,code,'actual metadata guard '+code);}
 const revoked=await call(request(),{uid:'u4'},{readContext:async()=>{db.seed('active-session:u4','new-owner',now+3600000);return value.context;}});same(revoked.status,409,'owner rechecked after source retrieval');ok(!Object.hasOwn(await revoked.json(),'context'),'revoked owner receives no context');
 same(db.get('material-history:u4:sentinel').v,'untouched','real-route metadata cannot alter synthetic learning sentinel');same(providerCalls,0,'metadata performs no provider HTTP');ok(publicGets>=1&&publicGets<=2,'only fixed public catalogs requested');
}finally{globalThis.fetch=savedFetch;db.close();}
// Mutation checks use a sparse copy of explicit public dependencies, never
// auth stores, user data, environment files, or the current application.
const dependencies=[...new Set([...mainDependencyFiles(),...bridge.expansionDependencyFiles()])];
const sandbox=await mkdtemp(path.join(tmpdir(),'nobilog-vision-guard-'));
for(const file of new Set(dependencies)){
 if(file.includes('..')||path.isAbsolute(file)||!(/^(?:tools\/candidates|site-assets|cf-worker\/src)\//.test(file)||['index.html','preview/build.py','.claude/verify/run.sh','.claude/verify/d1-sqlite.js','Claude作業/20261026_ProAI類題/practice-bank.json','tools/releases/auth-repair-20261019/verify-login-flow.mjs','tools/releases/google-link-20261019/verify-login-flow.mjs'].includes(file)))throw Error('unsafe_public_fixture_path');
 const target=path.join(sandbox,file);await mkdir(path.dirname(target),{recursive:true});await copyFile(new URL(file,root),target);
}
same(checkMainSource(sandbox,{assets:false}).size,8,'sparse code fixture validates approved successor; all media already checked once against main');
for(const file of ['index.html','cf-worker/src/textbook-vision-input.mjs','site-assets/textbook-ai.js']){
 const target=path.join(sandbox,file),saved=await readFile(target);await writeFile(target,Buffer.concat([saved,Buffer.from('\n// unauthorized fixture drift\n')]));assert.throws(()=>checkMainSource(sandbox,{assets:false}),/drift/);checks++;await writeFile(target,saved);
}
const originalPath='tools/candidates/textbook-ai-20261026/review/practice-expansion-20261027/checked-source.cjs',target=path.join(sandbox,originalPath),saved=await readFile(target);await writeFile(target,Buffer.concat([saved,Buffer.from('\n// fixture mutation\n')]));assert.throws(()=>bridge.checkExpansionSource(sandbox),/original expansion verifier changed|drift/);checks++;await writeFile(target,saved);
const inputs=[];for(const file of new Set([...dependencies,'tools/candidates/textbook-vision-20261027/main/verify-main-source.mjs']))inputs.push({file,sha256:sha(await readFile(new URL(file,root)))});
await writeFile(new URL('source-current-result.json',here),JSON.stringify({status:'passed',checks,inputs,scope:'Exact eight-file successor and27 new assets; two legacy runner readers retain every original assertion. Original historical verifier unchanged and actually executed in a private read-only source view; unauthorized main/new/legacy/verifier drift rejected in a sparse public fixture. Actual metadata owner/Origin/query guards and service-worker no-cache checked. Synthetic only, no real provider/user data or publication.'},null,2)+'\n');console.log('Main textbook vision integration: '+checks+' checks passed.');
