// spaceline の答えの書き方のゆれを、本物の採点エンジン（読むだけ）で試す（Claude 2026-10-29）
const fs=require('fs');const e=require('/Users/shimizunaotomoo/Desktop/my-app/教材整理/実装/material-engine.js');
const u=JSON.parse(fs.readFileSync(__dirname+'/原稿/tokkun-math-1-spaceline.json','utf8'));
const L=[['直線 AB とねじれの位置にある辺は何本',['8','8本'],['6','4']],
['ねじれの位置にある辺を答えよう',['CD','DC','辺CD'],['AB','BC']],
['辺 PA と平行な辺を答えよう',['QC','CQ'],['QA','PC']],
['直線 AB と平行な面を答えよう',['OCD','ODC','面OCD'],['OAB','ABCD']],
['いつも正しいものをすべて選び、記号で答えよう。\nア 1つの直線に垂直',['イウ','イ、ウ'],['イ','アイウ']],
['立方体の8つの頂点のうち3点以上',['20','20個'],['14','26']],
['2直線」「2平面」の順',['3、2','3,2'],['2、3','3']],
['正四角錐 O−ABCD の5つの頂点のうち',['7','7つ'],['10','5']],
['∠CAF',['60','60°'],['45','90']]];
let n=0,bad=0;const out=[];
for(const [s,ok,ng] of L){const q=s.startsWith('id:')?u.questions.find(q=>q.id===s.slice(3)):u.questions.find(q=>q.prompt.includes(s));if(!q){console.log('問題が見つからない',s);bad++;continue;}
 for(const a of ok){const r=e.grade(q,a);n++;if(!r.correct){bad++;console.log('×になった正解',q.id,a,r.reason);}out.push({id:q.id,answer:a,expect:'○',got:r.correct});}
 for(const a of ng){const r=e.grade(q,a);n++;if(r.correct){bad++;console.log('○になったまちがい',q.id,a);}out.push({id:q.id,answer:a,expect:'×',got:r.correct});}}
fs.writeFileSync(__dirname+'/probe_spaceline-result.json',JSON.stringify({total:n,mismatch:bad,results:out},null,1)+'\n');console.log(`試した入力 ${n} / 期待とちがう ${bad}`);process.exit(bad?1:0);
