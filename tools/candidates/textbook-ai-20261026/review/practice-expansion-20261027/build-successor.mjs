// Prepare historical-check successors without touching the main application.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../../../../../',import.meta.url),here=new URL('./',import.meta.url),base='tools/candidates/textbook-ai-20261026/review/practice-expansion-20261027/';
const sha=v=>createHash('sha256').update(v).digest('hex'),read=file=>readFile(new URL(file,root));
const helperSha=sha(await readFile(new URL('checked-source.cjs',here))),verifiers=[];
async function adapt(file,edit){
 const original=await read(file);let next=original.toString();
 const replace=(from,to)=>{assert.equal(next.split(from).length,2,'exact successor edit:'+from);next=next.replace(from,to);};
 edit(replace,()=>next,v=>{next=v;});
 const beforeFile=base+'verifier-before/'+file,candidateFile=base+'adapted/'+file;
 for(const target of [beforeFile,candidateFile])await mkdir(new URL(target.slice(0,target.lastIndexOf('/')+1),root),{recursive:true});
 await writeFile(new URL(beforeFile,root),original);await writeFile(new URL(candidateFile,root),next);
 // Edits use JS character offsets, matching the historical exact-edit guards.
 const previous=original.toString();let start=0;while(start<previous.length&&start<next.length&&previous[start]===next[start])start++;
 let endBefore=previous.length,endAfter=next.length;while(endBefore>start&&endAfter>start&&previous[endBefore-1]===next[endAfter-1]){endBefore--;endAfter--;}
 verifiers.push({file,beforeFile,candidateFile,beforeSha256:sha(original),afterSha256:sha(next),edits:[{start,end:endBefore,before:previous.slice(start,endBefore),after:next.slice(start,endAfter)}]});
}
await adapt('tools/candidates/textbook-ai-20261026/review/practice-source.cjs',replace=>{
 replace('function checkPracticeSource(root=ROOT){',"const expansionHelper='./practice-expansion-20261027/checked-source.cjs';\nif(sha(fs.readFileSync(path.join(__dirname,expansionHelper)))!=='"+helperSha+"')throw Error('expansion helper drift');\nconst {checkExpansionSource,expansionDependencyFiles}=require(expansionHelper);\nfunction checkPracticeSource(root=ROOT){");
 replace(" const read=f=>fs.readFileSync(path.join(root,f)),receipt=JSON.parse(read(base+'practice-integration.json')),map=new Map();", " const expansion=checkExpansionSource(root),read=f=>expansion.get(f)||fs.readFileSync(path.join(root,f)),receipt=JSON.parse(read(base+'practice-integration.json')),map=new Map();");
 replace(' return map;'," Object.defineProperty(map,'expansionBefore',{value:expansion});return map;");
 replace('return [...files];}', 'return [...new Set([...files,...expansionDependencyFiles(root)])];}');
});
for(const file of ['tools/candidates/textbook-ai-20261026/review/worker-service-source.cjs','tools/candidates/textbook-ai-20261026/review/client-source.cjs','tools/candidates/textbook-ai-20261025/service-20261025/checked-source.cjs'])await adapt(file,replace=>{
 replace('practice.has(f)?Buffer.from(practice.get(f)):fs.readFileSync(path.join(root,f))', 'practice.has(f)?Buffer.from(practice.get(f)):practice.expansionBefore.has(f)?practice.expansionBefore.get(f):fs.readFileSync(path.join(root,f))');
});
await adapt('tools/candidates/textbook-ai-20261026/review/verify-practice-integration.mjs',replace=>{
 replace("const actual=await import('../../../../cf-worker/src/ai-review-practice-data.mjs'),candidate=", "const expansion=checkPracticeSource().expansionBefore,actual={default:JSON.parse(expansion.get('cf-worker/src/ai-review-practice-data.mjs').toString().replace(/^export default /,'').replace(/;\\s*$/,''))},candidate=");
 replace("now=await readFile(row.file,'utf8');", "now=expansion.has(row.file)?expansion.get(row.file).toString():await readFile(row.file,'utf8');");
 replace("for(const row of receipt.visuals)", "const current=(await import('../../../../cf-worker/src/ai-review-practice-data.mjs')).default;ok(current.questions.length===48,'current default48');ok(current.legacyQuestions.length===30,'exact legacy30 separately retained');ok(current.patterns.length===16,'current16 patterns');\nfor(const row of receipt.visuals)");
 replace("'cf-worker/src/ai-review-practice-route.mjs','site-assets/review-practice.js'])", "'cf-worker/src/ai-review-practice-route.mjs','site-assets/review-practice.js','cf-worker/src/ai-review-practice-data.mjs','cf-worker/src/ai-review-practice-library.mjs','cf-worker/src/ai-test-review-jobs.mjs','cf-worker/src/ai-test-review-service.mjs','site-assets/review-practice.css'])");
 replace("new URL('practice-integration-result.json',here)","new URL('practice-integration-current-result.json',here)");
 replace('Strict five-source/five-asset delta, actual parent owner guards/preview/private SW behavior, all30 candidate equality, historical proof/assertion preservation and clone mutations, actual125/136 proofs bound to runtime source, three directly reviewed screenshots and runner registration.20/30 currently reachable through existing material test source; all formats/vision/full still separate.', 'Strict original five-source/five-asset predecessor and original30 equality retained through exact7-product/8-verifier successor. Current48 defaults/30 legacy/16 patterns, owned parent guards, private cache, original125/145 proof/image preservation, additional product mutation refusal and unchanged runner registration.41/48 reachable; other formats/vision/final full separate.');
});
await adapt('tools/candidates/textbook-ai-20261026/review/verify-practice-main-library.mjs',replace=>{
 replace("data=JSON.parse(await readFile(new URL('practice-five-subjects-candidate.json',here)))", "data=(await import('../../../../cf-worker/src/ai-review-practice-data.mjs')).default");
 replace("new URL('practice-main-library-result.json',here)","new URL('practice-main-library-current-result.json',here)");
 replace('Current main server library invariants.30 questions', 'Current main server library invariants.48 default questions');
});
await adapt('tools/candidates/textbook-ai-20261026/review/verify-practice-route.mjs',replace=>{
 replace("import {reviewPracticeOptions} from '../../../../cf-worker/src/ai-review-practice-library.mjs';", "import {reviewPracticeOptions} from '../../../../cf-worker/src/ai-review-practice-library.mjs';\nimport practiceData from '../../../../cf-worker/src/ai-review-practice-data.mjs';");
 replace('  const get=await f.call(selection);', "  const official=practiceData.questions.find(q=>q.id===item.practiceId)?.answer.accepted[0];assert.ok(official,'current default ID');const wrong=['ア','イ','ウ'].find(v=>v!==official);\n  const get=await f.call(selection);");
 replace("answer:'イ'},first=",'answer:wrong},first=');replace("{...body,answer:'ウ'}",'{...body,answer:official}');replace("{...body,id:crypto.randomUUID(),answer:'ウ'}",'{...body,id:crypto.randomUUID(),answer:official}');replace("correct.value.result.answer.accepted[0]==='ウ'",'correct.value.result.answer.accepted[0]===official');
 replace("new URL('practice-route-result.json',here)","new URL('practice-route-current-result.json',here)");
});
await adapt('tools/candidates/textbook-ai-20261026/review/verify-practice-browser.mjs',(replace,get,set)=>{
 replace("import bank from '../../../../cf-worker/src/material-bank.mjs';", "import bank from '../../../../cf-worker/src/material-bank.mjs';\nimport practiceData from '../../../../cf-worker/src/ai-review-practice-data.mjs';");
 replace('const names=[',"const currentPractice=practiceData.questions.find(q=>q.id==='review-math-order-03-v2'),correct=currentPractice.answer.accepted[0],wrong=['ア','イ','ウ'].find(v=>v!==correct);\nconst names=[");
 const old="JSON.parse(await readFile(new URL('practice-five-subjects-candidate.json',here),'utf8'))";
 assert.equal(get().split(old).length,3);set(get().replaceAll(old,'practiceData'));
 replace("q.id==='review-math-order-03'", "q.id==='review-math-order-03-v2'");
 assert.equal(get().split(".fill('イ')").length,3);set(get().replaceAll(".fill('イ')",'.fill(wrong)'));replace(".fill('ウ')",'.fill(correct)');
 replace("&&await page.locator('.rp-result').textContent()==='','visual-only all30", "&&await page.locator('.rp-result').textContent()===''&&await page.locator('.rp-result').isHidden(),'visual-only all30");
 set(get().replaceAll('all30','all48').replaceAll('All30','All48').replaceAll('practice-screens/','practice-current-screens/'));
 replace("new URL('practice-browser-result.json',here)","new URL('practice-browser-current-result.json',here)");
});
const candidate=JSON.parse(await readFile(new URL('candidate.json',here))),jobs=JSON.parse(await readFile(new URL('job-compat-candidate.json',here))),ui=JSON.parse(await readFile(new URL('ui-context-candidate.json',here)));
const products=[...['ai-review-practice-data.mjs','ai-review-practice-library.mjs'].map(name=>({file:'cf-worker/src/'+name,beforeFile:base+'before/'+name,candidateFile:base+name,beforeSha256:candidate.inputs.find(r=>r.file==='cf-worker/src/'+name).sha256,afterSha256:null})),...jobs.files.map(r=>({...r})),ui,ui.stylesheet].map(row=>({file:row.file,beforeFile:row.beforeFile,candidateFile:row.candidateFile,beforeSha256:row.beforeSha256,afterSha256:row.afterSha256}));
for(const row of products){const prior=await read(row.beforeFile),actual=await read(row.file),next=await read(row.candidateFile);assert.equal(sha(prior),row.beforeSha256);assert.ok(actual.equals(prior),'main must still be unchanged');if(row.afterSha256)assert.equal(sha(next),row.afterSha256);else row.afterSha256=sha(next);}
const proofs=[];for(const [file,checks]of [['library-result.json',1865],['arithmetic-result.json',31],['candidate-route-result.json',125],['legacy-jobs-result.json',38],['candidate-browser-result.json',214],['visual-review.json',null]]){const bytes=await readFile(new URL(file,here)),value=JSON.parse(bytes);assert.equal(value.status,'passed');if(checks!==null)assert.equal(value.checks,checks);proofs.push({file:base+file,sha256:sha(bytes),checks});}
const fullBytes=await readFile(new URL('before-full.json',here));assert.equal(JSON.parse(fullBytes).exitCode,0);
await writeFile(new URL('main-integration.json',here),JSON.stringify({version:1,status:'reviewed successor; current integration status recorded separately',products,verifiers,helperSha256:helperSha,proofs,previousFull:{file:base+'before-full.json',sha256:sha(fullBytes)},scope:'Exact7 product successors +8 verifier successors; old assertions/proofs/images kept, no runner change, no deployment. Current-main tests write separate current results.'},null,2)+'\n');
console.log('Exact successor prepared:7 product files +8 verifier files; main untouched.');
