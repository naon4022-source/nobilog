// solid1 の答えの書き方のゆれを、本物の採点エンジン（読むだけ）で試す（Claude 2026-10-28）
const fs=require('fs');const e=require('/Users/shimizunaotomoo/Desktop/my-app/教材整理/実装/material-engine.js');
const u=JSON.parse(fs.readFileSync(__dirname+'/原稿/tokkun-math-1-solid1.json','utf8'));
const L=[['四角錐をぴったりのせた',['16','16本'],['17','12']],
['何面体か。面の数を答えよう。',['6','6面体'],['5','8','六面体']],
['ちょうど2つの面に色',['12','12個'],['8','6']],
['2023',['イ'],['ア']],
['多面体として考えられないもの',['エ'],['ア','ウエ']],
['正方形の面が 6 個、正三角形の面が 8 個',['12','12個'],['14','24']],
['頂点 A から頂点 G まで',['6','6通り'],['3','8']],
['どの頂点にも3本の辺',['20','20個'],['12','30']]];
let n=0,bad=0;const out=[];
for(const [s,ok,ng] of L){const q=u.questions.find(q=>q.prompt.includes(s));if(!q){console.log('問題が見つからない',s);bad++;continue;}
 for(const a of ok){const r=e.grade(q,a);n++;if(!r.correct){bad++;console.log('×になった正解',q.id,a,r.reason);}out.push({id:q.id,answer:a,expect:'○',got:r.correct});}
 for(const a of ng){const r=e.grade(q,a);n++;if(r.correct){bad++;console.log('○になったまちがい',q.id,a);}out.push({id:q.id,answer:a,expect:'×',got:r.correct});}}
fs.writeFileSync(__dirname+'/probe_solid1-result.json',JSON.stringify({total:n,mismatch:bad,results:out},null,1)+'\n');console.log(`試した入力 ${n} / 期待とちがう ${bad}`);process.exit(bad?1:0);
