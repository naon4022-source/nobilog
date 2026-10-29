// Isolated candidate. D1 uses only server-owned RPG namespaces, with active
// session checks in the same SQL statement. No normal grades/economy balances.
import {createProfile,profileView,buyEquipment,equipItem,equipment} from './equipment.mjs';
import story from './story-catalog.mjs';
const active='EXISTS (SELECT 1 FROM auth_kv WHERE k=? AND v=? AND expires_at>?)';
const stageIds=new Set(story.stages.map(s=>s.id));
const rewardPerStage=30; // Candidate balancing, not a real-money award.
function identifier(x){if(typeof x!=='string'||!/^[A-Za-z0-9_-]{1,80}$/.test(x))throw Error('invalid_id');return x;}
function guard(session,now){identifier(session.uid);if(typeof session.owner!=='string'||!session.owner||!Number.isSafeInteger(now)||now<0)throw Error('session_guard');return ['active-session:'+session.uid,session.owner,now];}
const profileKey=uid=>'coop-story-profile:'+identifier(uid);
const purchaseKey=(uid,id)=>'coop-story-purchase:'+identifier(uid)+':'+identifier(id);
function ownedCost(profile){return profile.owned.reduce((sum,id)=>sum+equipment[id].price,0);}

async function earnedCoins(db,session,now){
 const prefix='coop-story-clear:'+session.uid+':';
 const rows=(await db.prepare("SELECT DISTINCT json_extract(v,'$.stageId') stageId FROM auth_kv WHERE k>=? AND k<? AND "+active).bind(prefix,prefix+'\uffff',...guard(session,now)).all()).results||[];
 // Repeated room clears remain in history but cannot mint the same stage award.
 return new Set(rows.map(r=>r.stageId).filter(id=>stageIds.has(id))).size*rewardPerStage;
}
export async function readEquipment(db,session,now){
 const row=await db.prepare('SELECT v FROM auth_kv WHERE k=? AND '+active).bind(profileKey(session.uid),...guard(session,now)).first('v');
 if(!row)return null;
 const profile=JSON.parse(row),view=profileView(profile,session.uid),earned=await earnedCoins(db,session,now);
 const lease=await db.prepare('SELECT v FROM auth_kv WHERE k=? AND v=? AND expires_at>?').bind(...guard(session,now)).first('v');
 if(!lease)throw Error('active_session');
 const spent=ownedCost(profile);if(spent>earned)throw Error('inventory_balance');
 return {raw:row,profile,view:{...view,coins:earned-spent,earnedCoins:earned}};
}
export async function initializeEquipment(db,session,body,now){
 const p=createProfile(session.uid,body);
 await db.prepare('INSERT INTO auth_kv(k,v,expires_at) SELECT ?,?,0 WHERE '+active+' ON CONFLICT(k) DO NOTHING').bind(profileKey(session.uid),JSON.stringify(p),...guard(session,now)).run();
 const saved=await readEquipment(db,session,now);if(!saved)throw Error('active_session');
 if(saved.profile.body!==body)throw Error('profile_exists');
 return saved.view;
}
export async function purchaseEquipment(db,session,{itemId,operationId},now){
 identifier(itemId);
 const operation=purchaseKey(session.uid,operationId),g=guard(session,now);
 const replay=await db.prepare('SELECT v FROM auth_kv WHERE k=? AND '+active).bind(operation,...g).first('v');
 if(replay){
  const saved=JSON.parse(replay);if(saved.itemId!==itemId)throw Error('purchase_conflict');
  const state=await readEquipment(db,session,now);if(!state)throw Error('active_session');
  return {committed:false,replay:true,view:state.view};
 }
 const before=await readEquipment(db,session,now);if(!before)throw Error('profile_missing');
 const result=buyEquipment(before.profile,session.uid,itemId,{availableCoins:before.view.coins,operationId});
 if(!result.debit)return {committed:false,replay:false,view:before.view};
 // Bind the SQL follow-up receipt to this operation, even when two callers
 // independently computed the same owned inventory from the same old revision.
 const next=JSON.stringify({...result.profile,lastPurchaseOperationId:operationId}),key=profileKey(session.uid);
 const receipt=JSON.stringify({version:1,itemId,coins:result.debit.coins,at:now,revision:result.profile.revision});
 const out=await db.batch([
  db.prepare('UPDATE auth_kv SET v=? WHERE k=? AND v=? AND '+active+' AND NOT EXISTS (SELECT 1 FROM auth_kv WHERE k=?)').bind(next,key,before.raw,...g,operation),
  db.prepare('INSERT INTO auth_kv(k,v,expires_at) SELECT ?,?,0 WHERE EXISTS (SELECT 1 FROM auth_kv WHERE k=? AND v=?) AND '+active+' ON CONFLICT(k) DO NOTHING').bind(operation,receipt,key,next,...g)
 ]);
 if(out.some(x=>x.success===false))throw Error('inventory_store');
 const after=await readEquipment(db,session,now);if(!after)throw Error('active_session');
 if(out[0]?.meta?.changes!==1){
  const replayed=await db.prepare('SELECT v FROM auth_kv WHERE k=? AND '+active).bind(operation,...guard(session,now)).first('v');
  if(replayed){if(JSON.parse(replayed).itemId!==itemId)throw Error('purchase_conflict');return {committed:false,replay:true,view:after.view};}
  throw Error('inventory_conflict');
 }
 return {committed:true,replay:false,view:after.view};
}
export async function saveEquippedItem(db,session,itemId,now){
 identifier(itemId);
 const before=await readEquipment(db,session,now);if(!before)throw Error('profile_missing');
 const next=equipItem(before.profile,session.uid,itemId);
 if(next.revision===before.profile.revision)return before.view;
 const out=await db.prepare('UPDATE auth_kv SET v=? WHERE k=? AND v=? AND '+active).bind(JSON.stringify(next),profileKey(session.uid),before.raw,...guard(session,now)).run();
 if(out.meta?.changes!==1)throw Error('inventory_conflict');
 const saved=await readEquipment(db,session,now);if(!saved)throw Error('active_session');return saved.view;
}
