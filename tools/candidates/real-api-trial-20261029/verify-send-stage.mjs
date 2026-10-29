import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
const {chromium}=createRequire(import.meta.url)('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const here=new URL('./',import.meta.url),server=createServer((req,res)=>{res.setHeader('Content-Type','text/html');res.end('<div id="host"></div>');});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let checks=0,browser;const ok=(v,m)=>{assert.ok(v,m);checks++;};const observations=[];
try{
 browser=await chromium.launch({headless:true});
 for(const version of ['before','candidate'])for(const failure of ['save','post','success']){
  const page=await browser.newPage();let outside=0;
  await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():(outside++,route.abort()));
  await page.goto('http://127.0.0.1:'+server.address().port);
  await page.addScriptTag({content:await readFile(new URL('messages.'+version+'.js',here),'utf8')});
  await page.evaluate(failure=>{
   window.posts=[];window.saved=[];window.ids=0;window.drafts={};
   NobiMessages.mount(document.getElementById('host'),{tab:'ai',same:()=>true,
    plan:async()=>({provisional:true,plan:'pro',features:{chat:true},aiLeft:300,aiLimit:300}),
    get:async()=>({items:[],provider:'openai',ready:true}),draftGet:k=>drafts[k]||'',draftSet:(k,v)=>drafts[k]=v,newId:()=>`synthetic_${++ids}`,
    retrySave:async(marker,text,images)=>{saved.push({marker,text,images});if(failure==='save')throw Error('retry_save_unconfirmed');},
    post:async(path,body)=>{posts.push({path,body});if(failure==='post')throw Error('synthetic lost response');return {ok:true,json:{item:{...body,answer:'符号をくらべて考えよう。',mock:false,model:'gpt-6-luna',at:1},creditsUsed:1}};}
   });
  },failure);
  await page.getByRole('button',{name:'送信する',exact:true}).waitFor();
  await page.getByRole('textbox',{name:'相談したいこと'}).fill('Synthetic signs question');
  await page.getByRole('button',{name:'送信する',exact:true}).click();
  if(failure!=='success')await page.getByRole('button',{name:'もう一度送る',exact:true}).waitFor();
  else await page.getByText('送信しました。1回分を使いました。',{exact:true}).waitFor();
  const state=await page.evaluate(()=>({posts,saved,ids,status:document.querySelector('.msg-status').textContent,chat:document.querySelector('.msg-chat').textContent}));
  ok(state.saved.length===1,'one persistence attempt');ok(state.posts.length===(failure==='save'?0:1),'paid POST only after persistence');ok(state.ids===1,'single stable id');ok(outside===0,'no external network');
  if(version==='before'&&failure!=='success')ok(state.status.includes('通信が切れたかも'),'old failure conflates stages');
  if(version==='candidate'&&failure==='save')ok(state.status.includes('AIにはまだ送っていません')&&!state.status.includes('送信結果'),'pre-send failure classified accurately');
  if(version==='candidate'&&failure==='post')ok(state.status.includes('送信結果を確認できません')&&!state.status.includes('まだ送っていません'),'unknown outcome never claimed unsent');
  if(failure==='success')ok(state.chat.includes('符号をくらべて'),'success still renders');
  if(failure==='post'){
   const id=state.posts[0].body.id;await page.getByRole('button',{name:'もう一度送る',exact:true}).click();
   await page.getByRole('button',{name:'もう一度送る',exact:true}).waitFor();
   ok(await page.evaluate(id=>posts.length===2&&posts[1].body.id===id,id),'explicit retry retains exact request id');
  }
  observations.push({version,failure,posts:state.posts.length,status:state.status});await page.close();
 }
 const inputs=[];for(const file of ['messages.before.js','messages.candidate.js','messages-patch.json','verify-send-stage.mjs'])inputs.push({file,sha256:createHash('sha256').update(await readFile(new URL(file,here))).digest('hex')});
 await writeFile(new URL('send-stage-result.json',here),JSON.stringify({status:'passed isolated UI stage classification',checks,realAPICalls:0,mainChanged:false,observations,inputs},null,2)+'\n');console.log(checks+' checks passed; real API0, no external requests; before/send/unknown outcomes distinguished.');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
