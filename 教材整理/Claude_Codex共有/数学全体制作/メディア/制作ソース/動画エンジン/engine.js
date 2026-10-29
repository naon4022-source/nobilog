// のびログ 教科書動画エンジン（Claude）。ナレーションの1文＝1ステップ。各場面のHTMLはこのファイルを読みこみ、
// SCENE.draw(ctx) を定義する。ctx = {t, i(ステップ番号), p(そのステップの進み 0〜1), step, tl}
const W=1280,HT=720,C={ink:'#1d2b3a',blue:'#1f5fa8',sky:'#8ec1ec',skyTop:'#5f9fd8',orange:'#e07a1f',red:'#d1495b',green:'#2a8a5b',bg:'#f7f9fc',dim:'#b8c4d2',card:'#ffffff'};
const cv=document.querySelector('canvas'),g=cv.getContext('2d');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ease=u=>{u=clamp(u,0,1);return u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2};   // なめらかに動き出して止まる
const seg=(p,a,b)=>ease((p-a)/(b-a));                                          // ステップの一部分だけで動かす
const FONT='"Hiragino Sans","Hiragino Kaku Gothic ProN",sans-serif';
function text(s,x,y,size=40,col=C.ink,align='left',w=700){g.fillStyle=col;g.font=`${w} ${size}px ${FONT}`;g.textAlign=align;g.textBaseline='alphabetic';g.fillText(s,x,y)}
function tw(s,size,w=700){g.font=`${w} ${size}px ${FONT}`;return g.measureText(s).width}
function frac(n,d,x,y,size=44,col=C.ink){text(n,x,y-8,size,col,'center',800);g.fillStyle=col;g.fillRect(x-size*.5,y,size,4);text(d,x,y+size+4,size,col,'center',800)}
function rbox(x,y,w,h,r,fill,stroke,lw=3){g.beginPath();g.roundRect(x,y,w,h,r);if(fill){g.fillStyle=fill;g.fill()}if(stroke){g.strokeStyle=stroke;g.lineWidth=lw;g.stroke()}}
function ring(x,y,rx,ry,col=C.orange,lw=7){g.strokeStyle=col;g.lineWidth=lw;g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.stroke()}
function arrow(x1,y1,x2,y2,col=C.orange,lw=6){g.strokeStyle=col;g.fillStyle=col;g.lineWidth=lw;g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke();const a=Math.atan2(y2-y1,x2-x1);g.beginPath();g.moveTo(x2,y2);g.lineTo(x2-20*Math.cos(a-.45),y2-20*Math.sin(a-.45));g.lineTo(x2-20*Math.cos(a+.45),y2-20*Math.sin(a+.45));g.closePath();g.fill()}
// 字幕：ナレーションと同じ文。1行に入らなければ2行に分ける
function caption(s,alpha=1){if(!s)return;g.globalAlpha=alpha;const size=36,max=1120;let lines=[s];
 if(tw(s,size)>max){// 「、」「。」の直後で切る（両方の行が入る中で、いちばん長さがそろう所）。なければ長さで切る
  let best=-1,bd=1e9;for(let k=1;k<s.length;k++)if('、。'.includes(s[k-1])&&tw(s.slice(0,k),size)<=max&&tw(s.slice(k),size)<=max){const d=Math.abs(tw(s.slice(0,k),size)-tw(s.slice(k),size));if(d<bd){bd=d;best=k}}
  if(best<0){bd=1e9;for(let k=1;k<s.length;k++){const d=Math.abs(tw(s.slice(0,k),size)-tw(s.slice(k),size));if(d<bd&&!'、。）」ょゃゅっー'.includes(s[k])){bd=d;best=k}}}lines=[s.slice(0,best),s.slice(best)]}
 const h=lines.length*50+26;rbox(64,HT-h-14,W-128,h,22,'rgba(255,255,255,.96)','#c9d6e8',2);lines.forEach((l,k)=>text(l,W/2,HT-h-14+50+k*50,size,C.ink,'center',700));g.globalAlpha=1}
function header(title,chip){rbox(28,18,tw(title,34,800)+48,64,18,'#e8f0fa');text(title,52,62,34,C.blue,'left',800);if(chip){const w=tw(chip,32,800)+44;rbox(W-28-w,18,w,64,18,C.orange);text(chip,W-28-w/2,62,32,'#fff','center',800)}}
function stepAt(t){const tl=window.TL;let i=0;for(let k=0;k<tl.steps.length;k++)if(t>=tl.steps[k].start)i=k;const s=tl.steps[i];return {i,step:s,p:clamp((t-s.start)/Math.max(.001,s.end-s.start),0,1)}}
window.renderAt=function(t){g.setTransform(1,0,0,1,0,0);g.fillStyle=C.bg;g.fillRect(0,0,W,HT);const s=stepAt(t);window.SCENE.draw({t,tl:window.TL,...s});g.setTransform(1,0,0,1,0,0);if(window.SCENE.caption!==false)caption(s.step.cap||s.step.say,s.step.capAlpha??1);if(window.TL.credit){g.globalAlpha=.75;text(window.TL.credit,W-24,HT-8,18,C.ink,'right',600);g.globalAlpha=1}};
