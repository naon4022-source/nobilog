import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {chromium}=require('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const names=['material-ui.css','material-engine.js','material-ui.js','material-bridge.js','material-entry.js','material-bank.json','input-tools.js'];
const assets=Object.fromEntries(await Promise.all(names.map(async name=>[name,await readFile(new URL('../../site-assets/'+name,import.meta.url),'utf8')])));
const bank=JSON.parse(assets['material-bank.json']),unit=bank.units[0];
const html=`<meta charset="utf-8"><meta name="viewport" content="width=device-width"><link rel="stylesheet" href="/material-ui.css"><style>body{margin:0;padding:12px;font:16px sans-serif}*{box-sizing:border-box}.nobi-input-tools{display:flex;flex-wrap:wrap;gap:8px}.nobi-input-tools button{min-height:44px}.no-print{display:block}@media print{.no-print{display:none}}</style><main id="study-materials"></main><script>
var currentUserId='synthetic',token=1,serverBootReady=true,authLeaseBlocked=false,cloudState={busy:false},cloudTimer=null,dirty=false,userData={},failSave=false,holdSave=false,releaseSave=null,saveDelay=20,saves=0,serverRecord={};
const memory=new Map([['synthetic:appData',JSON.stringify({totalScores:{math:17},history:[{note:'fixture'}]})]]);
var recordStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)};
function cloudIdentity(){return {uid:currentUserId,token};}function cloudSame(w){return w.uid===currentUserId&&w.token===token;}function cloudConflict(){return false;}function cloudDirty(){return dirty;}function cloudSetDirty(v){dirty=v;}function isTrial(){return false;}
async function cloudPush(){cloudState.busy=true;if(holdSave)await new Promise(r=>releaseSave=r);await new Promise(r=>setTimeout(r,saveDelay));cloudState.busy=false;if(failSave)return false;serverRecord=JSON.parse(recordStorage.getItem(currentUserId+':appData'));dirty=false;saves++;return true;}
var attempts=new Map(),reviewFixture=null;
function cloudUrl(path){return path;}
async function cloudTry(path,options){
 if(failSave)return Response.json({error:'fixture unavailable'},{status:503});
 if(path.startsWith('/material-review'))return Response.json({items:reviewFixture?[reviewFixture]:[],next:null});
 const rows=[...attempts.values()].filter(r=>r.uid===currentUserId).reverse();
 if(path==='/material-progress'){
  const progress={};for(const row of rows){if(!row.result.correct)continue;const key=row.mode==='test'?'testDone':'done';const p=progress[row.unitId]||={done:[],testDone:[]};if(!p[key].includes(row.questionId))p[key].push(row.questionId);}return Response.json({progress});
 }
 if(options?.method==='POST'){
  const body=JSON.parse(options.body),key=currentUserId+':'+body.id;
  const bank=await(await fetch('/material-bank.json')).json(),unit=bank.units.find(u=>u.id===body.unitId),q=(body.mode==='test'?unit.tests:unit.questions).find(q=>q.id===body.questionId);
  if(!attempts.has(key))attempts.set(key,{...body,uid:currentUserId,at:Date.now(),subject:unit.subject,unitTitle:unit.title,prompt:q.prompt,expected:q.answer,explanation:q.explanation,result:NobiMaterialEngine.grade(q,body.answer)});
  return Response.json({record:attempts.get(key)});
 }
 return Response.json({items:rows.slice(0,50),next:null});
}
</script><script src="/material-engine.js"></script><script src="/material-ui.js"></script><script src="/material-bridge.js"></script><script src="/input-tools.js"></script><script src="/material-entry.js"></script><script>void NobiMaterialEntry.start();</script>`;
const server=createServer((req,res)=>{
 const name=req.url.slice(1);if(Object.hasOwn(assets,name)){res.writeHead(200,{'Content-Type':name.endsWith('.json')?'application/json':name.endsWith('.css')?'text/css':'text/javascript'});res.end(assets[name]);}
 else{res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'});res.end(html);}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
try{
 browser=await chromium.launch({headless:true});await mkdir('/tmp/nobi-material',{recursive:true});
 for(const width of [320,390,1280]){
  const page=await browser.newPage({viewport:{width,height:950},hasTouch:width<500,isMobile:width<500});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
  await page.goto('http://127.0.0.1:'+server.address().port);
  if(await page.locator('details.material-conditions:not([open])').count())await page.locator('details.material-conditions summary').click();await page.getByRole('button',{name:'ドリル',exact:true}).click();await page.getByRole('button',{name:'作成する',exact:true}).click();
  await page.getByText(unit.questions[0].prompt,{exact:true}).waitFor();
  assert.equal(await page.locator('.material-unit-progress').getAttribute('open'),null);await page.locator('.material-unit-progress summary').click();assert.equal(await page.getByRole('progressbar',{name:'問題の正解進捗',exact:true}).isVisible(),true);
  assert.equal(await page.getByRole('progressbar',{name:'問題の正解進捗',exact:true,includeHidden:true}).getAttribute('value'),'0');assert.equal(await page.getByRole('progressbar',{name:'問題の正解進捗',exact:true,includeHidden:true}).getAttribute('max'),'100');
  assert.equal(await page.getByRole('button',{name:'2年',exact:true,includeHidden:true}).isDisabled(),false);
  assert.equal(await page.getByRole('button',{name:'国語',exact:true,includeHidden:true}).isDisabled(),false);
  assert.equal(await page.getByRole('button',{name:'教科書を読む',exact:true}).isDisabled(),true);
  assert.equal(await page.getByRole('button',{name:'保健体育',exact:true}).count(),0);
  const pressAnswer=async()=>{const button=page.getByRole('button',{name:'答えを確認する',exact:true});if(width<500)await button.tap();else await button.click();};
  const input=page.locator('#material-answer');await input.fill('0');await pressAnswer();
  assert.equal(await page.evaluate(()=>saves),0);assert.equal(await input.inputValue(),'0');
  await page.evaluate(()=>holdSave=true);await input.fill('８，−３，＋１０，０');await pressAnswer();
  await page.getByRole('button',{name:'保存中…',exact:true}).waitFor({timeout:3000});assert.equal(await input.isDisabled(),true);assert.equal(await page.getByText(unit.questions[1].prompt,{exact:true}).count(),0);
  await page.waitForFunction(()=>typeof releaseSave==='function');await page.evaluate(()=>{holdSave=false;releaseSave();});await page.getByText(unit.questions[1].prompt,{exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>serverRecord.materialProgress['drill-math-1-signed'].done.length),1);
  assert.equal(await page.getByRole('progressbar',{name:'問題の正解進捗',exact:true,includeHidden:true}).getAttribute('value'),'1');assert.equal(await page.getByRole('progressbar',{name:'確認テストの正解進捗',exact:true,includeHidden:true}).getAttribute('value'),'0');
  assert.equal(await page.evaluate(()=>serverRecord.totalScores.math),17);
  await page.evaluate(()=>{failSave=true;saveDelay=20;});await input.fill('8,10');await pressAnswer();
  await page.getByText('保存できませんでした。接続を確認して、もう一度押してください。',{exact:true}).waitFor();
  assert.equal(await input.inputValue(),'8,10');assert.equal(await page.getByText(unit.questions[2].prompt,{exact:true}).count(),0);
  await page.evaluate(()=>{failSave=false;});await pressAnswer();await page.getByText(unit.questions[2].prompt,{exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>serverRecord.materialProgress['drill-math-1-signed'].done.length),2);
  assert.equal(await page.evaluate(()=>attempts.size),3,'wrong answer and both correct answers are preserved without duplicates');
  await page.getByRole('button',{name:'回答履歴',exact:true}).click();await page.getByText('自分の答え：0',{exact:true}).waitFor();
  assert.equal(await page.getByText('自分の答え：8,10',{exact:true}).count(),1);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  if(width===390)await page.screenshot({path:'/tmp/nobi-material/history-mobile.png',fullPage:true});
  await page.getByRole('button',{name:'問題へ戻る',exact:true}).click();if(await page.getByRole('button',{name:'作成する',exact:true}).isVisible())await page.getByRole('button',{name:'作成する',exact:true}).click();
  await page.getByRole('button',{name:'テスト',exact:true}).click();await page.getByRole('button',{name:'作成する',exact:true}).click();await page.getByText(unit.tests[0].prompt,{exact:true}).waitFor();
  await input.fill('3');await pressAnswer();await page.getByText(unit.tests[1].prompt,{exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>serverRecord.materialProgress['drill-math-1-signed'].testDone.length),1);
  await page.getByRole('button',{name:'問題',exact:true}).click();await page.getByRole('button',{name:'作成する',exact:true}).click();await page.getByText(unit.questions[2].prompt,{exact:true}).waitFor();
  await page.evaluate(q=>{reviewFixture={unitId:'drill-math-1-signed',subject:'数学',unitTitle:'正負の数',questionId:q.id,mode:'study',question:q,before:{answer:'0',at:Date.now()-3*86400000},firstBefore:{answer:'0',at:Date.now()-3*86400000},latestImprovement:{answer:'8,-3,10,0',at:Date.now()},reviewDay:3,dueAt:Date.now(),due:true};},unit.questions[0]);
  await page.getByRole('button',{name:'誤答の復習',exact:true}).click();await page.getByText('最初の誤答：0',{exact:true}).waitFor({state:'attached'});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  if(width===390)await page.screenshot({path:'/tmp/nobi-material/review-mobile.png',fullPage:true});
  await page.getByRole('button',{name:'この問題を復習する',exact:true}).click();await page.getByText(unit.questions[0].prompt,{exact:true}).waitFor();
  await input.fill('8,-3,10,0');await pressAnswer();await page.getByRole('heading',{name:'誤答の復習',exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>serverRecord.materialProgress['drill-math-1-signed'].done.length),2,'review preserves completed IDs without duplicate');
  await page.getByRole('button',{name:'問題へ戻る',exact:true}).click();if(await page.getByRole('button',{name:'作成する',exact:true}).isVisible())await page.getByRole('button',{name:'作成する',exact:true}).click();await page.getByText(unit.questions[2].prompt,{exact:true}).waitFor();

  await page.evaluate(()=>{reviewFixture=null;NobiMaterialEntry.stop();memory.set(currentUserId+':appData',JSON.stringify(serverRecord));void NobiMaterialEntry.start();});
  if(await page.locator('details.material-conditions:not([open])').count())await page.locator('details.material-conditions summary').click();await page.getByRole('button',{name:'ドリル',exact:true}).click();await page.getByRole('button',{name:'作成する',exact:true}).click();await page.getByText(unit.questions[2].prompt,{exact:true}).waitFor();
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.equal(await input.getAttribute('data-answer-subject'),'数学');assert.equal(await input.getAttribute('inputmode'),'decimal');
  if(width===390)await page.screenshot({path:'/tmp/nobi-material/mobile.png',fullPage:true});
  const workbook=bank.units.find(u=>u.id==='workbook-math-1-signed');
  if(await page.locator('details.material-conditions:not([open])').count())await page.locator('details.material-conditions summary').click();await page.getByRole('button',{name:'教科書',exact:true}).click();await page.getByRole('button',{name:'作成する',exact:true}).click();await page.getByText(workbook.questions[0].prompt,{exact:true}).waitFor();
  await input.fill('-5');const guide=page.locator('details.material-guide');assert.equal(await guide.getAttribute('open'),null);
  await guide.locator('summary').click();await guide.getByRole('heading',{name:'8．以上・以下は端を含み、より大きい・小さいは含まない',exact:true}).waitFor();
  assert.equal(await guide.locator('section').count(),10);assert.equal(await input.inputValue(),'-5');assert.equal(await guide.locator('p').first().evaluate(el=>getComputedStyle(el).whiteSpace),'pre-wrap');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));if(width===390)await page.screenshot({path:'/tmp/nobi-material/workbook-guide-mobile.png',fullPage:true});
  await guide.locator('summary').click();assert.equal(await input.inputValue(),'-5');
  await input.fill('0');await pressAnswer();await page.getByRole('button',{name:'答えを確認する',exact:true}).waitFor();
  assert.equal(await input.inputValue(),'0');await input.fill('-5');await pressAnswer();await page.getByText(workbook.questions[1].prompt,{exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>serverRecord.materialProgress['workbook-math-1-signed'].done.length),1);assert.equal(await page.evaluate(()=>serverRecord.materialProgress['drill-math-1-signed'].done.length),2);
  await page.getByRole('button',{name:'テスト',exact:true}).click();await page.getByRole('button',{name:'作成する',exact:true}).click();await page.getByText(workbook.tests[0].prompt,{exact:true}).waitFor();await input.fill('-2.5');await pressAnswer();await page.getByText(workbook.tests[1].prompt,{exact:true}).waitFor();
  assert.equal(await page.getByRole('progressbar',{name:'問題の正解進捗',exact:true,includeHidden:true}).getAttribute('value'),'1');assert.equal(await page.getByRole('progressbar',{name:'確認テストの正解進捗',exact:true,includeHidden:true}).getAttribute('value'),'1');
  assert.equal(await page.evaluate(()=>serverRecord.materialProgress['workbook-math-1-signed'].testDone.length),1);assert.equal(await page.evaluate(()=>serverRecord.materialProgress['drill-math-1-signed'].testDone.length),1);
  await page.getByRole('button',{name:'問題',exact:true}).click();await page.getByRole('button',{name:'作成する',exact:true}).click();await page.getByText(workbook.questions[1].prompt,{exact:true}).waitFor();
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));if(width===390)await page.screenshot({path:'/tmp/nobi-material/workbook-mobile.png',fullPage:true});
  const addition=bank.units.find(u=>u.id==='workbook-math-1-addition');if(await page.locator('details.material-conditions:not([open])').count())await page.locator('details.material-conditions summary').click();await page.getByRole('button',{name:new RegExp('^'+addition.title+'\\s*○\\d+/\\d+')}).click();await page.getByRole('button',{name:'作成する',exact:true}).click();await page.getByText(addition.questions[0].prompt,{exact:true}).waitFor();
  assert(await page.locator('.materials-source').innerText().then(t=>t.includes('6')));await input.fill('0');await pressAnswer();await page.getByRole('button',{name:'答えを確認する',exact:true}).waitFor();assert.equal(await input.inputValue(),'0');
  await input.fill('-7');await pressAnswer();await page.getByText(addition.questions[1].prompt,{exact:true}).waitFor();await page.getByRole('button',{name:'テスト',exact:true}).click();await page.getByRole('button',{name:'作成する',exact:true}).click();await page.getByText(addition.tests[0].prompt,{exact:true}).waitFor();await input.fill('-4');await pressAnswer();await page.getByText(addition.tests[1].prompt,{exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>serverRecord.materialProgress['workbook-math-1-addition'].done.length),1);assert.equal(await page.evaluate(()=>serverRecord.materialProgress['workbook-math-1-addition'].testDone.length),1);assert.equal(await page.evaluate(()=>serverRecord.materialProgress['workbook-math-1-signed'].done.length),1);
  await page.getByRole('button',{name:'問題',exact:true}).click();await page.getByRole('button',{name:'作成する',exact:true}).click();await page.getByText(addition.questions[1].prompt,{exact:true}).waitFor();await page.locator('details.material-guide summary').click();assert.equal(await page.locator('details.material-guide section').count(),6);await page.locator('details.material-guide summary').click();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));if(width===390)await page.screenshot({path:'/tmp/nobi-material/addition-mobile.png',fullPage:true});
  const subtraction=bank.units.find(u=>u.id==='workbook-math-1-subtraction');if(await page.locator('details.material-conditions:not([open])').count())await page.locator('details.material-conditions summary').click();await page.getByRole('button',{name:new RegExp('^'+subtraction.title+'\\s*○\\d+/\\d+')}).click();await page.getByRole('button',{name:'作成する',exact:true}).click();await page.getByText(subtraction.questions[0].prompt,{exact:true}).waitFor();assert((await page.locator('.materials-source').innerText()).includes('8'));
  await input.fill('1');await pressAnswer();await page.getByRole('button',{name:'答えを確認する',exact:true}).waitFor();assert.equal(await input.inputValue(),'1');await input.fill('-9');await pressAnswer();await page.getByText(subtraction.questions[1].prompt,{exact:true}).waitFor();
  await page.getByRole('button',{name:'テスト',exact:true}).click();await page.getByRole('button',{name:'作成する',exact:true}).click();await page.getByText(subtraction.tests[0].prompt,{exact:true}).waitFor();await input.fill('-13');await pressAnswer();await page.getByText(subtraction.tests[1].prompt,{exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>serverRecord.materialProgress['workbook-math-1-subtraction'].done.length),1);assert.equal(await page.evaluate(()=>serverRecord.materialProgress['workbook-math-1-subtraction'].testDone.length),1);assert.equal(await page.evaluate(()=>serverRecord.materialProgress['workbook-math-1-addition'].done.length),1);
  await page.getByRole('button',{name:'問題',exact:true}).click();await page.getByRole('button',{name:'作成する',exact:true}).click();await page.getByText(subtraction.questions[1].prompt,{exact:true}).waitFor();await page.locator('details.material-guide summary').click();assert.equal(await page.locator('details.material-guide section').count(),6);await page.locator('details.material-guide summary').click();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));if(width===390)await page.screenshot({path:'/tmp/nobi-material/subtraction-mobile.png',fullPage:true});
  await page.evaluate(()=>{reviewFixture=null;NobiMaterialEntry.stop();memory.set(currentUserId+':appData',JSON.stringify(serverRecord));void NobiMaterialEntry.start();});
  /* 国語のワークが入ったので、開きなおしたあとは数学を選んでから作る（2026-10-08） */if(await page.locator('details.material-conditions:not([open])').count())await page.locator('details.material-conditions summary').click();await page.getByRole('navigation',{name:'教科'}).getByRole('button',{name:'数学',exact:true}).click();
  await page.getByRole('button',{name:'作成する',exact:true}).click();await page.getByText(workbook.questions[1].prompt,{exact:true}).waitFor();
  await page.evaluate(()=>{NobiMaterialEntry.stop();currentUserId='other';token++;memory.set('other:appData','{}');void NobiMaterialEntry.start();});
  if(await page.locator('details.material-conditions:not([open])').count())await page.locator('details.material-conditions summary').click();await page.getByRole('button',{name:'ドリル',exact:true}).click();await page.getByRole('button',{name:'作成する',exact:true}).click();await page.getByText(unit.questions[0].prompt,{exact:true}).waitFor();
  // 問題の種類は 教科書・特訓・検定・ドリル の4つ（2026-10-06）。検定は英検タブへ、特訓は作成中の案内
  await page.evaluate(()=>{window.__switched=null;window.switchView=id=>{window.__switched=id;};});
  if(await page.locator('details.material-conditions:not([open])').count())await page.locator('details.material-conditions summary').click();
  for(const t of ['教科書','特訓','検定','ドリル'])assert.equal(await page.getByRole('button',{name:t,exact:true}).count(),1,'mode '+t);
  await page.getByRole('button',{name:'検定',exact:true}).click();await page.getByRole('button',{name:'英検タブを開く',exact:true}).click();assert.equal(await page.evaluate(()=>window.__switched),'eiken');
  assert.equal(await page.getByRole('button',{name:'作成する',exact:true}).count(),0,'no problem creation under 検定');
  if(await page.locator('details.material-conditions:not([open])').count())await page.locator('details.material-conditions summary').click();
  await page.getByRole('button',{name:'特訓',exact:true}).click();/* 国語は保留。完成した数学・英語・理科の特訓は選択可能。 */await page.getByRole('navigation',{name:'教科'}).getByRole('button',{name:'国語',exact:true}).click();const readySubjects=[...new Set(bank.units.filter(u=>u.bank==='tokkun').map(u=>u.subject+u.grade+'年'))];await page.getByText('この教科・学年の特訓は作成中です。いま解けるのは'+readySubjects.join('・')+'です。',{exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'作成する',exact:true}).count(),0,'no tokkun problems for 国語 yet');await page.getByRole('navigation',{name:'教科'}).getByRole('button',{name:'数学',exact:true}).click();await page.getByRole('button',{name:/（特訓）/}).first().waitFor();
  for(const subject of ['英語','理科']){await page.getByRole('navigation',{name:'教科'}).getByRole('button',{name:subject,exact:true}).click();await page.getByRole('button',{name:/（特訓）/}).first().waitFor();assert.equal(await page.locator('form').count(),0,'selecting '+subject+' never starts a question automatically');}
  await page.getByRole('navigation',{name:'教科'}).getByRole('button',{name:'数学',exact:true}).click();
  await page.getByRole('button',{name:'教科書',exact:true}).click();await page.getByRole('button',{name:'作成する',exact:true}).waitFor();
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.deepEqual(errors,[]);await page.close();
 }
 console.log('Material UI: 320/390/1280px, reviewed input questions, save acknowledgement/failure/retry, separate practice tests, server resume and account isolation passed');
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
