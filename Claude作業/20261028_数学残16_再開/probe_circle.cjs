// circle の答えの書き方のゆれを、本物の採点エンジン（読むだけ）で試す（Claude 2026-10-28）
const fs=require('fs');const e=require('/Users/shimizunaotomoo/Desktop/my-app/教材整理/実装/material-engine.js');
const u=JSON.parse(fs.readFileSync(__dirname+'/原稿/tokkun-math-1-circle.json','utf8'));
const L=[['∠AOB ＝ 136° のとき',['44','44°','44度'],['46','136']],
['四角形 OAPB の面積',['48','48cm²','48cm2'],['24','96']],
['点Bをふくまない側の ∠AOC',['140','140°'],['220','40']],
['AP の長さを求めよう',['4','4cm'],['3','5']],
['y ＝ k がこの円に接する',['4、−4','-4,4','4,-4'],['4','4、4']],
['3点 A(−1, 0)',['(2,3)','(2、3)','2,3'],['(3,2)','(2,-3)']],
['正八角形の8つの頂点',['67.5','135/2','67.5度'],['67','45']],
['中心を見つける方法',['イ'],['ア','ウ']],
['弧の長さは、同じ半径の円の円周の 0.35 倍',['126','126°'],['0.35','125']],
['2.5 倍である',['120'],['19.2','48']],
['円の内部にある点を通って',['0','0本'],['1','2']],
["∠OAO'",['60','60度'],['30','120']]];
let n=0,bad=0;const out=[];
for(const [s,ok,ng] of L){const q=u.questions.find(q=>q.prompt.includes(s));if(!q){console.log('問題が見つからない',s);bad++;continue;}
 for(const a of ok){const r=e.grade(q,a);n++;if(!r.correct){bad++;console.log('×になった正解',q.id,a,r.reason);}out.push({id:q.id,answer:a,expect:'○',got:r.correct});}
 for(const a of ng){const r=e.grade(q,a);n++;if(r.correct){bad++;console.log('○になったまちがい',q.id,a);}out.push({id:q.id,answer:a,expect:'×',got:r.correct});}}
fs.writeFileSync(__dirname+'/probe_circle-result.json',JSON.stringify({total:n,mismatch:bad,results:out},null,1)+'\n');console.log(`試した入力 ${n} / 期待とちがう ${bad}`);process.exit(bad?1:0);
