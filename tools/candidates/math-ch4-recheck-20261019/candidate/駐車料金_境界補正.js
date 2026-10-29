// 採用済みM1-C4-S1-D02の開点に合わせ、駐車時間0分をこの料金図の変域から除く。
const parkingBoundaryOriginalDraw=SCENE.draw.bind(SCENE);
SCENE.draw=function(ctx){
  const {i,p}=ctx,id=VIDEO.id;
  if(id==='M1-C4-S1-VP'&&i===4){
    header(VIDEO.title,'順に見よう');
    tx('30分ごとに100円',640,170,48,C.blue);
    ln(220,350,1060,350);ln(220,340,220,360);ln(1060,340,1060,360);
    g.fillStyle=C.bg;g.strokeStyle=C.blue;g.lineWidth=4;g.beginPath();g.arc(220,350,9,0,2*Math.PI);g.fill();g.stroke();
    pt(1060,350,C.blue,9);
    tx('0',220,415,36);tx('60分',1060,415,36);tx('例：0＜x≦60',640,245,52,C.blue);
    return {id,i,domainIllustration:[0,60],leftClosed:false,rightClosed:true};
  }
  const state=parkingBoundaryOriginalDraw(ctx);
  if((id==='M1-C4-S1-VP'&&i===3)||(id==='M1-C4-REVIEW-V01'&&i<=1)){
    g.fillStyle=C.bg;g.strokeStyle=C.blue;g.lineWidth=4;g.beginPath();g.arc(250,400,7,0,2*Math.PI);g.fill();g.stroke();
    return {...state,zeroExcluded:true};
  }
  return state;
};
