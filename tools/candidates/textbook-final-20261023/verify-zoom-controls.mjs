// Fast regression for the actual zoom/sheet functions; synthetic image, no accounts.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=new URL('../../../',import.meta.url),source=await readFile(new URL('site-assets/textbook-book.js',root),'utf8'),css=await readFile(new URL('site-assets/textbook-book.css',root),'utf8');
const line=prefix=>{const matches=source.split('\n').filter(x=>x.startsWith(prefix));assert.equal(matches.length,1);return matches[0];};
const begin=source.indexOf('function stopEmbeddedMedia('),end=source.indexOf('// ---- 見開き ----',begin);assert(begin>0&&end>begin);
const script=`const root=globalThis,state={app:document.getElementById('fixture'),book:{meta:{color:'#1f5fa8'}},sheet:null};
${line('function el(')}
${line('function button(')}
function tint(){return '#eef5ff'}
function inline(node,text){node.textContent=text}
function block(b){${line(" if(b.t==='zoomimg'")}}
${source.slice(begin,end)}
globalThis.ZoomFixture={open(){openSheet({summary:'分数の図',wide:true,body:[{t:'zoomimg',src:'/textbook-book-test.svg',alt:'検証用の図'}]})}};`;
let count=0;const ok=(value,message)=>{assert(value,message);count++;};
const browser=await chromium.launch({headless:true});
try{
 for(const [width,height]of [[320,740],[390,844],[820,1180],[1440,900]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>{const p=new URL(route.request().url()).pathname;if(p==='/')return route.fulfill({contentType:'text/html',body:'<meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style><div id="fixture" class="tb-app" style="position:fixed;inset:0"></div>'});if(p==='/textbook-book-test.svg')return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900"><rect width="1600" height="900" fill="white"/><text x="40" y="90" font-size="44">図の検証</text></svg>'});return route.abort();});
  await page.goto('http://textbook.test/');await page.addScriptTag({content:script});await page.evaluate(()=>ZoomFixture.open());
  const image=page.locator('.tb-zoom-img');await image.evaluate(n=>n.decode());
  await page.evaluate(()=>Promise.all(document.getAnimations().map(a=>a.finished.catch(e=>{if(e.name!=='AbortError')throw e;}))));
  const baseline=await image.evaluate(n=>n.clientWidth),plus=page.getByRole('button',{name:'図を大きくする',exact:true}),minus=page.getByRole('button',{name:'図を小さくする',exact:true});
  ok(baseline>=640,'initial readable width');ok(await minus.isDisabled(),'minimum bound');
  for(let i=0;i<4;i++)await plus.click();
  ok(await plus.isDisabled(),'maximum bound');ok(await image.evaluate((n,b)=>Math.abs(n.clientWidth-b*3)<2,baseline),'three-times width');
  ok(await page.getByLabel('拡大率',{exact:true}).textContent()==='300%','announced scale');
  const fit=await page.evaluate(()=>{const body=document.querySelector('.tb-sheet-body');body.scrollLeft=body.scrollWidth;body.scrollTop=body.scrollHeight;const image=body.querySelector('img').getBoundingClientRect(),r=body.getBoundingClientRect(),close=document.querySelector('.tb-sheet-close').getBoundingClientRect(),tools=document.querySelector('.tb-zoom-controls').getBoundingClientRect();return {all:document.documentElement.scrollWidth<=innerWidth&&image.right<=r.right+1&&image.bottom<=r.bottom+1,close:close.top>=0&&close.bottom<=innerHeight,tools:tools.left>=0&&tools.right<=innerWidth&&tools.top>=0&&tools.bottom<=innerHeight};});
  ok(fit.all,'image reachable and outer page contained');ok(fit.close&&fit.tools,'controls and close remain visible after both-axis pan');
  await minus.click();ok(await page.getByLabel('拡大率',{exact:true}).textContent()==='250%','decrease');
  await page.getByRole('button',{name:'図を元の大きさに戻す',exact:true}).click();ok(await image.evaluate((n,b)=>Math.abs(n.clientWidth-b)<2,baseline),'reset');
  await page.evaluate(()=>globalThis.staleZoomButton=document.querySelector('.tb-zoom-controls button[aria-label="図を大きくする"]'));
  await page.getByRole('button',{name:'閉じる',exact:true}).click();ok(await image.count()===0,'close');
  await page.evaluate(()=>{ZoomFixture.open();staleZoomButton.click();});ok(await page.getByLabel('拡大率',{exact:true}).textContent()==='100%','reopen and stale button isolation');
  ok(errors.length===0,errors.join(' / '));await page.close();
 }
 console.log('Textbook zoom: '+count+' checks passed at 320/390/820/1440; actual functions/CSS, bounded zoom, reset, two-axis pan, visible close, reopening and stale-button isolation; synthetic image only.');
}finally{await browser.close();}
