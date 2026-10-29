// Internal candidate only. No HTTP route, implicit fetch, credentials or file IO.
const MAX=20*1024*1024;
const encoder=new TextEncoder();
export async function requestHash(body){
 const canonical=Object.fromEntries(Object.keys(body).sort().map(k=>[k,body[k]]));
 return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(JSON.stringify(canonical)))),b=>b.toString(16).padStart(2,'0')).join('');
}
export function inspectWave(bytes){
 if(!(bytes instanceof Uint8Array)||bytes.length<44||bytes.length>MAX)throw Error('invalid wave');
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),tag=i=>String.fromCharCode(...bytes.subarray(i,i+4));
 if(tag(0)!=='RIFF'||tag(8)!=='WAVE'||![bytes.length-8,0xffffffff].includes(view.getUint32(4,true)))throw Error('invalid wave');
 let at=12,format=null,data=null,chunks=0;
 while(at+8<=bytes.length){
  if(++chunks>128)throw Error('invalid wave');
  const type=tag(at),raw=view.getUint32(at+4,true),start=at+8,size=raw===0xffffffff&&type==='data'?bytes.length-start:raw,end=start+size;
  if(end>bytes.length)throw Error('invalid wave');
  if(type==='fmt '){
   if(format||size<16)throw Error('invalid wave');
   format={codec:view.getUint16(start,true),channels:view.getUint16(start+2,true),rate:view.getUint32(start+4,true),byteRate:view.getUint32(start+8,true),align:view.getUint16(start+12,true),bits:view.getUint16(start+14,true)};
  }
  if(type==='data'){if(data)throw Error('invalid wave');data={start,size};}
  at=end+(size%2);
 }
 if(at!==bytes.length||!format||!data||format.codec!==1||format.bits!==16||![1,2].includes(format.channels)||format.rate<8000||format.rate>96000||format.align!==2*format.channels||format.byteRate!==format.rate*format.align||!data.size||data.size%format.align)throw Error('invalid wave');
 const seconds=data.size/format.byteRate;
 if(seconds<0.2||seconds>600)throw Error('invalid duration');
 let peak=0;for(let i=data.start;i<data.start+data.size;i+=2)peak=Math.max(peak,Math.abs(view.getInt16(i,true)));
 if(!peak)throw Error('silent wave');
 return Object.freeze({seconds,channels:format.channels,sampleRate:format.rate,peak,bytes:bytes.length});
}
async function readWave(response){
 const mime=(response.headers.get('content-type')||'').split(';')[0].trim().toLowerCase();
 async function reject(message){await response.body?.cancel().catch(()=>{});throw Error(message);}
 if(!['audio/wav','audio/x-wav','audio/wave','application/octet-stream'].includes(mime))return reject('invalid audio response');
 const declared=response.headers.get('content-length');
 if(declared!==null&&(!/^\d+$/.test(declared)||Number(declared)>MAX||Number(declared)<44))return reject('invalid audio size');
 if(!response.body?.getReader)throw Error('missing audio stream');
 const reader=response.body.getReader(),parts=[];let length=0,done=false;
 try{
  for(;;){const chunk=await reader.read();if(chunk.done){done=true;break;}if(!(chunk.value instanceof Uint8Array)||length+chunk.value.length>MAX)throw Error('invalid audio size');parts.push(chunk.value);length+=chunk.value.length;}
 }finally{if(!done)await reader.cancel().catch(()=>{});reader.releaseLock();}
 if(declared!==null&&Number(declared)!==length)throw Error('incomplete audio');
 const bytes=new Uint8Array(length);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}
 return {bytes,info:inspectWave(bytes)};
}
export function create({instructions,authorize,lookup,receipt,getKey,reserve,commit,uncertain,fetchImpl,timeoutMs=30000,signal=null}){
 if(typeof instructions!=='string'||!instructions||![authorize,lookup,receipt,getKey,reserve,commit,uncertain,fetchImpl].every(f=>typeof f==='function')||!Number.isSafeInteger(timeoutMs)||timeoutMs<1||timeoutMs>120000||signal!==null&&(typeof signal.aborted!=='boolean'||typeof signal.addEventListener!=='function'||typeof signal.removeEventListener!=='function'))throw Error('invalid speech adapter');
 let flight=null;const unconfirmed=new Set();
 async function run(key){
  if(typeof key!=='string'||!/^([a-f0-9]{64})$/.test(key))return {ok:false,error:'invalid_request'};
  if(signal?.aborted)return {ok:false,error:'stopped'};
  let lease=null,attempted=false,timer=null,removeAbort=()=>{};
  try{
   if(await authorize(key)!==true)return {ok:false,error:'not_authorized'};
   const body=await lookup(key);
   if(!body||Object.keys(body).sort().join(',')!=='input,instructions,model,response_format,voice'||body.model!=='gpt-4o-mini-tts'||body.voice!=='marin'||body.instructions!==instructions||body.response_format!=='wav'||typeof body.input!=='string'||!body.input.trim()||Array.from(body.input).length>1000||await requestHash(body)!==key)return {ok:false,error:'unapproved_request'};
   const saved=await receipt(key);
   if(saved){
    if(saved.state!=='complete'||!(saved.bytes instanceof Uint8Array))return {ok:false,error:'prior_result_unconfirmed'};
    if(await authorize(key)!==true)return {ok:false,error:'not_authorized'};
    const bytes=saved.bytes.slice();return {ok:true,cached:true,bytes,info:inspectWave(bytes)};
   }
   if(unconfirmed.has(key))return {ok:false,error:'prior_result_unconfirmed'};
   if(await authorize(key)!==true)return {ok:false,error:'not_authorized'};
   const apiKey=await getKey();if(typeof apiKey!=='string'||!apiKey)return {ok:false,error:'key_unavailable'};
   lease=await reserve(key);if(!lease||lease.ok!==true||typeof lease.id!=='string'||!lease.id)return {ok:false,error:'controls_unavailable'};
   unconfirmed.add(key);
   if(await authorize(key)!==true)throw Error('authorization changed');
   const abort=new AbortController(),onAbort=()=>abort.abort();
   signal?.addEventListener('abort',onAbort,{once:true});removeAbort=()=>signal?.removeEventListener('abort',onAbort);
   if(signal?.aborted)throw Error('stopped');
   timer=setTimeout(()=>abort.abort(),timeoutMs);attempted=true;
   const response=await fetchImpl('https://api.openai.com/v1/audio/speech',{method:'POST',redirect:'error',headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json'},body:JSON.stringify(body),signal:abort.signal});
   if(!response.ok){await response.body?.cancel().catch(()=>{});throw Error('provider rejected');}
   const audio=await readWave(response);
   if(await commit({requestSha256:key,leaseId:lease.id,bytes:audio.bytes,info:audio.info})!==true)throw Error('receipt unavailable');
   unconfirmed.delete(key);
   if(await authorize(key)!==true)return {ok:false,error:'not_authorized'};
   return {ok:true,cached:false,...audio};
  }catch(_){
   if(lease?.ok===true){try{await uncertain({requestSha256:key,leaseId:lease.id,attempted});}catch(_){}}
   return {ok:false,error:attempted?'result_unconfirmed':'controls_unavailable'};
  }finally{clearTimeout(timer);removeAbort();}
 }
 return Object.freeze({generate(key){if(flight)return Promise.resolve({ok:false,error:'busy'});flight=run(key).finally(()=>{flight=null;});return flight;}});
}
