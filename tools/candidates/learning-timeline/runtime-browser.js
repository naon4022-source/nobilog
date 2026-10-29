(function(root){'use strict';const factories={},cache={};
factories["./clock.cjs"]=function(module,exports,require){
'use strict';
// 計測候補。実利用者・通信・保存には接続しない。
function create({idleMs=180000,maxGapMs=5000}={}){
 if(!Number.isSafeInteger(idleMs)||idleMs<1000||!Number.isSafeInteger(maxGapMs)||maxGapMs<1)throw Error('invalid clock settings');
 let previous=null,touched=null,owner=null,activity=null,visible=false,focused=false,total=0;
 const segments=[];
 function collect(at){
  if(!Number.isFinite(at)||at<0)throw Error('invalid monotonic time');
  if(previous!==null&&at<previous)throw Error('clock moved backwards');
  if(previous!==null&&owner&&activity&&visible&&focused&&touched!==null){
   const end=Math.min(at,touched+idleMs),delta=end-previous;
   if(at-previous<=maxGapMs&&delta>0){
    total+=delta;const last=segments.at(-1);
    if(last&&last.owner===owner&&last.activity===activity&&last.end===previous)last.end=end;
    else segments.push({owner,activity,start:previous,end});
   }
  }
  previous=at;
 }
 function update(at,next={}){
  if(next.owner!==undefined&&(next.owner!==null&&(typeof next.owner!=='string'||!next.owner||next.owner.length>100)))throw Error('invalid owner');
  if(next.activity!==undefined&&(next.activity!==null&&(typeof next.activity!=='string'||!next.activity||next.activity.length>160)))throw Error('invalid activity');
  for(const k of ['visible','focused','touch'])if(next[k]!==undefined&&typeof next[k]!=='boolean')throw Error('invalid flag');
  collect(at);
  // 呼出側は旧本人の未送信分を退避してから切替える。新本人へ持ち越さない。
  if(next.owner!==undefined&&next.owner!==owner){owner=next.owner;activity=null;touched=null;visible=false;focused=false;total=0;segments.length=0;}
  if(next.activity!==undefined&&next.activity!==activity){activity=next.activity;touched=at;}
  if(next.visible!==undefined)visible=next.visible;
  if(next.focused!==undefined)focused=next.focused;
  if(next.touch)touched=at;
 }
 return Object.freeze({update,tick:collect,snapshot(){return {total,segments:segments.map(s=>({...s}))};},pending(uid){return uid===owner?segments.map(s=>({activity:s.activity,start:s.start,end:s.end})):[];}});
}
module.exports={create};

};
factories["./pack.cjs"]=function(module,exports,require){
'use strict';
// 計測の連続区間を保存APIの最大5秒区間に分割。送信IDは呼出側の永続キューで固定する。
function pack(segments,{uid,origin,maxOffset=4*3600000}){
 if(!Array.isArray(segments)||typeof uid!=='string'||!uid||!Number.isFinite(origin)||origin<0)throw Error('bad packing context');
 const spans=[];let previous=null;
 for(const s of segments){
  if(s.owner!==uid)throw Error('different owner');
  const start=Math.floor(s.start-origin),end=Math.floor(s.end-origin);
  if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||end<=start||end>maxOffset||(previous!==null&&start<previous)||typeof s.activity!=='string')throw Error('bad segment');
  for(let at=start;at<end;at+=5000)spans.push({activity:s.activity,startOffset:at,endOffset:Math.min(end,at+5000)});
  previous=end;
 }
 const batches=[];for(let i=0;i<spans.length;i+=60)batches.push(spans.slice(i,i+60));return batches;
}
module.exports={pack};

};
factories["./outbox.cjs"]=function(module,exports,require){
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

};
factories["./collector.cjs"]=function(module,exports,require){
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

};
factories["./lifecycle.cjs"]=function(module,exports,require){
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

};
factories["./runtime.cjs"]=function(module,exports,require){
'use strict';
const {create:createLifecycle}=require('./lifecycle.cjs');
// ブラウザ接続候補。イベント本文・入力内容は読み取らない。
function create({uid,same,storage,send,start,catalog,newId,now,activity,document,window,setInterval,clearInterval,report=()=>{}}){
 let closed=false,ready=false,starting=null,lastFlush=now(),flight=null,nextStart=0,stopFlight=null,stopResult=null,stopError=null;
 const life=createLifecycle({uid,same,storage,send,start,catalog,newId,now});
 const allowed=new Set(catalog),listeners=[];
 function flags(touch=false){return {visible:document.visibilityState==='visible',focused:document.hasFocus(),touch};}
 function current(){const id=activity();return allowed.has(id)?id:null;}
 async function ensure(){
  if(starting)return starting;
  if(now()<nextStart)return;
  starting=life.ensure().then(result=>{if(closed||!same())return;ready=result.ready===true;if(result.error){nextStart=now()+30000;report(result.error);}else nextStart=0;}).finally(()=>{starting=null;});
  return starting;
 }
 function sample(touch=false){
  if(closed||!same())return;
  const f=flags(touch),id=current();
  if(!ready){if(id&&f.visible&&f.focused)void ensure();return;}
  life.sample(id,f);
 }
 function flush(){
  if(flight)return flight;
  if(closed||!same()||!ready)return Promise.resolve({stopped:true});
  flight=life.flush().then(result=>{if(closed||!same())return result;if(result.error)report(result.error);ready=life.state().ready;return result;}).finally(()=>{flight=null;});return flight;
 }
 function tick(){if(closed)return;if(!same()){void stop();return;}sample();if(now()-lastFlush>=30000){lastFlush=now();void flush();}}
 function listen(target,name,handler){target.addEventListener(name,handler);listeners.push(()=>target.removeEventListener(name,handler));}
 const touch=e=>{if(e.isTrusted===true)sample(true);};
 for(const name of ['pointerdown','keydown','wheel','touchstart'])listen(document,name,touch);
 for(const name of ['visibilitychange'])listen(document,name,()=>{sample();if(document.visibilityState!=='visible')void flush();});
 listen(window,'blur',()=>{sample();void flush();});listen(window,'focus',()=>sample());
 listen(window,'pagehide',()=>{void stop();});
 const timer=setInterval(tick,1000);
 function stop(){
  if(stopFlight)return stopFlight;
  if(stopResult)return Promise.resolve(stopResult);
  if(!closed){closed=true;clearInterval(timer);listeners.forEach(off=>off());}
  // 退避失敗後も同じcollectorを保持。再操作で旧本人の固定IDを保存し直せる。
  stopFlight=life.stop().then(result=>{
   if(result.error){stopError=result.error;report(result.error);}else{stopError=null;stopResult=result;}
   return result;
  }).finally(()=>{stopFlight=null;});
  return stopFlight;
 }
 sample();
 return Object.freeze({tick,flush,stop,state:()=>({...life.state(),runtimeClosed:closed,stopError})});
}
module.exports={create};

};
factories["./bridge.cjs"]=function(module,exports,require){
'use strict';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
function create({same,ready,request}){
 if(typeof same!=='function'||typeof ready!=='function'||typeof request!=='function')throw Error('invalid bridge');
 function own(){if(!same()||!ready())throw Error('保存への接続を確認してください。');}
 async function post(path,body){
  own();const result=await request(path,structuredClone(body));own();
  if(!result||typeof result!=='object'||Array.isArray(result))throw Error('保存応答を確認できません。');return result;
 }
 async function start(body){
  if(!body||Object.keys(body).join(',')!=='id'||!UUID.test(body.id||''))throw Error('invalid start');
  const response=await post('/learning-time-start',body),s=response.session;
  if(!s||s.id!==body.id||!Number.isSafeInteger(s.startedAt)||s.startedAt<0||!Number.isSafeInteger(response.serverTime)||response.serverTime<s.startedAt)throw Error('invalid start receipt');
  return {session:{id:s.id,startedAt:s.startedAt},serverTime:response.serverTime};
 }
 async function send(body){
  if(!body||Object.keys(body).sort().join(',')!=='id,sessionId,spans'||!UUID.test(body.id||'')||!UUID.test(body.sessionId||'')||!Array.isArray(body.spans)||body.spans.length<1||body.spans.length>60)throw Error('invalid chunk');
  for(const s of body.spans)if(!s||Object.keys(s).sort().join(',')!=='activity,endOffset,startOffset'||typeof s.activity!=='string'||!s.activity||s.activity.length>160||!Number.isSafeInteger(s.startOffset)||s.startOffset<0||!Number.isSafeInteger(s.endOffset)||s.endOffset<=s.startOffset||s.endOffset-s.startOffset>5000||s.endOffset>4*3600000)throw Error('invalid span');
  const response=await post('/learning-time',body);
  if(response.id!==body.id||!Number.isSafeInteger(response.acceptedAt)||response.acceptedAt<0)throw Error('invalid save receipt');
  return {id:response.id,acceptedAt:response.acceptedAt};
 }
 return Object.freeze({start,send});
}
module.exports={create};

};
factories["./history.cjs"]=function(module,exports,require){
'use strict';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const SUBJECTS=new Set(['数学','英語','国語','理科','社会']);
// 全ページを検査してから完了を返す。onPageは仮集計専用とし、完了前に画面へ公開しない。
// 生のcontent（保存用の本文）は返さず、台帳と照合された計測区間だけを渡す。
function create({same,ready,request,catalog,maxPages=500}){
 if(![same,ready,request].every(f=>typeof f==='function')||!Array.isArray(catalog)||!Number.isSafeInteger(maxPages)||maxPages<1||maxPages>500)throw Error('invalid history reader');
 const allowed=new Map(catalog.map(x=>[x.id,x]));let flight=null;
 function own(){if(!same()||!ready())throw Error('学習時間の接続を確認してください。');}
 async function run(onPage,onWindow){
  let cursor='',count=0,pages=0;const visited=new Set();let latestTime=0,policy,window=null;
  for(;;){
   own();if(pages>=maxPages)throw Error('学習時間の履歴をすべて読み取れませんでした。');
   const result=await request('/learning-time'+(cursor?'?cursor='+encodeURIComponent(cursor):''));own();
   if(!result||!Array.isArray(result.items)||result.items.length>200||!Number.isSafeInteger(result.serverTime)||result.serverTime<0)throw Error('invalid history page');
   const w=result.window??null;
   if(w&&(!Number.isSafeInteger(w.from)||w.from<0||w.from>result.serverTime||!['mini','standard','pro','unlimit'].includes(w.plan)||!Number.isSafeInteger(w.revision)||w.revision<1||!['1週間','3週間','1か月','3年'].includes(w.label)))throw Error('invalid history window');
   const key=w?w.plan+':'+w.revision+':'+w.label:'unrestricted';
   if(policy!==undefined&&policy!==key){onWindow?.(w);throw Error('history plan changed');}policy=key;
   window=w?{...w,from:Math.max(window?.from||0,w.from)}:null;onWindow?.(window);
   let previous=cursor;
   const spans=[];
   for(const item of result.items){
    if(!item||!UUID.test(item.id||'')||item.id<=previous||!Array.isArray(item.spans)||item.spans.length<1||item.spans.length>60||!Number.isSafeInteger(item.acceptedAt)||item.acceptedAt<0||item.acceptedAt>result.serverTime)throw Error('invalid history record');
    previous=item.id;
    let index=-1;
    item.spans.forEach((s,i)=>{
     const suffix=typeof s?.id==='string'&&s.id.startsWith(item.id+':')?s.id.slice(item.id.length+1):'';
     const originalIndex=/^(0|[1-9]\d?)$/.test(suffix)?Number(suffix):-1;
     const target=allowed.get(s?.activity);
     if(!target||!SUBJECTS.has(target.subject)||target.kind!==s.kind||target.subject!==s.subject||!['textbook','question'].includes(s.kind)||originalIndex<=index||originalIndex>=60||!window&&originalIndex!==i||![s.start,s.end,s.acceptedAt].every(Number.isSafeInteger)||s.start<0||s.end<=s.start||s.end-s.start>5000||s.acceptedAt!==item.acceptedAt||s.end>item.acceptedAt)throw Error('invalid history span');
     index=originalIndex;
     if(!window||s.end>window.from)spans.push({id:s.id,subject:s.subject,start:Math.max(s.start,window?.from||0),end:s.end,acceptedAt:s.acceptedAt});
    });
   }
   const next=result.next;
   if(next!==null&&(!UUID.test(next||'')||result.items.length!==200||next!==previous||next<=cursor||visited.has(next)))throw Error('invalid history cursor');
   // 応答や呼出側に可変参照を共有しない。別本人に切替わったら後続ページを読まない。
   await onPage(spans);own();count+=result.items.length;pages++;latestTime=Math.max(latestTime,result.serverTime);
   if(next===null)return Object.freeze({complete:true,records:count,pages,serverTime:latestTime,...(window?{window:{...window}}:{})});
   visited.add(next);cursor=next;
  }
 }
 function read(onPage,onWindow){if(typeof onPage!=='function'||onWindow!==undefined&&typeof onWindow!=='function')return Promise.reject(Error('invalid page consumer'));if(flight)return Promise.reject(Error('履歴を読み込み中です。'));flight=run(onPage,onWindow).finally(()=>{flight=null;});return flight;}
 return Object.freeze({read});
}
module.exports={create};

};
factories["./client.cjs"]=function(module,exports,require){
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

};
factories["./aggregate.cjs"]=function(module,exports,require){
'use strict';
// サーバーで本人・時刻・教材を確認した保存済み区間だけを集計する候補。
// この関数は認可や端末時刻の信頼性を代替しない。実APIには未接続。
const SUBJECTS=['数学','英語','国語','理科','社会'],DAY=86400000,JST=9*3600000;
function aggregate(records,{maxRecords=10000}={}){
 if(!Number.isSafeInteger(maxRecords)||maxRecords<1||maxRecords>6000000||!Array.isArray(records)||records.length>maxRecords)throw Error('invalid records');
 const unique=new Map();
 for(const r of records){
  if(!r||typeof r.id!=='string'||!r.id||r.id.length>100||!SUBJECTS.includes(r.subject))throw Error('invalid record');
  if(![r.start,r.end,r.acceptedAt].every(Number.isSafeInteger)||r.start<0||r.end<=r.start||r.end-r.start>4*3600000||r.acceptedAt<r.end)throw Error('invalid interval');
  const clean={id:r.id,subject:r.subject,start:r.start,end:r.end,acceptedAt:r.acceptedAt},old=unique.get(r.id);
  if(old&&JSON.stringify(old)!==JSON.stringify(clean))throw Error('conflicting duplicate');
  unique.set(r.id,clean);
 }
 const events=new Map(),days={},heap=[],active=new Set();
 const better=(a,b)=>a.acceptedAt>b.acceptedAt||(a.acceptedAt===b.acceptedAt&&a.id<b.id);
 function push(r){heap.push(r);let i=heap.length-1;while(i>0){const parent=(i-1)>>1;if(!better(heap[i],heap[parent]))break;[heap[i],heap[parent]]=[heap[parent],heap[i]];i=parent;}}
 function pop(){const last=heap.pop();if(!heap.length)return;heap[0]=last;let i=0;for(;;){let best=i;for(const child of [2*i+1,2*i+2])if(child<heap.length&&better(heap[child],heap[best]))best=child;if(best===i)break;[heap[i],heap[best]]=[heap[best],heap[i]];i=best;}}
 for(const r of unique.values()){for(const [at,kind] of [[r.start,'start'],[r.end,'end']]){if(!events.has(at))events.set(at,[]);events.get(at).push({kind,r});}}
 const points=[...events.keys()].sort((a,b)=>a-b);
 for(let i=0;i<points.length-1;i++){
  let start=points[i];const end=points[i+1];
  // 重複時はサーバーの受理時刻が新しい記録を採用。等しい時はIDで固定。
  for(const event of events.get(start)){if(event.kind==='end')active.delete(event.r.id);else{active.add(event.r.id);push(event.r);}}
  while(heap.length&&!active.has(heap[0].id))pop();
  if(!heap.length)continue;const subject=heap[0].subject;
  while(start<end){
   const stop=Math.min(end,(Math.floor((start+JST)/DAY)+1)*DAY-JST),key=new Date(start+JST).toISOString().slice(0,10);
   const day=days[key]||(days[key]=Object.fromEntries(SUBJECTS.map(s=>[s,0])));day[subject]+=stop-start;start=stop;
  }
 }
 return days;
}
module.exports={aggregate};

};
factories["./month.cjs"]=function(module,exports,require){
'use strict';
const {create:history}=require('./history.cjs'),{aggregate}=require('./aggregate.cjs');
const SUBJECTS=['数学','英語','国語','理科','社会'],DAY=86400000,JST=9*3600000;
function bounds(month){
 if(typeof month!=='string'||!/^20\d{2}-(0[1-9]|1[0-2])$/.test(month))throw Error('invalid month');
 const [y,m]=month.split('-').map(Number);return {start:Date.UTC(y,m-1,1)-JST,end:Date.UTC(y,m,1)-JST};
}
// 途中ページを完成した月と誤認しない。公開するのは全履歴の検証後だけ。
// 1チャンク60区間×10万チャンクという保存APIの上限をそのまま使う。
function create(options){
 const {same,ready}=options;if(typeof same!=='function'||typeof ready!=='function')throw Error('invalid month context');
 let closed=false,flight=null,snapshot=null,error='',requested=null;
 const own=()=>!closed&&same()===true;
 const reader=history({...options,same:own});
 const copy=value=>value?JSON.parse(JSON.stringify(value)):null;
 function state(){if(!own())snapshot=null;return {loading:!!flight,requested,snapshot:copy(snapshot),error};}
 async function run(month){
  const range=bounds(month),intervals=new Map();let matchedSpans=0;
  const meta=await reader.read(page=>{
   if(!own()||!ready())throw Error('session changed');
   for(const s of page){
    if(s.end<=range.start||s.start>=range.end)continue;
    if(matchedSpans>=6000000)throw Error('history limit');matchedSpans++;
    const clipped={...s,start:Math.max(s.start,range.start),end:Math.min(s.end,range.end)},key=clipped.subject+':'+clipped.start+':'+clipped.end,old=intervals.get(key);
    // 同じ教科・同じ区間では、優先順位が最も高い記録だけで結果が決まる。
    // 複数端末等の同一区間を百万件保持してから集計する必要はない。
    if(!old||clipped.acceptedAt>old.acceptedAt||clipped.acceptedAt===old.acceptedAt&&clipped.id<old.id)intervals.set(key,clipped);
   }
  },window=>{if(window||snapshot?.window)snapshot=null;});
  if(!meta.complete||!own()||!ready())throw Error('history incomplete');
  const from=meta.window?.from||0;
  const visible=[...intervals.values()].filter(s=>s.end>from).map(s=>({...s,start:Math.max(s.start,from)}));
  const measured=aggregate(visible,{maxRecords:6000000}),days={};
  for(let t=range.start;t<range.end;t+=DAY){const date=new Date(t+JST).toISOString().slice(0,10);days[date]=t+DAY<=from?null:measured[date]||Object.fromEntries(SUBJECTS.map(s=>[s,0]));}
  const totals=Object.fromEntries(SUBJECTS.map(s=>[s,0]));for(const d of Object.values(days))if(d)for(const s of SUBJECTS)totals[s]+=d[s];
  if(!own()||!ready())throw Error('session changed');
  snapshot={month,days,totals,totalMs:Object.values(totals).reduce((a,b)=>a+b,0),matchedSpans,retainedIntervals:intervals.size,records:meta.records,pages:meta.pages,serverTime:meta.serverTime,complete:true,...(meta.window?{window:meta.window}:{})};
  return copy(snapshot);
 }
 function load(month){
  try{bounds(month);}catch(_){return Promise.reject(Error('表示する月を確認してください。'));}
  if(flight)return Promise.reject(Error('学習時間を読み込み中です。'));
  if(!own()){snapshot=null;return Promise.reject(Error('学習時間の接続を確認してください。'));}
  if(!ready()){error='接続を確認できません。前に確認できた表示を残しています。';return Promise.reject(Error(error));}
  requested=month;error='';if(snapshot?.window)snapshot=null;
  flight=run(month).catch(()=>{if(!own())snapshot=null;error=snapshot?'学習時間をすべて確認できませんでした。前に確認できた表示を残しています。':'学習時間をすべて確認できませんでした。接続を確認して、もう一度読み込んでください。';throw Error(error);}).finally(()=>{flight=null;});
  return flight;
 }
 return Object.freeze({load,state,dispose(){closed=true;snapshot=null;}});
}
module.exports={bounds,create};

};
factories["./app.cjs"]=function(module,exports,require){
'use strict';
const {create:client}=require('./client.cjs'),{create:month}=require('./month.cjs');
// 本体の本人確認・HTTP処理を注入する。認証値を表示・計測保存へ渡さない。
function create(options){
 const {context,request,mountCalendar}=options;
 if(![context,request,mountCalendar].every(f=>typeof f==='function'))throw Error('invalid app adapter');
 let closed=false,calendar=null;
 function current(){
  const ctx=context();
  return ctx&&typeof ctx.uid==='string'&&ctx.uid&&typeof ctx.same==='function'&&typeof ctx.ready==='function'&&ctx.same()&&ctx.ready()?ctx:null;
 }
 function own(ctx){if(closed||!ctx?.same()||!ctx.ready())throw Error('学習時間の接続を確認してください。');}
 async function call(ctx,path,body){
  own(ctx);
  if(body===undefined?!/^\/learning-time(?:\?cursor=[a-f0-9-]{36})?$/.test(path):!['/learning-time','/learning-time-start'].includes(path))throw Error('invalid time route');
  // 本体側も渡された本人を送信の直前・応答後に照合する。
  const value=await request(ctx,path,body===undefined?undefined:structuredClone(body));own(ctx);return value;
 }
 const tracker=client({...options,context:current,request:(path,body)=>call(current(),path,body)});
 function dropCalendar(){if(calendar){calendar.view.destroy();calendar=null;}}
 async function refresh(force=false){
  if(calendar&&!calendar.ctx.same())dropCalendar();
  return tracker.refresh(force);
 }
 function show(host,selectedMonth,day){
  if(calendar&&!calendar.ctx.same())dropCalendar();
  const ctx=current();if(closed||!ctx)return false;
  if(!calendar){
   const model=month({same:()=>!closed&&ctx.same(),ready:ctx.ready,catalog:options.catalog,request:(path,body)=>call(ctx,path,body)});
   let view;
   try{view=mountCalendar({model,same:()=>!closed&&ctx.same()});}catch(error){model.dispose();throw error;}
   calendar={ctx,view};
  }
  calendar.view.show(host,selectedMonth,day);return true;
 }
 async function stop(){closed=true;dropCalendar();return tracker.stop();}
 return Object.freeze({refresh,retry:async()=>{if(calendar&&!calendar.ctx.same())dropCalendar();return tracker.retry();},show,stop,state:tracker.state});
}
module.exports={create};

};
function require(id){if(cache[id])return cache[id].exports;if(!factories[id])throw Error('unknown module');const module={exports:{}};cache[id]=module;factories[id](module,module.exports,require);return module.exports;}root.NobiLearningTimeRuntime=Object.freeze(require('./runtime.cjs'));root.NobiLearningTimeBridge=Object.freeze(require('./bridge.cjs'));root.NobiLearningTimeHistory=Object.freeze(require('./history.cjs'));root.NobiLearningTimeClient=Object.freeze(require('./client.cjs'));root.NobiLearningTimeMonth=Object.freeze(require('./month.cjs'));root.NobiLearningTimeApp=Object.freeze(require('./app.cjs'));})(globalThis);
