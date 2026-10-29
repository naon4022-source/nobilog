import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createOwnedWordReader} from './owned-word-reader.mjs';
const require=createRequire(import.meta.url),{D1SQLite}=require('../../../.claude/verify/d1-sqlite.js');
const db=new D1SQLite(),s={uid:'synthetic_a',owner:'owner_a'};
let time=1000,calls=0;
db.seed('active-session:'+s.uid,s.owner,5000);
const words={v:1,words:{apple:{c:1,w:0}}};
let saved={v:3,keys:{[s.uid+':eikenVocab']:JSON.stringify(words),[s.uid+':private-notes']:'synthetic private notes'}};
const reader=createOwnedWordReader({db,clock:()=>time,snapshot:async uid=>{calls++;assert.equal(uid,s.uid);return saved;}});
try{
 assert.deepEqual(await reader(s),{ownerUid:s.uid,snapshot:words});
 assert.equal(JSON.stringify(await reader(s)).includes('synthetic private notes'),false);
 for(const fixture of [
  {v:3,keys:{'synthetic_b:eikenVocab':JSON.stringify(words)}},
  {v:3,keys:{[s.uid+':eikenVocab']:'{broken'}},
  {v:3,keys:{[s.uid+':eikenVocab']:JSON.stringify({v:2,words:{}})}},
  {v:3,keys:{[s.uid+':eikenVocab']:42}},
  {v:0,keys:{}},
 ]){saved=fixture;await assert.rejects(()=>reader(s),/word_snapshot_invalid/);}
 saved=null;assert.deepEqual(await reader(s),{ownerUid:s.uid,snapshot:null});
 saved={v:3,keys:{}};assert.deepEqual(await reader(s),{ownerUid:s.uid,snapshot:null});
 const before=calls;await assert.rejects(()=>reader({...s,owner:'wrong_owner'}),/active_session/);assert.equal(calls,before);
 const delayed=createOwnedWordReader({db,clock:()=>time,snapshot:async()=>{time=5000;return {v:3,keys:{[s.uid+':eikenVocab']:JSON.stringify(words)}};}});
 await assert.rejects(()=>delayed(s),/active_session/);
 time=1000;
 const revoked=createOwnedWordReader({db,clock:()=>time,snapshot:async()=>{db.seed('active-session:'+s.uid,'replacement',5000);return {v:3,keys:{[s.uid+':eikenVocab']:JSON.stringify(words)}};}});
 await assert.rejects(()=>revoked(s),/active_session/);
 assert.equal(db.keys().length,1,'no normal grade or snapshot writes');
}finally{db.close();}
console.log('Owned word reader: exact caller, isolated output, foreign/malformed snapshot rejection, missing words, fresh-clock expiry and owner replacement passed; existing runtime callback wiring still unverified.');
