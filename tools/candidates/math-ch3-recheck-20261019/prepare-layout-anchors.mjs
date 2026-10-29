// Preserve existing identities on unchanged source blocks; never read stored notes.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
import vm from 'node:vm';
const root=new URL('../../../',import.meta.url),here=new URL('layout-candidate/',import.meta.url),ctx=vm.createContext({crypto:webcrypto,TextEncoder});
vm.runInContext(await readFile(new URL('site-assets/textbook-annotation-model.js',root),'utf8'),ctx);
const old=JSON.parse(await readFile(new URL('site-assets/textbook-book-math1.json',root),'utf8')),prepared=await ctx.NobiTextbookAnnotationModel.prepare(old,'math1');
const index=old.pages.findIndex(p=>p.pid==='M1-P147');assert(index>=0);
const rules=old.pages[index].blocks.flatMap((block,i)=>{
 const annotated=prepared.data.pages[index].blocks[i];
 return annotated.annotationAnchor?[{pid:'M1-P147',block,anchor:annotated.annotationAnchor,quote:annotated.annotationQuote}]:[];
});
const extras=JSON.parse(await readFile(new URL('教材整理/Claude_Codex共有/数学全体制作/Claude原稿/M1-C3-S2/本の追加.json',root),'utf8'));
assert(!extras.annotationCompatibility,'new explicit compatibility data only');extras.annotationCompatibility=rules;
await writeFile(new URL('本の追加.json',here),JSON.stringify(extras,null,1)+'\n');
await writeFile(new URL('annotation-compatibility.json',here),JSON.stringify(rules,null,2)+'\n');
console.log(rules.length+' exact unchanged source blocks receive original marker identities; no user notes read');
