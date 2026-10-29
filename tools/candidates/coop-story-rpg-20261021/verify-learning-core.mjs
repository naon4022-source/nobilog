import assert from 'node:assert/strict';
import {createParty,joinParty,leaveWaitingParty} from './party-core.mjs';
import {selectJob,beginTutorial,readTutorialClue,voteTutorial,learningView,resetLearningForRoster} from './learning-core.mjs';
import {tutorials,guide,puzzleView} from './learning-catalog.mjs';
import {newLevelProfile,awardRpgXp,levelView,xpAtLevel,requiredChapterLevel} from './level-core.mjs';
let checks=0;
const ok=(value)=>{assert.ok(value);checks++;};
const equal=(a,b)=>{assert.deepEqual(a,b);checks++;};
const throws=(fn,code)=>{assert.throws(fn,new RegExp('^Error: '+code+'$'));checks++;};
for(const count of [2,3]){
 let t=100,room=createParty({roomId:'learning_test',stageId:'story_01',host:{uid:'a',name:'検証A'},bossHp:160},t++);
 throws(()=>beginTutorial(room,'a',t++),'need_connected_party');
 for(const uid of ['b','c'].slice(0,count-1))room=joinParty(room,{uid,name:'検証'+uid},t++);
 throws(()=>beginTutorial(room,'b',t++),'host_only');
 throws(()=>beginTutorial(room,'a',t++),'jobs_incomplete');
 const before=JSON.stringify(room);room=selectJob(room,'a','pathfinder',t++);ok(JSON.stringify(room)!==before);
 throws(()=>selectJob(room,'b','pathfinder',t++),'job_taken');
 throws(()=>selectJob(room,'stranger','scribe',t++),'not_member');
 throws(()=>selectJob(room,'b','superadmin',t++),'job_unknown');
 room=selectJob(room,'b','scribe',t++);if(count===3)room=selectJob(room,'c','mediator',t++);
 room=beginTutorial(room,'a',t++);
 throws(()=>selectJob(room,'a','mediator',t++),'roles_locked');
 for(const [step,puzzle]of tutorials.entries()){
  const beforeStep=JSON.stringify(room);
  throws(()=>voteTutorial(room,'a',{puzzleId:puzzle.id,choice:puzzle.answer},t++),'team_has_not_read');
  equal(JSON.stringify(room),beforeStep);
  const views=room.members.map(m=>learningView(room,m.uid,t));
  equal(new Set(views.flatMap(v=>v.puzzle.clues)).size,puzzle.facts.length);
  ok(views.every(v=>v.puzzle.clues.length<puzzle.facts.length));
  ok(views.every(v=>!Object.hasOwn(v.puzzle,'answer')));
  for(const m of room.members)room=readTutorialClue(room,m.uid,puzzle.id,t++);
  throws(()=>voteTutorial(room,'a',{puzzleId:puzzle.id,choice:'fake'},t++),'choice_unknown');
  // One impatient correct voter cannot advance the whole party.
  let response=voteTutorial(room,'a',{puzzleId:puzzle.id,choice:puzzle.answer},t++);room=response.room;
  equal(response.advanced,false);equal(room.learning.step,step);
  const peer=learningView(room,'b',t);equal(peer.ownVote,null);ok(!JSON.stringify(peer).includes('"votes"'));
  // A dissenting final voter requires discussion; no automatic majority rule.
  for(const [i,m]of room.members.slice(1).entries()){
   const choice=i===count-2?puzzle.choices.find(c=>c.id!==puzzle.answer).id:puzzle.answer;
   response=voteTutorial(room,m.uid,{puzzleId:puzzle.id,choice},t++);room=response.room;
  }
  equal(response.needsDiscussion,true);equal(room.learning.step,step);equal(room.learning.votes,{});
  for(const m of room.members){response=voteTutorial(room,m.uid,{puzzleId:puzzle.id,choice:puzzle.answer},t++);room=response.room;}
  equal(response.advanced,true);equal(room.learning.step,step+1);
  throws(()=>readTutorialClue(room,'a',puzzle.id,t++),'tutorial_changed');
 }
 equal(learningView(room,'a',t).tutorialComplete,true);
 // A leave/rejoin must not inherit the prior roster's votes/tutorial.
 room=resetLearningForRoster(leaveWaitingParty(room,'b',t++));room=joinParty(room,{uid:'b',name:'検証B'},t++);
 equal(learningView(room,'a',t).mode,'roles');equal(learningView(room,'b',t).members.every(m=>m.job===null),true);
}
let profile=newLevelProfile('a');equal(levelView(profile,'a').level,1);
throws(()=>awardRpgXp(profile,'b',{id:'x',kind:'solo_correct',correct:true,day:'2026-10-22'}),'profile_owner');
throws(()=>awardRpgXp(profile,'a',{id:'x',kind:'solo_correct',correct:false,day:'2026-10-22'}),'invalid_reward');
throws(()=>awardRpgXp(profile,'a',{id:'x',kind:'solo_correct',correct:true,day:'2026-02-30'}),'invalid_reward');
for(let i=0;i<30;i++)profile=awardRpgXp(profile,'a',{id:'quiz_'+i,kind:'solo_correct',correct:true,day:'2026-10-22'}).profile;
equal(profile.xp,300);equal(levelView(profile,'a').level,3);
const replay=awardRpgXp(profile,'a',{id:'quiz_0',kind:'solo_correct',correct:true,day:'2026-10-22'});equal(replay.awarded,0);equal(replay.profile.revision,profile.revision);
throws(()=>awardRpgXp(profile,'a',{id:'quiz_30',kind:'solo_correct',correct:true,day:'2026-10-22'}),'solo_daily_limit');
throws(()=>awardRpgXp(profile,'a',{id:'old',kind:'solo_correct',correct:true,day:'2026-10-21'}),'stale_reward_day');
profile=awardRpgXp(profile,'a',{id:'quiz_nextday',kind:'solo_correct',correct:true,day:'2026-10-23'}).profile;equal(profile.soloCorrect,1);
profile=awardRpgXp(profile,'a',{id:'chapter_1',kind:'chapter_clear',chapter:1}).profile;
equal(awardRpgXp(profile,'a',{id:'chapter_1',kind:'chapter_clear',chapter:1}).profile.xp,410);
throws(()=>awardRpgXp(profile,'a',{id:'forged',kind:'chapter_clear',chapter:2}),'invalid_reward');
for(let level=1;level<=100;level++)equal(levelView({...profile,xp:xpAtLevel(level)},'a').level,level);
equal(Array.from({length:12},(_,i)=>requiredChapterLevel(i+1)),[1,1,2,2,3,3,4,4,5,5,6,6]);
ok(guide.at(-1).title==='12章と、その先');ok(guide.some(s=>s.text.includes('なおが全部知っている')));
equal(puzzleView(tutorials[0],[{uid:'a'},{uid:'b'}],'a').clues.length,2);
console.log('Cooperative learning core: '+checks+' checks passed; distinct jobs, 2/3-person private clues, unanimous own votes, discussion/retry, fresh roster, separate idempotent XP and daily limits. Persistence, onboarding UI, quests and main wiring remain unverified.');
