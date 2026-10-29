import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
const {chromium}=createRequire(import.meta.url)('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const here=new URL('./',import.meta.url),server=createServer((req,res)=>{res.setHeader('Content-Type','text/html');res.end('<div id="host"></div>');});await new Promise(r=>server.listen(0,'127.0.0.1',r));
let checks=0,browser;const eq=(a,b,m)=>{assert.deepEqual(a,b,m);checks++;};
try{
 browser=await chromium.launch({headless:true});
 for(const version of ['before','candidate']){
  const page=await browser.newPage();let outside=0;await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():(outside++,r.abort()));
  await page.goto('http://127.0.0.1:'+server.address().port);await page.addScriptTag({content:await readFile(new URL('messages.candidate.js',here),'utf8')});
  await page.addScriptTag({content:await readFile(new URL('retry-adapter.'+version+'.js',here),'utf8')});
  await page.evaluate(()=>{
   window.posts=[];window.pushes=0;window.reads=0;window.waitObserved=false;window.staged='';window.remote={};window.owner='p_pro';window.cloudState={busy:true};window.authLeaseBlocked=false;window.messagesDraftTimer=null;window.messagesDraftMem={uid:owner,v:{ask:'Preserve another synthetic draft'}};
   window.cloudSame=who=>who.uid===owner;window.cloudConflict=()=>false;window.ukey=k=>owner+':'+k;window.cloudUrl=()=>'/synthetic-save';
   window.recordStorage={setItem(k,v){staged=v;setTimeout(()=>{cloudState.busy=false;},120);}};
   window.cloudPush=async()=>{pushes++;if(cloudState.busy)return false;remote=JSON.parse(staged);return true;};
   window.cloudTry=async()=>{reads++;return {ok:true,json:async()=>({keys:{[owner+':messageDrafts']:JSON.stringify(remote)}})};};
   NobiMessages.mount(document.getElementById('host'),{tab:'ai',same:()=>true,
    plan:async()=>({provisional:true,plan:'pro',features:{chat:true},aiLeft:300,aiLimit:300}),get:async()=>({items:[],provider:'openai',ready:true}),
    draftGet:k=>messagesDraftMem.v[k]||'',draftSet:(k,v)=>messagesDraftMem.v[k]=v,newId:()=> 'synthetic_request_01',
    retrySave:(marker,text,images)=>messagesRetrySave({uid:owner},marker,text,images),
    post:async(path,body)=>{posts.push({path,body,persisted:JSON.parse(remote.chatRetry),savedText:remote.chat});return {ok:true,json:{item:{...body,answer:'負の数を引くと、正の数を加えます。',mock:false,real:true,model:'gpt-6-luna',at:1},creditsUsed:1}};}
   });
  });
  await page.getByRole('button',{name:'送信する',exact:true}).waitFor();await page.getByRole('textbox',{name:'相談したいこと'}).fill('Synthetic signs question');await page.getByRole('button',{name:'送信する',exact:true}).click();
  if(version==='before'){
   await page.getByText('送信前の下書きを保存・確認できませんでした。AIにはまだ送っていません。入力は残っています。保存状況を確認してから、もう一度送ってください。',{exact:true}).waitFor();
   eq(await page.evaluate(()=>posts.length),0,'actual old adapter with busy autosave prevents POST');eq(await page.evaluate(()=>reads),0,'failed old save has no false readback');
  }else{
   await page.getByText('送信しました。1回分を使いました。',{exact:true}).waitFor();
   const s=await page.evaluate(()=>({posts,pushes,reads,remote}));eq(s.posts.length,1,'one click leads to one POST after autosave idle');eq(s.pushes,1,'no repeated full-save calls');eq(s.reads,1,'actual adapter readback required');eq(s.posts[0].body.id,s.posts[0].persisted.id,'exact durable request id precedes POST');eq(s.posts[0].savedText,s.posts[0].body.text,'same text verified before POST');eq(s.remote.ask,'Preserve another synthetic draft','unrelated draft retained');
   eq(await page.getByRole('textbox',{name:'相談したいこと'}).inputValue(),'','success clears submitted draft');
  }
  eq(outside,0,'no external requests');await page.close();
 }
 const inputs=[];for(const file of ['messages.candidate.js','retry-adapter.before.js','retry-adapter.candidate.js','verify-save-idle-browser.mjs'])inputs.push({file,sha256:createHash('sha256').update(await readFile(new URL(file,here))).digest('hex')});
 await writeFile(new URL('save-idle-browser-result.json',here),JSON.stringify({status:'passed isolated actual UI/adapter',checks,realAPICalls:0,mainChanged:false,liveCauseConfirmed:false,inputs,scope:'One explicit click through actual messages candidate and before/candidate retry adapters, real browser timers, synthetic save/readback. Original busy failure reproduced; candidate waits120ms and sends once only after matching remote id/text. No real server or records.'},null,2)+'\n');console.log(checks+' actual UI/adapter checks passed; external/realAPI0.');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
