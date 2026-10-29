// Run after the existing full suite exits. Synthetic state only; no network/DB.
import assert from 'node:assert/strict';
import {createParty,joinParty,readyParty,startParty,setConnection,leaveWaitingParty,attackParty,partyView} from './party-core.mjs';
let checks=0;
const ok=(value)=>{assert.ok(value);checks++;};
const eq=(value,expected)=>{assert.deepEqual(value,expected);checks++;};
const fails=(fn,code)=>{assert.throws(fn,{message:code});checks++;};
const a={uid:'synthetic_a',name:'参加者A'},b={uid:'synthetic_b',name:'参加者B'},c={uid:'synthetic_c',name:'参加者C'},d={uid:'synthetic_d',name:'参加者D'};
const create=()=>createParty({roomId:'synthetic_room',stageId:'story_01',host:a,bossHp:100},100);
function battle(count=2){let r=create();r=joinParty(r,b,101);if(count===3)r=joinParty(r,c,102);for(const p of r.members)r=readyParty(r,p.uid,true,103);return startParty(r,a.uid,104);}
const initial=create();
eq(initial.members.length,1);
fails(()=>readyParty(initial,d.uid,true,101),'not_member');
fails(()=>startParty(readyParty(initial,a.uid,true,101),a.uid,102),'need_ready_party');
fails(()=>joinParty(initial,{uid:'invalid id',name:'X'},101),'invalid_id');
fails(()=>joinParty(initial,{uid:'valid',name:'\u202eX'},101),'invalid_name');
fails(()=>joinParty(initial,b,99),'invalid_server_time');
let waiting=joinParty(initial,b,101);
eq(initial.members.length,1); // Pure transition leaves input untouched.
eq(joinParty(waiting,b,102),waiting);
waiting=readyParty(waiting,a.uid,true,103);
waiting=joinParty(waiting,c,104);
ok(waiting.members.every(p=>!p.ready));
fails(()=>joinParty(waiting,d,105),'party_full');
fails(()=>startParty(waiting,b.uid,105),'host_only');
fails(()=>startParty(waiting,a.uid,105),'need_ready_party');
const left=leaveWaitingParty(waiting,c.uid,105);
eq(left.members.length,2);ok(left.members.every(p=>!p.ready));
fails(()=>leaveWaitingParty(waiting,a.uid,105),'host_must_cancel_room');
for(const count of [2,3]){
 let r=battle(count);
 eq(r.phase,'battle');eq(r.members.length,count);
 eq(startParty(r,a.uid,105),r); // Does not restart shared battle.
 fails(()=>joinParty(r,d,105),'roster_locked');
 fails(()=>leaveWaitingParty(r,b.uid,105),'roster_locked');
 fails(()=>attackParty(r,d.uid,{sequence:1},{damage:1,quizLocked:false},105),'not_member');
 fails(()=>attackParty(r,a.uid,{sequence:2},{damage:1,quizLocked:false},105),'sequence_gap');
 fails(()=>attackParty(r,a.uid,{sequence:1},{damage:1,quizLocked:true},105),'attack_not_allowed');
 fails(()=>attackParty(r,a.uid,{sequence:1},{damage:0,quizLocked:false},105),'attack_not_allowed');
 fails(()=>attackParty(r,a.uid,{sequence:1},{damage:Infinity,quizLocked:false},105),'attack_not_allowed');
 fails(()=>attackParty(r,a.uid,{sequence:1},{damage:1},105),'attack_not_allowed');
 const hit=attackParty(r,a.uid,{sequence:1},{damage:30,quizLocked:false},105);
 eq(r.hp,100);r=hit.room;eq(r.hp,70);eq(hit.clearEffect,null);
 eq(attackParty(r,a.uid,{sequence:1},{damage:30,quizLocked:false},106).room.hp,70);
 let disconnected=setConnection(r,b.uid,false,107);
 eq(disconnected.phase,count===2?'paused':'battle');
 fails(()=>attackParty(disconnected,b.uid,{sequence:1},{damage:30,quizLocked:false},108),'need_connected_party');
 if(count===3)disconnected=setConnection(disconnected,c.uid,false,108);
 eq(disconnected.phase,'paused');
 fails(()=>attackParty(disconnected,a.uid,{sequence:2},{damage:30,quizLocked:false},109),'need_connected_party');
 eq(disconnected.hp,70);
 r=setConnection(disconnected,b.uid,true,110);eq(r.phase,'battle');eq(r.members[0].lastSequence,1);
 r=attackParty(r,b.uid,{sequence:1},{damage:30,quizLocked:false},111).room;
 const kill=attackParty(r,a.uid,{sequence:2},{damage:40,quizLocked:false},112);r=kill.room;
 eq(r.phase,'cleared');eq(r.hp,0);eq(kill.clearEffect.stageId,'story_01');eq(kill.clearEffect.at,112);
 eq(kill.clearEffect.contributors.map(p=>p.uid),[a.uid,b.uid]);
 eq(kill.clearEffect.presentMembers.map(p=>p.uid),[a.uid,b.uid]);
 eq(kill.clearEffect.startedMembers.length,count);
 const replay=attackParty(r,a.uid,{sequence:2},{damage:40,quizLocked:false},113);
 eq(replay.replay,true);eq(replay.clearEffect,null);eq(replay.room,r);
 fails(()=>attackParty(r,b.uid,{sequence:2},{damage:40,quizLocked:false},114),'not_live');
 const view=partyView(r,a.uid);
 eq(view.clear.companions,['参加者B']);eq(view.hp,0);
 ok(!JSON.stringify(view).includes('synthetic_a'));ok(!JSON.stringify(view).includes('synthetic_b'));
 fails(()=>partyView(r,d.uid),'not_member');
 const tampered=structuredClone(r);tampered.clear.presentMembers=[];
 fails(()=>partyView(tampered,a.uid),'invalid_clear_members');
 const duplicate=structuredClone(r);duplicate.members.push(duplicate.members[0]);
 fails(()=>partyView(duplicate,a.uid),'invalid_roster');
}
{
 const r=battle(3);
 const killed=attackParty(r,a.uid,{sequence:1},{damage:100,quizLocked:false},105).room;
 eq(partyView(killed,a.uid).clear.companions,['参加者B','参加者C']);
 eq(partyView(killed,b.uid).clear.companions,['参加者A','参加者C']);
 eq(killed.clear.contributors.map(p=>p.uid),[a.uid]);
 eq(killed.clear.presentMembers.length,3);
}
console.log(`Coop party candidate: ${checks} synthetic checks passed; transport, storage, eligibility, equipment, story and UI remain unverified.`);
