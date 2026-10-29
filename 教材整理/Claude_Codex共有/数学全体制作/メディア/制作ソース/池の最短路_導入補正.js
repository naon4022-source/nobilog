// この1本だけの導入に、抽象図と実際の場面との対応を足す。座標・最短路の条件は変更しない。
(()=>{
 const original=window.SCENE.draw;
 window.SCENE.draw=function(args){
  const state=original.call(this,args);
  if(VIDEO.id!=='M1-C5-S3-VP'||args.i!==0)return state;
  g.fillStyle='#e0f1f8';g.fillRect(190,344,920,190);
  g.strokeStyle='#a5d2e5';g.lineWidth=3;
  for(let j=0;j<3;j++){g.beginPath();g.moveTo(260,390+j*45);g.bezierCurveTo(430,370+j*45,610,410+j*45,820,390+j*45);g.stroke()}
  tx('池',980,470,44,C.blue);tx('岸',1010,316,36,C.green);
  // Aのそばにじょうろ、Bのそばに花壇。本文の条件を絵で対応付ける。
  g.fillStyle='#f4ae58';g.fillRect(340,270,60,38);g.strokeStyle=C.orange;g.lineWidth=4;
  g.beginPath();g.arc(347,287,19,Math.PI/2,Math.PI*1.5);g.stroke();ln(400,280,423,269,C.orange,5);ln(400,290,428,281,C.orange,5);
  tx('出発点',345,180,36,C.blue);
  g.fillStyle='#dcebd8';g.fillRect(755,187,165,55);
  for(let j=0;j<3;j++){const x=780+j*50;ln(x,220,x,195,C.green,4);g.fillStyle='#ef9978';g.beginPath();g.arc(x,190,10,0,Math.PI*2);g.fill()}
  tx('花壇',865,150,36,C.blue);
  tx('岸で水をくんで、花壇へ',640,570,40,C.blue);
  return {...state,context:'池の岸・じょうろ・花壇'};
 };
})();
