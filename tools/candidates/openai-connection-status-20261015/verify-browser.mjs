import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assets=new URL('../../../site-assets/',import.meta.url);
const server=createServer(async(req,res)=>{
 if(req.url==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end('<meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/messages.css"><div id="host"></div><script src="/messages.js"></script>');return;}
 if(!['/messages.js','/messages.css'].includes(req.url)){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',req.url.endsWith('.js')?'text/javascript':'text/css');res.end(await readFile(new URL(req.url.slice(1),assets)));
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser,n=0;
try{
 browser=await chromium.launch({headless:true});
 for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:900}});let external=0;
  await page.route('**/*',r=>{if(new URL(r.request().url()).hostname==='127.0.0.1')return r.continue();external++;return r.abort();});
  await page.goto('http://127.0.0.1:'+server.address().port);
  for(const [reason,text] of [['ready','今日の残り'],['billing_required','入金'],['consent_required','利用確認'],['daily_limit','10回'],['stopped','停止'],['controls_unavailable','安全設定']]){
   await page.evaluate(reason=>{
    window.view?.destroy?.();document.getElementById('host').replaceChildren();window.posts=0;
    const plan={provisional:true,plan:'pro',label:'Pro',features:{chat:true},creditsVersion:'daily-v2'};
    window.view=NobiMessages.mount(document.getElementById('host'),{tab:'ai',same:()=>true,lastPlan:plan,plan:async()=>plan,draftGet:()=>'',draftSet:()=>{},newId:()=>crypto.randomUUID(),get:async path=>path==='/learning-chat'?{items:[],provider:'openai',ready:reason==='ready',connection:{reason,trialLimit:10,trialLeft:reason==='daily_limit'?0:7,monthlyLimitYen:800}}:{items:[]},post:async()=>{window.posts++;throw Error('No paid calls in fixture');}});
   },reason);
   await page.getByText(text,{exact:false}).first().waitFor();n++;
   assert.equal(await page.getByRole('button',{name:'送信する',exact:true}).isDisabled(),reason!=='ready');n++;
   assert.equal(await page.evaluate(()=>window.posts),0);n++;
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);n++;
  }
  assert.equal(external,0);n++;await page.close();
 }
}finally{await browser?.close();server.close();}
console.log(`OpenAI connection display: ${n} checks passed; two widths, gates and zero paid/external requests`);
