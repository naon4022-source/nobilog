// Current saved preview only, local files, no users or grading.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url),{chromium}=require('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=new URL('../../../',import.meta.url),here=new URL('./',import.meta.url),work=new URL('教材整理/Claude_Codex共有/数学全体制作/',root);
const html=await readFile(new URL('原稿を読む.html',work));
const server=createServer(async(req,res)=>{const name=decodeURIComponent(new URL(req.url,'http://local').pathname).slice(1);if(!name){res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'}).end(html);return;}if(!/^メディア\/M1-[A-Z0-9-]+\.(svg|png|jpg|mp4)$/.test(name)){res.writeHead(404).end();return;}try{const bytes=await readFile(new URL(name,work));res.writeHead(200,{'Content-Type':name.endsWith('.mp4')?'video/mp4':name.endsWith('.svg')?'image/svg+xml':'image/jpeg'}).end(bytes);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser,checks=0;const ok=(v,m)=>{assert(v,m);checks++;};
const origin='http://127.0.0.1:'+server.address().port;
try{
 browser=await chromium.launch({headless:true});
 for(const width of [390,1440]){
  const p=await browser.newPage({viewport:{width,height:900},serviceWorkers:'block'}),outside=[],errors=[];
  await p.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():(outside.push(r.request().url()),r.abort()));p.on('pageerror',e=>errors.push(e.message));
  await p.goto(origin,{waitUntil:'domcontentloaded'});
  const movie=p.locator('video[src="メディア/M1-APP3-V03.mp4"]');
  ok(await movie.count()===1,'exactly one real APP3 video in saved source preview');
  const answer=movie.locator('xpath=ancestor::details[1]');
  ok(await answer.count()===1,'video resides in native closed answer');ok(!await answer.getAttribute('open'),'answer starts closed');
  ok(!await movie.isVisible(),'actual video hidden before answer opens');
  const figure=answer.locator('img[src="メディア/M1-APP3-FIG07.svg"]');ok(await figure.count()===1&&!await figure.isVisible(),'existing figure hidden inside same answer');
  ok((await answer.innerText()).includes('答え'),'native answer summary retained');
  await answer.locator('summary').click();
  ok(await movie.isVisible()&&await figure.isVisible(),'both original media shown only after opening');
  ok((await answer.innerText()).includes('24cm、6枚（縦 2枚×横 3枚）'),'original answer exact');
  ok((await answer.innerText()).includes('2³×3＝24'),'original steps in same answer');
  await movie.evaluate(async v=>{v.muted=true;await v.play();});
  await p.waitForFunction(()=>document.querySelector('video[src="メディア/M1-APP3-V03.mp4"]').currentTime>.1);
  ok(await movie.evaluate(v=>v.videoWidth===1280&&v.duration>45),'real local movie decoded in preview');
  await movie.evaluate(v=>v.pause());
  ok((await p.locator('article').count())===922,'922 reading cards; only moved steps card merged into own answer');
  ok(!outside.length&&!errors.length,'isolated preview has no external calls or JavaScript failures');
  await p.close();console.log(width+': saved preview answer/figure/steps/video passed');
 }
 const receipt={status:'passed',checks,sourcePreviewSha256:createHash('sha256').update(html).digest('hex'),widths:[390,1440],readingCards:922,realUsers:false,externalRequests:0};
 await writeFile(new URL('integrated-preview-result.json',here),JSON.stringify(receipt,null,2)+'\n');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
