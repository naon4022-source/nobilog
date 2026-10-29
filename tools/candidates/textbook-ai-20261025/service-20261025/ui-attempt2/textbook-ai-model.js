// Own textbook consultation drafts. Session credentials never enter the draft store.
(function(root){
'use strict';
const BOOKS=['math1','kokugo1','english1','science1','geography','history'],HASH=/^[a-f0-9]{64}$/,ID=/^[a-zA-Z0-9_-]{8,64}$/;
const copy=x=>JSON.parse(JSON.stringify(x)),equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const validContext=(c,book,anchor)=>c&&Object.keys(c).sort().join(',')==='anchor,annotationSignature,book,chapter,contextSha256,kind,page,quote,section,sectionTitle,sourceSha256,subject,title'&&c.book===book&&c.anchor===anchor&&[c.anchor,c.annotationSignature,c.contextSha256,c.sourceSha256].every(x=>typeof x==='string'&&HASH.test(x))&&typeof c.quote==='string'&&c.quote.length<=2000&&!!c.quote.trim();
const validBody=(b,book,anchor)=>b&&Object.keys(b).sort().join(',')==='anchor,annotationSignature,book,contextSha256,id,text'&&b.book===book&&b.anchor===anchor&&typeof b.id==='string'&&ID.test(b.id)&&typeof b.text==='string'&&!!b.text.trim()&&b.text.length<=3000&&[b.anchor,b.annotationSignature,b.contextSha256].every(x=>typeof x==='string'&&HASH.test(x));
function validDraft(d,book,anchor){return d&&Object.keys(d).sort().join(',')==='anchor,book,context,pending,text,version'&&d.version===1&&d.book===book&&d.anchor===anchor&&HASH.test(anchor)&&typeof d.text==='string'&&d.text.length<=3000&&(d.context===null||validContext(d.context,book,anchor))&&(d.pending===null||validBody(d.pending,book,anchor)&&d.pending.text===d.text&&d.context?.annotationSignature===d.pending.annotationSignature&&d.context?.contextSha256===d.pending.contextSha256);}
function localStore(uid,book){
 if(!root.indexedDB||!['u1','u2','u4','p_free','p_mini','p_standard','p_pro','p_unlimit'].includes(uid))return null;
 let opening;
 const open=()=>opening||(opening=new Promise((resolve,reject)=>{const r=root.indexedDB.open('nobilog-textbook-ai-drafts',1);r.onupgradeneeded=()=>r.result.createObjectStore('drafts',{keyPath:['uid','book','anchor']});r.onsuccess=()=>{const db=r.result;db.onversionchange=()=>{db.close();opening=null;};resolve(db);};r.onerror=r.onblocked=()=>{opening=null;reject(Error('draft_store'));};}));
 async function run(mode,fn){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('drafts',mode);let value;tx.oncomplete=()=>resolve(value);tx.onerror=tx.onabort=()=>reject(Error('draft_store'));fn(tx.objectStore('drafts'),v=>value=v,tx);});}
 return {
  get:anchor=>run('readonly',(s,done)=>{const r=s.get([uid,book,anchor]);r.onsuccess=()=>done(r.result?.value||null);}),
  put:value=>run('readwrite',(s,done,tx)=>{const key=[uid,book,value.anchor],r=s.get(key);r.onsuccess=()=>{const old=r.result?.value;if(old&&!validDraft(old,book,value.anchor)){tx.abort();return;}const count=s.count(root.IDBKeyRange.bound([uid,book,''],[uid,book,'\uffff']));count.onsuccess=()=>{if(!old&&count.result>=256){tx.abort();return;}s.put({uid,book,anchor:value.anchor,value:copy(value)});done(true);};};}),
  clear:value=>run('readwrite',(s,done)=>{const key=[uid,book,value.anchor],r=s.get(key);r.onsuccess=()=>{if(r.result&&equal(r.result.value,value)){s.delete(key);done(true);}else done(false);};})
 };
}
function create(api,book,options={}){
 if(!BOOKS.includes(book))throw Error('book');
 const owner=api.snapshot(),store=options.store===undefined?localStore(owner?.uid,book):options.store,memory=new Map(),loading=new Map(),locks=new Set();let alive=true,queue=Promise.resolve();
 const current=()=>alive&&api.matches(owner),guard=()=>{if(!current())throw Error('account_changed');};
 const persist=fn=>{const work=queue.then(()=>{guard();return fn();});queue=work.catch(()=>{});return work;};
 async function load(anchor){
  guard();if(!HASH.test(anchor))throw Error('anchor');if(memory.has(anchor))return copy(memory.get(anchor));
  if(loading.has(anchor))return loading.get(anchor);
  const work=(async()=>{await queue;guard();const saved=store?await store.get(anchor):null;guard();if(saved&&!validDraft(saved,book,anchor))throw Error('draft_invalid');const value=saved||{version:1,book,anchor,text:'',context:null,pending:null};memory.set(anchor,copy(value));return copy(value);})();
  loading.set(anchor,work);try{return await work;}finally{loading.delete(anchor);}
 }
 async function save(value){guard();if(!validDraft(value,book,value.anchor))throw Error('draft_invalid');memory.set(value.anchor,copy(value));if(!store)return false;await persist(()=>store.put(value));guard();return true;}
 async function acknowledge(value,item){
  if(!item||item.state!=='done'||item.real!==true||item.mock!==false||item.id!==value.pending?.id||item.text!==value.pending.text||!validContext(item.context,book,value.anchor)||item.context.annotationSignature!==value.pending.annotationSignature||item.context.contextSha256!==value.pending.contextSha256||typeof item.answer!=='string'||!item.answer.trim()||item.answer.length>3000)throw Error('result_invalid');
  guard();if(store)await persist(()=>store.clear(value));guard();if(equal(memory.get(value.anchor),value))memory.delete(value.anchor);return copy(item);
 }
 return Object.freeze({current,load,durable:!!store,
  async edit(anchor,text){const d=await load(anchor);guard();if(d.pending)throw Error('pending_locked');d.text=text;return save(d);},
  async source(anchor,annotationSignature){guard();const r=await api.source({book,anchor,annotationSignature},owner);guard();if(!validContext(r?.context,book,anchor)||r.context.annotationSignature!==annotationSignature)throw Error('context_changed');return copy(r.context);},
  async history(anchor){guard();const r=await api.history({book,anchor},owner);guard();if(!r||!Array.isArray(r.items)||r.items.length>30||typeof r.canSend!=='boolean'||r.items.some(x=>x.book!==book||x.anchor!==anchor||x.state!=='done'||typeof x.text!=='string'||typeof x.answer!=='string'))throw Error('history_invalid');return copy(r);},
  async recover(anchor){const d=await load(anchor);guard();if(!d.pending)return {state:'none'};const result=await api.history({book,anchor,id:d.pending.id},owner);guard();if(result.state==='done')return {state:'done',item:await acknowledge(d,result.item)};if(!['not_found','not_started','reserved','rejected','unknown'].includes(result.state))throw Error('result_invalid');return {state:result.state};},
  async send(anchor,context){
   guard();if(locks.has(anchor))throw Error('request_in_progress');locks.add(anchor);
   try{let d=await load(anchor);guard();const fresh=!d.pending;if(fresh){if(!validContext(context,book,anchor)||!d.text.trim())throw Error('input_required');d.context=copy(context);d.pending={id:crypto.randomUUID(),text:d.text,book,anchor,annotationSignature:context.annotationSignature,contextSha256:context.contextSha256};}
    // Durable pending identity is mandatory before sending when a draft store exists.
    try{await save(d);}catch(error){if(fresh&&current()&&equal(memory.get(anchor),d))memory.set(anchor,{...d,context:null,pending:null});throw error;}
    guard();const result=await api.post(copy(d.pending),owner);guard();
    const item={...result.value,id:d.pending.id,text:d.pending.text,context:result.context,book,anchor,state:'done',real:result.real,mock:false,model:result.model};
    return acknowledge(d,item);
   }finally{locks.delete(anchor);}
  },destroy(){alive=false;memory.clear();loading.clear();},flush:async()=>{await queue;guard();}
 });
}
root.NobiTextbookAIModel=Object.freeze({create,validDraft});
})(globalThis);
