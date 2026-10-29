(function(root){
 'use strict';
 const NAME='nobi-learning-time-outbox-v1';
 async function open(uid){
  if(typeof uid!=='string'||!uid||uid.length>100)throw Error('bad owner');
  const db=await new Promise((resolve,reject)=>{const r=indexedDB.open(NAME,1);r.onupgradeneeded=()=>{const s=r.result.createObjectStore('chunks',{keyPath:'key'});s.createIndex('uid','uid');};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(Error('storage unavailable'));r.onblocked=()=>reject(Error('storage blocked'));});
  db.onversionchange=()=>db.close();
  const key=id=>JSON.stringify([uid,id]);
  function check(owner){if(owner!==uid)throw Error('different owner');}
  function change(action){return new Promise((resolve,reject)=>{const tx=db.transaction('chunks','readwrite');let error=null;tx.oncomplete=()=>resolve();tx.onabort=tx.onerror=()=>reject(error||Error('storage unavailable'));try{action(tx.objectStore('chunks'),e=>{error=e;tx.abort();});}catch(e){error=e;tx.abort();}});}
  return Object.freeze({
   async put(owner,payload){check(owner);const clean=structuredClone(payload);await change((store,abort)=>{const request=store.get(key(clean.id));request.onsuccess=()=>{const row=request.result;if(row){if(JSON.stringify(row.payload)!==JSON.stringify(clean))abort(Error('chunk conflict'));return;}const count=store.index('uid').count(IDBKeyRange.only(uid));count.onsuccess=()=>{if(count.result>=2000){abort(Error('outbox capacity'));return;}store.add({key:key(clean.id),uid,payload:clean});};};});},
   async list(owner,limit){check(owner);if(!Number.isSafeInteger(limit)||limit<1||limit>20)throw Error('bad limit');return new Promise((resolve,reject)=>{const tx=db.transaction('chunks','readonly'),request=tx.objectStore('chunks').index('uid').getAll(IDBKeyRange.only(uid),limit);let rows;request.onsuccess=()=>{rows=request.result.map(row=>row.payload);};tx.oncomplete=()=>resolve(rows);tx.onabort=tx.onerror=()=>reject(Error('storage unavailable'));});},
   async remove(owner,payload){check(owner);await change((store,abort)=>{const request=store.get(key(payload.id));request.onsuccess=()=>{const row=request.result;if(!row)return;if(JSON.stringify(row.payload)!==JSON.stringify(payload)){abort(Error('chunk changed'));return;}store.delete(key(payload.id));};});},
   close(){db.close();}
  });
 }
 root.NobiLearningTimeStorage=Object.freeze({open});
})(globalThis);
