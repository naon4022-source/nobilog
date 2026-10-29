// M1-C4-S2-VPのみ。原稿の「段数は0以上の整数・点は飛び飛び」を維持する。
const stairDomainOriginalDraw=SCENE.draw.bind(SCENE);
SCENE.draw=function(ctx){
  if(VIDEO.id==='M1-C4-S2-VP'&&ctx.i===4){
    header(VIDEO.title,'順に見よう');
    const state=proportionGraph(3,1,16);
    tx('段数 x は0以上の整数',365,175,32,C.dim);
    tx('点は飛び飛び',365,225,36,C.blue);
    return {...state,id:VIDEO.id,i:ctx.i,integerDomain:true,connected:false};
  }
  return stairDomainOriginalDraw(ctx);
};
