// 答え先出し修正候補の隔離確認：127.0.0.1 の合成ページで、本物の textbook-book.js/css と「候補の」textbook-book-math1.json を使う。
// 外部通信なし。採点・問題開始・保存はしない（教科書を読むだけ）。共有本体は読むだけで書きかえない。
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const here=new URL('./',import.meta.url),assets=new URL('../../../site-assets/',import.meta.url);
const html=`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/textbook-book.css"><style>body{margin:0;font:16px sans-serif}</style><section id="view-textbook"><div id="textbook-app" class="tb-app"></div></section><script>function switchView(id){}</script><script src="/textbook-book.js"></script>`;
const server=createServer(async(req,res)=>{const name=req.url.split('?')[0].slice(1);if(!name){res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'});res.end(html);return;}
 if(!/^textbook-[a-z0-9-]+\.(?:js|css|json|svg|jpg)$/.test(name)){res.writeHead(404);res.end();return;}
 const from=name==='textbook-book-math1.json'?new URL(name,here):new URL(name,assets);
 try{const body=await readFile(from);res.writeHead(200,{'Content-Type':name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':name.endsWith('.json')?'application/json':name.endsWith('.svg')?'image/svg+xml':'image/jpeg'});res.end(body);}catch(_){res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url='http://127.0.0.1:'+server.address().port+'/';
const results=[];let checks=0;const ok=(v,m)=>{results.push((v?'OK ':'NG ')+m);if(v)checks++;};
const browser=await chromium.launch({headless:true});
const cases=[['M05','確認5-2','0÷(−5)＝−5','0 をわると 0','m1-c1-s2-m05',['5÷0＝0','(−4.8)÷0.6＝8']],['M06','確認6-1','−9/2 の逆数を 2/9 とする','逆数の符号は元と同じ','m1-c1-s2-m06',['48÷(−4)÷2 を、先に (−4)÷2 から計算する']]];
try{
 for(const [width,height,label] of [[390,844,'390'],[1440,900,'1440']]){
  const page=await browser.newPage({viewport:{width,height},hasTouch:width<500,isMobile:width<500});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
  if(width===390)await page.addInitScript(()=>{Element.prototype.requestFullscreen=undefined;Element.prototype.webkitRequestFullscreen=undefined;});
  await page.goto(url);
  await page.getByRole('button',{name:'全画面で教科書を開く'}).click();
  await page.locator('.tb-shelf-grid .tb-book').first().waitFor();
  const meta=JSON.parse(await readFile(new URL('textbook-books.json',assets),'utf8')).books.find(b=>b.id==='math1');
  await page.locator('.tb-book',{hasText:meta.title}).first().click();
  await page.locator('.tb-spread').waitFor({timeout:60000});
  for(const [id,q,row,fix,img,keep] of cases){
   // 目的の確認問題が見えるまでページをめくる
   let found=false;
   for(let i=0;i<400;i++){if(await page.locator('.tb-spread .tb-p',{hasText:q}).count()){found=true;break;}const nx=page.locator('.tb-next');if(await nx.isDisabled())break;await nx.click();await page.waitForTimeout(30);}
   ok(found,`${label} ${id}: ${q} のページを開けた`);
   const spread=page.locator('.tb-spread');
   ok(await spread.locator('td',{hasText:row}).count()===0,`${label} ${id}: 閉じた状態で該当の表の行が見えない`);
   ok(await spread.locator(`img[src*="${img}"]`).count()===0,`${label} ${id}: 閉じた状態で画像が見えない`);
   for(const k of keep)ok(await spread.locator('td',{hasText:k}).count()>=1,`${label} ${id}: 関係ない行「${k.slice(0,12)}…」は表に残る`);
   await page.screenshot({path:new URL(`確認画面/${label}_${id}_閉じた状態.png`,here).pathname});
   // 確認問題のすぐ後の「答えと解説」を開く
   const btn=spread.locator('.tb-p',{hasText:q}).locator('xpath=following-sibling::*[1]');
   ok((await btn.textContent()).includes('答えと解説'),`${label} ${id}: 問題の直後が「答えと解説」ボタン`);
   await btn.click();
   const sheet=page.locator('.tb-sheet');await sheet.waitFor();
   ok(await sheet.locator('td',{hasText:row}).count()===1&&await sheet.locator('td',{hasText:fix}).count()===1,`${label} ${id}: 開くと表の行（まちがい・正しい考え方）が出る`);
   console.log("SHEET:",(await sheet.innerHTML()).slice(0,1500));const im=sheet.locator(`img[src*="${img}"]`);ok(await im.count()===1,`${label} ${id}: 開くと画像が出る`);
   await page.waitForFunction(el=>el.complete&&el.naturalWidth>0,await im.elementHandle(),{timeout:10000}).then(()=>ok(true,`${label} ${id}: 画像が読み込まれた`)).catch(()=>ok(false,`${label} ${id}: 画像が読み込まれた`));
   const box=await im.boundingBox();ok(box&&box.width>100&&box.x>=0&&box.x+box.width<=width+1,`${label} ${id}: 画像が画面の幅に収まる（幅${box&&Math.round(box.width)}px）`);
   const sw=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);ok(sw<=0,`${label} ${id}: 横はみ出しなし`);
   await page.screenshot({path:new URL(`確認画面/${label}_${id}_開いた状態.png`,here).pathname});
   await page.getByRole('button',{name:'閉じる'}).click();await sheet.waitFor({state:'detached'});
   ok(await spread.locator(`img[src*="${img}"]`).count()===0,`${label} ${id}: 閉じるとまた見えなくなる`);
  }
  ok(errors.length===0,`${label}: ページのエラーなし ${errors.join('|').slice(0,120)}`);
  await page.close();
 }
}finally{await browser.close();server.close();}
console.log(results.join('\n'));console.log('合格',checks,'/',results.length);
