// Historical layout checks must separately audit the explicitly approved text correction.
// Never reuse an old annotation ID for changed text or read real stored annotations.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const {checkedSource}=createRequire(import.meta.url)('./explanations-20261025/checked-source.cjs');
const root=new URL('../../../',import.meta.url);
const oldText='どんな自然数も、素数のかけ算に分けられる。数の「部品」を見つけよう。';
const newText='1より大きい自然数は、素数のかけ算に分けられる。数の「部品」を見つけよう。';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const flat=blocks=>(blocks||[]).flatMap(b=>[b,...flat(b.body)]);
const anchors=data=>JSON.parse(JSON.stringify(data.pages.flatMap(p=>flat(p.blocks).filter(b=>b.annotationAnchor).map(b=>({pid:p.pid,anchor:b.annotationAnchor,quote:b.annotationQuote}))))).sort((a,b)=>a.anchor.localeCompare(b.anchor));
export async function approvedDomainPredecessor(model,bytes){
 const actualBytes=bytes,current=await readFile(new URL('site-assets/textbook-book-math1.json',root));
 // Audit the exact later approved explanation delta before comparing the older prime correction.
 if(hash(bytes)===hash(current))bytes=Buffer.from(checkedSource('site-assets/textbook-book-math1.json'));
 const currentText=bytes.toString('utf8');
 // Earlier layout candidates still contain the original hook and need no exception.
 if(!currentText.includes(newText))return {bytes,correction:null};
 const receipt=JSON.parse(await readFile(new URL('tools/candidates/textbook-final-20261023/prime-domain-20261024/receipt.json',root),'utf8'));
 assert.equal(receipt.approval,'User explicitly approved this explanation only');
 assert.equal(receipt.page,'M1-P062a');assert.equal(receipt.before,oldText);assert.equal(receipt.after,newText);
 for(const row of receipt.files){
  const before=await readFile(new URL(row.beforeFile,root)),after=Buffer.from(checkedSource(row.file));
  assert.equal(hash(before),row.beforeSha256);assert.equal(hash(after),row.afterSha256);
  assert.equal(before.toString('utf8').split(oldText).length-1,1);
  assert.equal(Buffer.compare(Buffer.from(before.toString('utf8').replace(oldText,newText)),after),0,'only approved text delta');
 }
 const book=receipt.files.find(x=>x.file==='site-assets/textbook-book-math1.json');assert(book);
 assert.equal(hash(bytes),book.afterSha256,'unreviewed book changes require a new preservation audit');
 const beforeBytes=await readFile(new URL(book.beforeFile,root));
 const [before,after]=await Promise.all([model.prepare(JSON.parse(beforeBytes),'math1'),model.prepare(JSON.parse(bytes),'math1')]);
 const a=anchors(before.data),b=anchors(after.data);assert.equal(a.length,2724);assert.equal(b.length,2724);
 assert.equal(new Set(b.map(x=>x.anchor)).size,b.length);
 const oldHook=a.filter(x=>x.pid==='M1-P062a'&&x.quote===oldText),newHook=b.filter(x=>x.pid==='M1-P062a'&&x.quote===newText);
 assert.equal(oldHook.length,1);assert.equal(newHook.length,1);assert.notEqual(oldHook[0].anchor,newHook[0].anchor,'changed quote must not silently inherit old note');
 assert.deepEqual(b.filter(x=>x.anchor!==newHook[0].anchor),a.filter(x=>x.anchor!==oldHook[0].anchor),'all other2723 marker IDs/quotes/pages preserved');
 assert(!b.some(x=>x.anchor===oldHook[0].anchor));assert.notEqual(before.signature,after.signature,'corrected book refreshes cache');
 // An old record remains available in the note list. No save, delete or real API.
 const owner={uid:'u1',synthetic:true},saved={book:'math1',anchor:oldHook[0].anchor,quote:oldText,color:'yellow',note:'Synthetic retained note',revision:1,updatedAt:0};
 const api={snapshot:()=>owner,matches:x=>x===owner,get:async()=>({book:'math1',items:[saved],writable:true}),post:()=>{throw Error('must not write notes');}};
 const session=model.session(api,'math1');await session.load();assert.deepEqual(JSON.parse(JSON.stringify(session.state().items)),[saved]);session.destroy();
 return {bytes:beforeBytes,correction:{page:'M1-P062a',unchangedOtherAnchors:2723,changedQuoteDoesNotInherit:true,oldSyntheticRecordRetained:true,currentBookSha256:hash(actualBytes),historicalComparisonBookSha256:hash(beforeBytes)}};
}
