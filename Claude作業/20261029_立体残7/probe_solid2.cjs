// solid2 の答えの書き方のゆれを、本物の採点エンジン（読むだけ）で試す（Claude 2026-10-29）
const fs=require('fs');const e=require('/Users/shimizunaotomoo/Desktop/my-app/教材整理/実装/material-engine.js');
const u=JSON.parse(fs.readFileSync(__dirname+'/原稿/tokkun-math-1-solid2.json','utf8'));
const L=[['id:tokkun-math-1-solid2-7',['イ'],['ア','エ']],
['辺 PB と重なる辺',['QB','BQ','辺QB'],['QC','PA']],
['点 X と重なる点',['YZ','Y、Z','ZY'],['Y','ABC']],
['側面の長方形の横の長さを、π',['8π','8π cm'],['4π','16π']],
['中心角は 240°',['6','6cm'],['8','3']],
['立面図と平面図がどちらも同じ大きさの正方形',['アイ','ア、イ'],['ア','アイウ']],
['整数 cm',['13','13cm'],['12','72']],
['頂点を中心にして平らな床',['3','3回転'],['2','15']],
['4つの辺の長さの合計',['14+12π','12π+14'],['14+6π','26π']]];
let n=0,bad=0;const out=[];
for(const [s,ok,ng] of L){const q=s.startsWith('id:')?u.questions.find(q=>q.id===s.slice(3)):u.questions.find(q=>q.prompt.includes(s));if(!q){console.log('問題が見つからない',s);bad++;continue;}
 for(const a of ok){const r=e.grade(q,a);n++;if(!r.correct){bad++;console.log('×になった正解',q.id,a,r.reason);}out.push({id:q.id,answer:a,expect:'○',got:r.correct});}
 for(const a of ng){const r=e.grade(q,a);n++;if(r.correct){bad++;console.log('○になったまちがい',q.id,a);}out.push({id:q.id,answer:a,expect:'×',got:r.correct});}}
fs.writeFileSync(__dirname+'/probe_solid2-result.json',JSON.stringify({total:n,mismatch:bad,results:out},null,1)+'\n');console.log(`試した入力 ${n} / 期待とちがう ${bad}`);process.exit(bad?1:0);
