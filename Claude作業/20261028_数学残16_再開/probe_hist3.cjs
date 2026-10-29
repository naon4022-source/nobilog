// hist3 の答えの書き方のゆれを、本物の採点エンジン（教材整理/実装を読むだけ）で試す（Claude 2026-10-28）
const fs=require('fs');const e=require('/Users/shimizunaotomoo/Desktop/my-app/教材整理/実装/material-engine.js');
const u=JSON.parse(fs.readFileSync(__dirname+'/原稿/tokkun-math-1-hist3.json','utf8'));
const L=[['25 人の握力（kg）を整理',['31.3','31.3kg','313/10'],['31','32.5']],
['仮の平均とし',['151.75','151.75cm','607/4'],['151.7','152.5']],
['何番目と何番目の値を見れば',['10、11','10,11','11、10'],['10','10、12']],
['何以上何未満か。2つの数で答えよう',['40、46','40,46'],['46、40','40、43']],
['もう1人、23 分の人を加えた',['25','25分'],['15','23']],
['少なくとも何人であればよいか',['12','12人'],['11','11.33']],
['1.5 倍だった',['12'],['8','1.5']],
['中央値として考えられる値は',['27.5、32.5','27.5,32.5'],['27.5','25、35']],
['とびはなれた値の影響',['イ'],['ア','イア']],
['正しいものを、下のア〜エ',['イ'],['ア','エ']],
['発言は正しいと判断できるか',['ウ'],['ア','イ']],
['25 m 以上投げた人は全体の何 %',['36','36%'],['0.36','9']],
['累積相対度数が小さい階級から順に 0.1',['14','14人'],['0.35','28']],
['相対度数は順に 0.05',['69','69点'],['70','65']]];
let n=0,bad=0;const out=[];
for(const [s,ok,ng] of L){const q=u.questions.find(q=>q.prompt.includes(s));if(!q){console.log('問題が見つからない',s);bad++;continue;}
 for(const a of ok){const r=e.grade(q,a);n++;if(!r.correct){bad++;console.log('×になった正解',q.id,a,r.reason);}out.push({id:q.id,answer:a,expect:'○',got:r.correct});}
 for(const a of ng){const r=e.grade(q,a);n++;if(r.correct){bad++;console.log('○になったまちがい',q.id,a);}out.push({id:q.id,answer:a,expect:'×',got:r.correct});}}
fs.writeFileSync(__dirname+'/probe_hist3-result.json',JSON.stringify({total:n,mismatch:bad,results:out},null,1)+'\n');console.log(`試した入力 ${n} / 期待とちがう ${bad}`);process.exit(bad?1:0);
