// Candidate-only scene. The shared engine supplies the approved Nobi and captions.
const source = window.META;
// Keep the full long section title clear of the subject badge.
function header(title,chip){
 const chipWidth=tw(chip,32,800)+44,chipLeft=W-28-chipWidth;
 let size=34;while(size>26&&tw(title,size,800)>chipLeft-76)size--;
 if(tw(title,size,800)>chipLeft-76)throw Error('chapter2 title overlaps badge');
 rbox(28,18,tw(title,size,800)+48,64,18,'#e8f0fa');text(title,52,62,size,C.blue,'left',800);
 rbox(chipLeft,18,chipWidth,64,18,C.orange);text(chip,chipLeft+chipWidth/2,62,32,'#fff','center',800);
 window.headerGeometry={titleRight:52+tw(title,size,800),chipLeft,size};
}
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
 if(role==='pt'&&step.sceneIndex===1){
  const rows=[['頭括型',['結論','理由']],['尾括型',['理由','結論']],['双括型',['結論','理由','結論']]];
  rows.forEach(([label,parts],i)=>{
   const y=130+i*128,visible=seg(progress,i*.18,i*.18+.12);
   g.globalAlpha=a*visible;text(label,70,y+52,36,C.blue,'left',800);
   parts.forEach((part,k)=>{
    const x=278+k*260,emphasis=part==='結論';
    rbox(x,y,210,86,20,emphasis?'#fff0d3':'#e8f0fa',emphasis?C.orange:C.blue,3);
    text(part,x+105,y+56,36,C.ink,'center',800);
    if(k<parts.length-1)text('→',x+234,y+56,32,C.blue,'center',800);
   });
  });
 }else if(role==='pt'&&step.sceneIndex===2){
  rbox(60,122+offset,1040,404,26,'#e8f0fa',C.blue,3);
  text('小さい字や、のばす音も確かめよう',88,182+offset,32,C.blue,'left',800);
  ['っ','ん','ー','きゃ','しゅ'].forEach((value,i)=>{
   const x=88+i*193,y=245+offset,active=Math.min(4,Math.floor(progress*5))===i;
   rbox(x,y,170,170,22,active?'#fff0d3':'#fff',active?C.orange:C.blue,active?5:2);
   text(value,x+85,y+74,49,C.ink,'center',800);text('1拍',x+85,y+137,34,C.blue,'center',800);
  });
 }else if(role==='pt'&&step.sceneIndex===3){
  [['アクセント','単語の音の高低'],['イントネーション','文全体の音の高低の変化']].forEach(([label,value],i)=>{
   const y=132+i*190,visible=seg(progress,i*.25,i*.25+.15);g.globalAlpha=a*visible;
   rbox(60,y+offset,1040,156,22,i?'#fff8d6':'#e8f0fa',i?C.orange:C.blue,3);
   text(label,88,y+52+offset,34,C.blue,'left',800);text(value,88,y+112+offset,42,C.ink,'left',800);
  });
 }else if(role==='caution'){
  rbox(60,122+offset,1040,404,26,'#fdecee',C.orange,3);
  text('まちがい例（×）',88,185+offset,32,C.orange,'left',800);
  text('×「きゃ」→ 2拍',110,272+offset,48,C.ink,'left',800);
  const reveal=seg(progress,.28,.48);g.globalAlpha=a*reveal;
  rbox(88,320+offset,944,150,22,'#e6f5ec',C.green,3);
  text('○「きゃ」→ 1拍',112,382+offset,48,C.ink,'left',800);
  text('前の字と合わせて、一つのまとまり',112,438+offset,31,C.green,'left',800);
 }else if(role==='step'){
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
  const label={problem:'読む文章',answer:'例題の答えと根拠',point:'この節のポイント',tip:'確かめるコツ',caution:'気をつけよう',pt:'この節のポイント'}[role];
  if(label)text(label,88,165+offset,29,role==='answer'?C.green:C.blue,'left',800);
  sourceText(bodyText(logical.say,role),88,(label?188:155)+offset,984,label?306:340,role==='problem'||role==='answer'?36:44);
 }
 g.globalAlpha=1;
 nobi(1180,466,.72,{t,wave:role==='intro'||role==='title'||role==='end',point:role==='step'||role==='point'||role==='tip'});
}};
