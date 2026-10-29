// 実際の本・動画をローカルで再生。実アカウント・採点・外部通信は使わない。
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const source=new URL('./',import.meta.url), root=new URL('../../../../../',source), assets=new URL('site-assets/',root);
const ledger=JSON.parse(await fs.readFile(new URL('69本_制作進捗.json',source),'utf8'));
const selected=process.argv.slice(2);
assert(selected.length,'点検する章を指定してください（M1-C4- など）');
const items=ledger.items.filter(x=>selected.some(prefix=>x.id.startsWith(prefix)));
assert(items.length,'対象動画がありません');
const book=JSON.parse(await fs.readFile(new URL('textbook-book-math1.json',assets),'utf8'));
const hash=buffer=>createHash('sha256').update(buffer).digest('hex');
for(const item of items){
 const blocks=book.pages.flatMap(p=>(p.blocks||[]).filter(b=>b.id===item.id));
 assert.equal(blocks.length,1,item.id+' 本の枠は1つ');
 assert.equal(blocks[0].kind,'video');
 const expected='/textbook-book-math1-'+item.id.toLowerCase()+'.mp4';
 assert.equal(blocks[0].src,expected,item.id+' 本への参照');
 assert.equal(hash(await fs.readFile(new URL('../'+item.id+'.mp4',source))),item.sha256);
 assert.equal(hash(await fs.readFile(new URL(expected.slice(1),assets))),item.sha256,item.id+' 配信用コピー');
 const audit=JSON.parse(await fs.readFile(item.shots+'/実動画の点検.json','utf8'));
 assert.equal(audit.sha256,item.sha256);assert.equal(audit.visualReview?.result,'全場面を目視確認済み');
}
const html='<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/textbook-book.css"><style>body{margin:0;font:16px sans-serif}</style><section id="view-textbook"><div id="textbook-app" class="tb-app"></div></section><script>function switchView(){NobiTextbook.leave()}</script><script src="/textbook-book.js"></script>';
const mime={js:'text/javascript',css:'text/css',json:'application/json',svg:'image/svg+xml',jpg:'image/jpeg',mp4:'video/mp4'};
const server=createServer(async(req,res)=>{
 try{
  const name=new URL(req.url,'http://localhost').pathname.slice(1);
  if(!name){res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'});res.end(html);return}
  if(!/^textbook-[a-z0-9-]+\.(js|css|json|svg|jpg|mp4)$/.test(name)){res.writeHead(404);res.end();return}
  const data=await fs.readFile(new URL(name,assets)),headers={'Content-Type':mime[name.split('.').pop()],'Accept-Ranges':'bytes'};
  const match=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range||'');
  if(match){const start=Number(match[1]),end=Math.min(data.length-1,match[2]?Number(match[2]):data.length-1);
   if(start>end){res.writeHead(416,{'Content-Range':'bytes */'+data.length});res.end();return}
   res.writeHead(206,{...headers,'Content-Length':end-start+1,'Content-Range':`bytes ${start}-${end}/${data.length}`});res.end(data.subarray(start,end+1));
  }else{res.writeHead(200,{...headers,'Content-Length':data.length});res.end(data)}
 }catch(_){res.writeHead(404);res.end()}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port;
let browser;const results=[];
try{
 browser=await chromium.launch({headless:true});
 for(const [width,height] of [[390,844],[820,1180],[1180,820],[1440,900]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
  await page.addInitScript(()=>{Element.prototype.requestFullscreen=undefined;Element.prototype.webkitRequestFullscreen=undefined});
  await page.goto(origin);await page.getByRole('button',{name:'全画面で教科書を開く'}).click();
  await page.getByRole('button',{name:'数学 1を開く'}).click();await page.locator('.tb-spread').waitFor({timeout:120000});
  for(const item of items){
   const src='/textbook-book-math1-'+item.id.toLowerCase()+'.mp4';
   const n=await page.evaluate(id=>NobiTextbook._state.book.phys.find(p=>(p.blocks||[]).some(b=>b.id===id))?.n,item.id);
   assert(n,item.id+' 物理ページ');
   if(width>900){await page.getByLabel('コードでページへ移動').fill('数'+n);await page.getByRole('button',{name:'コードで移動'}).click()}
   else{
    // 小画面ではコード欄が仕様上隠れる。隔離した本のページ位置だけを用意し、実際の次ページ操作で描画する。
    await page.evaluate(n=>{const s=NobiTextbook._state,target=s.single?n-1:Math.floor(n/2);s.spread=target-1},n);
    await page.getByRole('button',{name:'次のページ'}).click();
   }
   const video=page.locator('video[src="'+src+'"]');await video.waitFor();
   await page.evaluate(()=>document.getAnimations().forEach(a=>{try{a.finish()}catch(_){}}));
   await page.waitForFunction(src=>{const v=document.querySelector('video[src="'+src+'"]');return v&&v.readyState>=2&&v.duration>0},src,{timeout:30000});
   const result=await video.evaluate(async(v)=>{
    const box=v.getBoundingClientRect(),body=v.closest('.tb-body').getBoundingClientRect();
    v.muted=true;await v.play();const begin=v.currentTime;
    await new Promise((resolve,reject)=>{const until=performance.now()+5000;function wait(){if(v.currentTime>begin+.1)return resolve();if(v.error)return reject(Error(v.error.message));if(performance.now()>until)return reject(Error('動画が進まない'));setTimeout(wait,50)}wait()});
    v.pause();const seek=Math.max(.1,v.duration-.5);
    await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('終わりへの移動失敗')),5000);v.addEventListener('seeked',()=>{clearTimeout(timer);resolve()},{once:true});v.currentTime=seek});
    return {duration:v.duration,time:v.currentTime,width:v.videoWidth,height:v.videoHeight,controls:v.controls,inline:v.playsInline,error:v.error?.code||0,fit:box.left>=body.left-1&&box.right<=body.right+1&&box.top>=body.top-1&&box.bottom<=body.bottom+1};
   });
   assert.equal(result.width,1280);assert.equal(result.height,720);assert(result.controls&&result.inline&&result.fit);assert.equal(result.error,0);
   assert(Math.abs(result.duration-item.seconds)<.2);assert(Math.abs(result.time-(result.duration-.5))<.2);
   results.push({id:item.id,viewport:[width,height],page:n,...result});
  }
  assert.deepEqual(errors,[]);await page.close();console.log(width+'px: '+items.length+'本の本内再生・終盤への移動・収まり成功');
 }
 const dir=new URL('../点検/69本_本内再生/',source);await fs.mkdir(dir,{recursive:true});
 await fs.writeFile(new URL(selected.join('_').replace(/[^a-zA-Z0-9_-]/g,'')+'.json',dir),JSON.stringify({date:'2026-10-11',status:'成功',scope:'本内の再生・移動・表示・コピーSHA一致。耳での確認とは別。',items:items.map(x=>({id:x.id,sha256:x.sha256})),results},null,2)+'\n');
}finally{await browser?.close();await new Promise(r=>server.close(r))}
