// Synthetic only. Run after the active full suite exits.
import assert from 'node:assert/strict';
import {createProfile,buyEquipment,equipItem,tapDamage,profileView} from './equipment.mjs';
for(const body of ['male','female']){
 const initial=createProfile('synthetic_a',body);
 assert.equal(tapDamage(initial,'synthetic_a'),1);
 assert.equal(profileView(initial,'synthetic_a').weapon,'素手');
 assert.equal(profileView(initial,'synthetic_a').armor,'装備なし');
 assert.throws(()=>tapDamage(initial,'synthetic_b'),{message:'profile_owner'});
 assert.throws(()=>equipItem(initial,'synthetic_a','practiceSword'),{message:'not_owned'});
 assert.throws(()=>buyEquipment(initial,'synthetic_a','practiceSword',{availableCoins:19,operationId:'purchase1'}),{message:'insufficient_coins'});
 const bought=buyEquipment(initial,'synthetic_a','practiceSword',{availableCoins:20,operationId:'purchase1'});
 assert.equal(bought.debit.coins,20);assert.deepEqual(initial.owned,['bare','none']);
 assert.equal(tapDamage(bought.profile,'synthetic_a'),1); // Purchase does not silently equip.
 let p=equipItem(bought.profile,'synthetic_a','practiceSword');
 assert.equal(tapDamage(p,'synthetic_a'),3);
 assert.equal(buyEquipment(p,'synthetic_a','practiceSword',{availableCoins:0,operationId:'purchase1'}).debit,null);
 p=buyEquipment(p,'synthetic_a','travelArmor',{availableCoins:15,operationId:'purchase2'}).profile;
 p=equipItem(p,'synthetic_a','travelArmor');assert.equal(tapDamage(p,'synthetic_a'),4);
 assert.equal(tapDamage(equipItem(p,'synthetic_a','bare'),'synthetic_a'),2);
 assert.throws(()=>buyEquipment(p,'synthetic_a','toString',{availableCoins:100,operationId:'purchase3'}),{message:'unknown_equipment'});
}
console.log('Coop equipment candidate: unarmed defaults, owner isolation, purchase/equip, replay and derived tap damage passed; price tuning and atomic inventory persistence remain unverified.');
