import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const read=name=>readFile(new URL('../../../site-assets/'+name,import.meta.url),'utf8');
const catalog=await read('subscription-catalog.js'),guide=await read('plans-guide.js'),ui=await read('subscription-ui.js'),css=(await read('plans-guide.css'))+'\n'+await read('subscription-ui.css');
const standalone=(await read('plans.html')).replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<link\b[^>]*>/g,'');
const texts=['利用開始日から翌月の同じ日まで','期限後7日間の猶予後にFreeへ戻ります','学習記録は削除しません'];let n=0;const ok=(v,m)=>{assert(v,m);n++;};
const browser=await chromium.launch({headless:true});
try{
 for(const width of [320,390,1440])for(const kind of ['guide','mini','standard','pro','unlimit']){
  const page=await browser.newPage({viewport:{width,height:950}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>r.abort());
  await page.setContent('<meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style>'+(kind==='guide'?standalone:'<div id="host"></div>'));
  await page.addScriptTag({content:catalog});await page.addScriptTag({content:guide});
  if(kind!=='guide'){
   await page.addScriptTag({content:ui});await page.evaluate(plan=>{NobiSubscription.mount(document.querySelector('#host'),{same:()=>true,plan:async()=>({provisional:true,plan,creditsVersion:'daily-v2',dailyLimit:20,dailyLeft:20})});},kind);
   await page.locator('.subscription-current').waitFor();
  }
  const box=page.locator(kind==='guide'?'#rule-cards':'.subscription-current');const text=await box.textContent();for(const value of texts)ok(text.includes(value),kind+' '+width+' '+value);
  ok(errors.length===0,errors.join(' / '));ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow '+kind+' '+width);
  await page.close();
 }
 console.log('Subscription terms UI: '+n+' checks passed; four paid plans and standalone guide, 320/390/1440px, start-date cycle/7-day grace/record retention, no overflow or network');
}finally{await browser.close();}
