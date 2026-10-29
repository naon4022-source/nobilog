// Read-only public source audit. Never writes books, marker identities or
// generated catalogs. Media inside closed answers is deliberately excluded.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash,webcrypto} from 'node:crypto';
import vm from 'node:vm';
import {TEXTBOOK_AI_CONTEXTS} from '../../../cf-worker/src/textbook-ai-context-manifest.mjs';
const ROOT=new URL('../../../',import.meta.url),here=new URL('./',import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex');
const model=await readFile(new URL('site-assets/textbook-annotation-model.js',ROOT),'utf8'),box=vm.createContext({crypto:webcrypto,TextEncoder});vm.runInContext(model,box,{timeout:1000});
const books=[],inputs=[{file:'site-assets/textbook-annotation-model.js',sha256:sha(model)}];
for(const [book,entry]of Object.entries(TEXTBOOK_AI_CONTEXTS)){
 const source='site-assets/textbook-book-'+book+'.json',raw=await readFile(new URL(source,ROOT)),catalogFile='site-assets'+entry.src,bytes=await readFile(new URL(catalogFile,ROOT)),catalog=JSON.parse(bytes),prepared=await box.NobiTextbookAnnotationModel.prepare(JSON.parse(raw),book),publicAnchors=new Set(catalog.contexts.map(x=>x.anchor));
 if(sha(raw)!==entry.sourceSha256||sha(bytes)!==entry.sha256||prepared.signature!==entry.annotationSignature)throw Error('source_changed');
 const media=[],figs=[];for(const page of prepared.data.pages)for(const b of page.blocks||[]){
  if(typeof b.src!=='string'||!/^\/textbook-book-[a-z0-9-]+\.(svg|jpg|png)$/.test(b.src))continue;
  const row={page:page.n,src:b.src,hasExistingAnchor:typeof b.annotationAnchor==='string',inPublicCatalog:publicAnchors.has(b.annotationAnchor)};
  if(b.t==='media'&&b.kind!=='video')media.push(row);if(b.t==='fig')figs.push(row);
 }
 books.push({book,publicExistingFigures:figs.filter(x=>x.inPublicCatalog).length,rootImageMedia:media.length,mediaInPublicCatalog:media.filter(x=>x.inPublicCatalog).length,unmappedPublicImageMedia:media.filter(x=>!x.inPublicCatalog),note:'Counts only root source blocks. No closed-answer traversal. Missing media identities require a separate supplement; do not change existing marker IDs or assume a nearby old figure is the same image.'});
 inputs.push({file:source,sha256:sha(raw)},{file:catalogFile,sha256:sha(bytes)});
 if(sha(await readFile(new URL(source,ROOT)))!==sha(raw))throw Error('source_changed');
}
inputs.push({file:'tools/candidates/textbook-vision-20261027/audit-media-anchors.mjs',sha256:sha(await readFile(new URL('audit-media-anchors.mjs',here)))});
await writeFile(new URL('media-anchor-audit.json',here),JSON.stringify({status:'audited; multi-book image panel incomplete',books,inputs,scope:'Actual public source and unchanged annotation prepare. No new identities, no source/catalog/grades writes, no proof that all media content is reviewed.'},null,2)+'\n');
console.log(JSON.stringify(books.map(({book,publicExistingFigures,rootImageMedia,mediaInPublicCatalog})=>({book,publicExistingFigures,rootImageMedia,mediaInPublicCatalog}))));
