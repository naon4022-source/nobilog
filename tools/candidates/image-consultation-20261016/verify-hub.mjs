import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const js=await readFile(new URL('./ai-hub.js',import.meta.url),'utf8'),css=await readFile(new URL('./ai-hub.css',import.meta.url),'utf8');
const html='<meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>body{margin:0;background:#f4f7fb;font:16px sans-serif}'+css+'</style><main></main><script>'+js+`</script><script>
window.owner=true;window.plan='free';window.ready=true;window.images=false;window.fail=false;window.events=[];window.waiting=null;window.gets=0;
window.hub=NobiAIHub.mount(document.querySelector('main'),{same:()=>owner,status:async()=>{gets++;if(waiting)await waiting;if(fail)throw Error('private-provider-detail');return {plan,ready,images,remaining:20,trial:true};},plans:rank=>events.push('plan:'+rank),actions:Object.fromEntries(['practice','planning','chat','photo','notes','nao'].map(k=>[k,()=>events.push(k)]))});
</script>`;
const server=createServer((_,res)=>{res.setHeader('Content-Type','text/html');res.end(html);});await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser,n=0;
const eq=(a,b)=>{assert.deepEqual(a,b);n++;};
try{
 browser=await chromium.launch({headless:true});
 for(const width of [390,820,1440]){
  const page=await browser.newPage({viewport:{width,height:1000}}),errors=[];let outside=0;
  page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():(outside++,r.abort()));await page.goto('http://127.0.0.1:'+server.address().port);await page.getByText(/Free · 今日の残り/).waitFor();
  eq(await page.evaluate(()=>gets),1);eq(await page.evaluate(()=>events),[]);eq(await page.locator('.aih-card').count(),6);
  const expected={free:6,mini:5,standard:4,pro:1,unlimit:0};
  for(const plan of Object.keys(expected)){
   await page.evaluate(async p=>{plan=p;await hub.refresh();},plan);
   eq(await page.locator('.aih-lock').count(),expected[plan]);eq(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   if(['pro','unlimit'].includes(plan)){eq(await page.locator('[data-ai-feature=photo] button').isDisabled(),true);await page.locator('[data-ai-feature=chat] button').click();eq(await page.evaluate(()=>events.at(-1)),'chat');}
  }
  await page.evaluate(async()=>{plan='pro';images=true;await hub.refresh();});eq(await page.getByText(/写真1枚につき3回分/).count(),1);await page.locator('[data-ai-feature=photo] button').click();eq(await page.evaluate(()=>events.at(-1)),'photo');
  if(width===390)await page.screenshot({path:'/tmp/nobi-ai-hub-candidate-390.png',fullPage:true,animations:'disabled'});
  await page.evaluate(async()=>{ready=false;await hub.refresh();});eq(await page.locator('[data-ai-feature=chat] button').isDisabled(),true);eq(await page.locator('[data-ai-feature=photo] button').isDisabled(),true);
  await page.evaluate(async()=>{fail=true;await hub.refresh();});eq(await page.locator('.aih-card').count(),0);eq(await page.getByText(/private-provider-detail/).count(),0);
  await page.evaluate(()=>fail=false);await page.getByRole('button',{name:'もう一度確認',exact:true}).click();await page.locator('.aih-card').first().waitFor();
  await page.evaluate(()=>{waiting=new Promise(r=>window.release=r);hub.refresh();});eq(await page.locator('.aih-card button:enabled').count(),0);
  await page.evaluate(()=>{owner=false;hub.destroy();waiting=null;release();});eq(await page.locator('main').textContent(),'');eq(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  eq(errors,[]);eq(outside,0);await page.close();
 }
 console.log('AI menu candidate: '+n+' checks passed; three widths, five plan locks, explicit-only actions, image readiness, disconnected/failed load, quota wording and owner teardown; no AI or uploads');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
