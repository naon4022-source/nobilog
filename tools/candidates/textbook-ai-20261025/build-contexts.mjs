// Public source excerpts only. Run --check by default; --write regenerates these fixed outputs.
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createHash,webcrypto} from 'node:crypto';
import vm from 'node:vm';

export const BOOKS=Object.freeze(['math1','kokugo1','english1','science1','geography','history']);
const ROOT=new URL('../../../',import.meta.url);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const HASH=/^[a-f0-9]{64}$/;
const TYPES=new Set(['p','h3','h4','fig','ul','ol','talk','hook']);
const plain=(x,max)=>typeof x==='string'&&x.length<=max&&!/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(x);
let preparation;
async function prepareSource(){
 if(!preparation)preparation=(async()=>{
  const code=await readFile(new URL('site-assets/textbook-annotation-model.js',ROOT),'utf8');
  // This is the repository-owned identity implementation, never code from a book or request.
  const box=vm.createContext({crypto:webcrypto,TextEncoder});
  vm.runInContext(code,box,{timeout:1000,filename:'textbook-annotation-model.js'});
  return box.NobiTextbookAnnotationModel.prepare;
 })().catch(error=>{preparation=null;throw error;});
 return preparation;
}

export async function publicContextIndex(book,raw){
 if(!BOOKS.includes(book)||typeof raw!=='string'||Buffer.byteLength(raw)>2000000)throw Error('invalid_book_source');
 const original=JSON.parse(raw);
 if(!original||original.id!==book||!Array.isArray(original.pages)||!original.pages.length||original.pages.length>2000||!plain(original.title,120)||!plain(original.subject,30))throw Error('invalid_book_source');
 const prepare=await prepareSource(),prepared=await prepare(original,book),contexts=[],anchors=new Set(),pages=new Set();
 for(const page of prepared.data.pages){
  if(!Number.isSafeInteger(page.n)||page.n<1||pages.has(page.n))throw Error('invalid_source_page');
  pages.add(page.n);
  if(!Array.isArray(page.blocks)){
   if(page.blocks!==undefined||!['cover','toc','guide','end'].includes(page.kind))throw Error('invalid_source_page');
   continue;
  }
  const chapter=page.chapter||'',section=page.section||'',sectionTitle=page.sectionTitle||'';
  if(!plain(chapter,160)||!plain(section,160)||!plain(sectionTitle,200))throw Error('invalid_source_heading');
  // Deliberately do not recurse: inherited anchors inside details are not public excerpts.
  for(const block of page.blocks){
   if(!block||!TYPES.has(block.t)||!block.annotationAnchor)continue;
   const anchor=block.annotationAnchor,quote=block.annotationQuote;
   if(!HASH.test(anchor)||!plain(quote,2000)||!quote.trim()||anchors.has(anchor))throw Error('ambiguous_public_context');
   anchors.add(anchor);
   contexts.push({anchor,page:page.n,chapter,section,sectionTitle,kind:block.t,quote});
  }
 }
 if(!contexts.length||contexts.length>12000||!HASH.test(prepared.signature))throw Error('invalid_public_contexts');
 const value={version:1,book,title:original.title,subject:original.subject,sourceSha256:sha(raw),annotationSignature:prepared.signature,contexts};
 const bytes=JSON.stringify(value)+'\n';
 if(Buffer.byteLength(bytes)>2000000)throw Error('public_contexts_too_large');
 return {value,bytes,sha256:sha(bytes)};
}

export async function build(mode='--check'){
 if(!['--check','--write'].includes(mode))throw Error('Use --check or --write');
 const manifest={},outputs=[];
 for(const book of BOOKS){
  const source='site-assets/textbook-book-'+book+'.json',raw=new TextDecoder('utf-8',{fatal:true}).decode(await readFile(new URL(source,ROOT)));
  const result=await publicContextIndex(book,raw),file='site-assets/textbook-ai-context-'+book+'.json';
  manifest[book]={src:'/textbook-ai-context-'+book+'.json',sha256:result.sha256,sourceSha256:result.value.sourceSha256,annotationSignature:result.value.annotationSignature,count:result.value.contexts.length};
  outputs.push({file,bytes:result.bytes});
 }
 outputs.push({file:'cf-worker/src/textbook-ai-context-manifest.mjs',bytes:'// Generated public excerpts: rebuild with tools/candidates/textbook-ai-20261025/build-contexts.mjs --write\nexport const TEXTBOOK_AI_CONTEXTS=Object.freeze('+JSON.stringify(manifest,null,2)+');\n'});
 for(const output of outputs){
  const path=new URL(output.file,ROOT);
  if(mode==='--write')await writeFile(path,output.bytes);
  else if(await readFile(path,'utf8')!==output.bytes)throw Error(output.file+': public context index is stale');
 }
 return {status:mode==='--write'?'generated; not AI integration approval':'passed',mode,books:manifest,outputs:outputs.map(o=>({file:o.file,sha256:sha(o.bytes),bytes:Buffer.byteLength(o.bytes)})),teachingSourcesModified:false,closedDetailsIncluded:false};
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
 const result=await build(process.argv[2]||'--check');
 console.log(JSON.stringify(result,null,2));
}
