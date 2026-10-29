// 本の画面で実際に組んだページ番号を調べ、画像・動画の枠がどのページ（見開きコード）に入るかを書き出す。
// 出力：教材整理/Claude_Codex共有/数学全体制作/メディアの置き場所.json（build-textbook-book.py が依頼一覧に使う）
import {createServer} from 'node:http';import {readFile,writeFile} from 'node:fs/promises';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=new URL('../../',import.meta.url),base=new URL('site-assets/',root);
const html=`<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="/textbook-book.css"><div id="textbook-app" class="tb-app"></div><script src="/textbook-book.js"></script>`;
const server=createServer(async(req,res)=>{const n=req.url.slice(1);if(!n){res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'});res.end(html);return;}if(!/^textbook-[a-z0-9-]+\.(?:js|css|json|svg|jpg|mp4|webm)$/.test(n)){res.writeHead(404);res.end();return;}try{const b=await readFile(new URL(n,base));res.writeHead(200,{'Content-Type':n.endsWith('.js')?'text/javascript':n.endsWith('.css')?'text/css':n.endsWith('.json')?'application/json':n.endsWith('.svg')?'image/svg+xml':'image/jpeg'});res.end(b);}catch(_){res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch();
try{
 const p=await browser.newPage({viewport:{width:1440,height:900}});
 await p.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 await p.goto('http://127.0.0.1:'+server.address().port+'/');await p.getByRole('button',{name:'全画面で教科書を開く'}).click();await p.getByRole('button',{name:'数学 1を開く'}).click();await p.locator('.tb-spread').waitFor({timeout:180000});
 const map=await p.evaluate(()=>{const out={},ph=NobiTextbook._state.book.phys;
  function walk(blocks,page,inAnswer=false){for(const b of blocks||[]){
   if(b&&b.t==='media'&&b.id){const n=page.n,a=n%2===0?n:n-1;out[b.id]={page:n,spread:n===1?'数1':'数'+a+'-'+Math.min(a+1,ph.length),...(inAnswer?{inAnswer:true}:{})};}
   if(b&&Array.isArray(b.body))walk(b.body,page,inAnswer||b.t==='details');
  }}
  for(const page of ph)walk(page.blocks,page);return {pages:ph.length,media:out};});
 map.generatedAt=new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Tokyo'});
 await writeFile(new URL('教材整理/Claude_Codex共有/数学全体制作/メディアの置き場所.json',root),JSON.stringify(map,null,1));
 console.log('media placed:',Object.keys(map.media).length,'pages:',map.pages);
}finally{await browser.close();server.close();}
