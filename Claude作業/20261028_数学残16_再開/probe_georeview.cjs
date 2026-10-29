// georeview の答えの書き方のゆれを、本物の採点エンジン（読むだけ）で試す（Claude 2026-10-28）
const fs=require('fs');const e=require('/Users/shimizunaotomoo/Desktop/my-app/教材整理/実装/material-engine.js');
const u=JSON.parse(fs.readFileSync(__dirname+'/原稿/tokkun-math-1-georeview.json','utf8'));
const L=[['4つの辺に、円が内側で接している',['100−25π','100-25π','-25π+100'],['75π','100-5π']],
['弧 AB と弦 AB の間',['9π−18','9π-18'],['9π','18-9π']],
['円の中心 P が動いたあと',['20+2π','2π+20'],['20+π','24']],
['1辺 6 cm の正三角形 ABC の3つの頂点を中心として',['2π'],['6π','π']],
['ヤギ',['53π'],['48π','52π']],
['S 字の線',['8π'],['6π','4π']],
['∠FAC',['90','90°'],['120','60']],
['半径 3 cm の円と半径 5 cm の円で',['5/3','5/3倍'],['3/5','1.6']],
['おうぎ形の半径を半分にし',['0.5','1/2'],['1','2']],
['すべらないように右へ転がす',['8π'],['4π','12π']]];
let n=0,bad=0;const out=[];
for(const [s,ok,ng] of L){const q=u.questions.find(q=>q.prompt.includes(s));if(!q){console.log('問題が見つからない',s);bad++;continue;}
 for(const a of ok){const r=e.grade(q,a);n++;if(!r.correct){bad++;console.log('×になった正解',q.id,a,r.reason);}out.push({id:q.id,answer:a,expect:'○',got:r.correct});}
 for(const a of ng){const r=e.grade(q,a);n++;if(r.correct){bad++;console.log('○になったまちがい',q.id,a);}out.push({id:q.id,answer:a,expect:'×',got:r.correct});}}
fs.writeFileSync(__dirname+'/probe_georeview-result.json',JSON.stringify({total:n,mismatch:bad,results:out},null,1)+'\n');console.log(`試した入力 ${n} / 期待とちがう ${bad}`);process.exit(bad?1:0);
