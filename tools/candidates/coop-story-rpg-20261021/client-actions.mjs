// Authenticated command adapter. io.request captures the existing session
// generation and returns Response; this module never receives credentials.
const randomId=()=>crypto.randomUUID().replace(/-/g,'');
const invite=()=>[...crypto.getRandomValues(new Uint8Array(8))].map(x=>'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'[x&31]).join('');
const methods={profile:'POST',create:'POST',invite:'POST',leave:'POST',cancel:'POST','join-request':'POST',approve:'POST',reject:'POST',ready:'POST',start:'POST',tap:'POST',answer:'POST',purchase:'POST',equip:'POST',heartbeat:'POST',disconnect:'POST',history:'GET','history-more':'GET',story:'GET',pending:'GET','join-status':'GET',state:'GET'};
const replaySafe=new Set(['tap','answer','purchase','create','invite','leave','cancel','join-request']);
const failure=(code,status=0)=>Object.assign(Error(code),{code,status});
export function createCoopActions(io,{makeId=randomId,makeInvite=invite,maxQueued=20}={}){
 for(const key of ['request','isCurrent','onState'])if(typeof io?.[key]!=='function')throw Error('coop_actions_configuration');
 if(!Number.isSafeInteger(maxQueued)||maxQueued<1||maxQueued>100)throw Error('coop_actions_capacity');
 let stopped=false,roomId=null,queue=Promise.resolve(),queued=0,pending=null;
 let snapshot={state:null,equipment:null,shop:[],story:null,history:[],canHost:false,connection:'connecting',retryPending:false};
 const abort=new AbortController(),current=()=>!stopped&&io.isCurrent()===true;
 function check(){if(!current()){stop();throw failure('active_session',409);}}
 function publish(){check();io.onState(structuredClone(snapshot));}
 function revoke(){const visible=current();stop();if(visible){io.onState(structuredClone(snapshot));if(typeof io.onSessionChanged==='function')io.onSessionChanged();}}
 function gear(value){if(value&&Number.isSafeInteger(value.revision)&&(!snapshot.equipment||value.revision>=snapshot.equipment.revision))snapshot={...snapshot,equipment:value,profile:value};}
 function absorb(reply){
  check();if(!reply||typeof reply!=='object')throw failure('invalid_reply');
  if(reply.state){
   if(reply.state.id!==roomId||!Number.isSafeInteger(reply.state.revision))throw failure('invalid_room_reply');
   if(snapshot.state&&snapshot.state.id===roomId&&reply.state.revision<snapshot.state.revision)return;
   snapshot={...snapshot,state:reply.state,canHost:reply.canHost===true};gear(reply.equipment);
  }
  if(Object.hasOwn(reply,'profile')){if(reply.profile===null&&!snapshot.equipment)snapshot.profile=null;else gear(reply.profile);}
  if(reply.view?.owned)gear(reply.view);
  if(reply.owned)gear(reply);
  if(Array.isArray(reply.shop))snapshot.shop=reply.shop;
  if(Array.isArray(reply.items))snapshot.history=reply.items;
  if(Array.isArray(reply.items))snapshot.historyCursor=reply.next||null;
  if(Array.isArray(reply.completedStageIds))snapshot.completedStageIds=reply.completedStageIds;
  if(Array.isArray(reply.stages))snapshot.story=reply;
  if(Array.isArray(reply.requests))snapshot.pendingRequests=reply.requests;
 }
 async function call(action,body,method=methods[action]){
  check();const response=await io.request(action,{method,...(method==='GET'?{query:body}:{body:structuredClone(body)}),signal:abort.signal});check();
  const data=await response.json().catch(()=>null);check();
  if(!response.ok){const error=failure(typeof data?.error==='string'?data.error:'coop_unavailable',response.status);if(response.status===401||['active_session','forbidden','origin'].includes(error.code))revoke();throw error;}
  if(!data||typeof data!=='object')throw failure('invalid_reply');return data;
 }
 async function refresh(){if(!roomId)return snapshot;const reply=await call('state',{roomId});absorb(reply);publish();return structuredClone(snapshot);}
 function prepare(action,input){
  const body=structuredClone(input||{});
  if(action==='create'){body.roomId='room_'+makeId();body.inviteCode=makeInvite();}
  if(action==='invite')body.inviteCode=makeInvite();
  if(action==='join-request')body.requestId='join_'+makeId();
  if(action==='purchase')body.operationId='buy_'+makeId();
  if(action==='history-more'){if(!snapshot.historyCursor)throw failure('history_complete',409);body.cursor=snapshot.historyCursor;}
  if(action==='join-status')Object.assign(body,snapshot.joinRequest||body);
  if(['tap','ready','start','answer','approve','reject','heartbeat','disconnect','pending','state','invite','leave','cancel'].includes(action)){
   if(!roomId)throw failure('room_unavailable',404);body.roomId=roomId;
  }
  if(action==='tap')body.sequence=(snapshot.state?.own?.lastSequence||0)+1;
  if(action==='answer'){
   const q=snapshot.state?.own?.question;
   if(!q||body.challengeId!==q.challengeId)throw failure('question_changed',409);
   body.sequence=snapshot.state.own.nextAnswerSequence;
  }
  return {action,body,method:methods[action]};
 }
 async function execute(op){
  let reply;
  try{
   try{reply=await call(op.action,op.body,op.method);}
   catch(error){if(!current()||!replaySafe.has(op.action)||(error.status>0&&error.status<500))throw error;reply=await call(op.action,op.body,op.method);}
  }catch(error){
   if(current()&&op.method==='POST'&&(!error.status||error.status>=500)){
    pending=op;snapshot.retryPending=true;publish();
   }
   throw error;
  }
  check();pending=null;snapshot.retryPending=false;
  if(op.action==='leave'||op.action==='cancel'){clearRoom();publish();return structuredClone(snapshot);}
  if(op.action==='create'){
   if(reply.id!==op.body.roomId)throw failure('invalid_room_reply');
   roomId=reply.id;snapshot={...snapshot,inviteCode:op.body.inviteCode,state:null,canHost:false,pendingRequests:[],joinRequest:null,joinStatus:null};
  }
  if(op.action==='invite'){if(reply.id!==roomId)throw failure('invalid_room_reply');snapshot.inviteCode=op.body.inviteCode;snapshot.pendingRequests=[];}
  if(['join-request','join-status'].includes(op.action)){
   snapshot.joinRequest={roomId:reply.roomId,requestId:reply.requestId};snapshot.joinStatus=reply.status;
   if(reply.status==='approved'){roomId=reply.roomId;snapshot.state=null;snapshot.inviteCode=null;snapshot.pendingRequests=[];}
  }
  if(op.action==='history-more')reply={...reply,items:[...new Map([...snapshot.history,...reply.items].map(x=>[x.roomId,x])).values()]};
  absorb(reply);
  if(!reply.state&&(op.action==='create'||['approve','reject','invite'].includes(op.action)||(['join-request','join-status'].includes(op.action)&&reply.status==='approved')))await refresh();else publish();
  return structuredClone(snapshot);
 }
 function enqueue(task){
  check();if(queued>=maxQueued)return Promise.reject(failure('client_queue_full',429));queued++;
  const result=queue.catch(()=>{}).then(()=>{check();return task();});
  queue=result.finally(()=>{queued--;});queue.catch(()=>{});return result;
 }
 function act(action,input={}){
  if(action!=='retry'&&!Object.hasOwn(methods,action))return Promise.reject(failure('unknown_action',400));
  const captured=structuredClone(input);
  try{return enqueue(async()=>{
   if(action==='retry'){if(!pending)return structuredClone(snapshot);return execute(pending);}
   if(pending)throw failure('retry_required',409);
   // Queued physical taps stop when the server opens a private question.
   if(action==='tap'&&snapshot.state?.own?.question)return structuredClone(snapshot);
   return execute(prepare(action,captured));
  });}catch(error){return Promise.reject(error);}
 }
 function stop(){if(stopped)return;stopped=true;abort.abort();pending=null;roomId=null;snapshot={state:null,connection:'session_changed',retryPending:false};}
 function clearRoom(){roomId=null;snapshot={...snapshot,state:null,canHost:false,inviteCode:null,pendingRequests:[],joinRequest:null,joinStatus:null};}
 return Object.freeze({act,refresh,stop,read(){check();return structuredClone(snapshot);},
  async load(){const profile=await call('profile',{},'GET');absorb(profile);const history=await call('history',{},'GET');absorb(history);const progress=await call('progress',{},'GET');absorb(progress);publish();return structuredClone(snapshot);},
  async open(id){check();if(typeof id!=='string'||!/^[A-Za-z0-9_-]{1,80}$/.test(id))throw failure('invalid_id',400);if(queued||pending)throw failure('client_busy',409);roomId=id;snapshot.state=null;return refresh();},
  forgetRoom(){check();if(queued||pending)throw failure('client_busy',409);clearRoom();publish();},
  accept(reply){absorb(reply);publish();},setConnection(value){check();snapshot.connection=value;publish();}
 });
}
