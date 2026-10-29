// Static reviewed material and actual graders only. No record routes, starts or users.
// Do not run concurrently with the active full suite.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url),client=require('../../../site-assets/material-engine.js'),server=require('../../../cf-worker/src/material-engine.cjs');
const here=new URL('./',import.meta.url),unitURL=new URL('../../../教材整理/確認済み/tokkun-social-1-geo-nihon.json',import.meta.url);
const bytes=await readFile(unitURL),unit=JSON.parse(bytes),suspects=JSON.parse(await readFile(new URL('rubric-review-pending.json',here),'utf8'));
assert.equal(createHash('sha256').update(bytes).digest('hex'),suspects.unitSha256);
const rows=[];
for(const c of suspects.cases){
 const q=unit.questions[c.number-1];assert(q.id.endsWith('-'+c.number));
 const a=client.grade(q,c.input),b=server.grade(q,c.input);
 assert.deepEqual(a,b,'actual client/server grading agree');
 rows.push({...c,id:q.id,expectedCorrect:false,actualCorrect:a.correct,ratio:a.ratio,reproduced:a.correct===true});
}
await writeFile(new URL('reproduction-result.json',here),JSON.stringify({status:rows.every(x=>x.reproduced)?'three false positives reproduced':'inspect unexpected outcomes',unitSha256:suspects.unitSha256,rows,realUserData:false,recordWrites:0,network:false},null,2)+'\n');
console.log(JSON.stringify(rows.map(x=>({number:x.number,reproduced:x.reproduced,actualCorrect:x.actualCorrect}))));
