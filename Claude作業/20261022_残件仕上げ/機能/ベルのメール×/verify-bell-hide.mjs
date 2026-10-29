// ベルの一覧の×（候補）の隔離確認：候補の index.html を ?demo=1（体験版・保存しないメモリの記録）で開き、外への通信はすべて止める
import {createServer} from 'node:http';import {readFile,stat} from 'node:fs/promises';import {createRequire} from 'node:module';import path from 'node:path';
const {chromium}=createRequire(import.meta.url)('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const ROOT='/Users/shimizunaotomoo/Desktop/my-app',HERE=path.dirname((await import('node:url')).fileURLToPath(import.meta.url));
const types={'.html':'text/html;charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp'};
async function exists(p){try{return (await stat(p)).isFile();}catch{return false;}}
const server=createServer(async(req,res)=>{let u=decodeURIComponent(new URL(req.url,'http://x').pathname);if(u==='/'||u==='/index.html'){res.writeHead(200,{'Content-Type':types['.html']});return res.end(await readFile(path.join(HERE,'index.candidate.html')));}
 let p=path.join(ROOT,u);if(!await exists(p))p=path.join(ROOT,'site-assets',u);if(!await exists(p)){res.writeHead(404);return res.end();}res.writeHead(200,{'Content-Type':types[path.extname(p)]||'application/octet-stream'});res.end(await readFile(p));});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true});let n=0,f=0;const ok=(c,m)=>{n++;if(!c){f++;console.log('❌',m);}};
try{for(const width of [390,1280]){
 const page=await browser.newPage({viewport:{width,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));let external=0;
 await page.route('**/*',r=>{if(new URL(r.request().url()).hostname==='127.0.0.1')return r.continue();external++;return r.abort();});
 await page.goto('http://127.0.0.1:'+server.address().port+'/?demo=1');await page.waitForTimeout(2500);
 const before=await page.evaluate(()=>noticeItems().length);ok(before>=1,'demo has notices: '+before);
 await page.evaluate(()=>noticeOpen());await page.locator('.notice-list-row').first().waitFor();
 const rows=await page.locator('.notice-list-row').count();ok(rows===before,'one row per notice');
 const x=page.locator('.notice-hide').first();ok(await x.getAttribute('aria-label')==='このお知らせを一覧から外す','× has a readable name');
 const op=await x.evaluate(e=>Number(getComputedStyle(e).opacity));ok(op<0.5,'× is faint ('+op+')');
 const box=await x.boundingBox(),row=await page.locator('.notice-list-row').first().boundingBox();ok(box.x+box.width>row.x+row.width-12&&box.y<row.y+16,'× sits in the top-right corner');
 const firstId=await page.evaluate(()=>String(noticePanelItems[0].id));
 await x.click();await page.waitForTimeout(200);
 ok(await page.locator('.notice-list-row').count()===before-1,'row removed from the list');
 ok(await page.evaluate(()=>document.getElementById('game-play').querySelector('h2')?.textContent)==='🔔 お知らせ','pressing × keeps the list (no detail opened)');
 ok(await page.evaluate(id=>!noticePanelItems.some(n=>String(n.id)===id),firstId),'hidden notice not in the panel');
 ok(await page.evaluate(()=>noticeItems().length)===before,'original notices are not deleted');
 ok(await page.evaluate(id=>JSON.parse(recordStorage.getItem(ukey('noticeHidden'))).includes(id),firstId),'saved to the user\'s own record');
 await page.evaluate(()=>{gCloseModal();noticeOpen();});await page.waitForTimeout(100);
 ok(await page.locator('.notice-list-row').count()===before-1,'still hidden after reopening');
 ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no sideways overflow');
 // ほかの人の記録には入らない（キーが本人ごと）
 ok(await page.evaluate(()=>ukey('noticeHidden').startsWith(currentUserId+':')||ukey('noticeHidden').includes(currentUserId)),'key is per user');
 if(width===390)await page.screenshot({path:path.join(HERE,'bell-390.png')});
 ok(errors.length===0,'no page errors '+errors.join('|'));
 await page.close();
}}finally{await browser.close();server.close();}
console.log('チェック '+n+'件　✅ '+(n-f)+'　❌ '+f);process.exit(f?1:0);
