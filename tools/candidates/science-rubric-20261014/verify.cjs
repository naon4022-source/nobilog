const fs=require('node:fs'),path=require('node:path');
const engine=require('../../../教材整理/実装/material-engine.js');
const serverEngine=require('../../../cf-worker/src/material-engine.cjs'),assert=require('node:assert/strict');
const cases=[
 ['hansha',69,'物体が反射する光が目に届かないから',true],
 ['hansha',69,'物体が反射する光が目に届くから',false],
 ['kitai',24,'二酸化炭素は水に少ししか溶けないがアンモニアは多く溶けるから',true],
 ['kitai',24,'アンモニアは水に少ししか溶けないが二酸化炭素は多く溶けるから',false],
 ['kubetsu',22,'有害な薬品かもしれず、安全かどうかわからないから',true],
 ['kubetsu',22,'有害な薬品ではないから安全である',false],
 ['youkaido',19,'温度でほとんど変わらないため、水を加える',true],
 ['youkaido',19,'水を加えない',false],
 ['youkaido',66,'温度が下がると溶けきれなくなるから',true],
 ['youkaido',66,'気温が低いだけで溶解度は変わらないから',false],
];
for(const [unit,rows] of Object.entries(JSON.parse(fs.readFileSync(path.join(__dirname,'alternate-cases.json')))))for(const [num,input,expected] of rows)cases.push([unit,num,input,expected]);
const results=cases.map(([unit,num,input,expected])=>{
 const file=path.join(__dirname,'../../../教材整理/確認済み',`tokkun-science-1-${unit}.json`);
 const bank=JSON.parse(fs.readFileSync(file)),question=bank.questions[num-1];
 if(!question.id.endsWith('-'+num)||question.answer.kind!=='rubric')throw Error('unexpected source schema');
 const patches=JSON.parse(fs.readFileSync(path.join(__dirname,'conditions.json')));
 const fixed=JSON.parse(JSON.stringify(question));Object.assign(fixed.answer,patches[fixed.id]);
 const result=engine.grade(fixed,input);
 assert.deepEqual(serverEngine.grade(fixed,input),result);
 return {id:question.id,input,expected,actual:result.correct,reason:result.reason,matched:expected===result.correct};
});
fs.writeFileSync(path.join(__dirname,'candidate-results.json'),JSON.stringify({scope:'synthetic learner answers against current reviewed question data; no saved attempts',cases:results,matched:results.filter(x=>x.matched).length,mismatches:results.filter(x=>!x.matched).length},null,2)+'\n');
console.log(JSON.stringify({cases:results.length,mismatches:results.filter(x=>!x.matched).map(x=>({id:x.id,expected:x.expected,actual:x.actual}))}));

if(results.some(x=>!x.matched))process.exitCode=1;
