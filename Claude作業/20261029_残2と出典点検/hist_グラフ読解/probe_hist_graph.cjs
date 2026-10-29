// 差しかえ候補の答えの書き方のゆれを、本物の採点エンジン（読むだけ）で試す（Claude 2026-10-29）
const fs=require('fs');const e=require('/Users/shimizunaotomoo/Desktop/my-app/教材整理/実装/material-engine.js');
const U={hist1:JSON.parse(fs.readFileSync(__dirname+'/原稿/tokkun-math-1-hist1.json','utf8')),hist2:JSON.parse(fs.readFileSync(__dirname+'/原稿/tokkun-math-1-hist2.json','utf8'))};
const L=[['hist1-36',['36','36%','36％'],['0.36','9']],['hist1-35',['25','25分'],['7','20']],['hist1-57',['9','9人'],['21']],
['hist2-33',['0.35','7/20','.35'],['35','0.7']],['hist2-61',['65','65%'],['0.65','13']],['hist2-26',['イ'],['ア','B組']],['hist2-67',['5','5分'],['0','10']]];
const LIMIT=[['hist2-33','35%','相対度数を百分率で答えると×（問題は相対度数を求めている）'],['hist1-36','0.36','割合を小数で答えると×（問題は百分率をたずねている）'],['hist2-61','0.65','百分率をたずねている問題に小数で答えると×']];
let n=0,bad=0;const out=[],lim=[];
const find=k=>{const [u,i]=k.split('-');return U[u].questions.find(q=>q.id==='tokkun-math-1-'+u+'-'+i);};
for(const [k,ok,ng] of L){const q=find(k);for(const a of ok){const r=e.grade(q,a);n++;if(!r.correct){bad++;console.log('×になった正解',k,a,r.reason);}out.push({k,a,expect:'○',got:r.correct});}
 for(const a of ng){const r=e.grade(q,a);n++;if(r.correct){bad++;console.log('○になったまちがい',k,a);}out.push({k,a,expect:'×',got:r.correct});}}
for(const [k,a,why] of LIMIT){const r=e.grade(find(k),a);lim.push({k,a,got:r.correct,why});console.log('（記録）',k,a,r.correct?'○':'×',why);}
fs.writeFileSync(__dirname+'/probe_hist_graph-result.json',JSON.stringify({total:n,mismatch:bad,results:out,notes:lim},null,1)+'\n');console.log(`試した入力 ${n} / 期待とちがう ${bad}`);process.exit(bad?1:0);
