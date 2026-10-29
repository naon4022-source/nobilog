// Generate the exact text/image AI catalogs for the reviewed book, without main writes.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,symlink} from 'node:fs/promises';
import {createHash,webcrypto} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import vm from 'node:vm';
import {publicContextIndex} from '../../textbook-ai-20261025/build-contexts.mjs';
import {TEXTBOOK_AI_CONTEXTS} from '../../../../cf-worker/src/textbook-ai-context-manifest.mjs';
import {TEXTBOOK_VISION_MEDIA} from '../../../../cf-worker/src/textbook-vision-media-manifest.mjs';

const here=new URL('./',import.meta.url),root=new URL('../../../../',here);
const output=new URL('integration-contexts/',here),sourceRoot=new URL('sources/',output);
const sha=b=>createHash('sha256').update(b).digest('hex');
const read=async p=>readFile(new URL(p,root));
const inputs=new Map(),outputs=[];
async function pinned(file){const bytes=await read(file);inputs.set(file,sha(bytes));return bytes;}
async function put(file,bytes){const target=new URL('output/'+file,output);await mkdir(new URL('./',target),{recursive:true});await writeFile(target,bytes);outputs.push({file,sha256:sha(bytes),bytes:Buffer.byteLength(bytes)});}
// mkdir is intentionally exclusive: completed evidence must never be replaced.
await mkdir(output);
const stage=JSON.parse(await pinned(fileURLToPath(new URL('current-stage.json',here))));
for(const r of stage.proofs)assert.equal(sha(await pinned(fileURLToPath(new URL(r.file,here)))),r.sha256);
const bookFile=fileURLToPath(new URL('book-alignment-v3/textbook-book-kokugo1.json',here));
const book=await pinned(bookFile),bookText=new TextDecoder('utf-8',{fatal:true}).decode(book);
const data=JSON.parse(bookText),alignment=JSON.parse(await pinned(fileURLToPath(new URL('book-alignment-v3/result.json',here))));
assert.equal(sha(book),alignment.bookSha256);
assert.equal(alignment.bookChanges.length,5);
await pinned('tools/candidates/textbook-ai-20261025/build-contexts.mjs');
await pinned('site-assets/textbook-annotation-model.js');
const text=await publicContextIndex('kokugo1',bookText);
const textManifest=structuredClone(TEXTBOOK_AI_CONTEXTS);
textManifest.kokugo1={src:'/textbook-ai-context-kokugo1.json',sha256:text.sha256,sourceSha256:text.value.sourceSha256,annotationSignature:text.value.annotationSignature,count:text.value.contexts.length};
assert.equal(text.value.sourceSha256,sha(book));
assert.equal(text.value.contexts.length,TEXTBOOK_AI_CONTEXTS.kokugo1.count);
await put('site-assets/textbook-ai-context-kokugo1.json',text.bytes);

const oldMediaBuilder=await pinned('tools/candidates/textbook-vision-20261027/build-media-contexts.mjs');
let mediaBuilder=oldMediaBuilder.toString();
const transformations=[
 ["import {TEXTBOOK_AI_CONTEXTS} from '../../../cf-worker/src/textbook-ai-context-manifest.mjs';",'const TEXTBOOK_AI_CONTEXTS=Object.freeze('+JSON.stringify(textManifest)+');'],
 ["const root=new URL('../../../',import.meta.url),here=new URL('./',import.meta.url);",'const root=new URL('+JSON.stringify(sourceRoot.href)+'),here=new URL(\'./\',import.meta.url);'],
];
for(const [before,after]of transformations){assert.equal(mediaBuilder.split(before).length,2);mediaBuilder=mediaBuilder.replace(before,after);}
await writeFile(new URL('prepared-media-builder.mjs',output),mediaBuilder);
const imageOverrides=new Map([['/textbook-book-kokugo1-k1-c1-s1-dp.svg',fileURLToPath(new URL('../explanation-figures-20261028/candidate/K1-C1-S1-DP.svg',here))]]);
await mkdir(new URL('site-assets/',sourceRoot),{recursive:true});
const imageNames=new Set(data.pages.flatMap(p=>(p.blocks||[]).filter(b=>b.t==='media'&&b.kind!=='video'&&/^\/textbook-book-[a-z0-9-]+\.(svg|jpg|png)$/.test(b.src||'')).map(b=>b.src)));
assert(imageNames.size>0);
for(const name of imageNames){
 const source=imageOverrides.get(name)||fileURLToPath(new URL('site-assets'+name,root));
 await pinned(source);await symlink(source,new URL('site-assets'+name,sourceRoot));
}
assert(imageNames.has([...imageOverrides.keys()][0]));
const box=vm.createContext({crypto:webcrypto,TextEncoder});
vm.runInContext((await read('site-assets/textbook-annotation-model.js')).toString(),box,{timeout:1000});
const {mediaContextIndex}=await import(pathToFileURL(fileURLToPath(new URL('prepared-media-builder.mjs',output))).href);
const media=await mediaContextIndex('kokugo1',bookText,box.NobiTextbookAnnotationModel.prepare);
assert.equal(media.value.sourceSha256,text.value.sourceSha256);
assert.equal(media.value.annotationSignature,text.value.annotationSignature);
assert.equal(media.value.contexts.length,TEXTBOOK_VISION_MEDIA.kokugo1.count);
await put('site-assets/textbook-ai-media-context-kokugo1.json',media.bytes);
const mediaManifest=structuredClone(TEXTBOOK_VISION_MEDIA);
mediaManifest.kokugo1={src:'/textbook-ai-media-context-kokugo1.json',sha256:media.sha256,sourceSha256:media.value.sourceSha256,annotationSignature:media.value.annotationSignature,count:media.value.contexts.length};
for(const name of Object.keys(TEXTBOOK_AI_CONTEXTS).filter(k=>k!=='kokugo1')){
 assert.deepEqual(textManifest[name],TEXTBOOK_AI_CONTEXTS[name]);
 assert.deepEqual(mediaManifest[name],TEXTBOOK_VISION_MEDIA[name]);
}
async function manifest(file,name,value){
 const original=(await pinned(file)).toString(),prefix=original.slice(0,original.indexOf('export const '));
 assert(original.includes('export const '+name+'=Object.freeze('));
 await put(file,prefix+'export const '+name+'=Object.freeze('+JSON.stringify(value,null,2)+');\n');
}
await manifest('cf-worker/src/textbook-ai-context-manifest.mjs','TEXTBOOK_AI_CONTEXTS',textManifest);
for(const file of ['cf-worker/src/textbook-vision-media-manifest.mjs','site-assets/textbook-vision-media-manifest.mjs'])await manifest(file,'TEXTBOOK_VISION_MEDIA',mediaManifest);

const oldText=JSON.parse(await pinned('site-assets/textbook-ai-context-kokugo1.json'));
const oldMedia=JSON.parse(await pinned('site-assets/textbook-ai-media-context-kokugo1.json'));
const oldQuotes=new Set(oldText.contexts.map(c=>c.quote)),newQuotes=new Set(text.value.contexts.map(c=>c.quote));
const removedQuotes=[...oldQuotes].filter(q=>!newQuotes.has(q)),addedQuotes=[...newQuotes].filter(q=>!oldQuotes.has(q));
assert(removedQuotes.length>0&&removedQuotes.length===addedQuotes.length);
const changedFigures=media.value.contexts.filter(c=>oldMedia.contexts.find(x=>x.src===c.src)?.assetSha256!==c.assetSha256);
assert.deepEqual(changedFigures.map(c=>c.src),[...imageOverrides.keys()]);
for(const [file,digest]of inputs)assert.equal(sha(await read(file)),digest,'Pinned public input changed: '+file);
const result={status:'candidate catalogs prepared; main unchanged',book:'kokugo1',sourceSha256:sha(book),annotationSignature:text.value.annotationSignature,
 counts:{text:text.value.contexts.length,images:media.value.contexts.length,removedQuotes:removedQuotes.length,addedQuotes:addedQuotes.length,changedFigures:changedFigures.length},
 changedQuotes:{removed:removedQuotes,added:addedQuotes},changedFigures,outputs,
 inputs:[...inputs].map(([file,sha256])=>({file,sha256})),
 transformations:{sourceSha256:sha(oldMediaBuilder),changes:transformations,preparedSha256:sha(Buffer.from(mediaBuilder))},
 remaining:['Actual candidate route/panel binding tests','Reviewed historical source successor for main integration','Main source/book/media/catalog promotion and final standalone whole verification'],
 scope:'Original text-context function and exact media-context function with isolated root and reviewed manifest. Only kokugo1 row differs in3 manifests; other5 books preserved. Closed answer bodies excluded by original root-block traversal. No main writes, API calls, user records, real AI or publication.'};
await writeFile(new URL('result.json',output),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({status:result.status,counts:result.counts,outputs:outputs.length}));
