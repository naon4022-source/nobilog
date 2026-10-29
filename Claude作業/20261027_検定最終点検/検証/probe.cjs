// 採点エンジンの実地テスト（Claude 2026-10-27）：本物の material-engine で、別の正しい書き方とまちがいを試す。
// 期待：ok=○であるべき、ng=×であるべき。実ユーザーの記録・通信は使わない。
const fs=require('fs'),path=require('path');
const engine=require('/Users/shimizunaotomoo/Desktop/my-app/教材整理/実装/material-engine.js');
const load=k=>JSON.parse(fs.readFileSync(path.join(__dirname,'..',process.env.DIR||'原本写し',`kentei-${k}.json`),'utf8'));
const B={};for(const k of ['kanken-4','suken-3','suken-4','suken-5','rika-5'])for(const q of load(k).questions)B[q.id]=q;
const T=[
['suken-5-47','ok',['ない','ありません','となり合わない','いいえ','なし','となりあわない']],['suken-5-47','ng',['ある','あります']],
['suken-5-17','ok',['x=-4','x＝−4','-4','x = -4','X=-4']],['suken-5-17','ng',['x=4','4']],
['suken-5-13','ok',['3、4','3,4','3:4','3：4']],['suken-5-13','ng',['4、3','6、8']],
['suken-5-20','ok',['y=-20/x','y=−20/x','y = -20/x']],['suken-5-20','ng',['y=20/x','y=-20x','y=-x/20']],
['suken-5-22','ok',['4π','4 π']],['suken-5-22','ng',['12π','2π']],
['suken-5-43','ok',['(3,2)','(3, 2)','（3,2）','(3、2)','3,2']],['suken-5-43','ng',['(3,-2)','(-3,-2)','(2,3)']],
['suken-5-41','ok',['対称移動']],['suken-5-41','ng',['回転移動','平行移動']],
['suken-4-39','ok',['合同','合同である','合同になる','2つの三角形は合同である','合同です']],['suken-4-39','ng',['相似','同じ']],
['suken-4-47','ok',['正しくない','誤り','まちがい','正しくありません']],['suken-4-47','ng',['正しい']],
['suken-4-28','ok',['-2≦y≦8','−2≦y≦8','-2<=y<=8','-2≤y≤8']],['suken-4-28','ng',['-2≦y≦4','2≦y≦8','-2<y<8']],
['suken-4-24','ok',['(10-2x)/5','2-2x/5','-2x/5+2','2-(2/5)x']],['suken-4-24','ng',['(10-2x)','10-2x/5','(10+2x)/5']],
['suken-4-12','ok',['-8x^2','−8x²']],['suken-4-12','ng',['8x^2','-8x','-8x^3']],
['suken-4-21','ok',['5、1','5,1']],['suken-4-21','ng',['1、5','5、-1']],
['suken-4-44','ok',['7、5','7,5']],['suken-4-44','ng',['5、7']],
['suken-3-7','ok',['(x-6)(x+4)','(x−6)(x+4)','(x+4)(x−6)','(x+4)(x-6)']],['suken-3-7','ng',['x^2-2x-24','(x+6)(x-4)']],
['suken-3-9','ok',['3(x-2)^2','3(x−2)²','3(x-2)(x-2)']],['suken-3-9','ng',['(3x-6)(x-2)','3(x^2-4x+4)','(x-2)^2']],
['suken-3-14','ok',['3、4','4、3','3,4','x=3、4','x=3,4']],['suken-3-14','ng',['3','4','3、-4']],
['suken-3-27','ok',['3、-7','-7、3','3,−7']],['suken-3-27','ng',['-3、7','3']],
['suken-3-18','ok',['0≦y≦9','0<=y<=9','0≤y≤9']],['suken-3-18','ng',['4≦y≦9','0≦y≦4']],
['suken-3-50','ok',['5.5','11/2']],['suken-3-50','ng',['5','6']],
['rika-5-8','ok',['アイエ','ア、イ、エ','エイア','ア,イ,エ']],['rika-5-8','ng',['アイウエ','アイ','イエ']],
['rika-5-13','ok',['単子葉類','たんしようるい']],['rika-5-13','ng',['双子葉類']],
['rika-5-14','ok',['シダ植物','しだ植物']],['rika-5-14','ng',['コケ植物','種子植物']],
['rika-5-18','ok',['長くなる']],['rika-5-18','ng',['短くなる','変わらない']],
['rika-5-12','ok',['エタノール']],['rika-5-12','ng',['水']],
['rika-5-7','ok',['2.7','2.7g/cm³','2.7g/cm3']],['rika-5-7','ng',['27','0.37']],
['rika-5-10','ok',['20','20%','20％']],['rika-5-10','ng',['25','125']],
['kanken-4-1','ok',['むじゅん']],['kanken-4-1','ng',['むじゅうん','ほこたて']],
['kanken-4-5','ok',['すこ']],['kanken-4-5','ng',['けん']],
['kanken-4-81','ok',['仰ぐ']],['kanken-4-81','ng',['あおぐ','仰']],
['kanken-4-96','ok',['感、鑑','感→鑑','感,鑑']],['kanken-4-96','ng',['鑑、感','鑑','感、関']],
['kanken-4-71','ok',['白','泊']],['kanken-4-71','ng',['薄']],
['kanken-4-31','ok',['ア']],['kanken-4-31','ng',['イ','ウ']],
['kanken-4-104','ok',['田舎']],['kanken-4-104','ng',['いなか','田中']],
['suken-4-24','ng',['10-2x/5','(10+2x)/5','2+2x/5','2x/5-2']],['suken-5-47','ng',['あり','はい']],['suken-5-43','ng',['(3、-2)','2,3']],['suken-4-39','ng',['相似です','合同でない']],['suken-4-47','ng',['正しいです']],['suken-3-14','ng',['x = 3','x = 3 , 5']],
];
const out=[];let mis=0;
for(const [id,exp,ans] of T){const q=B['kentei-'+id];for(const a of ans){const r=engine.grade(q,a);const good=(exp==='ok')===!!r.correct;if(!good)mis++;out.push({id,exp,answer:a,correct:!!r.correct,partial:!!r.partial,reason:r.reason||'',match:good});}}
fs.writeFileSync(path.join(__dirname,`probe-result-${process.env.DIR||'原本写し'}.json`),JSON.stringify(out,null,1));
for(const o of out)if(!o.match)console.log('不一致',o.id,o.exp,JSON.stringify(o.answer),'→',o.correct?'○':'×',o.reason);
console.log(`試した入力 ${out.length} / 期待とちがう ${mis}`);
