// 並べ替え済みの図を保って式を示す。円へ戻して式と重ねない。
(()=>{
 const original=window.SCENE.draw;
 window.SCENE.draw=function(args){
  if(VIDEO.id!=='M1-C5-S4-V02'||args.i!==4)return original.call(this,args);
  header(VIDEO.title,'順に見よう');
  const state=rearrangeCircle(3,1);
  tx('r×πr＝πr²',640,215,48,C.blue);
  return {...state,id:VIDEO.id,i:args.i,formulaAboveFigure:true};
 };
})();
