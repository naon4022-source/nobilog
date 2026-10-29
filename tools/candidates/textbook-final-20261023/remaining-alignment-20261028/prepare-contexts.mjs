// Isolated two-book successor; never changes the main books or manifests.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,symlink} from 'node:fs/promises';
import {createHash,webcrypto} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import vm from 'node:vm';
import {publicContextIndex} from '../../textbook-ai-20261025/build-contexts.mjs';
import {TEXTBOOK_AI_CONTEXTS} from '../../../../cf-worker/src/textbook-ai-context-manifest.mjs';
import {TEXTBOOK_VISION_MEDIA} from '../../../../cf-worker/src/textbook-vision-media-manifest.mjs';

const here=new URL('./',import.meta.url),root=new URL('../../../../',here);
const out=new URL('integration-contexts/',here),sources=new URL('sources/',out);
const sha=b=>createHash('sha256').update(b).digest('hex'),inputs=new Map(),outputs=[];
async function pin(url){const b=await readFile(url);inputs.set(fileURLToPath(url),sha(b));return b;}
async function put(file,bytes){const url=new URL('output/'+file,out);await mkdir(new URL('./',url),{recursive:true});await writeFile(url,bytes);outputs.push({file,sha256:sha(bytes)});}
await mkdir(out); // Refuse to replace a completed or partial generation.
await pin(new URL('prepare-contexts.mjs',here));
await pin(new URL('book-result.json',here));
const selected=JSON.parse(await pin(new URL('figures/selected-visual-result.json',here)));
assert.equal(selected.selectedFigures.length,8);
const overrides=new Map();
for(const row of selected.selectedFigures){
 const url=new URL(row.file,root);assert.equal(sha(await pin(url)),row.sha256);
 const book=row.id.startsWith('K1-')?'kokugo1':'english1';
 overrides.set(`/textbook-book-${book}-${row.id.toLowerCase()}.svg`,url);
}
const textManifest=structuredClone(TEXTBOOK_AI_CONTEXTS),mediaManifest=structuredClone(TEXTBOOK_VISION_MEDIA);
const books=new Map(),texts=new Map();
await pin(new URL('tools/candidates/textbook-ai-20261025/build-contexts.mjs',root));
for(const name of ['kokugo1','english1']){
 const bytes=await pin(new URL(`candidate-books/textbook-book-${name}.json`,here));
 const text=await publicContextIndex(name,bytes.toString());
 assert.equal(text.value.sourceSha256,sha(bytes));
 assert.equal(text.value.contexts.length,TEXTBOOK_AI_CONTEXTS[name].count);
 books.set(name,bytes.toString());texts.set(name,text);
 textManifest[name]={src:`/textbook-ai-context-${name}.json`,sha256:text.sha256,sourceSha256:text.value.sourceSha256,annotationSignature:text.value.annotationSignature,count:text.value.contexts.length};
 await put(`site-assets/textbook-ai-context-${name}.json`,text.bytes);
}
const originalBuilder=await pin(new URL('tools/candidates/textbook-vision-20261027/build-media-contexts.mjs',root));
let builder=originalBuilder.toString();
const replacements=[
 ["import {TEXTBOOK_AI_CONTEXTS} from '../../../cf-worker/src/textbook-ai-context-manifest.mjs';",'const TEXTBOOK_AI_CONTEXTS=Object.freeze('+JSON.stringify(textManifest)+');'],
 ["const root=new URL('../../../',import.meta.url),here=new URL('./',import.meta.url);",'const root=new URL('+JSON.stringify(sources.href)+'),here=new URL(\'./\',import.meta.url);']
];
for(const [before,after]of replacements){assert.equal(builder.split(before).length,2);builder=builder.replace(before,after);}
await writeFile(new URL('prepared-media-builder.mjs',out),builder);
await mkdir(new URL('site-assets/',sources),{recursive:true});
const names=new Set();
for(const book of books.values())for(const page of JSON.parse(book).pages)for(const block of page.blocks||[]){
 if(block.t==='media'&&block.kind!=='video'&&/^\/textbook-book-[a-z0-9-]+\.(svg|jpg|png)$/.test(block.src||''))names.add(block.src);
}
for(const name of overrides.keys())assert(names.has(name),'Every selected diagram is actually referenced');
for(const name of names){const url=overrides.get(name)||new URL('site-assets'+name,root);await pin(url);await symlink(fileURLToPath(url),new URL('site-assets'+name,sources));}
const box=vm.createContext({crypto:webcrypto,TextEncoder});
vm.runInContext((await pin(new URL('site-assets/textbook-annotation-model.js',root))).toString(),box,{timeout:1000});
const {mediaContextIndex}=await import(pathToFileURL(fileURLToPath(new URL('prepared-media-builder.mjs',out))).href);
const summaries=[];
for(const [name,book]of books){
 const text=texts.get(name),media=await mediaContextIndex(name,book,box.NobiTextbookAnnotationModel.prepare);
 assert.equal(media.value.sourceSha256,text.value.sourceSha256);
 assert.equal(media.value.annotationSignature,text.value.annotationSignature);
 assert.equal(media.value.contexts.length,TEXTBOOK_VISION_MEDIA[name].count);
 await put(`site-assets/textbook-ai-media-context-${name}.json`,media.bytes);
 mediaManifest[name]={src:`/textbook-ai-media-context-${name}.json`,sha256:media.sha256,sourceSha256:media.value.sourceSha256,annotationSignature:media.value.annotationSignature,count:media.value.contexts.length};
 const oldText=JSON.parse(await pin(new URL(`site-assets/textbook-ai-context-${name}.json`,root)));
 const oldMedia=JSON.parse(await pin(new URL(`site-assets/textbook-ai-media-context-${name}.json`,root)));
 const changed=media.value.contexts.filter(c=>oldMedia.contexts.find(x=>x.src===c.src)?.assetSha256!==c.assetSha256);
 assert.deepEqual(new Set(changed.map(c=>c.src)),new Set([...overrides.keys()].filter(k=>k.startsWith(`/textbook-book-${name}-`))));
 const prior=new Set(oldText.contexts.map(c=>c.quote)),next=new Set(text.value.contexts.map(c=>c.quote));
 summaries.push({book:name,sourceSha256:sha(Buffer.from(book)),text:text.value.contexts.length,images:media.value.contexts.length,changedFigures:changed,removedQuotes:[...prior].filter(q=>!next.has(q)),addedQuotes:[...next].filter(q=>!prior.has(q))});
}
for(const name of Object.keys(TEXTBOOK_AI_CONTEXTS).filter(n=>!books.has(n))){assert.deepEqual(textManifest[name],TEXTBOOK_AI_CONTEXTS[name]);assert.deepEqual(mediaManifest[name],TEXTBOOK_VISION_MEDIA[name]);}
for(const [file,name,value]of [['cf-worker/src/textbook-ai-context-manifest.mjs','TEXTBOOK_AI_CONTEXTS',textManifest],['cf-worker/src/textbook-vision-media-manifest.mjs','TEXTBOOK_VISION_MEDIA',mediaManifest],['site-assets/textbook-vision-media-manifest.mjs','TEXTBOOK_VISION_MEDIA',mediaManifest]]){
 const original=(await pin(new URL(file,root))).toString();assert(original.includes('export const '+name+'=Object.freeze('));
 await put(file,original.slice(0,original.indexOf('export const '))+'export const '+name+'=Object.freeze('+JSON.stringify(value,null,2)+');\n');
}
for(const [file,digest]of inputs)assert.equal(sha(await readFile(file)),digest,'Input changed during isolated generation');
const result={status:'two-book candidate catalogs generated; not integrated or route-approved',books:summaries,outputs,inputs:[...inputs].map(([file,sha256])=>({file,sha256})),builder:{originalSha256:sha(originalBuilder),preparedSha256:sha(Buffer.from(builder)),replacements},remaining:['Actual retrieval/closed-answer exclusion and stale-reference tests','Candidate book figure placement and4width zoom','Remaining videos and Kyoko speech repair','Main integration and standalone whole verification'],scope:'Original text/media builders; only isolated source root and explicit manifests substituted. Two book rows changed, other4 preserved. No API/auth/user-data/provider activation/main writes/publication.'};
await writeFile(new URL('result.json',out),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({status:result.status,outputs:outputs.length,books:summaries.map(({book,text,images,changedFigures})=>({book,text,images,changedFigures:changedFigures.length}))}));
