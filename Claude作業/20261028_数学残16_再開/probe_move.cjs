// move の答えの書き方のゆれを、本物の採点エンジン（読むだけ）で試す（Claude 2026-10-28）
const fs=require('fs');const e=require('/Users/shimizunaotomoo/Desktop/my-app/教材整理/実装/material-engine.js');
const u=JSON.parse(fs.readFileSync(__dirname+'/原稿/tokkun-math-1-move.json','utf8'));
const L=[['点 C が移る点の座標',['(-3,4)','(−3, 4)','(-3、4)','-3,4'],['(3,-4)','(-4,3)']],
['回転の中心の座標を答えよう',['(1,2)','（1, 2）'],['(2,1)','(1,-2)']],
['アを平行移動だけで',['ウオキ','ウ、オ、キ','キオウ'],['ウオ','ウオキク']],
['アを点 O を中心として 180°',['ク'],['キ','オ']],
['線分 AA" の長さ',['6','6cm'],['3','12']],
['右へいくつ、下へいくつ',['5、3','5,3'],['3、5','5、-3']],
['正六角形 ABCDEF を、その中心のまわりに 180°',['D','点D'],['C','E']],
['正方形の面積を求めよう（1目もり',['10','10cm²'],['5','9']],
['まん中の点の座標を答えよう',['(0,4)','(0、4)'],['(4,0)','(0,3)']],
['反時計回りに 150°',['12','12回'],['5','2.4']],
['時計回りに 100°',['60','60°'],['140','300']]];
let n=0,bad=0;const out=[];
for(const [s,ok,ng] of L){const q=u.questions.find(q=>q.prompt.includes(s));if(!q){console.log('問題が見つからない',s);bad++;continue;}
 for(const a of ok){const r=e.grade(q,a);n++;if(!r.correct){bad++;console.log('×になった正解',q.id,a,r.reason);}out.push({id:q.id,answer:a,expect:'○',got:r.correct});}
 for(const a of ng){const r=e.grade(q,a);n++;if(r.correct){bad++;console.log('○になったまちがい',q.id,a);}out.push({id:q.id,answer:a,expect:'×',got:r.correct});}}
fs.writeFileSync(__dirname+'/probe_move-result.json',JSON.stringify({total:n,mismatch:bad,results:out},null,1)+'\n');console.log(`試した入力 ${n} / 期待とちがう ${bad}`);process.exit(bad?1:0);
