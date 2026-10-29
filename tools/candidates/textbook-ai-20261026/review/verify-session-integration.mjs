import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import vm from 'node:vm';
const {checkDelta}=createRequire(import.meta.url)('../../textbook-ai-20261025/service-20261025/checked-source.cjs');
const {workerBeforeSource}=createRequire(import.meta.url)('./worker-service-source.cjs');
const hash=x=>createHash('sha256').update(x).digest('hex');let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++;};
const receipt=JSON.parse(await readFile(new URL('./session-integration.json',import.meta.url)));
ok(hash(await readFile(receipt.priorServiceReceipt.file))===receipt.priorServiceReceipt.sha256,'previous service receipt retained unchanged');
ok(checkDelta().size===6,'full strict predecessor chain still validates');
for(const row of receipt.files){
 const old=await readFile(row.beforeFile,'utf8'),actual=workerBeforeSource(row.file);ok(hash(old)===row.beforeSha256&&hash(actual)===row.afterSha256,'source hashes '+row.file);
 let expected=old;for(const e of row.edits){ok(expected.split(e.before).length===2,'unique intended edit');expected=expected.replace(e.before,e.after);}ok(expected===actual,'unrelated bytes preserved '+row.file);
}
const worker=await readFile('cf-worker/src/index.js','utf8'),route=worker.indexOf("if(path==='/material-test-session')"),lease=worker.indexOf('await claimActiveSession(env, session.uid, session.token)'),session=worker.indexOf('const session = await readSession(request, env);');
ok(session>=0&&lease>session&&route>lease,'new route after real parent authentication and lease');
const block=worker.slice(route,worker.indexOf("if(path==='/textbook-ai-chat')",route));
ok(block.includes('owner:await opaqueKey(session.token)')&&block.includes('scopedApiResponse('),'opaque parent owner and common private response policy');
const preview=await readFile('preview/build.py','utf8');for(const file of ['ai-test-session.mjs','ai-test-session-route.mjs','material-bank.mjs','material-engine.cjs'])ok(preview.includes("'"+file+"'"),'isolated preview dependency '+file);
const handlers=new Map();let cacheTouches=0;
vm.runInNewContext(await readFile('site-assets/sw.js','utf8'),{URL,Response,self:{location:{origin:'https://fixture.invalid'},addEventListener:(k,v)=>handlers.set(k,v)},caches:{open(){cacheTouches++;throw Error('private cache forbidden');}},fetch(){cacheTouches++;throw Error('private fetch forbidden');}});
for(const path of ['/material-test-session','/api/material-test-session'])for(const mode of ['navigate','cors'])for(const method of ['GET','POST']){
 let intercepted=false;handlers.get('fetch')({request:{url:'https://fixture.invalid'+path+'?id='+crypto.randomUUID(),method,mode},respondWith(){intercepted=true;}});ok(!intercepted,'roster/status bypass private service-worker cache');
}
ok(cacheTouches===0,'no private roster cache touches');
for(const [file,minimum] of [['session-result.json',89],['credits-result.json',112],['session-route-result.json',145]]){
 const p=JSON.parse(await readFile(new URL('./'+file,import.meta.url)));ok(p.status==='passed'&&p.checks>=minimum,'individual proof '+file);
 for(const input of p.inputs||[])ok(hash(await readFile(input.file))===input.sha256,'proof binds current source '+input.file);
}
await writeFile(new URL('./session-integration-result.json',import.meta.url),JSON.stringify({status:'passed',checks,scope:'Exact three-file parent/preview/SW integration, preserved predecessor chain, authenticated opaque lease order, private cache bypass, current HTTP source proof. No frontend/paid-job/real-provider completion claim.'},null,2)+'\n');console.log('AI session main integration: '+checks+' checks passed');
