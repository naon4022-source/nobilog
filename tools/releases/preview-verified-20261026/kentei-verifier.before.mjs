// 検定タブの模擬検定（2026-10-22 Claude）：漢検4級120問・数検5/4/3級50問（1次30＋2次20）・理科検定5級20問を本番の順番で。まちがえたら正解を見て次へ。最後に合格のめやす。
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {chromium}=require('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const names=['vertical-fractions.js','material-ui.css','material-engine.js','material-ui.js','material-bridge.js','material-entry.js','material-bank.json','input-tools.js'];
const assets=Object.fromEntries(await Promise.all(names.map(async name=>[name,await readFile(new URL('../../site-assets/'+name,import.meta.url),'utf8')])));
const bank=JSON.parse(assets['material-bank.json']),engine=require('../../site-assets/material-engine.js');
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
</script><script src="/vertical-fractions.js"></script><script src="/material-engine.js"></script><script src="/material-ui.js"></script><script src="/material-bridge.js"></script><script src="/input-tools.js"></script><script src="/material-entry.js"></script><script>void NobiMaterialEntry.start();</script>`;
const server=createServer((req,res)=>{
 const name=req.url.slice(1);if(Object.hasOwn(assets,name)){res.writeHead(200,{'Content-Type':name.endsWith('.json')?'application/json':name.endsWith('.css')?'text/css':'text/javascript'});res.end(assets[name]);}
 else{res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'});res.end(html);}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
try{
 browser=await chromium.launch({headless:true});await mkdir('/tmp/nobi-material',{recursive:true});
 let checks=0;const ok=(c,m)=>{assert(c,m);checks++;};
 for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
  await page.goto('http://127.0.0.1:'+server.address().port);
  await page.getByRole('navigation',{name:'問題の種類'}).getByRole('button',{name:'検定',exact:true}).click();
  const list=page.getByRole('navigation',{name:'模擬検定'});await list.waitFor();
  const sizes={'kentei-kanken-4':120,'kentei-suken-5':50,'kentei-suken-4':50,'kentei-suken-3':50,'kentei-rika-5':20};
  for(const [id,n] of Object.entries(sizes)){const u=bank.units.find(x=>x.id===id);ok(u&&u.questions.length===n,id+' has '+n+' questions');ok(await list.getByRole('button',{name:new RegExp('^'+u.title)}).count()===1,id+' listed');}
  ok(await page.getByRole('button',{name:'英検タブを開く',exact:true}).count()===1,'Eiken link stays');
  ok(await page.getByRole('navigation',{name:'学年'}).count()===0,'no grade/subject menus in the kentei tab');
  // 数検5級：1次30問・2次20問の順に並ぶ
  const suken=bank.units.find(x=>x.id==='kentei-suken-5');
  await list.getByRole('button',{name:new RegExp('^'+suken.title)}).click();
  ok(await page.getByText('1次（計算技能） 30問・50分／2次（数理技能） 20問・60分',{exact:false}).count()>=1,'exam format shown');
  await page.getByRole('button',{name:'模擬検定を始める',exact:true}).click();await page.locator('.material-batch-question').first().waitFor();
  const heads=await page.locator('.material-batch-head').allTextContents();ok(JSON.stringify(heads)==='["【1次（計算技能）】","【2次（数理技能）】"]','sections in exam order: '+heads);
  ok(await page.locator('.material-batch-question').count()===50,'all 50 questions at once');
  const ids=await page.locator('textarea[data-material-question]').evaluateAll(es=>es.map(e=>e.getAttribute('data-material-question')));
  ok(JSON.stringify(ids)===JSON.stringify(suken.questions.map(q=>q.id)),'same order as the exam');
  ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no sideways overflow');
  // 理科検定5級を全部答える：15問正解・5問不正解 → 75%で合格のめやす
  await page.getByRole('button',{name:'出題条件へ戻る',exact:true}).first().click();
  const rika=bank.units.find(x=>x.id==='kentei-rika-5');
  await page.getByRole('navigation',{name:'模擬検定'}).getByRole('button',{name:new RegExp('^'+rika.title)}).click();
  await page.getByRole('button',{name:'模擬検定を始める',exact:true}).click();await page.locator('.material-batch-question').first().waitFor();
  const right=q=>q.answer.kind==='number'?q.answer.value:q.answer.kind==='set'?q.answer.items.map(x=>x[0]).join('、'):q.answer.accepted[0];
  for(let i=0;i<20;i++){
   const q=rika.questions[i],card=page.locator('.material-batch-question').filter({has:page.locator('textarea[data-material-question="'+q.id+'"]')});
   const value=i<15?right(q):'ちがう答え';ok(engine.grade(q,value).correct===(i<15),q.id+' fixture answer');
   await card.locator('textarea').fill(value);await card.getByRole('button',{name:'答えを確認する',exact:true}).click();
   await page.waitForFunction(id=>!document.querySelector('textarea[data-material-question="'+id+'"]'),q.id);
   if(i===15){const wrongCard=page.locator('.material-batch-question').nth(15);ok(/未正解/.test(await wrongCard.textContent())&&/正解：/.test(await wrongCard.textContent()),'a wrong answer shows the correct answer on its card and moves on');}
  }
  await page.getByRole('heading',{name:'模擬検定の結果',exact:true}).waitFor();
  const result=await page.locator('.material-exam-result').textContent();
  const per=await page.locator('.material-exam-result dd').allTextContents(),sum=per.reduce((a,t)=>a+Number(t.split(' / ')[0]),0),tot=per.reduce((a,t)=>a+Number(t.split(' / ')[1].replace(/問.*/,'')),0);
  ok(per.length===new Set(rika.questions.map(q=>q.section)).size&&sum===15&&tot===20,'result per section adds up to 15 / 20: '+per.join(','));
  ok(/合格のめやすに届きました/.test(result),'15/20 = 75% reaches the 70% line');
  ok(!/前の問題/.test(await page.locator('.materials article').last().textContent()),'the last answer message is not left under the result');
  ok(errors.length===0,'no page errors: '+errors.join(' | '));
  if(width===390)await page.screenshot({path:'/tmp/nobi-material/kentei-result.png',fullPage:true});
  await page.close();
 }
 console.log('Kentei mock exams: '+checks+' checks passed; kentei tab lists 漢検4級120・数検5/4/3級50・理科検定5級20, exam order and sections, wrong answers move on with the correct answer, pass line result; synthetic only');
}finally{await browser?.close();server.close();}
