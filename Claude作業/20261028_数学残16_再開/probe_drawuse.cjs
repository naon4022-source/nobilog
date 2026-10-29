// drawuse の答えの書き方のゆれを、本物の採点エンジン（読むだけ）で試す（Claude 2026-10-28）
const fs=require('fs');const e=require('/Users/shimizunaotomoo/Desktop/my-app/教材整理/実装/material-engine.js');
const u=JSON.parse(fs.readFileSync(__dirname+'/原稿/tokkun-math-1-drawuse.json','utf8'));
const L=[['水をくみ',['ウ'],['イ','エ']],
['回転の中心の座標',['(3,2)','(3、2)'],['(2,3)','(3,1)']],
['接する直線の上にある点',['PR','P、R','RP'],['P','PQR']],
['A から何 cm の所で交わるか',['2.5','5/2','2.5cm'],['2','3']],
['P の y 座標を求めよう',['7/3','７/３'],['2.3','2','2又1/3','14/6']],
['直線 y ＝ x 上を動く点 P',['(3.4,3.4)','（3.4, 3.4）'],['(3,3)','(17/5,3)']],
['3辺の長さの和は 24 cm',['36','36cm²'],['24','48']],
['三角形 ABC の面積を求めよう（1目もり',['4.5','9/2','4.5cm²'],['9','4']],
['∠OPH',['50','50°'],['40','90']]];
let n=0,bad=0;const out=[];
for(const [s,ok,ng] of L){const q=u.questions.find(q=>q.prompt.includes(s));if(!q){console.log('問題が見つからない',s);bad++;continue;}
 for(const a of ok){const r=e.grade(q,a);n++;if(!r.correct){bad++;console.log('×になった正解',q.id,a,r.reason);}out.push({id:q.id,answer:a,expect:'○',got:r.correct});}
 for(const a of ng){const r=e.grade(q,a);n++;if(r.correct){bad++;console.log('○になったまちがい',q.id,a);}out.push({id:q.id,answer:a,expect:'×',got:r.correct});}}
fs.writeFileSync(__dirname+'/probe_drawuse-result.json',JSON.stringify({total:n,mismatch:bad,results:out},null,1)+'\n');console.log(`試した入力 ${n} / 期待とちがう ${bad}`);process.exit(bad?1:0);
