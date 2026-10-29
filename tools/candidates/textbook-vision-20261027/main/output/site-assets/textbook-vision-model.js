// New image drafts have a separate database; the existing text model owns
// its unchanged validation, identity locks, save queue and acknowledgement.
(function(root){
'use strict';
const HASH=/^[a-f0-9]{64}$/,UID=/^(u[124]|p_(free|mini|standard|pro|unlimit))$/;
const copy=x=>JSON.parse(JSON.stringify(x)),equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const images=ids=>Array.isArray(ids)&&ids.length<=3&&new Set(ids).size===ids.length&&ids.every(x=>typeof x==='string'&&HASH.test(x));
const empty=(book,anchor)=>({version:1,book,anchor,text:'',context:null,pending:null});
function storeFor(uid,book,validDraft,current){
 if(!root.indexedDB||!UID.test(uid))throw Error('draft_store');let opening;
 const open=()=>opening||(opening=new Promise((resolve,reject)=>{const r=root.indexedDB.open('nobilog-textbook-vision-drafts',1);r.onupgradeneeded=()=>r.result.createObjectStore('drafts',{keyPath:['uid','book','anchor']});r.onsuccess=()=>{const db=r.result;db.onversionchange=()=>{db.close();opening=null;};resolve(db);};r.onerror=r.onblocked=()=>{opening=null;reject(Error('draft_store'));};}));
 function valid(row,anchor){return row&&Object.keys(row).sort().join(',')==='draft,images,version'&&row.version===1&&validDraft(row.draft,book,anchor)&&images(row.images)&&(!row.draft.pending||row.images.length>0&&row.draft.context?.kind==='fig');}
 async function transaction(mode,anchor,fn){
  if(!current()||!HASH.test(anchor))throw Error('account_changed');const db=await open();if(!current())throw Error('account_changed');
  return new Promise((resolve,reject)=>{const tx=db.transaction('drafts',mode),s=tx.objectStore('drafts'),key=[uid,book,anchor];let result,code='draft_store';
   const fail=e=>{code=e;tx.abort();};tx.oncomplete=()=>current()?resolve(result):reject(Error('account_changed'));tx.onerror=tx.onabort=()=>reject(Error(code));
   const r=s.get(key);r.onsuccess=()=>{
    if(!current()){fail('account_changed');return;}
    const row=r.result?.value||{version:1,draft:empty(book,anchor),images:[]};if(!valid(row,anchor)){fail('draft_invalid');return;}
    try{fn({s,key,row,fail,done:v=>result=v,write:value=>{if(!valid(value,anchor)){fail('draft_invalid');return;}s.put({uid,book,anchor,value:copy(value)});}});}catch(_){fail('draft_store');}
   };
  });
 }
 const mutate=(anchor,fn)=>transaction('readwrite',anchor,ctx=>{const count=ctx.s.count(root.IDBKeyRange.bound([uid,book,''],[uid,book,'\uffff']));count.onsuccess=()=>{const lookup=ctx.s.get(ctx.key);lookup.onsuccess=()=>{if(!lookup.result&&count.result>=256){ctx.fail('draft_limit');return;}if(!current()){ctx.fail('account_changed');return;}fn(ctx);};};});
 return {
  row:anchor=>transaction('readonly',anchor,c=>c.done(copy(c.row))),
  get:anchor=>transaction('readonly',anchor,c=>c.done(copy(c.row.draft))),
  put:value=>mutate(value.anchor,c=>{if(c.row.draft.pending&&!equal(c.row.draft,value)){c.fail('draft_conflict');return;}const next={...c.row,draft:copy(value)};if(value.pending&&!c.row.images.length){c.fail('image_required');return;}c.write(next);c.done(true);}),
  setImages:(anchor,ids)=>{if(!images(ids))throw Error('invalid_images');return mutate(anchor,c=>{if(c.row.draft.pending){c.fail('pending_locked');return;}c.write({...c.row,images:[...ids]});c.done(true);});},
  clear:value=>transaction('readwrite',value.anchor,c=>{if(!equal(c.row.draft,value)){c.fail('draft_conflict');return;}c.s.delete(c.key);c.done(true);})
 };
}
function create(api,book){
 const M=root.NobiTextbookAIModel,owner=api?.snapshot?.();if(!M||!owner||!UID.test(owner.uid)||!api.available?.()||typeof api.visionHistory!=='function'||typeof api.visionPost!=='function')throw Error('vision_unavailable');
 let alive=true;const current=()=>alive&&api.matches(owner),guard=()=>{if(!current())throw Error('account_changed');},store=storeFor(owner.uid,book,M.validDraft,current);
 async function checkItem(anchor,item,body){
  guard();const row=await store.row(anchor);guard();
  if(!row.draft.pending||!equal(row.draft.pending,body)||!item||!images(item.images)||!equal(item.images,row.images))throw Error('result_invalid');
  return item;
 }
 const wrapped={snapshot:()=>owner,matches:()=>current(),source:(selection,who)=>(api.visionSource||api.source)(selection,who),
  history:async(selection,who)=>{guard();const result=await api.visionHistory(selection,who);guard();if(selection.id&&result.state==='done'){const row=await store.row(selection.anchor);await checkItem(selection.anchor,result.item,row.draft.pending);}return result;},
  post:async(body,who)=>{
   guard();const row=await store.row(body.anchor);guard();if(!row.images.length||!equal(row.draft.pending,body))throw Error('draft_conflict');
   await api.visionPost({...body,images:[...row.images]},who);guard();
   // Verify the durable receipt by ID/images before consuming the draft.
   const saved=await api.visionHistory({book,anchor:body.anchor,id:body.id},who);guard();if(saved.state!=='done')throw Error('request_outcome_unknown');
   const item=await checkItem(body.anchor,saved.item,body);return {real:item.real,model:item.model,context:item.context,value:{answer:item.answer}};
  }
 };
 const base=M.create(wrapped,book,{store});
 return Object.freeze({...base,current,
  async images(anchor){guard();const row=await store.row(anchor);guard();return [...row.images];},
  async setImages(anchor,ids){guard();await base.flush();guard();return store.setImages(anchor,ids);},
  async send(anchor,context){guard();if(!(await store.row(anchor)).images.length)throw Error('image_required');guard();return base.send(anchor,context);},
  destroy(){alive=false;base.destroy();}
 });
}
root.NobiTextbookVisionModel=Object.freeze({create});
})(globalThis);
