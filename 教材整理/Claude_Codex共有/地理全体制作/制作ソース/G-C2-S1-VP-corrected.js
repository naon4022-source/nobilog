// One corrected geography movie only; shared engines/templates remain unchanged.
const labels=['熱帯','乾燥帯','温帯','冷帯','寒帯'];
function line(s,x,y,size=40,col=C.ink,align='center'){text(s,x,y,size,col,align,800);}
function card(x,y,w,h,col=C.card){rbox(x,y,w,h,20,col,'#c9d6e8',3);}
function thermometer(x,y,warm,a){
 g.strokeStyle=C.ink;g.lineWidth=5;g.beginPath();g.roundRect(x-15,y,30,160,15);g.stroke();
 g.fillStyle=warm?C.orange:C.blue;g.beginPath();g.arc(x,y+175,26,0,Math.PI*2);g.fill();
 const height=(warm?130:40)*a;g.fillRect(x-9,y+150-height,18,height+18);
}
window.SCENE={caption:true,draw({i,p,t}){
 const a=seg(p,0,.25);hdr('世界の気候と暮らし','地理');
 if(i===0){
  line('気温と雨から、暮らしの工夫を探そう',640,175,46);
  nobi(640,415,1.1,{t,wave:true});
 }else if(i===1){
  line('五つの気候帯を比べよう',640,150,46);
  labels.forEach((s,k)=>{const u=seg(p,k*.07,k*.07+.18),x=64+k*233;g.globalAlpha=u;
   card(x,220+(1-u)*18,220,140,k===1?'#fff6d6':'#e8f0fa');line(s,x+110,305+(1-u)*18,42);g.globalAlpha=1;
  });
  line('気温と、雨の多さ・少なさに注目',640,455,40);
 }else if(i===2){
  line('雨温図は「線」と「棒」を見分ける',640,145,44);
  const xs=[225,385,545,705,865,1025],heights=[70,120,150,190,115,80];
  g.strokeStyle=C.dim;g.lineWidth=4;g.beginPath();g.moveTo(150,225);g.lineTo(150,510);g.lineTo(1120,510);g.stroke();
  xs.forEach((x,k)=>{g.fillStyle=C.sky;g.fillRect(x-33,510-heights[k]*a,66,heights[k]*a);});
  const yy=[370,310,250,220,285,355];g.strokeStyle=C.orange;g.lineWidth=7;g.beginPath();
  xs.forEach((x,k)=>{const y=510-(510-yy[k])*a;k?g.lineTo(x,y):g.moveTo(x,y);});g.stroke();
  line('折れ線＝気温（℃）',380,205,34,C.orange);line('棒＝降水量（mm）',910,205,34,C.blue);
  line('読み方のイメージ',640,555,32);
 }else if(i===3){
  line('その土地で暮らすための工夫',640,160,46);
  ['衣服','食事','住まい','宗教'].forEach((s,k)=>{const u=seg(p,k*.07,k*.07+.2),x=120+k*270;
   g.globalAlpha=u;card(x,250+(1-u)*20,230,140);line(s,x+115,335+(1-u)*20,42);g.globalAlpha=1;
  });
  line('地域ごとの違いと、理由を比べよう',640,480,40);
 }else if(i===4){
  line('極に近づくほど、寒くなる傾向',640,150,46);
  thermometer(260,260,true,a);thermometer(1020,260,false,a);
  line('赤道付近',260,225,38,C.orange);line('極の近く',1020,225,38,C.blue);
  arrow(390,350,890,350,C.blue);line('気温の傾向',640,310,38);
 }else if(i===5){
  line('乾燥帯は「雨」にも注目',640,155,48);
  card(170,230,940,260,'#fff6d6');
  for(let k=0;k<6;k++){g.fillStyle=C.sky;g.fillRect(260+k*145,380-45*a,36,45*a);}
  line('雨が少ない地域',640,445,42);line('気温の並びだけで決めない',640,545,36);
 }else{
  line('気温と雨から、暮らしを考えよう！',640,160,46);
  nobi(640,410,1.1,{t,wave:true});
 }
 g.globalAlpha=1;
}};
