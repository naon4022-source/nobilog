// Isolated candidate: volatile refresh notifications only. Game/learning data
// lives in guarded D1 records; reconnect always reads the current server state.
// No names, answers, credentials, inventories or histories enter this hub.
export function createInvalidationHub({setTimeout:later=globalThis.setTimeout,clearTimeout:cancel=globalThis.clearTimeout}={}){
 const subscribers=new Set(),encoder=new TextEncoder();
 const packet=(event,revision)=>encoder.encode(`event: ${event}\ndata: ${JSON.stringify({revision})}\n\n`);
 function close(s){
  if(s.closed)return;s.closed=true;subscribers.delete(s);cancel(s.deadline);
  try{s.controller.close();}catch(_){}
 }
 function flush(s){
  if(s.closed||s.pending<=s.lastSent||s.controller.desiredSize<=0)return;
  const revision=s.pending;s.pending=0;
  try{s.controller.enqueue(packet('refresh',revision));s.lastSent=revision;}catch(_){close(s);}
 }
 return Object.freeze({
  watch(){
   if(subscribers.size>=12)throw Error('too_many_watchers');
   const s={controller:null,closed:false,deadline:null,lastSent:0,pending:0};
   return new ReadableStream({
    type:'bytes',
    start(controller){
     s.controller=controller;subscribers.add(s);
     controller.enqueue(packet('ready',0));
     // Short finite streams reauthorize on reconnect and bound stale leases.
     // The client still verifies its current owner before every state read.
     s.deadline=later(()=>close(s),55000);
    },
    pull(){flush(s);},
    cancel(){close(s);}
   },{highWaterMark:256});
  },
  invalidate(revision){
   if(!Number.isSafeInteger(revision)||revision<1)throw Error('invalid_revision');
   for(const s of subscribers){s.pending=Math.max(s.pending,revision);flush(s);}
   return {notified:subscribers.size};
  }
 });
}
