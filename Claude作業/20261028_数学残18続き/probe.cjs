// hist1・hist2 の答えの書き方のゆれを、本物の採点エンジン（写しではなく本体の教材整理/実装の読みこみ）で試す（Claude 2026-10-28）。読むだけ。
const fs=require('fs');const e=require('/Users/shimizunaotomoo/Desktop/my-app/教材整理/実装/material-engine.js');
const U=k=>JSON.parse(fs.readFileSync(__dirname+'/原稿/tokkun-math-1-'+k+'.json','utf8'));
const T={hist1:[['睡眠時間（時間）',['3.3','3.3時間','33/10'],['33','3.4']],['50 m 走の記録（秒）を整理',['8.25','8.25秒','33/4'],['8.2','8.5']],['20 分以上の人が全体の 40%',['18'],['20','6']],['範囲がちょうど 26',['24'],['50','26']],['15 以上 20 未満の階級にはいる値',['アイ','イア','ア、イ'],['アイウ','ア']]],
 hist2:[['立ち幅とび',['4.4','4.4m','22/5'],['4.3','44']],['A班 8 人の平均値は 15 回',['18','18回'],['17.5','35/2']],['32 人のデータで、ある階級の度数が 12',['0.375','3/8'],['0.38','12/32']],['平均値と中央値が等しくなるものを選び',['イ'],['ア','ウ']],['B組（30 人）での',['0.4','2/5'],['0.32','12']]]};
let n=0,bad=0;const out=[];
for(const [k,list] of Object.entries(T)){const u=U(k);for(const [s,ok,ng] of list){const q=u.questions.find(q=>q.prompt.includes(s));if(!q){console.log('問題が見つからない',k,s);bad++;continue;}
 for(const a of ok){const r=e.grade(q,a);n++;if(!r.correct){bad++;console.log('×になった正解',q.id,a,r.reason);}out.push({id:q.id,answer:a,expect:'○',got:r.correct});}
 for(const a of ng){const r=e.grade(q,a);n++;if(r.correct){bad++;console.log('○になったまちがい',q.id,a);}out.push({id:q.id,answer:a,expect:'×',got:r.correct});}}}
fs.writeFileSync(__dirname+'/probe-result.json',JSON.stringify({total:n,mismatch:bad,results:out},null,1)+'\n');console.log(`試した入力 ${n} / 期待とちがう ${bad}`);process.exit(bad?1:0);
