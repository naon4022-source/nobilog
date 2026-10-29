// 数学の数値は依頼書の指定。時間は音声の1文に合わせ、各動作後に停止する。
function ln(x,y,a,b,col=C.ink,w=3,dash=[]){g.strokeStyle=col;g.lineWidth=w;g.setLineDash(dash);g.beginPath();g.moveTo(x,y);g.lineTo(a,b);g.stroke();g.setLineDash([])}
function pt(x,y,col=C.blue,r=12){g.fillStyle=col;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill()}
function tx(s,x,y,size=40,col=C.ink){text(s,x,y,size,col,'center')}
function card(s,x,y,w=190,size=48,col=C.blue){rbox(x-w/2,y-50,w,86,15,C.card,col,3);tx(s,x,y+9,size,col)}
function bigFrac(n,d,x,y,size=44,col=C.ink){text(n,x,y-8,size,col,'center',800);const w=Math.max(tw(n,size,800),tw(d,size,800))+24;g.fillStyle=col;g.fillRect(x-w/2,y,w,4);text(d,x,y+size+4,size,col,'center',800)}
function nline(lo=-5,hi=5,y=380,labels=[-4,0,4]){const x=n=>150+(n-lo)*980/(hi-lo);ln(130,y,1150,y);for(let n=lo;n<=hi;n++){ln(x(n),y-9,x(n),y+9,n===0?C.blue:C.dim,n===0?5:2);if(labels.includes(n))tx(String(n).replace('-','−'),x(n),y+51,32)}return x}
function thermometer(cx,v){ln(cx,175,cx,420,C.dim,26);ln(cx,420,cx,260-v*25,C.blue,16);pt(cx,432,C.blue,23);for(let n=-5;n<=3;n++){ln(cx-25,260-n*25,cx+25,260-n*25,C.ink,2);if(n===0)tx('0',cx-58,272,32)}tx(String(v).replace('-','−')+'℃',cx,497,48,C.blue)}
function movingArrow(a,y,b,p,dotted=false){g.setLineDash(dotted?[12,8]:[]);arrow(a,y,a+(b-a)*p,y,C.orange,6);g.setLineDash([])}
function summary(a,b=''){rbox(110,175,1060,348,24,'#edf4fb');tx('まとめ',640,244,36,C.blue);tx(a,640,345,48);if(b)tx(b,640,442,36,C.blue)}
function jumping(x,from,to,p,show=false,unit=1){const count=Math.round(Math.abs(to-from)/unit),u=count*seg(p,.12,.82),k=Math.floor(u),f=u-k,dir=Math.sign(to-from);for(let j=0;j<k;j++){const a=x(from+dir*j*unit),b=x(from+dir*(j+1)*unit);g.strokeStyle=C.orange;g.lineWidth=4;g.setLineDash(dir<0?[9,7]:[]);g.beginPath();g.moveTo(a,380);g.quadraticCurveTo((a+b)/2,260,b,380);g.stroke();g.setLineDash([]);if(show)tx(String(j+1),(a+b)/2,270,32,C.orange)}const px=x(from+dir*u*unit),py=380-64*Math.sin(Math.PI*f);pt(px,py,C.green,19);pt(px-9,py-17,C.green,7);pt(px+9,py-17,C.green,7);pt(px-9,py-18,C.ink,2);pt(px+9,py-18,C.ink,2);return {position:from+dir*u*unit,jumps:k}}
function bars(p,answer=false){const values=[18,23,20,17,27],moves=[[4,0,3],[4,2,1],[4,3,2],[1,3,2]],h=values.slice();const u=clamp(p,0,1)*4,step=Math.min(3,Math.floor(u)),q=u>=4?1:u-step;for(let j=0;j<step;j++){const[a,b,k]=moves[j];h[a]-=k;h[b]+=k}const[a,b,k]=moves[step],old=h[a];if(p>0){h[a]-=k;if(q>=1)h[b]+=k}ln(190,350,1090,350,C.dim,3,[10,7]);tx('基準20',1150,338,32,C.blue);for(let j=0;j<5;j++){const x=250+j*170,y=510-h[j]*8;rbox(x-40,y,80,h[j]*8,3,j%2?'#83b6df':'#9ccfb5',C.ink,2);if(p===0)tx(String(values[j]),x,y-15,36);tx(String.fromCharCode(65+j),x,550,32)}if(p>0&&q<1){const px=(250+a*170)*(1-q)+(250+b*170)*q,py=(510-old*8)*(1-q)+(510-(h[b]+k)*8)*q-60*Math.sin(Math.PI*q);rbox(px-40,py,80,k*8,3,C.orange,C.ink,2)}if(answer&&p>=1)tx('平均＝20＋5÷5＝21',640,200,48,C.blue);return {total:105,heights:h}}
window.SCENE={draw({i,p}){
 const id=VIDEO.id,last=VIDEO.steps.length-1;header(VIDEO.title,i===last?'まとめ':i===0?'考えてみよう':'順に見よう');
 if(i===last){summary(...VIDEO.summary);return {summary:true};}
 const u=i===0?0:seg(p,.12,.82);let state={id,i};
 if(id==='M1-C1-S1-V01'){
  const values=['−7','0.4','0','+3','−1/2','+6/3'],nums=[-7,.4,0,3,-.5,2];
  ['符号は？','整数？','0？'].forEach((s,j)=>{rbox(135+j*355,180,300,74,14,'#eaf2fb');tx(s,285+j*355,228,34,C.blue)});
  ['正の数','0','負の数'].forEach((s,j)=>{rbox(135+j*355,335,300,115,14,'white',C.dim,2);tx(s,285+j*355,368,32)});
  ['整数','自然数'].forEach((s,j)=>{rbox(360+j*310,465,260,75,14,'#edf5ef',C.green,2);tx(s,490+j*310,513,34,C.green)});
  if(i===0){values.forEach((s,j)=>tx(s,180+j*185,307,48,C.blue));return state;}
  const k=i-1,n=nums[k],dest=n>0?285:n===0?640:995;
  const travel=seg(p,.08,.55),gate=Math.min(2,Math.floor(travel*3)),drop=seg(p,.55,.82);
  if(drop<1){const x=(200+travel*795)*(1-drop)+dest*drop;card(k===5&&travel>.45?'2':values[k],x,295+140*drop,160,48);ring(285+gate*355,216,145,36);}
  else {card(k===5?'2':values[k],dest,435,135,48);if(Number.isInteger(n)){tx(k===5?'2':values[k],490,458,48,C.blue);if(n>0)tx(k===5?'2':values[k],800,458,48,C.blue)}}
  return {...state,value:n,integer:Number.isInteger(n),natural:n>0&&Number.isInteger(n),arrival:drop===1};
 }
 if(id==='M1-C1-S1-V02'){
  const x=n=>640+n*440;ln(170,380,1110,380);for(let k=-5;k<=5;k++)ln(x(k/5),370,x(k/5),390,C.ink,k===0?5:2);tx('0',x(0),432,32);tx('1',x(1),432,32);
  if(i===0||i===1){tx('0と1の間を見よう',640,176,40);if(i===1){ring(860,340,245,115,C.orange,5);}}
  if(i===2){tx('1÷5＝0.2',640,200,52,C.blue);for(let j=0;j<5;j++){const q=clamp(u*5-j,0,1);ln(x(j/5)+5,288,x(j/5)+5+78*q,288,C.orange,7);if(q===1)tx(String(j+1),x((j+.5)/5),259,32,C.orange)}tx('等しい5つの区間',860,510,36);}
  if(i===3){const j=jumping(x,0,-.6,p,true,.2);state={...state,...j};}
  if(i===4){pt(x(-.6),380,C.green,18);tx('−0.6',x(-.6),290,56,C.blue);tx('左へ3目盛り',820,220,40);}
  return {...state,tick:.2};
 }
 if(id==='M1-C1-S1-V03'){
  ln(190,345,1120,345,C.dim,20);rbox(612,277,76,68,4,'#dfb989',C.ink,2);g.fillStyle=C.blue;g.beginPath();g.moveTo(600,277);g.lineTo(650,232);g.lineTo(700,277);g.fill();tx('家＝0',650,400,36);tx('西',200,315,36);tx('東',1120,315,36);
  if(i>=1){movingArrow(650,190,1010,i===1?u:1);tx('+300m',850,155,48,C.blue);}
  if(i>=2){movingArrow(650,475,410,i===2?u:1,true);tx('−200m',460,536,48,C.blue);}
  return {...state,eastMeters:300,westMeters:-200};
 }
 if(id==='M1-C1-S1-V04'){
  const x=nline();pt(x(0),380,C.ink);if(i<3)tx('0が基準',640,205,40);const q=i===0?0:i===1?u:1;
  ln(x(0),300,x(-4*q),300,C.orange,8,[10,7]);ln(x(0),300,x(4*q),300,C.orange,8);pt(x(-4*q),300,C.orange);pt(x(4*q),300,C.orange);
  if(i>=2){tx('4',x(-2),250,48);tx('4',x(2),250,48);tx('−4',x(-4),500,48,C.blue);tx('+4',x(4),500,48,C.blue);}
  if(i===3)tx('|−4|＝|+4|＝4',640,180,52,C.blue);
  return {...state,left:-4*q,right:4*q,distance:4*q};
 }
 if(id==='M1-C1-S1-V05'){
  const x=n=>1040+n*140;
  if(i===0){thermometer(370,-3.5);thermometer(890,-2);tx('A町',370,146,36);tx('B町',890,146,36);return state;}
  // 数値の札を別の目盛りの上に滑らせず、正しい座標に1点ずつ現す。
  const xa=x(-3.5),xb=x(-2);
  ln(160,380,1100,380);for(let n=-6;n<=0;n++){ln(x(n),370,x(n),390);tx(String(n).replace('-','−'),x(n),435,32)}
  g.save();g.globalAlpha=i===1?u:1;pt(xa,380,C.blue);tx('A町 −3.5℃',xa,300,36,C.blue);g.restore();
  if(i>=2){g.save();g.globalAlpha=i===2?u:1;pt(xb,380,C.green);tx('B町 −2℃',xb,215,36,C.green);g.restore();}
  if(i>=3){movingArrow(x(-3.5),475,x(-2),i===3?u:1);tx('右のほうが大きい',720,538,36,C.blue);}
  if(i===4){tx('−3.5',450,151,48);tx('−2',830,151,48);ln(580,142,700,142-25*u,C.orange,5);ln(580,142,700,142+25*u,C.orange,5);}
  return {...state,comparison:-3.5<-2};
 }
 if(id==='M1-C1-S1-V06'){
  const x=nline(-4,4,380,[-3,0]);
  if(i===0){pt(x(-3),380,C.green,20);tx('−3から出発',640,200,48,C.blue)}
  if(i===1){tx('5大きい → 右へ5',640,190,48,C.blue);state={...state,...jumping(x,-3,2,p,true)};}
  if(i===2){pt(x(2),380,C.green,20);tx('2',x(2),310,52,C.blue);tx('−3から5つ右',640,200,42);}
  if(i===3){pt(x(2),380,C.green,20);const q=seg(p,.15,.75);g.save();g.translate(640,215);g.scale(Math.max(.03,Math.abs(Math.cos(Math.PI*q))),1);card(q<.5?'−4大きい':'4小さい',0,0,470,48);g.restore();}
  if(i===4){tx('4小さい → 左へ4',640,190,48,C.blue);state={...state,...jumping(x,2,-2,p,true)};}
  return {...state,finalAnswerLabel:false};
 }
 if(id==='M1-C1-S1-VP'){
  const x=i===1?(n=>550+(n+5)*55):nline();if(i===0){['温度','数直線','絶対値','大小','移動'].forEach((s,j)=>card(s,172+j*234,200,200,32));return state;}
  if(i===1){thermometer(260,-3);ln(535,380,1120,380);for(let n=-5;n<=5;n++){ln(x(n),370,x(n),390);if(n%5===0)tx(String(n).replace('-','−'),x(n),432,32)}pt(x(-3),380,C.blue);tx('0より下 → 負の数',820,200,44,C.blue)}
  if(i===2){pt(x(-3),380,C.blue);tx('右が正、左が負',640,220,48,C.blue);movingArrow(x(0),305,x(-3),u,true)}
  if(i===3){ln(x(0),280,x(-4*u),280,C.orange,8,[10,7]);ln(x(0),280,x(4*u),280,C.orange,8);tx('絶対値＝0からの距離',640,180,48,C.blue);tx('どちらも4',640,520,40)}
  if(i===4){pt(x(-3),380);pt(x(-2),380,C.green);movingArrow(x(-3),290,x(-2),u);tx('−3＜−2',640,200,52,C.blue)}
  if(i===5){tx('大きい → 右へ',640,200,48,C.blue);state={...state,...jumping(x,-3,2,p,false)}}
  return state;
 }
 if(id==='M1-C1-REVIEW-V01'){
  if(i===0){['大小','移動','計算','平均'].forEach((s,j)=>card(s,230+j*270,230,240,36));const x=nline();pt(x(0),380);return state;}
  if(i===1){thermometer(300,-3.5);const x=n=>550+(n+5)*55;ln(535,380,1120,380);for(let n=-5;n<=5;n++){ln(x(n),370,x(n),390);if(n%5===0)tx(String(n).replace('-','−'),x(n),432,32)}pt(x(-3.5),380);tx('0を基準にする',800,200,44,C.blue)}
  if(i===2){const x=nline();pt(x(-3.5),380);pt(x(-2),380,C.green);movingArrow(x(-3.5),280,x(-2),u);tx('−3.5＜−2',640,200,52,C.blue)}
  if(i===3){const x=nline();tx('−3より5大きい',640,200,48,C.blue);state={...state,...jumping(x,-3,2,p,false)}}
  if(i===4){const x=nline(-10,6,380,[-10,-5,0,5]);tx('(−9)−(−14) → (−9)+(+14)',640,185,48,C.blue);movingArrow(x(-9),285,x(5),u);pt(x(-9+14*u),380);if(u===1)tx('5',x(5),510,48,C.blue);}
  if(i===5)state={...state,...bars(u,true)};
  return state;
 }
 throw Error('未定義の場面 '+id);
}};
