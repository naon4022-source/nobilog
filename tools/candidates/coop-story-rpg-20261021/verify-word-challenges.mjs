// Synthetic owner records only; run serially after the whole-app suite.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {createWordChallenge,publicWordChallenge,gradeWordChallenge,wordDirectionPolicy} from './word-challenges.mjs';
const source=fs.readFileSync(new URL('../../../site-assets/eiken-vocab.js',import.meta.url),'utf8');
const body=source.split('// ---- 判定 ----\n')[1].split('// ---- 1か月（日本時間） ----')[0];
const proof=JSON.parse(fs.readFileSync(new URL('./word-grader-source.json',import.meta.url)));
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
assert.equal(sha(body),proof.pureBodySha256);
assert.equal(sha(fs.readFileSync(new URL('./word-grader.mjs',import.meta.url))),proof.moduleSha256);
const bank={grades:[{id:'5',words:[
 {id:'apple',w:'apple',ja:['りんご'],acc:['りんご']},
 {id:'book',w:'book',ja:['本']},
 {id:'speak',w:'speak',ja:['話す']},{id:'talk',w:'talk',ja:['話す']}
]}]};
const input={ownerUid:'synthetic_a',recordOwnerUid:'synthetic_a',bank,snapshot:{v:1,words:{apple:{c:1},book:{c:0},speak:{c:1}}}};
const make=(randomUint32,wordId='apple')=>createWordChallenge(input,{wordId,challengeId:'wc_synthetic_challenge_01',randomUint32});
const ej=make(0),je=make(1);
assert.equal(wordDirectionPolicy.historicalDirectionKnown,false);
assert.equal(ej.historicalDirection,null);
assert.equal(ej.direction,'ej');assert.equal(je.direction,'je');
assert.equal(publicWordChallenge(input,ej).prompt,'apple');
assert.equal(publicWordChallenge(input,je).prompt,'りんご');
for(const [challenge,hidden] of [[ej,'りんご'],[je,'apple']]){
 const view=publicWordChallenge(input,challenge);
 assert.deepEqual(Object.keys(view).sort(),['challengeId','direction','kind','prompt','subject']);
 assert.equal(JSON.stringify(view).includes(hidden),false);
 assert.equal(JSON.stringify(view).includes('synthetic_a'),false);
}
assert.equal(gradeWordChallenge(input,ej,'リンゴ').correct,true);
assert.equal(gradeWordChallenge(input,je,' APPLE! ').correct,true);
assert.equal(gradeWordChallenge(input,je,'appl').correct,false);
assert.equal(gradeWordChallenge(input,je,'appl').near,true);
assert.equal(gradeWordChallenge(input,je,'').empty,true);
assert.equal(gradeWordChallenge(input,make(1,'speak'),'talk').retrySameMeaning,true);
assert.equal(gradeWordChallenge(input,make(1,'speak'),'talk').correct,false);
assert.throws(()=>make(0,'book'),/word_not_eligible/);
for(const value of [-1,0.1,NaN,Infinity,0x100000000])assert.throws(()=>make(value),/word_random/);
assert.equal(make(0xffffffff).direction,'je');
for(const action of [publicWordChallenge,gradeWordChallenge]){
 assert.throws(()=>action({...input,ownerUid:'synthetic_b'},ej,'apple'),/word_challenge_owner/);
 assert.throws(()=>action({...input,recordOwnerUid:'synthetic_b'},ej,'apple'),/pool_owner/);
 assert.throws(()=>action({...input,snapshot:{v:1,words:{}}},ej,'apple'),/word_not_eligible/);
}
assert.throws(()=>publicWordChallenge(input,{...ej,direction:'listen'}),/word_challenge_invalid/);
assert.throws(()=>gradeWordChallenge(input,je,'x'.repeat(501)),/word_answer/);
assert.deepEqual(input.snapshot,{v:1,words:{apple:{c:1},book:{c:0},speak:{c:1}}});
console.log('Word challenge directions, owner-only eligibility, hidden answers and existing grader semantics passed; route/UI unverified.');
