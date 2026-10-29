import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const ROOT=new URL('../../../../',import.meta.url),here=new URL('./',import.meta.url),hash=x=>createHash('sha256').update(x).digest('hex');
let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++;};
const receipt=JSON.parse(await readFile(new URL('./ui-main/integration.json',here)));
ok(JSON.stringify(receipt.files.map(x=>x.file).sort())===JSON.stringify(['index.html','site-assets/textbook-annotations.js']),'existing UI file whitelist');
for(const row of receipt.files){
 const before=await readFile(new URL(row.beforeFile,ROOT),'utf8'),after=await readFile(new URL(row.file,ROOT),'utf8');
 ok(hash(before)===row.beforeSha256&&hash(after)===row.afterSha256,'exact preserved and current UI hashes '+row.file);
 let expected=before;for(const e of row.edits){ok(expected.split(e.before).length===2,'unique owned UI edit');expected=expected.replace(e.before,e.after);}
 ok(expected===after,'unrelated UI content preserved '+row.file);
}
ok(JSON.stringify(receipt.newFiles.map(x=>x.file).sort())===JSON.stringify(['site-assets/textbook-ai-model.js','site-assets/textbook-ai.css','site-assets/textbook-ai.js']),'new UI asset whitelist');
for(const row of receipt.newFiles){const [current,candidate]=await Promise.all([readFile(new URL(row.file,ROOT)),readFile(new URL(row.candidate,ROOT))]);ok(hash(current)===row.sha256&&hash(candidate)===row.sha256,'main and reviewed UI candidate match '+row.file);}
const result=JSON.parse(await readFile(new URL(receipt.uiResult,ROOT))),model=JSON.parse(await readFile(new URL(receipt.modelResult,ROOT)));
ok(result.status==='passed'&&result.checks>=84&&result.posts===6&&result.generations===6,'actual book UI covered all six books without automatic or duplicate AI generation');
for(const [file,sha]of Object.entries(result.inputs))ok(hash(await readFile(new URL('site-assets/'+file,ROOT)))===sha,'actual UI proof binds current '+file);
ok(model.status==='passed'&&model.checks===31,'draft state machine checked separately');
const visual=JSON.parse(await readFile(new URL('./ui-main/visual-review.json',here)));ok(visual.status==='reviewed'&&visual.files.length===6,'all six final viewport images inspected');
for(const row of visual.files)ok(hash(await readFile(new URL(row.file,ROOT)))===row.sha256,'inspected viewport image preserved');
await writeFile(new URL('./ui-integration-result.json',here),JSON.stringify({status:'passed',checks,scope:'Exact main integration and candidate equality, preserved unrelated index/annotation bytes, actual current-source model/book proofs and directly inspected six viewports. No publication or real provider/data.'},null,2)+'\n');console.log('Textbook AI UI integration: '+checks+' checks passed');
