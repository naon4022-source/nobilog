import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const js=await readFile(new URL('./button.js',import.meta.url),'utf8'),css=await readFile(new URL('../../../site-assets/profile-photos.css',import.meta.url),'utf8');
assert.equal(js,await readFile(new URL('../../../site-assets/screenshot-button.js',import.meta.url),'utf8'));
const html='<meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>'+css+'</style><div id="full"><button id="enter">全画面</button></div><script>'+js+`</script><script>
window.uid='a';window.token=1;window.plan='free';window.seen={};window.posts=[];window.intros=[];window.fail=false;window.delay=false;
document.getElementById('enter').onclick=()=>document.getElementById('full').requestFullscreen();
window.adapter=NobiScreenshotButton.mount({context:()=>{const owner=uid,t=token;return owner?{same:()=>uid===owner&&token===t,allowed:()=>['standard','pro','unlimit'].includes(plan),seenIntro:()=>seen[owner]===true,acknowledge:()=>seen[owner]=true,post:async(path,body)=>{posts.push({owner,path,body});return fail?{ok:false,status:503}:{ok:true,status:201};}}:null;},capture:async opts=>{intros.push(opts.intro);opts.acknowledge();return new File(['synthetic'],uid+'.png',{type:'image/png'});},pixels:async file=>{if(delay)return new Promise(r=>{window.releasePixels=()=>r({width:1,height:1,data:file.name});});return {width:1,height:1,data:file.name};}});
</script>`;
const server=createServer((_,r)=>{r.setHeader('Content-Type','text/html');r.end(html);});await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser,n=0;const eq=(a,b)=>{assert.deepEqual(a,b);n++;};
try{
 browser=await chromium.launch({headless:true});
 for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];let outside=0;
  page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():(outside++,r.abort()));await page.goto('http://127.0.0.1:'+server.address().port);
  const fab=page.getByRole('button',{name:'画面を囲んで保存',exact:true});eq(await fab.isVisible(),false);
  await page.evaluate(()=>{plan='mini';adapter.refresh();});eq(await fab.isVisible(),false);
  await page.evaluate(()=>{plan='standard';fail=true;adapter.refresh();});await fab.click();await page.getByRole('button',{name:'もう一度保存する',exact:true}).waitFor();
  eq(await page.evaluate(()=>posts.length),1);eq(await page.evaluate(()=>intros),[true]);eq(await fab.isVisible(),false);
  await page.evaluate(()=>fail=false);await page.getByRole('button',{name:'もう一度保存する',exact:true}).click();await page.getByText(/保存しました。アイコン/).waitFor();
  eq(await page.evaluate(()=>posts[0].body.data===posts[1].body.data),true);eq(await page.evaluate(()=>posts.every(p=>p.path==='/photos'&&p.owner==='a')),true);
  await page.getByRole('button',{name:'閉じる',exact:true}).click();await fab.click();await page.getByText(/保存しました。アイコン/).waitFor();eq(await page.evaluate(()=>intros),[true,false]);
  await page.getByRole('button',{name:'閉じる',exact:true}).click();
  await page.evaluate(()=>{delay=true;});await fab.click();await page.waitForFunction(()=>typeof releasePixels==='function');
  await page.evaluate(()=>{window.oldRelease=releasePixels;uid='b';token++;delay=false;adapter.refresh();});
  await fab.click();await page.getByText(/保存しました。アイコン/).waitFor();await page.evaluate(()=>oldRelease());await page.waitForTimeout(50);
  eq(await page.evaluate(()=>posts.filter(p=>p.owner==='b').map(p=>p.body.data)),['b.png']);eq(await page.evaluate(()=>intros.at(-1)),true);
  await page.getByRole('button',{name:'閉じる',exact:true}).click();const before=await page.evaluate(()=>posts.length);
  await page.evaluate(()=>{delay=true;releasePixels=null;});await fab.click();await page.waitForFunction(()=>typeof releasePixels==='function');
  await page.evaluate(()=>{plan='mini';adapter.refresh();releasePixels();});await page.waitForTimeout(50);
  eq(await page.evaluate(()=>posts.length),before);eq(await page.locator('.pp-sheet:visible').count(),0);eq(await fab.isVisible(),false);
  await page.evaluate(()=>{uid=null;token++;adapter.refresh();});eq(await page.locator('.pp-sheet:visible').count(),0);eq(await fab.isVisible(),false);
  await page.evaluate(()=>{uid='c';plan='pro';delay=false;adapter.refresh();});await page.locator('#enter').click();await page.waitForFunction(()=>!!document.fullscreenElement);
  await page.locator('#full .pp-camera-fab').waitFor();eq(await page.locator('#full .pp-camera-fab').count(),1);await fab.click();await page.getByText(/保存しました。アイコン/).waitFor();eq(await page.locator('#full .pp-sheet').count(),1);
  await page.evaluate(()=>document.exitFullscreen());await page.waitForFunction(()=>!document.fullscreenElement);await page.locator('body > .pp-camera-fab').waitFor({state:'attached'});eq(await page.locator('body > .pp-camera-fab').count(),1);
  await page.evaluate(()=>adapter.destroy());eq(await page.locator('.pp-camera-fab,.pp-sheet').count(),0);eq(outside,0);eq(errors,[]);await page.close();
 }
 console.log('Screenshot save adapter: '+n+' checks passed; two widths, plan lock, owner-bound post, stable retry payload, per-owner introduction, late pixel conversion cannot cross accounts, logout and native fullscreen portal; fake capture/storage only');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
