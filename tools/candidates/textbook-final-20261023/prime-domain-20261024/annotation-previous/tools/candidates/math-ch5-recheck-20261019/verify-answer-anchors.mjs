// Existing marker identities must remain intact; synthetic model, no notes read.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {webcrypto,createHash} from 'node:crypto';
import vm from 'node:vm';
const root=new URL('../../../',import.meta.url),here=new URL('./',import.meta.url),ctx=vm.createContext({crypto:webcrypto,TextEncoder});
vm.runInContext(await readFile(new URL('site-assets/textbook-annotation-model.js',root),'utf8'),ctx);
const integrated=process.argv.includes('--integrated');
const paths=[new URL('answer-previous/textbook-book-math1.json',here),integrated?new URL('site-assets/textbook-book-math1.json',root):new URL('answer-candidate/textbook-book-math1.json',here)];
const bytes=await Promise.all(paths.map(p=>readFile(p))),books=bytes.map(b=>JSON.parse(b));
const prepared=await Promise.all(books.map(b=>ctx.NobiTextbookAnnotationModel.prepare(b,'math1')));
const flat=bs=>(bs||[]).flatMap(b=>[b,...flat(b.body)]);
const anchors=b=>JSON.parse(JSON.stringify(b.data.pages.flatMap(p=>flat(p.blocks).filter(x=>x.annotationAnchor).map(x=>({pid:p.pid,anchor:x.annotationAnchor,quote:x.annotationQuote}))))).sort((a,b)=>a.anchor.localeCompare(b.anchor));
const before=anchors(prepared[0]),after=anchors(prepared[1]);
assert.equal(before.length,2724);assert.equal(new Set(after.map(x=>x.anchor)).size,after.length);assert.deepEqual(after,before);
assert.notEqual(prepared[0].signature,prepared[1].signature);assert.deepEqual(books[0].toc,books[1].toc);assert.equal(books[0].pageCount,books[1].pageCount);
const hash=b=>createHash('sha256').update(b).digest('hex');
await writeFile(new URL(integrated?'answer-anchors-integrated-result.json':'answer-anchors-candidate-result.json',here),JSON.stringify({status:'passed',integrated,anchors:before.length,bookBeforeSha256:hash(bytes[0]),bookAfterSha256:hash(bytes[1]),sourcePages:books[1].pageCount,layoutSignatureChanged:true,realNotesRead:false},null,2)+'\n');
console.log('All 2724 marker IDs, quotes and source pages unchanged; only layout signature refreshes; no real notes read');
