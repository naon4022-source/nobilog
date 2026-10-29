// A persisted retry marker contains no prompt, image bytes or credentials.
const ID=/^[a-zA-Z0-9_-]{8,64}$/;
export async function retryMarker(text,images,store,newId){
 if(typeof text!=='string'||text.length>3000||!Array.isArray(images)||images.length>3||images.some(x=>typeof x!=='string'||!/^[a-f0-9]{64}$/.test(x)))throw Error('invalid_retry_input');
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify({text,images})));
 const hash=Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
 const raw=await store.get();let prior=null;
 try{if(typeof raw==='string'&&raw.length<=200)prior=JSON.parse(raw);}catch(_){}
 if(prior?.version===1&&ID.test(prior.id)&&prior.hash===hash&&Object.keys(prior).sort().join(',')==='hash,id,version')return prior;
 const id=newId();if(typeof id!=='string'||!ID.test(id))throw Error('invalid_retry_id');
 const marker={version:1,id,hash},encoded=JSON.stringify(marker);
 await store.set(encoded);
 // Do not start a potentially paid request unless the marker survived storage.
 if(await store.get()!==encoded)throw Error('retry_not_saved');
 return marker;
}
