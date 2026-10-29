// Candidate-only scene. The shared engine supplies the approved Nobi and captions.
const source = window.META;
// Override caption layout only in this candidate page. Keep every source character.
function caption(s,alpha=1){
 if(!s)return;
 const size=36,max=1120,leading='、。，．！？?!）)]」』】〉》…ー',trailing='（([「『【〈《';
 let lines=[s];
 if(tw(s,size)>max){
  const candidates=[];
  for(let k=1;k<s.length;k++)if(!leading.includes(s[k])&&!trailing.includes(s[k-1])&&tw(s.slice(0,k),size)<=max&&tw(s.slice(k),size)<=max)candidates.push(k);
  const natural=candidates.filter(k=>'、。！？!?」』'.includes(s[k-1])),pool=natural.length?natural:candidates;
  if(!pool.length)throw Error('caption cannot fit two lines');
  const cut=pool.reduce((a,b)=>Math.abs(tw(s.slice(0,a),size)-tw(s.slice(a),size))<=Math.abs(tw(s.slice(0,b),size)-tw(s.slice(b),size))?a:b);
  lines=[s.slice(0,cut),s.slice(cut)];
 }
 if(lines.join('')!==s)throw Error('caption content changed');
 window.lastCandidateCaption={source:s,lines:[...lines]};
 g.globalAlpha=alpha;const h=lines.length*50+26;
 rbox(64,HT-h-14,W-128,h,22,'rgba(255,255,255,.96)','#c9d6e8',2);
 lines.forEach((line,k)=>text(line,W/2,HT-h-14+50+k*50,size,C.ink,'center',700));g.globalAlpha=1;
}
const sceneColors = {intro:'#e8f0fa',problem:'#e8f0fa',step:'#fff6e8',answer:'#e6f5ec',point:'#fff8d6',pt:'#e8f0fa',tip:'#fff8d6',caution:'#fdecee',end:'#e6f5ec',title:'#e8f0fa'};
function sourceLines(value,width,size){
 const result=[];let line='';
 for(const ch of value){
  if(line&&tw(line+ch,size,700)>width&&!'、。）」』！？'.includes(ch)){
   let cut=-1;for(let i=line.length-1;i>=Math.floor(line.length*.45);i--)if('、。：」'.includes(line[i])){cut=i+1;break;}
   if(cut>0){result.push(line.slice(0,cut));line=line.slice(cut);}else{result.push(line);line='';}
  }
  line+=ch;
 }
 if(line)result.push(line);return result;
}
function sourceText(value,x,y,width,height,max=42){
 let size=max,lines=sourceLines(value,width,size);
 while(size>26&&lines.length*size*1.34>height){size--;lines=sourceLines(value,width,size);}
 if(lines.length*size*1.34>height)throw Error('candidate source text exceeds scene');
 lines.forEach((line,k)=>text(line,x,y+size+k*size*1.34,size,C.ink,'left',700));
}
function bodyText(value,role){
 const prefixes={problem:'問題はこれ。',answer:'答えは、',point:'ポイントは、',tip:'かんたんにやるコツ。',caution:'気をつけて！'};
 const prefix=prefixes[role];return prefix&&value.startsWith(prefix)?value.slice(prefix.length):value;
}
window.SCENE={caption:true,draw({t,step}){
 const logical=source.steps[step.sceneIndex],role=logical.role;
 const progress=clamp((t-step.sceneStart)/Math.max(.001,step.sceneEnd-step.sceneStart),0,1);
 const a=seg(progress,0,.12),offset=(1-a)*18;
 header(source.title,source.kind==='VP'?'国語・まとめ':'国語・例題');
 g.globalAlpha=a;
 const steps=source.steps.map((s,i)=>[s,i]).filter(([s])=>s.role==='step');
 if(role==='step'){
  steps.forEach(([s,i],k)=>{
   if(i>step.sceneIndex)return;
   const y=125+k*132,active=i===step.sceneIndex;
   rbox(80,y+offset,1000,112,22,active?'#fff6e8':'#ffffff',active?C.orange:'#c9d6e8',active?5:2);
   g.fillStyle=active?C.orange:C.blue;g.beginPath();g.arc(52,y+56+offset,23,0,Math.PI*2);g.fill();
   text(String(k+1),52,y+66+offset,30,'#fff','center',800);
   sourceText(s.say,110,y+12+offset,940,86,36);
  });
 }else{
  rbox(60,122+offset,1040,404,26,sceneColors[role]||'#fff',role==='answer'?C.green:C.blue,3);
  const label={problem:'読む文章',answer:'例題の答えと根拠',point:'文末だけで決めない',tip:'確かめるコツ',caution:'気をつけよう',pt:'この節のポイント'}[role];
  if(label)text(label,88,165+offset,29,role==='answer'?C.green:C.blue,'left',800);
  sourceText(bodyText(logical.say,role),88,(label?188:155)+offset,984,label?306:340,role==='problem'||role==='answer'?36:44);
 }
 g.globalAlpha=1;
 nobi(1180,466,.72,{t,wave:role==='intro'||role==='title'||role==='end',point:role==='step'||role==='point'||role==='tip'});
}};
