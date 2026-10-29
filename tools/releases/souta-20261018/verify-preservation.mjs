import {readFile,readdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root=new URL('./',import.meta.url),hash=b=>createHash('sha256').update(b).digest('hex');
const manifest=JSON.parse(await readFile(new URL('baseline-sha.json',root),'utf8')),changes=JSON.parse(await readFile(new URL('changes.json',root),'utf8'));
const changed=new Map(changes.map(c=>[c.file,c]));let checks=0;
for(const [file,sha]of Object.entries(manifest)){
 assert.equal(hash(await readFile(new URL('baseline/'+file,root))),sha,'original baseline unchanged '+file);checks++;
 assert.equal(hash(await readFile(new URL('candidate/'+file,root))),changed.get(file)?.after||sha,'exact reviewed file '+file);checks++;
}
assert.deepEqual([...changed.keys()].sort(),['cf-worker/src/index.js','pages/index.html','pages/sw.js']);checks++;
assert.deepEqual((await readdir(new URL('candidate/pages/',root))).sort(),(await readdir(new URL('baseline/pages/',root))).sort());checks++;
const html=await readFile(new URL('candidate/pages/index.html',root),'utf8');
assert.ok(!html.includes('textbook-book-math1.json')&&!html.includes('openai-avatar-client'),'local large update absent');checks++;
await writeFile(new URL('preservation-result.json',root),JSON.stringify({checks,passed:true,changedFiles:[...changed.keys()],baselineFiles:Object.keys(manifest).length,unrelatedAssetsChanged:false},null,2)+'\n');
console.log('Public baseline preservation:',checks,'checks passed; only 3 reviewed files changed; large local update excluded');
