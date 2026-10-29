// Real local workerd RPC / byte streams. This does not prove production auth.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
assert.equal(spawnSync('pgrep',['-f','^(/[^ ]*/)?bash .*\\.claude/verify/run.sh$']).status,1,'wait for the whole-app suite to finish');
const cache=path.join(os.homedir(),'.npm/_npx');
const packages=fs.readdirSync(cache).map(dir=>path.join(cache,dir,'node_modules/wrangler/package.json')).filter(file=>fs.existsSync(file)).map(file=>({file,version:JSON.parse(fs.readFileSync(file)).version})).sort((a,b)=>b.version.localeCompare(a.version,undefined,{numeric:true}));
assert.ok(packages.length,'use an existing runtime only; no dependency install');
const require=createRequire(packages[0].file),{build}=require('esbuild'),{Miniflare,Log,LogLevel}=require('miniflare');
const bundled=await build({entryPoints:[fileURLToPath(new URL('./runtime-fixture.mjs',import.meta.url))],bundle:true,write:false,format:'esm',platform:'neutral',external:['cloudflare:workers']});
let outbound=0;
const workerName='nobi-coop-rpc-fixture';
const runtime=new Miniflare({cf:false,telemetry:{enabled:false},unsafeEnableSharedStorage:false,log:new Log(LogLevel.ERROR),workers:[{config:{
 name:workerName,compatibilityDate:'2026-10-19',
 manifest:{mainModule:'fixture.mjs',modules:{'fixture.mjs':{type:'esm',contents:bundled.outputFiles[0].text}}},
 env:{FIXTURE_ONLY:{type:'text',value:'true'},COOP_STORY_EVENTS:{type:'durable-object',worker:workerName,exportName:'CoopStoryEvents'}},
 exports:{CoopStoryEvents:{type:'durable-object',storage:'sqlite'}}
 },dev:{unsafeRegisterWorker:false,outboundService:{type:'fetcher',handler:()=>{outbound++;return new Response(null,{status:403});}}}}]});
const readers=[];
async function packet(reader){
 let timer;
 try{return await Promise.race([reader.read(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('native stream deadline')),5000);})]);}finally{clearTimeout(timer);}
}
try{
 for(const slot of ['one','two','three']){
  const response=await runtime.dispatchFetch('http://localhost/watch',{headers:{'X-Fixture-Slot':slot}});
  assert.equal(response.status,200);const reader=response.body.getReader();readers.push(reader);
  const ready=await packet(reader);assert.equal(ready.done,false);assert.match(new TextDecoder().decode(ready.value),/event: ready\ndata: \{"revision":0\}/);
 }
 const denied=await runtime.dispatchFetch('http://localhost/watch',{headers:{'X-Fixture-Slot':'outsider'}});assert.equal(denied.status,403);
 const notified=await runtime.dispatchFetch('http://localhost/invalidate',{method:'POST',headers:{'X-Fixture-Slot':'one'}});
 assert.equal(notified.status,200);assert.deepEqual(await notified.json(),{notified:3});
 for(const reader of readers){const refresh=await packet(reader);assert.equal(refresh.done,false);assert.equal(new TextDecoder().decode(refresh.value),'event: refresh\ndata: {"revision":7}\n\n');}
 await readers.pop().cancel();
 const afterClose=await runtime.dispatchFetch('http://localhost/invalidate',{method:'POST',headers:{'X-Fixture-Slot':'one'}});
 // RPC cancellation propagation can be asynchronous; the hub's own tests cover
 // immediate cleanup. Native delivery above is the assertion of this harness.
 assert.equal(afterClose.status,200);await afterClose.arrayBuffer();
 assert.equal(outbound,0);
 console.log('Coop native RPC: three local workerd clients receive ready and identical answer-free revision invalidations; synthetic outsider blocked; no outbound network. Production owner authorization and browser integration remain separate.');
}finally{
 await Promise.allSettled(readers.map(reader=>reader.cancel()));await runtime.dispose();
}
