import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,writeFile,copyFile,mkdtemp,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const here=new URL('./',import.meta.url),root=new URL('../../../../../',import.meta.url),ROOT=root.pathname,require=createRequire(import.meta.url);
const base='tools/candidates/textbook-ai-20261026/review/',prefix=base+'practice-expansion-20261027/';
const sha=v=>createHash('sha256').update(v).digest('hex');
const receipt=JSON.parse(await readFile(new URL('main-integration.json',here)));
const files=new Set([...require('../practice-source.cjs').practiceDependencyFiles(),...require('./checked-source.cjs').expansionDependencyFiles(),base+'practice-source.cjs',base+'practice-five-subjects-candidate.json',base+'runner-edit.json','.claude/verify/run.sh']);
async function addReceipt(file){
 files.add(file);const r=JSON.parse(await readFile(new URL(file,root)));
 for(const row of r.files||[])for(const f of [row.file,row.beforeFile])files.add(f);
 for(const row of [...r.newFiles||[],...r.inputs||[]])files.add(row.file);
 for(const row of r.verifierEdits||[])for(const f of [row.file,row.beforeFile])files.add(f);
 for(const row of r.visuals||[])files.add(row.file);
 const proofs=[...r.proofs||[],...r.additionalProofs||[],...[r.proof,r.previousServiceReceipt].filter(Boolean)];
 for(const row of proofs){files.add(row.file);const proof=JSON.parse(await readFile(new URL(row.file,root)));for(const input of proof.inputs||[])files.add(input.file);}
}
for(const file of [base+'practice-integration.json',base+'worker-service-integration.json',base+'client-integration.json','tools/candidates/textbook-ai-20261025/service-20261025/integration.json'])await addReceipt(file);
const clone=await mkdtemp(path.join(tmpdir(),'nobilog-practice-successor-'));
for(const file of files){
 assert.ok(typeof file==='string'&&!file.split('/').includes('..')&&!path.isAbsolute(file)&&!file.includes('HANDOFF')&&!file.includes('.env'),'source-only clone path');
 const target=path.join(clone,file);await mkdir(path.dirname(target),{recursive:true});await copyFile(new URL(file,root),target);
}
for(const row of [...receipt.products,...receipt.verifiers]){
 assert.equal(sha(await readFile(new URL(row.file,root))),row.beforeSha256,'main unchanged before isolated promotion');
 await copyFile(new URL(row.candidateFile,root),path.join(clone,row.file));
}
const practice=require(path.join(clone,base+'practice-source.cjs'));
let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++;};
ok(practice.checkPracticeSource(clone).size===5,'original five-source predecessor guard retained');
ok(practice.checkPracticeSource(clone).expansionBefore.size===15,'only seven products and eight exact verifier successors normalized');
ok(require(path.join(clone,base+'worker-service-source.cjs')).checkWorkerSource(clone).size===5,'worker predecessor guards retained');
ok(require(path.join(clone,base+'client-source.cjs')).checkClientSource(clone).size===3,'client predecessor guards retained');
ok(require(path.join(clone,'tools/candidates/textbook-ai-20261025/service-20261025/checked-source.cjs')).checkDelta(clone).size===6,'October25 predecessor guards retained');
const mutations=[...receipt.products.map(r=>r.file),...receipt.verifiers.map(r=>r.file),prefix+'checked-source.cjs',prefix+'main-integration.json',...receipt.proofs.map(r=>r.file),prefix+'candidate-library.mjs',prefix+'before/ai-test-review-service.mjs','site-assets/material-bank.json','Claude作業/20261026_ProAI類題/practice-bank.json'];
for(const file of mutations){const target=path.join(clone,file),before=await readFile(target);await writeFile(target,Buffer.concat([before,Buffer.from('\n/* unrelated isolated mutation */')]));assert.throws(()=>practice.checkPracticeSource(clone));checks++;await writeFile(target,before);}
ok(practice.checkPracticeSource(clone).size===5,'exact sources revalidate after all isolated mutations restored');
const integration=spawnSync(process.execPath,[path.join(clone,base+'verify-practice-integration.mjs')],{cwd:clone,encoding:'utf8',maxBuffer:2_000_000});
await writeFile(new URL('successor-clone-integration.log',here),(integration.stdout||'')+(integration.stderr||''));
assert.equal(integration.status,0,'adapted historical integration must pass: '+integration.stderr);
const integrationResult=JSON.parse(await readFile(path.join(clone,base+'practice-integration-current-result.json')));
ok(integrationResult.status==='passed'&&integrationResult.checks>=80,'all original integration assertions plus current48 and extra mutations retained');
const inputs=[];for(const file of [prefix+'main-integration.json',prefix+'checked-source.cjs',prefix+'build-successor.mjs',prefix+'verify-successor-clone.mjs',...receipt.products.flatMap(r=>[r.file,r.beforeFile,r.candidateFile]),...receipt.verifiers.flatMap(r=>[r.file,r.beforeFile,r.candidateFile])])inputs.push({file,sha256:sha(await readFile(new URL(file,root)))});
await writeFile(new URL('successor-clone-result.json',here),JSON.stringify({status:'passed',checks,clone,integrationChecks:integrationResult.checks,inputs,scope:'Isolated successor promotion only: all7 product/8 verifier deltas, full original practice/worker/client/October25 guards, source/proof/backup/delivery mutations refused, original integration conditions retained. Main untouched, no runtime/provider/data/deployment.'},null,2)+'\n');
console.log('Successor isolated clone: '+checks+' checks passed; historical integration '+integrationResult.checks+'. Main unchanged.');
