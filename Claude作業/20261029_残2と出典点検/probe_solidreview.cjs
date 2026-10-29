// solidreview の答えの書き方のゆれを、本物の採点エンジン（読むだけ）で試す（Claude 2026-10-29）
const fs=require('fs');const e=require('/Users/shimizunaotomoo/Desktop/my-app/教材整理/実装/material-engine.js');
const u=JSON.parse(fs.readFileSync(__dirname+'/原稿/tokkun-math-1-solidreview.json','utf8'));
const L=[['点 A と重なる点をすべて',['C、G','G、C','C,G','CとG'],['C','B、F','C、G、A']],
['点 C といっしょにその頂点に',['G、K','K、G','G,K'],['G','F、K']],
['辺 AB と重なる辺',['FG','GF','辺FG'],['KL','AB']],
['辺 BC とねじれの位置にある辺をすべて',['アイエ','ア、イ、エ','エイア'],['アイ','アイウエ']],
['平面 ABCD と平行な辺をすべて',['FG、EH','EH、FG','GF、HE','FG,EH'],['FG','CG、DH、FG、EH']],
['平面 BCGF と垂直な辺をすべて',['DC、HG','CD、GH','HG、DC'],['DC','AB、DC、EF、HG']],
['おうぎ形2つと、たて 2 cm・横 5 cm の長方形を合わせたものである',['92π/3','92/3π','92π/3cm³'],['92π','32π/3']],
['外側の半径 5 cm、内側の半径 4 cm の半球',['122π/3','122/3π'],['122π','61π/3']],
['半径 1 cm の円柱の形の穴をまっすぐあけた。残った立体の体積',['64−4π','64-4π','−4π+64','64-4πcm³'],['60π','64−π']],
['穴の内側もふくめて、この立体の表面積を、π',['96+6π','96＋6π','6π+96'],['96+8π','96']],
['軸をふくむ平面での切り口の面積から',['48−9π','48-9π'],['39π','48+9π']],
['3 つのかど A がぴったり重なるようにして三角錐をつくった。この三角錐の体積',['64/3','64/3cm³'],['21.3','64','21']],
['円錐：球：円柱 の順',['1、2、3','1,2,3'],['3、2、1','1、3、2']],
['頂点の数と体積（cm³）を、この順',['5、24','5,24'],['24、5','6、24']],
['長方形の紙を丸めて',['4/3','4/3倍'],['3/4','1.3']],
['水面が3つの頂点 B、D、E を通る三角形',['60','60cm³'],['12','72']],
['水面が長方形 BCHE',['256','256cm³'],['512','128']]];
const LIMIT=[['円錐：球：円柱 の順','1：2：3','比の記号「：」で区切ると、numbers の答えとして読まれない']];
let n=0,bad=0;const out=[];const limits=[];
for(const [s,ok,ng] of L){const q=u.questions.find(q=>q.prompt.includes(s));if(!q){console.log('問題が見つからない',s);bad++;continue;}
 for(const a of ok){const r=e.grade(q,a);n++;if(!r.correct){bad++;console.log('×になった正解',q.id,a,r.reason);}out.push({id:q.id,answer:a,expect:'○',got:r.correct});}
 for(const a of ng){const r=e.grade(q,a);n++;if(r.correct){bad++;console.log('○になったまちがい',q.id,a);}out.push({id:q.id,answer:a,expect:'×',got:r.correct});}}
for(const [s0,a,why] of LIMIT){const q=u.questions.find(q=>q.prompt.includes(s0));const r=e.grade(q,a);limits.push({id:q.id,answer:a,got:r.correct,reason:r.reason||'',note:why});console.log('採点の制約（数学的には正しい）',q.id,a,r.correct?'○':'×',why);}
fs.writeFileSync(__dirname+'/probe_solidreview-result.json',JSON.stringify({total:n,mismatch:bad,results:out,gradingLimits:limits},null,1)+'\n');console.log(`試した入力 ${n} / 期待とちがう ${bad}`);process.exit(bad?1:0);

