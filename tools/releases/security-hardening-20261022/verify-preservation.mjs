import {readFile,writeFile,readdir} from 'node:fs/promises';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
const H=new URL('./',import.meta.url),hash=b=>createHash('sha256').update(b).digest('hex'),m=JSON.parse(await readFile(new URL('review-manifest.json',H),'utf8'));let checks=0;
for(const scope of ['baseline','candidate'])for(const[file,sha]of Object.entries(m[scope])){assert.equal(hash(await readFile(new URL(scope+'/'+file,H))),sha,file);checks++;}
assert.deepEqual([...m.changedExistingFiles].sort(),['cf-worker/src/index.js','pages/index.html','pages/sw.js']);checks++;
const html=await readFile(new URL('candidate/pages/index.html',H),'utf8'),base=await readFile(new URL('baseline/pages/index.html',H),'utf8');
for(const token of ["const LIFE_URL='https://nobilog-life.pages.dev/';",'workbook-questions.js','progressive-questions.js','unit-guides.js']){assert(html.includes(token)&&base.includes(token));checks++;}
assert(!html.includes('textbook-book-math1.json')&&!html.includes('openai-avatar-client'));checks++;
for(const[file,sha]of Object.entries(m.candidate))if(!file.endsWith('.jsonc')){
 const text=(await readFile(new URL('candidate/'+file,H))).toString();assert(!/(?:sk-[A-Za-z0-9_-]{24,}|AIza[A-Za-z0-9_-]{28,}|-----BEGIN (?:RSA |EC )?PRIVATE KEY-----)/.test(text),'secret-shaped literal in '+file);checks++;
}
await writeFile(new URL('preservation-result.json',H),JSON.stringify({status:'passed',checks,baselineVersion:'2.16.0',version:'2.17.0',changedFiles:m.changedExistingFiles,newFiles:m.newFiles,realDataRead:false},null,2)+'\n');console.log('Google settings public preservation:',checks,'checks passed');
