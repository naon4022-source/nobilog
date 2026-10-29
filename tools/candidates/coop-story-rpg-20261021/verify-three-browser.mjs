import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {startBrowserFixture} from './browser-fixture.mjs';
assert.equal(spawnSync('pgrep',['-f','^(/[^ ]*/)?bash .*\\.claude/verify/run.sh$']).status,1,'no whole-suite overlap');
const {chromium}=createRequire(import.meta.url)('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fixture=await startBrowserFixture(),pages=[],contexts=[],errors=[];let browser;
const images=new URL('./three-browser-images/',import.meta.url);await fs.mkdir(images,{recursive:true});
async function state(page){return page.evaluate(()=>window.game.state());}
async function waitPhase(page,phase){await page.waitForFunction(phase=>window.game.state().state?.phase===phase,phase,{timeout:15000});}
async function approvals(page,count){await page.waitForFunction(count=>[...document.querySelectorAll('button')].filter(b=>b.textContent==='参加を承認').length===count,count,{timeout:15000});}
async function join(page,code){await page.getByLabel('招待コード',{exact:true}).fill(code);await page.getByRole('checkbox').check();await page.getByRole('button',{name:'招待コードで参加を申し込む',exact:true}).click();}
try{
 browser=await chromium.launch({headless:true,args:['--disable-background-timer-throttling','--disable-renderer-backgrounding']});
 for(const [index,slot] of ['a','b','c'].entries()){
  const context=await browser.newContext({viewport:{width:[390,820,1280][index],height:1000}});contexts.push(context);const page=await context.newPage();pages.push(page);
  page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>new URL(r.request().url()).origin===fixture.origin?r.continue():r.abort());
  await page.goto(fixture.origin+'/fixture/'+slot);await page.waitForFunction(()=>window.fixtureReady);
  await page.getByRole('button',{name:index===1?'女性の体で始める':'男性の体で始める',exact:true}).click();
 }
 const [host,peer,third]=pages;await host.getByRole('button',{name:'仲間を招待する部屋を作る',exact:true}).click();
 await host.waitForFunction(()=>window.game.state().state?.id);const firstCode=(await state(host)).inviteCode;
 await host.reload();await host.waitForFunction(()=>window.fixtureReady);
 await host.getByRole('button',{name:'招待コードを作り直す',exact:true}).click();
 await host.waitForFunction(first=>window.game.state().inviteCode&&window.game.state().inviteCode!==first,firstCode);
 const code=(await state(host)).inviteCode;
 await join(peer,code);await join(third,code);
 await approvals(host,2);
 await host.getByRole('button',{name:'参加を承認',exact:true}).first().click();await approvals(host,1);await host.getByRole('button',{name:'参加を承認',exact:true}).first().click();
 for(const page of pages){await page.waitForFunction(()=>window.game.state().state?.members.length===3&&window.game.state().state.members.every(m=>m.connected),null,{timeout:15000});await page.getByRole('button',{name:'準備できた',exact:true}).click();}
 assert.equal((await state(host)).canHost,true);assert.equal((await state(peer)).canHost,false);
 await host.getByRole('button',{name:'全員で出発する',exact:true}).click();await waitPhase(host,'countdown');assert.equal(await host.getByRole('button',{name:'四角い光をタップして攻撃',exact:true}).count(),0);
 for(const page of pages)await waitPhase(page,'battle');
 console.log('Three-browser: three distinct contexts completed consent/approval/ready and server countdown via real route + SQLite + native DO streams.');
 const resumedRoom=(await state(peer)).state.id;
 await peer.evaluate(async()=>{window.authLeaseBlocked=true;window.game.hide();await window.game.show();});
 assert.equal(await peer.locator('main').evaluate(el=>el.childElementCount>0),true,'a temporary main-app lease check does not destroy the room');
 await peer.evaluate(async()=>{window.authLeaseBlocked=false;await window.game.show();});await waitPhase(peer,'battle');
 await peer.evaluate(()=>sessionStorage.removeItem('nobi-coop-room:browser_fixture_b'));
 await peer.reload();await peer.waitForFunction(()=>window.fixtureReady);await waitPhase(peer,'battle');
 assert.equal((await state(peer)).state.id,resumedRoom,'hard reload reauthorizes the saved room hint');
 assert.equal((await state(peer)).state.hp,160,'reload neither starts another battle nor deals damage');
 console.log('Three-browser: hard reload recovered the same server-authorized room with unchanged health even after its fixture-only local room hint was removed.');
 for(const page of [peer,third])await page.evaluate(()=>{window.game.hide();document.querySelector('main').style.display='none';});
 await waitPhase(host,'paused');assert.equal((await state(host)).state.hp,160);assert.equal(await host.getByRole('button',{name:'四角い光をタップして攻撃',exact:true}).count(),0);
 await peer.evaluate(async()=>{document.querySelector('main').style.display='';await window.game.show();});await waitPhase(host,'battle');
 await third.evaluate(async()=>{document.querySelector('main').style.display='';await window.game.show();});
 await host.waitForFunction(()=>window.game.state().state.members.every(m=>m.connected));
 console.log('Three-browser: hiding two members paused solo play; reconnecting one resumed two-player play; third rejoined without clearing progress.');
 const players=await Promise.allSettled(pages.map(async(page,index)=>{
  for(let step=0;step<240;step++){
   const current=await state(page);if(current.state.phase==='cleared')return;
   if(current.state.phase==='battle'&&current.state.own?.question){
    const input=page.locator('textarea');
    if(await input.evaluateAll(nodes=>nodes.length===1&&!nodes[0].disabled)){
     try{await input.fill('りんご',{timeout:1500});await page.getByRole('button',{name:'答えを確かめる',exact:true}).click({timeout:1500});}
     catch(error){const latest=await state(page);if(latest.state.phase==='battle'&&latest.state.own?.question?.challengeId===current.state.own.question.challengeId&&latest.state.members.filter(m=>m.connected).length>=2&&latest.connection==='connected')throw error;}
    }
   }
   else if(current.state.phase==='battle'){
    const tap=page.getByRole('button',{name:'四角い光をタップして攻撃',exact:true});
    if(await tap.evaluateAll(nodes=>nodes.length===1&&!nodes[0].disabled)){
     try{await tap.click({timeout:1500});}catch(error){const latest=await state(page);if(latest.state.phase==='battle'&&!latest.state.own?.question&&latest.connection==='connected')throw error;}
    }
   }
   await page.waitForTimeout(75);
  }
  throw Error('Synthetic player '+index+' did not clear within the bounded loop');
 }));
 for(const result of players)if(result.status==='rejected')throw result.reason;
 for(const [i,page] of pages.entries()){
  await page.waitForFunction(()=>window.game.state().history.length===1&&window.game.state().equipment.coins===30,null,{timeout:10000});
  const result=await state(page);assert.equal(result.state.hp,0);assert.equal(result.history[0].companions.length,2);assert.equal(result.state.clear.selfPresentAtClear,true);assert.equal(JSON.stringify(result).includes('fixture_owner_'),false);assert.equal(JSON.stringify(result).includes('browser_fixture_'),false);
  await page.screenshot({path:new URL('clear-'+i+'.png',images).pathname,fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 }
 assert.equal(fixture.stats.tapDrops,1);const hostTaps=fixture.stats.tapWrites.filter(x=>x.slot==='a');assert.deepEqual(hostTaps[0],hostTaps[1]);
 assert.equal(fixture.db.keys().filter(k=>k.startsWith('coop-story-clear:')).length,3);assert.equal(fixture.db.keys().filter(k=>k.startsWith('material-attempt:')).length,0);
 console.log('Three-browser: all three cleared, received exactly one 30-coin award and two named companions; one real post-commit network loss replayed the same tap sequence.');
 await host.getByRole('button',{name:'装備のお店',exact:true}).click();const sword=host.locator('.nobi-coop-shop-item').filter({hasText:'練習用の剣'});await sword.getByRole('button',{name:'買う',exact:true}).click();
 await host.waitForFunction(()=>window.game.state().retryPending===true);await host.getByRole('button',{name:'同じ操作を再送する',exact:true}).click();
 await host.waitForFunction(()=>!window.game.state().retryPending&&window.game.state().equipment.coins===10);
 assert.equal(fixture.stats.purchaseDrops,2);assert.equal(fixture.stats.purchaseWrites.length,3);assert.equal(new Set(fixture.stats.purchaseWrites.map(x=>x.operationId)).size,1);
 await sword.getByRole('button',{name:'装備する',exact:true}).click();await host.waitForFunction(()=>window.game.state().equipment.damage===3);await host.screenshot({path:new URL('equipped-host.png',images).pathname,fullPage:true});
 await host.getByRole('button',{name:'冒険',exact:true}).click();await host.getByRole('button',{name:'次のステージの部屋を作る',exact:true}).click();await host.waitForFunction(()=>window.game.state().state?.stageId==='story_02');
 const nextCode=(await state(host)).inviteCode;await join(peer,nextCode);await join(third,nextCode);
 await approvals(host,2);
 await host.getByRole('button',{name:'参加を承認',exact:true}).first().click();await approvals(host,1);await host.getByRole('button',{name:'参加を承認',exact:true}).first().click();
 for(const page of pages)await page.waitForFunction(()=>window.game.state().state?.stageId==='story_02'&&window.game.state().state.members.length===3,null,{timeout:15000});
 assert.equal((await state(peer)).inviteCode,null);assert.equal((await state(host)).history.length,1);
 await peer.getByRole('button',{name:'部屋から抜ける',exact:true}).click();await peer.waitForFunction(()=>window.game.state().state===null);
 await host.waitForFunction(()=>window.game.state().state?.members.length===2);
 await join(peer,nextCode);await approvals(host,1);await host.getByRole('button',{name:'参加を承認',exact:true}).click();
 await peer.waitForFunction(()=>window.game.state().state?.members.length===3);
 fixture.revoke('c');await third.waitForFunction(()=>document.querySelector('main').childElementCount===0,null,{timeout:10000});
 await host.getByRole('button',{name:'この部屋を閉じる',exact:true}).click();
 for(const page of [host,peer])await page.waitForFunction(()=>window.game.state().state===null,null,{timeout:10000});
 assert.equal((await state(host)).history.length,1,'closing the next lobby preserves the prior clear');
 assert.equal(fixture.stats.outbound(),0);assert.deepEqual(errors,[]);assert.deepEqual(fixture.stats.errors,[]);
 console.log(JSON.stringify({status:'passed',contexts:3,viewports:[390,820,1280],tapResponseLoss:fixture.stats.tapDrops,purchaseResponseLoss:fixture.stats.purchaseDrops,ordinaryAttempts:0,outbound:fixture.stats.outbound()}));
 console.log('Three-browser: stable purchase retry, equipment power, next-stage regroup and remote-owner revocation passed; production auth, room discovery after hard reload, main menu and non-English integrated quiz cases remain separate.');
}finally{
 if(pages[0])await pages[0].screenshot({path:new URL('last-host.png',images).pathname,fullPage:true}).catch(()=>{});
 await Promise.allSettled(contexts.map(c=>c.close()));await browser?.close();await fixture.close();
}
