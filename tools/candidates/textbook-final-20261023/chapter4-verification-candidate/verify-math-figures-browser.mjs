// 📐 数学の教科書：章ごとの図・絵の表示点検（Claude・2026-10-10）。本物の textbook-book.js/css と本データを
// localhost の合成ページで開く。外部通信なし・実データなし。使い方：node verify-math-figures-browser.mjs [章の番号=1 または appendix]
// 4つの画面幅で、その章の画像があるページを全部開き、読み込み・ページからのはみ出し・ほかの部品との重なり・
// 図のそばに説明の文があるか・押すと拡大できるか・図の中の文字の大きさを確かめる。
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const CH=process.argv[2]==='appendix'?'巻末':String(Number(process.argv[2]||1));
const base=new URL('../../site-assets/',import.meta.url);
const html=`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/textbook-book.css"><style>body{margin:0;font:16px sans-serif}</style><section id="view-textbook"><h2>📚 教科書</h2><div id="textbook-app" class="tb-app"></div></section><script>var switched=null;function switchView(id){switched=id;NobiTextbook.leave();}</script><script src="/vertical-fractions.js"></script><script src="/textbook-book.js"></script>`;
const server=createServer(async(req,res)=>{const name=req.url.split('?')[0].slice(1);if(!name){res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'});res.end(html);return;}
 if(name!=='vertical-fractions.js'&&!/^(?:textbook-[a-z0-9-]+\.(?:js|css|json|svg|jpg|webp)|nobi-[a-z0-9-]+\.svg)$/.test(name)){res.writeHead(404);res.end();return;}
 try{const body=await readFile(new URL(name,base));res.writeHead(200,{'Content-Type':name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':name.endsWith('.json')?'application/json':name.endsWith('.svg')?'image/svg+xml':name.endsWith('.webp')?'image/webp':'image/jpeg'});res.end(body);}catch(_){res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url='http://127.0.0.1:'+server.address().port+'/';
let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++;};
const report=[];let browser;
try{
 browser=await chromium.launch({headless:true});
 for(const [width,height,label] of [[1440,900,'PC'],[1180,820,'タブレット横'],[820,1180,'タブレット縦'],[390,844,'スマホ']]){
  const page=await browser.newPage({viewport:{width,height},hasTouch:width<500,isMobile:width<500});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
  if(width===390)await page.addInitScript(()=>{Element.prototype.requestFullscreen=undefined;Element.prototype.webkitRequestFullscreen=undefined;});
  await page.goto(url);ok(await page.evaluate(()=>!!globalThis.NobiFractions),'production fraction renderer loaded');await page.getByRole('button',{name:'全画面で教科書を開く'}).click();
  await page.getByRole('button',{name:'数学 1を開く'}).click();await page.locator('.tb-spread').waitFor({timeout:180000});
  const targets=await page.evaluate(ch=>NobiTextbook._state.book.phys.map((p,i)=>({n:i+1,ch:String(p.chapter||''),imgs:(p.blocks||[]).filter(b=>b&&(b.t==='fig'||b.t==='media')&&typeof b.src==='string'&&/\.(svg|jpg|png)$/.test(b.src)).length,wait:(p.blocks||[]).filter(b=>b&&(b.t==='fig'||b.t==='media')&&!b.src).length})).filter(x=>ch==='巻末'?x.ch==='巻末':x.ch.startsWith(ch+'章')),CH);
  const withImg=targets.filter(x=>x.imgs>0);ok(withImg.length>0,'chapter '+CH+' has pages with pictures @'+label);
  const single=height>width;let minFont=99,minZoomFont=99,checkedImgs=0;const problems=[];
  for(const t of withImg){
   const idx=single?t.n-1:Math.floor(t.n/2);
   await page.evaluate(i=>{NobiTextbook._state.spread=i;},idx);
   await page.getByRole('button',{name:'前のページ'}).click();await page.getByRole('button',{name:'次のページ'}).click();
   await page.evaluate(()=>document.getAnimations().forEach(a=>{try{a.finish();}catch(_){}}));
   const sel='.tb-page[data-page="'+t.n+'"]';await page.locator(sel).waitFor();
   await page.waitForFunction(s=>[...document.querySelectorAll(s+' img')].every(i=>i.complete),sel,{timeout:20000});
   const info=await page.evaluate(s=>{const p=document.querySelector(s),b=p.querySelector('.tb-body'),br=b.getBoundingClientRect(),kids=[...b.children];
    const imgs=[...p.querySelectorAll('figure img')].map(img=>{const r=img.getBoundingClientRect(),fig=img.closest('figure')||img,fr=fig.getBoundingClientRect();
     const overlap=kids.filter(k=>k!==fig&&!k.contains(fig)).some(k=>{const q=k.getBoundingClientRect();return Math.min(q.bottom,fr.bottom)-Math.max(q.top,fr.top)>1&&Math.min(q.right,fr.right)-Math.max(q.left,fr.left)>1;});
     const svg=/\.svg$/.test(img.src);return {src:img.src.split('/').pop(),loaded:img.complete&&img.naturalWidth>0,inside:r.left>=br.left-1&&r.right<=br.right+1&&r.top>=br.top-1&&r.bottom<=br.bottom+1,overlap,w:r.width,h:r.height,svg,zoomable:img.classList.contains('tb-zoomable'),cut:(()=>{if(!img.naturalWidth)return true;const box=r.width/r.height,nat=img.naturalWidth/img.naturalHeight,fit=getComputedStyle(img).objectFit;if(fit==='contain'||Math.abs(box-nat)<=0.02)return false;if(fit!=='cover')return true;return Math.min(box/nat,nat/box)<0.6;})()};});// 章のとびらは枠いっぱいの切り抜き（cover）。6割以上が見えていればよい
    const text=kids.filter(k=>!k.matches('figure')&&k.textContent.trim().length>=12).length;
    return {imgs,text,over:b.scrollHeight>b.clientHeight+1,blocks:kids.length,pageInView:(()=>{const r=p.getBoundingClientRect();return r.left>=-1&&r.right<=innerWidth+1;})()};},sel);
   for(const im of info.imgs){
    checkedImgs++;const tag='p.'+t.n+' '+im.src+' @'+label;
    ok(im.loaded,'loaded '+tag);ok(im.inside,'inside the page '+tag);ok(!im.overlap,'no overlap '+tag);ok(!im.cut,'not stretched or cut '+tag);
    ok(im.zoomable||!/^textbook-book-math1-m1-/.test(im.src)||/-(v\d+|vp)\./.test(im.src),'tap to enlarge '+tag);
    if(im.svg)minFont=Math.min(minFont,im.w/1000*28);
   }
   ok(info.text>=1,'p.'+t.n+' has explanation text next to the picture @'+label);
   if(info.over)ok(info.blocks<=2,'p.'+t.n+' overflows only with one unsplittable block @'+label);
   ok(info.pageInView,'p.'+t.n+' fits the screen width @'+label);
   if(info.over)problems.push('p.'+t.n+' はみ出し');
  }
  // 拡大：最初の図（svg）を押すと大きく出る
  const svgN=await page.evaluate(ns=>{const ph=NobiTextbook._state.book.phys;return ns.find(n=>(ph[n-1].blocks||[]).some(b=>b&&(b.t==='fig'||b.t==='media')&&/\.svg$/.test(b.src||'')));},withImg.map(x=>x.n));
  ok(!!svgPage(svgN),'chapter has an exact diagram to enlarge @'+label);
  function svgPage(n){return n;}
  const svgPageN=svgN;if(svgPageN){const svgPage={n:svgPageN};
   const idx=single?svgPage.n-1:Math.floor(svgPage.n/2);await page.evaluate(i=>{NobiTextbook._state.spread=i;},idx);
   await page.getByRole('button',{name:'前のページ'}).click();await page.getByRole('button',{name:'次のページ'}).click();
  }
  const zimg=page.locator('.tb-page[data-page="'+svgN+'"] figure img.tb-zoomable[src$=".svg"]').first();
  ok(await zimg.count()===1,'diagram on p.'+svgN+' is enlargeable @'+label);
  if(await zimg.count()){const before=(await zimg.boundingBox()).width;await zimg.click();const z=page.locator('.tb-zoom-img');await z.waitFor();const after=(await z.boundingBox()).width;minZoomFont=after/1000*28;
   ok(after>=before&&after/1000*28>=16,'enlarged diagram text is at least 16px ('+Math.round(before)+'→'+Math.round(after)+'px wide) @'+label);ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'enlarging does not make the page scroll sideways @'+label);
   await page.keyboard.press('Escape');if(await z.count())await page.locator('.tb-sheet-close, [aria-label="閉じる"]').first().click().catch(()=>{});}
  ok(errors.length===0,'no page errors @'+label+' '+errors.join(' | '));
  report.push(label+'：画像のあるページ '+withImg.length+'・画像 '+checkedImgs+'枚・準備中の枠 '+targets.reduce((s,x)=>s+x.wait,0)+'・正確な図の最小の文字 約'+minFont.toFixed(1)+'px（拡大すると約'+minZoomFont.toFixed(1)+'px）'+(problems.length?'・'+problems.join('、'):''));
  await page.close();
 }
}finally{if(browser)await browser.close();server.close();}
for(const r of report)console.log('  '+r);
console.log('チェック '+checks+'件　✅ '+checks+'　❌ 0　（数学'+CH+'章の図・絵：4画面幅）');
