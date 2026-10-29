import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash,webcrypto} from 'node:crypto';
const here=new URL('./',import.meta.url);let checks=0;const eq=(a,b,m)=>{assert.deepEqual(a,b,m);checks++;};
const text='Synthetic signs question',images=[],id='synthetic_request_01';
const hash=createHash('sha256').update(JSON.stringify({text,images})).digest('hex');
const marker=JSON.stringify({version:1,id,hash});
async function run(version,mode){
 const source=await readFile(new URL('retry-adapter.'+version+'.js',here),'utf8');let now=0,waits=0,pushes=0,reads=0,posts=0,same=true,conflict=false,staged='',remote=null;
 const c={crypto:webcrypto,TextEncoder,JSON,Error,Object,Array,String,Promise,Date:{now:()=>now},encodeURIComponent,
 messagesDraftTimer:null,messagesDraftMem:{uid:'p_pro',v:{ask:'Other draft must survive'}},cloudState:{busy:mode.startsWith('busy')},authLeaseBlocked:false,
 clearTimeout(){},cloudSame:()=>same,cloudConflict:()=>conflict,ukey:k=>'p_pro:'+k,
 recordStorage:{setItem(k,v){assert.equal(k,'p_pro:messageDrafts');staged=v;}},cloudUrl:()=>'/synthetic-save',
 setTimeout(resolve,delay){assert.equal(delay,50);now+=delay;waits++;if(mode==='busy-release'&&waits===3)c.cloudState.busy=false;if(mode==='busy-owner')same=false;if(mode==='busy-lease')c.authLeaseBlocked=true;if(mode==='busy-conflict')conflict=true;queueMicrotask(resolve);},
 cloudPush:async()=>{pushes++;if(c.cloudState.busy||mode==='push-fail')return false;remote=JSON.parse(staged);return true;},
 cloudTry:async()=>{reads++;if(mode==='read-owner')same=false;return {ok:mode!=='read-fail',json:async()=>({keys:{'p_pro:messageDrafts':JSON.stringify(mode==='stale'?{}:remote)}})};}
 };
 vm.runInNewContext(source+'\nthis.save=messagesRetrySave;',c);
 let error=null;try{await c.save({uid:'p_pro'},marker,text,images);posts++;}catch(e){error=e.message;}
 return {error,waits,now,pushes,reads,posts,staged:staged?JSON.parse(staged):null,remote};
}
const before=await run('before','busy-release');eq(before.posts,0,'original busy save refuses the first consultation before any model POST');eq(before.error,'retry_save_unavailable','original failure reproduced');eq(before.waits,0,'old adapter does not wait');
const good=await run('candidate','busy-release');eq(good.error,null,'candidate succeeds after existing save completes');eq(good.waits,3,'waits only until current save idle');eq(good.now,150,'bounded simulated150ms, no real sleep');eq(good.pushes,1,'one new durable save');eq(good.reads,1,'one authenticated readback');eq(good.posts,1,'only one subsequent synthetic POST');eq(good.remote.chatRetry,marker,'request identity preserved');eq(good.remote.chat,text,'text preserved');eq(good.remote.chatImages,'[]','image identities preserved');eq(good.remote.ask,'Other draft must survive','other draft preserved');
for(const mode of ['busy-timeout','busy-owner','busy-lease','busy-conflict']){
 const r=await run('candidate',mode);eq(r.posts,0,'no paid POST on '+mode);eq(r.pushes,0,'no save started on '+mode);eq(r.reads,0,'no readback on '+mode);assert(r.error);checks++;eq(r.staged.chatRetry,marker,'draft marker remains on '+mode);assert(r.now<=10000);checks++;
 if(mode==='busy-timeout')eq(r.now,10000,'deadline closes rather than unbounded waiting');
}
for(const mode of ['push-fail','read-fail','stale','read-owner']){
 const r=await run('candidate',mode);eq(r.posts,0,'existing refusal retained '+mode);eq(r.waits,0,'no idle latency '+mode);assert(r.error);checks++;eq(r.staged.chatRetry,marker,'same marker retained '+mode);
}
const immediate=await run('candidate','success');eq(immediate.posts,1,'idle normal send unchanged');eq(immediate.waits,0,'no wait when already idle');eq(immediate.pushes,1,'single immediate save');
const inputs=[];for(const file of ['retry-adapter.before.js','retry-adapter.candidate.js','retry-adapter-patch.json','verify-save-idle.mjs'])inputs.push({file,sha256:createHash('sha256').update(await readFile(new URL(file,here))).digest('hex')});
await writeFile(new URL('save-idle-result.json',here),JSON.stringify({status:'passed isolated save-idle adapter',checks,liveCauseConfirmed:false,mainChanged:false,realAPICalls:0,scope:'Actual before/candidate retry adapters with synthetic durable store and deterministic clock. Original busy failure reproduced; bounded wait, owner/lease/conflict changes, deadline, failed save/readback/stale data and no additional model retries checked.',inputs},null,2)+'\n');
console.log(checks+' checks passed; original busy failure reproduced, bounded wait keeps all save/owner refusals; external/realAPI0.');
