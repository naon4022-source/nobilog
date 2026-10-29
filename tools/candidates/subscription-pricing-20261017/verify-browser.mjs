import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import path from 'node:path';
const {chromium}=createRequire(import.meta.url)('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(new URL('../../../',import.meta.url).pathname),assets=path.join(root,'site-assets'),out=path.join(root,'output/確認記録/プラン支払総額候補_20261017');
await mkdir(out,{recursive:true});
const names=['plans.html','plans-guide.css','plans-guide.js','subscription-catalog.js','subscription-ui.css','subscription-ui.js'];
const staged={'plans.html':'plans.html','plans-guide.js':'guide.js','subscription-catalog.js':'catalog.js','subscription-ui.js':'ui.js'};
const files=new Map(await Promise.all(names.map(async name=>['/'+name,await readFile(!process.argv.includes('--main')&&staged[name]?new URL('./'+staged[name],import.meta.url):path.join(assets,name),'utf8')])));
const sandbox={};vm.runInNewContext(files.get('/subscription-catalog.js'),sandbox);
const C=sandbox.NobiSubscriptionCatalog;let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++;};
const ids=['free','mini','standard','pro','unlimit'],prices=[0,500,1000,1500,2000],limits=[0,20,100,500,5000];
ok(C.plans.every((p,i)=>p.yen===prices[i]&&p.daily===limits[i]),'new authoritative prices and daily credit limits');
for(const id of ids)for(const kind of ['none','500','1000','full'])for(const months of [1,3,6]){
 const s=C.subsidy(id,kind,months),p=C.find(id),expected=kind==='full'?p.yen:kind==='none'?0:Math.min(Number(kind),p.yen);
 ok(s.monthly===expected&&s.ownMonthly===p.yen-expected&&s.total===expected*months,'subsidy exact amounts '+id+' '+kind+' '+months);
}
ok(C.subsidy('pro','500',3).total===1500,'500 per month over 3 months means 1500 to return');
ok(C.subsidy('pro','500',3).target===85,'chosen amount stays 500; no automatic full subsidy');
ok(C.subsidy('pro','full',3).target===99,'full subsidy requires all subjects 99');
ok(C.subsidy('pro','full',0)===null&&C.subsidy('unknown','500',3)===null,'invalid calculator parameters');
const browser=await chromium.launch({headless:true});
const evidence=[];
try{
 for(const width of [320,390,820,1180,1440]){
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'}),errors=[],unexpected=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>{const p=new URL(r.request().url()).pathname;if(r.request().method()==='GET'&&files.has(p))return r.fulfill({contentType:p.endsWith('.js')?'application/javascript':p.endsWith('.css')?'text/css':'text/html',body:files.get(p)});unexpected.push(r.request().method()+' '+p);return r.abort();});
  await page.goto('http://fixture.test/plans.html?current=%3Cimg%20src%3Dx%3E');
  ok(await page.locator('#compare-from').inputValue()==='standard','prelaunch page has comparison choices, no private current-plan fetch');
  ok(await page.locator('.plan-card').count()===5,'five aligned honest plan cards');
  ok(!(await page.locator('body').innerText()).includes('準備中'),'public prelaunch copy not mixed with implementation notices');
  ok((await page.locator('body').innerText()).includes('公開までに、内容が変わる'),'prelaunch changes disclosed');
  ok(await page.locator('img').count()===0,'query never becomes markup');
  for(let a=0;a<5;a++)for(let b=0;b<5;b++){
   await page.locator('#compare-from').selectOption(ids[a]);await page.locator('#compare-to').selectOption(ids[b]);
   const text=await page.locator('#difference').textContent();
   ok(a===b?text.includes('同じプラン'):text.includes((prices[b]>prices[a]?'＋':'−')+Math.abs(prices[b]-prices[a]).toLocaleString()+'円'),'correct difference '+a+' '+b);
  }
  await page.locator('#compare-from').selectOption('pro');await page.locator('#compare-to').selectOption('standard');
  ok((await page.locator('.change-access').textContent()).includes('ワークのお助け'),'downgrade shows real lost access');
  await page.locator('[data-plan="unlimit"] button').click();ok(await page.locator('#compare-to').inputValue()==='unlimit','card changes comparison only');
  await page.getByRole('tab',{name:'ワークを相談',exact:true}).click();
  ok((await page.locator('#scenario').textContent()).includes('34ページ'),'concrete workbook question');
  ok((await page.locator('#scenario').textContent()).includes('推測しません'),'unknown original question never invented');
  await page.getByRole('tab',{name:'予定を整える',exact:true}).click();
  ok((await page.locator('#scenario').textContent()).includes('数学・英語・国語・理科・社会'),'planning example applies to all subjects');
  await page.locator('#support-plan').selectOption('pro');await page.locator('#support-kind').selectOption('500');
  ok((await page.locator('#support-result').textContent()).includes('1,500円'),'repayment amount visible');
  ok(await page.locator('#support-conditions').isVisible(),'subsidy conditions openly visible');
  ok((await page.locator('#support-conditions').textContent()).includes('全額返します'),'repayment condition explicit');
  ok(await page.locator('div.support-important').isVisible(),'repayment condition not hidden in accordion');
  ok((await page.locator('div.support-important').textContent()).includes('返します'),'obligation plainly written');
  await page.locator('#support-kind').selectOption('full');ok((await page.locator('#support-result').textContent()).includes('4,500円'),'full Pro support over 3 months');
  ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no page overflow '+width);
  if(width>=1180)ok(await page.locator('.plan-card').evaluateAll(ns=>ns.every(n=>Math.abs(n.getBoundingClientRect().top-ns[0].getBoundingClientRect().top)<2)),'UNLIMIT aligned with other cards');
  await page.locator('#compare-from').selectOption('standard');await page.locator('#compare-to').selectOption('pro');await page.locator('#support-kind').selectOption('500');await page.evaluate(()=>scrollTo(0,0));
  if(width===390||width===1440){await page.screenshot({path:path.join(out,'紹介-'+width+'.png'),fullPage:true});await page.screenshot({path:path.join(out,'表紙-'+width+'.png')});}
  ok(unexpected.length===0,'no account, payment, API, analytics requests');ok(errors.length===0,'no browser errors');
  evidence.push({width,errors,unexpected,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});await page.close();
 }
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});await page.route('**/*',r=>r.abort());
  await page.setContent('<style>body{--box-bg:#223344;--text-color:#fff;--bg-color:#172635;--border-color:#526980}</style><button id="return">元の画面</button><div id="host"></div>');
  for(const name of ['plans-guide.css','subscription-ui.css'])await page.addStyleTag({content:files.get('/'+name)});
  for(const name of ['subscription-catalog.js','plans-guide.js','subscription-ui.js'])await page.addScriptTag({content:files.get('/'+name)});
  await page.evaluate(()=>{window.current=true;window.calls=[];window.fail=false;window.view=NobiSubscription.mount(document.querySelector('#host'),{same:()=>current,plan:async()=>{if(fail)throw Error('offline');return {provisional:true,plan:'pro',creditsVersion:'daily-v2',dailyLeft:499,dailyLimit:500};},consult:()=>calls.push('consult'),workbookDraft:()=>calls.push('draft')});});
  await page.getByRole('heading',{name:'Pro',exact:true}).waitFor();ok(await page.locator('#current-plan').count()===0,'current plan automatic, no editable selector');
  ok((await page.locator('.current-quota').textContent()).includes('499 / 500'),'server-owned remaining units');
  ok(await page.locator('.subscription-overlay').evaluate(n=>getComputedStyle(n).position)==='fixed','app full viewport');
  ok(await page.locator('.subscription-current').evaluate(n=>getComputedStyle(n).backgroundColor)==='rgb(34, 51, 68)','inherits theme');
  await page.getByRole('button',{name:'ワークの相談文を作る',exact:true}).click();ok(await page.evaluate(()=>calls.join(','))==='draft','workbook draft action; no automatic send');
  await page.getByRole('button',{name:'変更する',exact:true}).click();await page.locator('.subscription-main select').selectOption('standard');
  ok((await page.locator('.change-access').textContent()).includes('ワークのお助け'),'app downgrade display');
  ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'app fits '+width);
  await page.screenshot({path:path.join(out,'アプリ内-'+width+'.png')});
  await page.keyboard.press('Escape');ok(await page.getByRole('dialog').count()===0,'Escape closes after async rerender');await page.close();
 }
 const race=await browser.newPage();await race.setContent('<div id="host"></div>');for(const name of ['subscription-catalog.js','plans-guide.js','subscription-ui.js'])await race.addScriptTag({content:files.get('/'+name)});
 await race.evaluate(()=>{window.current=true;window.release=null;window.view=NobiSubscription.mount(document.querySelector('#host'),{same:()=>current,plan:()=>new Promise(r=>release=r)});});await race.evaluate(()=>{current=false;release({provisional:true,plan:'unlimit'});});ok(await race.getByRole('heading',{name:'UNLIMIT',exact:true}).count()===0,'stale account reply ignored');await race.evaluate(()=>view.destroy());await race.close();
 await writeFile(path.join(out,'検証記録.json'),JSON.stringify({checks,evidence,apiCalls:0,paymentCalls:0,liveDataRead:false},null,2));
 console.log('Plan guide v2: '+checks+' checks passed; five widths, all plan comparisons, subsidy amounts/repayment, workbook example, automatic current plan, theme inheritance, stale reply, keyboard; no paid API or real data');
}finally{await browser.close();}
