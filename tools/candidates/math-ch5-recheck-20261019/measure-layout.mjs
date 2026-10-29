// Isolated candidate measurement only; never connects to real accounts.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const here=new URL('./',import.meta.url),base=new URL('../../../site-assets/',import.meta.url);
const variant=process.argv[2]||'after-text';assert(['after-text','top'].includes(variant));
const candidate=new URL('layout-candidate/'+variant+'/',here);
const manifest=JSON.parse(await readFile(new URL('candidate-result.json',candidate),'utf8'));
assert.equal(manifest.integration,false);
const bookSha256=createHash('sha256').update(await readFile(new URL('textbook-book-math1.json',candidate))).digest('hex');
assert.equal(bookSha256,manifest.bookAfterSha256);
const {chromium}=createRequire(import.meta.url)('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const html='<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="/textbook-book.css"><section id="view-textbook"><div id="textbook-app" class="tb-app"></div></section><script src="/textbook-book.js"></script>';
const server=createServer(async(req,res)=>{
 const name=decodeURIComponent(req.url.split('?')[0].slice(1));
 if(!name){res.end(html);return;}
 if(!/^(textbook-[a-z0-9-]+\.(js|css|json|jpg|svg|png|mp4)|nobi-normal\.svg)$/.test(name)){res.writeHead(404);res.end();return;}
 try{let bytes;try{bytes=await readFile(new URL(name,candidate));}catch{bytes=await readFile(new URL(name,base));}
 const ext=name.split('.').pop();res.setHeader('Content-Type',({js:'text/javascript',css:'text/css',json:'application/json',jpg:'image/jpeg',svg:'image/svg+xml',png:'image/png',mp4:'video/mp4'})[ext]);res.end(bytes);
 }catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{
 browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{Element.prototype.requestFullscreen=undefined;Element.prototype.webkitRequestFullscreen=undefined;});
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 await page.goto('http://127.0.0.1:'+server.address().port+'/');
 await page.getByRole('button',{name:'全画面で教科書を開く'}).click();
 await page.getByRole('button',{name:'数学 1を開く'}).click();await page.locator('.tb-spread').waitFor({timeout:240000});
 const total=await page.evaluate(()=>NobiTextbook._state.book.phys.length),pictureless=[],overflows=[],brokenImages=[],checkedSpreads=[];
 const chapterOnly=process.argv.includes('--chapter5');
 for(let i=chapterOnly?188:1;i<(chapterOnly?246:Math.floor(total/2)+1);i++){
  await page.evaluate(i=>{NobiTextbook._state.spread=i;},i);
  await page.getByRole('button',{name:'前のページ'}).click();await page.getByRole('button',{name:'次のページ'}).click();
  await page.waitForFunction(()=>[...document.querySelectorAll('.tb-page img')].every(im=>im.complete),{},{timeout:20000});
  brokenImages.push(...await page.locator('.tb-page img').evaluateAll(images=>images.filter(im=>!im.naturalWidth).map(im=>im.getAttribute('src'))));
  const info=await page.evaluate(()=>{document.getAnimations().forEach(a=>{try{a.finish();}catch{}});return [...document.querySelectorAll('.tb-page[data-page]')].map(p=>{const b=p.querySelector('.tb-body');return {n:Number(p.dataset.page),pictures:p.querySelectorAll('img,video,.tb-media,.tb-fig').length,over:b?b.scrollHeight>b.clientHeight+1:false,text:p.textContent.slice(0,240)};});});
  if(!info.some(p=>p.pictures))pictureless.push(info);
  overflows.push(...info.filter(p=>p.over));
  checkedSpreads.push(info.map(p=>p.n));
  if(info.some(p=>p.n>=414&&p.n<=425))await page.screenshot({path:new URL('spread-'+info[0].n+'.png',candidate).pathname});
 }
 await writeFile(new URL('layout-measurement.json',candidate),JSON.stringify({status:errors.length||brokenImages.length?'failed':'measured; content and other widths still require review',scope:chapterOnly?'physical spreads 376–491 around chapter5':'all spreads',checkedSpreads,variant,bookSha256,total,pictureless,overflows,brokenImages,errors},null,2)+'\n');
 assert.equal(errors.length,0,errors.join('\n'));
 assert.equal(brokenImages.length,0,brokenImages.join('\n'));
 console.log(JSON.stringify({variant,total,pictureless:pictureless.map(s=>s.map(p=>p.n).join('-')),overflowPages:overflows.map(p=>p.n)}));
}finally{await browser?.close();server.close();}
