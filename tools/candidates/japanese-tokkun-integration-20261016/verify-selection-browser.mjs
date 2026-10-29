import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const english=process.argv.includes('--english'),drill=process.argv.includes('--drill');
const root=new URL('../../../',import.meta.url),plan=drill?{readyForIntegration:[{destination:'教材整理/確認済み/drill-japanese-1-shiji.json'}]}:JSON.parse(await readFile(new URL(english?'../english-tokkun-integration-20261016/integration-plan.json':'integration-plan.json',import.meta.url),'utf8'));
const bank=JSON.parse(await readFile(new URL('site-assets/material-bank.json',root),'utf8'));
const units=await Promise.all((plan.readyForIntegration||plan.entries.filter(e=>e.new||e.correctedQuestions?.length)).map(async e=>{const original=JSON.parse(await readFile(new URL(e.destination,root),'utf8')),actual=bank.units.find(u=>u.id===original.id);assert.deepEqual(actual,original,'copied unit must be present unchanged in the actual bank');return actual;}));
const assets=Object.fromEntries(await Promise.all(['material-ui.css','material-ui.js','material-engine.js'].map(async name=>[name,await readFile(new URL('site-assets/'+name,root),'utf8')])));
const server=createServer((req,res)=>{const name=req.url.slice(1);res.setHeader('Content-Type',name.endsWith('.css')?'text/css':assets[name]?'text/javascript':'text/html;charset=utf-8');res.end(assets[name]||'<meta name="viewport" content="width=device-width"><link rel="stylesheet" href="/material-ui.css"><main></main><script src="/material-engine.js"></script><script src="/material-ui.js"></script>');});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser,n=0;const eq=(a,b)=>{assert.deepEqual(a,b);n++;};
try{
 browser=await chromium.launch({headless:true});
 for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
  await page.goto('http://127.0.0.1:'+server.address().port);
  for(const unit of units){
   await page.evaluate(({unit,sources})=>{window.controller?.destroy();window.recordCalls=0;window.controller=NobiMaterialUI.mount(document.querySelector('main'),[unit],{identity:()=> 'synthetic-only',load:async()=>({}),save:async()=>{},record:async()=>{recordCalls++;throw Error('No answer submission in this fixture');}},sources);},{unit,sources:bank.sources});
   await page.getByRole('button',{name:drill?'ドリル':'特訓',exact:true}).click();
   await page.getByRole('button',{name:'作成する',exact:true}).waitFor();
   eq(await page.locator('form').count(),0);
   for(const count of process.argv.includes('--smoke')&&unit!==units[0]?[15]:[15,30,45,60]){
    await page.getByRole('button',{name:count+'問',exact:true}).click();
    eq(await page.locator('form').count(),0);
    await page.getByRole('button',{name:'作成する',exact:true}).click();await page.locator('.material-batch-question').first().waitFor();
    eq(await page.locator('.material-batch-question').count(),count);
    const ids=await page.locator('textarea[data-material-question]').evaluateAll(es=>es.map(e=>e.getAttribute('data-material-question')));
    eq(ids.length,count);eq(new Set(ids).size,count);eq(ids.every(id=>unit.questions.some(q=>q.id===id)),true);
    eq(await page.evaluate(()=>recordCalls),0);eq(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await page.getByRole('button',{name:'出題条件へ戻る',exact:true}).click();
   }
   if(drill){
    await page.getByRole('button',{name:'テスト',exact:true}).click();await page.getByRole('button',{name:'15問',exact:true}).click();
    eq(await page.locator('form').count(),0);await page.getByRole('button',{name:'作成する',exact:true}).click();await page.locator('.material-batch-question').first().waitFor();
    const ids=await page.locator('textarea[data-material-question]').evaluateAll(es=>es.map(e=>e.getAttribute('data-material-question')));
    eq(ids.length,15);eq(new Set(ids).size,15);eq(ids.every(id=>unit.tests.some(q=>q.id===id)),true);eq(ids.some(id=>unit.questions.some(q=>q.id===id)),false);eq(await page.evaluate(()=>recordCalls),0);
   }
  }
  eq(errors,[]);await page.close();
 }
 console.log(`${english?'English':drill?'Japanese drill':'Japanese'} selection: ${n} checks passed; actual bank/engine/UI with ${units.length} unchanged reviewed units, 15/30/45/60 unique questions after explicit create, ${drill?'independent 15-question test, ':''}correct unit IDs, two widths and zero answer submissions; synthetic-only local page`);
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
