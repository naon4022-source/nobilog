import {TEXTBOOK_AI_CONTEXTS} from './textbook-ai-context-manifest.mjs';

const HASH=/^[a-f0-9]{64}$/;
const LIMIT=2000000;
const fields=(value,keys)=>!!value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).sort().join(',')===keys;
const plain=(value,max)=>typeof value==='string'&&value.length<=max&&!/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value);
const fail=code=>{throw Error(code);};
async function discard(response){try{await response?.body?.cancel();}catch(_){}}
async function bytesOf(response){
 if(!response?.ok||response.redirected||!/^application\/json\b/i.test(response.headers.get('Content-Type')||'')||!response.body){await discard(response);fail('context_unavailable');}
 const declared=response.headers.get('Content-Length');
 if(declared!==null&&(!/^\d+$/.test(declared)||Number(declared)>LIMIT)){await discard(response);fail('context_unavailable');}
 const reader=response.body.getReader(),parts=[];let size=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>LIMIT){await reader.cancel();fail('context_unavailable');}parts.push(value);}}finally{reader.releaseLock();}
 if(!size)fail('context_unavailable');
 const bytes=new Uint8Array(size);let at=0;for(const part of parts){bytes.set(part,at);at+=part.byteLength;}
 return bytes;
}
async function catalog(fetcher,origin,book,entry,signal){
 const url=new URL(entry.src,origin).href;
 // Construct a fresh public request; no authenticated request or its headers are forwarded.
 const response=await fetcher(new Request(url,{method:'GET',headers:{Accept:'application/json','Cache-Control':'no-cache'},redirect:'error',cache:'no-store',signal}));
 if(response.url&&response.url!==url){await discard(response);fail('context_unavailable');}
 const bytes=await bytesOf(response),digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
 if(digest!==entry.sha256)fail('context_changed');
 let data;try{data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch(_){fail('context_unavailable');}
 if(!fields(data,'annotationSignature,book,contexts,sourceSha256,subject,title,version')||data.version!==1||data.book!==book||data.sourceSha256!==entry.sourceSha256||data.annotationSignature!==entry.annotationSignature||!plain(data.title,120)||!data.title.trim()||!plain(data.subject,30)||!Array.isArray(data.contexts)||data.contexts.length!==entry.count)fail('context_unavailable');
 const rows=new Map();
 for(const row of data.contexts){
  if(!fields(row,'anchor,chapter,kind,page,quote,section,sectionTitle')||typeof row.anchor!=='string'||!HASH.test(row.anchor)||rows.has(row.anchor)||!Number.isSafeInteger(row.page)||row.page<1||!['p','h3','h4','fig','ul','ol','talk','hook'].includes(row.kind)||!plain(row.chapter,160)||!plain(row.section,160)||!plain(row.sectionTitle,200)||!plain(row.quote,2000)||!row.quote.trim())fail('context_unavailable');
  rows.set(row.anchor,Object.freeze({...row}));
 }
 return Object.freeze({title:data.title,subject:data.subject,rows});
}

export function publicTextbookContextReader({fetcher=fetch,timeoutMs=5000}={}){
 if(typeof fetcher!=='function'||!Number.isSafeInteger(timeoutMs)||timeoutMs<1||timeoutMs>5000)fail('invalid_context_reader');
 // At most six immutable public catalogs. No identity, headers, private drafts, or AI replies are cached.
 const cache=new Map();
 return async function read(env,selection){
  if(!fields(selection,Object.hasOwn(selection||{},'contextSha256')?'anchor,annotationSignature,book,contextSha256':'anchor,annotationSignature,book'))fail('invalid_context');
  const {book,anchor,annotationSignature,contextSha256}=selection;
  if(typeof book!=='string'||!Object.hasOwn(TEXTBOOK_AI_CONTEXTS,book)||typeof anchor!=='string'||!HASH.test(anchor)||typeof annotationSignature!=='string'||!HASH.test(annotationSignature))fail('invalid_context');
  const entry=TEXTBOOK_AI_CONTEXTS[book];
  if(entry.src!=='/textbook-ai-context-'+book+'.json'||!HASH.test(entry.sha256)||!HASH.test(entry.sourceSha256)||!HASH.test(entry.annotationSignature)||!Number.isSafeInteger(entry.count)||entry.count<1||entry.count>12000)fail('context_unavailable');
  if(annotationSignature!==entry.annotationSignature||(contextSha256!==undefined&&contextSha256!==entry.sha256))fail('context_changed');
  let origin;try{origin=new URL(env?.APP_ORIGIN);if(origin.protocol!=='https:'||origin.origin!==env.APP_ORIGIN)throw 0;}catch(_){fail('context_unavailable');}
  let task=cache.get(book);
  if(!task){
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
   task=catalog(fetcher,origin,book,entry,controller.signal).finally(()=>clearTimeout(timer)).catch(error=>{if(cache.get(book)===task)cache.delete(book);throw error;});
   cache.set(book,task);
  }
  const data=await task,row=data.rows.get(anchor);if(!row)fail('context_not_found');
  return Object.freeze({...row,book,title:data.title,subject:data.subject,sourceSha256:entry.sourceSha256,contextSha256:entry.sha256,annotationSignature:entry.annotationSignature});
 };
}

export const readPublicTextbookContext=publicTextbookContextReader();
