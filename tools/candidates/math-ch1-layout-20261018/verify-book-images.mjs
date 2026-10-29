// Existing first-chapter diagrams in the actual local book; no accounts, grading, or external network.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const root=new URL('../../../',import.meta.url),here=new URL('./',import.meta.url),assets=new URL('site-assets/',root);
const {chromium}=createRequire(import.meta.url)('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const manifest=JSON.parse(await fs.readFile(new URL('manifest.json',here),'utf8'));
const hidden=['M1-C1-S2-M05','M1-C1-S2-M06'];
const items=manifest.filter(x=>!hidden.includes(x.id));assert.equal(items.length,20);
const hash=b=>createHash('sha256').update(b).digest('hex');
for(const x of manifest){assert.equal(hash(await fs.readFile(x.file)),x.after);assert.match(await fs.readFile(x.file,'utf8'),/viewBox="0 0 1600 900"/);assert.equal(hash(await fs.readFile(x.copy)),x.after);}
const html='<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/textbook-book.css"><style>body{margin:0;font:16px sans-serif}</style><div id="textbook-app" class="tb-app"></div><script src="/textbook-book.js"></script>';
const mime={js:'text/javascript',css:'text/css',json:'application/json',svg:'image/svg+xml',jpg:'image/jpeg',mp4:'video/mp4'};
const server=createServer(async(req,res)=>{try{const name=new URL(req.url,'http://localhost').pathname.slice(1);if(!name){res.setHeader('Content-Type','text/html;charset=utf-8');res.end(html);return;}if(!/^textbook-[a-z0-9-]+\.(js|css|json|svg|jpg|mp4)$/.test(name)){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',mime[name.split('.').pop()]);res.end(await fs.readFile(new URL(name,assets)));}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
let browser;const results=[];
try{browser=await chromium.launch({headless:true});for(const [width,height] of [[390,844],[820,1180],[1180,820],[1440,900]]){
 const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
 await page.addInitScript(()=>{Element.prototype.requestFullscreen=undefined;Element.prototype.webkitRequestFullscreen=undefined;});
 await page.goto(origin);await page.getByRole('button',{name:'全画面で教科書を開く'}).click();await page.getByRole('button',{name:'数学 1を開く'}).click();await page.locator('.tb-spread').waitFor({timeout:180000});
 for(const item of items){const src='/textbook-book-math1-'+item.id.toLowerCase()+'.svg';const n=await page.evaluate(id=>NobiTextbook._state.book.phys.find(p=>(p.blocks||[]).some(b=>b.id===id))?.n,item.id);assert(n,item.id+' physical page');
 if(width>900){await page.getByLabel('コードでページへ移動').fill('数'+n);await page.getByRole('button',{name:'コードで移動'}).click();}else{await page.evaluate(n=>{const s=NobiTextbook._state,target=s.single?n-1:Math.floor(n/2);s.spread=target-1;},n);await page.getByRole('button',{name:'次のページ'}).click();}
 await page.evaluate(()=>document.getAnimations().forEach(a=>{if(Number.isFinite(a.effect.getTiming().iterations))try{a.finish();}catch{}}));
 const im=page.locator('.tb-spread img[src="'+src+'"]');await im.waitFor();await im.evaluate(im=>im.decode());const fit=await im.evaluate(im=>{const b=im.getBoundingClientRect(),p=im.closest('.tb-body').getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height,naturalWidth:im.naturalWidth,naturalHeight:im.naturalHeight,fit:b.width>0&&b.height>0&&b.left>=p.left-1&&b.right<=p.right+1&&b.top>=p.top-1&&b.bottom<=p.bottom+1};});assert(fit.fit,item.id+' inside page at '+width);assert(fit.naturalWidth>0&&fit.naturalHeight>0,item.id+' decoded intrinsic dimensions');assert(Math.abs(fit.width-fit.height*16/9)<2,item.id+' displayed 16:9 within pixel rounding');results.push({id:item.id,viewport:[width,height],page:n,...fit});
 if(['M1-C1-S1-D03','M1-C1-S2-D09'].includes(item.id)){await fs.mkdir(new URL('book-images/',here),{recursive:true});await page.screenshot({path:new URL('book-images/'+item.id+'-'+width+'.png',here).pathname});}
 }
 assert.deepEqual(errors,[]);await page.close();console.log(width+'px: 20 modified visible diagrams decoded and fit actual pages');
}await fs.writeFile(new URL('book-images.json',here),JSON.stringify({date:'2026-10-18',status:'passed',scope:'20 public diagrams x 4 widths; the other two answer diagrams are covered by the 177-check answer harness',items:items.map(x=>({id:x.id,sha256:x.after})),results},null,2)+'\n');}finally{await browser?.close();await new Promise(r=>server.close(r));}
