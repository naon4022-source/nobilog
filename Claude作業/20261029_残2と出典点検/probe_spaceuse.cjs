// spaceuse の答えの書き方のゆれを、本物の採点エンジン（読むだけ）で試す（Claude 2026-10-29）
const fs=require('fs');const e=require('/Users/shimizunaotomoo/Desktop/my-app/教材整理/実装/material-engine.js');
const u=JSON.parse(fs.readFileSync(__dirname+'/原稿/tokkun-math-1-spaceuse.json','utf8'));
const L=[['ちょうど等しくなった。母線の長さが 9 cm',['3/2','1.5','3/2cm','1.5 cm'],['3','9/6x']],
['すき間に水をいっぱいに入れたとき、水の体積を π',['216−36π','216-36π','−36π+216','216−36π cm³','216-36πcm3'],['180π','216+36π','216−36']],
['頂点 C をふくむ三角錐を切り落とした',['9/2','4.5','9/2cm³','4.5cm3'],['9','27/2']],
['円錐の形のおもりを、底面を下にして',['3/10','0.3','3/10cm','0.3 cm'],['3','10/3','30/100x']],
['どの面にも色がついていない立方体は何個',['6','6個'],['24','60']],
['∠OAA′ の大きさを求めよう。',['54','54°','54度'],['72','36']],
['ローラーにペンキをつけ',['600π','600πcm²','600π cm2'],['200π','300π']],
['円錐は何回転するか',['4','4回転','4回'],['3','1/4']],
['四角柱の棒を、底につくように',['15/2','7.5','7.5cm'],['6','10']],
['円柱の容器に全部移した。水の深さは何 cm',['10/3','10/3cm'],['3.33','3','10']],
['「あ」と向かい合う',['お'],['う','か','オ']],
['組み立てても立方体にならないもの',['ウ'],['ア','エ']],
['表面積と体積は、それぞれ',['9、27','9,27'],['27、9','3、9']],
['転がした。上の面の目の数',['4'],['3','2']],
['机にふれている面）の目の数の和',['16'],['21','14']],
['プールの容積',['375','375m³','375m3'],['750','375cm³']],
['円柱を、底面に平行でない平面で切った',['63π','63πcm³'],['126π','84π']],
['いちばん遠い頂点 G まで、表面にそって',['6','6通り'],['3','12']]];
let n=0,bad=0;const out=[];
for(const [s,ok,ng] of L){const q=u.questions.find(q=>q.prompt.includes(s));if(!q){console.log('問題が見つからない',s);bad++;continue;}
 for(const a of ok){const r=e.grade(q,a);n++;if(!r.correct){bad++;console.log('×になった正解',q.id,a,r.reason);}out.push({id:q.id,answer:a,expect:'○',got:r.correct});}
 for(const a of ng){const r=e.grade(q,a);n++;if(r.correct){bad++;console.log('○になったまちがい',q.id,a);}out.push({id:q.id,answer:a,expect:'×',got:r.correct});}}
fs.writeFileSync(__dirname+'/probe_spaceuse-result.json',JSON.stringify({total:n,mismatch:bad,results:out},null,1)+'\n');console.log(`試した入力 ${n} / 期待とちがう ${bad}`);process.exit(bad?1:0);
