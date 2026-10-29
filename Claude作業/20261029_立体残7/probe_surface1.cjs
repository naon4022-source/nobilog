// surface1 の答えの書き方のゆれを、本物の採点エンジン（読むだけ）で試す（Claude 2026-10-29）
const fs=require('fs');const e=require('/Users/shimizunaotomoo/Desktop/my-app/教材整理/実装/material-engine.js');
const u=JSON.parse(fs.readFileSync(__dirname+'/原稿/tokkun-math-1-surface1.json','utf8'));
const L=[['底面が直角をはさむ2辺 5 cm と 12 cm',['180','180cm²','180cm2'],['150','120']],
['側面積は、表面積の何分のいくつ',['10/13'],['20/26','60/78']],
['中心角 288° のおうぎ形である。この円錐の側面積',['80π','80π cm²','80πcm2'],['64π','100π']],
['パイプの形',['192π','192πcm²'],['160π','176π']],
['縦に半分に切った立体である',['56π+80','80+56π'],['56π','40π+80']],
['表面積のうち、底面がしめる割合',['3/8','0.375'],['6/16','3/5']],
['何角柱か',['8','8角柱'],['16','4']],
['L 字の形',['18','18cm²'],['24','16']],
['半径 8 cm の半円',['48π','48π cm²'],['32π','64π']]];
let n=0,bad=0;const out=[];
for(const [s,ok,ng] of L){const q=s.startsWith('id:')?u.questions.find(q=>q.id===s.slice(3)):u.questions.find(q=>q.prompt.includes(s));if(!q){console.log('問題が見つからない',s);bad++;continue;}
 for(const a of ok){const r=e.grade(q,a);n++;if(!r.correct){bad++;console.log('×になった正解',q.id,a,r.reason);}out.push({id:q.id,answer:a,expect:'○',got:r.correct});}
 for(const a of ng){const r=e.grade(q,a);n++;if(r.correct){bad++;console.log('○になったまちがい',q.id,a);}out.push({id:q.id,answer:a,expect:'×',got:r.correct});}}
fs.writeFileSync(__dirname+'/probe_surface1-result.json',JSON.stringify({total:n,mismatch:bad,results:out},null,1)+'\n');console.log(`試した入力 ${n} / 期待とちがう ${bad}`);process.exit(bad?1:0);
