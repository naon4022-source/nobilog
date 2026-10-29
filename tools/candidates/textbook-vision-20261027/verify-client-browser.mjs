import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {TEXTBOOK_AI_CONTEXTS} from '../../../cf-worker/src/textbook-ai-context-manifest.mjs';
const require=createRequire(import.meta.url),{chromium}=require('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=new URL('../../../',import.meta.url),here=new URL('./',import.meta.url),catalogFile='site-assets'+TEXTBOOK_AI_CONTEXTS.math1.src,bank=JSON.parse(await readFile(new URL(catalogFile,root))),figure=bank.contexts.find(x=>x.kind==='fig'),entry=TEXTBOOK_AI_CONTEXTS.math1,asset='site-assets/textbook-book-math1-m1-c2-s1-dmap.svg';
const reference={...figure,book:'math1',title:bank.title,subject:bank.subject,sourceSha256:entry.sourceSha256,contextSha256:entry.sha256,annotationSignature:entry.annotationSignature},items=new Map(),posts=new Map(),modes=new Map();let checks=0;
const ok=(v,m)=>{assert.ok(v,m);checks++;},same=(a,b,m)=>{assert.deepEqual(a,b,m);checks++;};
const sources={'/model.js':new URL('../../../site-assets/textbook-ai-model.js',import.meta.url),'/vision-model.js':new URL('textbook-vision-model.js',here),'/capture.js':new URL('textbook-vision-capture.js',here),'/textbook-book-math1-m1-c2-s1-dmap.svg':new URL(asset,root)};
const server=createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://fixture');
 if(sources[url.pathname]){const bytes=await readFile(sources[url.pathname]);res.writeHead(200,{'Content-Type':url.pathname.endsWith('.svg')?'image/svg+xml':'text/javascript'}).end(bytes);return;}
 const json=value=>res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'}).end(JSON.stringify(value));
 if(url.pathname==='/'){res.writeHead(200,{'Content-Type':'text/html'}).end('<!doctype html><meta charset="utf-8"><style>body{margin:0}.tb-page{margin:20px 10px;padding:10px;width:280px;height:250px}figure{margin:0}img{display:block;width:260px;height:160px}</style><main id="app"><article class="tb-page"><figure data-annotation-anchor="'+figure.anchor+'"><img src="/textbook-book-math1-m1-c2-s1-dmap.svg"><figcaption>合成表示の図</figcaption></figure></article></main><script src="/model.js"></script><script src="/vision-model.js"></script><script src="/capture.js"></script>');return;}
 const suite=req.headers['x-fixture-suite']||'',uid=req.headers['x-fixture-uid']||'',prefix=suite+':'+uid+':';
 if(url.pathname==='/fixture/history'){
  const id=url.searchParams.get('id');if(id){const item=items.get(prefix+id);json(item?{state:'done',item}:{state:modes.get(suite)==='unknown'?'unknown':'not_found'});}else json({items:[...items].filter(([k])=>k.startsWith(prefix)).map(([,v])=>v),canSend:true});return;
 }
 if(url.pathname==='/fixture/post'){
  let raw='';for await(const c of req)raw+=c;const body=JSON.parse(raw);posts.set(suite,(posts.get(suite)||0)+1);
  const item={id:body.id,text:body.text,book:body.book,anchor:body.anchor,images:body.images,context:reference,answer:'まず図の条件を確かめよう。',state:'done',real:true,mock:false,model:'gpt-6-luna'};
  if(modes.get(suite)!=='unknown')items.set(prefix+body.id,item);
  if(['lost','unknown'].includes(modes.get(suite))){res.writeHead(503,{'Content-Type':'application/json'}).end('{"error":"synthetic_response_loss"}');return;}json({real:true,value:{answer:item.answer},context:reference,model:item.model});return;
 }
 res.writeHead(404).end();
 }catch(_){res.writeHead(500).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({headless:true});
async function isolatedContext(width){const context=await browser.newContext({viewport:{width,height:900}});await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());return context;}
async function setup(page,suite,uid='u4'){
 await page.goto(origin,{waitUntil:'load'});await page.waitForFunction(()=>document.querySelector('img').complete&&document.querySelector('img').naturalWidth>0);
 await page.evaluate(({suite,uid,reference})=>{
  window.fixtureOwner={uid,turn:1};const owner=()=>({...window.fixtureOwner});window.fixtureReference=reference;
  const call=async(path,options={})=>{const r=await fetch(path,{...options,headers:{'Content-Type':'application/json','X-Fixture-Suite':suite,'X-Fixture-UID':window.fixtureOwner.uid,...options.headers}});if(!r.ok)throw Error('fixture_network');return r.json();};
  window.fixtureAPI={available:()=>true,snapshot:owner,matches:o=>o.uid===window.fixtureOwner.uid&&o.turn===window.fixtureOwner.turn,source:async()=>({context:reference}),visionHistory:(q)=>call('/fixture/history?'+new URLSearchParams(q)),visionPost:async body=>{
   // The actual IndexedDB transaction must finish before the paid POST.
   const saved=await new Promise((resolve,reject)=>{const r=indexedDB.open('nobilog-textbook-vision-drafts',1);r.onsuccess=()=>{const db=r.result,tx=db.transaction('drafts'),g=tx.objectStore('drafts').get([uid,'math1',body.anchor]);g.onsuccess=()=>resolve(g.result?.value);tx.oncomplete=()=>db.close();};r.onerror=reject;});
   if(saved?.draft.pending.id!==body.id||JSON.stringify(saved.images)!==JSON.stringify(body.images))throw Error('pending_not_durable');
   return call('/fixture/post',{method:'POST',body:JSON.stringify(body)});
  }};window.vm=NobiTextbookVisionModel.create(window.fixtureAPI,'math1');
 },{suite,uid,reference});
}
try{
 for(const width of [390,1280])for(const uid of ['u1','u2','u4']){
  const suite=uid+'-'+width,context=await isolatedContext(width),page=await context.newPage();await setup(page,suite,uid);
  const before=posts.get(suite)||0;const success=await page.evaluate(async({anchor,reference})=>{await vm.edit(anchor,'図を説明して');await vm.setImages(anchor,['a'.repeat(64)]);const item=await vm.send(anchor,reference);return {item,draft:await vm.load(anchor),images:await vm.images(anchor)};},{anchor:figure.anchor,reference});
  same(success.item.answer,'まず図の条件を確かめよう。','verified result returned');same(success.draft.pending,null,'durable acknowledgement consumes only matched new pending');same(success.images,[],'new draft resets after verified receipt');same(posts.get(suite)-before,1,'exactly one paid POST');
  modes.set(suite,'lost');const pending=await page.evaluate(async({anchor,reference})=>{await vm.edit(anchor,'応答を失った質問');await vm.setImages(anchor,['b'.repeat(64)]);let error;try{await vm.send(anchor,reference);}catch(e){error=e.message;}return {error,draft:await vm.load(anchor)};},{anchor:figure.anchor,reference});ok(!!pending.error&&!!pending.draft.pending,'lost response leaves saved pending');const sent=posts.get(suite);
  await page.reload({waitUntil:'load'});await setup(page,suite,uid);const recovered=await page.evaluate(async anchor=>({result:await vm.recover(anchor),draft:await vm.load(anchor)}),figure.anchor);same(recovered.result.state,'done','GET-only recovery after actual page reload');same(recovered.result.item.id,pending.draft.pending.id,'original UUID recovered');same(recovered.draft.pending,null,'matching receipt acknowledged');same(posts.get(suite),sent,'recovery does not POST');
  modes.set(suite,'unknown');await page.evaluate(async({anchor,reference})=>{await vm.edit(anchor,'結果不明の質問');await vm.setImages(anchor,['c'.repeat(64)]);try{await vm.send(anchor,reference);}catch{};},{anchor:figure.anchor,reference});const unknownPosts=posts.get(suite);await setup(page,suite,uid);const unknown=await page.evaluate(async anchor=>{const result=await vm.recover(anchor),draft=await vm.load(anchor);let locked;try{await vm.setImages(anchor,['d'.repeat(64)]);}catch(e){locked=e.message;}return {result,draft,images:await vm.images(anchor),locked};},figure.anchor);same(unknown.result.state,'unknown','unknown outcome not treated as unissued');ok(!!unknown.draft.pending,'unknown pending retained');same(unknown.images,['c'.repeat(64)],'unknown exact image IDs retained');same(unknown.locked,'pending_locked','cannot swap images under pending request');same(posts.get(suite),unknownPosts,'load/recovery never auto-resends unknown');
  const other=await context.newPage();await setup(other,suite,uid==='u4'?'u1':'u4');same((await other.evaluate(async a=>(await vm.load(a)).pending,figure.anchor)),null,'different account sees no pending');
  const late=await page.evaluate(async anchor=>{const before=await vm.load(anchor);fixtureOwner.turn++;let error;try{await vm.recover(anchor);}catch(e){error=e.message;}return {before,error};},figure.anchor);same(late.error,'account_changed','late model cannot cross owner generation');ok(!!late.before.pending,'owner switch preserves old pending');
  await context.close();
 }
 {const context=await isolatedContext(390),page=await context.newPage();await setup(page,'capture');
  const result=await page.evaluate(async({anchor,signature})=>NobiTextbookVisionCapture.pixels(document.querySelector('#app'),anchor,signature,{current:()=>true}),{anchor:figure.anchor,signature:entry.annotationSignature});ok(result.width>0&&result.height>0&&result.width<=1024&&result.height<=1024&&result.data.length>0,'visible public figure produces bounded RGBA pixels');
  for(const mutate of ['hidden','overlay','offscreen','closed','foreign','duplicate','owner','late-owner','clipped','cover','query']){
   await setup(page,'capture-'+mutate);const error=await page.evaluate(async({anchor,signature,mutate})=>{
    const app=document.querySelector('#app'),fig=app.querySelector('figure'),img=fig.querySelector('img');let current=()=>true;
    if(mutate==='hidden')fig.hidden=true;
    if(mutate==='overlay'){const overlay=document.createElement('div');overlay.style.cssText='position:fixed;inset:0;background:white;z-index:999';document.body.append(overlay);}
    if(mutate==='offscreen')fig.style.transform='translateY(2000px)';
    if(mutate==='closed'){const details=document.createElement('details');fig.replaceWith(details);details.append(fig);}
    if(mutate==='foreign')img.src='https://example.invalid/not-allowed.png';
    if(mutate==='duplicate')fig.after(fig.cloneNode(true));
    if(mutate==='owner')current=()=>false;
    if(mutate==='late-owner'){let count=0;current=()=>++count===1;}
    if(mutate==='clipped'){fig.style.height='30px';fig.style.overflow='hidden';}
    if(mutate==='cover')img.style.objectFit='cover';
    if(mutate==='query')img.src=img.src+'?private=fixture';
    try{await NobiTextbookVisionCapture.pixels(app,anchor,signature,{current});return null;}catch(e){return e.message;}
   },{anchor:figure.anchor,signature:entry.annotationSignature,mutate});same(error,'figure_unavailable','capture refuses '+mutate);
  }
  await context.close();
 }
 {const context=await isolatedContext(390),page=await context.newPage();await setup(page,'legacy-keep');const result=await page.evaluate(async({anchor,reference})=>{
  const legacy=NobiTextbookAIModel.create({...fixtureAPI,history:fixtureAPI.visionHistory,post:async()=>{throw Error('synthetic legacy response loss');}},'math1');await legacy.edit(anchor,'以前の文字だけの送信待ち');try{await legacy.send(anchor,reference);}catch{}const before=await legacy.load(anchor);
  await vm.edit(anchor,'新しい画像相談');await vm.setImages(anchor,['e'.repeat(64)]);await vm.send(anchor,reference);const after=await legacy.load(anchor);
  const persisted=await new Promise((resolve,reject)=>{const r=indexedDB.open('nobilog-textbook-ai-drafts',1);r.onsuccess=()=>{const db=r.result,tx=db.transaction('drafts'),g=tx.objectStore('drafts').get(['u4','math1',anchor]);g.onsuccess=()=>resolve(g.result.value);tx.oncomplete=()=>db.close();};r.onerror=reject;});return {before,after,persisted};
 },{anchor:figure.anchor,reference});same(result.after,result.before,'legacy text pending unchanged in memory');same(result.persisted,result.before,'legacy text pending unchanged in original IndexedDB');await context.close();}
 {const context=await isolatedContext(390),page=await context.newPage();await setup(page,'wrong-receipt');modes.set('wrong-receipt','lost');const result=await page.evaluate(async({anchor,reference})=>{
  await vm.edit(anchor,'添付照合');await vm.setImages(anchor,['f'.repeat(64)]);try{await vm.send(anchor,reference);}catch{}const before=await vm.load(anchor),history=fixtureAPI.visionHistory;fixtureAPI.visionHistory=async(...args)=>{const r=await history(...args);return {...r,item:{...r.item,images:['a'.repeat(64)]}};};let error;try{await vm.recover(anchor);}catch(e){error=e.message;}return {before,after:await vm.load(anchor),images:await vm.images(anchor),error};
 },{anchor:figure.anchor,reference});same(result.error,'result_invalid','wrong-image receipt refused');same(result.after,result.before,'wrong-image receipt cannot consume pending');same(result.images,['f'.repeat(64)],'wrong-image receipt cannot change attachments');await context.close();}
 {const context=await isolatedContext(1280),a=await context.newPage(),b=await context.newPage();await setup(a,'two-tabs');await setup(b,'two-tabs');await b.evaluate(anchor=>vm.load(anchor),figure.anchor);modes.set('two-tabs','unknown');const first=await a.evaluate(async({anchor,reference})=>{await vm.edit(anchor,'先のタブ');await vm.setImages(anchor,['a'.repeat(64)]);try{await vm.send(anchor,reference);}catch{}return vm.load(anchor);},{anchor:figure.anchor,reference});
  const second=await b.evaluate(async({anchor,reference})=>{const errors=[];for(const work of [()=>vm.setImages(anchor,['b'.repeat(64)]),()=>vm.edit(anchor,'別のタブ'),()=>vm.send(anchor,reference)])try{await work();errors.push(null);}catch(e){errors.push(e.message);}return {errors,images:await vm.images(anchor)};},{anchor:figure.anchor,reference});
  same(second.errors,['pending_locked','draft_conflict','draft_conflict'],'real IndexedDB transaction blocks stale second-tab edits/sends');same(second.images,['a'.repeat(64)],'other tab cannot swap locked image');same(posts.get('two-tabs'),1,'two tabs dispatch one request');same((await a.evaluate(anchor=>vm.load(anchor),figure.anchor)).pending.id,first.pending.id,'original tab UUID retained');await context.close();}
 {const context=await isolatedContext(390),page=await context.newPage();await setup(page,'save-failure');const result=await page.evaluate(async({anchor,reference})=>{
  await vm.edit(anchor,'保存に失敗する質問');await vm.setImages(anchor,['a'.repeat(64)]);const original=IDBDatabase.prototype.transaction;IDBDatabase.prototype.transaction=function(name,mode,...rest){if(mode==='readwrite')throw new DOMException('synthetic storage quota','QuotaExceededError');return original.call(this,name,mode,...rest);};let error;try{await vm.send(anchor,reference);}catch(e){error=e.message;}IDBDatabase.prototype.transaction=original;return {error,draft:await vm.load(anchor),images:await vm.images(anchor)};
 },{anchor:figure.anchor,reference});ok(!!result.error,'actual IndexedDB write failure surfaces');same(result.draft.pending,null,'uncommitted pending rolls back in local model');same(result.draft.text,'保存に失敗する質問','question retained after failed write');same(result.images,['a'.repeat(64)],'selected image retained after failed write');same(posts.get('save-failure')||0,0,'no paid POST before durable write');await context.close();}
 const inputs=[];for(const file of ['tools/candidates/textbook-vision-20261027/textbook-vision-model.js','tools/candidates/textbook-vision-20261027/textbook-vision-capture.js','tools/candidates/textbook-vision-20261027/verify-client-browser.mjs','site-assets/textbook-ai-model.js',catalogFile,asset])inputs.push({file,sha256:createHash('sha256').update(await readFile(new URL(file,root))).digest('hex')});
 await writeFile(new URL('client-browser-result.json',here),JSON.stringify({status:'passed',checks,inputs,scope:'Candidate component model/capture. Real browser and IndexedDB at two widths/three synthetic owners, fake receipt HTTP and real public SVG in a synthetic page. Lost/unknown durable pending and GET recovery, image locks, account isolation and visible-only capture. Actual textbook panel/main registration still pending.'},null,2)+'\n');console.log('Textbook vision client draft/capture: '+checks+' checks passed; real IndexedDB, synthetic HTTP/page only.');
}finally{await browser.close();await new Promise(r=>server.close(r));}
