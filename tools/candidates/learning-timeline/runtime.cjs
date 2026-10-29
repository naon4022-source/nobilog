'use strict';
const {create:createLifecycle}=require('./lifecycle.cjs');
// ブラウザ接続候補。イベント本文・入力内容は読み取らない。
function create({uid,same,storage,send,start,catalog,newId,now,activity,document,window,setInterval,clearInterval,report=()=>{}}){
 let closed=false,ready=false,starting=null,lastFlush=now(),flight=null,nextStart=0,stopFlight=null,stopResult=null,stopError=null;
 const life=createLifecycle({uid,same,storage,send,start,catalog,newId,now});
 const allowed=new Set(catalog),listeners=[];
 function flags(touch=false){return {visible:document.visibilityState==='visible',focused:document.hasFocus(),touch};}
 function current(){const id=activity();return allowed.has(id)?id:null;}
 async function ensure(){
  if(starting)return starting;
  if(now()<nextStart)return;
  starting=life.ensure().then(result=>{if(closed||!same())return;ready=result.ready===true;if(result.error){nextStart=now()+30000;report(result.error);}else nextStart=0;}).finally(()=>{starting=null;});
  return starting;
 }
 function sample(touch=false){
  if(closed||!same())return;
  const f=flags(touch),id=current();
  if(!ready){if(id&&f.visible&&f.focused)void ensure();return;}
  life.sample(id,f);
 }
 function flush(){
  if(flight)return flight;
  if(closed||!same()||!ready)return Promise.resolve({stopped:true});
  flight=life.flush().then(result=>{if(closed||!same())return result;if(result.error)report(result.error);ready=life.state().ready;return result;}).finally(()=>{flight=null;});return flight;
 }
 function tick(){if(closed)return;if(!same()){void stop();return;}sample();if(now()-lastFlush>=30000){lastFlush=now();void flush();}}
 function listen(target,name,handler){target.addEventListener(name,handler);listeners.push(()=>target.removeEventListener(name,handler));}
 const touch=e=>{if(e.isTrusted===true)sample(true);};
 for(const name of ['pointerdown','keydown','wheel','touchstart'])listen(document,name,touch);
 for(const name of ['visibilitychange'])listen(document,name,()=>{sample();if(document.visibilityState!=='visible')void flush();});
 listen(window,'blur',()=>{sample();void flush();});listen(window,'focus',()=>sample());
 listen(window,'pagehide',()=>{void stop();});
 const timer=setInterval(tick,1000);
 function stop(){
  if(stopFlight)return stopFlight;
  if(stopResult)return Promise.resolve(stopResult);
  if(!closed){closed=true;clearInterval(timer);listeners.forEach(off=>off());}
  // 退避失敗後も同じcollectorを保持。再操作で旧本人の固定IDを保存し直せる。
  stopFlight=life.stop().then(result=>{
   if(result.error){stopError=result.error;report(result.error);}else{stopError=null;stopResult=result;}
   return result;
  }).finally(()=>{stopFlight=null;});
  return stopFlight;
 }
 sample();
 return Object.freeze({tick,flush,stop,state:()=>({...life.state(),runtimeClosed:closed,stopError})});
}
module.exports={create};
