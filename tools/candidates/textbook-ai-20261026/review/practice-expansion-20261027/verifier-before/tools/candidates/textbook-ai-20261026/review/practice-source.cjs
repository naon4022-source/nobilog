const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'../../../..'),base='tools/candidates/textbook-ai-20261026/review/',sha=v=>crypto.createHash('sha256').update(v).digest('hex');
function checkPracticeSource(root=ROOT){
 const read=f=>fs.readFileSync(path.join(root,f)),receipt=JSON.parse(read(base+'practice-integration.json')),map=new Map();
 const files=['cf-worker/src/index.js','preview/build.py','cf-worker/src/ai-test-review-content.mjs','index.html','site-assets/test-review.js'];
 if(JSON.stringify(receipt.files.map(r=>r.file).sort())!==JSON.stringify(files.sort()))throw Error('practice file whitelist');
 for(const row of receipt.files){if(row.beforeFile!==base+'practice-before/'+row.file)throw Error('practice backup path');const before=read(row.beforeFile).toString(),actual=read(row.file).toString();if(sha(before)!==row.beforeSha256||sha(actual)!==row.afterSha256)throw Error('practice source drift');let expected=before;
  for(const e of [...row.edits].reverse()){if(!Number.isSafeInteger(e.start)||!Number.isSafeInteger(e.end)||e.start<0||e.end<e.start||before.slice(e.start,e.end)!==e.before)throw Error('practice exact edit');expected=expected.slice(0,e.start)+e.after+expected.slice(e.end);}if(expected!==actual)throw Error('unrelated practice source change');map.set(row.file,before);
 }
 const names=['cf-worker/src/ai-review-practice-data.mjs','cf-worker/src/ai-review-practice-library.mjs','cf-worker/src/ai-review-practice-route.mjs','site-assets/review-practice.js','site-assets/review-practice.css'];
 if(JSON.stringify(receipt.newFiles.map(r=>r.file).sort())!==JSON.stringify(names.sort()))throw Error('practice asset whitelist');for(const row of receipt.newFiles)if(sha(read(row.file))!==row.sha256)throw Error('practice asset drift');
 for(const [file,checks]of [['practice-route-result.json',125],['practice-browser-result.json',145]]){const row=receipt.proofs.find(r=>r.file===base+file);if(!row||row.checks!==checks)throw Error('practice proof paths');const bytes=read(row.file),proof=JSON.parse(bytes);if(sha(bytes)!==row.sha256||proof.status!=='passed'||proof.checks!==checks)throw Error('practice proof drift');for(const input of proof.inputs){if(!/^(?:index\.html|(?:cf-worker\/src|site-assets)\/[A-Za-z0-9_.-]+)$/.test(input.file)||sha(read(input.file))!==input.sha256)throw Error('practice proof source drift');}}
 return map;
}
function practiceDependencyFiles(root=ROOT){const read=f=>fs.readFileSync(path.join(root,f)),r=JSON.parse(read(base+'practice-integration.json')),files=new Set([base+'practice-integration.json',...r.files.flatMap(x=>[x.file,x.beforeFile]),...r.newFiles.map(x=>x.file),...r.proofs.map(x=>x.file)]);for(const row of r.proofs)for(const input of JSON.parse(read(row.file)).inputs)files.add(input.file);return [...files];}
module.exports={checkPracticeSource,practiceDependencyFiles};
