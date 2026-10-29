// Validate this exact successor, then expose only the reviewed predecessor
// bytes to historical validators. No generic drift allowance or source edits.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const BASE='tools/candidates/textbook-ai-20261026/review/practice-expansion-20261027/';
const ROOT=path.resolve(__dirname,'../../../../..');
const sha=v=>crypto.createHash('sha256').update(v).digest('hex');
const products=['cf-worker/src/ai-review-practice-data.mjs','cf-worker/src/ai-review-practice-library.mjs','cf-worker/src/ai-test-review-content.mjs','cf-worker/src/ai-test-review-jobs.mjs','cf-worker/src/ai-test-review-service.mjs','site-assets/review-practice.js','site-assets/review-practice.css'];
const verifiers=['tools/candidates/textbook-ai-20261026/review/practice-source.cjs','tools/candidates/textbook-ai-20261026/review/worker-service-source.cjs','tools/candidates/textbook-ai-20261026/review/client-source.cjs','tools/candidates/textbook-ai-20261025/service-20261025/checked-source.cjs','tools/candidates/textbook-ai-20261026/review/verify-practice-integration.mjs','tools/candidates/textbook-ai-20261026/review/verify-practice-main-library.mjs','tools/candidates/textbook-ai-20261026/review/verify-practice-route.mjs','tools/candidates/textbook-ai-20261026/review/verify-practice-browser.mjs'];
const proofCounts=new Map([['library-result.json',1865],['arithmetic-result.json',31],['candidate-route-result.json',125],['legacy-jobs-result.json',38],['candidate-browser-result.json',214],['visual-review.json',null]]);
const sorted=v=>[...v].sort(),equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function safeFile(file){return typeof file==='string'&&!file.includes('..')&&!path.isAbsolute(file)&&(/^(?:cf-worker\/src|site-assets)\/[A-Za-z0-9_.-]+\.(?:js|mjs|cjs|json|css|svg)$/.test(file)||verifiers.includes(file)||file==='index.html'||file==='.claude/verify/d1-sqlite.js'||file==='Claude作業/20261026_ProAI類題/practice-bank.json'||file.startsWith(BASE)&&/\.(?:js|mjs|cjs|css|py|json|png|txt|log)$/.test(file));}
function readAt(root,file){if(!safeFile(file))throw Error('expansion input path');return fs.readFileSync(path.join(root,file));}
function receiptAt(root){const bytes=readAt(root,BASE+'main-integration.json').toString(),value=JSON.parse(bytes);if(JSON.stringify(value,null,2)+'\n'!==bytes||!equal(sorted(Object.keys(value)),sorted(['version','status','products','verifiers','helperSha256','proofs','previousFull','scope']))||value.status!=='reviewed successor; current integration status recorded separately')throw Error('expansion receipt drift');return value;}
function checkExpansionSource(root=ROOT){
 const receipt=receiptAt(root),before=new Map();
 if(receipt.version!==1||!equal(sorted(receipt.products.map(r=>r.file)),sorted(products))||!equal(sorted(receipt.verifiers.map(r=>r.file)),sorted(verifiers)))throw Error('expansion whitelist');
 if(sha(readAt(root,BASE+'checked-source.cjs'))!==receipt.helperSha256)throw Error('expansion helper drift');
 for(const row of [...receipt.products,...receipt.verifiers]){
  const expectedBefore=row.file.startsWith('tools/')?BASE+'verifier-before/'+row.file:row.file.startsWith('site-assets/')?BASE+'before/'+path.basename(row.file):BASE+'before/'+path.basename(row.file);
  if(row.beforeFile!==expectedBefore||!row.candidateFile.startsWith(BASE))throw Error('expansion backup path');
  const prior=readAt(root,row.beforeFile),actual=readAt(root,row.file),candidate=readAt(root,row.candidateFile);
  if(sha(prior)!==row.beforeSha256||sha(actual)!==row.afterSha256||sha(candidate)!==row.afterSha256||!actual.equals(candidate))throw Error('expansion source drift');
  if(row.edits){let replay=prior.toString();for(const edit of [...row.edits].reverse()){if(!Number.isSafeInteger(edit.start)||!Number.isSafeInteger(edit.end)||edit.start<0||edit.end<edit.start||prior.toString().slice(edit.start,edit.end)!==edit.before)throw Error('expansion exact edit');replay=replay.slice(0,edit.start)+edit.after+replay.slice(edit.end);}if(replay!==actual.toString())throw Error('expansion unrelated verifier change');}
  before.set(row.file,prior);
 }
 const read=file=>before.get(file)||readAt(root,file);
 const currentData=JSON.parse(readAt(root,'cf-worker/src/ai-review-practice-data.mjs').toString().replace(/^export default /,'').replace(/;\s*$/,''));
 const oldData=JSON.parse(before.get('cf-worker/src/ai-review-practice-data.mjs').toString().replace(/^export default /,'').replace(/;\s*$/,''));
 if(currentData.questions.length!==48||currentData.patterns.length!==16||!equal(currentData.legacyQuestions,oldData.questions)||!equal(currentData.legacyPatterns,oldData.patterns))throw Error('expansion educational preservation');
 const relocated=readAt(root,BASE+'candidate-library.mjs').toString().replace("from '../../../../../cf-worker/src/material-engine.cjs'","from './material-engine.cjs'");
 if(relocated!==readAt(root,'cf-worker/src/ai-review-practice-library.mjs').toString())throw Error('expansion runtime library mismatch');
 if(!equal(sorted(receipt.proofs.map(r=>r.file)),sorted([...proofCounts.keys()].map(f=>BASE+f))))throw Error('expansion proof whitelist');
 for(const proofRow of receipt.proofs){
  const bytes=readAt(root,proofRow.file),proof=JSON.parse(bytes),expected=proofCounts.get(proofRow.file.slice(BASE.length));
  if(sha(bytes)!==proofRow.sha256||proof.status!=='passed'||expected!==null&&proof.checks!==expected)throw Error('expansion proof drift');
  for(const input of proof.inputs||[])if(sha(read(input.file))!==input.sha256)throw Error('expansion proof input drift');
  if(proof.originalFixtureSha256){const file=proofRow.file.endsWith('candidate-browser-result.json')?'verify-practice-browser.mjs':'verify-practice-route.mjs';if(sha(read('tools/candidates/textbook-ai-20261026/review/'+file))!==proof.originalFixtureSha256)throw Error('expansion original fixture drift');}
  if(expected===null&&(!equal(proof.reviewedQuestionIds,currentData.questions.map(q=>q.id))||proof.reviewedScreens.length!==55))throw Error('expansion visual scope');
 }
 if(receipt.previousFull.file!==BASE+'before-full.json')throw Error('expansion full path');
 const fullBytes=readAt(root,receipt.previousFull.file),full=JSON.parse(fullBytes);
 if(sha(fullBytes)!==receipt.previousFull.sha256||full.status!=='passed'||full.exitCode!==0||!full.observedTerminal||full.log!==BASE+'before-full.log'||sha(readAt(root,full.log))!==full.logSha256||!readAt(root,full.log).toString().trimEnd().endsWith('✅ ぜんぶ通過'))throw Error('expansion before full drift');
 for(const input of full.plannedSixMainFilesStillAtBefore)if(sha(read(input.file))!==input.sha256)throw Error('expansion before input drift');
 for(const input of JSON.parse(readAt(root,BASE+'candidate.json')).inputs)if(sha(read(input.file))!==input.sha256)throw Error('expansion delivery input drift');
 return before;
}
function expansionDependencyFiles(root=ROOT){
 const receipt=receiptAt(root),files=new Set([BASE+'main-integration.json',BASE+'checked-source.cjs',receipt.previousFull.file,BASE+'before-full.log']);
 for(const row of [...receipt.products,...receipt.verifiers])for(const f of [row.file,row.beforeFile,row.candidateFile])files.add(f);
 for(const row of receipt.proofs){files.add(row.file);for(const input of JSON.parse(readAt(root,row.file)).inputs||[])files.add(input.file);}
 for(const input of JSON.parse(readAt(root,BASE+'candidate.json')).inputs)files.add(input.file);
 for(const f of files)if(!safeFile(f))throw Error('expansion dependency path: '+f);
 return [...files];
}
module.exports={checkExpansionSource,expansionDependencyFiles};
