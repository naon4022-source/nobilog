// Answer-safe explanation successor; isolated only.
// Negative fixtures for the actual builder; never edits textbook questions/answers.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {publicContextIndex} from '../../../textbook-ai-20261025/build-contexts.mjs';
const here=new URL('./',import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex');
const results=[];let checks=0;
for(const book of ['kokugo1','english1']){
 const bytes=await readFile(new URL(`candidate-books/textbook-book-${book}.json`,here));
 const data=JSON.parse(bytes),baseline=await publicContextIndex(book,bytes.toString());
 let count=0;const markers=[];
 function mask(value){
  if(!value||typeof value!=='object')return;
  if(value.t==='details'){
   const marker=`PRIVATE_CLOSED_ANSWER_${book}_${count++}`;markers.push(marker);
   value.body=[{t:'p',x:marker}];return;
  }
  for(const child of Object.values(value))if(Array.isArray(child))child.forEach(mask);else mask(child);
 }
 mask(data);assert(count>0);checks++;
 const probe=await publicContextIndex(book,JSON.stringify(data));
 assert.deepEqual(probe.value.contexts,baseline.value.contexts,'Every closed-answer replacement leaves public excerpts identical');checks++;
 assert(markers.every(marker=>!JSON.stringify(probe.value.contexts).includes(marker)));checks++;
 assert.equal(sha(await readFile(new URL(`candidate-books/textbook-book-${book}.json`,here))),sha(bytes));checks++;
 results.push({book,closedAnswerBodies:count,bookSha256:sha(bytes),publicRows:baseline.value.contexts.length});
}
await writeFile(new URL('integration-contexts/closed-answer-result.json',here),JSON.stringify({status:'passed',checks,books:results,scope:'Every details answer body replaced only in memory by a unique private marker; actual text-context generator returns identical public contexts. Original candidates untouched. Render-time exposure and media/AI answer generation are separate.'},null,2)+'\n');
console.log(JSON.stringify({status:'passed',checks,books:results}));
