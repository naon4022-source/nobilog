// Candidate only: authenticated fetch streams, no EventSource/token URL.
// io.connect(signal) and io.fetchState(signal) must use the existing session
// headers. io.isCurrent() captures the full session generation, not just UID.
export function createLiveRefresh(io,{later=(f,ms)=>setTimeout(f,ms),cancel=id=>clearTimeout(id)}={}){
 for(const key of ['connect','fetchState','isCurrent','onState','onStatus'])if(typeof io[key]!=='function')throw Error('live_io');
 let stopped=false,started=false,listening=false,reader=null,timer=null,busy=false,dirty=false;
 let desired=0,delivered=0,backoff=250;
 const controller=new AbortController();
 const current=()=>!stopped&&io.isCurrent()===true;
 function stop(){
  if(stopped)return;stopped=true;cancel(timer);timer=null;controller.abort();
  if(reader)void reader.cancel().catch(()=>{});reader=null;
 }
 function status(value){if(current())io.onStatus(value);}
 function authFailure(error){return [401,403].includes(error?.status)||error?.code==='active_session';}
 function reconnect(){
  if(!current()){stop();return;}
  if(listening){if(reader)void reader.cancel().catch(()=>{});return;}
  cancel(timer);timer=later(()=>{timer=null;void listen();},backoff);backoff=Math.min(5000,backoff*2);
 }
 async function pump(){
  if(busy||!current())return;busy=true;
  try{
   while(dirty&&current()){
    dirty=false;const expected=desired,state=await io.fetchState(controller.signal);
    if(!current()){stop();return;}
    if(!Number.isSafeInteger(state?.revision)||state.revision<1)throw Error('state_revision');
    if(state.revision<expected){status('syncing');reconnect();return;}
    if(state.revision>=delivered){delivered=state.revision;io.onState(state);status('connected');}
   }
  }catch(error){
   if(current()){
    if(authFailure(error)){status('session_changed');stop();}
    else{status('reconnecting');reconnect();}
   }
  }finally{busy=false;}
 }
 function refresh(revision=0){
  if(!current()){stop();return;}
  if(!Number.isSafeInteger(revision)||revision<0)throw Error('event_revision');
  desired=Math.max(desired,revision);
  // Force a read after an acknowledged local save even if the revision is
  // unchanged, and at every newly authorized stream connection.
  dirty=true;void pump();
 }
 function event(block){
  let kind='',data='';
  for(const line of block.split('\n')){
   if(line.startsWith('event:'))kind=line.slice(6).trim();
   if(line.startsWith('data:')){if(data)throw Error('event_data');data=line.slice(5).trim();}
  }
  if(!data&&!kind)return;
  if(!['ready','refresh'].includes(kind))throw Error('event_kind');
  const packet=JSON.parse(data);
  if(!packet||Object.keys(packet).length!==1||!Number.isSafeInteger(packet.revision)||packet.revision<(kind==='ready'?0:1))throw Error('event_revision');
  if(kind==='ready')refresh();else if(packet.revision>delivered)refresh(packet.revision);
 }
 async function listen(){
  if(!current()){stop();return;}
  if(listening)return;listening=true;
  let localReader=null;const connectedAt=Date.now();
  try{
   status('connecting');const response=await io.connect(controller.signal);
   if(!current()){void response.body?.cancel().catch(()=>{});stop();return;}
   if(!response.ok){
    const error=Error('event_connection');error.status=response.status;
    if(response.status===409){const body=await response.json().catch(()=>null);if(body?.error==='active_session')error.code='active_session';}
    throw error;
   }
   if(!response.body||!response.headers.get('content-type')?.startsWith('text/event-stream'))throw Error('event_type');
   localReader=response.body.getReader();reader=localReader;
   const decoder=new TextDecoder('utf-8',{fatal:true});let buffer='';
   while(current()){
    const {done,value}=await localReader.read();if(done)break;
    if(!current())break;
    buffer=(buffer+decoder.decode(value,{stream:true})).replace(/\r\n/g,'\n');
    if(buffer.length>4096)throw Error('event_size');
    let split;
    while((split=buffer.indexOf('\n\n'))>=0){const block=buffer.slice(0,split);buffer=buffer.slice(split+2);event(block);}
   }
  }catch(error){
   if(current()){
    if(authFailure(error)){status('session_changed');stop();}
    else status('reconnecting');
   }
  }finally{
   if(localReader){await localReader.cancel().catch(()=>{});if(reader===localReader)reader=null;}
   listening=false;if(Date.now()-connectedAt>=10000)backoff=250;
   if(current())reconnect();else stop();
  }
 }
 return Object.freeze({
  start(){if(started||stopped)return;started=true;void listen();},
  refresh,
  stop
 });
}
