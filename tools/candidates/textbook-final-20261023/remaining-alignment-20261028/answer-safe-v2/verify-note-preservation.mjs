// Answer-safe explanation successor; isolated only.
// Source-update preservation with synthetic notes only; never opens user storage.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash,webcrypto} from 'node:crypto';
import vm from 'node:vm';
const here=new URL('./',import.meta.url),root=new URL('../../../../../',here),stage=new URL('integration-contexts/',here);
const sha=b=>createHash('sha256').update(b).digest('hex'),inputs=[];
async function pinned(url){const bytes=await readFile(url);inputs.push({url:url.href,sha256:sha(bytes)});return bytes;}
const source=await pinned(new URL('site-assets/textbook-annotation-model.js',root));
const results=[];
for(const [book,count,changed]of [['kokugo1',1433,12],['english1',696,12]]){
const oldBytes=await pinned(new URL(`site-assets/textbook-book-${book}.json`,root));
const nextBytes=await pinned(new URL(`candidate-books/textbook-book-${book}.json`,here));
const oldBook=JSON.parse(oldBytes),nextBook=JSON.parse(nextBytes);
const box=vm.createContext({crypto:webcrypto,TextEncoder});vm.runInContext(source.toString(),box,{timeout:1000});
const model=box.NobiTextbookAnnotationModel,old=await model.prepare(oldBook,book),next=await model.prepare(nextBook,book);
const collect=value=>value.data.pages.flatMap(p=>(p.blocks||[]).filter(b=>b.annotationAnchor));
const oldBlocks=collect(old),nextBlocks=collect(next),newAnchors=new Set(nextBlocks.map(b=>b.annotationAnchor));
const orphaned=oldBlocks.filter(b=>!newAnchors.has(b.annotationAnchor));
assert.equal(orphaned.length,changed);
// Normalize the VM-owned array into JSON data, as the real HTTP boundary does.
const items=JSON.parse(JSON.stringify(oldBlocks.map((b,i)=>({book,anchor:b.annotationAnchor,quote:b.annotationQuote,color:'yellow',note:'隔離確認用メモ '+i,revision:1,updatedAt:1}))));
assert.equal(items.length,count);
const owner=Object.freeze({uid:'synthetic-review-owner',epoch:'synthetic-only'}),apiCalls=[];
const api={snapshot:()=>owner,matches:other=>other===owner,
 get:async book=>{apiCalls.push('get');return {book,items:structuredClone(items),writable:true};},
 post:async()=>{apiCalls.push('post');throw Error('A source update must not save/migrate/delete a note automatically');}};
const session=model.session(api,book);
await session.load();
const state=JSON.parse(JSON.stringify(session.state()));
assert.deepEqual(state.items,items);
assert.equal(state.durable,false,'fixture never opens IndexedDB');
assert.equal(state.items.filter(r=>!newAnchors.has(r.anchor)).length,changed);
assert.equal(state.items.filter(r=>newAnchors.has(r.anchor)).length,count-changed);
for(const b of orphaned){
 const saved=state.items.find(r=>r.anchor===b.annotationAnchor);
 assert.equal(saved.quote,b.annotationQuote);
 assert(saved.note.startsWith('隔離確認用メモ '));
 // Existing old-text memo stays attached to its original text, not a guessed new paragraph.
 assert(!nextBlocks.some(r=>r.annotationAnchor===saved.anchor));
 await session.draft(saved.anchor,{quote:saved.quote,note:saved.note+'（未送信）',color:'pink',revision:saved.revision});
 assert.equal(session.draft(saved.anchor).quote,saved.quote);
}
assert.deepEqual(JSON.parse(JSON.stringify(session.state().items)),items);
assert.deepEqual(apiCalls,['get']);
assert.equal(sha(Buffer.from(JSON.stringify(oldBook))),sha(Buffer.from(JSON.stringify(JSON.parse(oldBytes)))));
assert.equal(sha(Buffer.from(JSON.stringify(nextBook))),sha(Buffer.from(JSON.stringify(JSON.parse(nextBytes)))));
for(const row of inputs)assert.equal(sha(await readFile(new URL(row.url))),row.sha256);
session.destroy();
results.push({book,syntheticSavedNotes:items.length,retainedAnchors:count-changed,changedTextNotesPreserved:changed,syntheticDraftsPreserved:changed,apiCalls});
}
for(const row of inputs)assert.equal(sha(await readFile(new URL(row.url))),row.sha256);
const result={status:'passed',sourceModel:'unchanged production annotation model in isolated VM',books:results,inputs,scope:'2129 synthetic saved notes retained,24 changed-text notes and drafts preserved with original quote;0 post/migration/deletion. No IndexedDB/auth/real learner data. Actual UI and main integration separate.'};
await writeFile(new URL('note-preservation-result.json',stage),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result.books));
