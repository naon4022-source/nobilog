// Prepared while full suite runs. Later run serially: in-memory SQLite only.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {initializeEquipment,readEquipment,purchaseEquipment,saveEquippedItem} from './equipment-store.mjs';
const require=createRequire(import.meta.url),{D1SQLite}=require('../../../.claude/verify/d1-sqlite.js');
const session={uid:'synthetic_a',owner:'owner_a'},other={uid:'synthetic_b',owner:'owner_b'};
const profile='coop-story-profile:'+session.uid;
const purchase=id=>'coop-story-purchase:'+session.uid+':'+id;
async function setup(){
 const db=new D1SQLite();db.seed('active-session:'+session.uid,session.owner,100000);db.seed('active-session:'+other.uid,other.owner,100000);
 await initializeEquipment(db,session,'female',100);
 db.seed('coop-story-clear:'+session.uid+':room1',JSON.stringify({stageId:'story_01'}));return db;
}
{
 const db=await setup();try{
  db.seed('coop-story-clear:'+session.uid+':room2',JSON.stringify({stageId:'story_01'}));
  assert.equal((await readEquipment(db,session,101)).view.coins,30);
  assert.equal(await readEquipment(db,other,101),null);
  const sword=await purchaseEquipment(db,session,{itemId:'practiceSword',operationId:'purchase1',availableCoins:9999},102);
  assert.equal(sword.view.coins,10);assert.equal(sword.view.damage,1);assert.equal(sword.committed,true);
  assert.equal((await saveEquippedItem(db,session,'practiceSword',103)).damage,3);
  const replay=await purchaseEquipment(db,session,{itemId:'practiceSword',operationId:'purchase1'},104);
  assert.equal(replay.replay,true);assert.equal(replay.view.coins,10);
  await assert.rejects(()=>purchaseEquipment(db,session,{itemId:'woodenStaff',operationId:'purchase1'},105),{message:'purchase_conflict'});
  await assert.rejects(()=>purchaseEquipment(db,session,{itemId:'woodenStaff',operationId:'purchase2',availableCoins:9999},105),{message:'insufficient_coins'});
  db.seed('coop-story-clear:'+session.uid+':room3',JSON.stringify({stageId:'story_02'}));
  const armor=await purchaseEquipment(db,session,{itemId:'travelArmor',operationId:'purchase2'},106);
  assert.equal(armor.view.coins,25);assert.equal((await saveEquippedItem(db,session,'travelArmor',107)).damage,4);
 }finally{db.close();}
}
{
 const db=await setup();try{
  const before=db.get(profile).v;db.failBatchAt=1;
  await assert.rejects(()=>purchaseEquipment(db,session,{itemId:'practiceSword',operationId:'rollback'},102),/Synthetic transaction failure/);
  assert.equal(db.get(profile).v,before);assert.equal(db.get(purchase('rollback')),null);
  db.failBatchAt=-1;assert.equal((await readEquipment(db,session,103)).view.coins,30);
 }finally{db.close();}
}
for(const race of ['different_items','same_item','same_operation','operation_conflict']){
 const db=await setup();try{
  const outer={itemId:'practiceSword',operationId:'outer'};
  const inner={itemId:race==='different_items'||race==='operation_conflict'?'woodenStaff':'practiceSword',operationId:race==='same_operation'||race==='operation_conflict'?'outer':'inner'};
  db.beforeBatch=async()=>{db.beforeBatch=null;await purchaseEquipment(db,session,inner,102);};
  if(race==='same_operation')assert.equal((await purchaseEquipment(db,session,outer,102)).replay,true);
  else await assert.rejects(()=>purchaseEquipment(db,session,outer,102),{message:race==='operation_conflict'?'purchase_conflict':'inventory_conflict'});
  const after=await readEquipment(db,session,103);assert.equal(after.view.coins,10);
  assert.equal(after.profile.owned.filter(id=>!['bare','none'].includes(id)).length,1);
  assert.equal(db.keys().filter(k=>k.startsWith('coop-story-purchase:')).length,1);
  if(race==='same_item'||race==='different_items')assert.equal(db.get(purchase('outer')),null,'losing CAS must not mint a phantom receipt');
 }finally{db.close();}
}
{
 const db=await setup();try{
  const before=db.get(profile).v;
  db.beforeBatch=()=>db.seed('active-session:'+session.uid,'new_owner',100000);
  await assert.rejects(()=>purchaseEquipment(db,session,{itemId:'practiceSword',operationId:'revoked'},102),{message:'active_session'});
  assert.equal(db.get(profile).v,before);assert.equal(db.get(purchase('revoked')),null);
 }finally{db.close();}
}
{
 const db=await setup();try{
  for(let n=2;n<=11;n++)db.seed('coop-story-clear:'+session.uid+':stage'+n,JSON.stringify({stageId:'story_'+String(n).padStart(2,'0')}));
  const path=['practiceSword','travelArmor','ironSword','guardianArmor','beaconBlade','vowArmor'];
  for(const [n,itemId] of path.entries())await purchaseEquipment(db,session,{itemId,operationId:'progression'+n},110+n);
  await saveEquippedItem(db,session,'beaconBlade',120);
  const end=await saveEquippedItem(db,session,'vowArmor',121);
  assert.equal(end.damage,13);assert.equal(end.coins,10);assert.equal(end.earnedCoins,330);
 }finally{db.close();}
}
console.log('Equipment store candidate: own wallet, once-per-stage grants, three gear tiers, purchase/equip, replay/conflict, atomic rollback, four concurrent races and revoked owner passed in-memory; live route/UI unverified.');
