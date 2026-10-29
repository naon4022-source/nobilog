import assert from 'node:assert/strict';
import {persistRetryDraft} from './draft-adapter.mjs';
import {retryMarker} from './chat-retry.mjs';
let n=0,saved='';
const marker=await retryMarker('Synthetic question',[],{get:()=>saved,set:v=>{saved=v;}},()=> 'request_1');
const input={marker:JSON.stringify(marker),text:'Synthetic question',images:[]};
const make=()=>{let staged;return {same:()=>true,stage:v=>{staged=v;},push:async()=>true,readback:async()=>staged};};
assert.equal(await persistRetryDraft(input,make()),true);n++;
for(const change of [a=>a.same=()=>false,a=>a.push=async()=>false,a=>a.push=async()=>{throw Error('offline');},a=>a.readback=async()=>({}),a=>a.readback=async()=>{a.same=()=>false;return {};},a=>a.push=async()=>{a.same=()=>false;return true;}]){
 const a=make();change(a);await assert.rejects(persistRetryDraft(input,a));n++;
}
await assert.rejects(persistRetryDraft({...input,images:['wrong-id']},make()));n++;
let staged=false;const mismatch=make();mismatch.stage=()=>{staged=true;};
await assert.rejects(persistRetryDraft({...input,text:'Changed question'},mismatch),/retry_content_changed/);n++;
assert.equal(staged,false);n++;
await assert.rejects(persistRetryDraft({...input,images:['a'.repeat(64)]},make()),/retry_content_changed/);n++;
console.log(`Chat retry server-save adapter: ${n} checks passed; confirmed readback, failed push, changed lease and stale data block submission`);
