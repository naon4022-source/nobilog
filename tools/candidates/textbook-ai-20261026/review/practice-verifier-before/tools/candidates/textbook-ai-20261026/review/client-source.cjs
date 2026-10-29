const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'../../../..'),base='tools/candidates/textbook-ai-20261026/review/',sha=v=>crypto.createHash('sha256').update(v).digest('hex');
function checkClientSource(root=ROOT){
 const read=f=>fs.readFileSync(path.join(root,f)),receipt=JSON.parse(read(base+'client-integration.json')),map=new Map();
 const files=['index.html','site-assets/material-ui.js','教材整理/実装/material-ui.js'];
 if(JSON.stringify(receipt.files.map(r=>r.file).sort())!==JSON.stringify(files.sort()))throw Error('review client whitelist');
 for(const row of receipt.files){if(row.beforeFile!==base+'client-before/'+row.file)throw Error('review client backup path');const before=read(row.beforeFile).toString(),actual=read(row.file).toString();if(sha(before)!==row.beforeSha256||sha(actual)!==row.afterSha256)throw Error('review client source drift');let expected=before;
  for(const e of [...row.edits].reverse()){if(!Number.isSafeInteger(e.start)||e.start!==e.end||e.start<0||e.start>before.length||e.before!==''||!e.after)throw Error('review client insertion');expected=expected.slice(0,e.start)+e.after+expected.slice(e.start);}
  if(expected!==actual)throw Error('unrelated review client change');map.set(row.file,before);
 }
 if(read('site-assets/material-ui.js').toString()!==read('教材整理/実装/material-ui.js').toString())throw Error('review client generator drift');
 const allowed=['site-assets/test-review-model.js','site-assets/test-review-cards.js','site-assets/test-review.js','site-assets/test-review.css'];
 if(JSON.stringify(receipt.newFiles.map(r=>r.file).sort())!==JSON.stringify(allowed.sort()))throw Error('review client asset whitelist');
 for(const row of receipt.newFiles)if(sha(read(row.file))!==row.sha256)throw Error('review client asset drift');
 for(const [file,checks]of [['review-client-model-result.json',41],['review-client-browser-result.json',79]]){const row=receipt.proofs.find(r=>r.file===base+file);if(!row||row.checks<checks)throw Error('review client proof whitelist');const bytes=read(row.file),proof=JSON.parse(bytes);if(sha(bytes)!==row.sha256||proof.status!=='passed'||proof.checks!==row.checks)throw Error('review client proof drift');for(const input of proof.inputs)if(sha(read(input.file))!==input.sha256)throw Error('review client proof source drift');}
 return map;
}
function clientBeforeSource(file){return checkClientSource().get(file)||fs.readFileSync(path.join(ROOT,file),'utf8');}
module.exports={checkClientSource,clientBeforeSource};
