import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import bank from '../../../../cf-worker/src/material-bank.mjs';
import {testSessionRoute} from '../../../../cf-worker/src/ai-test-session-route.mjs';
import {materialRecordsRoute} from '../../../../cf-worker/src/material-records.mjs';
import {readCompletedTest,completedTestData} from '../../../../cf-worker/src/ai-test-session.mjs';
const require=createRequire(import.meta.url),{D1SQLite}=require('../../../../.claude/verify/d1-sqlite.js');
const {chromium}=require('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const here=new URL('./',import.meta.url),unit=bank.units.find(u=>u.id==='drill-math-1-signed'),assets=Object.fromEntries(await Promise.all(['material-ui.css','material-engine.js','material-ui.js','material-bridge.js','material-entry.js','vertical-fractions.js'].map(async name=>[name,await readFile('site-assets/'+name,'utf8')])));
const mock=bank.units.find(u=>u.mode==='kentei'&&u.questions.length===20);assert.ok(mock);
assets['material-bank.json']=JSON.stringify({units:[unit,mock],sources:bank.sources});
const fixtures=new Map();let checks=0,outsideCalls=0;const ok=(v,m)=>{assert.ok(v,m);checks++;};
function fixture(id){const db=new D1SQLite();db.seed('active-session:u4','fixture-browser-owner',Date.now()+3600000);const f={db,createCalls:[],records:[],lostCreate:false,lostRecord:false};fixtures.set(id,f);return f;}
const html=`<meta charset="utf-8"><meta name="viewport" content="width=device-width"><link rel="stylesheet" href="/material-ui.css"><style>body{margin:12px;font:16px sans-serif;background:#f3f8f5}*{box-sizing:border-box}</style><main id="study-materials"></main><script>
var currentUserId='u4',token=1,serverBootReady=true,authLeaseBlocked=false,cloudState={busy:false},cloudTimer=null,dirty=false,userData={},serverRecord={};
const memory=new Map([['u4:appData',JSON.stringify({totalScores:{math:17},history:[{note:'synthetic sentinel'}]})]]);
var recordStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)};
function cloudIdentity(){return {uid:currentUserId,token};}function cloudSame(w){return w.uid===currentUserId&&w.token===token;}function cloudConflict(){return false;}function cloudDirty(){return dirty;}function cloudSetDirty(v){dirty=v;}function isTrial(){return false;}
async function cloudPush(){serverRecord=JSON.parse(recordStorage.getItem(currentUserId+':appData'));dirty=false;return true;}
function cloudUrl(path){return '/api'+path;}async function cloudTry(path,options){return fetch(path,{...options,headers:{...options?.headers,'X-Fixture':new URLSearchParams(location.search).get('fixture')}});}
</script><script src="/vertical-fractions.js"></script><script src="/material-engine.js"></script><script src="/material-ui.js"></script><script src="/material-bridge.js"></script><script src="/material-entry.js"></script><script>void NobiMaterialEntry.start();</script>`;
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://fixture.invalid');
  if(url.pathname.startsWith('/api/')){
   const f=fixtures.get(req.headers['x-fixture']);if(!f){res.writeHead(403);res.end();return;}
   let body='';for await(const c of req)body+=c;
   const origin='http://127.0.0.1:'+server.address().port,env={AUTH_DB:f.db,APP_ORIGIN:origin},path=url.pathname.slice(4),request=new Request(origin+path+url.search,{method:req.method,headers:{'Content-Type':'application/json',Origin:origin},...(req.method==='POST'?{body}:{})});
   let response;
   if(path==='/material-test-session'){
    response=await testSessionRoute(request,env,{uid:'u4'},{owner:'fixture-browser-owner'});
    if(req.method==='POST'){f.createCalls.push({body:JSON.parse(body),result:await response.clone().json()});if(f.holdCreate){const hold=f.holdCreate;f.holdCreate=null;await hold;}if(f.lostCreate&&response.ok){f.lostCreate=false;response=Response.json({error:'synthetic lost creation acknowledgement'},{status:503});}}
   }else if(path==='/material-ai-status')response=Response.json({available:false});
   else if(path==='/material-flags')response=Response.json({items:[]});
   else{
    response=await materialRecordsRoute(request,env,{uid:'u4'},{owner:'fixture-browser-owner',json:(v,status=200)=>Response.json(v,{status}),requestJson:r=>r.json(),invalidBody:()=>Response.json({error:'body'},{status:400})});
    if(path==='/material-records'&&req.method==='POST'){f.records.push({body:JSON.parse(body),result:await response.clone().json()});if(f.holdRecord){const hold=f.holdRecord;f.holdRecord=null;await hold;}if(f.lostRecord&&response.ok){f.lostRecord=false;response=Response.json({error:'synthetic lost answer acknowledgement'},{status:503});}}
   }
   res.writeHead(response.status,{'Content-Type':'application/json','Cache-Control':'private, no-store'});res.end(await response.text());return;
  }
  const name=url.pathname.slice(1);res.writeHead(200,{'Content-Type':name.endsWith('.css')?'text/css':name.endsWith('.json')?'application/json':Object.hasOwn(assets,name)?'text/javascript':'text/html;charset=utf-8'});res.end(assets[name]||html);
 }catch(e){res.writeHead(500);res.end('synthetic fixture failure');console.error(e.message);}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{
 browser=await chromium.launch({headless:true});await mkdir(new URL('./material-test-screens/',here),{recursive:true});
 for(const width of [390,820,1440]){
  const f=fixture(String(width));f.lostCreate=true;
  const page=await browser.newPage({viewport:{width,height:950}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>{if(new URL(r.request().url()).hostname==='127.0.0.1')return r.continue();outsideCalls++;return r.abort();});
  await page.goto('http://127.0.0.1:'+server.address().port+'/?fixture='+width);
  await page.getByRole('button',{name:'ドリル',exact:true}).click();await page.getByRole('button',{name:'テスト',exact:true}).click();await page.getByRole('button',{name:'5問',exact:true}).click();
  ok(f.records.length===0&&f.createCalls.length===0,'no automatic start or grading');
  await page.getByRole('button',{name:'作成する',exact:true}).click();await page.getByText('回答記録を確認できませんでした。',{exact:true}).waitFor();ok(await page.locator('form').count()===0,'unknown creation does not display an unbound test');
  await page.getByRole('button',{name:'作成する',exact:true}).click();await page.locator('form').first().waitFor();
  const roster=f.createCalls.at(-1).result;ok(f.createCalls.length===2&&f.createCalls[0].body.id===f.createCalls[1].body.id&&roster.cached,'visible creation retry recovers same roster');
  ok(await page.locator('.material-batch-question').count()===5,'selected five questions retained');
  f.lostRecord=true;await page.locator('textarea').first().fill('synthetic original wrong');await page.locator('form').first().getByRole('button',{name:'答えを確認する',exact:true}).click();await page.getByText('保存できませんでした。接続を確認して、もう一度押してください。',{exact:true}).waitFor();
  await page.locator('textarea').first().fill('synthetic edited wrong');await page.locator('form').first().getByRole('button',{name:'答えを確認する',exact:true}).click();await page.getByRole('button',{name:'答えを確認する',exact:true}).first().waitFor({state:'visible'});await page.waitForFunction(()=>!document.querySelector('form button')?.disabled);
  ok(f.records.length===3&&f.records[0].body.id===roster.slots[0].attemptId&&f.records[1].body.id===roster.slots[0].attemptId&&f.records[2].body.id!==roster.slots[0].attemptId,'edited answer recovers unknown original then saves new event');
  for(let i=1;i<5;i++){await page.locator('textarea').nth(i).fill('synthetic wrong '+i);await page.locator('form').nth(i).getByRole('button',{name:'答えを確認する',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('form button')?.disabled);}
  const data=completedTestData(await readCompletedTest({AUTH_DB:f.db},'u4',roster.id,{owner:'fixture-browser-owner'}),'u4');
  ok(data.records.length===5&&data.records.every(r=>!r.result.correct)&&data.records[0].answer==='synthetic original wrong','all five first wrong answers form actual server proof');
  ok(f.db.keys().filter(k=>k.startsWith('ai-test-session:u4:')).length===1,'lost response never creates duplicate roster');
  ok(!f.db.keys().some(k=>/^(?:plan|openai|ai-trial)[-:]/.test(k)),'test start/answer does not debit AI');
  ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow '+width);
  ok(await page.evaluate(()=>{const v=JSON.parse(recordStorage.getItem('u4:appData'));return v.totalScores.math===17&&v.history[0].note==='synthetic sentinel';}),'unrelated synthetic grades retained');
  await page.locator('.materials').evaluate(async el=>{await Promise.all(el.getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{})));});
  ok(await page.locator('.materials article').first().evaluate(el=>Number(getComputedStyle(el).opacity)>=.99),'settled visible article before screenshot');
  await page.screenshot({path:new URL('./material-test-screens/test-'+width+'.png',here).pathname,fullPage:true});
  await page.getByRole('button',{name:'出題条件へ戻る',exact:true}).click();await page.getByRole('button',{name:'作成する',exact:true}).click();await page.locator('form').first().waitFor();const second=f.createCalls.at(-1).result;ok(second.id!==roster.id&&second.slots[0].attemptId!==roster.slots[0].attemptId,'next test gets distinct first-answer slots');
  let releaseAnswer;f.holdRecord=new Promise(r=>releaseAnswer=r);const beforeAnswers=f.records.length;
  await page.locator('textarea').first().fill('synthetic delayed wrong');await page.locator('form').first().getByRole('button',{name:'答えを確認する',exact:true}).click();
  for(let i=0;i<100&&f.records.length===beforeAnswers;i++)await new Promise(r=>setTimeout(r,10));assert.equal(f.records.length,beforeAnswers+1);
  await page.evaluate(()=>NobiMaterialEntry.start());releaseAnswer();await page.getByRole('button',{name:'作成する',exact:true}).waitFor();
  await page.waitForFunction(()=>!document.querySelector('.material-create button:last-of-type')?.disabled);
  ok(await page.locator('form').count()===0&&await page.getByRole('button',{name:'作成する',exact:true}).isEnabled(),'late answer cannot overwrite same-user reload or keep it busy');
  let releaseCreate;f.holdCreate=new Promise(r=>releaseCreate=r);const beforeCreate=f.createCalls.length;
  await page.getByRole('button',{name:'作成する',exact:true}).click();for(let i=0;i<100&&f.createCalls.length===beforeCreate;i++)await new Promise(r=>setTimeout(r,10));assert.equal(f.createCalls.length,beforeCreate+1);
  await page.evaluate(()=>NobiMaterialEntry.start());releaseCreate();await page.getByRole('button',{name:'作成する',exact:true}).waitFor();
  await page.waitForFunction(()=>!document.querySelector('.material-create button:last-of-type')?.disabled);
  ok(await page.locator('form').count()===0&&await page.getByRole('button',{name:'作成する',exact:true}).isEnabled(),'late roster cannot restart study after same-user reload');
  await page.getByRole('button',{name:'検定',exact:true}).click();await page.getByRole('button',{name:'模擬検定を始める',exact:true}).click();await page.locator('form').first().waitFor();
  const qualification=f.createCalls.at(-1).result;
  ok(qualification.mode==='study'&&qualification.total===20&&JSON.stringify(qualification.slots.map(s=>s.questionId))===JSON.stringify(mock.questions.map(q=>q.id)),'mock qualification keeps complete official order, independent of five-question selector');
  ok(await page.locator('.material-batch-question').count()===20,'all twenty mock qualification questions displayed');
  await page.getByRole('button',{name:'わからない',exact:true}).first().click();await page.getByText('未正解・復習に残しました',{exact:true}).first().waitFor();
  ok(f.records.at(-1).body.id===qualification.slots[0].attemptId&&f.records.at(-1).body.mode==='study','mock qualification first wrong answer also occupies owned fixed slot');
  ok(errors.length===0,'no browser runtime errors '+width);await page.close();
 }
 ok(outsideCalls===0,'browser never reaches outside sources');
 const inputs=[];for(const file of ['site-assets/material-entry.js','site-assets/material-bridge.js','site-assets/material-ui.js','cf-worker/src/material-records.mjs','cf-worker/src/ai-test-session.mjs','cf-worker/src/ai-test-session-route.mjs'])inputs.push({file,sha256:createHash('sha256').update(await readFile(file)).digest('hex')});
 await writeFile(new URL('./material-test-browser-current-result.json',here),JSON.stringify({status:'passed',checks,inputs,scope:'Actual entry/bridge/UI with real private HTTP handlers and SQLite, public canonical five-question selection. Three widths, lost creation/answer acknowledgement, editing/recovery, initial wrong-answer proof, distinct later tests, no AI debits or real data. Screens require direct review; no paid job/vision/toast completion claim.'},null,2)+'\n');console.log('Material test browser: '+checks+' checks passed');
}finally{await browser?.close();await new Promise(r=>server.close(r));for(const f of fixtures.values())f.db.close();}
