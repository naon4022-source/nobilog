// Only the OAuth callback form body. Ordinary large learning saves are separate.
function oauthBodyError(status){const error=new Error('invalid_oauth_body');error.oauthBodyStatus=status;return error;}
export async function readBoundedOAuthForm(request,{limit=16384,timeoutMs=10000}={}){
 if(!Number.isSafeInteger(limit)||limit<1||limit>1048576||!Number.isSafeInteger(timeoutMs)||timeoutMs<1||timeoutMs>30000)throw oauthBodyError(500);
 const discard=()=>{if(request.body&&!request.body.locked)void request.body.cancel().catch(()=>{});};
 const type=(request.headers.get('Content-Type')||'').split(';')[0].trim().toLowerCase();
 if(type!=='application/x-www-form-urlencoded'){discard();throw oauthBodyError(415);}
 const declared=request.headers.get('Content-Length');
 if(declared!==null&&(!/^\d+$/.test(declared)||!Number.isSafeInteger(Number(declared)))){discard();throw oauthBodyError(400);}
 if(declared!==null&&Number(declared)>limit){discard();throw oauthBodyError(413);}
 if(!request.body)throw oauthBodyError(400);
 const reader=request.body.getReader(),decoder=new TextDecoder('utf-8',{fatal:true});
 let timer;
 const cancel=()=>{void reader.cancel().catch(()=>{});};
 try{
  const read=async()=>{
   let bytes=0,text='';
   while(true){
    const part=await reader.read();if(part.done)break;
    if(!(part.value instanceof Uint8Array))throw oauthBodyError(400);
    bytes+=part.value.byteLength;
    if(bytes>limit){cancel();throw oauthBodyError(413);}
    try{text+=decoder.decode(part.value,{stream:true});}catch(_){cancel();throw oauthBodyError(400);}
   }
   try{return text+decoder.decode();}catch(_){throw oauthBodyError(400);}
  };
  const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{reject(oauthBodyError(408));cancel();},timeoutMs);});
  const text=await Promise.race([read(),deadline]);
  const form=new URLSearchParams(text);
  if(['state','code'].some(key=>form.getAll(key).length>1))throw oauthBodyError(400);
  return form;
 }finally{
  clearTimeout(timer);
  try{reader.releaseLock();}catch(_){}
 }
}
