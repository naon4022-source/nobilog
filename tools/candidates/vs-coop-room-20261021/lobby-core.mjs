// Candidate only: pure server-owned lobby transitions. No network, storage or rewards.
// The route must take actor identity from its verified session, use server time,
// and persist transitions with a revision CAS plus an active-session SQL guard.
const ID=/^[A-Za-z0-9_-]{1,80}$/,HASH=/^[a-f0-9]{64}$/;
const phases=new Set(['lobby','countdown','running','deadline','cancelled','expired']);
export class LobbyError extends Error{constructor(code){super(code);this.name='LobbyError';this.code=code;}}
function fail(code){throw new LobbyError(code);}
function integer(n,min,max){return Number.isSafeInteger(n)&&n>=min&&n<=max;}
function identity(actor){if(!actor||typeof actor.uid!=='string'||!ID.test(actor.uid))fail('identity');return actor.uid;}
function nickname(value){if(typeof value!=='string')fail('nickname');const s=value.trim();if(!s||s.length>24||/[\x00-\x1f\x7f\u202a-\u202e\u2066-\u2069]/.test(s))fail('nickname');return s;}
function member(room,uid){return room.host.uid===uid?room.host:room.guest?.uid===uid?room.guest:null;}
function state(room){
 if(!room||room.v!==1||typeof room.id!=='string'||!ID.test(room.id)||!phases.has(room.phase)||!integer(room.revision,1,Number.MAX_SAFE_INTEGER)||!HASH.test(room.rulesDigest||'')||!['vs','coop'].includes(room.mode)||typeof room.unitId!=='string'||!ID.test(room.unitId))fail('room_state');
 if(!Array.isArray(room.questionIds)||![15,30,45,60].includes(room.questionIds.length)||new Set(room.questionIds).size!==room.questionIds.length||room.questionIds.some(x=>typeof x!=='string'||!ID.test(x)))fail('room_state');
 if(!integer(room.createdAt,0,Number.MAX_SAFE_INTEGER)||!integer(room.updatedAt,room.createdAt,Number.MAX_SAFE_INTEGER)||!integer(room.lobbyExpiresAt,room.createdAt+1,room.createdAt+600000)||!integer(room.countdownMs,1000,10000)||!integer(room.matchMs,1000,3600000)||typeof room.rulesSummary!=='string'||!room.rulesSummary.trim()||room.rulesSummary.length>1000)fail('room_state');
 function validPlayer(p,host){
  if(!p||typeof p.uid!=='string'||!ID.test(p.uid)||typeof p.requestId!=='string'||!ID.test(p.requestId)||typeof p.approved!=='boolean'||typeof p.ready!=='boolean'||typeof p.left!=='boolean'||!integer(p.joinedAt,room.createdAt,room.updatedAt)||!integer(p.lastSeenAt,p.joinedAt,room.updatedAt)||p.ready&&!p.approved||host&&!p.approved)fail('room_state');
  nickname(p.nickname);
 }
 validPlayer(room.host,true);if(room.guest){validPlayer(room.guest,false);if(room.host.uid===room.guest.uid)fail('room_state');}
 const started=['countdown','running','deadline'].includes(room.phase);
 if(started&&(!room.guest?.approved||!integer(room.startsAt,room.createdAt,Number.MAX_SAFE_INTEGER)||!integer(room.deadlineAt,room.startsAt+1,Number.MAX_SAFE_INTEGER)||room.deadlineAt-room.startsAt!==room.matchMs))fail('room_state');
 if(!started&&(room.startsAt!==null||room.deadlineAt!==null))fail('room_state');
 if(['cancelled','expired','deadline'].includes(room.phase)){if(!integer(room.endedAt,room.createdAt,room.updatedAt))fail('room_state');}
 else if(room.endedAt!==null)fail('room_state');
 return structuredClone(room);
}
function clock(room,now){if(!integer(now,0,Number.MAX_SAFE_INTEGER))fail('server_time');return Math.max(now,room.updatedAt);}
function changed(room,now){room.revision++;if(!Number.isSafeInteger(room.revision))fail('revision');room.updatedAt=now;return room;}
function player(actor,now,requestId,approved){return {uid:identity(actor),nickname:nickname(actor.nickname),requestId,approved,ready:false,left:false,joinedAt:now,lastSeenAt:now};}
function lobby(room){if(room.phase!=='lobby')fail('not_lobby');}
function participant(room,uid){const p=member(room,uid);if(!p)fail('not_member');return p;}
export function createLobby(input,now){
 if(!integer(now,0,Number.MAX_SAFE_INTEGER)||!input||!ID.test(input.id||'')||!HASH.test(input.rulesDigest||'')||!['vs','coop'].includes(input.mode)||!ID.test(input.unitId||''))fail('create');
 if(!Array.isArray(input.questionIds)||![15,30,45,60].includes(input.questionIds.length)||new Set(input.questionIds).size!==input.questionIds.length||input.questionIds.some(x=>typeof x!=='string'||!ID.test(x)))fail('questions');
 // Values are internal validated server proposals, never silently inferred from
 // a browser clock or supplied by a peer after readiness is acknowledged.
 if(!integer(input.lobbyMs,1000,600000)||!integer(input.countdownMs,1000,10000)||!integer(input.matchMs,1000,3600000))fail('timing');
 if(typeof input.rulesSummary!=='string'||!input.rulesSummary.trim()||input.rulesSummary.length>1000)fail('rules');
 const end=now+input.lobbyMs;if(!Number.isSafeInteger(end+input.matchMs+input.countdownMs))fail('server_time');
 return {v:1,id:input.id,revision:1,mode:input.mode,unitId:input.unitId,questionIds:[...input.questionIds],rulesDigest:input.rulesDigest,rulesSummary:input.rulesSummary,createdAt:now,updatedAt:now,lobbyExpiresAt:end,countdownMs:input.countdownMs,matchMs:input.matchMs,startsAt:null,deadlineAt:null,endedAt:null,phase:'lobby',reason:null,host:player(input.host,now,'host',true),guest:null};
}
export function advanceLobby(raw,now){
 const room=state(raw),at=clock(room,now);let changedPhase=false;
 if(room.phase==='lobby'&&at>=room.lobbyExpiresAt){room.phase='expired';room.reason='invite_expired';room.endedAt=room.lobbyExpiresAt;changedPhase=true;}
 if(room.phase==='countdown'&&at>=room.startsAt){room.phase='running';changedPhase=true;}
 if(room.phase==='running'&&at>=room.deadlineAt){room.phase='deadline';room.reason='match_deadline';room.endedAt=room.deadlineAt;changedPhase=true;}
 return changedPhase?changed(room,at):room;
}
function action(raw,actor,now){const room=advanceLobby(raw,now),uid=identity(actor);return {room,uid,at:clock(room,now)};}
export function joinLobby(raw,actor,{requestId,consent},now){
 const {room,uid,at}=action(raw,actor,now);lobby(room);
 if(consent!==true||!ID.test(requestId||''))fail('consent');
 if(room.host.uid===uid)fail('same_participant');
 if(room.guest){if(room.guest.uid===uid&&room.guest.requestId===requestId){if(room.guest.nickname!==nickname(actor.nickname))fail('retry_conflict');return room;}fail('room_full');}
 room.guest=player(actor,at,requestId,false);return changed(room,at);
}
export function approveGuest(raw,actor,{requestId},now){
 const {room,uid,at}=action(raw,actor,now);if(room.host.uid!==uid)fail('host_only');
 if(!room.guest||room.guest.requestId!==requestId)fail('guest_changed');
 if(room.guest.approved&&['lobby','countdown','running','deadline'].includes(room.phase))return room;lobby(room);room.guest.approved=true;room.host.ready=false;room.host.lastSeenAt=at;return changed(room,at);
}
export function setReady(raw,actor,{ready,rulesDigest},now){
 const {room,uid,at}=action(raw,actor,now);const p=participant(room,uid);
 if(!p.approved||typeof ready!=='boolean')fail('not_approved');
 if(rulesDigest!==room.rulesDigest)fail('rules_changed');
 if(p.ready===ready&&['lobby','countdown','running','deadline'].includes(room.phase))return room;lobby(room);p.ready=ready;p.lastSeenAt=at;
 if(room.host.ready&&room.guest?.approved&&room.guest.ready){room.phase='countdown';room.startsAt=at+room.countdownMs;room.deadlineAt=room.startsAt+room.matchMs;}
 return changed(room,at);
}
export function leaveLobby(raw,actor,now){
 const {room,uid,at}=action(raw,actor,now);const p=participant(room,uid);
 if(room.phase==='lobby'){
  if(uid===room.host.uid){room.phase='cancelled';room.reason='host_cancelled';room.endedAt=at;}
  else{room.guest=null;room.host.ready=false;}
 }else if(['countdown','running'].includes(room.phase)){
  if(p.left)return room;p.left=true;p.ready=false;
 }else return room;
 return changed(room,at);
}
export function resumeLobby(raw,actor,now){
 const {room,uid,at}=action(raw,actor,now);const p=participant(room,uid);
 if(!p.approved)fail('not_approved');
 if(!['lobby','countdown','running'].includes(room.phase))return room;
 p.left=false;p.lastSeenAt=at;return changed(room,at);
}
export function publicLobby(raw,actor,now){
 const room=advanceLobby(raw,now),uid=identity(actor),self=participant(room,uid),role=room.host.uid===uid?'host':'guest';
 const brief=p=>p?{nickname:p.nickname,approved:p.approved,ready:p.ready,left:p.left}:null;
 // Never serialize another learner's UID, input, credentials, previous records,
 // the private question-ID order, invitation hash or grading criteria here.
 return {id:room.id,revision:raw.revision,mode:room.mode,phase:room.phase,reason:room.reason,self:{role,...brief(self)},peer:brief(role==='host'?room.guest:room.host),guestRequestId:role==='host'?room.guest?.requestId||null:null,unitId:self.approved?room.unitId:null,questionCount:self.approved?room.questionIds.length:null,rulesSummary:self.approved?room.rulesSummary:null,rulesDigest:self.approved?room.rulesDigest:null,lobbyExpiresAt:room.lobbyExpiresAt,startsAt:self.approved?room.startsAt:null,deadlineAt:self.approved?room.deadlineAt:null,serverTime:clock(room,now)};
}
