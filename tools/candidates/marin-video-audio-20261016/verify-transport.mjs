import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {create,inspectWave,requestHash} from './transport.mjs';
const plan=JSON.parse(await readFile(new URL('../../../教材整理/Claude_Codex共有/数学全体制作/メディア/制作ソース/音声共有/Marin固定_20261014/音声生成ジョブ_20261016.json',import.meta.url),'utf8'));
const [key,body]=Object.entries(plan.requests)[0];let checks=0;const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
function wave(){
 const bytes=new Uint8Array(44+8000),v=new DataView(bytes.buffer),tag=(i,s)=>{for(let j=0;j<s.length;j++)bytes[i+j]=s.charCodeAt(j);};
 tag(0,'RIFF');v.setUint32(4,bytes.length-8,true);tag(8,'WAVE');tag(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,8000,true);v.setUint32(28,16000,true);v.setUint16(32,2,true);v.setUint16(34,16,true);tag(36,'data');v.setUint32(40,8000,true);
 for(let i=44;i<bytes.length;i+=2)v.setInt16(i,Math.round(2000*Math.sin(i/10)),true);return bytes;
}
const valid=wave();eq(inspectWave(valid).seconds,0.5);eq(await requestHash(body),key);
const streaming=valid.slice();new DataView(streaming.buffer).setUint32(4,0xffffffff,true);new DataView(streaming.buffer).setUint32(40,0xffffffff,true);eq(inspectWave(streaming).seconds,0.5);
for(const mutate of [b=>b.slice(0,43),b=>{b[0]=0;return b;},b=>{b.fill(0,44);return b;},b=>{new DataView(b.buffer).setUint16(20,3,true);return b;},b=>{new DataView(b.buffer).setUint16(32,4,true);return b;},b=>b.slice(0,-1)]){assert.throws(()=>inspectWave(mutate(valid.slice())));checks++;}
function fixture(options={}){
 const state={events:[],saved:null,failures:[],calls:[],allow:true};
 const adapter=create({instructions:body.instructions,
  authorize:async()=>{state.events.push('authorize');return state.allow&&options.authorized!==false;},
  lookup:async()=>options.body||body,receipt:async()=>options.saved||state.saved,
  getKey:async()=>{state.events.push('key');return options.noKey?'':'fixture-private-key';},
  reserve:async()=>{state.events.push('reserve');if(options.reserve)await options.reserve(state);if(options.noLease)return {ok:false};state.saved={state:'pending'};return {ok:true,id:'fixture-lease'};},
  commit:async result=>{state.events.push('commit');if(options.commitFails)return false;state.saved={state:'complete',bytes:result.bytes.slice()};return true;},
  uncertain:async outcome=>state.failures.push(outcome),timeoutMs:options.timeoutMs||30000,signal:options.signal||null,
  fetchImpl:async(url,init)=>{state.events.push('fetch');state.calls.push({url,init});if(options.fetch)return options.fetch(url,init);return new Response(options.audio||valid,{status:options.status||200,headers:options.headers||{'Content-Type':'audio/wav'}});}
 });return {state,adapter};
}
{
 const {state,adapter}=fixture();const result=await adapter.generate(key);eq(result.ok,true);eq(result.cached,false);eq(state.calls.length,1);eq(state.events.indexOf('reserve')<state.events.indexOf('fetch'),true);eq(JSON.parse(state.calls[0].init.body),body);eq(state.calls[0].url,'https://api.openai.com/v1/audio/speech');eq(state.calls[0].init.redirect,'error');
 const replay=await adapter.generate(key);eq(replay.cached,true);eq(state.calls.length,1);eq(state.events.filter(x=>x==='reserve').length,1);replay.bytes[0]=0;eq(state.saved.bytes[0],82);
}
for(const options of [{authorized:false},{noLease:true},{noKey:true},{body:{...body,voice:'coral'}},{body:{...body,speed:0.8}},{saved:{state:'pending'}}]){
 const {state,adapter}=fixture(options);eq((await adapter.generate(key)).ok,false);eq(state.calls.length,0);
}
{
 const {state,adapter}=fixture({authorized:false});await adapter.generate(key);eq(state.events.includes('key'),false);
}
for(const options of [{status:429},{audio:new Uint8Array(50)},{audio:valid.slice(0,50)},{headers:{'Content-Type':'text/plain'}},{headers:{'Content-Type':'audio/wav','Content-Length':'9999'}},{commitFails:true}]){
 const {state,adapter}=fixture(options);eq((await adapter.generate(key)).error,'result_unconfirmed');eq(state.calls.length,1);eq(state.failures.length,1);eq(state.failures[0].attempted,true);
 eq((await adapter.generate(key)).error,'prior_result_unconfirmed');eq(state.calls.length,1);
}
{
 const {state,adapter}=fixture({commitFails:true});await adapter.generate(key);const restarted=fixture({saved:state.saved});eq((await restarted.adapter.generate(key)).error,'prior_result_unconfirmed');eq(restarted.state.calls.length,0);
 state.saved=null;eq((await adapter.generate(key)).error,'prior_result_unconfirmed');eq(state.calls.length,1);
}
{
 const {state,adapter}=fixture({reserve:async s=>{s.allow=false;}});eq((await adapter.generate(key)).ok,false);eq(state.calls.length,0);eq(state.failures[0].attempted,false);
}
{
 let release;const {state,adapter}=fixture({fetch:()=>new Promise(r=>release=r)});const pending=adapter.generate(key);while(!release)await new Promise(r=>setTimeout(r,0));eq((await adapter.generate(key)).error,'busy');release(new Response(valid,{headers:{'Content-Type':'audio/wav'}}));eq((await pending).ok,true);eq(state.calls.length,1);
}
{
 const {state,adapter}=fixture({timeoutMs:1,fetch:async(_url,init)=>new Promise((_r,reject)=>init.signal.addEventListener('abort',()=>reject(Error('fixture-private-key secret error'))))});
 const result=await adapter.generate(key);eq(result.error,'result_unconfirmed');eq(JSON.stringify(result).includes('fixture-private-key'),false);eq(state.calls.length,1);
}
{
 let cancelled=false,index=0;
 const stream=new ReadableStream({pull(c){c.enqueue(new Uint8Array(index++?1:20*1024*1024));},cancel(){cancelled=true;}});
 const {state,adapter}=fixture({fetch:async()=>new Response(stream,{headers:{'Content-Type':'audio/wav'}})});
 eq((await adapter.generate(key)).error,'result_unconfirmed');eq(cancelled,true);eq(state.calls.length,1);
}
{
 const parent=new AbortController();parent.abort();const {state,adapter}=fixture({signal:parent.signal});eq((await adapter.generate(key)).error,'stopped');eq(state.calls.length,0);eq(state.events.includes('reserve'),false);
}
{
 const parent=new AbortController(),{state,adapter}=fixture({signal:parent.signal,fetch:async(_url,init)=>new Promise((_r,reject)=>{init.signal.addEventListener('abort',()=>reject(Error('stopped by global gate')));parent.abort();})});
 eq((await adapter.generate(key)).error,'result_unconfirmed');eq(state.calls.length,1);eq(state.failures[0].attempted,true);
}
console.log('Marin speech adapter: '+checks+' checks passed; synthetic PCM only, pinned request hash, authorization/reservation before fetch, replay, serial execution, bounded WAV validation, silence/invalid data, timeout and no automatic retry; zero real API calls');
