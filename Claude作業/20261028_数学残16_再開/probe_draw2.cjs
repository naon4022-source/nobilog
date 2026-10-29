// draw2 の答えの書き方のゆれを、本物の採点エンジン（読むだけ）で試す（Claude 2026-10-28）
const fs=require('fs');const e=require('/Users/shimizunaotomoo/Desktop/my-app/教材整理/実装/material-engine.js');
const u=JSON.parse(fs.readFileSync(__dirname+'/原稿/tokkun-math-1-draw2.json','utf8'));
const L=[['底辺としたときの高さを表す線分',['AH','HA','線分AH'],['AB','CK']],
['対角線 BD ＝ 15 cm',['7.2','36/5','7.2cm'],['7','12']],
['BK の長さ',['3.6','18/5'],['3','4']],
['∠ACH の大きさ',['58','58°'],['32','90']],
['3点 A(0, 0)、B(4, 3)、C(4, −2)',['4'],['5','2']],
['直角をはさむ2辺が 7 cm と 24 cm',['6.72','168/25'],['6.7','7']],
['3つの辺の長さの和が 36 cm',['48','48cm²'],['36','24']],
['まん中の点 M と ℓ の距離',['5.5','11/2'],['5','2.5']],
['しかも P からの距離が 5 cm',['4','4個'],['2','8']],
['∠HAD',['20','20°'],['40','10']],
['PD + PE',['8','8cm'],['4','16']]];
let n=0,bad=0;const out=[];
for(const [s,ok,ng] of L){const q=u.questions.find(q=>q.prompt.includes(s));if(!q){console.log('問題が見つからない',s);bad++;continue;}
 for(const a of ok){const r=e.grade(q,a);n++;if(!r.correct){bad++;console.log('×になった正解',q.id,a,r.reason);}out.push({id:q.id,answer:a,expect:'○',got:r.correct});}
 for(const a of ng){const r=e.grade(q,a);n++;if(r.correct){bad++;console.log('○になったまちがい',q.id,a);}out.push({id:q.id,answer:a,expect:'×',got:r.correct});}}
fs.writeFileSync(__dirname+'/probe_draw2-result.json',JSON.stringify({total:n,mismatch:bad,results:out},null,1)+'\n');console.log(`試した入力 ${n} / 期待とちがう ${bad}`);process.exit(bad?1:0);
