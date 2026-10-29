import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const script=await readFile(new URL('./messages.js',import.meta.url),'utf8');
const adapter=await readFile(new URL('./index-adapter.js',import.meta.url),'utf8');
const server=createServer((req,res)=>{res.setHeader('Content-Type','text/html');res.end('<div id="host"></div>');});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser,n=0;const eq=(a,b)=>{assert.deepEqual(a,b);n++;};
try{
 browser=await chromium.launch({headless:true});const page=await browser.newPage();
 await page.goto(`http://127.0.0.1:${server.address().port}`);await page.addScriptTag({content:script});
 const setup=(initial={})=>{
  window.remote=initial;window.posts=[];window.owner='pro';window.saveFail=false;window.next=0;
  window.messagesDraftTimer=null;window.staged='';
  window.cloudSame=who=>who.uid===owner;window.ukey=k=>owner+':'+k;
  window.recordStorage={setItem:(k,v)=>{staged=v;}};
  window.cloudUrl=()=>'/save';
  window.cloudPush=async()=>{const saveOwner=owner,saveValue=staged;if(window.holdSave)await new Promise(resolve=>{window.releaseSave=resolve;});if(saveFail)return false;remote[saveOwner]=JSON.parse(saveValue);return true;};
  window.cloudTry=async()=>({ok:true,json:async()=>({keys:{[owner+':messageDrafts']:JSON.stringify(remote[owner])}})});
  window.open=()=>{
   window.view?.destroy();const own=owner,drafts={...(remote[own]||{})};
   window.messagesDraftMem={uid:own,v:drafts};
   view=NobiMessages.mount(document.getElementById('host'),{tab:'ai',same:()=>owner===own,
    plan:async()=>({provisional:true,plan:'pro',features:{chat:true},aiLimit:300,aiLeft:300}),
    get:async()=>({items:[],provider:'openai',ready:true}),
    draftGet:k=>drafts[k]||'',draftSet:(k,v)=>{drafts[k]=v;},newId:()=>`request_${++next}`,
    retrySave:(marker,text,images)=>messagesRetrySave({uid:own},marker,text,images),
    post:async(path,body)=>{posts.push(body);throw Error('response lost');}});
  };open();
 };
 await page.addScriptTag({content:adapter});await page.evaluate(setup);
 await page.getByRole('button',{name:'送信する',exact:true}).waitFor();
 await page.getByRole('textbox').fill('Synthetic learning question');
 await page.getByRole('button',{name:'送信する',exact:true}).click();await page.waitForFunction(()=>posts.length===1);
 const first=await page.evaluate(()=>posts[0].id);eq(await page.evaluate(()=>!!remote.pro.chatRetry),true);
 await page.evaluate(()=>open());await page.getByRole('button',{name:'送信する',exact:true}).waitFor();
 eq(await page.getByRole('textbox').inputValue(),'Synthetic learning question');
 await page.getByRole('button',{name:'送信する',exact:true}).click();await page.waitForFunction(()=>posts.length===2);
 eq(await page.evaluate(()=>posts[1].id),first);
 await page.evaluate(()=>{saveFail=true;open();});await page.getByRole('button',{name:'送信する',exact:true}).waitFor();
 await page.getByRole('textbox').fill('Changed synthetic question');
 await page.getByRole('button',{name:'送信する',exact:true}).click();await page.getByRole('button',{name:'もう一度送る',exact:true}).waitFor();
 eq(await page.evaluate(()=>posts.length),2);
 await page.evaluate(()=>{saveFail=false;owner='unlimit';open();});await page.getByRole('button',{name:'送信する',exact:true}).waitFor();
 eq(await page.getByRole('textbox').inputValue(),'');
 const persisted=await page.evaluate(()=>remote);
 await page.reload();await page.addScriptTag({content:script});await page.addScriptTag({content:adapter});await page.evaluate(setup,persisted);
 await page.getByRole('button',{name:'送信する',exact:true}).waitFor();
 eq(await page.getByRole('textbox').inputValue(),'Synthetic learning question');
 await page.getByRole('button',{name:'送信する',exact:true}).click();await page.waitForFunction(()=>posts.length===1);
 eq(await page.evaluate(()=>posts[0].id),first);
 await page.evaluate(()=>{holdSave=true;delete window.releaseSave;open();});
 await page.getByRole('button',{name:'\u9001\u4fe1\u3059\u308b',exact:true}).waitFor();
 await page.getByRole('textbox').fill('Another synthetic question');
 await page.evaluate(()=>{const b=document.querySelector('.msg-main');b.click();b.click();});
 await page.waitForFunction(()=>typeof releaseSave==='function');
 eq(await page.evaluate(()=>posts.length),1);
 await page.evaluate(()=>{holdSave=false;releaseSave();});await page.waitForFunction(()=>posts.length===2);
 eq(await page.evaluate(()=>posts.length),2);
 await page.evaluate(()=>{holdSave=true;delete window.releaseSave;open();});
 await page.getByRole('button',{name:'\u9001\u4fe1\u3059\u308b',exact:true}).waitFor();
 await page.getByRole('textbox').fill('Question before owner switch');
 await page.getByRole('button',{name:'\u9001\u4fe1\u3059\u308b',exact:true}).click();
 await page.waitForFunction(()=>typeof releaseSave==='function');
 await page.evaluate(()=>{owner='unlimit';holdSave=false;releaseSave();});
 await page.waitForTimeout(80);eq(await page.evaluate(()=>posts.length),2);
 console.log(`Chat retry browser candidate: ${n} checks passed; remote marker restored after remount, response-loss identity, failed-save blocks paid POST, account separation`);
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
