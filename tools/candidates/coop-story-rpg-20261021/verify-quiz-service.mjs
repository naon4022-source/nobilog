import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import bank from '../../../cf-worker/src/material-bank.mjs';
import engine from '../../../cf-worker/src/material-engine.cjs';
import {readEligibleMaterials,createQuizService} from './quiz-service.mjs';
const require=createRequire(import.meta.url),{D1SQLite}=require('../../../.claude/verify/d1-sqlite.js');
const db=new D1SQLite(),s={uid:'synthetic_a',owner:'owner_a'},peer={uid:'synthetic_b',owner:'owner_b'};
const subjects=['国語','数学','英語','理科','社会'];
const units=subjects.map(subject=>bank.units.find(u=>u.status==='ready'&&u.subject===subject&&u.questions.some(q=>q.type!=='reading')&&engine.validateUnit(u,{sources:bank.sources}).length===0));
assert.ok(units.every(Boolean));
for(const who of [s,peer])db.seed('active-session:'+who.uid,who.owner,100000);
const records=units.map((u,i)=>({unitId:u.id,questionId:u.questions.find(q=>q.type!=='reading').id,mode:'study',result:{correct:true}}));
for(let i=0;i<records.length;i++)db.seed('material-attempt:'+s.uid+':record-'+i,JSON.stringify(records[i]),0);
db.seed('material-attempt:'+s.uid+':wrong',JSON.stringify({...records[0],questionId:'not_eligible',result:{correct:false}}),0);
db.seed('material-attempt:'+peer.uid+':peer',JSON.stringify({...records[0],questionId:'peer_only'}),0);
const wordBank={grades:[{id:'5',words:[{id:'apple',w:'apple',ja:['りんご']},{id:'book',w:'book',ja:['本']}]}]};
const snapshots=new Map([[s.uid,{v:1,words:{apple:{c:1},book:{c:0}}}],[peer.uid,{v:1,words:{book:{c:1}}}]]);
const config={db,bank,engine,wordBank,loadOwnWords:async session=>({ownerUid:session.uid,snapshot:snapshots.get(session.uid)}),makeId:()=> 'synthetic_challenge_0001'};
try{
 const countBefore=db.keys().length;
 const eligible=await readEligibleMaterials(db,s,units,1000);
 assert.equal(eligible.length,5);assert.deepEqual(new Set(eligible.map(x=>x.subject)),new Set(subjects));
 assert.equal(eligible.some(x=>x.questionId==='peer_only'),false);
 const available=[...new Set(eligible.map(x=>x.subject))];
 for(let i=0;i<available.length;i++){
  const values=[i,0],service=createQuizService({...config,randomUint32:()=>values.shift()});
  const q=await service.choose(s,1000);assert.equal(q.kind,'material');
  const view=await service.project(s,q,1000);
  const unit=units.find(u=>u.id===q.unitId),original=unit.questions.find(x=>x.id===q.questionId);
  assert.equal(view.subject,available[i]);assert.equal(view.prompt,original.prompt);
  assert.deepEqual(Object.keys(view).sort(),['challengeId','kind','prompt','subject']);
  for(const answer of ['fixture_wrong','',String(original.answer.value??'0')]){
   const result=await service.grade(s,q,answer,1000);
   assert.equal(result.correct,engine.grade(original,answer).correct);
  }
  await assert.rejects(()=>service.project(peer,q,1000),/quiz_owner/);
  await assert.rejects(()=>service.grade(peer,q,'x',1000),/quiz_owner/);
 }
 const values=[available.indexOf('英語'),1,1];
 const service=createQuizService({...config,randomUint32:()=>values.shift()});
 const word=await service.choose(s,1000);
 assert.equal(word.kind,'word');assert.equal(word.wordId,'apple');assert.equal(word.direction,'je');
 assert.equal((await service.project(s,word,1000)).prompt,'りんご');
 assert.equal((await service.grade(s,word,'apple',1000)).correct,true);
 assert.equal((await service.grade(s,word,'book',1000)).correct,false);
 assert.equal(db.keys().length,countBefore,'quiz reads/grades create no ordinary attempts or rewards');
 snapshots.set(s.uid,{v:1,words:{}});
 await assert.rejects(()=>service.project(s,word,1000),/word_not_eligible/);
 const wrongOwner=createQuizService({...config,loadOwnWords:async()=>({ownerUid:peer.uid,snapshot:snapshots.get(peer.uid)})});
 await assert.rejects(()=>wrongOwner.choose(s,1000),/pool_owner/);
 const revoked=createQuizService({...config,loadOwnWords:async session=>{db.seed('active-session:'+session.uid,'replaced',100000);return {ownerUid:session.uid,snapshot:{v:1,words:{apple:{c:1}}}};}});
 await assert.rejects(()=>revoked.choose(s,1000),/active_session/);
 await assert.rejects(()=>readEligibleMaterials(db,s,units,1000),/active_session/);
}finally{db.close();}
console.log('Quiz service: actual five-subject banks/graders, owner-only immutable correct records, word direction choice, hidden grading fields, no ordinary writes and session revocation passed; saved-snapshot runtime adapter unverified.');
