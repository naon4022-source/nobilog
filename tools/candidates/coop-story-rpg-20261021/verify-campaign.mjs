// Entire authored campaign through the real route and SQLite. All identities,
// saved correct attempts and word counts are synthetic; no live API is called.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import bank from '../../../cf-worker/src/material-bank.mjs';
import engine from '../../../cf-worker/src/material-engine.cjs';
import story from './story-catalog.mjs';
import {createCoopRouter} from './route.mjs';
const {D1SQLite}=createRequire(import.meta.url)('../../../.claude/verify/d1-sqlite.js');
assert.equal(spawnSync('pgrep',['-f','^(/[^ ]*/)?bash .*\\.claude/verify/run.sh$']).status,1,'no whole-suite overlap');
const subjects=['国語','数学','英語','理科','社会'];
const seeds=subjects.map(subject=>{
 for(const unit of bank.units.filter(u=>u.status==='ready'&&u.subject===subject&&engine.validateUnit(u,{sources:bank.sources}).length===0)){
  for(const question of unit.questions){
   if(question.type==='reading')continue;
   const answers=[question.answer?.value,...(question.answer?.accepted||[])];
   for(const answer of answers)if(['string','number'].includes(typeof answer)&&engine.grade(question,String(answer)).correct)return {unit,question,answer:String(answer)};
  }
 }
 throw Error('No independently gradeable fixture question for '+subject);
});
const seedByPrompt=new Map(seeds.map(x=>[x.question.prompt,x]));
for(const size of [2,3]){
 const db=new D1SQLite(),people=Array.from({length:size},(_,i)=>({uid:'campaign_'+i,owner:'synthetic_owner_'+i,name:'検証の旅人'+i}));
 let now=1000,ids=0,random=0,totalTaps=0,totalAnswers=0,wrongAnswers=0;
 const seenSubjects=new Set();
 for(const who of people){
  db.seed('active-session:'+who.uid,who.owner,1000000000);
  for(const [i,item] of seeds.entries())db.seed('material-attempt:'+who.uid+':fixture_'+i,JSON.stringify({unitId:item.unit.id,questionId:item.question.id,mode:'study',result:{correct:true}}),0);
 }
 const originalAttempts=JSON.stringify(db.keys().filter(k=>k.startsWith('material-attempt:')).sort().map(k=>[k,db.get(k)]));
 const route=createCoopRouter({db,engine,bank,wordBank:{grades:[{id:'5',words:[{id:'apple',w:'apple',ja:['りんご']}]}]},clock:()=>now,authorize:async()=>true,checkOrigin:r=>r.headers.get('Origin')==='https://synthetic.invalid',displayName:s=>s.name,randomUint32:()=>random++,makeId:()=> 'campaign_challenge_'+String(++ids).padStart(12,'0'),loadOwnWords:async s=>({ownerUid:s.uid,snapshot:{v:1,words:{apple:{c:1}}}}),notify:async()=>{}});
 const getActions=new Set(['state','resume','progress','history','profile','pending','join-status','story']);
 async function call(who,action,data={},expected=200){
  const get=getActions.has(action)&&!(action==='profile'&&Object.hasOwn(data,'body'));
  const url=new URL('https://synthetic.invalid/coop-story/'+action);if(get)for(const [key,value]of Object.entries(data))url.searchParams.set(key,value);
  const request=new Request(url,{method:get?'GET':'POST',headers:{Origin:'https://synthetic.invalid','Content-Type':'application/json'},...(get?{}:{body:JSON.stringify(data)})});
  const response=await route(request,who,{owner:who.owner,json:(value,status=200)=>Response.json(value,{status}),requestJson:r=>r.json()});
  const result=await response.json();assert.ok((Array.isArray(expected)?expected:[expected]).includes(response.status),action+': status '+response.status+' '+JSON.stringify(result));return result;
 }
 try{
  for(const [i,who]of people.entries())await call(who,'profile',{body:i%2?'female':'male'});
  // Cannot skip directly to the final chapter.
  await call(people[0],'create',{roomId:'locked_room',stageId:'story_12',inviteCode:'ZZZZZZZZ'},409);
  for(const stage of story.stages){
   const roomId='campaign_room_'+size+'_'+stage.number,inviteCode='AAAAAAA'+String.fromCharCode(65+stage.number-1);
   await call(people[0],'create',{roomId,stageId:stage.id,inviteCode});
   for(const [i,who]of people.entries())if(i){const requestId='join_'+stage.number+'_'+i;await call(who,'join-request',{inviteCode,requestId,consent:true});await call(people[0],'approve',{roomId,requestId});}
   for(const who of people){await call(who,'heartbeat',{roomId,connectionId:'campaign_connection'});await call(who,'ready',{roomId,ready:true});}
   for(const who of people)assert.equal((await call(who,'resume')).roomId,roomId);
   await call(people[0],'start',{roomId});now+=3000;
   let finished=false;
   for(let round=0;round<2000&&!finished;round++){
    now+=50;
    if(round%20===0)for(const who of people)await call(who,'heartbeat',{roomId,connectionId:'campaign_connection'});
    for(const who of people){
     const current=await call(who,'state',{roomId});if(current.state.phase==='cleared'){finished=true;break;}
     const question=current.state.own.question;
     if(question){
      seenSubjects.add(question.subject);
      const correct=question.kind==='word'?(question.direction==='ej'?'りんご':'apple'):seedByPrompt.get(question.prompt)?.answer;
      assert.equal(typeof correct,'string','question must be from the current owned eligible bank');
      if(wrongAnswers===0){
       const result=await call(who,'answer',{roomId,challengeId:question.challengeId,sequence:current.state.own.nextAnswerSequence,answer:'synthetic_incorrect'});assert.equal(result.result.correct,false);wrongAnswers++;
       const retry=await call(who,'state',{roomId});assert.equal(retry.state.own.question.challengeId,question.challengeId);
       await call(who,'answer',{roomId,challengeId:question.challengeId,sequence:retry.state.own.nextAnswerSequence,answer:correct});
      }else await call(who,'answer',{roomId,challengeId:question.challengeId,sequence:current.state.own.nextAnswerSequence,answer:correct});
      totalAnswers++;
     }else{
      // At the final HP, another member's outstanding question pauses damage.
      const waitingOnPeer=current.state.hp===1&&current.state.members.some(m=>!m.self&&m.questionPending);
      const result=await call(who,'tap',{roomId,sequence:current.state.own.lastSequence+1},waitingOnPeer?[200,409]:200);
      if(result.error)assert.equal(result.error,'learning_pending');
      // A due private question can open at HP=1, but must not finish the boss
      // while a companion still has an unanswered question.
      if(waitingOnPeer&&result.state)assert.equal(result.state.hp,1);
      if(!result.error)totalTaps++;
      if(result.state?.phase==='cleared'){finished=true;break;}
     }
    }
   }
   assert.equal(finished,true,'all chapters must be clearable: '+stage.id);
   for(const who of people)assert.deepEqual(await call(who,'resume'),{roomId:null},'completed rooms do not trap recovery');
   for(const [i,who]of people.entries()){
    const history=(await call(who,'history')).items;assert.equal(history.length,stage.number);
    assert.equal((await call(who,'progress')).completedStageIds.length,stage.number);
    const receipt=history.find(x=>x.stageId===stage.id);assert.deepEqual(new Set(receipt.companions),new Set(people.filter(p=>p!==who).map(p=>p.name)));
    // Upgrade through normal server-authorized purchases, using earned coins.
    for(const itemId of ['practiceSword','travelArmor','ironSword','guardianArmor','beaconBlade','vowArmor']){
     const profile=await call(who,'profile'),item=profile.shop.find(x=>x.id===itemId);
     if(!profile.profile.owned.some(x=>x.id===itemId)&&profile.profile.coins>=item.price){await call(who,'purchase',{itemId,operationId:'purchase_'+stage.number+'_'+i+'_'+itemId});await call(who,'equip',{itemId});}
    }
   }
  }
  assert.equal(seenSubjects.size,5,'entire campaign exercises all five real subject graders');
  assert.equal(JSON.stringify(db.keys().filter(k=>k.startsWith('material-attempt:')).sort().map(k=>[k,db.get(k)])),originalAttempts,'ordinary learning attempts are unchanged');
  assert.equal(db.keys().filter(k=>k.startsWith('coop-story-clear:')).length,12*size);
  console.log(JSON.stringify({campaign:'passed',players:size,chapters:12,subjects:[...seenSubjects],totalTaps,totalAnswers,wrongAnswers,ordinaryRecordsUnchanged:true}));
 }finally{db.close();}
}
