// Source-update preservation with synthetic notes only; never opens user storage.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash,webcrypto} from 'node:crypto';
import vm from 'node:vm';
const here=new URL('./',import.meta.url),root=new URL('../../../../',here),stage=new URL('integration-contexts/',here);
const sha=b=>createHash('sha256').update(b).digest('hex'),inputs=[];
async function pinned(url){const bytes=await readFile(url);inputs.push({url:url.href,sha256:sha(bytes)});return bytes;}
const source=await pinned(new URL('site-assets/textbook-annotation-model.js',root));
const oldBytes=await pinned(new URL('site-assets/textbook-book-kokugo1.json',root));
const nextBytes=await pinned(new URL('book-alignment-v3/textbook-book-kokugo1.json',here));
const oldBook=JSON.parse(oldBytes),nextBook=JSON.parse(nextBytes);
const box=vm.createContext({crypto:webcrypto,TextEncoder});vm.runInContext(source.toString(),box,{timeout:1000});
const model=box.NobiTextbookAnnotationModel,old=await model.prepare(oldBook,'kokugo1'),next=await model.prepare(nextBook,'kokugo1');
const collect=value=>value.data.pages.flatMap(p=>(p.blocks||[]).filter(b=>b.annotationAnchor));
const oldBlocks=collect(old),nextBlocks=collect(next),newAnchors=new Set(nextBlocks.map(b=>b.annotationAnchor));
const orphaned=oldBlocks.filter(b=>!newAnchors.has(b.annotationAnchor));
assert.equal(orphaned.length,4);
// Normalize the VM-owned array into JSON data, as the real HTTP boundary does.
const items=JSON.parse(JSON.stringify(oldBlocks.map((b,i)=>({book:'kokugo1',anchor:b.annotationAnchor,quote:b.annotationQuote,color:'yellow',note:'隔離確認用メモ '+i,revision:1,updatedAt:1}))));
assert.equal(items.length,1433);
const owner=Object.freeze({uid:'u4',epoch:'synthetic-only'}),apiCalls=[];
const api={snapshot:()=>owner,matches:other=>other===owner,
 get:async book=>{apiCalls.push('get');return {book,items:structuredClone(items),writable:true};},
 post:async()=>{apiCalls.push('post');throw Error('A source update must not save/migrate/delete a note automatically');}};
const session=model.session(api,'kokugo1');
await session.load();
const state=JSON.parse(JSON.stringify(session.state()));
assert.deepEqual(state.items,items);
assert.equal(state.durable,false,'fixture never opens IndexedDB');
assert.equal(state.items.filter(r=>!newAnchors.has(r.anchor)).length,4);
assert.equal(state.items.filter(r=>newAnchors.has(r.anchor)).length,1429);
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
const result={status:'passed',sourceModel:'unchanged production annotation model in isolated VM',syntheticSavedNotes:items.length,retainedAnchors:1429,changedTextNotesPreserved:4,syntheticDraftsPreserved:4,apiCalls,inputs,
 observations:['All old notes remain listed by model after preparing the revised book.','The4 changed text blocks do not receive guessed note reattachment; old quote and note remain intact.','No automatic post/migration/deletion; no IndexedDB/auth/real learner data accessed.'],
 remaining:['Actual annotation UI list/location behavior after candidate book update','Main integration and final standalone whole verification']};
await writeFile(new URL('note-preservation-result.json',stage),JSON.stringify(result,null,2)+'\n');
console.log('Synthetic saved-note preservation passed:1433 notes,1429 retained anchors,4 changed-text notes and4 drafts preserved;0 writes.');
