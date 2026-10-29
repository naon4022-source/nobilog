import {TEXTBOOK_VISION_MEDIA} from './textbook-vision-media-manifest.mjs';
const HASH=/^[a-f0-9]{64}$/,ASSET=/^\/textbook-book-[a-z0-9-]+\.(svg|jpg|png)$/;
const fail=code=>{throw Error(code);};
const exact=(x,s)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).sort().join(',')===s;
const plain=(x,n)=>typeof x==='string'&&x.length<=n&&!/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(x);
const checked=new WeakSet();
export const isCheckedMediaCatalog=value=>!!value&&checked.has(value);
export async function checkedMediaCatalog(bytes,book){
 if(!Object.hasOwn(TEXTBOOK_VISION_MEDIA,book)||!(bytes instanceof Uint8Array)||bytes.byteLength<1||bytes.byteLength>2000000)fail('context_unavailable');
 const entry=TEXTBOOK_VISION_MEDIA[book],digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
 if(digest!==entry.sha256)fail('context_changed');
 let data;try{data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch(_){fail('context_unavailable');}
 if(!exact(data,'annotationSignature,book,contexts,sourceSha256,subject,title,version')||data.version!==1||data.book!==book||data.sourceSha256!==entry.sourceSha256||data.annotationSignature!==entry.annotationSignature||!plain(data.title,120)||!data.title.trim()||!plain(data.subject,30)||!Array.isArray(data.contexts)||data.contexts.length!==entry.count)fail('context_unavailable');
 const anchors=new Set(),sources=new Set();
 for(const row of data.contexts){
  if(!exact(row,'anchor,assetSha256,chapter,kind,page,quote,section,sectionTitle,src')||!HASH.test(row.anchor)||!HASH.test(row.assetSha256)||row.kind!=='fig'||!Number.isSafeInteger(row.page)||row.page<1||row.page>2000||!ASSET.test(row.src)||anchors.has(row.anchor)||sources.has(row.src)||!plain(row.quote,2000)||!row.quote.trim()||!plain(row.chapter,160)||!plain(row.section,160)||!plain(row.sectionTitle,200))fail('context_unavailable');
  anchors.add(row.anchor);sources.add(row.src);Object.freeze(row);
 }
 Object.freeze(data.contexts);checked.add(data);return Object.freeze(data);
}
export function mediaReference(catalog,anchor){
 if(!isCheckedMediaCatalog(catalog))fail('context_unavailable');
 const row=catalog.contexts.find(r=>r.anchor===anchor);if(!row)fail('context_not_found');
 const {src,assetSha256,...context}=row;
 return Object.freeze({...context,book:catalog.book,title:catalog.title,subject:catalog.subject,sourceSha256:catalog.sourceSha256,contextSha256:TEXTBOOK_VISION_MEDIA[catalog.book].sha256,annotationSignature:catalog.annotationSignature});
}
export function publicMediaContextReader({fetcher,timeoutMs=5000}={}){
 if(typeof fetcher!=='function'||!Number.isSafeInteger(timeoutMs)||timeoutMs<1||timeoutMs>5000)fail('invalid_context_reader');
 const cache=new Map();
 return async(env,selection)=>{
  if(!exact(selection,Object.hasOwn(selection||{},'contextSha256')?'anchor,annotationSignature,book,contextSha256':'anchor,annotationSignature,book'))fail('invalid_context');
  const {book,anchor,annotationSignature,contextSha256}=selection;
  if(typeof book!=='string'||!Object.hasOwn(TEXTBOOK_VISION_MEDIA,book)||typeof anchor!=='string'||!HASH.test(anchor)||typeof annotationSignature!=='string'||!HASH.test(annotationSignature))fail('invalid_context');
  const entry=TEXTBOOK_VISION_MEDIA[book];
  if(annotationSignature!==entry.annotationSignature||contextSha256!==undefined&&contextSha256!==entry.sha256)fail('context_changed');
  let origin;try{origin=new URL(env.APP_ORIGIN);if(origin.protocol!=='https:'||origin.origin!==env.APP_ORIGIN)throw 0;}catch(_){fail('context_unavailable');}
  // Cache only completed immutable public data. Never retain a request's
  // in-flight network promise for another Worker's request to await.
  const key=origin.origin+':'+book;let data=cache.get(key);
  if(!data){
   if(cache.size>=12)fail('context_unavailable');
   data=await(async()=>{
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
    try{
     const url=new URL(entry.src,origin).href,response=await fetcher(new Request(url,{method:'GET',headers:{Accept:'application/json','Cache-Control':'no-cache'},redirect:'error',cache:'no-store',signal:controller.signal}));
     if(!response?.ok||response.redirected||response.url&&response.url!==url||!/^application\/json\b/i.test(response.headers.get('Content-Type')||'')||!response.body){await response?.body?.cancel();fail('context_unavailable');}
     const length=response.headers.get('Content-Length');if(length!==null&&(!/^\d+$/.test(length)||Number(length)>2000000)){await response.body.cancel();fail('context_unavailable');}
     const reader=response.body.getReader(),parts=[];let size=0;
     try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>2000000){await reader.cancel();fail('context_unavailable');}parts.push(value);}}finally{reader.releaseLock();}
     const bytes=new Uint8Array(size);let at=0;for(const p of parts){bytes.set(p,at);at+=p.length;}
     return await checkedMediaCatalog(bytes,book);
    }finally{clearTimeout(timer);}
   })();
   if(!cache.has(key)&&cache.size>=12)fail('context_unavailable');cache.set(key,data);
  }
  return mediaReference(data,anchor);
 };
}
