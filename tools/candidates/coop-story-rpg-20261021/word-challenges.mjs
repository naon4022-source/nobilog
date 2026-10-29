// Server-side candidate only. The route must authenticate the owner and fetch
// their saved snapshot. Neither client correctness counts nor peer data qualify.
import {wordPool} from './eligible-pool.mjs';
import {judgeJa,judgeEn} from './word-grader.mjs';

export const wordDirectionPolicy=Object.freeze({
 decision:'2026-10-21_user_discretion',
 allowed:Object.freeze(['ej','je']),
 historicalDirectionKnown:false
});

function ownedWord(input,wordId){
 const pool=wordPool(input);
 if(!pool.some(w=>w.wordId===wordId))throw Error('word_not_eligible');
 const words=input.bank.grades.flatMap(g=>g.words||[]).filter(w=>w.id===wordId);
 if(words.length!==1)throw Error('word_bank_ambiguous');
 const word=words[0];
 if(typeof word.w!=='string'||!word.w.trim()||!Array.isArray(word.ja)||!word.ja.length||word.ja.some(s=>typeof s!=='string'||!s.trim()))throw Error('word_bank_invalid');
 return word;
}

// A random unsigned 32-bit integer is supplied by the server, never the client.
export function createWordChallenge(input,{wordId,challengeId,randomUint32}){
 ownedWord(input,wordId);
 if(typeof challengeId!=='string'||!/^wc_[a-zA-Z0-9_-]{16,80}$/.test(challengeId))throw Error('word_challenge_id');
 if(!Number.isInteger(randomUint32)||randomUint32<0||randomUint32>0xffffffff)throw Error('word_random');
 return Object.freeze({
  kind:'word',ownerUid:input.ownerUid,challengeId,wordId,
  direction:randomUint32%2===0?'ej':'je',
  provenance:'owner_saved_correct_count',historicalDirection:null
 });
}

function checked(input,challenge){
 if(!challenge||challenge.ownerUid!==input.ownerUid)throw Error('word_challenge_owner');
 if(challenge.kind!=='word'||!wordDirectionPolicy.allowed.includes(challenge.direction))throw Error('word_challenge_invalid');
 return ownedWord(input,challenge.wordId);
}

// Return exactly one side of the word; no bank record/answer list is serialized.
export function publicWordChallenge(input,challenge){
 const word=checked(input,challenge);
 return {challengeId:challenge.challengeId,kind:'word',subject:'英語',
  direction:challenge.direction,prompt:challenge.direction==='ej'?word.w:word.ja.join('／')};
}

// The service persists the result atomically in the RPG only. No normal grade,
// ordinary reward or vocabulary correctness count is written by this module.
export function gradeWordChallenge(input,challenge,answer){
 const word=checked(input,challenge);
 if(typeof answer!=='string'||answer.length>500)throw Error('word_answer');
 const result=challenge.direction==='ej'?judgeJa(word,answer):judgeEn(word,answer,input.bank);
 return {correct:result.ok===true,retrySameMeaning:result.other===true,
  near:result.near===true,empty:result.empty===true};
}
