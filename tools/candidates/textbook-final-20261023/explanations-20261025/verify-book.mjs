import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
const {chromium}=createRequire(import.meta.url)('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const here=new URL('./',import.meta.url),ROOT=new URL('../../../../',here),ASSETS=new URL('site-assets/',ROOT);
const receipt=JSON.parse(await readFile(new URL('receipt.json',here))),inputs=Object.fromEntries(await Promise.all(receipt.files.map(async r=>[r.file,createHash('sha256').update(await readFile(new URL(r.file,ROOT))).digest('hex')])));
const html='<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/textbook-book.css"><script src="/text-settings.js"></script><script src="/textbook-annotation-model.js"></script><script>window.nobiTextbookAnnotationAPI={};window.NobiTextbookAnnotations={mount(){},unmount(){}};</script><section id="view-textbook"><div id="textbook-app" class="tb-app"></div></section><script src="/vertical-fractions.js"></script><script src="/textbook-book.js"></script>';
const types={js:'text/javascript',css:'text/css',json:'application/json',svg:'image/svg+xml',png:'image/png',jpg:'image/jpeg',webp:'image/webp',mp4:'video/mp4'};
const server=createServer(async(req,res)=>{
 const name=decodeURIComponent(new URL(req.url,'http://fixture.test').pathname.slice(1));
 if(!name){res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'}).end(html);return;}
 if(!/^[a-zA-Z0-9._-]+$/.test(name)){res.writeHead(404).end();return;}
 try{res.writeHead(200,{'Content-Type':types[name.split('.').pop()]||'application/octet-stream'}).end(await readFile(new URL(name,ASSETS)));}catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port,results=[],errors=[],outside=[];
let checks=0,browser;const ok=(v,m)=>{assert.ok(v,m);checks++;};const clean=s=>s.replace(/\s/g,'');
async function settle(page){await page.evaluate(async()=>{
 await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
 await Promise.all(document.getAnimations().filter(a=>Number.isFinite(a.effect?.getTiming().iterations)).map(a=>a.finished.catch(e=>{if(e.name!=='AbortError')throw e;})));
 await Promise.all([...document.querySelectorAll('.tb-spread img')].map(n=>n.decode().catch(()=>{})));
 await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
});}
await mkdir(new URL('screens/',here),{recursive:true});
try{
 browser=await chromium.launch({headless:true});
 for(const [book,title] of [['math1','数学 1'],['geography','社会 地理']]){
  const context=await browser.newContext(),page=await context.newPage();
  await page.addInitScript(()=>{Element.prototype.requestFullscreen=undefined;Element.prototype.webkitRequestFullscreen=undefined;});
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>{if(r.request().url().startsWith(origin+'/'))return r.continue();outside.push(r.request().url());return r.abort();});
  await page.goto(origin);
  for(const [width,large] of [[390,false],[820,false],[1180,false],[1440,false],[390,true]]){
   await page.setViewportSize({width,height:900});await page.evaluate(large=>NobiTextSettings.apply(large),large);
   await page.getByRole('button',{name:'全画面で教科書を開く',exact:true}).click();
   await page.getByRole('button',{name:title+'を開く',exact:true}).evaluate(b=>b.click());
   await page.locator('.tb-spread').waitFor({timeout:240000});
   const target=await page.evaluate(book=>{
    const b=NobiTextbook._state.book,selected=book==='math1'
     ?b.pages.flatMap(p=>p.pid==='M1-P051'&&p.tag==='しくみ'?p.blocks.filter(x=>['goal','ol'].includes(x.t)):p.pid==='M1-P052'&&p.tag==='解き方'?p.blocks.filter(x=>['ol','p'].includes(x.t)):[])
     :b.pages.find(p=>p.n===23).blocks.filter(x=>x.t==='ol');
    const needles=selected.map(x=>x.annotationAnchor||JSON.stringify(x));
    const pages=b.phys.filter(p=>needles.some(n=>JSON.stringify(p.blocks||[]).includes(n))).map(p=>p.n);
    return {pages,texts:selected.flatMap(x=>x.t==='ol'?x.items.map(i=>i.x):[x.x]),total:b.phys.length};
   },book);
   ok(target.pages.length>0&&target.texts.length>0,'actual reviewed blocks found after pagination');
   let shown='';
   for(const n of target.pages){
    await page.evaluate(n=>{const form=document.querySelector('.tb-jump');form.querySelector('input').value=String(n);form.requestSubmit();},n);
    await settle(page);
    const body=page.locator('.tb-page[data-page="'+n+'"] .tb-body');
    const m=await body.evaluate(n=>({text:n.textContent,fits:n.scrollHeight<=n.clientHeight+1&&n.scrollWidth<=n.clientWidth+1,stable:[...n.children].every(x=>Number(getComputedStyle(x).opacity)>.99),images:[...n.querySelectorAll('img')].every(x=>x.complete&&x.naturalWidth>0)}));
    ok(m.fits,book+' '+width+' '+large+' page'+n+' content fits');shown+=' '+m.text;
    ok(m.stable,'body reveal animations completed before acceptance');ok(m.images,'shown images decoded');
    ok(await page.locator('.tb-sheet').count()===0,'no answers automatically opened');
   }
   for(const text of target.texts)ok(clean(shown).includes(clean(text.replace(/\*\*/g,''))),book+' reviewed explanation visible');
   const screenshot='screens/'+book+'-'+width+(large?'-large':'')+'.png';await page.screenshot({path:new URL(screenshot,here).pathname});
   results.push({book,width,large,physicalPages:target.total,reviewedPages:target.pages,screenshot});
   await page.evaluate(()=>NobiTextbook.leave());
   console.log(book+' '+width+(large?' large':'')+': approved explanation visible, fits and answers closed');
  }
  await context.close();
 }
 ok(errors.length===0,errors.join(' | '));ok(outside.length===0,'no outside requests');
 for(const [file,digest] of Object.entries(inputs))ok(createHash('sha256').update(await readFile(new URL(file,ROOT))).digest('hex')===digest,'source input stable');
 await writeFile(new URL('book-result.json',here),JSON.stringify({status:'passed',checks,inputs,results,scope:'Actual local two-book renderer/model; revised explanation blocks at four widths and large390, fit/text/closed-answer checks; no grading, real accounts, AI calls or user data.'},null,2)+'\n');
 console.log('Approved explanation actual book: '+checks+' checks passed');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
