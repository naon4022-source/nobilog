// Snapshot actual marker identities for precisely unchanged blocks to be moved.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {webcrypto,createHash} from 'node:crypto';
import vm from 'node:vm';
const root=new URL('../../../',import.meta.url),here=new URL('./',import.meta.url);
const receipt=JSON.parse(await readFile(new URL('post-full-verification.json',here),'utf8'));assert.equal(receipt.status,'passed');
const bytes=await readFile(new URL('site-assets/textbook-book-math1.json',root));assert.equal(createHash('sha256').update(bytes).digest('hex'),receipt.bookSha256);
const book=JSON.parse(bytes),ctx=vm.createContext({crypto:webcrypto,TextEncoder});
vm.runInContext(await readFile(new URL('site-assets/textbook-annotation-model.js',root),'utf8'),ctx);
const prepared=await ctx.NobiTextbookAnnotationModel.prepare(book,'math1'),rules=[];
for(const pid of ['M1-P225','M1-P226-練習','M1-P227']){
 const raw=book.pages.find(p=>p.pid===pid),annotated=prepared.data.pages.find(p=>p.pid===pid);
 for(let i=0;i<raw.blocks.length;i++){
  const a=annotated.blocks[i];if(!a.annotationAnchor)continue;
  rules.push({pid,block:raw.blocks[i],anchor:a.annotationAnchor,quote:a.annotationQuote});
 }
}
await mkdir(new URL('layout-candidate/',here),{recursive:true});
await writeFile(new URL('layout-candidate/annotation-compatibility.json',here),JSON.stringify(rules,null,2)+'\n');
console.log('Exact unchanged source blocks captured for layout-only marker compatibility:',rules.length);
