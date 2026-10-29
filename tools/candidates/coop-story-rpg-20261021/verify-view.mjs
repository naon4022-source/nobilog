// Local synthetic view harness. No main app, real user data or grading endpoint.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
assert.equal(spawnSync('pgrep',['-f','^(/[^ ]*/)?bash .*\\.claude/verify/run.sh$']).status,1,'wait for the whole-app suite');
const require=createRequire(import.meta.url),{chromium}=require('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const files={};
for(const name of ['view.mjs','view-dom.mjs','view.css','story-catalog.json'])files['/'+name]=await readFile(new URL(name,import.meta.url),'utf8');
files['/']='<meta charset="utf-8"><meta name="viewport" content="width=device-width"><link rel="stylesheet" href="/view.css"><main></main><script type="module">import {mountCoopView} from "/view.mjs";window.mountCoopView=mountCoopView;window.story=await(await fetch("/story-catalog.json")).json();window.fixtureReady=true;</script>';
const server=createServer((req,res)=>{if(!Object.hasOwn(files,req.url)){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',req.url.endsWith('.mjs')?'text/javascript;charset=utf-8':req.url.endsWith('.css')?'text/css':req.url.endsWith('.json')?'application/json':'text/html;charset=utf-8');res.end(files[req.url]);});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const output=new URL('./view-checks/',import.meta.url);await mkdir(output,{recursive:true});
let browser,checks=0;const eq=(a,b,message)=>{assert.deepEqual(a,b,message);checks++;};
async function render(page,patch={}){await page.evaluate(patch=>{window.payload={...window.payload,...patch};window.view.render(window.payload);},patch);}
async function mount(page){await page.evaluate(()=>{
 window.view?.destroy();window.current=true;window.calls=[];window.hold=false;
 window.payload={connection:'connected',canHost:true,equipment:{body:'female',weapon:'素手',armor:'装備なし',damage:1,coins:30,owned:[{id:'bare'},{id:'none'}]},story:window.story,history:[],shop:[{id:'practiceSword',label:'練習用の剣',price:20,power:3},{id:'ironSword',label:'工房の剣',price:60,power:6}],state:{id:'synthetic_room',revision:1,stageId:'story_01',phase:'lobby',hp:80,maxHp:80,members:[{name:'旅人A',self:true,ready:true,connected:true},{name:'旅人B',self:false,ready:true,connected:true}]}};
 window.view=mountCoopView(document.querySelector('main'),{isCurrent:()=>window.current,renderPrompt:(element,question)=>{element.textContent=question.prompt;},onAction:async(action,detail)=>{window.calls.push({action,detail});if(window.hold)await new Promise(resolve=>{window.release=resolve;});return null;}});window.view.render(window.payload);
});}
try{
 browser=await chromium.launch({headless:true});
 for(const width of [320,390,820,1280]){
  const page=await browser.newPage({viewport:{width,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
  await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>window.fixtureReady);await mount(page);
  eq(await page.getByRole('button',{name:'全員で出発する',exact:true}).isEnabled(),true);
  eq(await page.evaluate(()=>window.calls.length),0,'no automatic start');
  const solo=await page.evaluate(()=>({...payload.state,members:[payload.state.members[0]]}));await render(page,{state:solo});
  eq(await page.getByRole('button',{name:'全員で出発する',exact:true}).isEnabled(),false);
  eq(await page.getByText('相方が接続すると出発できます。1人では遊べません。',{exact:true}).count(),1);
  await mount(page);await render(page,{canHost:false});eq(await page.getByRole('button',{name:'全員で出発する',exact:true}).count(),0);
  await mount(page);
  await render(page,{inviteCode:'ABCDEFGH'});eq(await page.getByText('招待コード：ABCDEFGH',{exact:true}).count(),1);
  const battle=await page.evaluate(()=>({...payload.state,phase:'battle',own:{lastSequence:4,nextAnswerSequence:1,question:null}}));await render(page,{state:battle});
  eq(await page.getByText('招待コード：ABCDEFGH',{exact:true}).count(),0,'closed-roster rooms do not advertise an unusable invite');
  await page.evaluate(()=>{window.originalTap=document.querySelector('.nobi-coop-tap');});
  const tapBox=await page.locator('.nobi-coop-tap').boundingBox();
  await page.mouse.move(tapBox.x+tapBox.width/2,tapBox.y+tapBox.height/2);await page.mouse.down();
  await render(page,{state:{...battle,revision:5,own:{...battle.own,lastSequence:5}}});
  eq(await page.evaluate(()=>originalTap===document.querySelector('.nobi-coop-tap')),true,'presence/state updates retain the physical tap target');
  await page.mouse.up();await page.waitForFunction(()=>window.calls.length===1);
  eq(await page.evaluate(()=>calls[0]),{action:'tap',detail:{roomId:'synthetic_room',sequence:6}},'pointer-up uses the latest authoritative sequence');
  await page.evaluate(()=>{window.calls=[];});await render(page,{state:battle});
  await page.getByRole('button',{name:'四角い光をタップして攻撃',exact:true}).click();
  await page.waitForFunction(()=>window.calls.length===1);eq(await page.evaluate(()=>calls[0]),{action:'tap',detail:{roomId:'synthetic_room',sequence:5}});
  await render(page,{connection:'reconnecting'});eq(await page.getByRole('button',{name:'四角い光をタップして攻撃',exact:true}).isEnabled(),false);
  const quiz={...battle,own:{...battle.own,question:{kind:'word',challengeId:'synthetic_question',prompt:'apple'}}};await render(page,{connection:'connected',state:quiz});
  eq(await page.locator('.nobi-coop-prompt').textContent(),'apple');eq((await page.locator('main').textContent()).includes('りんご'),false,'answer is never rendered');
  await page.locator('textarea').fill('途中の入力');await render(page,{state:{...quiz,revision:7}});eq(await page.locator('textarea').inputValue(),'途中の入力');
  await page.getByRole('button',{name:'装備のお店',exact:true}).click();eq(await page.getByRole('button',{name:'買う',exact:true}).nth(0).isEnabled(),true);eq(await page.getByRole('button',{name:'買う',exact:true}).nth(1).isEnabled(),false);
  eq(await page.getByText('武器の攻撃力 3・20コイン',{exact:true}).count(),1,'weapon power is a replacement value, not an additive bonus');
  eq(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.addStyleTag({content:'.nobi-coop{font-size:24px}'});eq(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:new URL(`./view-checks/shop-${width}.png`,import.meta.url).pathname,fullPage:true});
  await mount(page);
  await render(page,{state:null});await page.locator('input[name="inviteCode"]').fill('ABCDEFGH');await page.locator('input[type="checkbox"]').check();
  await page.evaluate(()=>{window.originalCode=document.querySelector('input[name="inviteCode"]');});
  await render(page,{connection:'reconnecting'});
  eq(await page.locator('input[name="inviteCode"]').inputValue(),'ABCDEFGH','join draft survives updates');
  eq(await page.locator('input[type="checkbox"]').isChecked(),true,'consent survives updates in the same form');
  eq(await page.evaluate(()=>originalCode===document.querySelector('input[name="inviteCode"]')),true);
  await mount(page);await render(page,{state:battle});await page.evaluate(()=>{window.oldBattleTap=document.querySelector('.nobi-coop-tap');});
  await render(page,{state:{...battle,phase:'cleared',clear:{selfPresentAtClear:true,companions:['旅人B']}},nextStageId:'story_02'});
  eq(await page.evaluate(()=>oldBattleTap.isConnected),false,'phase changes remove the old attack action');
  eq(await page.evaluate(()=>calls.length),0,'phase changes never dispatch a different action');
  await mount(page);
  const cleared=await page.evaluate(()=>({...payload.state,phase:'cleared',clear:{selfPresentAtClear:true,companions:['旅人B','旅人C']},members:[...payload.state.members,{name:'旅人C',self:false,ready:true,connected:true}]}));await render(page,{state:cleared});eq(await page.getByText('一緒にクリア：旅人B・旅人C',{exact:true}).count(),1);
  await page.getByRole('button',{name:'物語',exact:true}).click();
  for(const stage of JSON.parse(files['/story-catalog.json']).stages){
   await render(page,{state:{...cleared,stageId:stage.id}});
   await page.getByRole('button',{name:`${stage.number}章 ${stage.title}`,exact:true}).click();
   eq(await page.getByRole('heading',{name:`${stage.number}章 ${stage.title}`,exact:true}).count(),1);
   for(let index=0;index<stage.sections.length;index++){
    if(index)await page.getByRole('button',{name:'次の場面',exact:true}).click();
    eq(await page.getByRole('heading',{name:stage.sections[index].title,exact:true}).count(),1);
    eq(await page.locator('.nobi-coop-prose').allTextContents(),stage.sections[index].paragraphs);
    eq(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   }
  }
  await page.evaluate(()=>{window.current=false;window.view.render(window.payload);});eq(await page.locator('main').textContent(),'');
  eq(errors,[]);await page.close();
 }
 console.log(`Coop view: ${checks} checks passed across 320/390/820/1280px, host/solo/disconnect gates, server-only tap fields, private prompt, retained draft, gear budget, all 12 chapters/36 scenes with exact paragraphs, large text and owner teardown. Main integration, continuous tapping and three-client playthrough remain separate.`);
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
