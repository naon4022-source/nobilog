import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const js=await readFile(new URL('./screenshot.js',import.meta.url),'utf8'),css=await readFile(new URL('./screenshot.css',import.meta.url),'utf8');
assert.equal(js,await readFile(new URL('../../../site-assets/screenshot.js',import.meta.url),'utf8'));
assert.equal(css,await readFile(new URL('../../../site-assets/screenshot.css',import.meta.url),'utf8'));
const server=createServer((req,res)=>{res.setHeader('Content-Type','text/html');res.end('<meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>'+css+'</style><button id="open">囲んで保存</button><script>'+js+'</script><script>window.owner=true;window.acks=0;document.getElementById("open").onclick=()=>{window.result="waiting";NobiScreenshot.capture({same:()=>owner,intro:acks===0,acknowledge:()=>acks++}).then(f=>window.result=f);};</script>');});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser,count=0;
const eq=(a,b)=>{assert.deepEqual(a,b);count++;};
try{
 browser=await chromium.launch({headless:true});
 for(const width of [390,820,1280]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];let outside=0;
  page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>{if(new URL(r.request().url()).hostname==='127.0.0.1')return r.continue();outside++;return r.abort();});
  await page.goto('http://127.0.0.1:'+server.address().port);
  const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=800;c.height=600;const x=c.getContext('2d');x.fillStyle='red';x.fillRect(0,0,400,600);x.fillStyle='blue';x.fillRect(400,0,400,600);return c.toDataURL().split(',')[1];});
  const file={name:'screen.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')};
  await page.evaluate(()=>{window.cameraCalls=0;window.shares=0;Object.defineProperty(navigator.mediaDevices,'getUserMedia',{configurable:true,value:()=>{cameraCalls++;throw Error('camera forbidden');}});Object.defineProperty(navigator.mediaDevices,'getDisplayMedia',{configurable:true,value:undefined});});
  await page.locator('#open').click();eq(await page.getByRole('button',{name:'わかった',exact:true}).count(),1);eq(await page.evaluate(()=>shares),0);
  await page.getByRole('button',{name:'わかった',exact:true}).click();eq(await page.evaluate(()=>acks),1);
  await page.locator('input[type=file]').setInputFiles(file);await page.getByRole('button',{name:'全体を選ぶ',exact:true}).waitFor();
  eq(await page.getByRole('button',{name:'この範囲を確認',exact:true}).isDisabled(),true);
  const rect=await page.locator('.ss-stage canvas').boundingBox();
  await page.mouse.move(rect.x+rect.width*.6,rect.y+rect.height*.2);await page.mouse.down();await page.mouse.move(rect.x+rect.width*.9,rect.y+rect.height*.6,{steps:6});await page.mouse.up();
  await page.getByRole('button',{name:'この範囲を確認',exact:true}).click();await page.getByRole('button',{name:'この画像を使う',exact:true}).waitFor();eq(await page.evaluate(()=>result),'waiting');
  await page.getByRole('button',{name:'この画像を使う',exact:true}).click();await page.waitForFunction(()=>result instanceof File);
  const image=await page.evaluate(async()=>{const b=await createImageBitmap(result),c=document.createElement('canvas');c.width=b.width;c.height=b.height;c.getContext('2d').drawImage(b,0,0);const pixel=[...c.getContext('2d').getImageData(0,0,1,1).data];b.close();return {width:c.width,height:c.height,pixel,type:result.type};});
  eq(Math.abs(image.width-240)<=2,true);eq(Math.abs(image.height-240)<=2,true);eq(image.pixel,[0,0,255,255]);eq(image.type,'image/png');
  eq(await page.evaluate(()=>NobiScreenshot.active()),false);eq(await page.evaluate(()=>document.activeElement.id),'open');
  await page.locator('#open').click();eq(await page.getByRole('button',{name:'わかった',exact:true}).count(),0);
  await page.locator('input[type=file]').setInputFiles(file);await page.getByRole('button',{name:'全体を選ぶ',exact:true}).click();
  await page.keyboard.press('Shift+ArrowLeft');await page.getByRole('button',{name:'この範囲を確認',exact:true}).click();await page.getByRole('button',{name:'囲み直す',exact:true}).click();eq(await page.getByRole('button',{name:'この範囲を確認',exact:true}).isDisabled(),true);
  await page.keyboard.press('Escape');await page.waitForFunction(()=>result===null);
  // Display capture is synthetic too: a generated canvas MediaStream, never a
  // device screen/camera. Its tracks must end before cropping is offered.
  await page.evaluate(()=>{window.stops=0;Object.defineProperty(navigator.mediaDevices,'getDisplayMedia',{configurable:true,value:async options=>{shares++;window.options=options;const c=document.createElement('canvas');c.width=800;c.height=600;c.getContext('2d').fillRect(0,0,800,600);const s=c.captureStream(30);for(const t of s.getTracks()){const old=t.stop.bind(t);t.stop=()=>{stops++;old();};}return s;}});});
  await page.locator('#open').click();await page.getByRole('button',{name:'のびログの画面を選ぶ',exact:true}).click();await page.getByRole('button',{name:'全体を選ぶ',exact:true}).waitFor();eq(await page.evaluate(()=>stops>0),true);eq(await page.evaluate(()=>options.audio),false);eq(await page.evaluate(()=>cameraCalls),0);
  await page.evaluate(()=>owner=false);await page.waitForFunction(()=>result===null);eq(await page.locator('.ss-back').count(),0);await page.evaluate(()=>owner=true);
  // A delayed permission result after cancellation is stopped, not displayed.
  await page.evaluate(()=>Object.defineProperty(navigator.mediaDevices,'getDisplayMedia',{configurable:true,value:()=>new Promise(r=>{window.release=r;})}));
  await page.locator('#open').click();await page.getByRole('button',{name:'のびログの画面を選ぶ',exact:true}).click();await page.keyboard.press('Escape');
  await page.evaluate(()=>{window.delayedStops=0;release({getTracks:()=>[{stop:()=>delayedStops++}]});});await page.waitForFunction(()=>delayedStops===1);eq(await page.locator('.ss-back').count(),0);
  await page.locator('#open').click();await page.getByRole('button',{name:'キャンセル',exact:true}).click();eq(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.evaluate(()=>{const full=document.createElement('div');full.id='native-full';full.append(document.getElementById('open'));document.body.append(full);const enter=document.createElement('button');enter.id='native-enter';enter.textContent='全画面で試す';enter.onclick=()=>full.requestFullscreen();document.body.append(enter);});
  await page.locator('#native-enter').click();await page.waitForFunction(()=>!!document.fullscreenElement);await page.locator('#open').click();
  eq(await page.locator('#native-full > .ss-back').count(),1);await page.locator('input[type=file]').setInputFiles(file);await page.getByRole('button',{name:'全体を選ぶ',exact:true}).click();await page.getByRole('button',{name:'この範囲を確認',exact:true}).click();await page.getByRole('button',{name:'この画像を使う',exact:true}).waitFor();
  await page.evaluate(()=>document.exitFullscreen());await page.locator('body > .ss-back').waitFor();eq(await page.locator('body > .ss-back').isVisible(),true);
  await page.getByRole('button',{name:'この画像を使う',exact:true}).click();await page.waitForFunction(()=>result instanceof File);eq(await page.evaluate(()=>result.type),'image/png');
  eq(errors,[]);eq(outside,0);await page.close();
 }
 console.log('Screenshot candidate: '+count+' checks passed; three widths, first-use consent, pointer crop pixels, keyboard/cancel, preview-only File return, immediate track stop, delayed permission cancellation and owner loss; synthetic media only');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
