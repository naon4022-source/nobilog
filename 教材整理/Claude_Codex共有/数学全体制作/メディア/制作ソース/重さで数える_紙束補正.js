// S4-V01専用。紙束をのせる動きと、枚数から重さへの対応を順に見せる。
function paper(k,p){
  const u=seg(p,.12,.82);
  const landing=k===0||k===3;
  const drop=landing?-150*(1-clamp(u/.65,0,1)):0;
  const mass=k===2?null:k===3?1800:1000;
  const count=k===2?null:k===3?450:250;
  rbox(260,450,400,100,20,'#dce5ee',C.ink,3);
  g.save();g.translate(0,drop);
  for(let j=0;j<(k===3?9:6);j++){
    rbox(300+j*6,400-j*9,290,25,3,'white',C.dim,2);
  }
  g.restore();
  if(k===0){
    card(u<.65?'？g':'1000g',460,518,300,44);
    tx('何枚ある？',875,285,48,C.blue);
  }
  if(k===1){
    card('1000g',460,518,300,44);
    tx('250枚',460,295,42,C.blue);
    tx('1000÷250＝4g',880,300,44,C.blue);
    tx('1枚の重さ',880,360,36,C.dim);
  }
  if(k===2){
    card('4x g',460,518,300,44);
    tx('x枚',460,295,42,C.blue);
    tx('重さ＝4x',880,300,52,C.blue);
    movingArrow(690,400,1070,u);
    tx('枚数 → 重さ',880,465,36,C.dim);
  }
  if(k===3){
    card(u<.65?'？g':'1800g',460,518,300,44);
    if(u>=.65){
      tx('1800÷4＝450枚',880,300,44,C.blue);
      tx('1枚4gを使って求める',880,360,36,C.dim);
    }
  }
  return {unitGrams:4,paperCount:count,totalGrams:mass,landed:!landing||u>=.65};
}
