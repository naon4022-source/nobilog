// View + existing authenticated transport + server authority. No credential or
// localStorage access. Call destroy from the app's screen/logout teardown.
import {createCoopActions} from './client-actions.mjs';
import {createLiveRefresh} from './live-refresh.mjs';
import {mountCoopView} from './view.mjs';
const err=(code,status=0)=>Object.assign(Error(code),{code,status});
export function mountCoopGame(root,io){
 for(const key of ['request','isCurrent','renderPrompt'])if(typeof io?.[key]!=='function')throw Error('coop_game_configuration');
 const doc=root.ownerDocument,win=doc.defaultView,scope=new AbortController();
 let alive=true,visible=doc.visibilityState!=='hidden',started=false,room=null,events=null,pulseTimer=null,clockTimer=null,pulsing=false,clockReading=false,lastClear=null;
 let snapshot=null,timeKey=null,timeReceived=0,serverReceived=0,loadingClear=false;
 const connectionId='conn_'+crypto.randomUUID().replace(/-/g,'');
 const current=()=>alive&&io.isCurrent()===true;
 const view=mountCoopView(root,{isCurrent:current,renderPrompt:io.renderPrompt,onAction:operate});
 const actions=createCoopActions({isCurrent:current,onState:receive,onSessionChanged:()=>destroy(false),request:(action,options)=>{
  if(!visible)throw err('view_hidden',409);return request(action,options);
 }});
 function clearTimers(){clearTimeout(pulseTimer);clearTimeout(clockTimer);pulseTimer=null;clockTimer=null;}
 async function request(action,options){
  if(!current())throw err('active_session',409);
  const response=await io.request(action,{...options,signal:options.signal||scope.signal});
  if(!current()){void response.body?.cancel().catch(()=>{});throw err('active_session',409);}return response;
 }
 async function json(action,options){
  const response=await request(action,options),data=await response.json();
  if(!current())throw err('active_session',409);
  if(!response.ok){const error=err(data?.error||'coop_unavailable',response.status);if(response.status===401||['active_session','forbidden','origin'].includes(error.code))destroy(false);throw error;}return data;
 }
 function rendered(){
  if(!snapshot)return null;
  const out=structuredClone(snapshot);
  const stages=out.story?.stages||[],completed=new Set(out.completedStageIds||[]);
  out.stageTitle=stages.find(x=>x.id===out.state?.stageId)?.title;
  out.nextStageId=stages.find(x=>!completed.has(x.id))?.id;out.loadingClear=loadingClear;
  out.history=(out.history||[]).map(x=>({...x,stageTitle:stages.find(s=>s.id===x.stageId)?.title||x.stageId}));
  if(out.state?.phase==='countdown'&&Number.isFinite(out.state.combatOpensAt)&&Number.isFinite(serverReceived))out.countdownSeconds=Math.max(0,Math.ceil((out.state.combatOpensAt-serverReceived-(performance.now()-timeReceived))/1000));
  return out;
 }
 function paint(){if(current()&&visible&&snapshot)view.render(rendered());}
 function receive(value){
  if(!current()){destroy(false);return;}snapshot=value;
  const state=value.state,key=state?`${state.id}:${state.revision}:${state.serverNow}:${state.combatOpensAt}`:null;
  if(key!==timeKey){timeKey=key;timeReceived=performance.now();serverReceived=state?.serverNow??0;}
  const next=state?.id||null;
  if(next!==room){events?.stop();events=null;room=next;if(typeof io.onRoom==='function')io.onRoom(room);if(visible)startEvents();}
  if(state?.phase==='cleared'){
   events?.stop();events=null;
   if(lastClear!==room){lastClear=room;loadingClear=true;void actions.load().catch(()=>{}).finally(()=>{loadingClear=false;paint();});}
  }
  paint();if(visible&&!pulseTimer&&!pulsing)schedulePulse();
  if(state?.phase==='countdown'&&visible&&!clockTimer)scheduleClock();
 }
 function status(value){
  if(!current())return;
  if(value==='session_changed'){destroy(false);return;}
  actions.setConnection(value);if(typeof io.onStatus==='function')io.onStatus(value);
 }
 function roomLost(error,id){
  if(!current()||room!==id||error.code!=='room_unavailable')return false;
  try{actions.forgetRoom();actions.setConnection('connected');return true;}catch(_){return false;}
 }
 function startEvents(){
  if(!current()||!visible||!room||snapshot?.state?.phase==='cleared'||events)return;
  const id=room;
  events=createLiveRefresh({isCurrent:()=>current()&&visible&&room===id,
   connect:signal=>request('events',{method:'GET',query:{roomId:id},signal}),
   fetchState:async signal=>{try{const data=await json('state',{method:'GET',query:{roomId:id},signal});if(room!==id)throw err('room_changed',409);actions.accept(data);return data.state;}catch(error){roomLost(error,id);throw error;}},
   onState:()=>{},onStatus:status});events.start();
 }
 function schedulePulse(delay=2000){clearTimeout(pulseTimer);if(current()&&visible)pulseTimer=setTimeout(()=>{pulseTimer=null;void pulse();},delay);}
 async function pulse(){
  if(!current()){destroy(false);return;}if(!visible||pulsing)return;pulsing=true;
  const id=room;
  try{
   if(id&&['lobby','battle','paused'].includes(snapshot?.state?.phase)){
    // Presence renewals do not wait behind queued taps or an unknown purchase.
    const data=await json('heartbeat',{method:'POST',body:{roomId:id,connectionId}});
    if(room===id)actions.accept(data);
    if(snapshot?.canHost&&snapshot.state.phase==='lobby'&&!snapshot.retryPending)await actions.act('pending');
   }else if(snapshot?.joinStatus==='pending'&&!snapshot.retryPending)await actions.act('join-status');
   startEvents();
  }catch(error){
   if(error.code==='presence_unavailable'&&current()&&room===id){try{await actions.refresh();}catch(fresh){if(roomLost(fresh,id))return;}}
   if(!roomLost(error,id)&&current()&&error.code!=='view_hidden')status('reconnecting');
  }
  finally{pulsing=false;if(current()&&visible)schedulePulse(id!==room?0:2000);}
 }
 function scheduleClock(){
  clearTimeout(clockTimer);if(!current()||!visible||snapshot?.state?.phase!=='countdown')return;
  clockTimer=setTimeout(async()=>{
   clockTimer=null;if(!current()||!visible)return;paint();
   if(rendered()?.countdownSeconds===0&&!clockReading){clockReading=true;try{await actions.refresh();}catch(_){}finally{clockReading=false;}}
   scheduleClock();
  },250);
 }
 async function operate(action,detail){
  if(!current()||!visible)throw err('view_hidden',409);
  if(action==='cancel'&&snapshot?.state?.phase!=='lobby'&&!win.confirm('この冒険を終了しますか？ 今回の途中経過は再開できません。学習記録とクリア済みの履歴は残ります。'))return;
  await actions.act(action,detail);if(!current())return;
  // receive() already rendered the newest acknowledged snapshot. Returning
  // an older captured result to the view could overwrite a newer SSE update.
  if(['create','join-status','approve','start','invite'].includes(action))schedulePulse(0);
 }
 function disconnect(){
  if(!room||!current())return;
  // The session is captured by the supplied transport before this call returns.
  // Do not attach the soon-to-be-aborted lifetime signal to a closing beacon.
  try{void Promise.resolve(io.request('disconnect',{method:'POST',body:{roomId:room,connectionId},keepalive:true})).then(r=>r.body?.cancel()).catch(()=>{});}catch(_){}
 }
 function hide(send=true){if(!alive)return;if(send&&visible)disconnect();visible=false;clearTimers();events?.stop();events=null;}
 async function show(){
  if(!current()){destroy(false);return;}visible=true;
  try{await actions.refresh();actions.setConnection('connected');startEvents();await pulse();paint();}catch(_){if(current())status('reconnecting');}
 }
 function destroy(send=true){if(!alive)return;hide(send);alive=false;scope.abort();actions.stop();view.destroy();if(typeof io.onStop==='function')io.onStop();}
 doc.addEventListener('visibilitychange',()=>{if(doc.visibilityState==='hidden')hide();else void show();},{signal:scope.signal});
 win.addEventListener('pagehide',()=>hide(),{signal:scope.signal});
 win.addEventListener('pageshow',()=>{if(started&&doc.visibilityState!=='hidden')void show();},{signal:scope.signal});
 return Object.freeze({
  async start(){if(started||!current())return;started=true;await actions.load();await actions.act('story');if(!current())return;
   let hint=typeof io.loadRoomId==='function'?await io.loadRoomId():null;if(!current())return;
   if(hint){try{await actions.open(hint);}catch(error){if(!current()||!['room_unavailable','invalid_id'].includes(error.code))throw error;actions.forgetRoom();hint=null;}}
   if(!hint){const saved=await json('resume',{method:'GET',query:{}});if(saved.roomId)await actions.open(saved.roomId);}
   actions.setConnection('connected');
   if(visible){startEvents();await pulse();paint();}
  },hide,show,destroy,
  async open(id){if(!current()||!visible)throw err('view_hidden',409);await actions.open(id);schedulePulse(0);},
  state:()=>actions.read()
 });
}
