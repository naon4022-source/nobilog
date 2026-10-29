import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {clientBeforeSource}=createRequire(import.meta.url)('./client-source.cjs');
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const hash=x=>createHash('sha256').update(x).digest('hex'),here=new URL('./',import.meta.url);
let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++;};
const receipt=JSON.parse(await readFile(new URL('material-ui-integration.json',here)));
ok(JSON.stringify(receipt.files.map(r=>r.file).sort())===JSON.stringify(['site-assets/material-bridge.js','site-assets/material-entry.js','site-assets/material-ui.js','教材整理/実装/material-ui.js'].sort()),'four intended runtime files only');
for(const row of receipt.files){
 ok(row.beforeFile==='tools/candidates/textbook-ai-20261026/review/material-ui-before/'+row.file,'fixed backup path');
 const before=await readFile(row.beforeFile,'utf8'),actual=clientBeforeSource(row.file);ok(hash(before)===row.beforeSha256&&hash(actual)===row.afterSha256,'preserved before/current hashes '+row.file);
 let expected=before;
 for(const e of [...row.edits].reverse()){ok(Number.isSafeInteger(e.start)&&Number.isSafeInteger(e.end)&&e.start>=0&&e.end>=e.start&&before.slice(e.start,e.end)===e.before,'exact edit coordinates');expected=expected.slice(0,e.start)+e.after+expected.slice(e.end);}
 ok(expected===actual,'all unrelated source bytes retained '+row.file);
 ok(hash(actual+'\n/* synthetic unrelated change */')!==row.afterSha256,'unrelated source drift refused');
}
ok(await readFile('site-assets/material-ui.js','utf8')===await readFile('教材整理/実装/material-ui.js','utf8'),'UI generation source equals served file');
const formula=JSON.parse(await readFile(new URL('formula-order-edit.json',here)));ok(receipt.files.find(r=>r.file==='site-assets/material-ui.js').beforeSha256===formula.afterSha256,'previous approved formula correction retained as predecessor');
const worker=await readFile('cf-worker/src/index.js','utf8');ok(worker.indexOf("if(path==='/material-test-session')")>worker.indexOf('await claimActiveSession(env, session.uid, session.token)'),'actual session endpoint still behind parent lease');
for(const p of receipt.proofs){const bytes=await readFile(p.file),proof=JSON.parse(bytes);ok(hash(bytes)===p.sha256&&proof.status==='passed'&&proof.checks===p.checks,'frozen proof '+p.file);for(const input of proof.inputs)ok(hash(clientBeforeSource(input.file))===input.sha256,'proof against current source '+input.file);}
for(const image of receipt.visuals)ok(hash(await readFile(image.file))===image.sha256&&[390,820,1440].includes(image.width),'preserved directly reviewed screenshot');
ok(receipt.visuals.length===3,'all three widths visually reviewed');
const fixtures=JSON.parse(await readFile(new URL('legacy-fixture-edits.json',here)));
for(const row of fixtures.files){const before=await readFile(row.beforeFile,'utf8'),actual=clientBeforeSource(row.file);ok(hash(before)===row.beforeSha256&&hash(actual)===row.afterSha256,'old browser fixture hashes');let expected=before;for(const e of row.edits){ok(expected.split(e.before).length===2,'only intended fixture addition');expected=expected.replace(e.before,e.after);}ok(actual===expected,'old browser assertions unchanged');}
await writeFile(new URL('material-ui-integration-result.json',here),JSON.stringify({status:'passed',checks,scope:'Exact four-file delta and generator copy, actual authenticated endpoint ordering, actual SQL+bridge/browser proofs bound to current inputs, three frozen directly reviewed widths, old UI fixture transport additions preserving original assertions. No paid job/provider/vision/toast or whole completion claim.'},null,2)+'\n');console.log('Material test UI integration: '+checks+' checks passed');
