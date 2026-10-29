'use strict';
// Candidate for explicit rubric metadata. No guesses from answer keywords.
function valid(a){return ['minChars','maxChars'].every(k=>a[k]===undefined||Number.isSafeInteger(a[k])&&a[k]>=1&&a[k]<=4000)&&(a.minChars===undefined||a.maxChars===undefined||a.minChars<=a.maxChars);}
function check(question,input){
 const a=question?.answer||{};
 if(a.kind!=='rubric'||a.minChars===undefined&&a.maxChars===undefined)return null;
 if(!valid(a))return {correct:false,ratio:0,reason:'この問題の字数条件を確認中です。'};
 // Count punctuation and internal spaces; CR/LF are not written characters.
 // NFC treats a kana plus combining dakuten as the same one written character.
 const count=Array.from(String(input??'').normalize('NFC').trim().replace(/\r\n?|\n/g,'')).length;
 if(a.maxChars!==undefined&&count>a.maxChars)return {correct:false,ratio:0,reason:'字数をこえています（'+count+'字／'+a.maxChars+'字以内）。'};
 if(a.minChars!==undefined&&count<a.minChars)return {correct:false,ratio:0,reason:'あと'+(a.minChars-count)+'字以上、説明を書いてみよう。'};
 return null;
}
module.exports=Object.freeze({valid,check});
