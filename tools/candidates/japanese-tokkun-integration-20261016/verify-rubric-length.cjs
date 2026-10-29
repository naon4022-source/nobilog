const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {valid,check}=require('./rubric-length.cjs');
const engine=require('../../../教材整理/実装/material-engine.js');
let n=0;const eq=(a,b)=>{assert.deepEqual(a,b);n++;};
const unit=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../../教材整理/特訓下書き/tokkun-japanese-1-kaku.json'),'utf8'));
const original=unit.questions.find(q=>q.id==='tokkun-japanese-1-kaku-22');
const question={...original,answer:{...original.answer,maxChars:40}};
const grade=input=>check(question,input)||engine.grade(question,input);
const good='近所のお年寄りたちが毎朝水をやって育てているから。';
eq(grade(good).correct,true);
const tooLong=good+'花を見た人が毎日笑顔になって駅前を明るく気持ちよく歩いている。';
eq(engine.grade(original,tooLong).correct,true); // Reproduce the missing limit.
eq(grade(tooLong).correct,false);eq(grade(tooLong).reason.includes('字数をこえています'),true);
eq(grade(good+'あ'.repeat(40-Array.from(good).length)).correct,true);
eq(grade(good+'あ'.repeat(41-Array.from(good).length)).correct,false);
const q=(max,min)=>({answer:{kind:'rubric',maxChars:max,minChars:min}});
eq(check(q(1),'か\u3099'),null);eq(check(q(1),'が'),null);
eq(check(q(2),'か\nな'),null);eq(check(q(2),'か な').correct,false);
eq(check(q(2),'あ。'),null);eq(check(q(1),'😀'),null);
eq(check(q(5,3),'あい').correct,false);eq(check(q(5,3),'あいう'),null);
eq(check({answer:{kind:'exact',maxChars:1}},'legacy exact unchanged'),null);
eq(check(original,tooLong),null); // No implicit change to existing published grading.
for(const rule of [{maxChars:0},{maxChars:NaN},{maxChars:Infinity},{maxChars:'40'},{minChars:5,maxChars:4},{maxChars:4001}]){eq(valid(rule),false);eq(check({answer:{kind:'rubric',...rule}},'入力').correct,false);}
console.log(`Rubric length candidate: ${n} checks passed; actual overlength acceptance reproduced, explicit 40-character bound, exact boundary, kana normalization, punctuation/spaces/newlines, invalid rules and legacy behavior. Keyword-only semantic grading remains unresolved; no source/answer changes`);
