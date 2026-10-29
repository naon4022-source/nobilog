// Candidate-only scene. The shared engine supplies the approved Nobi and captions.
const source = window.META;
// Keep the full long section title clear of the subject badge.
function header(title,chip){
 const chipWidth=tw(chip,28,800)+36,chipLeft=W-24-chipWidth;
 const lines=sourceLines(title,chipLeft-92,26);if(lines.length>2)throw Error('full title cannot fit header');
 rbox(28,14,chipLeft-48,lines.length===2?88:64,16,'#e8f0fa');
 lines.forEach((line,k)=>text(line,48,lines.length===2?48+k*34:57,26,C.blue,'left',800));
 rbox(chipLeft,18,chipWidth,62,16,C.orange);text(chip,chipLeft+chipWidth/2,59,28,'#fff','center',800);
 window.headerGeometry={lines:[...lines],chipLeft,size:26};
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
  if(line&&tw(line+ch,size,700)>width&&!'、。）」』！？!?,.;:'.includes(ch)){
   let cut=-1;for(let i=line.length-1;i>=Math.floor(line.length*.45);i--)if('、。：」・ '.includes(line[i])){cut=i+1;break;}
   if(cut>0){result.push(line.slice(0,cut));line=line.slice(cut);}else{result.push(line);line='';}
  }
  line+=ch;
 }
 if(line)result.push(line);return result;
}
function sourceText(value,x,y,width,height,max=42){
 let size=max,lines=sourceLines(value,width,size);
 while(size>26&&(lines.length*size*1.34>height||lines.some(line=>tw(line,size,700)>width))){size--;lines=sourceLines(value,width,size);}
 if(lines.length*size*1.34>height||lines.some(line=>tw(line,size,700)>width))throw Error('candidate source text exceeds scene');
 lines.forEach((line,k)=>text(line,x,y+size+k*size*1.34,size,C.ink,'left',700));
}
function bodyText(value,role){
 const prefixes={problem:'問題はこれ。',answer:'答えは、',point:'ポイントは、',tip:'かんたんにやるコツ。',caution:'気をつけて！'};
 const prefix=prefixes[role];return prefix&&value.startsWith(prefix)?value.slice(prefix.length):value;
}
// Unit-specific illustrations. Exercises are never substituted for the worked examples.
const RED='#b63a47', GREEN='#287d58', BLUE='#235f9f';
function panel(x,y,w,h,title,body,color=BLUE){
 rbox(x,y,w,h,20,'#fff',color,3);
 text(title,x+20,y+42,32,color,'left',800);
 if(body)sourceText(body,x+20,y+60,w-40,h-80,34);
}
function label(value,y=172,color=BLUE){sourceText(value,88,y-34,984,70,34);}
function tileRow(values,y=260,colors=[],h=130){
 const width=(984-(values.length-1)*16)/values.length;
 values.forEach((value,index)=>{const x=88+index*(width+16),color=colors[index]||BLUE;rbox(x,y,width,h,18,'#fff',color,3);sourceText(value,x+14,y+15,width-28,h-30,36);});
}
function pointer(x1,y1,x2,y2,color=BLUE){
 g.strokeStyle=color;g.lineWidth=4;g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke();
 const angle=Math.atan2(y2-y1,x2-x1);g.beginPath();g.moveTo(x2,y2);g.lineTo(x2-15*Math.cos(angle-.5),y2-15*Math.sin(angle-.5));g.lineTo(x2-15*Math.cos(angle+.5),y2-15*Math.sin(angle+.5));g.closePath();g.fillStyle=color;g.fill();
}
function rain(x,y,width,height,count,t){
 g.strokeStyle='#408ac4';g.lineWidth=count>8?5:3;
 for(let n=0;n<count;n++){const dx=x+18+(n*67)%(width-36),dy=y+((n*41+t*(count>8?130:65))%height);g.beginPath();g.moveTo(dx,dy);g.lineTo(dx-5,Math.min(y+height,dy+18));g.stroke();}
}
function rainComparison(p,t){
 label('音の変化から、雨の様子を読もう');
 panel(88,216,454,274,'ぽつ ぽつ ぽつり','',BLUE);
 panel(574,216,454,274,'ざあざあ ざあ','',BLUE);
 rain(108,286,414,170,5,t);rain(594,286,414,170,18,t);
 pointer(548,350,570,350);
}
function metaphor(p){
 label('まず、何を何にたとえたかを探す');
 panel(88,230,456,244,'たとえの言葉を使う','「ようだ」などを使う → 直喩',BLUE);
 panel(574,230,456,244,'たとえの言葉を使わない','使わずに、別のものにたとえる → 隠喩',GREEN);
}
function effects(p){
 label('技法の名前と、その効果をセットに');
 ['リズム','強調','余韻'].forEach((value,index)=>{g.save();g.globalAlpha*=seg(p,index*.16,index*.16+.18);panel(88+index*328,252,300,164,value,'',index===1?GREEN:BLUE);g.restore();});
 text('技法 ＋ 効果',580,480,42,GREEN,'center',800);
}
function compound(left,right,first,second,result,x,y,reveal){
 panel(x,y,456,272,'熟語を一字ずつ見る','');
 text(left,x+116,y+115,62,BLUE,'center',800);text(right,x+326,y+115,62,BLUE,'center',800);
 text(first,x+116,y+173,32,C.ink,'center',700);text(second,x+326,y+173,32,C.ink,'center',700);
 if(reveal)text(result,x+228,y+234,38,GREEN,'center',800);
}
function compoundRules(p,wrong=false){
 label(wrong?'順番を逆に覚えないでね':'読む順番を、色で見分けよう');
 [['重箱読み','音','訓'],['湯桶読み','訓','音']].forEach(([name,a,b],index)=>{
  const y=232+index*136;panel(88,y,456,112,name,'',index?GREEN:BLUE);
  text(a,660,y+73,48,a==='音'?BLUE:GREEN,'center',800);text('＋',802,y+73,44,C.ink,'center',700);text(b,944,y+73,48,b==='音'?BLUE:GREEN,'center',800);
 });
}
function dictionaryTip(){
 label('一字の意味だけで、決めつけない');
 panel(88,234,456,244,'× 一字だけで判断','意味が通じるかだけでは決めない',RED);
 panel(574,234,456,244,'○ 漢和辞典と熟語','音読み・訓読みを確かめて覚える',GREEN);
}
function conjugation(){
 label('まず、活用する自立語かを確かめる');
 ['ウ段','い','だ'].forEach((value,index)=>{const x=88+index*328;panel(x,232,300,252,['動詞','形容詞','形容動詞'][index],'',index===1?GREEN:BLUE);text(value,x+150,392,52,C.ink,'center',800);});
 text('条件を確かめてから、言い切りの形を見る',580,512,30,BLUE,'center',800);
}
const words=['小さな','犬','が','ゆっくり','歩い','た'];
const types=['連体詞','名詞','助詞','副詞','動詞','助動詞'];
function wordTiles(p,answer){
 label(answer?'例題の単語と品詞を対応させよう':'小さな／犬／が／ゆっくり／歩い／た');
 words.forEach((value,index)=>{const x=88+(index%3)*328,y=222+Math.floor(index/3)*150,color=['が','た'].includes(value)?GREEN:BLUE;panel(x,y,300,132,value,'',color);if(answer)text(types[index],x+150,y+102,34,color,'center',800);});
}
function nounGroups(p){
 label('自立語か、付属語かを分ける');
 panel(88,230,456,252,'自立語','小さな・犬・ゆっくり・歩い',BLUE);
 panel(574,230,456,252,'付属語','が・た',GREEN);
}
function wordCaution(){
 label('例題の「小さな」を確かめよう');
 panel(88,232,456,246,'× 形容詞','「小さな」を形容詞とは答えない',RED);
 panel(574,232,456,246,'○ 連体詞','活用しない言葉として確かめる',GREEN);
}
function datePanel(stage,p){
 label('例題：誕生日は3月23日');
 panel(88,222,456,258,stage>=2?'3月 → March':'3月','',BLUE);
 panel(574,222,456,258,stage>=3?'23日 → 23rd':'23日','',GREEN);
 if(stage>=3)text('twenty-third',802,390,38,GREEN,'center',800);
 if(stage>=4)text("It's March 23rd.",580,512,40,BLUE,'center',800);
}
function verbComparison(){
 label('日本語の「です」だけでは選ばない');
 panel(88,230,456,252,'be動詞の文','I am a student.',BLUE);
 panel(574,230,456,252,'一般動詞の文','I like music.',GREEN);
 text('am',316,444,42,BLUE,'center',800);text('like',802,444,42,GREEN,'center',800);
}
function apple(x,y,p){
 g.fillStyle='#df6b5d';g.beginPath();g.ellipse(x,y,68+3*Math.sin(p*8),58,0,0,Math.PI*2);g.fill();
 g.fillStyle=GREEN;g.beginPath();g.ellipse(x+28,y-68,28,12,-.55,0,Math.PI*2);g.fill();
 g.strokeStyle='#795739';g.lineWidth=7;g.beginPath();g.moveTo(x,y-50);g.lineTo(x+5,y-77);g.stroke();
}
function cold(x,y,t){
 g.strokeStyle=BLUE;g.lineWidth=6;
 for(let index=0;index<3;index++){const angle=index*Math.PI/3;g.beginPath();g.moveTo(x-Math.cos(angle)*64,y-Math.sin(angle)*64);g.lineTo(x+Math.cos(angle)*64,y+Math.sin(angle)*64);g.stroke();}
}
function exclamationProblem(p,t){
 label('例題：何を強く言いたいかな？');
 panel(88,222,456,270,'① 大きなりんご','',GREEN);panel(574,222,456,270,'② とても寒い','',BLUE);
 apple(316,386,p);cold(802,386,t);
}
function emphasisForms(stage){
 label('強調するまとまりに注目しよう');
 panel(88,230,456,256,stage===2?'big apple':'What の形',stage===2?'名詞を含むまとまり':'What a ＋ 形容詞 ＋ 名詞!',GREEN);
 panel(574,230,456,256,stage===2?'cold':'How の形',stage===2?'形容詞を強く言う':'How ＋ 形容詞!',BLUE);
}
function emphasisTip(){
 label('主語の名詞まで数えて判断しない');
 panel(88,230,456,252,'What','強調する名詞のまとまり',GREEN);
 panel(574,230,456,252,'How','強調する形容詞・副詞',BLUE);
}
function drawUnit(id,role,index,p,t){
 if(id==='K1-C6-S1-V01'){
  if(role==='problem'||role==='step'){rainComparison(p,t);return true;}
  if(role==='point'){metaphor(p);return true;}
 }
 if(id==='K1-C6-S1-VP'){
  if(index===1){label('オノマトペを二つに分けよう');panel(88,230,456,252,'擬声語','音・声を表す',BLUE);panel(574,230,456,252,'擬態語','様子を表す',GREEN);return true;}
  if(index===2){label('表現技法を整理しよう');tileRow(['反復','比喩','体言止め','倒置'],224,[],108);text('比喩：直喩・隠喩・擬人法',580,430,38,BLUE,'center',800);return true;}
  if(index===3){effects(p);return true;}
  if(role==='tip'){metaphor(p);return true;}
  if(role==='caution'){label('技法の名前だけで終わらせない');panel(88,230,456,252,'× 技法の名前だけ','効果を書き忘れる',RED);panel(574,230,456,252,'○ 名前 ＋ 効果','どんな伝わり方になるかを書く',GREEN);return true;}
 }
 if(id==='K1-C7-S3-V01'){
  if(role==='problem'||role==='step'||role==='answer'){
   label(role==='answer'?'読みの組み合わせから名前を確かめる':'一字ずつ、音読みか訓読みか');
   const reveal=role==='answer',readings=index>=3;
   compound('番','組',readings?'バン（音）':'音？ 訓？',readings?'ぐみ（訓）':'音？ 訓？','重箱読み',88,218,reveal);
   compound('荷','物',readings?'に（訓）':'音？ 訓？',readings?'モツ（音）':'音？ 訓？','湯桶読み',574,218,reveal);return true;
  }
  if(role==='point'){dictionaryTip();return true;}
 }
 if(id==='K1-C7-S3-VP'){
  if(index===1){label('音読み・訓読みの由来');panel(88,230,456,252,'音読み','中国から伝わった音がもと',BLUE);panel(574,230,456,252,'訓読み','日本の言葉をあてる',GREEN);return true;}
  if(index===2||role==='caution'){compoundRules(p,role==='caution');return true;}
  if(index===3){label('熟字訓は、熟語全体で一つの読み');tileRow(['熟語全体','特別な読み'],250,[BLUE,GREEN],164);pointer(548,330,570,330);return true;}
  if(role==='tip'){dictionaryTip();return true;}
 }
 if(id==='K1-C8-S4-V01'){
  if(role==='problem'){label('例題の文を声に出して読もう');sourceText('小さな 犬が ゆっくり 歩いた。',104,264,952,170,48);return true;}
  if(index===2||role==='answer'){wordTiles(p,role==='answer');return true;}
  if(index===3){nounGroups(p);return true;}
  if(index===4){label('活用と、文の中でのはたらきを確かめる');tileRow(['活用する？','どんなはたらき？'],258,[BLUE,GREEN],154);return true;}
  if(role==='point'){conjugation();return true;}
 }
 if(id==='K1-C8-S4-VP'){
  if(index===1){label('単語は二つに分けられる');tileRow(['自立語','付属語'],244,[BLUE,GREEN],172);return true;}
  if(index===2||role==='tip'){conjugation();return true;}
  if(index===3){label('活用しない自立語を整理しよう');tileRow(['名詞','副詞','連体詞','接続詞','感動詞'],256,[],170);return true;}
  if(index===4){label('付属語も、活用するかを確かめる');panel(88,230,456,252,'助動詞','活用する',BLUE);panel(574,230,456,252,'助詞','活用しない',GREEN);return true;}
  if(role==='caution'){wordCaution();return true;}
 }
 if(id==='E1-L2-S3-V01'){
  if(role==='problem'||role==='step'){datePanel(index,p);return true;}
  if(role==='answer'){label('例題の答え');sourceText("It's March 23rd.",104,268,952,160,56);return true;}
  if(role==='point'){verbComparison();return true;}
 }
 if(id==='E1-L8-S2-V01'){
  if(role==='problem'){exclamationProblem(p,t);return true;}
  if(role==='step'){emphasisForms(index);return true;}
  if(role==='answer'){label('例題の答えを比べよう');panel(88,230,456,252,'① What','What a big apple!',GREEN);panel(574,230,456,252,'② How','How cold!',BLUE);return true;}
  if(role==='point'){emphasisTip();return true;}
 }
 if(id==='E1-L8-S2-VP'){
  if(index===1){label('名詞が一つの例で、基本形を見よう');tileRow(['What a','形容詞','名詞!'],252,[GREEN,BLUE,GREEN],154);return true;}
  if(index===2){label('形容詞を強める基本形');tileRow(['How','形容詞!'],246,[BLUE,GREEN],164);text('副詞を強める形もある',580,474,32,BLUE,'center',700);return true;}
  if(index===3){label('名詞が複数のときは a をつけない');sourceText('What beautiful flowers!',104,268,952,140,46);return true;}
  if(role==='tip'){emphasisTip();return true;}
 }
 return false;
}
window.SCENE={caption:true,draw({t,step}){
 const logical=source.steps[step.sceneIndex],role=logical.role;
 const p=clamp((t-step.sceneStart)/Math.max(.001,step.sceneEnd-step.sceneStart),0,1),a=seg(p,0,.12);
 header(source.title,source.subject+(source.kind==='VP'?'・まとめ':'・例題'));
 g.save();g.globalAlpha=a;
 rbox(60,126,1040,400,24,sceneColors[role]||'#fff',role==='answer'?GREEN:BLUE,2);
 if(!drawUnit(source.id,role,step.sceneIndex,p,t)){
  const title={problem:'例題を読もう',answer:'例題の答えと根拠',point:'確かめるポイント',tip:'考えるコツ',caution:'気をつけよう',pt:'この節のポイント'}[role];
  if(title)text(title,88,171,30,BLUE,'left',800);
  sourceText(bodyText(logical.say,role),88,title?198:158,984,title?298:338,role==='intro'||role==='title'?42:38);
 }
 g.restore();
 nobi(1180,466,.72,{t,wave:role==='intro'||role==='title'||role==='end',point:role==='step'||role==='point'||role==='tip'});
}};
