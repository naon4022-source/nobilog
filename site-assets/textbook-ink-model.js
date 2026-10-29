// Per-person handwriting drafts and acknowledged saves. Credentials never enter IndexedDB.
(function(root){
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x)),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function localStore(uid,book){
 if(!root.indexedDB||!['u1','u2','u4','p_free','p_mini','p_standard','p_pro','p_unlimit'].includes(uid))return null;
 let opening=null;
 function open(){if(!opening)opening=new Promise((resolve,reject)=>{const req=root.indexedDB.open('nobilog-textbook-ink-drafts',1);
  req.onupgradeneeded=()=>{for(const name of ['drafts','summaries'])req.result.createObjectStore(name,{keyPath:['uid','book','anchor']});};
  req.onsuccess=()=>{const db=req.result;db.onversionchange=()=>{db.close();opening=null;};resolve(db);};
  req.onerror=req.onblocked=()=>{opening=null;reject(Error('端末の下書き保存を開けません。'));};
 }).catch(error=>{opening=null;throw error;});return opening;}
 async function run(mode,names,fn){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction(names,mode);let value;tx.oncomplete=()=>resolve(value);tx.onerror=tx.onabort=()=>reject(Error('端末に下書きを保存できません。'));fn(tx,v=>{value=v;});});}
 const key=anchor=>[uid,book,anchor],range=()=>root.IDBKeyRange.bound(key(''),key('\uffff'));
 return {
  list:()=>run('readonly',['summaries'],(tx,done)=>{const r=tx.objectStore('summaries').getAll(range(),257);r.onsuccess=()=>done(r.result);}),
  get:anchor=>run('readonly',['drafts'],(tx,done)=>{const r=tx.objectStore('drafts').get(key(anchor));r.onsuccess=()=>done(r.result?.value||null);}),
  put:value=>run('readwrite',['drafts','summaries'],tx=>{const drafts=tx.objectStore('drafts'),summaries=tx.objectStore('summaries'),r=drafts.get(key(value.anchor));r.onsuccess=()=>{if(r.result&&!root.NobiTextbookInkFormat.draftValid(r.result.value,book)){tx.abort();return;}const count=summaries.count(range());count.onsuccess=()=>{if(!r.result&&count.result>=256){tx.abort();return;}drafts.put({uid,book,anchor:value.anchor,value:clone(value)});summaries.put({uid,book,anchor:value.anchor,quote:value.quote,revision:value.revision});};};}),
  clear:value=>run('readwrite',['drafts','summaries'],(tx,done)=>{const s=tx.objectStore('drafts'),r=s.get(key(value.anchor));r.onsuccess=()=>{const matches=!!r.result&&same(r.result.value,value);if(matches){s.delete(key(value.anchor));tx.objectStore('summaries').delete(key(value.anchor));}done(matches);};})
 };
}
function create(api,book){
 const F=root.NobiTextbookInkFormat;if(!F?.BOOKS.includes(book))throw Error('本を確認できません。');
 const owner=api.snapshot(),store=localStore(owner?.uid,book),memory=new Map(),summaries=new Map(),rows=new Map(),pending=new Set();
 let alive=true,loaded=false,writable=false,storageError=false,draftsBlocked=false,restored=false,restoring=null,queue=Promise.resolve(),listEpoch=0;
 const current=()=>alive&&api.matches(owner),guard=()=>{if(!current())throw Error('アカウントが変わりました。教科書を開き直してください。');};
 const meta=r=>({anchor:r.anchor,quote:r.quote,revision:r.revision,updatedAt:r.updatedAt});
 function validMeta(r){return r&&F.anchor(r.anchor)&&F.plain(r.quote,2000)&&!!r.quote.trim()&&Number.isSafeInteger(r.revision)&&r.revision>0&&Number.isSafeInteger(r.updatedAt)&&r.updatedAt>=0;}
 function persist(fn){if(!store)return Promise.resolve(false);const work=queue.then(fn);queue=work.catch(()=>{storageError=true;});return work.then(()=>{storageError=false;return true;});}
 async function restore(){guard();if(restored||!store)return;if(restoring)return restoring;
  restoring=(async()=>{try{await queue;const saved=await store.list();guard();if(saved.length>256||saved.some(x=>!F.anchor(x.anchor)||!F.plain(x.quote,2000)||!x.quote.trim()||!Number.isSafeInteger(x.revision)||x.revision<0||x.revision>999999998)){draftsBlocked=true;throw Error('下書きの形式を確認できません。');}for(const x of saved)if(!summaries.has(x.anchor))summaries.set(x.anchor,{anchor:x.anchor,quote:x.quote,revision:x.revision});restored=true;storageError=false;}catch{guard();storageError=true;}})().finally(()=>{restoring=null;});return restoring;
 }
 async function draftRead(anchor){guard();if(memory.has(anchor))return clone(memory.get(anchor));if(!store||!summaries.has(anchor))return null;
  try{await queue;const d=await store.get(anchor);guard();if(!d||!F.draftValid(d,book)||d.anchor!==anchor){draftsBlocked=true;throw Error('下書きの形式を確認できません。');}return d;}catch{guard();storageError=true;throw Error('端末の下書きを確認できません。元の下書きは変更していません。');}
 }
 async function clearAcknowledged(body){const summary=summaries.get(body.anchor);let removed=false;
  if(memory.has(body.anchor)&&same(memory.get(body.anchor),body)){memory.delete(body.anchor);if(summaries.get(body.anchor)===summary)summaries.delete(body.anchor);}
  if(store)try{await persist(async()=>{removed=await store.clear(body);});}catch{/* The online receipt remains valid; retain any unmatched draft. */}
  if(removed&&!memory.has(body.anchor)&&summaries.get(body.anchor)===summary)summaries.delete(body.anchor);
 }
 return Object.freeze({
  current,
  state(){guard();return {loaded,writable,rows:clone([...rows.values()]),drafts:clone([...summaries.values()]),durable:!!store,storageError};},
  async list(){guard();await restore();const run=++listEpoch,data=await api.list(book,owner);guard();if(!data||data.book!==book||typeof data.writable!=='boolean'||!Array.isArray(data.items)||data.items.length>256||data.items.some(x=>!validMeta(x))||new Set(data.items.map(x=>x.anchor)).size!==data.items.length)throw Error('保存一覧を確認できません。');if(run!==listEpoch)return false;rows.clear();for(const r of data.items)rows.set(r.anchor,meta(r));loaded=true;writable=data.writable;return true;},
  async read(anchor){guard();if(!F.anchor(anchor))throw Error('文章の目印を確認できません。');await restore();if(draftsBlocked||store&&!restored)return {item:null,draft:null,error:Error('端末下書きを確認できません。空として上書きせず、開き直して再確認してください。'),blocked:true};let draft;try{draft=await draftRead(anchor);}catch(error){return {item:null,draft:null,error,blocked:true};}let item=null,error=null;
   try{const data=await api.get(book,anchor,owner);guard();if(!data||data.book!==book||typeof data.writable!=='boolean'||data.item!==null&&(!F.rowValid(data.item,book)||data.item.anchor!==anchor))throw Error('保存した手書きを確認できません。');item=data.item;loaded=true;writable=data.writable;if(item)rows.set(anchor,meta(item));else rows.delete(anchor);}catch(e){guard();error=e;}
   if(item&&draft&&item.revision===draft.revision+1&&item.quote===draft.quote&&same(item.doc,draft.doc)){await clearAcknowledged(draft);return {item:clone(item),draft:null,error:null,recovered:true};}
   return {item:item?clone(item):null,draft:draft?clone(draft):null,error,recovered:false};
  },
  async draft(value){guard();if(!F.draftValid(value,book))throw Error('手書きの形式か保存上限を確認してください。');await restore();guard();if(draftsBlocked||store&&!restored)throw Error('元の端末下書きを確認できないため上書きしません。');if(!summaries.has(value.anchor)&&summaries.size>=256)throw Error('この本の下書きは256件までです。');const v=clone(value);memory.set(v.anchor,v);summaries.set(v.anchor,{anchor:v.anchor,quote:v.quote,revision:v.revision});
   try{const durable=await persist(()=>store.put(v));guard();if(durable&&memory.has(v.anchor)&&same(memory.get(v.anchor),v))memory.delete(v.anchor);return durable;}catch{guard();return false;}
  },
  async save(value){guard();if(!loaded||!writable)throw Error('保存の利用状態を確認してください。');if(!F.draftValid(value,book))throw Error('手書きの形式を確認してください。');if(pending.has(value.anchor))throw Error('前の保存を処理しています。');const body=clone(value);pending.add(body.anchor);++listEpoch;
   try{await this.draft(body);guard();const result=await api.post(body,owner);guard();const item=result?.item;if(!F.rowValid(item,book)||item.anchor!==body.anchor||item.revision!==body.revision+1||item.quote!==body.quote||!same(item.doc,body.doc))throw Error('保存の完了を確認できません。下書きは残っています。');rows.set(item.anchor,meta(item));await clearAcknowledged(body);guard();return clone(item);}finally{pending.delete(body.anchor);}
  },
  async flush(){await queue;guard();return !storageError;},
  destroy(){alive=false;++listEpoch;memory.clear();summaries.clear();rows.clear();pending.clear();}
 });
}
root.NobiTextbookInkModel=Object.freeze({create});
})(globalThis);
