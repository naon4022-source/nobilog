import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const main=process.argv.includes('--main'),baseline=process.argv.includes('--baseline');
const read=p=>readFile(new URL(p,import.meta.url),'utf8');
const catalog=await read('../subscription-pricing-20261017/previous-fixed-total/catalog.js');
const html=(await read('../../../site-assets/plans.html')).replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<link\b[^>]*>/g,'');
const guide=await read(main||baseline?'../../../site-assets/plans-guide.js':'./guide.js'),ui=await read(main||baseline?'../../../site-assets/subscription-ui.js':'./ui.js');
let checks=0;const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
const browser=await chromium.launch({headless:true});
try{
 for(const width of [390,1440])for(const mode of ['guide','app']){
  const page=await browser.newPage({viewport:{width,height:950}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>r.abort());
  await page.setContent(mode==='guide'?html:'<div id="host"></div>');await page.addScriptTag({content:catalog});eq(await page.evaluate(()=>typeof NobiSubscriptionCatalog.priceLabel),'undefined');
  await page.addScriptTag({content:guide});
  if(mode==='app'){await page.addScriptTag({content:ui});await page.evaluate(async()=>{window.view=NobiSubscription.mount(document.querySelector('#host'),{same:()=>true,plan:async()=>({provisional:true,plan:'pro',creditsVersion:'daily-v2',dailyLeft:500,dailyLimit:500})});await Promise.resolve();await Promise.resolve();});}
  if(baseline){if(!errors.length)await page.waitForEvent('pageerror',{timeout:3000});assert(errors.some(x=>x.includes('priceLabel')),mode+' '+width+': '+errors.join(' / '));checks++;}
  else{
   const prices=await page.locator(mode==='guide'?'.plan-card .price':'.subscription-current').allTextContents();eq(prices.some(t=>t.includes(mode==='guide'?'500円（税込）':'1,500円（税込）')),true);eq(errors,[]);
   if(mode==='guide'){eq(prices.length,5);await page.locator('#compare-to').selectOption('unlimit');eq((await page.locator('#difference').textContent()).includes('2,000円（税込）'),true);}
   else{await page.getByRole('button',{name:'変更する',exact:true}).click();eq((await page.locator('.subscription-main').textContent()).includes('2,000円（税込）'),true);}
  }
  await page.close();
 }
 console.log('Subscription cached catalogue: '+checks+' checks passed; '+(baseline?'reproduced current missing-priceLabel crash':'old cached catalogue plus new standalone guide/app at two widths, fixed total prices and comparison, no errors')+'; no payment/API/network');
}finally{await browser.close();}
