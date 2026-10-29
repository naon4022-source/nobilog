import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const code=await readFile(new URL('./storage.js',import.meta.url),'utf8'),queue=await readFile(new URL('./outbox.cjs',import.meta.url),'utf8');
const server=createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html'});res.end('<script>'+code+'</script><script>'+queue+'</script>');});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser,checks=0;function equal(a,b){assert.deepEqual(a,b);checks++;}
try{
 browser=await chromium.launch({headless:true});const page=await browser.newPage();await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());await page.goto('http://127.0.0.1:'+server.address().port);
 await page.evaluate(async()=>{window.payload={id:'00000000-0000-4000-8000-000000000001',sessionId:'00000000-0000-4000-8000-000000000002',spans:[{activity:'textbook:math1',startOffset:0,endOffset:1000}]};window.storage=await NobiLearningTimeStorage.open('a');window.q=NobiLearningTimeOutbox.create({uid:'a',same:()=>true,storage,send:async()=>{throw Error('offline');}});await q.enqueue(payload);});
 equal(await page.evaluate(async()=>!!(await q.flush()).error),true);equal(await page.evaluate(async()=>(await storage.list('a',20)).length),1);
 await page.reload();
 await page.evaluate(async()=>{window.storage=await NobiLearningTimeStorage.open('a');window.payload=(await storage.list('a',20))[0];});
 equal(await page.evaluate(()=>payload.spans[0].endOffset),1000);
 equal(await page.evaluate(async()=>{const b=await NobiLearningTimeStorage.open('b');try{return (await b.list('b',20)).length;}finally{b.close();}}),0);
 equal(await page.evaluate(async()=>{try{await storage.list('b',20);return false;}catch(_){return true;}}),true);
 equal(await page.evaluate(async()=>{try{await storage.put('a',{...payload,sessionId:payload.id});return false;}catch(_){return true;}}),true);
 equal(await page.evaluate(async()=>(await storage.list('a',20))[0].sessionId===payload.sessionId),true);
 equal(await page.evaluate(async()=>{try{await storage.remove('a',{...payload,spans:[]});return false;}catch(_){return true;}}),true);
 equal(await page.evaluate(async()=>(await storage.list('a',20)).length),1);
 equal(await page.evaluate(async()=>{const b=await NobiLearningTimeStorage.open('b');await b.put('b',payload);await b.remove('b',payload);b.close();return (await storage.list('a',20)).length;}),1);
 equal(await page.evaluate(async()=>{const q=NobiLearningTimeOutbox.create({uid:'a',same:()=>true,storage,send:async p=>({id:p.id,acceptedAt:100000})});return (await q.flush()).sent;}),1);
 equal(await page.evaluate(async()=>(await storage.list('a',20)).length),0);
 await page.reload();equal(await page.evaluate(async()=>{const s=await NobiLearningTimeStorage.open('a');const rows=await s.list('a',20);s.close();return rows.length;}),0);
 console.log('Timeline IndexedDB candidate: '+checks+' checks passed; real browser reload, offline retention, owner isolation, conflict protection, exact receipt deletion and durable acknowledgement; localhost only');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
