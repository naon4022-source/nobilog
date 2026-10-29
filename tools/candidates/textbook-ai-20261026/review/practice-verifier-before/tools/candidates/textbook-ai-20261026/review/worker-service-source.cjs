const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'../../../..'),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
function checkWorkerSource(root=ROOT){
 const receipt=JSON.parse(fs.readFileSync(path.join(root,'tools/candidates/textbook-ai-20261026/review/worker-service-integration.json'))),map=new Map();
 const allowed=['cf-worker/src/index.js','preview/build.py','site-assets/sw.js','cf-worker/src/ai-trial-control.mjs','cf-worker/src/ai-test-review-jobs.mjs'];
 if(JSON.stringify(receipt.files.map(r=>r.file).sort())!==JSON.stringify(allowed.sort()))throw Error('worker service whitelist');
 const allowedInputs=['ai-test-review-service.mjs','ai-test-review-route.mjs','ai-test-review-jobs.mjs','ai-test-review-content.mjs','ai-test-review-credits.mjs','ai-trial-control.mjs','ai-test-review-format.mjs','openai-transport.mjs','openai-policy.mjs','openai-priced-operation.mjs','openai-receipts.mjs'].map(file=>'cf-worker/src/'+file);
 if(JSON.stringify(receipt.inputs.map(r=>r.file).sort())!==JSON.stringify(allowedInputs.sort())||receipt.previousServiceReceipt.file!=='tools/candidates/textbook-ai-20261026/review/worker-service-prior-integration.json'||receipt.proof.file!=='tools/candidates/textbook-ai-20261026/review/review-service-result.json')throw Error('worker proof path whitelist');
 if(sha(fs.readFileSync(path.join(root,receipt.previousServiceReceipt.file)))!==receipt.previousServiceReceipt.sha256)throw Error('previous service receipt drift');
 for(const row of receipt.files){
  if(row.beforeFile!=='tools/candidates/textbook-ai-20261026/review/worker-before/'+row.file)throw Error('worker service backup path');
  const before=fs.readFileSync(path.join(root,row.beforeFile),'utf8'),actual=fs.readFileSync(path.join(root,row.file),'utf8');
  if(sha(before)!==row.beforeSha256||sha(actual)!==row.afterSha256)throw Error('worker source drift');
  let expected=before;for(const edit of row.edits){if(!edit.before||expected.split(edit.before).length!==2)throw Error('worker source unique edit');expected=expected.replace(edit.before,edit.after);}
  if(expected!==actual)throw Error('unrelated worker change');map.set(row.file,before);
 }
 for(const row of receipt.inputs)if(sha(fs.readFileSync(path.join(root,row.file)))!==row.sha256)throw Error('worker implementation drift');
 const bytes=fs.readFileSync(path.join(root,receipt.proof.file)),proof=JSON.parse(bytes);if(sha(bytes)!==receipt.proof.sha256||proof.status!=='passed'||proof.checks!==receipt.proof.checks)throw Error('worker proof drift');
 return map;
}
function workerBeforeSource(file){return checkWorkerSource().get(file)||fs.readFileSync(path.join(ROOT,file),'utf8');}
module.exports={checkWorkerSource,workerBeforeSource};
