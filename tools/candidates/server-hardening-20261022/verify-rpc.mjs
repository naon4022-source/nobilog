// Actual local workerd + Durable Object storage, synthetic traffic only.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const cache=path.join(os.homedir(),'.npm/_npx');
const candidates=fs.readdirSync(cache).map(dir=>path.join(cache,dir,'node_modules/wrangler/package.json')).filter(file=>fs.existsSync(file)).map(file=>({file,version:JSON.parse(fs.readFileSync(file)).version}));
candidates.sort((a,b)=>b.version.localeCompare(a.version,undefined,{numeric:true}));
assert.ok(candidates.length,'an existing local runtime is required; no install or account login');
const require=createRequire(candidates[0].file),{Miniflare,Log,LogLevel}=require('miniflare'),{build}=require('esbuild');
const entry=fileURLToPath(new URL('./fixture-worker.mjs',import.meta.url));
const bundle=await build({entryPoints:[entry],bundle:true,format:'esm',platform:'neutral',external:['cloudflare:workers'],write:false,metafile:true});
let outbound=0;
const workerName='nobi-security-fixture';
const mf=new Miniflare({cf:false,telemetry:{enabled:false},unsafeEnableSharedStorage:false,log:new Log(LogLevel.ERROR),workers:[{config:{
 name:workerName,compatibilityDate:'2026-10-19',
 manifest:{mainModule:'fixture.mjs',modules:{'fixture.mjs':{type:'esm',contents:bundle.outputFiles[0].text}}},
 env:{FIXTURE_ONLY:{type:'text',value:'true'},APP_ORIGIN:{type:'text',value:'https://nobilog.pages.dev'},NOBI_SECURITY_GATE:{type:'durable-object',worker:workerName,exportName:'NobiSecurityGate'}},
 exports:{NobiSecurityGate:{type:'durable-object',storage:'sqlite'}}
 },dev:{unsafeRegisterWorker:false,stripCfConnectingIp:false,outboundService:{type:'fetcher',handler:()=>{outbound++;return new Response(null,{status:403});}}}}]});
try{
 // The fixture fixes the server clock. Request data cannot select time or quota.
 const result=await Promise.all(Array.from({length:50},()=>mf.dispatchFetch('http://localhost/auth/legacy',{method:'POST',headers:{'Content-Type':'application/json','CF-Connecting-IP':'203.0.113.40'},body:'{}'})));
 const accepted=result.filter(r=>r.status===200).length;
 assert.equal(accepted,20,'concurrent DO transactions cannot over-admit the auth bucket');
 assert.equal(result.filter(r=>r.status===429).length,50-accepted);
 for(const r of result)await r.arrayBuffer();
 const other=await mf.dispatchFetch('http://localhost/save',{headers:{'CF-Connecting-IP':'203.0.113.41'}});
 assert.equal(other.status,200);assert.deepEqual(await other.json(),{fixture:true});
 assert.equal(outbound,0,'runtime performed no external request');
 console.log(JSON.stringify({runtime:'local-workerd',miniflare:require('miniflare/package.json').version,cachedWranglerVersion:candidates[0].version,concurrentRequests:50,accepted}));
 console.log('Local workerd RPC: 50 concurrent requests bounded by serialized Durable Object transactions, 429 retry policy and isolated other traffic passed; production binding/deployment unverified.');
}finally{await mf.dispose();}
