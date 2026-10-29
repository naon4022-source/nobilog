// S1-V01専用。2→8と3→12を順に見せ、各出力を止めて読む時間を置く。
function functionBox(k,p){
  const u=clamp((p-.04)/.92,0,1);
  rbox(455,245,370,190,24,'#e9f1fa',C.blue,4);
  tx(k===3?'身長 → 体重':'1辺 → 周の長さ',640,300,36,C.blue);
  tx(k===3?'？':'×4',640,383,64,C.blue);
  if(k===3){
    card('同じ身長',260,350,260,38);
    card('40kg',990,280,190,44);
    card('50kg',990,450,190,44);
    tx('1つに決まらない',640,530,44,C.orange);
    return {uniqueOutput:false,outputs:[40,50]};
  }
  const n=k===2?(u<.5?2:3):1;
  const q=k===2?(u<.5?u*2:(u-.5)*2):u;
  const enter=k===0?0:clamp(q/.33,0,1);
  card(String(n),250+200*ease(enter),350,130,52);
  if(k>0&&q>.35){
    const leave=clamp((q-.35)/.4,0,1);
    card(String(n*4),840+190*ease(leave),350,130,52,C.green);
  }
  tx('y＝4x',640,530,48,C.blue);
  return {uniqueOutput:true,input:n,output:n*4,outputVisible:k>0&&q>.35};
}
