// Pure server-owned cooperative learning state. Persistence must use room CAS
// plus the existing active-session guard. No grades, wallets or credentials.
import {guideVersion,jobs,tutorials,puzzleView} from './learning-catalog.mjs';
import {partyView} from './party-core.mjs';
const need=(ok,code)=>{if(!ok)throw Error(code);};
const integer=n=>Number.isSafeInteger(n)&&n>=0;
const roster=room=>room.members.map(m=>m.uid).sort().join(':');
const own=(room,uid)=>{const m=room.members.find(m=>m.uid===uid);need(m,'not_member');return m;};
function base(raw,uid,now){
 partyView(raw,uid);own(raw,uid);
 need(integer(now)&&integer(raw.updatedAt)&&now>=raw.updatedAt,'invalid_server_time');
 need(raw.phase==='lobby'&&raw.closedAt==null,'roster_locked');
 const room=structuredClone(raw);
 // A different roster must learn together. A departed member's acknowledgments
 // and votes cannot stand in for a newcomer, including a leave/rejoin cycle.
 const signature=roster(room);
 if(!room.learning||room.learning.roster!==signature)room.learning={v:1,roster:signature,jobs:{},mode:'roles',step:0,seen:[],votes:{},mistakes:0};
 need(room.learning.v===1&&['roles','tutorial','quests'].includes(room.learning.mode),'invalid_learning');
 return room;
}
function changed(room,now){need(integer(room.revision)&&integer(room.revision+1),'revision_overflow');room.revision++;room.updatedAt=now;return room;}
function allLive(room){need(room.members.length>=2&&room.members.every(m=>m.connected),'need_connected_party');}
export function selectJob(raw,uid,jobId,now){
 const room=base(raw,uid,now),state=room.learning;
 need(state.mode==='roles','roles_locked');need(jobs.some(j=>j.id===jobId),'job_unknown');
 need(!Object.entries(state.jobs).some(([other,job])=>other!==uid&&job===jobId),'job_taken');
 if(state.jobs[uid]===jobId&&raw.learning?.roster===state.roster)return room;
 state.jobs={...state.jobs,[uid]:jobId};return changed(room,now);
}
export function beginTutorial(raw,uid,now){
 const room=base(raw,uid,now);need(uid===room.hostUid,'host_only');allLive(room);
 need(room.members.every(m=>jobs.some(j=>j.id===room.learning.jobs[m.uid])),'jobs_incomplete');
 need(new Set(Object.values(room.learning.jobs)).size===room.members.length,'job_taken');
 if(room.learning.mode!=='roles')return room;
 room.learning.mode='tutorial';return changed(room,now);
}
export function readTutorialClue(raw,uid,puzzleId,now){
 const room=base(raw,uid,now);allLive(room);const state=room.learning;
 need(state.mode==='tutorial'&&tutorials[state.step]?.id===puzzleId,'tutorial_changed');
 if(state.seen.includes(uid))return room;
 state.seen.push(uid);return changed(room,now);
}
export function voteTutorial(raw,uid,{puzzleId,choice},now){
 const room=base(raw,uid,now);allLive(room);const state=room.learning,puzzle=tutorials[state.step];
 need(state.mode==='tutorial'&&puzzle?.id===puzzleId,'tutorial_changed');
 need(puzzle.choices.some(c=>c.id===choice),'choice_unknown');
 need(room.members.every(m=>state.seen.includes(m.uid)),'team_has_not_read');
 if(state.votes[uid]===choice)return {room,advanced:false,needsDiscussion:false};
 // Each request can cast only the authenticated caller's own vote. Pending
 // choices are not projected to peers, so one leader cannot dictate by UI.
 state.votes={...state.votes,[uid]:choice};let advanced=false,needsDiscussion=false;
 if(room.members.every(m=>Object.hasOwn(state.votes,m.uid))){
  if(room.members.every(m=>state.votes[m.uid]===puzzle.answer)){
   state.step++;state.seen=[];state.votes={};advanced=true;
   if(state.step===tutorials.length){state.mode='quests';state.tutorialCompletedAt=now;}
  }else{state.votes={};state.mistakes++;needsDiscussion=true;}
 }
 return {room:changed(room,now),advanced,needsDiscussion};
}
export function learningView(raw,uid,now){
 const room=base(raw,uid,now),state=room.learning;
 const members=room.members.map(m=>({name:m.name,self:m.uid===uid,job:state.jobs[m.uid]||null,read:state.seen.includes(m.uid),voted:Object.hasOwn(state.votes,m.uid)}));
 return {version:guideVersion,mode:state.mode,step:state.step,members,jobs:jobs.map(j=>({...j,taken:members.some(m=>!m.self&&m.job===j.id)})),
  puzzle:state.mode==='tutorial'?puzzleView(tutorials[state.step],room.members,uid):null,
  ownVote:state.votes[uid]||null,canBegin:uid===room.hostUid&&room.members.length>=2&&room.members.every(m=>m.connected&&state.jobs[m.uid]),
  tutorialComplete:state.mode==='quests',mistakes:state.mistakes};
}
export function resetLearningForRoster(raw){
 const room=structuredClone(raw);delete room.learning;return room;
}
