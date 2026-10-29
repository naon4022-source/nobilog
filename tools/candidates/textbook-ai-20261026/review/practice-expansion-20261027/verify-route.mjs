// Run the existing real HTTP/SQLite regression with ONLY the two educational
// candidates and three job compatibility candidates. No main writes.
import assert from 'node:assert/strict';
import {installCandidateHooks} from './candidate-hooks.mjs';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const here=new URL('./',import.meta.url),root=new URL('../../../../../',import.meta.url);
const sha=v=>createHash('sha256').update(v).digest('hex');
const manifest=JSON.parse(await readFile(new URL('candidate.json',here)));
for(const input of manifest.inputs)assert.equal(sha(await readFile(new URL(input.file,root))),input.sha256,'candidate input drift');
const originalURL=new URL('../verify-practice-route.mjs',import.meta.url);
const original=await readFile(originalURL,'utf8');
let fixture=original;
const replace=(from,to)=>{assert.equal(fixture.split(from).length,2,'exact existing fixture edit:'+from);fixture=fixture.replace(from,to);};
assert.ok(fixture.includes('../../../../cf-worker/'));
fixture=fixture.replaceAll('../../../../','../../../../../');
replace("const quotas=f=>", "const candidateData=JSON.parse(await readFile(new URL('data.json',here)));\nconst quotas=f=>");
replace('  const get=await f.call(selection);', "  const official=candidateData.questions.find(q=>q.id===item.practiceId)?.answer.accepted[0];assert.ok(official,'new default ID selected by actual content pipeline');const wrong=['ア','イ','ウ'].find(v=>v!==official);\n  const get=await f.call(selection);");
replace("answer:'イ'},first=",'answer:wrong},first=');
replace("{...body,answer:'ウ'}",'{...body,answer:official}');
replace("{...body,id:crypto.randomUUID(),answer:'ウ'}",'{...body,id:crypto.randomUUID(),answer:official}');
replace("correct.value.result.answer.accepted[0]==='ウ'",'correct.value.result.answer.accepted[0]===official');
replace("new URL('practice-route-result.json',here)","new URL('candidate-route-result.json',here)");
const fixtureURL=new URL('route-fixture.mjs',here);
await writeFile(fixtureURL,fixture);
const hooks=await installCandidateHooks();
try{await import(fixtureURL.href);}finally{hooks.deregister();}
assert.ok(hooks.resolutions()>0,'candidate actually substituted');
const result=JSON.parse(await readFile(new URL('candidate-route-result.json',here)));
assert.equal(result.status,'passed');assert.equal(result.checks,125,'all existing invariants retained');
result.candidateOnly=true;
result.substitutions=hooks.substitutions.map(([original,candidate])=>({original:new URL(original).pathname,candidate:new URL(candidate).pathname}));
result.fixtureEdits='Paths/output only; correct and wrong letters are derived from canonical candidate data instead of obsolete fixed letters. All125 original HTTP/SQLite/owner/Origin/replay/quota/retention assertions retained.';
result.originalFixtureSha256=sha(original);
result.originalFixture='tools/candidates/textbook-ai-20261026/review/verify-practice-route.mjs';
for(const name of ['verify-route.mjs','route-fixture.mjs','candidate-hooks.mjs','candidate-library.mjs','ai-review-practice-data.mjs','candidate.json','job-compat-candidate.json','ai-test-review-content.mjs','ai-test-review-jobs.mjs','ai-test-review-service.mjs'])result.inputs.push({file:'tools/candidates/textbook-ai-20261026/review/practice-expansion-20261027/'+name,sha256:sha(await readFile(new URL(name,here)))});
await writeFile(new URL('candidate-route-result.json',here),JSON.stringify(result,null,2)+'\n');
console.log('Candidate-only real HTTP/SQLite route:125 existing assertions retained; main unchanged.');
