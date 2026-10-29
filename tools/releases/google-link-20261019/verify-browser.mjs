import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=new URL('./',import.meta.url),base=new URL('candidate/pages/',root);let checks=0;
const ok=(v,m)=>{assert.ok(v,m);checks++;};
const server=createServer(async(req,res)=>{const name=new URL(req.url,'http://local').pathname.slice(1)||'index.html';if(!/^[a-z0-9.-]+$/.test(name)){res.writeHead(404).end();return;}try{const b=await readFile(new URL(name,base));res.writeHead(200,{'Content-Type':name.endsWith('.js')?'text/javascript':name.endsWith('.json')?'application/json':name.endsWith('.html')?'text/html':'application/octet-stream'}).end(b);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true});let outbound=0;
try{
 await mkdir(new URL('screens/',root),{recursive:true});
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:900}});
  await page.route('**/*',async route=>{
   const url=new URL(route.request().url());if(url.hostname==='127.0.0.1')return route.continue();
   outbound++;
   if(url.hostname.endsWith('workers.dev')){
    let data={};
    if(url.pathname==='/save')data={v:0,keys:null};
    if(url.pathname==='/school-results')data={records:{u4:{teiki:[],kakunin:[]},u1:{teiki:[{id:'synthetic',name:'Synthetic term',total:321}]},u2:{teiki:[]}}};
    if(url.pathname==='/school-calendar')data={events:[],holidays:[],details:{},notices:[],leadDays:0};
    if(url.pathname==='/login-days')data={days:{}};
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
   }
   return route.abort();
  });
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'load'});
  await page.evaluate(()=>{currentUserId='u4';currentUser=APP_USERS.find(u=>u.id==='u4');loadUserState();applyUserNav();switchView('calendar');});
  await page.waitForTimeout(100);
  await page.evaluate(()=>document.getElementById('login-overlay').classList.remove('on'));
  const calendar=await page.locator('#cal-list').innerText();
  ok(calendar.includes('そうたの学校の予定はまだ登録されていません'),width+' independent calendar');
  ok(!calendar.includes('定期テスト直前')&&!calendar.includes('代表委員会')&&!calendar.includes('2学期スタート'),width+' no family school events');
  await page.evaluate(()=>{switchView('ottake');renderOtTake();});
  const exams=await page.locator('#ottake-body').innerText();
  ok(exams.includes('なお・りらん用')&&exams.includes('そうた用'),width+' both audience labels');
  ok(exams.includes('そうた用の範囲・教科書は未登録'),width+' no invented scope');
  ok(!exams.includes('11月24日')&&!exams.includes('9月の定期テスト'),width+' no inherited archive');
  ok(await page.locator('#nav-ottake').evaluate(el=>el.style.display!=='none'),width+' Souta exam entry visible');
  await page.waitForTimeout(900);
  await page.screenshot({path:new URL('screens/souta-exams-'+width+'.png',root).pathname,fullPage:true});
  await page.evaluate(()=>{switchView('stats');renderSchoolTests(false);});
  ok((await page.locator('#school-contest').innerText()).includes('そうた'),width+' contest includes Souta');
  ok(await page.locator('#st-body').evaluate(el=>el.style.display==='none'),width+' no other school detailed chart');
  ok((await page.locator('#school-contest').innerText()).includes('未登録'),width+' missing marks not fake zero');
  // Switch back to both existing accounts without overwriting their original chart nodes.
  for(const uid of ['u1','u2']){
   await page.evaluate(uid=>{currentUserId=uid;currentUser=APP_USERS.find(u=>u.id===uid);loadUserState();applyUserNav();renderSchoolTests(false);switchView('ottake');renderOtTake();},uid);
   ok(await page.locator('#st-body').evaluate(el=>el.style.display===''),width+' original chart restored '+uid);
   const text=await page.locator('#ottake-body').innerText();ok(text.includes('9月の定期テスト')&&text.includes('なお・りらん用')&&text.includes('そうた用'),width+' original archive plus audiences '+uid);
  }
  ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),width+' no page overflow');
  await page.close();
 }
 await writeFile(new URL('browser-result.json',root),JSON.stringify({checks,passed:true,widths:[390,1440],interceptedRequests:outbound,liveApiCalls:0,realUserData:false},null,2)+'\n');
 console.log('Souta browser:',checks,'checks passed; real published app candidate, two widths, school separation, audience labels, contest, account switching; synthetic API only');
}finally{await browser.close();server.close();}
