'use strict';
const {create:createCollector}=require('./collector.cjs');
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
// 計測開始の応答確認前は数えない。開始の再送にも同じIDを使う。
function create({uid,same,storage,send,start,catalog,newId,now}){
 if(typeof same!=='function'||typeof start!=='function'||typeof now!=='function')throw Error('invalid lifecycle');
 let collector=null,pendingId=null,flight=null,closed=false,error=null;
 async function begin(){
  if(closed||!same())return {stopped:true};
  if(collector&&!collector.state().rotationRequired)return {ready:true};
  if(collector){const saved=await collector.flush();if(saved.error||saved.stopped)return saved;collector=null;}
  if(!pendingId){pendingId=newId();if(!UUID.test(pendingId||''))throw Error('invalid session ID');}
  try{
   const result=await start({id:pendingId});
   if(closed||!same())return {stopped:true};
   if(!result||result.session?.id!==pendingId||!Number.isSafeInteger(result.session.startedAt)||!Number.isSafeInteger(result.serverTime)||result.serverTime<result.session.startedAt)throw Error('invalid start acknowledgement');
   if(result.serverTime-result.session.startedAt>=4*3600000){pendingId=null;throw Error('expired start acknowledgement');}
   const at=now();
   // 再送で古い開始時刻が返る場合も、サーバー経過時間に合わせる。
   const origin=at-(result.serverTime-result.session.startedAt);
   collector=createCollector({uid,same,storage,send,catalog,newId,sessionId:pendingId,origin});
   collector.sample(at,null,{visible:false,focused:false});
   pendingId=null;error=null;return {ready:true};
  }catch(_){error='学習時間の計測開始を確認できません。開始前の時間は数えません。';return {error};}
 }
 function ensure(){if(flight)return flight;flight=begin().finally(()=>{flight=null;});return flight;}
 function sample(activity,flags){if(closed||!same()||!collector)return false;return collector.sample(now(),activity,flags);}
 async function flush(){if(closed||!same())return {stopped:true};if(!collector)return ensure();const result=await collector.flush();if(result.error||result.stopped)return result;if(result.rotationRequired)return ensure();return result;}
 async function stop(){closed=true;if(!collector)return {stopped:true};if(!same())return collector.retire(now());const result=await collector.stop(now());if(result.stopped||result.error)return collector.retire(now());return result;}
 return Object.freeze({ensure,sample,flush,stop,state(){return {ready:!!collector&&!closed,pendingStart:!!pendingId,closed,error,collector:collector?.state()||null};}});
}
module.exports={create};
