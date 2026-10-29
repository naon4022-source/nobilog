// Synthetic candidate checks; run only after the current full suite exits.
import assert from 'node:assert/strict';
import {materialPool,wordPool,createPoolGeneration} from './eligible-pool.mjs';
const units=['国語','数学','英語','理科','社会'].map((subject,i)=>({id:'unit'+i,status:'ready',subject,questions:[{id:'q1',type:'short'},{id:'passage',type:'reading'},{id:'wrong',type:'short'}],tests:[{id:'q1',type:'short'}]}));
const records=units.flatMap(u=>[
 {unitId:u.id,questionId:'q1',mode:'study',result:{correct:true}},
 {unitId:u.id,questionId:'q1',mode:'study',result:{correct:true}},
 {unitId:u.id,questionId:'wrong',mode:'study',result:{correct:false}},
 {unitId:u.id,questionId:'passage',mode:'study',result:{correct:true}},
 {unitId:u.id,questionId:'missing',mode:'study',result:{correct:true}}
]);
const input={ownerUid:'synthetic_a',recordOwnerUid:'synthetic_a',records,units};
assert.equal(materialPool(input).length,5);
assert.deepEqual(new Set(materialPool(input).map(x=>x.subject)),new Set(['国語','数学','英語','理科','社会']));
assert.throws(()=>materialPool({...input,recordOwnerUid:'synthetic_b'}),{message:'pool_owner'});
assert.deepEqual(materialPool({...input,records:[]}),[]);
assert.equal(materialPool({...input,units:units.map(u=>({...u,status:'draft'}))}).length,0);
assert.equal(materialPool({...input,records:[...records,{unitId:'unit0',questionId:'q1',mode:'test',result:{correct:true}}]}).length,6);
const bank={grades:[{id:'g5',words:[{id:'apple'},{id:'book'},{id:'word3'},{id:'word4'}]}]};
const words={ownerUid:'synthetic_a',recordOwnerUid:'synthetic_a',bank,snapshot:{v:1,words:{apple:{c:1,w:5},book:{c:0},word3:{c:'1'},word4:{c:Infinity},retired:{c:5}}}};
assert.deepEqual(wordPool(words).map(w=>w.wordId),['apple']);
assert.throws(()=>wordPool({...words,recordOwnerUid:'synthetic_b'}),{message:'pool_owner'});
assert.deepEqual(wordPool({...words,snapshot:null}),[]);
const generation=createPoolGeneration();
const old=generation.changeOwner('synthetic_a');
assert.equal(generation.current(old),true);
assert.equal(generation.invalidateAfterSave('synthetic_a',false),null);
assert.equal(generation.current(old),true);
const fresh=generation.invalidateAfterSave('synthetic_a',true);
assert.equal(generation.current(old),false);
assert.equal(generation.current(fresh),true);
generation.changeOwner('synthetic_b');
assert.equal(generation.current(fresh),false);
assert.equal(generation.invalidateAfterSave('synthetic_a',true),null);
const out=generation.changeOwner('');assert.equal(generation.current(out),false);
console.log('Coop pool: synthetic assertions passed; guarded repository and save-ACK wiring remain unverified.');
