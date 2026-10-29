import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {retryMarker} from './chat-retry.mjs';
const source=await readFile(new URL('./index-adapter.js',import.meta.url),'utf8');
let markerRaw='',n=0;
await retryMarker('Synthetic question',[],{get:()=>markerRaw,set:v=>{markerRaw=v;}},()=> 'request_1');
function setup(mode){
 const who={uid:'p_pro',token:'synthetic'},memory=new Map();let same=true,pushes=0,reads=0,remote={};
 const c={crypto,TextEncoder,clearTimeout,encodeURIComponent,JSON,Error,Array,Object,String,
  messagesDraftTimer:null,messagesDraftMem:{uid:who.uid,v:{ask:'Preserve another draft'}},
  cloudSame:()=>same,ukey:k=>who.uid+':'+k,recordStorage:{setItem:(k,v)=>memory.set(k,v)},
  cloudUrl:(path,query)=>path+'?'+query,
  cloudPush:async()=>{pushes++;if(mode==='pushFail')return false;remote=Object.fromEntries(memory);return true;},
  cloudTry:async()=>{reads++;if(mode==='ownerChanged')same=false;if(mode==='readFail')return {ok:false};if(mode==='stale')remote={};return {ok:true,json:async()=>({keys:remote})};}
 };
 vm.runInNewContext(source+'\nthis.save=messagesRetrySave;',c);
 return {save:()=>c.save(who,markerRaw,'Synthetic question',[]),state:()=>({pushes,reads,remote,c})};
}
const good=setup('good');assert.equal(await good.save(),true);n++;
const s=good.state();assert.equal(s.pushes,1);n++;assert.equal(s.reads,1);n++;
const draft=JSON.parse(s.remote['p_pro:messageDrafts']);assert.equal(draft.chatRetry,markerRaw);n++;assert.equal(draft.ask,'Preserve another draft');n++;
for(const mode of ['pushFail','readFail','ownerChanged','stale']){const t=setup(mode);await assert.rejects(t.save());n++;if(mode==='pushFail'){assert.equal(t.state().reads,0);n++;}}
console.log(`Chat retry index adapter: ${n} checks passed; authenticated save/readback, preserved drafts, push failure, read failure, stale data and owner switch`);
