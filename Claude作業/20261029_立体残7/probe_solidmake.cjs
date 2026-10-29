// solidmake の答えの書き方のゆれを、本物の採点エンジン（読むだけ）で試す（Claude 2026-10-29）
const fs=require('fs');const e=require('/Users/shimizunaotomoo/Desktop/my-app/教材整理/実装/material-engine.js');
const u=JSON.parse(fs.readFileSync(__dirname+'/原稿/tokkun-math-1-solidmake.json','utf8'));
const L=[['直線 ℓ から 2 cm はなれている',['21π','21π cm²','21πcm2'],['25π','4π']],
['斜辺を軸として',['4.8','24/5','4.8cm'],['5','4']],
['A の底面積は B の底面積の何倍',['16/9','16/9倍'],['4/3','9/16']],
['底面の直径を求めよう',['6','6cm'],['4','3']],
['上の面の円の半径と、下の面の円の半径を',['3、7','3,7'],['7、3','3']],
['短いほうの辺を軸に回転させた円錐の底面の半径の何倍',['1/2','0.5'],['2','2/1']],
['四角形を、その面に垂直な方向',['18'],['16','20']],
['ドーナツ形の立体を、軸に垂直で円の中心を通る平面で切った切り口の面積',['96π','96πcm²'],['100π','64π']]];
let n=0,bad=0;const out=[];
for(const [s,ok,ng] of L){const q=s.startsWith('id:')?u.questions.find(q=>q.id===s.slice(3)):u.questions.find(q=>q.prompt.includes(s));if(!q){console.log('問題が見つからない',s);bad++;continue;}
 for(const a of ok){const r=e.grade(q,a);n++;if(!r.correct){bad++;console.log('×になった正解',q.id,a,r.reason);}out.push({id:q.id,answer:a,expect:'○',got:r.correct});}
 for(const a of ng){const r=e.grade(q,a);n++;if(r.correct){bad++;console.log('○になったまちがい',q.id,a);}out.push({id:q.id,answer:a,expect:'×',got:r.correct});}}
fs.writeFileSync(__dirname+'/probe_solidmake-result.json',JSON.stringify({total:n,mismatch:bad,results:out},null,1)+'\n');console.log(`試した入力 ${n} / 期待とちがう ${bad}`);process.exit(bad?1:0);
