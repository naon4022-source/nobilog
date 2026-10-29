// draw1 の答えの書き方のゆれを、本物の採点エンジン（読むだけ）で試す（Claude 2026-10-28）
const fs=require('fs');const e=require('/Users/shimizunaotomoo/Desktop/my-app/教材整理/実装/material-engine.js');
const u=JSON.parse(fs.readFileSync(__dirname+'/原稿/tokkun-math-1-draw1.json','utf8'));
const L=[['直線 PQ は何か',['ア'],['イ','ウ']],
['三角形 OPB の面積',['18','18cm²','18cm2'],['36','27']],
['2点 A、B から等しい距離にある点をすべて',['PQS','P、Q、S','SQP'],['PQ','PQRS']],
['3つの家から等しい距離',['(3,2)','(3、2)'],['(2,3)','(3,0)']],
['二等分を3回続けた',['11.25','45/4','11.25°'],['11.3','22.5']],
['∠AOD ＝ 54° になった',['72','72°'],['54','108']],
['等しい点が2つある',['5、-5','−5、5'],['5','5、5']],
['AC ＝ BC の直角二等辺三角形',['67.5','135/2'],['67','22.5']],
['弦を少なくとも何本',['2','2本'],['1','3']],
['∠ACB の大きさ',['66','66°'],['64','70']]];
let n=0,bad=0;const out=[];
for(const [s,ok,ng] of L){const q=u.questions.find(q=>q.prompt.includes(s));if(!q){console.log('問題が見つからない',s);bad++;continue;}
 for(const a of ok){const r=e.grade(q,a);n++;if(!r.correct){bad++;console.log('×になった正解',q.id,a,r.reason);}out.push({id:q.id,answer:a,expect:'○',got:r.correct});}
 for(const a of ng){const r=e.grade(q,a);n++;if(r.correct){bad++;console.log('○になったまちがい',q.id,a);}out.push({id:q.id,answer:a,expect:'×',got:r.correct});}}
fs.writeFileSync(__dirname+'/probe_draw1-result.json',JSON.stringify({total:n,mismatch:bad,results:out},null,1)+'\n');console.log(`試した入力 ${n} / 期待とちがう ${bad}`);process.exit(bad?1:0);
