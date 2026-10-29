// line の答えの書き方のゆれを、本物の採点エンジン（読むだけ）で試す（Claude 2026-10-28）
const fs=require('fs');const e=require('/Users/shimizunaotomoo/Desktop/my-app/教材整理/実装/material-engine.js');
const u=JSON.parse(fs.readFileSync(__dirname+'/原稿/tokkun-math-1-line.json','utf8'));
const L=[['線分 AB に平行な線分を',['アウ','ア、ウ','ウア'],['ア','アイウ']],
['直線 ℓ との距離が 2 cm の点',['ABE','A、B、E','EBA'],['AE','ABCE']],
['∠ABD の大きさ',['50','50°'],['80','30']],
['AB ＝ 10 cm である。点Cと直線 AB',['4.8','24/5','4.8cm'],['5','4.6']],
['ℓ と n の距離として考えられる',['2、8','8,2'],['8','2、5、8']],
['3つの文字を使って',['∠ABC','∠CBA','ABC'],['∠BAC','∠B']],
['y ＝ 2 と y ＝ −6 から等しい',['-2','−2'],['2','-4']],
['P(a, 3)',['-5','−5'],['5','-3']],
['AQ ＝ 10 cm',['15','15cm'],['5','20']],
['ありえないものを、次のア〜エから1つ',['エ'],['ア','アエ']],
['三角形 ABR の面積',['8','8cm²'],['16','10']]];
let n=0,bad=0;const out=[];
for(const [s,ok,ng] of L){const q=u.questions.find(q=>q.prompt.includes(s));if(!q){console.log('問題が見つからない',s);bad++;continue;}
 for(const a of ok){const r=e.grade(q,a);n++;if(!r.correct){bad++;console.log('×になった正解',q.id,a,r.reason);}out.push({id:q.id,answer:a,expect:'○',got:r.correct});}
 for(const a of ng){const r=e.grade(q,a);n++;if(r.correct){bad++;console.log('○になったまちがい',q.id,a);}out.push({id:q.id,answer:a,expect:'×',got:r.correct});}}
fs.writeFileSync(__dirname+'/probe_line-result.json',JSON.stringify({total:n,mismatch:bad,results:out},null,1)+'\n');console.log(`試した入力 ${n} / 期待とちがう ${bad}`);process.exit(bad?1:0);
