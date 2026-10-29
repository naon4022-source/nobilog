// ピザの切り分けと、弧・弦・接線の対応をこのまとめ動画だけに補う。
(()=>{
 const original=window.SCENE.draw;
 window.SCENE.draw=function(args){
  if(VIDEO.id!=='M1-C5-S4-VP')return original.call(this,args);
  if(args.i===0){
   header(VIDEO.title,'考えてみよう');
   const x=640,y=335,r=175;
   g.fillStyle='#efd197';g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();
   g.strokeStyle='#d68b45';g.lineWidth=9;g.stroke();
   for(let j=0;j<6;j++){const a=j*Math.PI/3;ln(x,y,x+r*Math.cos(a),y+r*Math.sin(a),'#bd854d',3);const q=a+Math.PI/6;g.fillStyle='#e38769';g.beginPath();g.arc(x+95*Math.cos(q),y+95*Math.sin(q),17,0,Math.PI*2);g.fill()}
   const a=5*Math.PI/3,k=seg(args.p,.15,.8);ln(x,y,x+r*k*Math.cos(a),y+r*k*Math.sin(a),C.orange,5);
   tx('同じ大きさに切り分ける',640,565,42,C.blue);
   return {id:VIDEO.id,i:0,context:'円形のピザ'};
  }
  const state=original.call(this,args);
  if(args.i===1){
   g.strokeStyle=C.dim;g.lineWidth=2;g.beginPath();g.arc(640,340,175,0,Math.PI*2);g.stroke();
   ln(420,165,870,165,C.green,4);pt(640,165,C.green,7);rightAngle(640,165,1,1);tx('接線',965,175,36,C.green);
  }
  return state;
 };
})();
