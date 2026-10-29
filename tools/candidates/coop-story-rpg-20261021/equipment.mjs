// Candidate tuning, not approved production balance. Separate RPG inventory;
// never touches politics/economy cash or normal learning rewards.
export const equipment=Object.freeze({
 bare:Object.freeze({id:'bare',slot:'weapon',label:'素手',price:0,power:1}),
 none:Object.freeze({id:'none',slot:'armor',label:'装備なし',price:0,power:0}),
 practiceSword:Object.freeze({id:'practiceSword',slot:'weapon',label:'練習用の剣',price:20,power:3}),
 woodenStaff:Object.freeze({id:'woodenStaff',slot:'weapon',label:'木の杖',price:20,power:3}),
 travelArmor:Object.freeze({id:'travelArmor',slot:'armor',label:'旅の防具',price:15,power:1}),
 ironSword:Object.freeze({id:'ironSword',slot:'weapon',label:'工房の剣',price:60,power:6}),
 memoryStaff:Object.freeze({id:'memoryStaff',slot:'weapon',label:'記録の杖',price:60,power:6}),
 guardianArmor:Object.freeze({id:'guardianArmor',slot:'armor',label:'道守りの防具',price:45,power:2}),
 beaconBlade:Object.freeze({id:'beaconBlade',slot:'weapon',label:'灯の剣',price:120,power:10}),
 beaconStaff:Object.freeze({id:'beaconStaff',slot:'weapon',label:'灯の杖',price:120,power:10}),
 vowArmor:Object.freeze({id:'vowArmor',slot:'armor',label:'約束の防具',price:60,power:3})
});
function fail(code){throw Error(code);}
function validUid(uid){return typeof uid==='string'&&/^[A-Za-z0-9_-]{1,80}$/.test(uid);}
function profile(raw,uid){
 if(!validUid(uid)||raw?.uid!==uid)fail('profile_owner');
 if(raw.version!==1||!Number.isSafeInteger(raw.revision)||raw.revision<1||!['male','female'].includes(raw.body)||!Array.isArray(raw.owned)||new Set(raw.owned).size!==raw.owned.length)fail('profile_state');
 if(!raw.owned.includes('bare')||!raw.owned.includes('none')||raw.owned.some(id=>!Object.hasOwn(equipment,id)))fail('profile_inventory');
 for(const slot of ['weapon','armor'])if(!raw.owned.includes(raw[slot])||equipment[raw[slot]]?.slot!==slot)fail('profile_equipped');
 return structuredClone(raw);
}
function next(p){if(!Number.isSafeInteger(p.revision+1))fail('revision_overflow');p.revision++;return p;}
export function createProfile(uid,body){
 if(!validUid(uid)||!['male','female'].includes(body))fail('profile_create');
 return {version:1,uid,revision:1,body,owned:['bare','none'],weapon:'bare',armor:'none'};
}
// availableCoins is computed inside the server transaction from RPG receipts
// and purchases. No balance, price or power supplied by a browser is trusted.
export function buyEquipment(raw,uid,itemId,{availableCoins,operationId}){
 const p=profile(raw,uid);
 if(!Object.hasOwn(equipment,itemId))fail('unknown_equipment');
 const item=equipment[itemId];
 if(p.owned.includes(itemId))return {profile:p,debit:null};
 if(!Number.isSafeInteger(availableCoins)||availableCoins<item.price)fail('insufficient_coins');
 if(typeof operationId!=='string'||!/^[A-Za-z0-9_-]{1,80}$/.test(operationId))fail('purchase_id');
 p.owned.push(itemId);
 return {profile:next(p),debit:{operationId,itemId,coins:item.price}};
}
export function equipItem(raw,uid,itemId){
 const p=profile(raw,uid);
 if(!Object.hasOwn(equipment,itemId)||!p.owned.includes(itemId))fail('not_owned');
 const slot=equipment[itemId].slot;if(p[slot]===itemId)return p;
 p[slot]=itemId;return next(p);
}
export function tapDamage(raw,uid){
 const p=profile(raw,uid);return equipment[p.weapon].power+equipment[p.armor].power;
}
export function profileView(raw,uid){
 const p=profile(raw,uid);
 return {body:p.body,revision:p.revision,weapon:equipment[p.weapon].label,armor:equipment[p.armor].label,damage:tapDamage(p,uid),owned:p.owned.map(id=>({id,label:equipment[id].label,slot:equipment[id].slot}))};
}
