// Real marker model, exact old/candidate curricula. Synthetic identities only, no stored notes.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {webcrypto,createHash} from 'node:crypto';
import vm from 'node:vm';
const root=new URL('../../../',import.meta.url),out=new URL('layout-candidate/',import.meta.url),ctx=vm.createContext({crypto:webcrypto,TextEncoder});
vm.runInContext(await readFile(new URL('site-assets/textbook-annotation-model.js',root),'utf8'),ctx);
const integrated=process.argv.includes('--integrated'),oldPath=integrated?new URL('layout-previous/site-assets/textbook-book-math1.json',import.meta.url):new URL('site-assets/textbook-book-math1.json',root),candidatePath=integrated?new URL('site-assets/textbook-book-math1.json',root):new URL('book.json',out);
const old=JSON.parse(await readFile(oldPath,'utf8')),candidate=JSON.parse(await readFile(candidatePath,'utf8'));
const model=ctx.NobiTextbookAnnotationModel,[a,b]=await Promise.all([model.prepare(old,'math1'),model.prepare(candidate,'math1')]);
const flat=blocks=>(blocks||[]).flatMap(b=>[b,...flat(b.body)]);
const anchors=data=>JSON.parse(JSON.stringify(data.pages.flatMap(p=>flat(p.blocks).filter(b=>b.annotationAnchor).map(b=>({anchor:b.annotationAnchor,quote:b.annotationQuote,pid:p.pid}))))).sort((a,b)=>a.anchor.localeCompare(b.anchor));
const before=anchors(a.data),after=anchors(b.data);
assert.equal(new Set(before.map(x=>x.anchor)).size,before.length);assert.equal(new Set(after.map(x=>x.anchor)).size,after.length);
assert.deepEqual(after,before,'every existing marker ID, quote and source page preserved despite figure order');assert.equal(before.length,2724);
assert.notEqual(a.signature,b.signature,'layout cache must refresh');assert.deepEqual(old.toc,candidate.toc);assert.equal(old.pageCount,candidate.pageCount);
const changed=candidate.pages.find(p=>p.pid==='M1-P147');assert(changed);const annotated=changed.blocks.filter(b=>b.annotationAnchor);assert.equal(annotated.length,8);
let checks=0;
for(const original of annotated){
 const edited=structuredClone(candidate),p=edited.pages.find(p=>p.pid==='M1-P147'),i=p.blocks.findIndex(b=>b.annotationAnchor===original.annotationAnchor);
 const block=p.blocks[i];if(typeof block.x==='string')block.x+=' 別の内容';else if(typeof block.caption==='string')block.caption+=' 別の図';else block.items=[...(block.items||[]),'別の内容'];
 const modified=await model.prepare(edited,'math1');assert.notEqual(modified.data.pages.find(p=>p.pid==='M1-P147').blocks[i].annotationAnchor,original.annotationAnchor,'edited quote cannot inherit an old note');checks++;
}
const hash=b=>createHash('sha256').update(b).digest('hex');
await writeFile(new URL(integrated?'annotation-integrated-result.json':'annotation-result.json',out),JSON.stringify({status:'passed',anchors:before.length,sourcePages:old.pageCount,changedSourcePage:'M1-P147',preservedExplicitAnchors:8,editedQuoteRejections:checks,beforeBookSha256:hash(await readFile(oldPath)),candidateBookSha256:hash(await readFile(candidatePath)),layoutSignatureChanged:true,noUserDataRead:true},null,2)+'\n');
console.log('2724 marker IDs/quotes/source pages unchanged; 8 edited quotes rejected; layout cache signature refreshed; no real notes accessed');
