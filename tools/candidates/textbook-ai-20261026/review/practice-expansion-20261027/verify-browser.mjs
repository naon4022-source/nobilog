import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {installCandidateHooks} from './candidate-hooks.mjs';
const here=new URL('./',import.meta.url),root=new URL('../../../../../',import.meta.url);
const sha=v=>createHash('sha256').update(v).digest('hex');
const original=await readFile(new URL('../verify-practice-browser.mjs',here),'utf8');
let fixture=original.replaceAll('../../../../','../../../../../');
const replace=(from,to)=>{assert.equal(fixture.split(from).length,2,'exact browser fixture edit: '+from);fixture=fixture.replace(from,to);};
replace("from '../../../../../cf-worker/src/ai-test-review-route.mjs';", "from '../../../../../cf-worker/src/ai-test-review-route.mjs?candidate-browser';");
replace("from '../../../../../cf-worker/src/ai-review-practice-route.mjs';", "from '../../../../../cf-worker/src/ai-review-practice-route.mjs?candidate-browser';");
replace('const names=[', "const candidateData=JSON.parse(await readFile(new URL('data.json',here)));const candidateQuestion=candidateData.questions.find(q=>q.id==='review-math-order-03-v2'),correct=candidateQuestion.answer.accepted[0],wrong=['ア','イ','ウ'].find(v=>v!==correct);\nconst names=[");
replace("assets['material-bank.json']=", "assets['review-practice.js']=await readFile(new URL('review-practice.js',here),'utf8');assets['review-practice.css']=await readFile(new URL('review-practice.css',here),'utf8');assets['material-bank.json']=");
assert.equal(fixture.split('practice-five-subjects-candidate.json').length,3);
fixture=fixture.replaceAll('practice-five-subjects-candidate.json','data.json');
replace("q.id==='review-math-order-03'", "q.id==='review-math-order-03-v2'");
assert.equal(fixture.split(".fill('イ')").length,3);fixture=fixture.replaceAll(".fill('イ')",'.fill(wrong)');
replace(".fill('ウ')",'.fill(correct)');
replace('const result=await processTestReviewMessage(f.env,pending.shift(),', 'const result=await (f.legacyMode?globalThis.__practiceBrowserLegacy.process:processTestReviewMessage)(f.env,pending.shift(),');
replace('response=await reviewPracticeRoute(request,f.env,{uid:f.uid},options);', 'response=await (f.legacyMode?globalThis.__practiceBrowserLegacy.practiceRoute:reviewPracticeRoute)(request,f.env,{uid:f.uid},options);');
replace("path==='/material-test-review'){response=await testReviewRoute(request,f.env,{uid:f.uid},options);", "path==='/material-test-review'){response=await (f.legacyMode?globalThis.__practiceBrowserLegacy.reviewRoute:testReviewRoute)(request,f.env,{uid:f.uid},options);");
replace(' ok(outside===0,', (await readFile(new URL('browser-legacy-case.txt',here),'utf8'))+'\n ok(outside===0,');
replace("new URL('practice-browser-result.json',here)","new URL('candidate-browser-result.json',here)");
fixture=fixture.replaceAll('all30','all48').replaceAll('All30','All48');
replace("&&await page.locator('.rp-result').textContent()==='','visual-only all48", "&&await page.locator('.rp-result').textContent()===''&&await page.locator('.rp-result').isHidden(),'visual-only all48");
replace("' '+q.id);await page.getByRole('button',{name:'解説へ戻る',exact:true}).click();}", "' '+q.id);await page.locator('.rp-frame').screenshot({path:new URL('practice-screens/all-'+width+'-'+q.id+'.png',here).pathname});if(q.id==='review-math-notation-02'){await page.evaluate(q=>{window.nobiReviewPracticeAPI.post=async body=>({id:body.id,at:Date.now(),cached:false,result:{practiceId:q.id,correct:true,answer:q.answer,explanation:q.explanation}});},q);await page.getByRole('textbox',{name:'類題の答え',exact:true}).fill(q.answer.accepted[0]);await page.getByRole('button',{name:'理由を確かめる',exact:true}).click();await page.getByText('理由まで確認できました',{exact:true}).waitFor();ok(await page.locator('.rp-result .vfrac').evaluateAll(nodes=>nodes.some(n=>n.querySelector('.vfrac-num')?.textContent==='a'&&n.querySelector('.vfrac-den')?.textContent==='b')),'explicit math context stacks a/b in explanation '+width);await page.locator('.rp-frame').screenshot({path:new URL('practice-screens/math-context-'+width+'.png',here).pathname});}await page.getByRole('button',{name:'解説へ戻る',exact:true}).click();}");
await writeFile(new URL('browser-fixture.mjs',here),fixture);
if(process.argv.includes('--prepare-only')){console.log('Candidate browser fixture prepared; browser not launched.');process.exit(0);}
// The old modules are loaded before substitutions, and remain available only
// to the synthetic old-state setup. Candidate route imports use fresh URLs.
globalThis.__practiceBrowserLegacy={
 practiceRoute:(await import(new URL('cf-worker/src/ai-review-practice-route.mjs',root))).reviewPracticeRoute,
 reviewRoute:(await import(new URL('cf-worker/src/ai-test-review-route.mjs',root))).testReviewRoute,
 process:(await import(new URL('cf-worker/src/ai-test-review-service.mjs',root))).processTestReviewMessage,
 data:JSON.parse((await readFile(new URL('cf-worker/src/ai-review-practice-data.mjs',root),'utf8')).replace(/^export default /,'').replace(/;\s*$/,'')),
 ui:await readFile(new URL('site-assets/review-practice.js',root),'utf8'),
 css:await readFile(new URL('site-assets/review-practice.css',root),'utf8')
};
globalThis.__practiceBrowserCandidateUI=await readFile(new URL('review-practice.js',here),'utf8');
globalThis.__practiceBrowserCandidateCSS=await readFile(new URL('review-practice.css',here),'utf8');
const uiReceipt=JSON.parse(await readFile(new URL('ui-context-candidate.json',here)));
assert.equal(sha(globalThis.__practiceBrowserLegacy.ui),uiReceipt.beforeSha256);
assert.equal(sha(globalThis.__practiceBrowserCandidateUI),uiReceipt.afterSha256);
assert.equal(sha(globalThis.__practiceBrowserLegacy.css),uiReceipt.stylesheet.beforeSha256);
assert.equal(sha(globalThis.__practiceBrowserCandidateCSS),uiReceipt.stylesheet.afterSha256);
const hooks=await installCandidateHooks();
try{await import(new URL('browser-fixture.mjs',here));}finally{hooks.deregister();}
const result=JSON.parse(await readFile(new URL('candidate-browser-result.json',here)));
const legacy=globalThis.__practiceBrowserLegacyEvidence;
assert.equal(result.status,'passed');assert.ok(hooks.resolutions()>0);
assert.ok(legacy?.checks>=10,'old IndexedDB/HTTP update case actually completed');
assert.equal(result.checks,202+legacy.checks,'all145 original conditions +54 extra visual layouts +3 math-context cases + explicit old-state cases retained');
result.candidateOnly=true;result.legacyBrowser=legacy;result.originalFixtureSha256=sha(original);
result.substitutions=hooks.substitutions.map(([from,to])=>({original:new URL(from).pathname,candidate:new URL(to).pathname}));
result.fixtureEdits='Root paths/output only; canonical new ID and answer letters; visual set30 to48; existing full145 invariants retained; old graph only for explicitly synthetic pre-update setup.';
for(const name of ['verify-browser.mjs','browser-fixture.mjs','browser-legacy-case.txt','candidate-hooks.mjs','candidate.json','job-compat-candidate.json','ui-context-candidate.json','candidate-library.mjs','ai-review-practice-data.mjs','ai-test-review-content.mjs','ai-test-review-jobs.mjs','ai-test-review-service.mjs','review-practice.js','review-practice.css'])result.inputs.push({file:'tools/candidates/textbook-ai-20261026/review/practice-expansion-20261027/'+name,sha256:sha(await readFile(new URL(name,here)))});
result.scope+=' Candidate graph only; actual old wrong answer differs from new version correct letter. Old saved receipt and truly unissued real IndexedDB answer survive server update/reload with GET-only recovery and stable explicit retry. Screens require direct review.';
await writeFile(new URL('candidate-browser-result.json',here),JSON.stringify(result,null,2)+'\n');
console.log('Candidate practice browser: '+result.checks+' checks passed;48 visual questions and old actual IndexedDB recovery.');
