// Synthetic reducer tests only. Full app / actual transport have separate gates.
import assert from 'node:assert/strict';
import {createParty,joinParty,readyParty} from './party-core.mjs';
import {startCountdown,syncBattlePresence,attackBattle,answerBattle,battleView,wantsOwnQuestion} from './battle-core.mjs';
const a='synthetic_a',b='synthetic_b',c='synthetic_c';
const digest='a'.repeat(64),otherDigest='b'.repeat(64);
const quiz=(uid=a,challengeId='wc_synthetic_challenge_01')=>({kind:'word',ownerUid:uid,challengeId,wordId:'apple',direction:'je',provenance:'owner_saved_correct_count',historicalDirection:null});
function lobby(hp=1000,three=false){
 let r=createParty({roomId:'synthetic_room',stageId:'story_01',host:{uid:a,name:'あ'},bossHp:hp},1000);
 r=joinParty(r,{uid:b,name:'い'},1000);
 if(three)r=joinParty(r,{uid:c,name:'う'},1000);
 for(const m of r.members)r=readyParty(r,m.uid,true,1000);
 return r;
}
const tap=(room,uid=a,extra={},time=4000)=>attackBattle(room,uid,{sequence:room.members.find(m=>m.uid===uid).lastSequence+1},{damage:1,...extra},time);
const judge=(room,correct,sequence=1,hash=digest,time=4000)=>answerBattle(room,a,{challengeId:'wc_synthetic_challenge_01',sequence},{answerDigest:hash,grade:{correct}},time);
let r=startCountdown(lobby(),a,1000);
assert.equal(r.rpg.combatOpensAt,4000);
assert.equal(startCountdown(r,a,2000).rpg.combatOpensAt,4000);
assert.equal(battleView(r,a,2000,()=>null).phase,'countdown');
assert.throws(()=>tap(r,a,{},3999),/countdown/);
assert.throws(()=>startCountdown(lobby(),b,1000),/host_only/);
let solo=createParty({roomId:'solo',stageId:'story_01',host:{uid:a,name:'あ'},bossHp:10},1000);
solo=readyParty(solo,a,true,1000);
assert.throws(()=>startCountdown(solo,a,1000),/need_ready_party/);
const before=structuredClone(r);
assert.throws(()=>tap(r,a,{quizCandidate:quiz()}),/quiz_not_due/);
assert.deepEqual(r,before);
for(let i=0;i<11;i++)r=tap(r).room;
assert.equal(wantsOwnQuestion(r,a),true);
const revision=r.revision;
const hit=tap(r,a,{quizCandidate:quiz()});r=hit.room;
assert.equal(r.revision,revision+1);assert.equal(r.members[0].lastSequence,12);
assert.equal(r.rpg.players[a].question.direction,'je');assert.equal(r.rpg.players[a].question.historicalDirection,null);
assert.throws(()=>tap(r),/own_question_pending/);
const own=battleView(r,a,4000,q=>({challengeId:q.challengeId,prompt:'りんご'}));
assert.equal(own.own.question.prompt,'りんご');
assert.equal(own.members[0].questionPending,true);
const peer=battleView(r,b,4000,()=>{throw Error('must_not_project_peer_question');});
assert.equal(peer.own.question,null);
for(const secret of [a,b,'apple','りんご','ownerUid','answerDigest'])assert.equal(JSON.stringify(peer).includes(secret),false,secret);
const replay=attackBattle(r,a,{sequence:12},{damage:999},4000);
assert.equal(replay.replay,true);assert.deepEqual(replay.room,r);
let ans=judge(r,false);r=ans.room;
assert.equal(r.rpg.players[a].question.challengeId,quiz().challengeId);
assert.equal(judge(r,false).replay,true);
assert.throws(()=>judge(r,false,1,otherDigest),/answer_conflict/);
assert.throws(()=>judge(r,true,3),/answer_sequence_gap/);
ans=judge(r,true,2);r=ans.room;
assert.equal(r.rpg.players[a].question,null);
assert.equal(r.rpg.players[a].answerSequence,2);
assert.equal(judge(r,true,2).replay,true);
assert.equal(tap(r).room.hp,r.hp-1);

// Three players may continue as two, pause at one and resume without losing quiz.
let three=startCountdown(lobby(1000,true),a,1000);
for(let i=0;i<12;i++)three=tap(three,a,i===11?{quizCandidate:quiz()}:{}).room;
let presence=syncBattlePresence(three,a,new Set([a,b]),4001);
assert.equal(presence.phase,'battle');assert.equal(presence.revision,three.revision+1);
assert.equal(tap(presence,b,{},4001).room.hp,presence.hp-1);
let paused=syncBattlePresence(presence,a,new Set([a]),4002);
assert.equal(paused.phase,'paused');
assert.throws(()=>tap(paused,a,{},4002),/need_connected_party/);
assert.throws(()=>judge(paused,true,1,digest,4002),/need_connected_party/);
let resumed=syncBattlePresence(paused,a,new Set([a,b]),5000);
assert.equal(resumed.phase,'battle');assert.equal(resumed.rpg.players[a].question.wordId,'apple');
assert.equal(resumed.rpg.combatOpensAt,4000);
const bothGone=syncBattlePresence(three,a,new Set(),4001);
assert.equal(bothGone.revision,three.revision+1);assert.equal(bothGone.phase,'paused');

// Questions cannot be skipped by a killing tap, even when the boss was at 1 HP.
let edge=startCountdown(lobby(12),a,1000);
for(let i=0;i<11;i++)edge=tap(edge).room;
assert.equal(edge.hp,1);
edge=tap(edge,a,{damage:13,quizCandidate:quiz()}).room;
assert.equal(edge.hp,1);assert.equal(edge.phase,'battle');
assert.equal(edge.members[0].lastSequence,12);
assert.throws(()=>tap(edge,b),/learning_pending/);
edge=judge(edge,true).room;
const clear=tap(edge,b);edge=clear.room;
assert.equal(edge.phase,'cleared');assert.equal(clear.clearEffect.presentMembers.length,2);
assert.equal(attackBattle(edge,b,{sequence:1},{damage:1},4000).replay,true);
assert.equal(battleView(edge,a,4000,()=>null).clear.companions[0],'い');
assert.equal(battleView(edge,a,4000,()=>null).clear.selfPresentAtClear,true);

let away=startCountdown(lobby(1,true),a,1000);
away=syncBattlePresence(away,a,new Set([a,b]),4000);
away=tap(away).room;
assert.equal(battleView(away,c,4000,()=>null).clear.selfPresentAtClear,false);

// If no own previously-correct question exists, report unavailable; do not invent one.
let noQuiz=startCountdown(lobby(),a,1000);
for(let i=0;i<11;i++)noQuiz=tap(noQuiz).room;
const absent=tap(noQuiz);assert.equal(absent.quizUnavailable,true);assert.equal(absent.room.rpg.players[a].question,null);
assert.throws(()=>tap(noQuiz,a,{quizCandidate:quiz(b)}),/invalid_quiz_owner/);
assert.throws(()=>tap(noQuiz,a,{quizCandidate:{...quiz(),answer:'apple'}}),/invalid_quiz_fields/);
assert.throws(()=>tap(noQuiz,a,{quizCandidate:{...quiz(),wordId:undefined}}),/invalid_word_quiz/);

let fast=startCountdown(lobby(),a,1000);
for(let i=0;i<20;i++)fast=tap(fast).room;
assert.throws(()=>tap(fast),/tap_rate/);
assert.equal(tap(fast,a,{},5000).room.members[0].lastSequence,21);
assert.throws(()=>attackBattle(fast,a,{sequence:22},{damage:1},5000),/sequence_gap/);
assert.throws(()=>tap(fast,a,{damage:0},5000),/invalid_damage/);
console.log('Battle reducer: countdown, two/three learners, presence pause/resume, private quiz locks, 1-HP gate, replay/conflict and server rate passed; API/store/UI still unverified.');
