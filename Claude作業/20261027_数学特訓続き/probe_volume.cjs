// 立体の体積：単位・π・分数の書き方のゆれを本物の採点エンジンで試す（Claude 2026-10-27）。実ユーザーの記録は使わない。
const fs=require('fs');const e=require('/Users/shimizunaotomoo/Desktop/my-app/教材整理/実装/material-engine.js');
const u=JSON.parse(fs.readFileSync(__dirname+'/原稿/tokkun-math-1-volume.json','utf8'));const Q=Object.fromEntries(u.questions.map(q=>[q.prompt.slice(0,18),q]));
const find=s=>u.questions.find(q=>q.prompt.includes(s));
const T=[
['内側が 1 辺 50 cm',['125','125L','125 L'],['125000','12.5']],
['1 辺 10 cm の立方体の、向かい合う',['1000−40π','1000-40π','-40π+1000'],['960π','1000+40π','1000-4π']],
['8 つの頂点それぞれ',['616/3','616/3cm³'],['205','1232/6','616']],
['1 辺 4 cm の鉄の立方体',['4/π'],['4π','π/4','16/π']],
['半径 3 cm の鉄の球を完全に',['3π/25','3/25π'],['36π','3π/5']],
['半球の形の器',['452.16','452.16cm³'],['452','904.32']],
['斜辺を軸',['48π/5','9.6π'],['16π','48π']],
['底面の直径が 10 cm',['50π'],['200π','100π']],
['アルミニウム',['5','5cm'],['20','-5']],
];
let n=0,bad=0;const out=[];
for(const [s,ok,ng] of T){const q=find(s);if(!q){console.log('問題が見つからない',s);bad++;continue;}
 for(const a of ok){const r=e.grade(q,a);n++;if(!r.correct){bad++;console.log('×になった正解',q.id,a,r.reason);}out.push({id:q.id,answer:a,expect:'○',got:r.correct});}
 for(const a of ng){const r=e.grade(q,a);n++;if(r.correct){bad++;console.log('○になったまちがい',q.id,a);}out.push({id:q.id,answer:a,expect:'×',got:r.correct});}}
fs.writeFileSync(__dirname+'/probe_volume-result.json',JSON.stringify({total:n,mismatch:bad,results:out},null,1));
console.log(`試した入力 ${n} / 期待とちがう ${bad}`);
