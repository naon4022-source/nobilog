// Private review receipts only; no session credentials or learner answers are
// stored locally. Polls are GET-only and never create/retry paid work.
(function(root){
'use strict';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/,UID=/^(?:u[124]|p_(?:free|mini|standard|pro|unlimit))$/;
const copy=v=>JSON.parse(JSON.stringify(v)),fail=code=>{throw Error(code);},text=(v,max)=>typeof v==='string'&&!!v.trim()&&Array.from(v).length<=max&&!/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(v);
function validJob(j,id){return j&&UUID.test(j.id||'')&&(!id||j.id===id)&&['queued','running','paused','unknown','done'].includes(j.state)&&(j.code===null||typeof j.code==='string'&&/^[a-z_]{1,64}$/.test(j.code))&&Number.isSafeInteger(j.total)&&j.total>=1&&j.total<=500&&Number.isSafeInteger(j.completed)&&j.completed>=0&&j.completed<=j.total&&(j.state==='done')===(j.completed===j.total)&&j.credits===100&&Number.isSafeInteger(j.createdAt)&&j.createdAt>=0&&(j.state==='done'?Number.isSafeInteger(j.completedAt)&&j.completedAt>=j.createdAt:j.completedAt===null);}
function validAnswer(a){
 if(!a||typeof a!=='object'||Array.isArray(a)||JSON.stringify(a).length>12000)return false;
 const scalar=v=>typeof v==='number'?Number.isFinite(v):text(v,12000),list=v=>Array.isArray(v)&&v.length>0&&v.length<=500&&v.every(scalar);
 if(a.kind==='number')return scalar(a.value)&&(a.units===undefined||list(a.units));
 if(a.kind==='numbers')return list(a.values);if(a.kind==='exact')return list(a.accepted);
 if(a.kind==='expr'||a.kind==='relation')return scalar(a.value);
 if(a.kind==='set')return Array.isArray(a.items)&&a.items.length>0&&a.items.length<=500&&a.items.every(list);
 if(a.kind==='rubric')return Array.isArray(a.criteria)&&a.criteria.length>0&&a.criteria.length<=500&&a.criteria.every(c=>c&&list(c.any));
 return false;
}
function validRow(v,id){return v&&Object.keys(v).sort().join(',')==='claim,id,notified,requestId,submitted,version'&&v.version===1&&v.id===id&&UUID.test(v.id)&&UUID.test(v.requestId||'')&&typeof v.submitted==='boolean'&&typeof v.notified==='boolean'&&(v.claim===null||UUID.test(v.claim.token||'')&&Number.isSafeInteger(v.claim.until)&&v.claim.until>=0);}
function localStore(uid){
 if(!root.indexedDB||!UID.test(uid||''))return null;let opening;
 const open=()=>opening||(opening=new Promise((resolve,reject)=>{const r=root.indexedDB.open('nobilog-test-review-receipts',1);r.onupgradeneeded=()=>r.result.createObjectStore('jobs',{keyPath:['uid','id']});r.onsuccess=()=>{const db=r.result;db.onversionchange=()=>{db.close();opening=null;};resolve(db);};r.onerror=r.onblocked=()=>{opening=null;reject(Error('review_store'));};}));
 async function change(id,fn){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('jobs','readwrite');let result,code='review_store';tx.oncomplete=()=>resolve(result);tx.onerror=tx.onabort=()=>reject(Error(code));const store=tx.objectStore('jobs'),r=store.get([uid,id]);r.onsuccess=()=>{const old=r.result?.value;if(old&&!validRow(old,id)){code='review_store_invalid';tx.abort();return;}const next=fn(old?copy(old):null);if(next===null){result=null;return;}if(!validRow(next,id)){code='review_store_invalid';tx.abort();return;}const count=store.count(root.IDBKeyRange.bound([uid,''],[uid,'\uffff']));count.onsuccess=()=>{if(!old&&count.result>=2000){code='review_store_full';tx.abort();return;}store.put({uid,id,value:next});result=copy(next);};};});}
 return Object.freeze({
  prepare:(id,requestId)=>change(id,old=>old||{version:1,id,requestId,submitted:false,notified:false,claim:null}),
  submitted:(id,requestId)=>change(id,old=>{if(!old||old.requestId!==requestId)return null;return {...old,submitted:true};}),
  claim:(id,token,at)=>change(id,old=>{if(old?.notified||old?.claim?.until>at)return null;return {...(old||{version:1,id,requestId:root.crypto.randomUUID(),submitted:true,notified:false}),claim:{token,until:at+30000}};}),
  notified:(id,token,shown)=>change(id,old=>old?.claim?.token===token?{...old,notified:shown===true,claim:null}:null)
 });
}
function create(api,options={}){
 const owner=api.snapshot(),store=options.store===undefined?localStore(owner?.uid):options.store,locks=new Set(),results=new Map(),jobs=new Map(),reads=new Map();let alive=true,polling=null;
 const current=()=>alive&&api.matches(owner),guard=()=>{if(!current())fail('account_changed');};
 const remember=j=>{if(!validJob(j))fail('review_result_invalid');const before=jobs.get(j.id);if(before?.state==='done'&&j.state!=='done')return;const next=copy(j);jobs.set(j.id,next);if(JSON.stringify(before)!==JSON.stringify(next))options.changed?.(next);};
 async function readResult(id){
  guard();if(!UUID.test(id||''))fail('review_result_invalid');if(results.has(id))return copy(results.get(id));
  let data;try{data=await api.get(id,owner);}catch(error){guard();if(error?.code==='not_found'||error?.status===404)return null;throw error;}guard();
  if(!validJob(data?.job,id))fail('review_result_invalid');
  if(data.job.state!=='done'){if(data.items||data.questions)fail('review_result_invalid');remember(data.job);return {job:copy(data.job)};}
  if(!Array.isArray(data.items)||!Array.isArray(data.questions)||data.items.length!==data.job.total||data.questions.length!==data.job.total)fail('review_result_invalid');
  const ids=new Set();for(const [i,item] of data.items.entries()){
   const q=data.questions[i];if(!q||!text(q.id,160)||ids.has(q.id)||item.questionId!==q.id||!text(q.prompt,12000)||!validAnswer(q.answer)||typeof q.explanation!=='string'||q.explanation.length>12000||!text(item.comment,70)||!text(item.purpose,20)||(item.practiceId!==null&&!text(item.practiceId,160)))fail('review_result_invalid');ids.add(q.id);
  }
  const value={job:copy(data.job),items:copy(data.items),questions:copy(data.questions)};results.set(id,value);remember(data.job);return copy(value);
 }
 async function get(id){guard();if(reads.has(id))return copy(await reads.get(id));const work=readResult(id);reads.set(id,work);try{return copy(await work);}finally{if(reads.get(id)===work)reads.delete(id);}}
 async function poll(){
  guard();if(polling)return polling;
  const work=(async()=>{const data=await api.list(owner);guard();if(!data||!Array.isArray(data.jobs)||data.jobs.length>20||data.jobs.some(j=>!validJob(j))||new Set(data.jobs.map(j=>j.id)).size!==data.jobs.length)fail('review_result_invalid');
   for(const job of data.jobs){guard();remember(job);if(job.state!=='done'||!store||api.canNotify?.()===false)continue;
    const full=await get(job.id);guard();if(!full||full.job.state!=='done')continue;
    const token=root.crypto.randomUUID(),claim=await store.claim(job.id,token,Date.now());guard();if(!claim)continue;
    let shown=false;try{shown=await api.notify(full.job,owner)===true;guard();}finally{await store.notified(job.id,token,shown&&current());}guard();
   }
   return data.jobs.map(copy);
  })();polling=work;try{return await work;}finally{if(polling===work)polling=null;}
 }
 return Object.freeze({current,durable:!!store,get,poll,
  async start(id){
   guard();if(!UUID.test(id||''))fail('review_result_invalid');if(!store)fail('review_store');if(locks.has(id))fail('review_in_progress');locks.add(id);
   try{
    const row=await store.prepare(id,root.crypto.randomUUID());guard();if(!validRow(row,id))fail('review_store_invalid');
    // Persist the stable receipt before POST; polls/reloads never POST by themselves.
    const result=await api.post({id:row.requestId,testSessionId:id},owner);guard();if(!validJob(result?.job,id))fail('review_result_invalid');
    await store.submitted(id,row.requestId);guard();remember(result.job);if(result.job.state==='done')return get(id);return {job:copy(result.job)};
   }finally{locks.delete(id);}
  },destroy(){alive=false;results.clear();jobs.clear();}
 });
}
root.NobiTestReviewModel=Object.freeze({create,validJob});
})(globalThis);
