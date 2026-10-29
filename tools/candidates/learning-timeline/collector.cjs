'use strict';
const {create:createClock}=require('./clock.cjs'),{pack}=require('./pack.cjs'),{create:createOutbox}=require('./outbox.cjs');
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
function create({uid,sessionId,origin,same,storage,send,catalog,newId}){
 if(typeof uid!=='string'||!uid||!UUID.test(sessionId||'')||!Number.isFinite(origin)||origin<0||typeof same!=='function'||typeof newId!=='function'||!Array.isArray(catalog)||!catalog.length||catalog.some(x=>typeof x!=='string'||!/^(question:[a-z0-9_-]{2,80}|textbook:[a-z0-9_-]{2,80})$/.test(x)))throw Error('invalid collector');
 const allowed=new Set(catalog),clock=createClock(),outbox=createOutbox({uid,same,storage,send}),boundary=origin+4*3600000;
 let cursor=origin,pending=[],flight=null,sealed=false,rotationRequired=false,error=null;
 clock.update(origin,{owner:uid});
 function sample(at,activity,flags={}){
  if(sealed||!same())return false;
  if(activity!==null&&!allowed.has(activity))throw Error('unknown activity');
  if(!Number.isFinite(at)||at<origin)throw Error('invalid time');
  const end=Math.min(at,boundary);
  clock.update(end,{activity,visible:flags.visible===true,focused:flags.focused===true,touch:flags.touch===true});
  if(at>=boundary){clock.update(boundary,{activity:null,visible:false,focused:false});sealed=true;rotationRequired=true;}
  return true;
 }
 function capture(){
  if(pending.length)return;
  const segments=clock.snapshot().segments.filter(s=>s.end>cursor).map(s=>({...s,start:Math.max(s.start,cursor)})).filter(s=>Math.floor(s.end-origin)>Math.floor(s.start-origin));
  pending=pack(segments,{uid,origin}).map(spans=>{const id=newId();if(!UUID.test(id||''))throw Error('invalid chunk ID');return {id,sessionId,spans};});
 }
 async function save(){
  if(!same())return {stopped:true};
  try{
   capture();
   while(pending.length){
    const payload=pending[0];
    if(!await outbox.enqueue(payload))return {stopped:true};
    cursor=origin+payload.spans.at(-1).endOffset;pending.shift();
   }
   error=null;const result=await outbox.flush();
   if(result.error)error=result.error;
   return {...result,rotationRequired};
  }catch(_){error='学習時間の保存を確認できません。未送信分を保持しています。';return {error,rotationRequired};}
 }
 function flush(){if(flight)return flight;flight=save().finally(()=>{flight=null;});return flight;}
 function stop(at){if(!sealed&&same())sample(at,null,{visible:false,focused:false});sealed=true;return flush();}
 // 本人変更後は送信しない。変更前に計測した区間だけを旧本人のローカルキューへ退避する。
 function retire(at){
  if(!sealed&&same())sample(at,null,{visible:false,focused:false});sealed=true;
  const before=flight||Promise.resolve();
  return before.then(async()=>{try{capture();while(pending.length){const payload=pending[0];await storage.put(uid,payload);cursor=origin+payload.spans.at(-1).endOffset;pending.shift();}return {retired:true};}catch(_){error='学習時間の退避を確認できません。未保存分を保持しています。';return {error};}});
 }
 return Object.freeze({sample,flush,stop,retire,state(){return {totalMs:clock.snapshot().total,pendingChunks:pending.length,sealed,rotationRequired,error};}});
}
module.exports={create};
