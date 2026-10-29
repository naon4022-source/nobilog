import {TEXTBOOK_VISION_MEDIA} from './textbook-vision-media-manifest.mjs';
import {checkedMediaCatalog} from './textbook-vision-media-context.mjs';
import {attachMediaIdentities} from './textbook-vision-media-dom.mjs';
const cache=new Map();
async function load(book){
 if(!Object.hasOwn(TEXTBOOK_VISION_MEDIA,book))throw Error('context_unavailable');
 let task=cache.get(book);if(!task){
  task=(async()=>{
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),5000);
   try{
    const r=await fetch(TEXTBOOK_VISION_MEDIA[book].src,{cache:'no-store',credentials:'omit',redirect:'error',signal:controller.signal});
    if(!r.ok||r.redirected||!/^application\/json\b/i.test(r.headers.get('Content-Type')||'')||!r.body)throw Error('context_unavailable');
    const reader=r.body.getReader(),chunks=[];let size=0;
    try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>2000000){await reader.cancel();throw Error('context_unavailable');}chunks.push(value);}}finally{reader.releaseLock();}
    const bytes=new Uint8Array(size);let at=0;for(const b of chunks){bytes.set(b,at);at+=b.length;}
    return await checkedMediaCatalog(bytes,book);
   }finally{clearTimeout(timer);}
  })().catch(error=>{if(cache.get(book)===task)cache.delete(book);throw error;});cache.set(book,task);
 }
 return task;
}
export async function prepare(app,book,signature,{current}={}){
 if(typeof current!=='function'||!current())throw Error('account_changed');
 const catalog=await load(book);if(!current())throw Error('account_changed');
 if(catalog.annotationSignature!==signature)throw Error('context_changed');
 return attachMediaIdentities(app,catalog,{current});
}
globalThis.NobiTextbookVisionMedia=Object.freeze({prepare});
