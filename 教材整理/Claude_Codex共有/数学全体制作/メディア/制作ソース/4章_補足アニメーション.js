// 対象3動画だけの補足。原稿の式・字幕・音声と主グラフは変更しない。
const chapter4OriginalDraw=SCENE.draw.bind(SCENE);
function chapter4Walker(x,q){
  g.strokeStyle=C.orange;g.lineWidth=5;
  g.beginPath();g.arc(x,305,12,0,2*Math.PI);g.stroke();
  const foot=12*Math.sin(q*Math.PI*12);
  ln(x,317,x,344,C.orange,5);
  ln(x,328,x-16,338,C.orange,5);
  ln(x,328,x+16,336,C.orange,5);
  ln(x,344,x-foot,360,C.orange,5);
  ln(x,344,x+foot,360,C.orange,5);
}
SCENE.draw=function(ctx){
  const {i,p}=ctx,id=VIDEO.id;
  if(id==='M1-C4-S3-VP'&&i===1){
    header(VIDEO.title,'順に見よう');
    return {id,i,...cookie(3,p)};
  }
  if(id==='M1-C4-S4-VP'&&(i===2||i===3||i===4)){
    header(VIDEO.title,'順に見よう');
    const u=clamp((p-.04)/.92,0,1);
    if(i===2){
      tx('速さ×時間＝同じ道のり',640,175,46,C.blue);
      const fast=u>=.55;
      const progress=fast?clamp((u-.55)/.275,0,1):clamp(u/.55,0,1);
      tx(fast?'速さ 2v':'速さ v',640,245,44,C.blue);
      ln(250,360,1030,360,C.dim,4);
      tx('出発',250,415,32);tx('到着',1030,415,32);
      chapter4Walker(250+780*progress,progress);
      tx(fast?'時間 t/2':'時間 t',320,510,38,C.blue);
      rbox(500,470,fast?220:440,45,8,C.sky,C.blue,3);
      return {id,i,distance:780,speedFactor:fast?2:1,timeFactor:fast?.5:1,position:progress};
    }
    if(i===3){
      tx('人数×日数＝同じ仕事の量',640,175,44,C.blue);
      tx('1人の作業量は同じ',640,230,32,C.dim);
      for(let j=0;j<4;j++){
        const alpha=j<2?1:clamp((u-(j-2)*.22)/.22,0,1);
        g.save();g.globalAlpha=alpha;
        const x=320+j*210;
        g.beginPath();g.arc(x,295,18,0,2*Math.PI);g.fillStyle=C.blue;g.fill();
        rbox(x-25,325,50,70,12,C.sky,C.blue,3);
        g.restore();
      }
      const q=clamp((u-.44)/.56,0,1);
      tx(u<.44?'2人 → 4人':'4人',640,445,40,C.blue);
      tx(q===0?'日数 d':q===1?'日数 d/2':'日数が短くなる',300,535,36,C.blue);
      rbox(570,485,420*(1-.5*ease(q)),45,8,C.sky,C.blue,3);
      return {id,i,peopleBefore:2,peopleAfter:4,daysBefore:1,daysAfter:.5};
    }
    rbox(180,230,430,245,22,'#e9f1fa',C.blue,3);
    rbox(670,230,430,245,22,'#edf6ef',C.green,3);
    tx('比例',395,305,48,C.blue);tx('y÷x＝一定',395,395,44,C.blue);
    tx('反比例',885,305,48,C.green);tx('xy＝一定',885,395,44,C.green);
    return {id,i,ratioInvariant:true,productInvariant:true};
  }
  if(id==='M1-C4-S3-V02'&&i===4){
    header(VIDEO.title,'順に見よう');
    const state={id,i,...inverseGraph(2,p)};
    const px=1060,py=350-(12/12)*(195/12);
    pt(px,py,C.orange,8);
    ln(px,py,px,350,C.orange,3,[7,5]);
    // 主グラフの値は保ち、軸との距離だけを別の縮尺で拡大する。
    const zoom=1+2*seg(p,.12,.82),base=285,top=base-20*zoom;
    rbox(210,130,360,195,18,C.card,C.orange,3);
    tx('すき間を拡大',390,175,36,C.orange);
    ln(270,base,510,base,C.ink,3);
    pt(390,top,C.orange,9);
    ln(390,top,390,base,C.orange,3,[7,5]);
    tx('y＞0（縮尺は別）',390,315,32,C.orange);
    return {...state,zoomFactor:zoom,positiveGap:true};
  }
  return chapter4OriginalDraw(ctx);
};
