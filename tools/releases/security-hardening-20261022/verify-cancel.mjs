import assert from 'node:assert/strict';import vm from 'node:vm';import {readFile,writeFile} from 'node:fs/promises';
const H=new URL('./',import.meta.url),html=await readFile(new URL('candidate/pages/index.html',H),'utf8'),start=html.indexOf('    async function tryLogin(linkProvider) {'),end=html.indexOf('    async function authLegacyEnter()',start),source=html.slice(start,end);let checks=0;
for(const action of ['link','unlink']){
 let release,enter;const entered=new Promise(r=>enter=r),response=new Promise(r=>release=r);let logins=0,links=0,applied=0;
 const nodes={'login-pin':{value:'0000'},'login-err':{innerText:''}};
 const ctx=vm.createContext({Date,JSON,Error,SYNC_URL:'https://synthetic.invalid',document:{getElementById:id=>nodes[id]},googleManagePending:{action},pinFail:0,pinLockUntil:0,authLegacyBusy:false,authLegacyTicket:'',turnstileToken:'synthetic-confirmed',turnstileLoadedAt:Date.now(),authSetBusy(){},turnstileReset(){},previewPasswordEnter:async()=>false,authStart(){links++;},authLegacyEnter:async()=>logins++,authGoogleManageComplete:async()=>applied++,fetch:async()=>{enter();await response;return {ok:true,status:200,json:async()=>({ticket:'synthetic-proof'})};}});
 vm.runInContext(source,ctx);const pending=ctx.tryLogin();await entered;ctx.googleManagePending=null;release();await pending;
 assert.equal(logins,0);checks++;assert.equal(links,0);checks++;assert.equal(applied,0);checks++;assert.equal(ctx.authLegacyTicket,'');checks++;assert.equal(ctx.authLegacyBusy,false);checks++;
}
await writeFile(new URL('cancel-result.json',H),JSON.stringify({status:'passed',checks,scope:'actual tryLogin; cancelled settings action while synthetic proof response pending; no network'},null,2)+'\n');console.log('Google settings cancellation:',checks,'checks passed');
