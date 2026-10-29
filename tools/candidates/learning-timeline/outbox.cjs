'use strict';
// 本人別永続キュー用の候補。storageは原子的put/removeと本人別listを実装する。
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
function create({uid,same,storage,send}){
 if(typeof uid!=='string'||!uid||typeof same!=='function'||!storage||typeof send!=='function')throw Error('bad outbox context');
 let flight=null;
 function clean(payload){
  if(!payload||Object.keys(payload).sort().join(',')!=='id,sessionId,spans'||!UUID.test(payload.id||'')||!UUID.test(payload.sessionId||'')||!Array.isArray(payload.spans)||!payload.spans.length||payload.spans.length>60)throw Error('bad payload');
  const spans=payload.spans.map(s=>{
   if(!s||Object.keys(s).sort().join(',')!=='activity,endOffset,startOffset'||typeof s.activity!=='string'||!s.activity||s.activity.length>160||!Number.isSafeInteger(s.startOffset)||s.startOffset<0||!Number.isSafeInteger(s.endOffset)||s.endOffset<=s.startOffset||s.endOffset-s.startOffset>5000||s.endOffset>4*3600000)throw Error('bad span');
   return {activity:s.activity,startOffset:s.startOffset,endOffset:s.endOffset};
  });return {id:payload.id,sessionId:payload.sessionId,spans};
 }
 async function enqueue(payload){if(!same())return false;await storage.put(uid,clean(payload));return same();}
 async function drain(){
  let sent=0;
  if(!same())return {sent,stopped:true};
  try{
   const rows=await storage.list(uid,20);
   for(const stored of rows){
    if(!same())return {sent,stopped:true};
    const payload=clean(stored),receipt=await send(payload);
    if(!receipt||receipt.id!==payload.id||!Number.isSafeInteger(receipt.acceptedAt)||receipt.acceptedAt<0)throw Error('invalid receipt');
    // 消すのは確認済みの本人・同じID・同じ本文の1件だけ。別人の新キューには触らない。
    await storage.remove(uid,payload);sent++;
   }
   return {sent,stopped:!same()};
  }catch(_){return {sent,error:'保存を確認できません。未送信の記録を残して再試行します。'};}
 }
 function flush(){if(flight)return flight;flight=drain().finally(()=>{flight=null;});return flight;}
 return Object.freeze({enqueue,flush});
}
if(typeof module==='object'&&module.exports)module.exports={create};
else globalThis.NobiLearningTimeOutbox={create};
