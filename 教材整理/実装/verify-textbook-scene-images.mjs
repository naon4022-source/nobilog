// 指定した場面画像の本内表示を隔離環境で確認。採点・実アカウント・外部通信は使わない。
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const {chromium}=createRequire(import.meta.url)('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const [bookId,...ids]=process.argv.slice(2);
assert(/^(kokugo1|english1|science1|geography|history)$/.test(bookId)&&ids.length);
const root=new URL('../../',import.meta.url),assets=new URL('site-assets/',root);
const data=JSON.parse(await fs.readFile(new URL('textbook-book-'+bookId+'.json',assets),'utf8'));
const shelf=JSON.parse(await fs.readFile(new URL('textbook-books.json',assets),'utf8')),meta=shelf.books.find(b=>b.id===bookId);assert(meta);
const dir={kokugo1:'国語全体制作',english1:'英語全体制作',science1:'理科全体制作',geography:'地理全体制作',history:'歴史全体制作'}[bookId];
const media=new URL('教材整理/Claude_Codex共有/'+dir+'/メディア/',root),proof=[];
const hash=b=>createHash('sha256').update(b).digest('hex');
for(const id of ids){
 const blocks=data.pages.flatMap(p=>(p.blocks||[]).filter(b=>b.id===id));assert.equal(blocks.length,1,id);
 const src='/textbook-book-'+bookId+'-'+id.toLowerCase()+'.png';assert.equal(blocks[0].src,src);
 const sha=hash(await fs.readFile(new URL(id+'.png',media)));assert.equal(hash(await fs.readFile(new URL(src.slice(1),assets))),sha);
 proof.push({id,src,sha256:sha});
}
const html='<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/textbook-book.css"><style>body{margin:0;font:16px sans-serif}</style><div id="textbook-app" class="tb-app"></div><script src="/textbook-book.js"></script>';
const mime={js:'text/javascript',css:'text/css',json:'application/json',svg:'image/svg+xml',jpg:'image/jpeg',png:'image/png'};
const server=createServer(async(req,res)=>{try{
 const name=new URL(req.url,'http://localhost').pathname.slice(1);if(!name){res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'});res.end(html);return}
 if(!/^(textbook-[a-z0-9-]+|nobi-[a-z0-9-]+)\.(js|css|json|svg|jpg|png)$/.test(name)){res.writeHead(404);res.end();return}
 res.writeHead(200,{'Content-Type':mime[name.split('.').pop()]});res.end(await fs.readFile(new URL(name,assets)));
}catch(_){res.writeHead(404);res.end()}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
let browser;const results=[];
try{
 browser=await chromium.launch({headless:true});
 for(const [width,height] of [[390,844],[820,1180],[1180,820],[1440,900]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
  await page.addInitScript(()=>{Element.prototype.requestFullscreen=undefined;Element.prototype.webkitRequestFullscreen=undefined});
  await page.goto(origin);await page.getByRole('button',{name:'全画面で教科書を開く'}).click();
  await page.getByRole('button',{name:meta.title+'を開く'}).click();await page.locator('.tb-spread').waitFor({timeout:180000});
  for(const target of proof){
   const n=await page.evaluate(id=>NobiTextbook._state.book.phys.find(p=>(p.blocks||[]).some(b=>b.id===id))?.n,target.id);assert(n);
   await page.evaluate(n=>{const s=NobiTextbook._state;s.spread=(s.single?n-1:Math.floor(n/2))-1},n);
   await page.getByRole('button',{name:'次のページ'}).click();
   await page.evaluate(()=>document.getAnimations().forEach(a=>{try{a.finish()}catch(_){}}));
   const image=page.locator('img[src="'+target.src+'"]');await image.waitFor();
   await page.waitForFunction(src=>{const i=document.querySelector('img[src="'+src+'"]');return i?.complete&&i.naturalWidth>0},target.src);
   const result=await image.evaluate(i=>{const r=i.getBoundingClientRect(),fig=i.closest('figure'),body=i.closest('.tb-body'),b=body.getBoundingClientRect(),fr=fig.getBoundingClientRect(),ratio=r.width/r.height/(i.naturalWidth/i.naturalHeight);
    return {natural:[i.naturalWidth,i.naturalHeight],fit:r.left>=b.left-1&&r.right<=b.right+1&&r.top>=b.top-1&&r.bottom<=b.bottom+1,overlap:[...body.children].filter(k=>k!==fig&&!k.contains(fig)).some(k=>{const q=k.getBoundingClientRect();return Math.min(q.bottom,fr.bottom)-Math.max(q.top,fr.top)>1&&Math.min(q.right,fr.right)-Math.max(q.left,fr.left)>1}),cut:getComputedStyle(i).objectFit==='contain'?false:Math.min(ratio,1/ratio)<.6,zoomable:i.classList.contains('tb-zoomable'),width:r.width,height:r.height};
   });
   assert(result.fit&&!result.overlap&&!result.cut&&result.width>0&&result.height>0,target.id+' 表示 '+width);
   if(result.zoomable){await image.click();const dialog=page.getByRole('dialog');await dialog.waitFor();await page.waitForFunction(()=>{const i=document.querySelector('.tb-zoom-img');return i?.complete&&i.naturalWidth>0});await page.keyboard.press('Escape');assert.equal(await dialog.count(),0)}
   results.push({...target,viewport:[width,height],page:n,...result});
  }
  assert.deepEqual(errors,[]);await page.close();console.log(width+'px: '+ids.length+'場面の読込・配置・拡大確認成功');
 }
 await fs.writeFile(new URL('場面画像_表示点検_'+ids[0]+'_'+ids.length+'.json',media),JSON.stringify({date:'2026-10-11',status:'成功',scope:'指定画像の本内表示。画像内容の確認とは別。',results},null,2)+'\n');
}finally{await browser?.close();await new Promise(r=>server.close(r))}
