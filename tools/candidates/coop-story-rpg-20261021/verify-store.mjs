// Real in-memory SQLite, synthetic sessions only. No Cloudflare or user DB.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createParty,joinParty,readyParty,startParty,attackParty} from './party-core.mjs';
import {readOwnParty,commitParty,ownClearHistory} from './party-store.mjs';
const require=createRequire(import.meta.url);
const {D1SQLite}=require('../../../.claude/verify/d1-sqlite.js');
const a={uid:'synthetic_a',name:'A'},b={uid:'synthetic_b',name:'B'},outsider={uid:'synthetic_c',owner:'owner_c'};
const session={uid:a.uid,owner:'owner_a'},sessionB={uid:b.uid,owner:'owner_b'};
const key='coop-story-room:synthetic_room';
function setup(count=2){
 const db=new D1SQLite();
 for(const s of [session,sessionB,outsider])db.seed('active-session:'+s.uid,s.owner,1000000);
 let r=createParty({roomId:'synthetic_room',stageId:'story_01',host:a,bossHp:10},100);
 r=joinParty(r,b,101);
 if(count===3)r=joinParty(r,{uid:outsider.uid,name:'C'},102);
 r=readyParty(r,a.uid,true,102);r=readyParty(r,b.uid,true,103);
 if(count===3)r=readyParty(r,outsider.uid,true,103);
 r=startParty(r,a.uid,104);
 db.seed(key,JSON.stringify(r));return {db,r};
}
{
 const {db,r}=setup();try{
  assert.equal(await readOwnParty(db,r.id,outsider,105),null);
  const previous=await readOwnParty(db,r.id,session,105);
  const killed=attackParty(r,a.uid,{sequence:1},{damage:10,quizLocked:false},106).room;
  assert.equal((await commitParty(db,previous,killed,session,106)).committed,true);
  assert.equal(JSON.parse(db.get(key).v).phase,'cleared');
  const ah=await ownClearHistory(db,session,107),bh=await ownClearHistory(db,sessionB,107);
  assert.deepEqual(ah[0].companions,['B']);assert.deepEqual(bh[0].companions,['A']);
  assert.ok(!JSON.stringify(ah).includes('synthetic_b'));
  assert.deepEqual(await ownClearHistory(db,outsider,107),[]);
  assert.equal((await commitParty(db,previous,killed,session,106)).committed,false);
  assert.equal((await ownClearHistory(db,session,108)).length,1);
  assert.equal((await ownClearHistory(db,sessionB,108)).length,1);
 }finally{db.close();}
}
{
 const {db,r}=setup();try{
  const before=await readOwnParty(db,r.id,session,105);
  const killed=attackParty(r,a.uid,{sequence:1},{damage:10,quizLocked:false},106).room;
  db.failBatchAt=1;
  await assert.rejects(()=>commitParty(db,before,killed,session,106),/Synthetic transaction failure/);
  assert.equal(db.get(key).v,before.raw);
  assert.deepEqual(await ownClearHistory(db,session,107),[]);
  db.failBatchAt=-1;
  assert.equal((await commitParty(db,before,killed,session,106)).committed,true);
 }finally{db.close();}
}
{
 const {db,r}=setup();try{
  const before=await readOwnParty(db,r.id,session,105);
  const killed=attackParty(r,a.uid,{sequence:1},{damage:10,quizLocked:false},106).room;
  db.beforeBatch=()=>db.seed('active-session:'+a.uid,'replacement_owner',1000000);
  assert.equal((await commitParty(db,before,killed,session,106)).committed,false);
  assert.equal(JSON.parse(db.get(key).v).phase,'battle');
  assert.deepEqual(db.keys().filter(k=>k.startsWith('coop-story-clear:')),[]);
  assert.equal(await readOwnParty(db,r.id,session,107),null);
 }finally{db.close();}
}
{
 const {db,r}=setup();try{
  const before=await readOwnParty(db,r.id,session,105);
  const slow=attackParty(r,a.uid,{sequence:1},{damage:1,quizLocked:false},106).room;
  const winner=attackParty(r,b.uid,{sequence:1},{damage:10,quizLocked:false},106).room;
  const bBefore=await readOwnParty(db,r.id,sessionB,105);
  assert.equal((await commitParty(db,bBefore,winner,sessionB,106)).committed,true);
  assert.equal((await commitParty(db,before,slow,session,106)).committed,false);
  assert.equal(JSON.parse(db.get(key).v).hp,0);
  assert.equal((await ownClearHistory(db,session,107)).length,1);
 }finally{db.close();}
}
{
 const {db,r}=setup(3);try{
  const before=await readOwnParty(db,r.id,session,105);
  const killed=attackParty(r,a.uid,{sequence:1},{damage:10,quizLocked:false},106).room;
  assert.equal((await commitParty(db,before,killed,session,106)).committed,true);
  assert.deepEqual((await ownClearHistory(db,session,107))[0].companions,['B','C']);
  assert.deepEqual((await ownClearHistory(db,sessionB,107))[0].companions,['A','C']);
  assert.deepEqual((await ownClearHistory(db,outsider,107))[0].companions,['A','B']);
 }finally{db.close();}
}
console.log('Coop store candidate: 2/3-person clear history, atomic rollback, stale owner, member isolation and competing CAS checks passed in memory; live routes and transport remain unverified.');
