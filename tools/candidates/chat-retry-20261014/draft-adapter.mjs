// Integration adapter: readback must come from the authenticated server,
// not the page's recordMemory map. Calls are injected for isolated testing.
export async function persistRetryDraft({marker,text,images},adapter){
 if(typeof marker!=='string'||marker.length>200||typeof text!=='string'||text.length>3000||!Array.isArray(images)||images.length>3)throw Error('invalid_retry_draft');
 const m=JSON.parse(marker);
 if(m.version!==1||typeof m.id!=='string'||!/^[a-zA-Z0-9_-]{8,64}$/.test(m.id)||typeof m.hash!=='string'||!/^[a-f0-9]{64}$/.test(m.hash)||Object.keys(m).sort().join(',')!=='hash,id,version'||images.some(x=>typeof x!=='string'||!/^[a-f0-9]{64}$/.test(x)))throw Error('invalid_retry_draft');
 const alive=()=>adapter.same()===true;
 if(!alive())throw Error('session_changed');
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify({text,images})));
 const hash=Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
 if(hash!==m.hash||!alive())throw Error('retry_content_changed');
 const expected={chatRetry:marker,chat:text,chatImages:JSON.stringify(images)};
 adapter.stage(expected);
 if(!await adapter.push()||!alive())throw Error('retry_save_unavailable');
 const remote=await adapter.readback();
 if(!alive()||!remote||Object.entries(expected).some(([k,v])=>remote[k]!==v))throw Error('retry_save_unconfirmed');
 return true;
}
