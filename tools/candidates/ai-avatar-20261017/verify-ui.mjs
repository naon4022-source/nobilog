import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const source=await readFile(new URL(process.argv.includes('--main')?'../../../site-assets/profile-photos.js':'./profile-photos.js',import.meta.url),'utf8'),images=await readFile(new URL('../../../site-assets/learning-images.js',import.meta.url),'utf8'),css=await readFile(new URL('../../../site-assets/profile-photos.css',import.meta.url),'utf8');
let checks=0;const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
const browser=await chromium.launch({headless:true});
try{
 for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:1100}}),external=[],errors=[];
  await page.route('**/*',r=>{external.push(r.request().url());return r.abort();});page.on('pageerror',e=>errors.push(e.message));
  await page.setContent('<style>body{margin:12px;font:18px sans-serif}*{box-sizing:border-box}</style><main id="host"></main>');
  await page.addStyleTag({content:css});await page.addScriptTag({content:images});await page.addScriptTag({content:source});
  await page.evaluate(async()=>{
   window.F={live:true,plan:'unlimit',posts:[],reads:[],items:[],ready:true,bad:false,release:null};
   const canvas=document.createElement('canvas');canvas.width=canvas.height=16;canvas.getContext('2d').fillRect(0,0,16,16);F.blob=await new Promise(r=>canvas.toBlob(r,'image/png'));
   F.api={same:()=>F.live,plan:()=>F.plan,newId:()=>'11111111-1111-4111-8111-111111111111',generatorStatus:async()=>({ready:F.ready,items:F.items,credits:3}),imageBlob:async id=>{F.reads.push(id);if(id!=='a'.repeat(64))throw Error('foreign');return F.blob;},post:async(path,body)=>{
    F.posts.push({path,body});
    if(path==='/avatar-generate'){
     await new Promise(r=>F.release=r);
     return {ok:true,status:200,json:{real:true,candidates:[{src:F.bad?'https://outside.invalid/private.png':'/learning-image?id='+'a'.repeat(64)}]}};
    }
    return {ok:true,status:200,json:{avatar:{rev:1}}};
   },saved:()=>F.saved=true};
   F.view=NobiPhotos.openAvatar(document.querySelector('#host'),F.api);
  });
  await page.getByText('✨ AIでアイコンを作る（UNLIMIT）',{exact:true}).click();
  await page.getByRole('button',{name:'生成を依頼する',exact:true}).waitFor();
  eq(await page.evaluate(()=>F.posts.length),0);eq((await page.locator('.pp-gen').textContent()).includes('3回分'),true);
  await page.getByLabel('自己紹介',{exact:true}).fill('青と猫が好きです。');await page.getByRole('button',{name:'生成を依頼する',exact:true}).click();
  eq(await page.getByRole('button',{name:'生成を依頼する',exact:true}).isDisabled(),true);eq(await page.evaluate(()=>F.posts.length),1);
  await page.evaluate(()=>F.release());await page.locator('.pp-cands img').waitFor();
  eq((await page.locator('.pp-cands img').getAttribute('src')).startsWith('data:image/png;base64,'),true);
  eq(await page.evaluate(()=>F.reads),['a'.repeat(64)]);eq(await page.evaluate(()=>F.posts.filter(x=>x.path==='/avatar').length),0);
  await page.getByRole('button',{name:'この候補を使う',exact:true}).click();
  await page.waitForFunction(()=>F.view.state().hasImage===true);eq(await page.evaluate(()=>F.view.state().hasImage),true);eq(await page.evaluate(()=>F.posts.length),1);
  await page.getByRole('button',{name:'この丸で保存する',exact:true}).click();await page.waitForFunction(()=>F.saved===true);
  eq(await page.evaluate(()=>F.posts[1].path),'/avatar');eq(await page.evaluate(()=>F.posts[1].body.width),256);
  // Reopen from saved metadata; GET and private image reads only.
  await page.evaluate(()=>{F.view.destroy();F.posts=[];F.reads=[];F.items=[{state:'done',src:'/learning-image?id='+'a'.repeat(64)}];F.view=NobiPhotos.openAvatar(document.querySelector('#host'),F.api);});
  await page.getByText('✨ AIでアイコンを作る（UNLIMIT）',{exact:true}).click();await page.locator('.pp-cands img').waitFor();
  eq(await page.evaluate(()=>F.posts.length),0);eq(await page.evaluate(()=>F.reads),['a'.repeat(64)]);
  // Reject provider URLs rather than loading an external image without auth.
  await page.evaluate(()=>{F.bad=true;F.items=[];});await page.getByLabel('自己紹介',{exact:true}).fill('緑が好きです。');await page.getByRole('button',{name:'生成を依頼する',exact:true}).click();await page.evaluate(()=>F.release());
  await page.getByText('候補を安全に開けませんでした。新しく作り直さず「保存した候補を確認」で確認できます。',{exact:true}).waitFor();
  eq(await page.locator('.pp-cands img').count(),0);eq(await page.getByLabel('自己紹介',{exact:true}).inputValue(),'緑が好きです。');
  eq(await page.evaluate(()=>F.reads.length),1);eq(external,[]);eq(errors,[]);
  eq(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.evaluate(()=>{F.view.destroy();F.plan='pro';F.posts=[];F.view=NobiPhotos.openAvatar(document.querySelector('#host'),F.api);});
  eq(await page.getByLabel('自己紹介',{exact:true}).count(),0);eq(await page.evaluate(()=>F.posts.length),0);
  await page.close();
 }
 console.log('Avatar UI candidate: '+checks+' browser checks passed; private authenticated image adapter, explicit generation, 3-credit notice, manual crop/save, reopening without generation, hostile URL rejection, two widths; no API');
}finally{await browser.close();}
