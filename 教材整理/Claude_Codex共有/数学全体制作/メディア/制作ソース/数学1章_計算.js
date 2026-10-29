// 教材の指定値で、1文ごとの計算操作を描く。答えを隠す動画は途中式まで。
function particle(s,x,y,alpha=1){g.save();g.globalAlpha=alpha;pt(x,y,s==='+'?C.blue:C.green,31);tx(s,x,y+16,48,'white');g.restore()}
function calculations(id,k,p){const u=k===0?0:seg(p,.12,.82);let state={id,k};
 if(id==='M1-C1-S2-V01'){
  tx('(+2)+(−5)',640,153,56,C.blue);
  const stage=k===0?0:k===1?u:k===2?1+u:2;
  for(let j=0;j<2;j++){const q=clamp(stage-j,0,1),a=1-seg(q,.38,.57),move=Math.min(1,q/.72);particle('+',370+j*470+(350+j*170-(370+j*470))*move,260+90*move,a);particle('−',350+j*170,420-70*move,a);if(q>.72&&q<1){ring(350+j*170,350,36+45*(q-.72)/.28,36+45*(q-.72)/.28,C.orange,4);tx('0',350+j*170,366,48,C.orange)}}
  for(let j=2;j<5;j++)particle('−',350+j*170,420);
  if(k>=3)tx('−3',640,260,64,C.blue);return {...state,result:-3};
 }
 if(id==='M1-C1-S2-V02'){
  if(k<=1){const q=k===0?0:u;tx('(−9)',390,235,60);tx(q<.5?'(−14)':'(+14)',875,235,60);g.save();g.translate(645,219);g.scale(Math.max(.035,Math.abs(Math.cos(Math.PI*q))),1);card(q<.5?'−':'+',0,0,230,60);g.restore();}
  else tx('(−9)+(+14)',640,165,60,C.blue);
  const x=nline(-10,6,400,[-10,-5,0]);const q=k<3?0:k===3?u:1;pt(x(-9),400,C.ink);if(k>=3){movingArrow(x(-9),290,x(5),q);pt(x(-9+14*q),400,C.green);tx('右へ14',640,240,48,C.blue)}
  // 到着した答えは、短い確認場面の先頭だけ。まとめでは表示しない。
  if(k===4&&p<.22)tx('5',x(5),505,56,C.blue);return {...state,resultVisible:k===4&&p<.22};
 }
 if(id==='M1-C1-S2-V03'){
  const vals=[-8,15,-11,3],sx=[220,500,780,1060],dx=[840,290,1020,460];
  tx('−8+15−11+3',640,151,56,C.blue);rbox(140,330,420,190,18,'#edf4fb',C.blue);rbox(720,330,420,190,18,'#eef5ee',C.green);tx('正のチーム',350,496,36,C.blue);tx('負のチーム',930,496,36,C.green);
  if(k<=4){vals.forEach((v,j)=>{const q=k===0?0:j<k-1?1:j===k-1?u:0;card(v>0?'+'+v:String(v).replace('-','−'),sx[j]+(dx[j]-sx[j])*q,240+145*q-55*Math.sin(Math.PI*q),140,48,v>0?C.blue:C.green)})}
  else {card('+18',350,399,210,60,C.blue);card('−19',930,399,210,60,C.green);if(k===6){movingArrow(470,270,620,u);movingArrow(810,270,660,u,true);tx('(+18)+(−19)',640,216,56,C.blue)}}
  return {...state,positive:18,negative:-19,finalAnswerVisible:false};
 }
 if(id==='M1-C1-S2-V04'){
  tx('かける数を1減らす → 積は3増える',640,134,36,C.blue);
  const nums=[3,2,1,0,-1],count=k===0?1:Math.min(5,k+1);
  for(let j=0;j<count;j++){const q=k>0&&j===count-1?u:1,y=215+j*64-16*(1-q);g.save();g.globalAlpha=q;tx('(−3)×'+(nums[j]<0?'(−1)':nums[j]),460,y,48);tx('＝',690,y,48);tx(String(-3*nums[j]).replace('-','−'),825,y,48,C.blue);if(j>0){arrow(940,y-52,940,y-5,C.orange,4);tx('+3',1030,y-15,32,C.orange)}g.restore();if(j===count-1&&k>0)ring(640,y-18,305,29,C.orange,4)}
  return {...state,multipliers:nums.slice(0,count),products:nums.slice(0,count).map(n=>-3*n)};
 }
 if(id==='M1-C1-S2-V05'){
  tx('(−12)÷(−4)＝□',640,159,56,C.blue);
  if(k===0){card('3',410,310,200,56);card('−3',870,310,200,56);tx('□×(−4)＝−12',640,450,56);}
  if(k===1||k===2){rbox(330,300,200,86,15,'#edf4fb',C.dim,3);card(k===2?'−3':'3',1120-690*u,350+110*Math.sin(Math.PI*u),160,56);tx('×(−4)＝？',790,359,56);}
  if(k>=3){rbox(105,260,515,210,18,'#edf5ef',C.green);rbox(660,260,515,210,18,'white',C.dim);tx('3×(−4)＝−12',362,340,48,C.green);tx('(−3)×(−4)＝12',917,340,48);tx('○',362,428,60,C.green);tx('×',917,428,60,C.red)}
  return {...state,validAnswer:3};
 }
 if(id==='M1-C1-S2-V06'){
  if(k<=1){tx('18',285,286,60);tx('×',910,286,56);frac('−2','3',1020,252,48);const q=k===0?0:u;g.save();g.translate(620,275);g.scale(Math.max(.035,Math.abs(Math.cos(Math.PI*q))),1);if(q<.5)card('÷(−4)',0,0,400,56);else{card('',0,0,400,56);tx('×',-100,15,56);frac('−1','4',65,-22,48)}g.restore();}
  else {tx('18',280,290,56);tx('×',435,290,56);frac('1','4',580,256,48);tx('×',750,290,56);frac('2','3',900,256,48);tx('負の数が2個 → 符号は＋',640,163,44,C.blue);if(k>=3){ln(258,270,310,310,C.orange,5);ln(879,297,924,346,C.orange,5);tx('6',330,236,48,C.orange);tx('1',962,337,48,C.orange)}if(k>=4){ln(558,298,603,346,C.orange,5);ln(879,220,924,270,C.orange,5);tx('2',645,337,48,C.orange);tx('1',962,218,48,C.orange)}tx('約分してからかける',640,476,40,C.blue)}
  return {...state,negativeCount:2,finalAnswerVisible:false};
 }
 if(id==='M1-C1-S2-V07'){
  const forms=['7−(−4)×3','7−(−4)×3','7−(−12)','7+12'];tx(forms[Math.min(k,3)],640,325,64,C.blue);
  tx('① かけ算',865,191,36);tx('② ひき算',370,191,36);
  if(k===1)ring(790,300,210,56,C.orange,5+u*2);if(k===2||k===3)ring(640,300,350,56,C.orange,5);
  return {...state,order:['multiplication','subtraction'],finalAnswerVisible:false};
 }
 if(id==='M1-C1-S2-V08'){
  if(k<=1){tx('47×',350,305,60,C.blue);tx('(−8)',505,305,60,C.blue);tx('+',640,305,60,C.blue);tx('53×',775,305,60,C.blue);tx('(−8)',930,305,60,C.blue);if(k===1){ring(505,286,108,51);ring(930,286,108,51);ln(505,405,505+(640-505)*u,405,C.orange,6);ln(930,405,930+(640-930)*u,405,C.orange,6)}}
  else {tx(k===2?'(47+53)×(−8)':'100×(−8)',640,308,64,C.blue);if(k===2){card('47+53',320+320*u,440,320,48);}}
  return {...state,commonFactor:-8,finalAnswerVisible:false};
 }
 if(id==='M1-C1-S2-V09'){
  rbox(80,135,1120,405,16,'white',C.ink,3);rbox(120,195,800,310,12,'#edf5ef',C.green,3);rbox(155,258,450,220,12,'#eaf2fb',C.blue,3);tx('数全体',1080,178,34);tx('整数',835,242,34,C.green);tx('自然数',380,310,34,C.blue);
  if(k<=2){tx('3−5',360,350,52,C.blue);if(k>0){const q=k===1?u:1;card('−2',430+335*q,450-105*q,145,52,C.orange)}}
  else {tx('3÷2',680,308,52,C.green);card('1.5',680+365*u,395+45*u,165,52,C.orange)}
  return {...state,naturalSubtraction:-2,integerDivision:1.5};
 }
 if(id==='M1-C1-S2-V10'){
  const prime=[2,2,3,3,5],value=[180,90,45,15,5,1],count=k===0?0:Math.min(k,5);tx('180',565,180,48,C.blue);
  for(let j=0;j<count;j++){const q=j===count-1&&k<6?u:1,y=180+j*62;tx(String(prime[j]),375,y,48,C.blue);ln(435,y-40,435,y+20,C.ink,3);ln(435,y+20,640,y+20,C.ink,3);g.save();g.globalAlpha=q;tx(String(value[j+1]),565,y+62-10*(1-q),48);g.restore()}
  if(k>=6){tx('2×2×3×3×5',930,270,48,C.blue);tx('2²×3²×5',930,380,56,C.blue)}
  return {...state,primeFactors:prime,ladder:value,product:180};
 }
 throw Error('未定義 '+id);
}
window.SCENE={draw({i,p}){const id=VIDEO.id,last=VIDEO.steps.length-1;header(VIDEO.title,i===last?'まとめ':i===0?'考えてみよう':'順に見よう');if(i===last){summary(...VIDEO.summary);return {summary:true};}
 if(id==='M1-C1-S2-VP'){
  const list=[['M1-C1-S2-V01',0],['M1-C1-S2-V01',1],['M1-C1-S2-V01',2],['M1-C1-S2-V02',1],['M1-C1-S2-V04',4],['M1-C1-S2-V06',1],['M1-C1-S2-V07',1]];
  const [sub,k]=list[i];return calculations(sub,k,p);
 }
 if(id==='M1-C1-S3-V01'){
  const u=i===0||i===1?0:i===6?1:(i-2+seg(p,.12,.82))/4,state=bars(u,false);if(i===1)ring(640,350,460,20,C.orange,5);return {...state,answerVisible:false};
 }
 if(id==='M1-C1-S3-VP'){
  if(i<=1)return bars(i===0?0:seg(p,.12,.82),false);
  const d=['−2','+3','0','−3','+7'];if(i<=3){tx('20を基準に、ちがいを考える',640,175,40,C.blue);d.forEach((s,j)=>card(s,170+j*235,300,185,48));if(i===2){const j=Math.min(4,Math.floor(seg(p,.12,.82)*5));ring(170+j*235,300,94,48)}else tx('(−2)+(+3)+0+(−3)+(+7)＝+5',640,464,48,C.blue);return {differences:[-2,3,0,-3,7],sum:5};}
  tx('ちがいの平均：+5÷5＝+1',640,249,48,C.blue);tx('平均＝基準＋ちがいの平均',640,353,48);tx('20+(+1)＝21',640,464,56,C.blue);return {mean:21};
 }
 return calculations(id,i,p);
}};
