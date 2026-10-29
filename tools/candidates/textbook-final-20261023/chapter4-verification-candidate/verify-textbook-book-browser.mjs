// 📚 教科書タブ（本棚・2ページ見開き）の画面検証。localhost の合成ページで、本物の textbook-book.js/css と本データを使う。外部通信なし。
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=new URL('../../site-assets/',import.meta.url);
const book=JSON.parse(await readFile(new URL('textbook-book-math1.json',base),'utf8')),shelf=JSON.parse(await readFile(new URL('textbook-books.json',base),'utf8'));
const html=`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/textbook-book.css"><style>body{margin:0;font:16px sans-serif}</style><section id="view-textbook"><h2>📚 教科書</h2><div id="textbook-app" class="tb-app"></div></section><script>var switched=null;function switchView(id){switched=id;NobiTextbook.leave();}</script><script src="/vertical-fractions.js"></script><script src="/textbook-book.js"></script>`;
const server=createServer(async(req,res)=>{const name=req.url.split('?')[0].slice(1);if(!name){res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'});res.end(html);return;}
 if(name!=='vertical-fractions.js'&&!/^(?:textbook-[a-z0-9-]+\.(?:js|css|json|svg|jpg|webp)|nobi-[a-z0-9-]+\.svg)$/.test(name)){res.writeHead(404);res.end();return;}
 try{const body=await readFile(new URL(name,base));res.writeHead(200,{'Content-Type':name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':name.endsWith('.json')?'application/json':name.endsWith('.svg')?'image/svg+xml':name.endsWith('.webp')?'image/webp':'image/jpeg'});res.end(body);}catch(_){res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url='http://127.0.0.1:'+server.address().port+'/';
let checks=0;const ok=(v,m)=>{assert(v,m);checks++;};
const out=process.argv.includes('--shots')?'/tmp/nobi-textbook-book':null;if(out)await mkdir(out,{recursive:true});
let browser,summary='';
try{
 browser=await chromium.launch({headless:true});
 for(const [width,height,label] of [[1440,900,'pc'],[1180,820,'tablet-landscape'],[820,1180,'tablet-portrait'],[390,844,'phone']]){
  const page=await browser.newPage({viewport:{width,height},hasTouch:width<500,isMobile:width<500});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
  // スマホは向きを変える検証をするので、全画面ではなく画面いっぱい表示で開く（全画面のウィンドウは大きさを変えられないため）
  if(width===390)await page.addInitScript(()=>{Element.prototype.requestFullscreen=undefined;Element.prototype.webkitRequestFullscreen=undefined;});
  await page.goto(url);ok(await page.evaluate(()=>!!globalThis.NobiFractions),'production fraction renderer loaded');
  await page.getByRole('button',{name:'全画面で教科書を開く'}).click();
  await page.locator('.tb-shelf-grid .tb-book').first().waitFor();
  const full=await page.evaluate(()=>document.fullscreenElement?.id||(NobiTextbook._state.fallback?'fallback':''));ok(full==='textbook-app'||full==='fallback','fullscreen or fallback: '+full);
  ok(await page.locator('.tb-book').count()===shelf.books.length,'all books on the shelf');
  ok(await page.locator('.tb-book:disabled').count()===shelf.books.filter(b=>b.status!=='ready').length,'preparing books cannot open');
  ok(await page.getByRole('button',{name:'のびログに戻る'}).count()===1,'shelf has a way back to のびログ');
  ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.querySelector('.tb-shelf').scrollWidth<=document.querySelector('.tb-shelf').clientWidth),'shelf has no sideways scroll');
  if(out)await page.screenshot({path:out+'/shelf-'+label+'.png'});
  await page.getByRole('button',{name:'数学 1を開く'}).click();await page.locator('.tb-spread').waitFor({timeout:120000});// 650ページを端末で組むので、PCが混んでいると30秒をこえることがある（速さではなく表示の正しさを見る検証）
  const total=await page.evaluate(()=>NobiTextbook._state.book.phys.length);ok(total>=book.pages.length,'laid out into '+total+' pages');
  const shown=async()=>page.locator('.tb-page[data-page]').evaluateAll(list=>list.map(p=>Number(p.dataset.page)));
  // 縦向き（スマホ・タブレットを縦に持つ）は1ページずつ、横向きは見開き
  const one=height>width,P=a=>JSON.stringify(one?[a]:[a,a+1]);
  ok(await page.locator('.tb-spread.tb-single').count()===(one?1:0),(one?'portrait shows one page':'landscape shows a spread')+' at '+label);
  ok(JSON.stringify(await shown())===P(2),'opens at p.2');ok((await page.locator('.tb-spread-code').textContent())===(one?'数2':'数2-3'),'spread code');ok((await page.locator('.tb-page-info').textContent())===(one?'p.2':'p.2–3')+' / '+total,'page info');
  await page.getByRole('button',{name:'次のページ'}).click();ok(JSON.stringify(await shown())===P(one?3:4),'next page');
  await page.keyboard.press('ArrowRight');ok(JSON.stringify(await shown())===P(one?4:6),'arrow key');
  const box=await page.locator('.tb-stage').boundingBox();
  await page.mouse.move(box.x+box.width*0.7,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width*0.2,box.y+box.height/2,{steps:5});await page.mouse.up();
  {const now=await shown();ok(JSON.stringify(now)===P(one?5:8),'swipe left turns forward: '+JSON.stringify(now));}
  for(let i=0;i<4;i++)await page.getByRole('button',{name:'前のページ'}).click();
  ok(JSON.stringify(await shown())==='[1]'&&await page.locator('.tb-page.tb-blank').count()===(one?0:1)&&await page.locator('.tb-kind-cover').count()===1,'cover alone');
  ok(await page.getByRole('button',{name:'前のページ'}).isDisabled(),'no page before the cover');
  await page.getByRole('button',{name:'次のページ'}).click();
  // もくじから飛ぶ（組み上がったページ番号）
  const sec=book.toc[0].sections[1],target=await page.evaluate(n=>NobiTextbook._state.book.map[n],sec.page);
  await page.getByRole('button',{name:sec.title+'へ'}).click();ok((await shown()).includes(target),'toc jump to '+target);
  ok(await page.locator('.tb-page[data-page="'+target+'"] .tb-head .tb-sec').textContent()===sec.title.split(' ')[0],'jumped page belongs to that section');
  // もくじボタン・コードで移動
  await page.getByRole('button',{name:'もくじへ戻る'}).click();ok(JSON.stringify(await shown())===P(2),'もくじ button');
  if(width>900){
   await page.getByLabel('コードでページへ移動').fill('数12-13');await page.getByRole('button',{name:'コードで移動'}).click();ok((await shown()).includes(12),'jump by spread code');
   const qcode=await page.evaluate(()=>{const b=NobiTextbook._state.book.phys.find(d=>(d.blocks||[]).some(x=>x.code));return b.blocks.find(x=>x.code).code;});
   await page.getByLabel('コードでページへ移動').fill(qcode);await page.getByRole('button',{name:'コードで移動'}).click();
   ok(await page.locator('.tb-highlight[data-code="'+qcode+'"]').count()===1,'jump by question code highlights '+qcode);
   await page.getByLabel('コードでページへ移動').fill('ab');await page.getByRole('button',{name:'コードで移動'}).click();ok(/コードの形/.test(await page.locator('.tb-page-info').textContent()),'bad code message');
   await page.getByRole('button',{name:'もくじへ戻る'}).click();
  }
  // 答えの札：開いてもページは伸びず、閉じられる
  const answer=page.locator('.tb-answer-btn').first();
  if(await answer.count()){await answer.click();ok(await page.getByRole('dialog').count()===1,'answer opens as a card');await page.keyboard.press('Escape');ok(await page.getByRole('dialog').count()===0,'card closes');}
  await page.evaluate(()=>document.getAnimations().forEach(a=>{try{a.finish();}catch(_){}}));
  const fit=await page.evaluate(()=>{const r=document.querySelector('.tb-spread-wrap').getBoundingClientRect(),s=document.querySelector('.tb-stage').getBoundingClientRect();return r.left>=s.left-1&&r.right<=s.right+1&&r.top>=s.top-1&&r.bottom<=s.bottom+1&&document.documentElement.scrollWidth<=innerWidth;});ok(fit,'spread fits at '+label);
  if(out){await page.waitForTimeout(300);await page.screenshot({path:out+'/spread-'+label+'.png'});}
  if(width===390){
   // 向きを変える：同じページを保ったまま 1ページ ⇄ 見開き に切りかわり、はみ出さない
   for(let i=0;i<5;i++)await page.getByRole('button',{name:'次のページ'}).click();
   const before=(await shown())[0];
   await page.setViewportSize({width:844,height:390});await page.waitForTimeout(200);
   ok(await page.locator('.tb-spread.tb-single').count()===0&&(await shown()).includes(before)&&(await shown()).length===2,'landscape phone turns into a spread keeping p.'+before);
   ok(await page.evaluate(()=>{const r=document.querySelector('.tb-spread-wrap').getBoundingClientRect(),s=document.querySelector('.tb-stage').getBoundingClientRect();return r.left>=s.left-1&&r.right<=s.right+1&&r.top>=s.top-1&&r.bottom<=s.bottom+1&&document.documentElement.scrollWidth<=innerWidth;}),'landscape phone spread fits');
   if(out)await page.screenshot({path:out+'/spread-phone-landscape.png'});
   await page.setViewportSize({width:390,height:844});await page.waitForTimeout(200);
   ok(await page.locator('.tb-spread.tb-single').count()===1&&JSON.stringify(await shown())===JSON.stringify([before]),'back to portrait shows p.'+before+' alone');
   const big=await page.evaluate(()=>{const p=document.querySelector('.tb-page[data-page]');return p.getBoundingClientRect().width/p.offsetWidth;});ok(big>0.6,'portrait page is shown at '+big.toFixed(2)+'x (not a tiny spread)');
  }
  if(width===1440){
   // 全ページ：はみ出しなし・スクロールなし・文字は15px・目印が残らない。見開きごとの画像の数も数える
   let noImage=[],forced=[];
   const spreadsCount=Math.floor(total/2)+1;
   for(let i=1;i<spreadsCount;i++){
    const r=await page.evaluate(i=>{NobiTextbook._state.spread=i;return true;},i);
    await page.getByRole('button',{name:'前のページ'}).click();await page.getByRole('button',{name:'次のページ'}).click();
    await page.evaluate(()=>document.getAnimations().forEach(a=>{try{a.finish();}catch(_){}}));
    const info=await page.locator('.tb-page[data-page]').evaluateAll(list=>list.map(p=>{const b=p.querySelector('.tb-body');const codes=[...p.querySelectorAll('[data-code]')].map(x=>x.dataset.code);return {codes,qs:p.querySelectorAll('.tb-q,.tb-h3-ex').length,n:Number(p.dataset.page),over:b?b.scrollHeight>b.clientHeight+1:false,blocks:b?b.children.length:0,height:b?b.clientHeight:0,scrollHeight:b?b.scrollHeight:0,children:b?[...b.children].map(c=>({tag:c.tagName,cls:c.className,top:c.offsetTop,height:c.offsetHeight,text:c.textContent.slice(0,80)})):[],font:b?getComputedStyle(b).fontSize:'',scroll:b?getComputedStyle(b).overflowY:'',img:p.querySelectorAll('img,video,.tb-media,.tb-fig').length,mark:p.textContent.includes('⟦'),cover:p.classList.contains('tb-kind-cover')};}));
    for(const x of info){if(x.cover)continue;ok(x.codes.length===x.qs&&x.codes.every((c,j)=>c===x.n+'-'+String.fromCharCode(65+j)),'page '+x.n+' question codes '+x.codes.join(','));ok(!x.mark,'page '+x.n+' has no raw page marker');ok(x.font==='15px','page '+x.n+' keeps 15px text');ok(x.scroll!=='auto'&&x.scroll!=='scroll','page '+x.n+' does not scroll');if(x.over){ok(x.blocks===1||x.blocks===2,'page '+x.n+' overflows only with a single unsplittable block '+JSON.stringify(x));forced.push(x.n);}}
    if(!info.some(x=>x.img>0))noImage.push(info.map(x=>x.n).join('-'));
   }
   const parts=await page.evaluate(()=>({goal:document.querySelectorAll('.tb-measure').length}));
   summary=`${total} pages, ${spreadsCount-1} spreads, spreads without any picture or picture frame: ${noImage.length}, oversized single blocks: ${forced.length}`;
   console.log('  '+summary);
   console.log('  pictureless spreads: '+(noImage.length?noImage.join(', '):'none'));
  }
  // のびログに戻る
  await page.getByRole('button',{name:'のびログに戻る'}).click();
  ok(await page.evaluate(()=>switched)==='study'&&await page.getByRole('button',{name:'全画面で教科書を開く'}).count()===1,'のびログに戻る leaves fullscreen and opens study');
  ok(errors.length===0,'no page errors: '+errors.join(' / '));
  await page.close();
 }
 {const page=await browser.newPage({viewport:{width:390,height:844}});await page.addInitScript(()=>{Element.prototype.requestFullscreen=undefined;Element.prototype.webkitRequestFullscreen=undefined;});
  await page.goto(url);ok(await page.evaluate(()=>!!globalThis.NobiFractions),'production fraction renderer loaded');await page.getByRole('button',{name:'全画面で教科書を開く'}).click();await page.locator('.tb-shelf-grid').waitFor();
  ok(await page.locator('#textbook-app.tb-fallback').count()===1,'fallback full-viewport mode');
  const r=await page.locator('#textbook-app').boundingBox();ok(r.width===390&&r.height===844,'fallback covers the screen');
  await page.getByRole('button',{name:'全画面を終わる'}).click();ok(await page.locator('#textbook-app.tb-fallback').count()===0,'fallback closes');await page.close();}
 const src=await readFile(new URL('textbook-book.js',base),'utf8');ok(!/innerHTML|insertAdjacentHTML|outerHTML|document\.write/.test(src),'no HTML injection APIs');
 console.log('Textbook book: '+checks+' checks — fullscreen gate, back to のびログ, shelf ('+shelf.books.length+' books, preparing locked), opens at p.2-3, ＜＞/keys/swipe, cover alone, toc jump to laid-out pages, answer cards, no in-page scrolling, fallback, 4 viewports; '+summary);
}finally{await browser?.close();server.close();}
