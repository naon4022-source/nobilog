import assert from 'node:assert/strict';import {createServer} from 'node:http';import {readFile,writeFile,mkdir} from 'node:fs/promises';import {createRequire} from 'node:module';
const H=new URL('./',import.meta.url),html=await readFile(new URL('candidate/pages/index.html',H));
const {chromium}=createRequire(import.meta.url)('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const server=createServer((req,res)=>{if(req.url==='/'){res.setHeader('Content-Type','text/html;charset=utf-8');res.end(html);}else{res.writeHead(404);res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true});let checks=0;const ok=(v,m)=>{assert(v,m);checks++;};await mkdir(new URL('screens/',H),{recursive:true});
try{
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:900}});let start=null,identityRequests=0;
  await page.route('**/*',async route=>{const req=route.request(),u=new URL(req.url());
   if(u.hostname==='127.0.0.1')return route.continue();
   if(u.pathname==='/auth/legacy'){identityRequests++;return route.fulfill({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify({ticket:'synthetic-link-ticket',name:'合成の本人'})});}
   if(u.pathname==='/auth/start'){start={provider:u.searchParams.get('provider'),mode:u.searchParams.get('mode'),ticket:u.searchParams.get('ticket')};return route.fulfill({status:200,contentType:'text/html;charset=utf-8',body:'<h1>合成Google連携入口</h1>'});}
   if(u.hostname==='challenges.cloudflare.com')return route.fulfill({status:200,contentType:'text/javascript',body:''});
   return route.abort();
  });
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:'🔐 パスワードでログイン',exact:true}).click();
  const link=page.getByRole('button',{name:'Googleアカウントと連携する（本人確認後）',exact:true});
  ok(await link.isVisible(),'Google link entry visible '+width);
  ok(await page.getByRole('button',{name:'初めてLINEと連携するときはこちら'}).isVisible(),'LINE entry retained '+width);
  await link.click();ok(identityRequests===0,'empty input does not send identity request '+width);
  await page.locator('#login-pin').fill('0000');await link.click();ok(identityRequests===0,'no Turnstile confirmation blocks identity request '+width);
  await page.evaluate(()=>{turnstileToken='synthetic-confirmed-token';turnstileLoadedAt=Date.now();});
  ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'password screen fits '+width);
  await page.screenshot({path:new URL('screens/password-'+width+'.png',H).pathname});
  await link.click();try{await page.getByRole('heading',{name:'合成Google連携入口'}).waitFor({timeout:10000});}catch(e){console.log(JSON.stringify({width,identityRequests,start,error:await page.locator('#login-err').textContent().catch(()=>null)}));throw e;}
  ok(identityRequests===1,'one identity request '+width);ok(start?.provider==='google'&&start.mode==='link'&&start.ticket==='synthetic-link-ticket','verified Google link path; no create/login '+width);
  await page.close();
 }
 await writeFile(new URL('browser-result.json',H),JSON.stringify({status:'passed',checks,widths:[390,1440],scope:'public HTML candidate, synthetic token/provider; no real PIN, Turnstile, user record or Google OAuth'},null,2)+'\n');console.log('Google entry browser:',checks,'checks passed; synthetic only');
}finally{await browser.close();server.close();}
