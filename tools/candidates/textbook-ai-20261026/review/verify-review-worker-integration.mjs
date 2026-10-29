import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdtemp,mkdir,copyFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
const require=createRequire(import.meta.url),{checkWorkerSource}=require('./worker-service-source.cjs'),here=new URL('./',import.meta.url);
let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++;};
const receipt=JSON.parse(await readFile(new URL('worker-service-integration.json',here)));
ok(checkWorkerSource().size===5,'five limited source changes reconstruct exact previous bytes');
const worker=await readFile('cf-worker/src/index.js','utf8'),route=worker.indexOf("if(path==='/material-test-review')"),lease=worker.indexOf('await claimActiveSession(env, session.uid, session.token)'),auth=worker.indexOf('const session = await readSession(request, env);');
ok(auth>=0&&lease>auth&&route>lease,'actual review HTTP behind session and opaque owner claim');
const routeBlock=worker.slice(route,worker.indexOf("if(path==='/material-test-session')",route));ok(routeBlock.includes('owner:await opaqueKey(session.token)')&&routeBlock.includes('scopedApiResponse('),'only opaque owner enters dedicated route');
const wrapper=await readFile('cf-worker/src/v3-worker.mjs','utf8');ok(wrapper.includes("export {default} from './index.js';"),'actual configured V3 entry forwards the queue handler too');
const config=await readFile('cf-worker/wrangler.toml','utf8');ok(config.includes('main = "src/v3-worker.mjs"')&&!config.includes('AI_TEST_REVIEW_QUEUE'),'existing online resource configuration unchanged, no accidental provisioning');
const preview=await readFile('preview/build.py','utf8');for(const row of receipt.inputs)ok(preview.includes("'"+path.basename(row.file)+"'"),'preview explicitly contains dependency '+path.basename(row.file));
// Evaluate the actual new parent method with isolated imports/lock data only.
const queueMethod=worker.slice(worker.indexOf('  async queue(batch,env){'),worker.indexOf('  // 毎日',worker.indexOf('  async queue(batch,env){'))).replace("await import('./ai-test-review-service.mjs')",'await fixtureImport()');
let calls=0,guards=0,retries=[];const ctx={lockState:async env=>env.fixtureLock,fixtureImport:async()=>({testReviewQueue:async(batch,env,options)=>{calls++;ok(await options.canRun()===true,'queue open guard true');env.fixtureLock='closed';ok(await options.canRun()===false,'queue guard rechecks lock after initial dispatch');guards++;}})};
const parent=vm.runInNewContext('({'+queueMethod+'})',ctx);
for(const fixtureLock of ['closed','unavailable'])await parent.queue({messages:[{retry:o=>retries.push(o.delaySeconds)}]},{fixtureLock});
ok(calls===0&&retries.length===2&&retries.every(n=>n===60),'closed/unavailable application never enters provider worker');
await parent.queue({messages:[]},{fixtureLock:false});ok(calls===1&&guards===1,'open actual parent delegates with mandatory dynamic lock guard');
const events=new Map();let cacheTouches=0;vm.runInNewContext(await readFile('site-assets/sw.js','utf8'),{URL,Response,self:{location:{origin:'https://fixture.invalid'},addEventListener:(k,v)=>events.set(k,v)},caches:{open(){cacheTouches++;throw Error('private cache forbidden');}},fetch(){cacheTouches++;throw Error('private fetch intercepted');}});
for(const prefix of ['/material-test-review','/api/material-test-review'])for(const mode of ['navigate','cors'])for(const method of ['GET','POST']){
 let intercepted=false;events.get('fetch')({request:{url:'https://fixture.invalid'+prefix+'?id='+crypto.randomUUID(),mode,method},respondWith(){intercepted=true;}});ok(!intercepted,'private review cache bypass');
}
ok(cacheTouches===0,'review/result never reaches service-worker cache');
const temp=await mkdtemp(path.join(tmpdir(),'nobi-review-worker-')),files=new Set(['tools/candidates/textbook-ai-20261026/review/worker-service-integration.json',receipt.previousServiceReceipt.file,receipt.proof.file,...receipt.files.flatMap(r=>[r.file,r.beforeFile]),...receipt.inputs.map(r=>r.file)]);
for(const f of createRequire(import.meta.url)('./practice-source.cjs').practiceDependencyFiles())files.add(f);for(const file of files){const target=path.join(temp,file);await mkdir(path.dirname(target),{recursive:true});await copyFile(file,target);}ok(checkWorkerSource(temp).size===5,'isolated cloned receipt validates');
for(const file of [...receipt.files.map(r=>r.file),receipt.proof.file,'cf-worker/src/ai-test-review-service.mjs']){
 const target=path.join(temp,file),old=await readFile(target);await writeFile(target,Buffer.concat([old,Buffer.from('\n/* synthetic unrelated edit */')]));let refused=false;try{checkWorkerSource(temp);}catch{refused=true;}ok(refused,'unrelated source/proof drift rejected '+file);await writeFile(target,old);
}
await writeFile(new URL('review-worker-integration-result.json',here),JSON.stringify({status:'passed',checks,scope:'Exact five-source delta and all service inputs/proof, private HTTP parent/opaque owner order, actual V3 queue forwarding, actual queue lock and mid-dispatch recheck, preview dependencies, private SW bypass and cloned mutation refusal. No queue resources/provider flags/prod/UI notification completion claim.'},null,2)+'\n');console.log('AI review main Worker integration: '+checks+' checks passed');
