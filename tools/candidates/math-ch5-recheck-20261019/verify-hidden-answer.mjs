// Real local book UI: hidden before opening, revealed only in the matching answer, hidden again on close.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const layoutTop=process.argv.includes('--layout-top');
const root=new URL('../../../',import.meta.url),here=new URL(layoutTop?'layout-candidate/top/visibility/':process.argv.includes('--integrated')?'answer-integrated-visibility/':'answer-visibility/',import.meta.url),assets=new URL('site-assets/',root);
const cases=[{pid:'M1-P226',q:'**確認4-1**　75° の角を作図する方法を、作図できる角を組み合わせて説明しなさい。',row:'75° を「90°−15°」と考えて、15° を目分量でとる',answer:'例：60°＋15°＝75°。'}];
const integrated=process.argv.includes('--integrated'),image='/textbook-book-math1-m1-c5-s2-d03.svg';
const html='<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/textbook-book.css"><style>body{margin:0;font:16px sans-serif}</style><div id="textbook-app" class="tb-app"></div><script src="/textbook-book.js"></script>';
const server=createServer(async(req,res)=>{const name=new URL(req.url,'http://local').pathname.slice(1);if(!name){res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'}).end(html);return;}
 if(!/^textbook-[a-z0-9-]+\.(?:js|css|json|svg|jpg|png|mp4)$/.test(name)){res.writeHead(404).end();return;}
 try{const candidate=new URL((layoutTop?'layout-candidate/top/':'answer-candidate/')+name,import.meta.url);const chosen=!integrated&&(name==='textbook-book-math1.json'||layoutTop&&name==='textbook-book-math1-m1-c5-s2-apply.jpg')?candidate:new URL(name,assets);const bytes=await readFile(chosen);res.writeHead(200,{'Content-Type':name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':name.endsWith('.json')?'application/json':name.endsWith('.svg')?'image/svg+xml':name.endsWith('.mp4')?'video/mp4':'image/jpeg'}).end(bytes);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
let browser,checks=0;const layouts=[];const ok=(v,m)=>{assert.ok(v,m);checks++;};
try{
 await mkdir(new URL('screens/',here),{recursive:true});browser=await chromium.launch({headless:true});
 for(const [width,height,large]of [[390,844,false],[820,1180,false],[1180,820,false],[1440,900,false],[390,844,true],[1440,900,true]]){
  const page=await browser.newPage({viewport:{width,height},serviceWorkers:'block'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
  await page.addInitScript(()=>{Element.prototype.requestFullscreen=undefined;Element.prototype.webkitRequestFullscreen=undefined;});
  await page.goto(origin);if(large)await page.evaluate(()=>document.body.classList.add('large-text'));
  await page.getByRole('button',{name:'全画面で教科書を開く'}).click();await page.getByRole('button',{name:'数学 1を開く'}).click();await page.locator('.tb-spread').waitFor({timeout:180000});
  for(const c of cases){
   const targets=await page.evaluate(q=>NobiTextbook._state.book.phys.flatMap(p=>(p.blocks||[]).filter(b=>b.t==='p'&&b.x===q).map(b=>({page:p.n,code:b.code}))),c.q);
   ok(targets.length===1&&targets[0].code,c.pid+' unique current question code');const target=targets[0];
   await page.evaluate(n=>{const s=NobiTextbook._state,index=s.single?n-1:Math.floor(n/2);s.spread=index-1;},target.page);
   await page.getByRole('button',{name:'次のページ'}).click();await page.evaluate(()=>document.getAnimations().forEach(a=>{try{a.finish();}catch{}}));
   const spread=page.locator('.tb-spread'),question=spread.locator('[data-code="'+target.code+'"]');await question.waitFor();
   ok(await spread.locator('td',{hasText:c.row}).count()===0,c.pid+' answer row absent from visible spread');
   if(!large&&(width===390||width===1440))await page.screenshot({path:new URL('screens/'+width+'-'+c.pid+'-closed.png',here).pathname,animations:'disabled'});
   ok(await spread.locator('img[src="'+image+'"]').count()===0,'answer image absent from closed spread');await question.locator('xpath=following-sibling::*[2]').click();const sheet=page.locator('.tb-sheet');await sheet.waitFor();
   ok(await sheet.locator('td',{hasText:c.row}).count()===1,c.pid+' original row occurs once in its own explanation');
   ok((await sheet.innerText()).includes(c.answer),c.pid+' original answer retained');const figure=sheet.locator('img[src="'+image+'"]');ok(await figure.count()===1,'existing image occurs once in its own answer');await figure.waitFor();await page.waitForFunction(src=>{const im=document.querySelector('.tb-sheet img[src="'+src+'"]');return im&&im.complete&&im.naturalWidth>0;},image);ok(await page.evaluate(async src=>{const doc=new DOMParser().parseFromString(await (await fetch(src)).text(),'image/svg+xml');return doc.documentElement.getAttribute('viewBox')==='0 0 1600 900';},image),'decoded answer SVG retains exact source viewBox');
   ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),c.pid+' no horizontal root overflow');
   const fit=await sheet.evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=-1&&r.right<=innerWidth+1&&r.top>=-1&&r.bottom<=innerHeight+1;});
   ok(fit,c.pid+' answer dialog fits viewport');
   if(!large&&(width===390||width===1440))await page.screenshot({path:new URL('screens/'+width+'-'+c.pid+'-open.png',here).pathname,animations:'disabled'});
   await page.getByRole('button',{name:'閉じる',exact:true}).click();await sheet.waitFor({state:'detached'});
   ok(await spread.locator('td',{hasText:c.row}).count()===0,c.pid+' answer row hidden again on close');
   ok(await spread.locator('img[src="'+image+'"]').count()===0,'image hidden again after close');layouts.push({width,height,large,pid:c.pid,...target});
  }
  const map=await page.evaluate(()=>{const b=NobiTextbook._state.book,codes=b.phys.flatMap(p=>(p.blocks||[]).filter(x=>x.code).map(x=>x.code)),dest=b.toc.flatMap(c=>[c.page,...(c.sections||[]).map(s=>s.page)]).filter(Boolean);return {pages:b.phys.length,codes:codes.length,unique:new Set(codes).size,tocMapped:dest.every(n=>Number.isInteger(b.map[n])&&b.map[n]>=1&&b.map[n]<=b.phys.length)};});
  ok(map.codes===map.unique&&map.tocMapped,'all question codes unique and TOC destinations resolve');ok(errors.length===0,'no page error: '+errors.join('|'));
  layouts.push({width,height,large,...map});console.log(width+(large?' large':'')+': row and image hidden/open/close, original answers and navigation passed');await page.close();
 }
 await writeFile(new URL('browser-result.json',here),JSON.stringify({passed:true,checks,layouts,realUserData:false,externalRequests:0},null,2)+'\n');
 console.log('Chapter5 hidden answer:',checks,'checks passed at four widths and two large-text widths; real book code and local教材 only');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
