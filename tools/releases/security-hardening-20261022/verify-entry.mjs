import {readFile,writeFile} from 'node:fs/promises';
import vm from 'node:vm';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const H=new URL('./',import.meta.url),bytes=await readFile(new URL('candidate/pages/index.html',H)),html=bytes.toString();
const a=html.indexOf('    async function tryLogin(linkProvider) {'),b=html.indexOf('    async function authLegacyEnter()',a);assert(a>0&&b>a);
let checks=0;const ok=(v,m)=>{assert(v,m);checks++;};
for(const provider of [undefined,'google','line'])for(const gate of ['ok','missing','expired','denied']){
 const nodes={'login-err':{innerText:''},'login-pin':{value:'0000'}};let requests=0,linked=[],entered=0;
 const C=vm.createContext({googleManagePending:null,document:{getElementById:id=>nodes[id]},Date,Error,JSON,SYNC_URL:'https://synthetic.invalid',pinFail:0,pinLockUntil:0,authLegacyBusy:false,authLegacyTicket:'',turnstileToken:gate==='missing'?'':'synthetic-turnstile',turnstileLoadedAt:Date.now()-(gate==='expired'?300001:0),authSetBusy(){},turnstileReset(){},previewPasswordEnter:async()=>false,authStart:p=>linked.push(p),authLegacyEnter:async()=>entered++,fetch:async()=>{requests++;return {ok:gate!=='denied',status:gate==='denied'?403:200,json:async()=>gate==='denied'?{error:'synthetic refusal'}:{ticket:'synthetic-ticket'}};}});
 vm.runInContext(html.slice(a,b),C);await C.tryLogin(provider);
 if(gate==='ok'){ok(requests===1,'one identity check');ok(provider?linked[0]===provider&&entered===0:entered===1&&linked.length===0,'selected path only');ok(nodes['login-pin'].value==='','input cleared after confirmation');}
 else{ok(linked.length===0&&entered===0,'no transition without confirmation');ok(requests===(gate==='denied'?1:0),'invalid token blocked before network');}
 ok(C.authLegacyBusy===false,'busy state restored');
}
ok(html.includes('onclick="tryLogin(\'google\')"'),'visible explicit Google entry');
ok(html.includes("mode:authLegacyTicket ? 'link'"),'existing link mode retained');
ok(!html.includes("if(linkProvider==='google'){authCreateMode"),'no account creation on linking path');
const sw=await readFile(new URL('candidate/pages/sw.js',H),'utf8');ok(sw.includes('nobilog-app-v2.17.1')&&html.includes('content="2.17.1"'),'version and cache consistent');
await writeFile(new URL('entry-result.json',H),JSON.stringify({status:'passed',checks,htmlSha256:createHash('sha256').update(bytes).digest('hex'),scope:'actual public tryLogin in isolated VM; fake identity gate; no live credentials, Worker or OAuth completion tested'},null,2)+'\n');
console.log('Google explicit entry:',checks,'isolated checks passed');
