// 教科書書き込みの原稿印・本人別の保存状態。ページ割りや教材本文は変更しない。
(function(root){
'use strict';
const COLORS=['none','yellow','blue','pink'];
const hash=async s=>Array.from(new Uint8Array(await root.crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),b=>b.toString(16).padStart(2,'0')).join('');
const copy=x=>JSON.parse(JSON.stringify(x));
const text=(x,n)=>typeof x==='string'&&x.length<=n&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(x);
function quote(b){
 const value=b.x||b.caption||b.title||(b.lines||[]).map(x=>x[2]||'').join('\n')||(b.items||[]).map(x=>typeof x==='string'?x:x.x||'').join('\n');
 return String(value||'').replace(/\*\*|`/g,'').trim().slice(0,2000);
}
async function prepare(data,book){
 if(!data||!Array.isArray(data.pages)||typeof book!=='string')throw Error('原稿を確認できません。');
 const source=JSON.stringify(data),result=copy(data),signature=await hash(book+':'+source);
 await Promise.all(result.pages.flatMap(p=>(p.blocks||[]).map(async(b,i)=>{
  if(!['p','h3','h4','fig','ul','ol','talk','hook'].includes(b.t))return;
  const q=quote(b);if(!q)return;
  b.annotationAnchor=await hash(book+':'+p.n+':'+i+':'+JSON.stringify(b));
  b.annotationQuote=q;
 })));
 return {data:result,signature};
}
function row(r,book){return r&&r.book===book&&typeof r.anchor==='string'&&/^[a-f0-9]{64}$/.test(r.anchor)&&text(r.quote,2000)&&!!r.quote.trim()&&COLORS.includes(r.color)&&text(r.note,2000)&&Number.isSafeInteger(r.revision)&&r.revision>0&&Number.isSafeInteger(r.updatedAt)&&r.updatedAt>=0;}
// 未送信の本文だけを端末に保管。認証トークンはキーにも値にも保存しない。
function localDrafts(owner,book){
 const uid=typeof owner==='string'?owner:owner?.uid;
 if(!root.indexedDB||!['u1','u2','p_free','p_mini','p_standard','p_pro','p_unlimit'].includes(uid)||!['math1','kokugo1','english1','science1','geography','history'].includes(book))return null;
 let opening=null;
 function open(){if(!opening)opening=new Promise((resolve,reject)=>{const r=root.indexedDB.open('nobilog-textbook-drafts',1);
  r.onupgradeneeded=()=>r.result.createObjectStore('drafts',{keyPath:['uid','book','anchor']});
  r.onsuccess=()=>{r.result.onversionchange=()=>{r.result.close();opening=null;};resolve(r.result);};
  r.onerror=()=>{opening=null;reject(Error('端末の下書き保存を開けません。'));};
  r.onblocked=()=>reject(Error('端末の下書き保存が使用中です。'));
 });return opening;}
 async function run(mode,action){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('drafts',mode);let value;
  tx.oncomplete=()=>resolve(value);tx.onerror=tx.onabort=()=>reject(Error('端末に下書きを保存できません。'));
  action(tx.objectStore('drafts'),x=>{value=x;});
 });}
 return {
  read:()=>run('readonly',(s,done)=>{const r=s.getAll(root.IDBKeyRange.bound([uid,book,''],[uid,book,'\uffff']),2049);r.onsuccess=()=>done(r.result);}),
  put:(anchor,value)=>run('readwrite',s=>s.put({uid,book,anchor,...copy(value)})),
  clear:(anchor,sent)=>run('readwrite',s=>{const r=s.get([uid,book,anchor]);r.onsuccess=()=>{const d=r.result;if(d&&d.quote===sent.quote&&d.color===sent.color&&d.note===sent.note&&d.revision===sent.revision)s.delete([uid,book,anchor]);};})
 };
}
function session(api,book){
 const owner=api.snapshot();let alive=true,serial=0,writable=false,loaded=false,items=new Map();const drafts=new Map(),pending=new Set();
 const store=localDrafts(owner,book);let restored=false,storageError=false,queue=Promise.resolve();
 function guard(){if(!alive||!api.matches(owner))throw Error('アカウントが変わりました。教科書を開き直してください。');}
 const current=()=>alive&&api.matches(owner);
 function persist(fn){if(!store)return Promise.resolve(false);const task=queue.then(fn);queue=task.catch(()=>{storageError=true;});return task.then(()=>{storageError=false;return true;});}
 return Object.freeze({
  current,
  async load(){
   guard();const run=++serial;
   if(store&&!restored){try{const saved=await store.read();guard();if(saved.length>2048||saved.some(d=>!row({...d,revision:d.revision+1,updatedAt:0},book)||d.revision<0))throw Error('下書きの形式を確認できません。');
    for(const d of saved)if(!drafts.has(d.anchor))drafts.set(d.anchor,{quote:d.quote,color:d.color,note:d.note,revision:d.revision});restored=true;storageError=false;
   }catch(e){guard();storageError=true;}}
   const data=await api.get(book,owner);guard();
   if(!data||data.book!==book||!Array.isArray(data.items)||data.items.length>2048||typeof data.writable!=='boolean'||data.items.some(r=>!row(r,book))||new Set(data.items.map(r=>r.anchor)).size!==data.items.length)throw Error('メモの保存記録を確認できません。');
   if(run!==serial)return false;
   items=new Map(data.items.map(r=>[r.anchor,copy(r)]));writable=data.writable;loaded=true;return true;
  },
  state(){guard();return {loaded,writable,items:copy([...items.values()]),drafts:copy([...drafts].map(([anchor,value])=>({anchor,...value}))),storageError,durable:!!store};},
  async flush(){await queue;guard();return !storageError;},
  draft(anchor,value){guard();if(value===undefined)return drafts.has(anchor)?copy(drafts.get(anchor)):null;
   if(!/^[a-f0-9]{64}$/.test(anchor)||!value||!text(value.quote,2000)||!text(value.note,2000)||!COLORS.includes(value.color))throw Error('メモの入力を確認してください。');
   if(!drafts.has(anchor)&&drafts.size>=2048)throw Error('この本の下書き保存上限に達しました。');
   const saved={quote:value.quote,note:value.note,color:value.color,revision:value.revision??items.get(anchor)?.revision??0};
   if(!Number.isSafeInteger(saved.revision)||saved.revision<0||saved.revision>=999999999)throw Error('下書きの更新番号を確認してください。');
   drafts.set(anchor,saved);return persist(()=>store.put(anchor,saved));
  },
  async save(value){
   guard();if(!loaded||!writable)throw Error('このプランでは書き込みを追加できません。');
   const body={book,anchor:value.anchor,quote:value.quote,color:value.color,note:value.note,revision:value.revision};
   if(!row({...body,revision:body.revision+1,updatedAt:0},book)||!Number.isSafeInteger(body.revision)||body.revision<0)throw Error('メモの入力を確認してください。');
   if(pending.has(body.anchor))throw Error('前の保存を処理しています。入力は残っています。');
   void this.draft(body.anchor,body).catch(()=>{});++serial;pending.add(body.anchor);
   try{
   const result=await api.post(body,owner);guard();
   const r=result&&result.item;
   if(!row(r,book)||r.anchor!==body.anchor||r.revision!==body.revision+1||r.quote!==body.quote||r.color!==body.color||r.note!==body.note)throw Error('保存が完了したことを確認できません。入力は残っています。');
   ++serial;items.set(r.anchor,copy(r));
   const draft=drafts.get(r.anchor);if(draft&&draft.quote===body.quote&&draft.note===body.note&&draft.color===body.color){drafts.delete(r.anchor);void persist(()=>store.clear(r.anchor,body)).catch(()=>{});}
   return copy(r);
   }finally{pending.delete(body.anchor);}
  },
  destroy(){alive=false;serial++;items.clear();drafts.clear();pending.clear();}
 });
}
root.NobiTextbookAnnotationModel=Object.freeze({prepare,session});
})(globalThis);
