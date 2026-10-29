const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'../../../..'),digest=x=>crypto.createHash('sha256').update(x).digest('hex');
const {checkPracticeSource}=require('../../textbook-ai-20261026/review/practice-source.cjs');
function checkDelta(root=ROOT){
 const practice=checkPracticeSource(root),read=f=>practice.has(f)?Buffer.from(practice.get(f)):fs.readFileSync(path.join(root,f));
 const receipt=JSON.parse(fs.readFileSync(path.join(root,'tools/candidates/textbook-ai-20261025/service-20261025/integration.json'))),map=new Map();
 if(receipt.status!=='individual checks passed; final full pending')throw Error('service receipt status');
 const allowed=['cf-worker/src/index.js','cf-worker/src/openai-receipts.mjs','cf-worker/src/openai-priced-operation.mjs','cf-worker/src/textbook-annotations.mjs','preview/build.py','site-assets/sw.js'];
 if(JSON.stringify(receipt.files.map(x=>x.file).sort())!==JSON.stringify(allowed.sort()))throw Error('service file whitelist');
 for(const row of receipt.files){
  if(row.beforeFile!=='tools/candidates/textbook-ai-20261025/service-20261025/before/'+row.file)throw Error('service backup path');
  const before=fs.readFileSync(path.join(root,row.beforeFile),'utf8'),actual=read(row.file).toString();
  if(digest(before)!==row.beforeSha256||digest(actual)!==row.afterSha256)throw Error('service source changed');
  let expected=before;for(const e of row.edits){if(!e.before||expected.split(e.before).length!==2)throw Error('service unique edit');expected=expected.replace(e.before,e.after);}
  if(expected!==actual)throw Error('service unrelated change');map.set(row.file,before);
 }
 for(const row of receipt.inputs)if(digest(read(row.file))!==row.sha256)throw Error('service implementation changed');
 const proof=fs.readFileSync(path.join(root,receipt.proof.file));if(digest(proof)!==receipt.proof.sha256||JSON.parse(proof).status!=='passed'||JSON.parse(proof).checks!==receipt.proof.checks)throw Error('service proof changed');
 for(const row of receipt.additionalProofs||[]){const bytes=fs.readFileSync(path.join(root,row.file)),value=JSON.parse(bytes);if(digest(bytes)!==row.sha256||value.status!=='passed'||value.checks!==row.checks)throw Error('book marker proof changed');}
 return map;
}
function checkedSource(file){const map=checkDelta();return map.get(file)||fs.readFileSync(path.join(ROOT,file),'utf8');}
module.exports={checkDelta,checkedSource};
