'use strict';
const runtime=require('./runtime.cjs'),bridge=require('./bridge.cjs');
// アプリ接続用。contextは本人を固定したsame/readyを返す。秘密値は保存・表示しない。
function create({context,openStorage,request,activity,catalog,document,window,now,newId,setInterval,clearInterval,report=()=>{}}){
 if(![context,openStorage,request,activity,now,newId,setInterval,clearInterval,report].every(f=>typeof f==='function')||!Array.isArray(catalog)||!catalog.length)throw Error('invalid client');
 const ids=catalog.map(x=>x.id);let entry=null,flight=null,disposed=false,retryAt=0,error=null,rerun=false,forceNext=false;
 function notify(message){error=message;report(message);}
 async function retire(){
  if(!entry)return true;
  const result=await entry.runtime.stop();
  if(result.error){notify(result.error);return false;}
  entry.storage.close();entry=null;error=null;return true;
 }
 async function reconcile(force){
  if(entry&&(!entry.ctx.same()||entry.runtime.state().runtimeClosed)){if(!await retire())return {pending:true,error};}
  if(disposed){if(!await retire())return {pending:true,error};return {stopped:true};}
  if(entry)return {ready:true};
  if(!force&&now()<retryAt)return {waiting:true,error};
  const ctx=context();
  if(!ctx||typeof ctx.uid!=='string'||!ctx.uid||typeof ctx.same!=='function'||typeof ctx.ready!=='function'||!ctx.same()||!ctx.ready())return {waiting:true};
  let storage=null;
  try{
   storage=await openStorage(ctx.uid);
   if(disposed||!ctx.same()||!ctx.ready()){storage.close();return {stopped:true};}
   const transport=bridge.create({same:ctx.same,ready:ctx.ready,request});
   const instance=runtime.create({uid:ctx.uid,same:ctx.same,storage,send:transport.send,start:transport.start,catalog:ids,newId,now,activity,document,window,setInterval,clearInterval,report:notify});
   entry={ctx,storage,runtime:instance};error=null;retryAt=0;return {ready:true};
  }catch(_){storage?.close();retryAt=now()+30000;notify('学習時間の保存準備を確認できません。再試行できます。');return {error};}
 }
 function refresh(force=false){
  forceNext=forceNext||force;
  if(flight){rerun=true;return flight;}
  flight=(async()=>{let result;do{rerun=false;const forced=forceNext;forceNext=false;result=await reconcile(forced);}while(rerun);return result;})().finally(()=>{flight=null;});return flight;
 }
 const timer=setInterval(()=>{void refresh();},1000);
 async function stop(){if(!disposed){disposed=true;clearInterval(timer);}await refresh(true);return error?{error}:{stopped:true};}
 async function retry(){
  const result=await refresh(true);
  if(entry&&!disposed&&entry.ctx.same()){
   const saved=await entry.runtime.flush();
   if(saved.error){notify(saved.error);return saved;}
   if(!saved.stopped)notify(null);
  }
  return result;
 }
 return Object.freeze({refresh,retry,stop,state:()=>({active:!!entry&&!disposed,pendingRetirement:!!entry&&!entry.ctx.same(),error,disposed})});
}
module.exports={create};
