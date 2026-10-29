(function(root){
 'use strict';
 // Small vector scenes share drawing primitives; no downloaded images or animation loops.
 const rows=[
 ['spring-town','春の街','春','town','#fff4f7','#914361','petal'],['spring-sea','春の海','春','sea','#effaf9','#24656b','petal'],['spring-mountain','春の山','春','mountain','#f2f9ef','#38623f','petal'],
 ['summer-town','夏の街','夏','town','#fff9e9','#805716','sun'],['summer-sea','夏の海','夏','sea','#edf8ff','#206589','sun'],['summer-mountain','夏の山','夏','mountain','#eef8f0','#326448','sun'],
 ['autumn-town','秋の街','秋','town','#fff4e9','#875224','leaf'],['autumn-sea','秋の海','秋','sea','#f5f4fc','#5c517f','leaf'],['autumn-mountain','秋の山','秋','mountain','#fcf2eb','#894726','leaf'],
 ['winter-town','冬の街','冬','town','#f3f7fc','#46617d','snow'],['winter-sea','冬の海','冬','sea','#eef7fb','#376778','snow'],['winter-mountain','冬の山','冬','mountain','#f4f5fc','#505b85','snow'],
 ['moon-library','月夜の図書館','物語','books','#f5f1fc','#655080','moon'],['forest-library','森の図書館','物語','books','#f0f7ed','#49633b','tree'],['rain-cafe','雨の日のカフェ','物語','cup','#f2f5fa','#4b617b','rain'],['sunrise-garden','朝の庭','自然','flower','#fcf7eb','#785c2d','sun'],
 ['sunset-port','夕暮れの港','自然','boat','#fff2ed','#8b4d38','sun'],['deep-sea','深海研究室','探検','fish','#edf5fa','#315f80','bubble'],['coral-reef','サンゴの海','自然','coral','#fff3f5','#8c4259','bubble'],['desert-caravan','砂漠の旅','探検','dune','#fff7e8','#845d24','sun'],
 ['rainforest','熱帯雨林','自然','tree','#edf8f3','#2b694f','rain'],['bamboo-garden','竹の庭','和風','bamboo','#f4f7ea','#556234','moon'],['zen-garden','石庭','和風','stone','#f7f5ef','#655e49','ripple'],['japanese-town','和の街並み','和風','town','#fbf2ec','#815346','lantern'],
 ['lantern-festival','灯りの祭り','和風','lantern','#fff5ed','#8b512d','moon'],['sakura-river','桜の川','和風','bridge','#fff2f7','#8a4366','petal'],['tea-house','茶室','和風','cup','#f6f5e8','#666130','bamboo'],['snow-cabin','雪の小屋','物語','cabin','#f3f6fc','#4b6084','snow'],
 ['northern-lights','オーロラの空','探検','wave','#edf9f6','#2e6e60','stars'],['planetarium','プラネタリウム','宇宙','planet','#f0f2fd','#4d5588','stars'],['moon-base','月面基地','宇宙','cabin','#f4f3fa','#605b81','moon'],['mars-trip','火星探査','宇宙','dune','#fff1ed','#914d39','planet'],
 ['space-station','宇宙ステーション','宇宙','orbit','#f0f6fc','#3a6488','stars'],['galaxy-route','銀河航路','宇宙','rocket','#f4f0fc','#644c89','stars'],['cyber-city','サイバーシティ','未来','city','#edf9fa','#246c72','grid'],['neon-arcade','ネオンアーケード','未来','arcade','#faf0fc','#7d4587','grid'],
 ['robot-lab','ロボット研究所','未来','robot','#eff6fc','#3c6584','gear'],['digital-ocean','デジタルの海','未来','wave','#eef9f8','#2c6a62','grid'],['dark-castle','幻想の城','ファンタジー','castle','#f5f1fa','#6a4f80','moon'],['crystal-cave','水晶の洞窟','ファンタジー','crystal','#f1f5fd','#485f91','stars'],
 ['magic-school','魔法の学び舎','ファンタジー','books','#fcf2fa','#854a76','stars'],['floating-island','空に浮かぶ島','ファンタジー','island','#edf8fc','#346b85','cloud'],['dragon-hill','竜の丘','ファンタジー','dragon','#f7f2ea','#755a39','cloud'],['clockwork-town','時計仕掛けの街','ファンタジー','clock','#faf4ea','#79603a','gear'],
 ['paper-craft','紙工作の世界','創作','paper','#faf7ef','#6e6043','fold'],['watercolor','水彩のアトリエ','創作','brush','#f3f7fc','#4c6482','drop'],['music-room','音楽室','創作','music','#f9f2fc','#74518b','notes'],['science-desk','科学の机','創作','flask','#eef8fa','#326b78','bubble'],
 ['sports-field','スポーツ広場','日常','ball','#f3f8ed','#526c37','sun'],['train-journey','列車の旅','日常','train','#f1f6fc','#476787','cloud']
 ];
 const themes=rows.map(([id,label,group,scene,bg,accent,motif])=>Object.freeze({id,label,group,scene,bg,accent,motif}));
 const catalog=new Map(themes.map(t=>[t.id,t]));
 const shapes={
  town:'<path d="M80 190v-75h90v75m30 0v-100h90v100m40 0v-65h100v65M75 115l50-40 50 40m20-25 50-45 50 45"/>',
  sea:'<path d="M0 160q70-40 140 0t140 0t140 0t140 0t140 0t140 0t140 0t140 0M0 190q70-30 140 0t140 0t140 0t140 0t140 0t140 0t140 0t140 0"/>',
  mountain:'<path d="M40 190 160 40 290 190M230 190 360 65 510 190M120 90l40 20 40-20"/>',
  books:'<path d="M85 170V80l70-15 70 15v90l-70-15zm70-105v90M250 170V55h30v115m15 0V75h30v95m15 0 15-105 30 5-15 105"/>',
  cup:'<path d="M100 100h140l-15 85H115zm140 10h25q45 30-35 50M90 195h165M140 70q-20-20 0-40m55 40q-20-20 0-40"/>',
  flower:'<path d="M175 190v-80m0 45q-75-45-60 0 30 25 60 0m0 0q75-45 60 0-30 25-60 0"/><circle cx="175" cy="78" r="22"/><circle cx="145" cy="90" r="22"/><circle cx="205" cy="90" r="22"/>',
  boat:'<path d="m100 165 40 35h170l35-35zm130 0V50l85 100h-85m-8-90-70 90h70"/>',
  fish:'<path d="M90 130q75-70 150 0-75 70-150 0zm150 0 70-45v90z"/><circle cx="130" cy="120" r="5"/>',
  coral:'<path d="M190 195V70m0 55-50-25V65m50 95 55-30V75m-105 25-40-20m145 50 40-30M175 195h35"/>',
  dune:'<path d="M0 200q150-165 300 0 150-165 300 0t300 0M80 200q125-85 250 0"/>',
  tree:'<path d="M185 200v-80m-75 10 75-95 75 95zm-20 40 95-120 95 120z"/>',
  bamboo:'<path d="M130 200V35m70 165V45m65 155V70m-145 90h20m-20-50h20m50 65h20m-20-55h20m-20-50h20m45 85h20m-20-45h20M130 80q-80-45-60 0 25 15 60 0m70 30q80-45 60 0-25 15-60 0"/>',
  stone:'<path d="M75 175q30-90 90 0zm150 10q50-130 115 0zM30 200h360m-340 15h320"/>',
  lantern:'<path d="M145 65h70v100h-70zm0 10q-45 45 0 85m70-85q45 45 0 85m-65-70h60m-60 55h60m-30 20v30m-20 0h40"/>',
  bridge:'<path d="M65 160q135-170 270 0m-270 15q135-170 270 0m-245-55v40m50-75v42m50-53v48m50-38v42m50-12v40M40 195q80-25 160 0t160 0"/>',
  cabin:'<path d="M100 190V95h180v95zm-20-95 110-70 110 70m-130 95v-60h40v60m-75-70h25m80 0h25"/>',
  wave:'<path d="M30 75q80-70 160 0t160 0t160 0M30 120q80-70 160 0t160 0t160 0M30 165q80-70 160 0t160 0t160 0"/>',
  planet:'<circle cx="210" cy="115" r="65"/><ellipse cx="210" cy="115" rx="120" ry="25" transform="rotate(-25 210 115)"/>',
  orbit:'<ellipse cx="210" cy="115" rx="125" ry="45"/><ellipse cx="210" cy="115" rx="125" ry="45" transform="rotate(60 210 115)"/><circle cx="210" cy="115" r="20"/>',
  rocket:'<path d="M170 160V90q30-80 60 0v70zm0-20-40 30v-45l40-35m60 50 40 30v-45l-40-35m-40 65-5 50 15-20 15 20-5-50"/><circle cx="200" cy="100" r="15"/>',
  city:'<path d="M80 195V95h60v100m20 0V45h75v150m25 0V75h90v120M175 65h45m-45 30h45m-45 30h45m55-25h60m-60 30h60"/>',
  arcade:'<path d="M110 195 130 65h100l30 130zm25-115h90v70h-90m-5 90h20m15 0h20m15 0h20"/>',
  robot:'<path d="M135 65h110v65H135zm-10 80h130v50H125m55-130V40m-70 75H90v70m165-70h25v70"/><circle cx="165" cy="90" r="6"/><circle cx="215" cy="90" r="6"/>',
  castle:'<path d="M100 195V80h50v115m0 0v-90h90v90m0 0V80h50v115M100 80l25-45 25 45m90 0 25-45 25 45m-115 115v-45h40v45"/>',
  crystal:'<path d="m130 165 20-90 45-25 55 90-10 55zm20-90 35 75 10-100m-10 100 55 45m-110-30 55-15m70 0 30-60 40 90-70 20"/>',
  island:'<path d="M75 130h250l-60 65H135zm20 0q105-115 210 0M180 105V55m-25 5 25-25 25 25"/>',
  dragon:'<path d="M100 150q70-100 140-20l45-45-10-40 35 20 10 55-65 35-25 30-50-10-30 25m30-85-55-65-35 75m90 60 10-45m-10 45h25"/>',
  clock:'<circle cx="200" cy="120" r="80"/><path d="M200 65v55l40 25m-100-25h10m50 70v-10m70-60h-10"/>',
  paper:'<path d="m90 130 220-80-65 140-55-55-100-5zm100 5 120-85-65 105m-55-20-20 45 40-35"/>',
  brush:'<path d="m150 135 100-100 20 20-100 100zm0 0q-55 0-40 60 60 15 60-40m-60 40-20 10"/>',
  music:'<path d="M150 155V65l110-25v100m-110-55 110-25"/><ellipse cx="125" cy="160" rx="25" ry="18"/><ellipse cx="235" cy="145" rx="25" ry="18"/>',
  flask:'<path d="M170 45h60m-45 0v70l-60 75q80 35 160 0l-60-75V45m-65 110h85"/><circle cx="180" cy="175" r="7"/><circle cx="215" cy="155" r="5"/>',
  ball:'<circle cx="200" cy="120" r="75"/><path d="m185 90 35 5 15 35-30 20-35-20zm-45-20 45 20m35 5 25-40m-10 75 40 10m-70 10-5 45m-30-65-40 10"/>',
  train:'<path d="M95 170V75h200v95zm10-80h45v40h-45m65-40h45v40h-45m65-40h40v40h-40M55 205h310"/><circle cx="145" cy="180" r="15"/><circle cx="255" cy="180" r="15"/>'
 };
 function decoration(m){
  if(m==='snow')return '<path d="M650 70v40m-20-20h40m-34-14 28 28m-28 0 28-28M810 120v40m-20-20h40"/>';
  if(m==='petal'||m==='leaf')return '<path d="M620 80q45-40 60 0-30 35-60 0zm125 70q40-40 50 0-25 35-50 0z"/>';
  if(m==='stars')return '<path d="m630 55 8 20 22 3-18 14 5 22-17-12-17 12 5-22-18-14 22-3zm170 65 6 14 16 2-13 11 3 16-12-9-12 9 3-16-13-11 16-2z"/>';
  if(m==='grid')return '<path d="M580 65h300m-300 40h300m-300 40h300m-260-120v160m60-160v160m60-160v160m60-160v160"/>';
  if(m==='rain')return '<path d="m610 65-15 30m65-10-15 30m65-50-15 30m65 0-15 30m65-50-15 30"/>';
  if(m==='moon')return '<path d="M695 45q-60 75 35 105-130 0-90-90z"/>';
  if(m==='cloud')return '<path d="M600 110q-30-45 25-50 35-65 75-5 70-5 40 55z"/>';
  return '<circle cx="660" cy="85" r="30"/><circle cx="760" cy="140" r="15"/><path d="M615 150h50m50-110h35"/>';
 }
 function svg(t){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 240"><g fill="none" stroke="${t.accent}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity=".18">${shapes[t.scene]}${decoration(t.motif)}</g></svg>`;}
 // ---- 教科書以外のアプリ全体の着せ替え（色・見出しの文字・小さな絵・区切り線）。教科書の画面（#view-textbook）には効かせない ----
 const icons={
  sun:'<circle cx="24" cy="24" r="8"/><path d="M24 6v6m0 24v6M6 24h6m24 0h6M11 11l4 4m18 18 4 4M37 11l-4 4M15 33l-4 4"/>',
  petal:'<path d="M24 24c-6-6-6-14 0-17 6 3 6 11 0 17zm0 0c8-3 15 0 15 7-6 3-12 0-15-7zm0 0c3 8-1 15-8 15-2-7 2-12 8-15zm0 0c-3 8 1 15 8 15 2-7-2-12-8-15zm0 0c-8-3-15 0-15 7 6 3 12 0 15-7z"/><circle cx="24" cy="24" r="2"/>',
  leaf:'<path d="M10 38C10 18 22 8 40 8c0 18-10 30-30 30zm0 0 20-20m-12 4h8m-2-8v8"/>',
  snow:'<path d="M24 6v36M8.4 15l31.2 18M8.4 33l31.2-18M20 9l4 4 4-4M20 39l4-4 4 4"/>',
  moon:'<path d="M30 8a16 16 0 1 0 10 26A13 13 0 0 1 30 8z"/>',
  tree:'<path d="M24 6 10 26h8L8 38h32L30 26h8zm0 32v6"/>',
  rain:'<path d="M14 26a8 8 0 0 1 2-15 10 10 0 0 1 19 2 7 7 0 0 1-1 13zm2 6-3 7m11-7-3 7m11-7-3 7"/>',
  bubble:'<circle cx="18" cy="28" r="9"/><circle cx="33" cy="15" r="6"/><circle cx="35" cy="34" r="4"/><path d="M14 24a5 5 0 0 1 4-3"/>',
  ripple:'<path d="M6 30q18-14 36 0M10 37q14-10 28 0M14 23q10-7 20 0"/><circle cx="24" cy="14" r="3"/>',
  lantern:'<path d="M18 8h12M24 4v4m-8 4h16q6 12 0 24H16q-6-12 0-24zm0 24h16m-12 4h8M24 12v24"/>',
  bamboo:'<path d="M18 4v40M30 8v36M15 16h6m-6 14h6m6-10h6m-6 14h6m-3-14q8-8 14-6-4 7-14 6z"/>',
  stars:'<path d="m18 8 3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1zm18 20 2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3 4-1z"/>',
  planet:'<circle cx="24" cy="24" r="10"/><ellipse cx="24" cy="24" rx="20" ry="6" transform="rotate(-20 24 24)"/>',
  grid:'<rect x="7" y="7" width="34" height="34" rx="3"/><path d="M7 18h34M7 30h34M18 7v34M30 7v34"/><circle cx="30" cy="18" r="2"/>',
  gear:'<circle cx="24" cy="24" r="6"/><circle cx="24" cy="24" r="13"/><path d="M24 5v6m0 26v6M5 24h6m26 0h6M10.6 10.6l4.2 4.2m18.4 18.4 4.2 4.2m0-26.8-4.2 4.2M14.8 33.2l-4.2 4.2"/>',
  cloud:'<path d="M13 34a8 8 0 0 1 0-16 11 11 0 0 1 21-2 9 9 0 0 1 1 18z"/>',
  fold:'<path d="M6 30 24 10l18 20-18 8zm18-20v28M6 30l18-4 18 4"/>',
  drop:'<path d="M24 6c-7 11-12 17-12 24a12 12 0 0 0 24 0c0-7-5-13-12-24zm-6 25a6 6 0 0 0 6 6"/>',
  notes:'<path d="M18 34V10l20-4v24M18 16l20-4"/><circle cx="13" cy="34" r="5"/><circle cx="33" cy="30" r="5"/>'
 };
 // 見出しの雰囲気（字体の系統・字間・太さ）と、角の丸み・区切り線の形。文字の大きさは変えない
 const headFonts=Object.freeze({serif:'"Hiragino Mincho ProN","Yu Mincho","YuMincho","BIZ UDPMincho","Noto Serif JP",serif',rounded:'"Hiragino Maru Gothic ProN","BIZ UDPGothic","Hiragino Sans","Yu Gothic",sans-serif',gothic:'"Hiragino Kaku Gothic ProN","Hiragino Sans","BIZ UDPGothic","Yu Gothic","Noto Sans JP",sans-serif'});
 const styles=Object.freeze({'春':['rounded',.04,800,22,'dotted'],'夏':['rounded',.03,800,20,'solid'],'秋':['serif',.06,700,18,'dashed'],'冬':['gothic',.06,700,16,'double'],'物語':['serif',.05,700,14,'double'],'自然':['rounded',.03,800,22,'dotted'],'探検':['gothic',.06,800,12,'dashed'],'和風':['serif',.08,700,8,'double'],'宇宙':['gothic',.07,700,16,'dotted'],'未来':['gothic',.08,700,6,'solid'],'ファンタジー':['serif',.06,700,18,'double'],'創作':['rounded',.02,800,24,'dashed'],'日常':['rounded',.03,800,18,'solid']});
 const rgb=h=>h.slice(1).match(/../g).map(x=>parseInt(x,16));
 const hex=a=>'#'+a.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
 const mix=(a,b,k)=>{const x=rgb(a),y=rgb(b);return hex(x.map((v,i)=>v*k+y[i]*(1-k)));};
 const luminance=h=>{const c=rgb(h).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2];};
 const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
 // 足りなければ少しずつ濃くして、指定のすべての背景に対してコントラスト比を満たす色にする
 const deepen=(c,against,min)=>{let k=0,out=c;while(k<1&&against.some(b=>contrast(out,b)<min)){k=Math.min(1,k+.04);out=mix('#000000',c,k);}return out;};
 function rotate(h,deg){
  const [r,g,b]=rgb(h).map(v=>v/255),mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,d=mx-mn;let hue=0,s=0;
  if(d){s=d/(1-Math.abs(2*l-1));hue=60*(mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4);}
  hue=(hue+deg+720)%360;const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((hue/60)%2-1)),m=l-c/2;
  const v=hue<60?[c,x,0]:hue<120?[x,c,0]:hue<180?[0,c,x]:hue<240?[0,x,c]:hue<300?[x,0,c]:[c,0,x];
  return hex(v.map(n=>(n+m)*255));
 }
 function palette(t){
  if(typeof t==='string')t=catalog.get(t);if(!t)return null;
  const bg=t.bg,surface=mix('#ffffff',bg,.55),soft=mix(t.accent,surface,.1),light=[bg,surface,soft],white='#ffffff';
  const ink=deepen(mix(t.accent,'#141a20',.22),light,7),main=deepen(t.accent,[...light,white],4.5),head=deepen(t.accent,[...light,white],5.5);
  const accent2=deepen(rotate(t.accent,150),[...light,white],4.5),muted=deepen(mix(ink,surface,.7),[...light,white],4.6);
  let k=.35,border=mix(main,surface,k);while(k<1&&(contrast(border,surface)<3||contrast(border,bg)<3)){k+=.05;border=mix(main,surface,k);}
  const line=mix(main,surface,.24),track=mix(main,surface,.16),select=mix(main,white,.22);
  const [r,g,b]=rgb(main);
  return Object.freeze({bg,surface,soft,ink,main,head,accent2,muted,border,line,track,select,shadow:`rgba(${r},${g},${b},.14)`});
 }
 const drawing=(view,body,color,width)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${view}"><g fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`;
 // 1テーマ分の絵：見出し横の紋章・カードの飾り・空の状態の絵・区切り線
 function art(t){
  if(typeof t==='string')t=catalog.get(t);if(!t)return null;const p=palette(t);
  return Object.freeze({
   emblem:drawing('30 20 500 200',shapes[t.scene],p.main,12),
   ornament:drawing('0 0 48 48',icons[t.motif],p.main,3),
   empty:drawing('0 0 1000 240',`<g opacity=".6">${shapes[t.scene]}</g>${decoration(t.motif)}`,p.main,6),
   divider:drawing('0 0 48 48',`<path d="M0 24h12m24 0h12" opacity=".5"/><g transform="translate(14 14) scale(.42)">${icons[t.motif]}</g>`,p.border,3)
  });
 }
 const svgUrl=s=>`url("data:image/svg+xml,${encodeURIComponent(s)}")`;
 // 色や絵はテーマごとの変数で入れ、規則は1つの共通スタイルにまとめる（教科書の画面は除外・印刷では使わない）
 const T=':where(body[data-nobi-theme])',N=':where(:not(#view-textbook,#view-textbook *))';
 const css=[
  `body[data-nobi-theme] #view-textbook{--main-color:var(--theme-legacy-accent);--head-color:var(--theme-legacy-accent);--text-color:#263238;--box-bg:#ffffff;--border-color:#6b7280;--box-shadow:rgba(0,0,0,.05);color:var(--text-color)}`,
  '@media screen{',
  `body[data-nobi-theme]{color-scheme:light;scrollbar-color:var(--border-color) transparent}`,
  `${T} ${N}::selection{background:var(--theme-select);color:var(--text-color)}`,
  `${T} a:where(:not([class]))${N}{color:var(--main-color)}`,
  `${T} :where(h1,h2,h3,h4)${N}{letter-spacing:var(--theme-head-spacing);font-weight:var(--theme-head-weight)}`,
  `:where(body[data-nobi-theme]:not([data-nobi-font])) :where(h1,h2,h3,h4)${N}{font-family:var(--theme-head-font)}`,
  `${T} .view>h2${N}{color:var(--head-color)}`,
  `${T} .view>h2${N}::after{content:"";display:inline-block;width:2.4em;height:1.05em;margin-left:.4em;vertical-align:-.12em;background:var(--theme-emblem) center/contain no-repeat}`,
  `${T} .section:where(:not([style*="background"]))>:where(h3,h4)${N}{color:var(--head-color)}`,
  `${T} h3${N}{border-left-style:var(--theme-rule)}`,
  `${T} .section>h3:first-child${N}::before{content:"";float:right;width:1.2em;height:1.2em;margin:0 0 0 .4em;background:var(--theme-ornament) center/contain no-repeat}`,
  `${T} .section${N}{box-shadow:0 4px 14px var(--box-shadow)}`,
  `body[data-nobi-theme] .section${N}{border-top-style:var(--theme-rule);border-radius:var(--theme-radius)}`,
  `${T} :where(.m-card,.uh-box)${N}{box-shadow:inset 0 3px 0 var(--main-color),0 2px 8px var(--box-shadow);border-radius:var(--theme-radius)}`,
  `body[data-nobi-theme] :is(.btn,.q-input)${N}{border-radius:var(--theme-radius-sm)}`,
  `${T} .btn-action${N}{background-color:var(--theme-accent2);color:#fff}`,
  `${T} .btn-test${N}{background-color:var(--head-color);color:#fff}`,
  `${T} .m-sell${N}{background:var(--main-color)}`,`${T} .m-buy${N}{background:var(--theme-accent2)}`,`${T} .m-info${N}{background:var(--theme-muted)}`,
  `${T} :where(input:not([type=checkbox],[type=radio],[type=range],[type=color],[type=file],[type=button],[type=submit],[type=image],[type=hidden]),select,textarea)${N}{background-color:var(--box-bg);color:var(--text-color);border-color:var(--border-color)}`,
  `${T} :where(input,select,textarea,button,a,.nav-item):focus-visible${N}{outline:3px solid var(--main-color);outline-offset:2px}`,
  `${T} :where(input[type=checkbox],input[type=radio],input[type=range],progress)${N},${T} .school-scope-check input${N}{accent-color:var(--main-color)}`,
  `${T} header{box-shadow:0 2px 10px var(--box-shadow)}`,
  `${T} #sidebar{background-image:var(--theme-scene);background-repeat:no-repeat;background-position:left bottom;background-size:auto 96px}`,
  `${T} .nav-item{border-bottom-color:var(--theme-line)}`,`${T} .nav-item:hover{background:var(--theme-soft)}`,
  `${T} :where(.q-row,.m-row)${N}{border-bottom-color:var(--theme-line)}`,
  `${T} .m-pill${N}{background:var(--theme-soft);color:var(--head-color)}`,
  `${T} .badge.got${N}{background:var(--theme-soft);box-shadow:inset 0 0 0 1px var(--theme-line)}`,
  `${T} :where(.g-bar,.exm-progress,.school-workbook-progress,.bar-wrap)${N}{background:var(--theme-track)}`,
  `${T} :where(.g-bar>div,.exm-progress span,.school-workbook-progress span,.bar-fill)${N}{background:linear-gradient(90deg,var(--main-color),var(--theme-accent2))}`,
  `${T} :where(.m-desc,.cal-empty,.m-gtab th,.school-scope-date)${N}{color:var(--theme-muted)}`,
  `${T} :where(.cal-empty,.exam-cd-empty,.as-empty)${N}::before{content:"";display:block;height:56px;max-width:240px;margin:0 auto 8px;background:var(--theme-empty) center/contain no-repeat}`,
  `${T} .cal-cell.today${N}{border-color:var(--main-color)}`,`${T} .cal-cell.selected${N}{background:var(--main-color);color:#fff}`,
  `body[data-nobi-theme]{--theme-score-color:var(--main-color)}`,
  `${T} .m-quiz-btn:hover${N}{border-color:var(--main-color)}`,`${T} .uh-box th${N}{background:var(--theme-soft)}`,
  `${T} hr${N}{border:0;height:18px;background:var(--theme-divider) center/18px 18px repeat-x}`,
  `${T} .appearance-preview::after{content:"";flex:0 0 auto;width:96px;height:60px;margin-left:auto;background:var(--theme-emblem) center/contain no-repeat}`,
  '}'
 ].join('\n');
 const VARS=['--bg-color','--main-color','--head-color','--text-color','--box-bg','--border-color','--theme-scene','--box-shadow','--theme-soft','--theme-line','--theme-muted','--theme-accent2','--theme-track','--theme-select','--theme-legacy-accent','--theme-head-font','--theme-head-spacing','--theme-head-weight','--theme-radius','--theme-radius-sm','--theme-rule','--theme-emblem','--theme-ornament','--theme-empty','--theme-divider'];
 function tokens(t){
  if(typeof t==='string')t=catalog.get(t);if(!t)return null;
  const p=palette(t),a=art(t),[font,spacing,weight,radius,rule]=styles[t.group];
  return Object.freeze({'--bg-color':p.bg,'--main-color':p.main,'--head-color':p.head,'--text-color':p.ink,'--box-bg':p.surface,'--border-color':p.border,'--theme-scene':svgUrl(svg(t)),'--box-shadow':p.shadow,'--theme-soft':p.soft,'--theme-line':p.line,'--theme-muted':p.muted,'--theme-accent2':p.accent2,'--theme-track':p.track,'--theme-select':p.select,'--theme-legacy-accent':t.accent,'--theme-head-font':headFonts[font],'--theme-head-spacing':spacing+'em','--theme-head-weight':String(weight),'--theme-radius':radius+'px','--theme-radius-sm':Math.min(radius,16)+'px','--theme-rule':rule,'--theme-emblem':svgUrl(a.emblem),'--theme-ornament':svgUrl(a.ornament),'--theme-empty':svgUrl(a.empty),'--theme-divider':svgUrl(a.divider)});
 }
 function injectStyle(doc){
  if(!doc||doc.getElementById('nobi-theme-style'))return;
  const el=doc.createElement('style');el.id='nobi-theme-style';el.textContent=css;(doc.head||doc.documentElement).appendChild(el);
 }
 let effect='confetti',timer=0;
 function clear(){root.clearTimeout(timer);timer=0;const layer=root.document?.getElementById('confetti-layer');if(layer){layer.classList.remove('on');layer.replaceChildren();}}
 const fonts=Object.freeze({system:'',ud:'"BIZ UDPGothic","Hiragino Sans","Yu Gothic",sans-serif',serif:'"Yu Mincho","Hiragino Mincho ProN",serif',rounded:'"Hiragino Maru Gothic ProN","Arial Rounded MT Bold","Hiragino Sans",sans-serif'});
 function apply(id,chosenEffect,font){
  const body=root.document?.body;if(!body)return;
  effect=['confetti','stars','card','none'].includes(chosenEffect)?chosenEffect:'confetti';clear();
  body.removeAttribute('data-nobi-font');body.style.removeProperty('--reading-font');
  if(fonts[font]){body.dataset.nobiFont=font;body.style.setProperty('--reading-font',fonts[font]);}
  const t=catalog.get(id);body.removeAttribute('data-nobi-theme');
  for(const key of VARS)body.style.removeProperty(key);
  if(!t)return;
  injectStyle(root.document);
  body.dataset.nobiTheme=t.id;
  Object.entries(tokens(t)).forEach(([k,v])=>body.style.setProperty(k,v));
 }
 function celebrate(power){
  clear();const doc=root.document,layer=doc?.getElementById('confetti-layer');
  if(!layer||doc.hidden||effect==='none'||doc.body.classList.contains('reduce-motion')||root.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
  layer.setAttribute('aria-hidden','true');layer.classList.add('on');
  if(effect==='card'){const card=doc.createElement('div');card.className='nobi-achievement-card';card.textContent='よくがんばりました！';layer.append(card);}
  else{
   const small=root.matchMedia?.('(max-width: 767px)').matches;
   const count=small?(power==='big'?30:18):(power==='big'?60:36);
   const colors=['#8b4667','#327560','#385f91','#9a642c','#725195'];
   for(let i=0;i<count;i++){const p=doc.createElement('span');p.className='nobi-spark'+(effect==='stars'?' nobi-star':'');if(effect==='stars')p.textContent='✦';p.style.setProperty('--x',Math.round(Math.random()*100)+'vw');p.style.setProperty('--drift',Math.round(Math.random()*160-80)+'px');p.style.setProperty('--delay',Math.round(Math.random()*300)+'ms');p.style.setProperty('--spark',colors[i%colors.length]);layer.append(p);}
  }
  timer=root.setTimeout(clear,2600);
 }
 root.NobiAppearance=Object.freeze({themes:Object.freeze(themes),has:id=>id==='default'||catalog.has(id),fonts,svg,palette,art,tokens,css,styles,headFonts,contrast,apply,celebrate,clear});
 const motion=root.matchMedia?.('(prefers-reduced-motion: reduce)');
 motion?.addEventListener?.('change',event=>{if(event.matches)clear();});
 if(typeof module!=='undefined')module.exports=root.NobiAppearance;
})(typeof window!=='undefined'?window:globalThis);
