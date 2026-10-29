// Candidate supplement only. Never overwrites books, marker IDs or old catalogs.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash,webcrypto} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const TEXTBOOK_AI_CONTEXTS=Object.freeze({"math1":{"src":"/textbook-ai-context-math1.json","sha256":"23fe208271f594da410a335c556a9532322b5f56eb71cad5ed9be83febbbdcfe","sourceSha256":"685fa2d87542ce6dfff0d07758dee757a581456f3f4042d2e3b1b5f4001eaddd","annotationSignature":"f10a9fab3b6a2d241053d92cafc953de6275a9a97baba051db940354018b4d67","count":2721},"kokugo1":{"src":"/textbook-ai-context-kokugo1.json","sha256":"8c14a9b8fc4124d67594bc5e6a8a1fe38e4f412440699cca9a3d77ba9cd18bee","sourceSha256":"4a87f48872989749128b2ccf25e44b41b63fe7c14a81cbf269d41994ebbe0d6c","annotationSignature":"ac6feb8a6eef655a4dda5cdb48da925f89e686efe7efba5c061602370d7de05b","count":1433},"english1":{"src":"/textbook-ai-context-english1.json","sha256":"be374f30f054a4971b9d9701afbade94a72cca27044bd78df476887094b1aac7","sourceSha256":"d52f9a1f1532121af8f13e651a6f04cbe3f800cd34ad15a7fa72a0fdc3b416fd","annotationSignature":"b1df08d50817c8cb6615fe93077c10032b36e570478728f08da9610f78f3c613","count":696},"science1":{"src":"/textbook-ai-context-science1.json","sha256":"540926a2cf8e0ea7f4544eed3cdda4f793f9d8229b20c9c83ee02f449c1e5260","sourceSha256":"7c8177a234e4443c24f74cfa0c9bf9d8739c9e820cff23d6ab6cb6c532a0e892","annotationSignature":"dc9137bda281f0b9afa3a4c39e8c43954a41f111a116a9e1b71e4b3122e27722","count":437},"geography":{"src":"/textbook-ai-context-geography.json","sha256":"1ce0b35ecaca9a7aec23127d47ae15b54951094ef41c80317e27e05b5423101f","sourceSha256":"5e8e314dfe44ab31b0c6fa80cc3ed0d1cab45873759afda880623cd4b390a9bc","annotationSignature":"4d02420efb4f68a5264cfcc786bdbbc2266843fe6081b835701464c5df3153c5","count":341},"history":{"src":"/textbook-ai-context-history.json","sha256":"f94ee43387cd54f3db30802788bf356857f20f13063d1b5e05dc344f7e39a6b0","sourceSha256":"86e40853ea511c05a051ad8b0c2ca370ba7f3a140606188d794450356c2d8696","annotationSignature":"0ff5bd142d7649d0e5d4aebb1e09334eaa62a3510025480a7f21bae90eafff09","count":381}});
const root=new URL("file:///Users/shimizunaotomoo/Desktop/my-app/tools/candidates/textbook-final-20261023/kokugo-reading-20261027/integration-contexts/sources/"),here=new URL('./',import.meta.url);
const sha=x=>createHash('sha256').update(x).digest('hex');
const asset=/^\/textbook-book-[a-z0-9-]+\.(svg|jpg|png)$/;
const plain=(s,n)=>typeof s==='string'&&s.length<=n&&!/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(s);
export async function mediaContextIndex(book,raw,prepare){
 if(!Object.hasOwn(TEXTBOOK_AI_CONTEXTS,book))throw Error('invalid_book');
 const entry=TEXTBOOK_AI_CONTEXTS[book];if(sha(raw)!==entry.sourceSha256)throw Error('source_changed');
 const data=JSON.parse(raw),prepared=await prepare(data,book);
 if(prepared.signature!==entry.annotationSignature)throw Error('source_changed');
 const contexts=[],seen=new Set(),anchors=new Set(),pages=new Set();
 for(const page of data.pages){
  if(!Number.isSafeInteger(page.n)||page.n<1||page.n>2000||pages.has(page.n))throw Error('invalid_page');pages.add(page.n);
  // Root blocks only. Never inspect or index a closed answer's body.
  for(const [index,b]of (page.blocks||[]).entries()){
   if(b.t!=='media'||b.kind==='video'||!asset.test(b.src||''))continue;
   if(seen.has(b.src))throw Error('ambiguous_media_source');seen.add(b.src);
   const quote=String(b.title||b.caption||'図').replace(/\*\*|`/g,'').trim();
   const chapter=page.chapter||'',section=page.section||'',sectionTitle=page.sectionTitle||'';
   if(!plain(quote,2000)||!quote||!plain(chapter,160)||!plain(section,160)||!plain(sectionTitle,200))throw Error('invalid_media_text');
   const anchor=sha('textbook-vision-media-v1:'+book+':'+page.n+':'+index+':'+JSON.stringify(b));
   if(anchors.has(anchor))throw Error('ambiguous_media_anchor');anchors.add(anchor);
   const pixels=await readFile(new URL('site-assets'+b.src,root));
   contexts.push({anchor,page:page.n,chapter,section,sectionTitle,kind:'fig',quote,src:b.src,assetSha256:sha(pixels)});
  }
 }
 if(!contexts.length||contexts.length>2000)throw Error('invalid_media_count');
 const value={version:1,book,title:data.title,subject:data.subject,sourceSha256:entry.sourceSha256,annotationSignature:prepared.signature,contexts};
 if(!plain(value.title,120)||!plain(value.subject,30))throw Error('invalid_book');
 const bytes=JSON.stringify(value)+'\n';if(Buffer.byteLength(bytes)>2000000)throw Error('media_catalog_size');
 return {value,bytes,sha256:sha(bytes)};
}
export async function build(mode='--check'){
 if(!['--check','--write'].includes(mode))throw Error('invalid_mode');
 const code=await readFile(new URL('site-assets/textbook-annotation-model.js',root),'utf8'),box=vm.createContext({crypto:webcrypto,TextEncoder});vm.runInContext(code,box,{timeout:1000});
 const outputs=[],manifest={};
 for(const book of Object.keys(TEXTBOOK_AI_CONTEXTS)){
  const raw=await readFile(new URL('site-assets/textbook-book-'+book+'.json',root),'utf8');
  const {value,bytes,sha256}=await mediaContextIndex(book,raw,box.NobiTextbookAnnotationModel.prepare);
  const src='/textbook-ai-media-context-'+book+'.json';
  manifest[book]={src,sha256,sourceSha256:value.sourceSha256,annotationSignature:value.annotationSignature,count:value.contexts.length};
  outputs.push({file:'media-contexts'+src,bytes});
 }
 outputs.push({file:'textbook-vision-media-manifest.mjs',bytes:'// Candidate public media supplement. Generated by build-media-contexts.mjs.\nexport const TEXTBOOK_VISION_MEDIA=Object.freeze('+JSON.stringify(manifest,null,2)+');\n'});
 if(mode==='--write')await mkdir(new URL('media-contexts/',here),{recursive:true});
 for(const o of outputs){if(mode==='--write')await writeFile(new URL(o.file,here),o.bytes);else if(await readFile(new URL(o.file,here),'utf8')!==o.bytes)throw Error('stale_media_catalog');}
 return {status:mode==='--check'?'passed':'candidate generated',books:manifest,outputs:outputs.map(({file,bytes})=>({file,sha256:sha(bytes)}))};
}
if(process.argv[1]===fileURLToPath(import.meta.url))console.log(JSON.stringify(await build(process.argv[2]||'--check')));
