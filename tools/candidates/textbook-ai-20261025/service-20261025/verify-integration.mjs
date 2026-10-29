import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,mkdir,copyFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import vm from 'node:vm';
const require=createRequire(import.meta.url),{checkDelta}=require('./checked-source.cjs'),ROOT=path.resolve(new URL('../../../../',import.meta.url).pathname);
let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++;};
const receipt=JSON.parse(await readFile(new URL('./integration.json',import.meta.url)));
ok(checkDelta().size===6,'six existing production files preserve all unrelated bytes');
const worker=await readFile(path.join(ROOT,'cf-worker/src/index.js'),'utf8');
const session=worker.indexOf('const session = await readSession(request, env);'),lease=worker.indexOf('await claimActiveSession(env, session.uid, session.token)'),route=worker.indexOf("if(path==='/textbook-ai-chat')");
ok(session>=0&&lease>session&&route>lease,'chat route follows actual session and active-owner authorization');
const preview=await readFile(path.join(ROOT,'preview/build.py'),'utf8');
for(const row of receipt.inputs)ok(preview.includes("'"+path.basename(row.file)+"'"),'preview explicitly copies '+path.basename(row.file));
ok(preview.includes("'textbook-ai-quota.mjs'")&&preview.includes("'openai-priced-operation.mjs'"),'preview includes quota and monetary dependencies');
const events=new Map();let touches=0;
vm.runInNewContext(await readFile(path.join(ROOT,'site-assets/sw.js'),'utf8'),{URL,Response,self:{location:{origin:'https://fixture.test'},addEventListener:(k,v)=>events.set(k,v)},caches:{open(){touches++;throw Error('private cache touched');}},fetch(){touches++;throw Error('private fetch intercepted');}});
for(const url of ['https://fixture.test/textbook-ai-chat?book=math1','https://fixture.test/api/textbook-ai-chat?book=math1','https://api.fixture.test/textbook-ai-chat?book=math1'])for(const mode of ['navigate','cors'])for(const method of ['GET','POST']){
 let intercepted=false;events.get('fetch')({request:{url,mode,method},respondWith(){intercepted=true;}});ok(!intercepted,'private textbook chat bypasses service worker');
}
ok(touches===0,'neither private cache nor network accessed by service worker');
const temp=await mkdtemp(path.join(tmpdir(),'nobi-book-service-check-'));
const names=new Set(['tools/candidates/textbook-ai-20261025/service-20261025/integration.json',receipt.proof.file,...receipt.additionalProofs.map(r=>r.file),...receipt.files.flatMap(r=>[r.file,r.beforeFile]),...receipt.inputs.map(r=>r.file)]);
for(const f of createRequire(import.meta.url)('../../textbook-ai-20261026/review/practice-source.cjs').practiceDependencyFiles())names.add(f);for(const name of names){const dest=path.join(temp,name);await mkdir(path.dirname(dest),{recursive:true});await copyFile(path.join(ROOT,name),dest);}
ok(checkDelta(temp).size===6,'isolated preserved receipt checks');
for(const name of [...receipt.files.map(r=>r.file),receipt.proof.file,receipt.inputs[0].file]){
 const file=path.join(temp,name),before=await readFile(file);await writeFile(file,Buffer.concat([before,Buffer.from('\n/* synthetic unrelated edit */')]));
 let rejected=false;try{checkDelta(temp);}catch{rejected=true;}ok(rejected,'unrelated source/proof drift is refused');await writeFile(file,before);
}
await writeFile(new URL('./integration-result.json',import.meta.url),JSON.stringify({status:'passed',checks,scope:'Exact production delta, authenticated parent guard order, preview module copy/dependencies, private cache bypass, cloned-source/proof mutation refusal. No live Worker or UI claims.'},null,2)+'\n');
console.log('Textbook AI service integration: '+checks+' checks passed');
