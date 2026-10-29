// Actual textbook layout only. No account, storage adapter, grading, or external requests.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const here=new URL('./',import.meta.url),assets=new URL('../../../site-assets/',import.meta.url),candidate=process.argv.includes('--candidate'),label=candidate?'spread-candidate':'spread-before';
const output=new URL(label+'/',here);await mkdir(output,{recursive:true});
const html='<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/textbook-book.css"><style>body{margin:0;font:16px sans-serif}</style><section id="view-textbook"><h2>📚 教科書</h2><div id="textbook-app" class="tb-app"></div></section><script>function switchView(){NobiTextbook.leave()}</script><script src="/textbook-book.js"></script>';
const server=createServer(async(req,res)=>{
 try{const name=new URL(req.url,'http://localhost').pathname.slice(1);
  if(!name){res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'});res.end(html);return;}
  if(!/^textbook-[a-z0-9-]+\.(?:js|css|json|svg|jpg|png|mp4)$/.test(name)){res.writeHead(404);res.end();return;}
  const body=await readFile(candidate&&name==='textbook-book-math1.json'?new URL('layout-candidate/book.json',here):new URL(name,assets));
  const type={js:'text/javascript',css:'text/css',json:'application/json',svg:'image/svg+xml',jpg:'image/jpeg',png:'image/png',mp4:'video/mp4'}[name.split('.').pop()];
  res.writeHead(200,{'Content-Type':type});res.end(body);
 }catch(_){res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;let browser;
try{
 browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
 await page.addInitScript(()=>{Element.prototype.requestFullscreen=undefined;Element.prototype.webkitRequestFullscreen=undefined;});
 await page.goto(origin);await page.getByRole('button',{name:'全画面で教科書を開く'}).click();await page.getByRole('button',{name:'数学 1を開く'}).click();await page.locator('.tb-spread').waitFor({timeout:180000});
 const report=await page.evaluate(()=>{
  const b=NobiTextbook._state.book,phys=b.phys;
  const describe=p=>({n:p.n,pid:p.pid,chapter:p.chapter,section:p.section,topic:p.topic,kind:p.kind,blocks:(p.blocks||[]).map(x=>({t:x.t,id:x.id,x:x.x,src:x.src,caption:x.caption,rows:x.rows,items:x.items}))});
  const gaps=[];for(let i=1;i<phys.length;i+=2){const pages=phys.slice(i,i+2);if(!pages.some(p=>(p.blocks||[]).some(x=>x.t==='fig'||x.t==='media')))gaps.push({spread:pages.map(p=>p.n).join('-'),pages:pages.map(describe)});}
  return {pages:phys.length,gaps,chapter3:phys.filter(p=>String(p.chapter||'').startsWith('3章')).map(describe),nearby:phys.filter(p=>p.n>=264&&p.n<=269).map(describe)};
 });
 for(const n of [264,266,268]){
  await page.getByLabel('コードでページへ移動').fill('数'+n);await page.getByRole('button',{name:'コードで移動'}).click();
  await page.evaluate(()=>document.getAnimations().forEach(a=>{try{a.finish()}catch(_){}}));
  await page.waitForFunction(()=>[...document.querySelectorAll('.tb-spread img')].every(i=>i.complete));
  await page.screenshot({path:new URL(n+'.png',output).pathname,animations:'disabled'});
 }
 assert.deepEqual(errors,[]);await writeFile(new URL('report.json',output),JSON.stringify(report,null,2)+'\n');
 console.log(label+': '+report.pages+' physical pages; pictureless '+report.gaps.map(x=>x.spread).join(', '));
}finally{await browser?.close();await new Promise(r=>server.close(r));}
