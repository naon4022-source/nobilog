/* 📚 教科書タブ：本棚と、2ページ見開きの本の画面。
   - 教科書タブは全画面で開く（全画面にできない端末だけ、画面いっぱいの表示で代わりにする）。
   - 本は p2〜3 から開き、＜ ＞・左右キー・スワイプで2ページずつめくる。表紙は1ページだけ、最後も1ページになることがある。
   - 1ページに入りきらない文章は、本物の教科書のように次のページへ送る（ページの中でスクロールしない・文字を小さくしない）。
   - 「ヒント」「答えと解説」は押すとページの上に札として開く（ページの長さは変わらない）。
   - 本の中身は textbook-books.json（本棚）と textbook-book-*.json（原稿のページ）から読む。文字はすべて textContent で表示する。 */
(function(root){
'use strict';
const W=600,H=848,LAYOUT_VERSION='2026-10-07.1';// 組み方を変えたら番号を上げる（覚えておいた組み結果を使わない）
const state={app:null,view:'gate',shelf:null,book:null,spread:0,fallback:false,epoch:0,message:'',sheet:null};
const ratio=new Map();// 画像の縦÷横（先に読みこんで測る）
let measuring=false;// ページを組むために測っている間は、絵を読みこまない（高さは縦横比で決まっているので組み方は変わらない）

function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined&&text!==null)e.textContent=String(text);if(tag==='img')e.draggable=false;return e;}
// 準備中の枠：画像のプロンプト（ChatGPT Images 用）・動画の台本（Claude 用）を開くボタンと、外部の動画（NHK for School・YouTube）へのリンク
const LINK_HOSTS=/^https:\/\/(?:(?:www\.|www2\.)?(?:nhk\.or\.jp|youtube\.com|youtu\.be)|edu\.web\.nhk)\//;
function frameTools(b){
 const row=el('div','tb-frame-tools');
 if(!b.src&&b.prompt){const bt=button('','tb-answer-btn',()=>openSheet({summary:'画像のプロンプト（ChatGPT Images）',body:[{t:'p',x:b.prompt}]}),'画像のプロンプト');bt.textContent='プロンプト';row.append(bt);}
 if(!b.src&&b.script){const bt=button('','tb-answer-btn',()=>openSheet({summary:'動画の台本（Claude）',body:b.script.map(x=>({t:'p',x}))}),'動画の台本');bt.textContent='台本';row.append(bt);}
 for(const l of b.links||[])if(l&&typeof l.url==='string'&&LINK_HOSTS.test(l.url)){const a=el('a','tb-answer-btn tb-link','▶ '+(l.label||'動画を見る'));a.href=l.url;a.target='_blank';a.rel='noopener noreferrer';row.append(a);}
 return row.childElementCount?row:null;
}
function button(label,cls,fn,aria){const b=el('button',cls,label);b.type='button';if(aria)b.setAttribute('aria-label',aria);b.addEventListener('click',fn);return b;}
// 原稿の「⟦L170⟧」は、組み上がった本の実際のページ番号にする。
function pageRef(text){return String(text||'').replace(/⟦L(\d+)⟧/g,(_,n)=>{const p=state.book&&state.book.map[Number(n)];return p?'p.'+p:'p.000';});}
// **太字** と `記号` だけを使う。HTMLとしては読まない。
function inline(parent,text){
 for(const part of pageRef(text).split(/(\*\*[^*]+\*\*|`[^`]+`)/)){
  if(!part)continue;
  if(part.length>4&&part.startsWith('**')&&part.endsWith('**'))parent.append(el('strong',null,part.slice(2,-2)));
  else if(part.length>2&&part.startsWith('`')&&part.endsWith('`'))parent.append(el('code',null,part.slice(1,-1)));
  else rubyText(parent,part);
 }
 return parent;
}
// ふりがな：「漢字《よみ》」または「｜文字《よみ》」（青空文庫と同じ書き方）を <ruby> にする（Claude・2026-10-06）
function rubyText(parent,text){
 const re=/(?:｜([^｜《》]+)|([\u3400-\u9fff々〆ヵヶ]+))《([^》]+)》/g;let last=0,m;
 while((m=re.exec(text))){if(m.index>last)parent.append(document.createTextNode(text.slice(last,m.index)));const r=el('ruby',null,m[1]||m[2]);r.append(el('rt',null,m[3]));parent.append(r);last=re.lastIndex;}
 if(last<text.length)parent.append(document.createTextNode(text.slice(last)));
}
function tint(hex,amount){
 const m=/^#([0-9a-f]{6})$/i.exec(hex||'');if(!m)return '#eef3f9';
 const n=parseInt(m[1],16),mix=c=>Math.round(c+(255-c)*amount);
 return 'rgb('+mix(n>>16&255)+','+mix(n>>8&255)+','+mix(n&255)+')';
}
function isFull(){const f=document.fullscreenElement||document.webkitFullscreenElement;return state.fallback||(!!state.app&&f===state.app);}

// ---- 表紙の絵（教科ごと。文字や写真は使わない簡単な図形） ----
const ART={
 '数学':[['circle',{cx:150,cy:118,r:46}],['path',{d:'M40 190 L120 60 L200 190 Z'}],['path',{d:'M20 230 H280 M40 222 V238 M100 222 V238 M160 222 V238 M220 222 V238'}],['rect',{x:200,y:40,width:70,height:70}]],
 '国語':[['path',{d:'M60 40 C120 80 80 160 140 220'}],['path',{d:'M150 40 C200 90 170 170 230 220'}],['circle',{cx:240,cy:70,r:22}]],
 '英語':[['rect',{x:40,y:50,width:130,height:80,rx:18}],['path',{d:'M80 130 L70 160 L110 130'}],['rect',{x:140,y:120,width:130,height:80,rx:18}],['path',{d:'M230 200 L240 228 L200 200'}]],
 '理科':[['path',{d:'M120 40 V110 L70 210 H230 L180 110 V40 Z'}],['path',{d:'M100 160 H200'}],['circle',{cx:240,cy:70,r:18}],['circle',{cx:60,cy:80,r:10}]],
 '社会':[['circle',{cx:150,cy:130,r:85}],['path',{d:'M65 130 H235 M150 45 V215 M90 75 C130 110 170 110 210 75 M90 185 C130 150 170 150 210 185'}]],
 '保健体育':[['circle',{cx:150,cy:60,r:18}],['path',{d:'M150 80 L140 150 L100 210 M140 150 L190 205 M145 105 L95 120 M145 105 L200 85'}],['circle',{cx:230,cy:200,r:22}]]
};
function coverArt(subject){
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
 svg.setAttribute('viewBox','0 0 300 260');svg.setAttribute('aria-hidden','true');svg.setAttribute('class','tb-cover-art');
 for(const [tag,attrs] of ART[subject]||ART['数学']){const s=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))s.setAttribute(k,String(v));svg.append(s);}
 return svg;
}
function cover(book,small){
 const box=el('div','tb-cover'+(small?' tb-cover-small':''));box.style.setProperty('--tb-color',book.color||'#1f5fa8');
 box.append(el('div','tb-cover-grade',book.grade||''));
 const title=el('div','tb-cover-title');title.append(el('span','tb-cover-subject',book.subject||''));const extra=(book.title||'').replace(book.subject||'','').trim();if(extra)title.append(el('span','tb-cover-num',extra));
 box.append(title,coverArt(book.subject),el('div','tb-cover-brand','🌱 のびログ'));
 if(book.status!=='ready')box.append(el('div','tb-cover-ribbon','準備中'));
 return box;
}

// ---- ブロック（1つずつページに置いて、入りきるかを測る） ----
const NOBI_POSE=['normal','wave','point','think','surprise','joy','read'];
function face(f){const pose=f==='🌱'?'normal':(/^nobi-([a-z]+)$/.exec(f||'')||[])[1];const nobi=NOBI_POSE.includes(pose);const s=el('span','tb-hook-face'+(nobi?' tb-hook-nobi':''));if(nobi){const i=document.createElement('img');i.src='/nobi-'+pose+'.svg';i.alt='のびー';i.decoding='async';s.append(i);}else s.textContent=f||'🙂';return s;}// のびーは絵文字ではなく動画・図解と同じ絵（2026-10-06）
function block(b){
 if(!b||typeof b!=='object')return null;
 if(b.t==='h3'){const x=String(b.x||'');const kind=/^例題/.test(x)?' tb-h3-ex':/つまずき/.test(x)?' tb-h3-warn':/確認|振り返りの問題|まとめの問題|30秒チェック/.test(x)?' tb-h3-check':/^なぜ|なぜ.*[？?]|（なぜ）/.test(x)?' tb-h3-why':/かんたんにやる方法|コツ/.test(x)?' tb-h3-tip':'';const h=el('h3','tb-h3'+kind);if(/^例題/.test(x)){h.append(el('span','tb-code',b.code||'000-A'));if(b.code)h.dataset.code=b.code;}inline(h,b.x);const lv=/（(基本|標準|応用)）/.exec(x);if(lv)h.dataset.level=lv[1];return h;}
 if(b.t==='h4')return inline(el('h4','tb-h4'),b.x);
 if(b.t==='p'){const x=String(b.x||'');const q=isQuestion(b);const node=el('p',q?'tb-p tb-q':(b.hon?(b.hon==='cont'?'tb-p tb-honbun tb-honbun-cont':'tb-p tb-honbun'):'tb-p'));if(q)node.append(el('span','tb-code',b.code||'000-A'));inline(node,b.x);if(b.code)node.dataset.code=b.code;if(b.rid)node.dataset.rid=b.rid;return node;}
 if(b.t==='divider'){const d=el('div','tb-divider');d.dataset.tag=b.tag||'';d.append(el('span','tb-tag',b.tag||''));return d;}
 if(b.t==='extra'){const box=el('aside','tb-extra tb-extra-'+(b.kind==='クイズ'?'quiz':b.kind==='やってみよう'?'try':'fact'));const head=el('div','tb-extra-head');head.append(el('span','tb-extra-kind',b.kind==='クイズ'?'ちょこっとクイズ':b.kind),el('span','tb-extra-title',b.title||''));box.append(head,inline(el('p'),b.x));if(b.answer){const btn=button('','tb-answer-btn',()=>openSheet({summary:b.kind==='クイズ'?'答え':'例',body:[{t:'p',x:b.answer}]}),'答え');inline(btn,b.kind==='クイズ'?'答え':'例');box.append(btn);}return box;}
 if(b.t==='hook'){const box=el('div','tb-hook');box.append(face('🌱'));const bubble=el('div','tb-hook-bubble');bubble.append(el('span','tb-hook-name','のびー'));bubble.append(inline(el('p'),b.x));box.append(bubble);return box;}
 if(b.t==='talk'){const wrap=el('div','tb-talk');let li_=0;for(const [who,face_,x] of b.lines||[]){const rid=(b.rids||[])[li_++];const w=who||'のびー';const box=el('div','tb-hook tb-talk-line '+(w==='のびー'?'tb-who-nobi':w==='ソラ'?'tb-who-sora tb-talk-right':w==='ミオ'?'tb-who-mio tb-talk-right':'tb-who-other tb-talk-right'));box.append(face(face_||'🌱'));const bubble=el('div','tb-hook-bubble');bubble.append(el('span','tb-hook-name',who||'のびー'));const tp=inline(el('p'),x);if(rid)tp.dataset.rid=rid;bubble.append(tp);box.append(bubble);wrap.append(box);}return wrap;}// かけあい（のびーと生徒）
 if(b.t==='goal'){const box=el('div','tb-goal');box.append(el('span','tb-goal-label','めあて'));box.append(inline(el('p'),b.x));return box;}
 if(b.t==='summary'){const box=el('section','tb-summary');box.append(el('h4',null,'まとめ'));const list=el('ul');for(const x of b.items||[])list.append(inline(el('li'),x));box.append(list);return box;}
 if(b.t==='media'){
  const video=b.kind==='video',fig=el('figure','tb-media tb-media-'+(video?'video':b.kind==='scene'?'scene':'diagram'));
  const scr=n=>{if(b.maxh)n.style.height=b.maxh+'px';return n;};
  if(typeof b.src==='string'&&video&&/^\/textbook-book-[a-z0-9-]+\.(?:mp4|webm)$/.test(b.src)){const v=el('video','tb-media-screen');v.src=b.src;v.controls=true;v.playsInline=true;v.preload='metadata';v.setAttribute('aria-label',b.title||'動画');fig.append(scr(v));}
  else if(typeof b.src==='string'&&!video&&/^\/textbook-book-[a-z0-9-]+\.(?:svg|jpg)$/.test(b.src)){const img=el('img','tb-media-screen');img.src=b.src;img.alt=b.title||'図';if(b.zoom){img.classList.add('tb-zoomable');img.title='押すと大きく見られます';img.addEventListener('click',()=>openSheet({summary:b.title||'図解',wide:true,body:[{t:'zoomimg',src:b.src,alt:b.title||'図'}]}));}fig.append(scr(img));}
  else{const scene=b.kind==='scene',screen=scr(el('div','tb-media-screen tb-media-wait'));screen.append(el('span','tb-media-icon',video?'▶':scene?'✿':'✎'),el('span','tb-media-label',video?(typeof b.ext==='string'&&b.ext?b.ext+'で見る（下のボタンから）':'動画（準備中）'):scene?'絵（準備中）':'図解（準備中）'));fig.append(screen);}
  fig.append(el('figcaption',null,(video?'動画：':b.kind==='scene'?'':'図解：')+(b.title||'')));const tools=frameTools(b);if(tools)fig.append(tools);return fig;
 }
 if(b.t==='zoomimg'&&typeof b.src==='string'&&/^\/textbook-book-[a-z0-9-]+\.(?:svg|jpg)$/.test(b.src)){const img=el('img','tb-zoom-img');img.src=b.src;img.alt=b.alt||'図';return img;}
 if(b.t==='note')return inline(el('p','tb-note'),b.x);
 if(b.t==='topic'){const h=el('h2','tb-topic',b.x);if(b.cont)h.append(el('span','tb-cont','（つづき）'));return h;}
 if(b.t==='ul'||b.t==='ol'){const list=el(b.t,'tb-list');if(b.t==='ol'&&b.start>1)list.start=b.start;(b.items||[]).forEach((item,k)=>{const li=inline(el('li'),item.x);if(item.level)li.classList.add('tb-sub'+Math.min(2,item.level));if(b.rids&&b.rids[k])li.dataset.rid=b.rids[k];list.append(li);});return list;}
 if(b.t==='table'){const wrap=el('div','tb-table-wrap'),table=el('table','tb-table');(b.rows||[]).forEach((row,i)=>{const tr=el('tr');for(const cell of row)tr.append(inline(el(i===0?'th':'td'),cell));table.append(tr);});wrap.append(table);return wrap;}
 if(b.t==='details'){const btn=button('','tb-answer-btn',()=>openSheet(b),b.summary||'答え');inline(btn,b.summary||'答え');return btn;}
 if(b.t==='fig'){
  const fig=el('figure','tb-fig tb-fig-'+(b.kind==='scene'?'scene':'diagram'));
  if(typeof b.src==='string'&&/^\/textbook-book-[a-z0-9-]+\.(?:svg|jpg)$/.test(b.src)){const img=el('img');if(!measuring)img.src=b.src;img.alt=b.caption||'図';img.decoding='async';const r=ratio.get(b.src);let hgt=r?Math.round(Math.min(b.kind==='scene'?210:220,480*r)):(b.kind==='scene'?210:220);if(b.maxh)hgt=Math.min(hgt,b.maxh);img.style.height=hgt+'px';fig.append(img);}
  else{fig.classList.add('tb-fig-empty');fig.append(el('div','tb-fig-box',b.kind==='scene'?'絵（準備中）':'図（準備中）'));}
  if(b.caption)fig.append(el('figcaption',null,b.caption));const tools=frameTools(b);if(tools)fig.append(tools);return fig;
 }
 if(b.t==='chapmark'){const mark=el('div','tb-chap-mark');mark.append(el('span','tb-chap-num',b.num),el('span','tb-chap-word',b.word==null?'章':b.word));return mark;}
 if(b.t==='h1')return el('h1','tb-chap-title',b.x);
 if(b.t==='big')return el('h2','tb-big-title',b.x);
 if(b.t==='endart'){const box=el('div','tb-fig tb-end-art'+(b.small?' tb-end-art-small':''));box.append(coverArt(state.book&&state.book.meta&&state.book.meta.subject||'数学'));return box;}
 if(b.t==='tocchap'){const row=el('div','tb-toc-chapter');row.append(el('span','tb-toc-num',b.num),el('span','tb-toc-title',b.title));if(b.page)row.append(tocButton(b.page,b.num+' '+b.title));return row;}
 if(b.t==='tocsec'){const r=el('div','tb-toc-section'+(b.wait?' tb-toc-wait-row':''));r.append(el('span','tb-toc-title',b.title));r.append(b.page?tocButton(b.page,b.title):el('span','tb-toc-wait','準備中'));return r;}
 if(b.t==='guide'){const list=el('div','tb-guide');for(const [tag,text] of b.rows){const r=el('div','tb-guide-row');r.append(el('span','tb-tag',tag),el('span',null,text));list.append(r);}return list;}
 return null;
}
function isQuestion(b){return !!b&&((b.t==='p'&&/^\*\*(確認\d|R\d|チェック\d|振り返り\d|Q\d|練習\d|問\d)/.test(String(b.x||'')))||(b.t==='h3'&&/^例題/.test(String(b.x||''))));}
function tocButton(logical,label){const go=()=>goPage(state.book.map[logical]);const b=button('p.'+(state.book.map[logical]||'000'),'tb-toc-page',go,label+'へ');return b;}

// ---- 原稿のページを、実際の紙のページに組む ----
function logicalBlocks(p,book){
 const topic=p.topic?[{t:'topic',x:p.topic}]:[];
 if(p.kind==='toc'){
  const out=[{t:'big',x:'もくじ'}];
  for(const ch of book.toc||[]){
   out.push({t:'tocchap',num:ch.chapter,title:ch.title,page:ch.page});
   if(ch.preparing)out.push({t:'tocsec',title:(ch.sections||[]).map(s=>s.title).join('／'),wait:true});
   else for(const sec of ch.sections||[])out.push({t:'tocsec',title:sec.title,page:sec.page});
  }
  out.push({t:'endart',optional:true,small:true});
  return out;
 }
 if(p.kind==='guide'&&Array.isArray(p.rows))return [{t:'big',x:'この教科書の使い方'},{t:'guide',rows:p.rows},{t:'endart',optional:true,small:true}];// 教科ごとの使い方（国語など）
 if(p.kind==='guide')return [{t:'big',x:'この教科書の使い方'},{t:'guide',rows:[['はじめに','身近な場面から、これから学ぶことを考える'],['しくみ','なぜそうなるのかを、図とことばで理解する'],['解き方','どこを見て、どの順番で考えるかを知る'],['例題','途中の式と、それぞれの理由を読む'],['確認','自分で解いて、答えと解説で確かめる'],['つかってみよう','別の場面に使ってみる'],['練習','これができれば授業は楽勝。★はテストによく出る形'],['ふりかえり','学んだことを自分のことばで整理する'],['ポイント','その節の大事なことと、かんたんにやる方法']]},{t:'h3',x:'ヒントと答え'},{t:'p',x:'「ヒント」「答えと解説」のボタンを押すと、ページの上に開きます。まず自分で考えてから開きましょう。'},{t:'h3',x:'ページのめくり方'},{t:'p',x:'左右の「＜」「＞」を押すか、キーボードの ← → 、または画面を左右にすべらせると、2ページずつめくれます。もくじのページ番号を押すと、そのページへとびます。'}];
 if(p.kind==='chapter-open')return [/章$/.test(p.chapter||'')?{t:'chapmark',num:(p.chapter||'').replace('章','')}:{t:'chapmark',num:p.chapter||'',word:''},{t:'h1',x:p.chapterTitle||''},...(p.blocks||[])];
 if(p.kind==='preparing')return [{t:'chapmark',num:(p.chapter||'').split('章')[0]},{t:'h1',x:(p.chapter||'').replace(/^\d+章\s*/,'')},...(p.scene&&p.scene.src?[p.scene]:[]),{t:'ul',items:(p.sections||[]).map(x=>({level:0,x}))},{t:'note',x:'この章は準備中です。できしだい、このページに追加されます。'}];
 if(p.kind==='end')return [{t:'big',x:'おわり'},{t:'endart'},{t:'p',x:(book.toc||[]).some(c=>c.preparing)?'ここまで読んでくれてありがとう。まだ準備中の章は、できしだいこの本に追加されます。':'ここまで読んでくれてありがとう。これで、この本はぜんぶです。'},{t:'p',x:'わからなかったところは、もくじから何度でも読み返そう。'}];
 return [...topic,...(p.blocks||[])];
}
function shell(desc,side){
 const page=el('article','tb-page tb-'+side+' tb-kind-'+desc.kind);if(desc.tag)page.dataset.tag=desc.tag;
 if(desc.kind==='content'||desc.kind==='points'){const head=el('div','tb-head');head.append(el('span','tb-sec',desc.section||''),el('span','tb-sec-title',desc.sectionTitle||''));if(desc.tag)head.append(el('span','tb-tag',desc.tag));page.append(head);}
 const body=el('div','tb-body');page.append(body);
 if(desc.chapter&&!['chapter-open','preparing'].includes(desc.kind)){const index=el('div','tb-index');for(const part of String(desc.chapter).split(/(\d+)/))if(part)index.append(/^\d+$/.test(part)?el('span','tb-tcy',part):document.createTextNode(part));page.append(index);}
 if(desc.n){const foot=el('div','tb-foot');foot.append(el('span','tb-num',String(desc.n)));if(desc.chapter&&desc.kind!=='toc')foot.append(el('span','tb-foot-chapter',desc.chapter+(desc.section&&desc.section!=='章末'?'　'+desc.section+' '+(desc.sectionTitle||''):'')));page.append(foot);}
 return {page,body};
}
// 最後の部品の余白と、登場アニメーションの下向き10px＋丸めの4pxを確保する。
const SAFE=14;
const over=body=>{const last=body.lastElementChild;if(!last)return false;const mb=parseFloat(getComputedStyle(last).marginBottom)||0;return last.offsetTop+last.offsetHeight+mb>body.clientHeight-SAFE||body.scrollHeight>body.clientHeight+1;};
function split(b,body){
 // 長い箇条書き・表は、入るところまで置いて、残りを次のページへ回す。
 // 長いかけあいは、行の切れ目で次のページへ分ける（読み上げのIDも一緒に分ける）
 if(b.t==='talk'&&(b.lines||[]).length>2){
  const L=b.lines;let keep=0;
  for(let i=1;i<L.length;i++){const node=block({...b,lines:L.slice(0,i),rids:b.rids&&b.rids.slice(0,i)});body.append(node);const bad=over(body);node.remove();if(bad)break;keep=i;}
  if(keep>0&&keep<L.length)return [{...b,lines:L.slice(0,keep),rids:b.rids&&b.rids.slice(0,keep)},{...b,lines:L.slice(keep),rids:b.rids&&b.rids.slice(keep)}];
 }
 if(b.t==='ul'||b.t==='ol'){
  const items=b.items||[];let keep=0;
  for(let i=1;i<=items.length;i++){const node=block({...b,items:items.slice(0,i)});body.append(node);const bad=over(body);node.remove();if(bad)break;keep=i;}
  if(keep>0&&keep<items.length)return [{...b,items:items.slice(0,keep),rids:b.rids&&b.rids.slice(0,keep)},{...b,items:items.slice(keep),rids:b.rids&&b.rids.slice(keep),start:(b.start||1)+keep}];
 }
 if(b.t==='table'&&(b.rows||[]).length>2){
  const rows=b.rows;let keep=0;
  for(let i=2;i<=rows.length;i++){const node=block({...b,rows:rows.slice(0,i)});body.append(node);const bad=over(body);node.remove();if(bad)break;keep=i;}
  if(keep>=2&&keep<rows.length)return [{...b,rows:rows.slice(0,keep)},{...b,rows:[rows[0],...rows.slice(keep)]}];
 }
 return null;
}
const FLOW_MIN=230,FILL_MIN=90;
// ページの下に空きが残ったら、その節の豆知識・クイズ・やってみよう を入れる（同じものは1回だけ）
function fill(cur,book){
 if(!cur||!cur.body||!['content','points','chapter-open'].includes(cur.kind))return;
 const all=book.fillers||{},own=cur.kind==='chapter-open'?cur.chapter+'|扉':cur.chapter+'|'+cur.section;book.usedFillers=book.usedFillers||new Set();
 // その節（章のとびらなら章）のものを先に、足りなければ「勉強のコツ」を使う
 const pool=[...(all[own]||[]).map(f=>[own,f]),...(all['共通']||[]).map(f=>['共通',f])];
 let tries=0;
 for(const [where,f] of pool){
  if(cur.body.clientHeight-used(cur.body)<FILL_MIN||tries>=4)break;
  const key=where+'|'+f.title;if(book.usedFillers.has(key))continue;
  const b={t:'extra',...f},node=block(b);cur.body.append(node);
  tries++;if(over(cur.body)){node.remove();continue;}
  cur.blocks.push(b);book.usedFillers.add(key);
 }
}// 次の部分を同じページに続けるのに必要な空き（px）
function used(body){const last=body.lastElementChild;return last?last.offsetTop+last.offsetHeight:0;}
function flows(prev,p){return !!prev&&['content','points'].includes(p.kind)&&['content','points'].includes(prev.kind)&&prev.chapter===p.chapter&&prev.section===p.section&&p.tag!=='はじめに'&&p.tag!=='章のまとめ'&&p.tag!=='まとめの問題';}
async function paginate(book,measure,progress){
 measuring=true;try{return await paginateBody(book,measure,progress);}finally{measuring=false;}
}
async function paginateBody(book,measure,progress){
 const pages=[],map={};book.usedFillers=new Set();let count=0;let cur=null,prev=null,placed=0;
 for(const p of book.pages){
  if(++count%8===0){progress?.(count,book.pages.length);await new Promise(r=>setTimeout(r,0));}
  if(p.kind==='cover'){if(cur){pages.push(cur);cur=null;}map[p.n]=pages.length+1;pages.push({kind:'cover'});prev=p;continue;}
  const base={kind:p.kind,chapter:p.chapter,section:p.section,sectionTitle:p.sectionTitle,tag:p.tag};
  const queue=logicalBlocks(p,book);
  const open=cont=>{cur={...base,cont,blocks:[]};const s=shell(cur,'left');measure.replaceChildren(s.page);cur.body=s.body;placed=0;if(cont&&p.topic)queue.unshift({t:'topic',x:p.topic,cont:true});};
  if(cur&&flows(prev,p)&&cur.body.clientHeight-used(cur.body)>=FLOW_MIN){
   // 同じ節の続きは、空きがあれば同じページに続けて組む（種類の札で区切る）
   map[p.n]=pages.length+1;queue.unshift({t:'divider',tag:p.tag});placed=1;
  }else{if(cur){fill(cur,book);pages.push(cur);}map[p.n]=pages.length+1;open(false);}
  while(queue.length){
   // 残りをまとめて置き、1回の計算で「どこからはみ出すか」を見つける（1つずつ測るより速い）
   const batch=[];for(const x of queue){const n=block(x);batch.push(n);if(n)cur.body.append(n);}
   const limit=cur.body.clientHeight-SAFE;let k=batch.findIndex(n=>n&&n.offsetTop+n.offsetHeight>limit);
   if(k<0&&over(cur.body))k=batch.length-1;
   const fit=k<0?batch.length:k;
   for(let i=fit;i<batch.length;i++)batch[i]?.remove();
   for(let i=0;i<fit;i++)if(batch[i]){cur.blocks.push(queue[i]);placed++;}
   queue.splice(0,fit);
   while(cur.blocks.length>1&&over(cur.body)){queue.unshift(cur.blocks.pop());cur.body.lastElementChild?.remove();placed--;}
   if(!queue.length)break;
   const b=queue.shift();if(!block(b))continue;
   if(b.optional)continue;// 飾りの絵は、入らなければ入れない（新しいページを作らない）
   // 図・動画は、空きが140px以上あれば小さくしてこのページに収める
   if(['fig','media'].includes(b.t)&&placed>0){const free=cur.body.clientHeight-used(cur.body),cap=48;if(free-cap>=140){const small={...b,maxh:Math.min(free-cap-16,b.t==='media'?200:220)};const n2=block(small);cur.body.append(n2);if(!over(cur.body)){cur.blocks.push(small);placed++;continue;}n2.remove();}}
   const parts=split(b,cur.body);
   if(parts){cur.blocks.push(parts[0]);cur.body.append(block(parts[0]));queue.unshift(parts[1]);}
   else if(placed===0||(placed===1&&cur.blocks[0].t==='topic')||cur.blocks.every(x=>['divider','topic','goal','h3','h4'].includes(x.t))){cur.blocks.push(b);cur.body.append(block(b));placed++;continue;}// 見出しだけのページなら、入りきらない部品もここに置く（見出しと一緒に次のページへ回し続けて、組み終わらなくなるのを防ぐ）// 分割できない部品も測定用のページへ置き、後続がその高さを無視しないようにする
   else queue.unshift(b);
   // 見出しだけがページの下に残らないように、見出しごと次のページへ回す
   const moved=[];while(cur.blocks.length>1&&['divider','topic','goal','h3','h4'].includes(cur.blocks[cur.blocks.length-1].t)){moved.unshift(cur.blocks.pop());cur.body.lastElementChild?.remove();}
   const fresh=moved.some(x=>x.t==='divider'||(x.t==='topic'&&!x.cont));
   fill(cur,book);pages.push(cur);
   if(fresh){open(false);queue.unshift(...moved.filter(x=>x.t!=='divider'));}
   else{open(true);queue.splice(p.topic?1:0,0,...moved);}
  }
  prev=p;
 }
 if(cur){fill(cur,book);pages.push(cur);}
 measure.replaceChildren();
 // 問題コード：ページ番号＋そのページでの順番（12-A、12-B …）
 pages.forEach((d,i)=>{d.n=i+1;delete d.body;let k=0;for(const b of d.blocks||[])if(isQuestion(b)){b.code=d.n+'-'+String.fromCharCode(65+Math.min(k++,25));}});
 return {pages,map};
}
function renderPage(desc,side){
 if(!desc){const page=el('article','tb-page tb-'+side+' tb-blank');return page;}
 if(desc.kind==='cover'){const page=el('article','tb-page tb-'+side+' tb-kind-cover');page.dataset.page='1';page.append(cover(state.book.meta,false));return page;}
 const s=shell(desc,side);s.page.dataset.page=String(desc.n);
 let i=0;for(const b of desc.blocks){const node=block(b);if(node){node.style.setProperty('--i',String(Math.min(i++,10)));s.body.append(node);}}
 return s.page;
}

// ---- 答えの札 ----
function openSheet(b){state.sheet=b;renderSheet();}
function closeSheet(){state.sheet=null;renderSheet();}
function renderSheet(){
 const app=state.app;if(!app)return;app.querySelector('.tb-sheet-back')?.remove();
 if(!state.sheet)return;
 const back=el('div','tb-sheet-back'),card=el('div',state.sheet.wide?'tb-sheet tb-sheet-wide':'tb-sheet');card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');
 const title=el('h3','tb-sheet-title');inline(title,state.sheet.summary||'答え');card.setAttribute('aria-label',title.textContent);
 const body=el('div','tb-sheet-body');for(const x of state.sheet.body||[]){const node=block(x);if(node)body.append(node);}
 const close=button('閉じる','tb-btn tb-sheet-close',closeSheet,'閉じる');
 card.append(title,body,close);back.append(card);back.addEventListener('click',e=>{if(e.target===back)closeSheet();});
 back.style.setProperty('--tb-color',state.book?.meta.color||'#1f5fa8');back.style.setProperty('--tb-tint',tint(state.book?.meta.color,0.88));
 app.append(back);close.focus();
}

// ---- 見開き ----
function spreads(count){const list=[[1]];for(let n=2;n<=count;n+=2)list.push(n+1<=count?[n,n+1]:[n]);return list;}
// 縦向きの画面（スマホ・タブレットを縦に持ったとき）は1ページずつ、横向きは2ページの見開き。向きを変えると自動で切りかわる。
function isSingle(){const a=state.app;const w=a&&a.clientWidth||root.innerWidth||0,h=a&&a.clientHeight||root.innerHeight||0;return w>0&&h>0&&w<h;}
function views(){const count=state.book?state.book.phys.length:0;if(!state.single)return spreads(count);const list=[];for(let n=1;n<=count;n++)list.push([n]);return list;}
// ---- 教科書と問題の行き来（2026-10-06）：textbook-links.json で、本の章・節と問題タブの大単元を結ぶ ----
let links=[];
async function loadLinks(){try{const d=await loadJson('/textbook-links.json');if(d&&d.v===1&&Array.isArray(d.links))links=d.links.filter(l=>l&&typeof l.book==='string'&&typeof l.major==='string'&&Array.isArray(l.targets)&&l.targets.length);}catch(_){links=[];}}
function linkFor(subject,grade,major){return links.find(l=>l.subject===subject&&l.grade===grade&&l.major===major)||null;}
function tocPage(book,target){for(const c of book.toc||[]){if(c.title===target)return c.page;for(const sec of c.sections||[])if(sec.title===target)return sec.page;}return 0;}
// いま見ているページが入っている章と節（本の中のページ番号で比べる）
function placeOf(n){const b=state.book;if(!b)return null;let at=null;for(const c of b.toc||[]){const cp=b.map[c.page]||c.page;if(cp<=n)at={chapter:c.title,section:null};for(const sec of c.sections||[]){const sp=b.map[sec.page]||sec.page;if(sp<=n)at={chapter:c.title,section:sec.title};}}return at;}
function problemLink(n){const at=placeOf(n);if(!at||!state.book)return null;return links.find(l=>l.book===state.book.meta.id&&(l.targets.includes(at.section)||l.targets.includes(at.chapter)))||null;}
function toProblems(link){leave();if(typeof root.switchView==='function')root.switchView('study');root.NobiMaterialEntry?.focus?.({subject:link.subject,grade:link.grade,major:link.major});}
// 問題タブの「教科書を読む」から：本を開いて、その章・節のページへ
function openAt(link){if(!link||typeof link.book!=='string')return false;state.pending={book:link.book,target:link.targets[0]};if(typeof root.switchView==='function')root.switchView('textbook');else void enter();return true;}
function relayout(){
 const single=isSingle();if(single===state.single)return false;
 // 縦→横→縦と回したとき、もとの1ページに戻れるように、縦で見ていたページを覚えておく
 const cur=state.book?(views()[state.spread]||[1]):[1];if(state.single)state.anchor=cur[0];
 const was=!state.single&&cur.includes(state.anchor)?state.anchor:cur[0];state.single=single;
 if(state.book){const at=views().findIndex(v=>v.includes(was));state.spread=at>=0?at:0;}
 return true;
}
function goPage(n){if(!state.book||!n)return;const list=views();const at=list.findIndex(s=>s.includes(n));if(at>=0){state.motion=at>state.spread?'next':'prev';state.spread=at;state.sheet=null;render();}}
function turn(delta){if(state.view!=='book'||!state.book)return;const list=views(),next=state.spread+delta;if(next<0||next>=list.length)return;state.spread=next;state.sheet=null;state.motion=delta>0?'next':'prev';render();}
function fitSpread(){
 const stage=state.app&&state.app.querySelector('.tb-stage'),wrap=stage&&stage.querySelector('.tb-spread-wrap'),spread=wrap&&wrap.querySelector('.tb-spread');if(!spread)return;
 const k=state.single?1:2,scale=Math.max(0.1,Math.min((stage.clientWidth-12)/(k*W),(stage.clientHeight-12)/H));
 spread.style.transform='scale('+scale+')';wrap.style.width=(k*W*scale)+'px';wrap.style.height=(H*scale)+'px';
 // 縦長の画面で下に余白があるときは、＜ ＞を本の下に出して本文に重ねない。
 const below=stage.clientHeight-H*scale>150;stage.classList.toggle('tb-nav-below',below);
 stage.style.setProperty('--tb-nav-top',below?(stage.clientHeight/2+H*scale/2+44)+'px':'50%');
}

// ---- 画面 ----
function bar(title,actions){const b=el('div','tb-bar');b.append(el('div','tb-bar-title',title));const right=el('div','tb-bar-actions');actions.forEach(a=>right.append(a));b.append(right);return b;}
function homeButton(){return button('のびログに戻る','tb-btn tb-btn-home',()=>{leave();if(typeof root.switchView==='function')root.switchView('study');},'のびログに戻る');}
function exitButton(){return button('全画面を終わる','tb-btn',()=>leave(),'全画面を終わる');}
function render(){
 const app=state.app;if(!app)return;
 app.replaceChildren();app.classList.toggle('tb-open',state.view!=='gate');
 if(state.view==='gate'){
  const gate=el('div','tb-gate');gate.append(el('p','tb-gate-icon','📚'),el('h3',null,'教科書は全画面で読みます'),el('p',null,'2ページの見開きで、本のようにめくって読めます。'));
  gate.append(button('全画面で教科書を開く','tb-btn tb-btn-main',()=>void enter()));
  if(state.message)gate.append(el('p','tb-gate-message',state.message));
  app.append(gate);return;
 }
 if(state.view==='shelf'){
  app.append(bar('本棚',[homeButton(),exitButton()]));
  const shelf=el('div','tb-shelf');shelf.append(el('p','tb-shelf-lead','読みたい教科書を選んでください。'));
  const grid=el('div','tb-shelf-grid');
  for(const book of state.shelf||[]){
   const ready=book.status==='ready';
   const b=button('','tb-book'+(ready?'':' tb-book-wait'),()=>{if(ready)void openBook(book);},book.title+(ready?'を開く':'（準備中）'));
   if(!ready){b.disabled=true;b.setAttribute('aria-disabled','true');}
   b.append(cover(book,true),el('span','tb-book-title',book.title));grid.append(b);
  }
  shelf.append(grid);if(state.message)shelf.append(el('p','tb-shelf-message',state.message));
  const measure=el('div','tb-measure');measure.setAttribute('aria-hidden','true');shelf.append(measure);
  app.append(shelf);return;
 }
 relayout();const book=state.book,list=views(),pair=list[state.spread]||list[0];
 const info=pair[0]===1?'表紙':'p.'+pair.join('–')+' / '+book.phys.length,spreadCode=(book.meta.code||'')+pair.join('-');
 const codeBox=el('form','tb-jump'),codeInput=el('input');codeInput.type='text';codeInput.inputMode='text';codeInput.placeholder='コード（12-A）';codeInput.setAttribute('aria-label','コードでページへ移動');codeInput.maxLength=12;codeBox.append(codeInput,button('移動','tb-btn',()=>{},'コードで移動'));codeBox.lastChild.type='submit';codeBox.addEventListener('submit',e=>{e.preventDefault();jump(codeInput.value);});
 app.append(bar(book.meta.title,[el('span','tb-spread-code',spreadCode),el('span','tb-page-info',info),codeBox,...(problemLink(pair[pair.length-1])?[button('問題を解く','tb-btn tb-btn-problems',()=>toProblems(problemLink(pair[pair.length-1])),'この単元の問題を解く')]:[]),button('もくじ','tb-btn',()=>goPage(2),'もくじへ戻る'),button('本棚へ','tb-btn',()=>{state.view='shelf';state.book=null;state.sheet=null;render();},'本棚へ戻る'),homeButton(),exitButton()]));
 const stage=el('div','tb-stage'),wrap=el('div','tb-spread-wrap'),spread=el('div','tb-spread'+(state.single?' tb-single':'')+(state.motion?' tb-turn-'+state.motion:''));state.motion=null;
 spread.style.setProperty('--tb-color',book.meta.color);spread.style.setProperty('--tb-tint',tint(book.meta.color,0.88));spread.style.setProperty('--tb-soft',tint(book.meta.color,0.94));
 const page=n=>book.phys[n-1];
 if(state.single)spread.append(renderPage(page(pair[0]),pair[0]%2?'right':'left'));
 else if(pair[0]===1)spread.append(renderPage(null,'left'),renderPage(page(1),'right'));
 else spread.append(renderPage(page(pair[0]),'left'),renderPage(pair[1]?page(pair[1]):null,'right'));
 wrap.append(spread);
 const prev=button('＜','tb-nav tb-prev',()=>turn(-1),'前のページ'),next=button('＞','tb-nav tb-next',()=>turn(1),'次のページ');
 prev.disabled=state.spread===0;next.disabled=state.spread>=list.length-1;
 stage.append(wrap,prev,next);app.append(stage);
 let start=null;
 stage.addEventListener('pointerdown',e=>{start={x:e.clientX,y:e.clientY};});stage.addEventListener('pointercancel',()=>{start=null;});stage.addEventListener('dragstart',e=>e.preventDefault());
 stage.addEventListener('pointerup',e=>{if(!start)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;start=null;if(Math.abs(dx)>60&&Math.abs(dy)<50)turn(dx<0?1:-1);});
 yRender(stage,spread);
 fitSpread();renderSheet();
 if(state.highlight){const q=spread.querySelector('[data-code="'+state.highlight+'"]');if(q)q.classList.add('tb-highlight');state.highlight=null;}
}
// ===== 🔊 本文の読み上げ（Claude・2026-10-06）=====
// 押すと声で読み、いま読んでいる1行に色がつき、その下の線が読む速さに合わせてなめらかに伸びる。
// 音声と「どの文字を何秒に読むか」の表は /textbook-yomi-<節>.json（Claude_Codex共有/読み上げ/make_yomi.py が作る）。
// 線の位置は、表の区切り（読点・句点ごと）の中を時間で割り合わせて文字の位置を出し、文字の実際の場所（Range）に合わせて描く。
const Y={on:false,auto:false,audio:null,code:null,data:null,order:[],el:null,chars:null,at:0,spread:-1,gen:0,raf:0,lt:-1,lp:0};
function yCode(rid){return String(rid).replace(/-[HNTU]\d+$/,'');}
// 読むまとまり：本文とあらすじ（H・N）、しくみの会話（T）、例題の会話（U）。押したまとまりの終わりで止まる
function yKind(rid){const m=/-([HNTU])\d+$/.exec(String(rid));return m?(m[1]==='N'?'H':m[1]):'';}
function yFirst(spread){const yo=state.book&&state.book.yomi;if(!yo||!spread)return null;for(const n of spread.querySelectorAll('[data-rid]'))if(yo[yCode(n.dataset.rid)])return n;return null;}
function yPageOf(rid){const ph=(state.book&&state.book.phys)||[];for(let i=0;i<ph.length;i++)for(const b of ph[i].blocks||[])if(b&&(b.rid===rid||(b.rids||[]).includes(rid)))return i+1;return 0;}
function yBtn(label){const b=state.app&&state.app.querySelector('.tb-yomi-btn');if(!b)return;b.classList.toggle('on',Y.on);b.querySelector('span').textContent=label||(Y.on?'とめる':'読み上げ');b.querySelector('img').src=Y.on?'/nobi-read.svg':'/nobi-normal.svg';b.setAttribute('aria-pressed',Y.on?'true':'false');}
function yNote(msg){const info=state.app&&state.app.querySelector('.tb-page-info');if(info)info.textContent=msg;}
function yClear(){document.querySelectorAll('.tb-yomi').forEach(x=>x.remove());Y.el=null;Y.chars=null;}
function yStop(){Y.on=false;Y.gen++;cancelAnimationFrame(Y.raf);if(Y.audio)try{Y.audio.pause();}catch(_){}yClear();yBtn();}
const yCache={};
async function yLoad(code){
 const url=state.book&&state.book.yomi[code];if(typeof url!=='string'||!/^\/textbook-yomi-[a-z0-9-]+\.json$/.test(url))return null;
 if(!yCache[code])yCache[code]=fetch(url,{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('yomi');return r.json();}).then(d=>(d&&d.blocks&&typeof d.audio==='string'&&/^\/textbook-yomi-[a-z0-9-]+\.mp3$/.test(d.audio))?d:null).catch(()=>{delete yCache[code];return null;});
 return yCache[code];
}
function yAudio(src){
 if(!Y.audio){Y.audio=new Audio();Y.audio.preload='auto';Y.audio.addEventListener('ended',()=>{if(Y.on)yStop();});}
 if(Y.audio.getAttribute('src')!==src){Y.audio.src=src;try{Y.audio.load();}catch(_){}}
 return Y.audio;
}
async function yPrefetch(code){if(Y.on)return;const d=await yLoad(code);if(d&&!Y.on)yAudio(d.audio);}
async function yStart(from){
 const book=state.book,spread=state.app&&state.app.querySelector('.tb-spread');const first=from||yFirst(spread);if(!book||!first)return;
 const code=yCode(first.dataset.rid);
 const gen=++Y.gen;yBtn('じゅんび中…');
 const data=await yLoad(code);
 if(gen!==Y.gen)return;
 if(!data){yStop();yNote('読み上げの音声を読み込めませんでした。');return;}
 const kind=yKind(first.dataset.rid);Y.code=code;Y.data=data;Y.order=Object.keys(data.blocks).filter(k=>yKind(k)===kind).sort((a,b)=>data.blocks[a].t0-data.blocks[b].t0);
 yAudio(data.audio);
 const blk=data.blocks[first.dataset.rid];Y.on=true;Y.spread=state.spread;yClear();
 try{const p=Y.audio.play();if(p&&p.then)await p;}catch(_){if(gen===Y.gen){yStop();yNote('音声を再生できませんでした。もう一度押してください。');}return;}
 if(gen!==Y.gen)return;
 try{Y.audio.currentTime=blk?blk.t0:0;}catch(_){}
 Y.lt=-1;yBtn();cancelAnimationFrame(Y.raf);Y.raf=requestAnimationFrame(yTick);
}
// 文字ひとつずつの場所（ページの中の座標。拡大縮小をもどした値）と、行のはじめ・終わり
function yMeasure(el){
 const page=el.closest('.tb-page');if(!page)return null;const pr=page.getBoundingClientRect(),sc=(pr.width/page.offsetWidth)||1;
 const list=[],range=document.createRange();
 const walk=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement&&n.parentElement.closest('rt,rp,.tb-code')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
 let n;while((n=walk.nextNode())){for(let i=0;i<n.length;i++){range.setStart(n,i);range.setEnd(n,i+1);const rs=range.getClientRects();const r=rs.length?rs[rs.length-1]:range.getBoundingClientRect();list.push({x:(r.left-pr.left)/sc,y:(r.top-pr.top)/sc,w:r.width/sc,h:r.height/sc});}}
 let st=0;for(let i=0;i<list.length;i++){if(i>0&&list[i].y>list[i-1].y+list[i-1].h*.5)st=i;list[i].ls=st;}
 for(let i=list.length-1,en=list.length-1;i>=0;i--){if(i<list.length-1&&list[i+1].ls!==list[i].ls)en=i;list[i].le=en;}
 return {page,list};
}
function yDraw(c,pos){
 if(!c||!c.list.length)return;const L=c.list,i=Math.min(L.length-1,Math.max(0,Math.floor(pos))),f=Math.min(1,Math.max(0,pos-i)),r=L[i];
 let top=1e9,bot=-1e9;for(let k=r.ls;k<=r.le;k++){top=Math.min(top,L[k].y);bot=Math.max(bot,L[k].y+L[k].h);}
 const a=L[r.ls],e=L[r.le],x=r.x+r.w*f;
 let lay=c.page.querySelector('.tb-yomi');
 if(!lay){document.querySelectorAll('.tb-yomi').forEach(z=>z.remove());lay=el('div','tb-yomi');const tip=document.createElement('img');tip.className='tb-yomi-nobi';tip.src='/nobi-read.svg';tip.alt='';lay.append(el('div','tb-yomi-band'),el('div','tb-yomi-line'),tip);c.page.append(lay);}
 const [band,line,tip]=lay.children;
 band.style.cssText='left:'+(a.x-6)+'px;top:'+(top-3)+'px;width:'+(e.x+e.w-a.x+12)+'px;height:'+(bot-top+6)+'px';
 const full=Math.max(1,e.x+e.w-a.x);line.style.cssText='left:'+a.x+'px;top:'+(bot+1)+'px;width:'+full+'px;transform:scaleX('+Math.min(1,Math.max(0,(x-a.x)/full)).toFixed(4)+')';
 tip.style.cssText='left:'+Math.max(2,a.x-34)+'px;top:'+((top+bot)/2-15)+'px';
}
function yTick(){
 if(!Y.on||!Y.audio||!Y.data)return;const A=Y.audio,D=Y.data,now=performance.now();
 // 再生時間は数十ミリ秒ごとにしか変わらないことがあるので、その間は時計で補ってなめらかにする
 const ct=A.currentTime;if(ct!==Y.lt){Y.lt=ct;Y.lp=now;}const t=A.paused?ct:Math.min(ct+.25,Y.lt+(now-Y.lp)/1000*(A.playbackRate||1));
 let rid=null;for(const k of Y.order){if(D.blocks[k].t0<=t+.05)rid=k;else break;}
 const last=Y.order[Y.order.length-1];if(last&&t>D.blocks[last].t1+.8){yStop();return;}
 if(rid){
  const spread=state.app&&state.app.querySelector('.tb-spread');let node=spread&&spread.querySelector('[data-rid="'+rid+'"]');
  if(!node){const n=yPageOf(rid);if(n){Y.auto=true;try{goPage(n);}finally{Y.auto=false;}Y.spread=state.spread;yClear();}}
  else{
   if(node!==Y.el){Y.el=node;Y.chars=null;}
   if(!Y.chars||now-Y.at>350){Y.chars=yMeasure(node);Y.at=now;}
   const B=D.blocks[rid];let pos=0;
   for(const [s,e,t0,t1] of B.segs){if(t>=t1){pos=e;continue;}if(t>=t0)pos=s+(e-s)*Math.min(1,(t-t0)/Math.max(.01,t1-t0));break;}
   if(Y.chars)yDraw(Y.chars,pos*(Y.chars.list.length/Math.max(1,B.n)));
  }
 }
 Y.raf=requestAnimationFrame(yTick);
}
// 見開きを描くたびに呼ぶ：ボタンを置く。読み上げ中に自分でページを動かしたら止める
function yRender(stage,spread){
 if(Y.on&&!Y.auto&&Y.spread!==state.spread)yStop();
 const first=yFirst(spread);if(!first)return;
 const b=el('button','tb-yomi-btn');b.type='button';b.setAttribute('aria-label','本文を読み上げる');const img=document.createElement('img');img.alt='';b.append(img,el('span'));
 b.addEventListener('click',e=>{e.stopPropagation();if(Y.on)yStop();else void yStart();});b.addEventListener('pointerdown',e=>e.stopPropagation());b.addEventListener('pointerup',e=>e.stopPropagation());
 stage.append(b);yBtn();
 void yPrefetch(yCode(first.dataset.rid));
 // 読み上げ中に段落を押すと、そこから読む
 spread.addEventListener('click',e=>{const p=e.target.closest&&e.target.closest('[data-rid]');if(!p||!Y.on||!Y.data)return;if(!Y.order.includes(p.dataset.rid)){if(state.book.yomi[yCode(p.dataset.rid)])void yStart(p);return;}const B=Y.data.blocks[p.dataset.rid];if(B&&Y.audio){try{Y.audio.currentTime=B.t0;}catch(_){}Y.lt=-1;}});
}
// コードで移動：「数12-13」「12」「12-A」を受け付ける。問題コードならその問題を光らせる。
function jump(raw){
 const book=state.book;if(!book)return;
 const text=String(raw||'').normalize('NFKC').replace(/\s/g,'').replace(/^[^\d]+/,'').toUpperCase();
 const m=/^(\d{1,4})(?:-(\d{1,4}|[A-Z]))?$/.exec(text);
 if(!m){state.message='コードの形を確かめてください（例：12-A、数12-13）。';flash();return;}
 const n=Number(m[1]);if(n<1||n>book.phys.length){state.message='そのページはありません。';flash();return;}
 state.highlight=m[2]&&/[A-Z]/.test(m[2])?n+'-'+m[2]:null;goPage(n);
}
function flash(){const info=state.app?.querySelector('.tb-page-info');if(info){info.textContent=state.message;state.message='';}}
async function loadJson(url){const r=await fetch(url,{cache:'no-cache'});if(!r.ok)throw Error('load');return r.json();}
async function showShelf(){
 const run=++state.epoch;state.view='shelf';state.message=state.shelf?'':'本棚を読み込んでいます。';render();
 if(state.shelf){if(state.pending){const meta=state.shelf.find(b=>b.id===state.pending.book&&b.status==='ready');if(meta)void openBook(meta);else state.pending=null;}return;}
 try{const data=await loadJson('/textbook-books.json');if(run!==state.epoch)return;if(!data||!Array.isArray(data.books))throw Error('shelf');state.shelf=data.books.filter(b=>b&&typeof b.id==='string'&&typeof b.title==='string');state.message='';}
 catch(_){if(run===state.epoch)state.message='本棚を読み込めませんでした。全画面を終わって、もう一度開いてください。';}
 if(run===state.epoch&&state.view==='shelf')render();
 if(run===state.epoch&&state.view==='shelf'&&state.pending){const meta=(state.shelf||[]).find(b=>b.id===state.pending.book&&b.status==='ready');if(meta)void openBook(meta);else state.pending=null;}
}
// 図の高さが決まってから組む（画像の読み込みを待つ。読めない画像は枠だけで組む）
function preload(pages){
 const srcs=new Set();for(const p of pages)for(const b of p.blocks||[])if(b&&b.t==='fig'&&typeof b.src==='string')srcs.add(b.src);
 return Promise.all([...srcs].map(src=>new Promise(r=>{const i=new Image();i.onload=()=>{if(i.naturalWidth)ratio.set(src,i.naturalHeight/i.naturalWidth);r();};i.onerror=()=>r();i.src=src;}))).then(()=>document.fonts?.ready);
}
async function openBook(meta){
 const run=++state.epoch;state.message='「'+meta.title+'」を読み込んでいます。';render();
 try{
  if(typeof meta.data!=='string'||!/^\/textbook-book-[a-z0-9-]+\.json$/.test(meta.data))throw Error('path');
  const data=await loadJson(meta.data);if(run!==state.epoch||state.view!=='shelf')return;
  if(!data||!Array.isArray(data.pages)||!data.pages.length||data.pages.some((p,i)=>!p||p.n!==i+1))throw Error('book');
  await preload(data.pages);if(run!==state.epoch||state.view!=='shelf')return;
  const measure=state.app.querySelector('.tb-measure');measure.style.setProperty('--tb-color',meta.color);
  state.book={meta,pages:data.pages,toc:data.toc||[],fillers:data.fillers||{},map:{},yomi:(data.yomi&&typeof data.yomi==='object')?data.yomi:{}};
  // 一度組んだ結果は端末に覚えておき、中身が同じなら2回目からすぐ開く（覚えられない端末では毎回組む）
  const sig=LAYOUT_VERSION+':'+meta.id+':'+data.pages.length+':'+JSON.stringify(data).length,cacheKey='nobi-textbook-layout:'+meta.id;
  let laid=null;
  try{const c=JSON.parse(root.localStorage.getItem(cacheKey)||'null');if(c&&c.sig===sig&&Array.isArray(c.pages)&&c.pages.length)laid={pages:c.pages,map:c.map||{}};}catch(_){laid=null;}
  if(!laid){
   // ページ番号は3けた分の場所を取って組み、組み終わってから本当の番号を入れる（組み直しは1回だけ）
   const msg=state.app.querySelector('.tb-shelf-message')||(()=>{const m=el('p','tb-shelf-message');state.app.querySelector('.tb-shelf')?.append(m);return m;})();
   laid=await paginate(state.book,measure,(n,total)=>{if(run===state.epoch)msg.textContent='ページを組んでいます（'+n+'／'+total+'）';});
   if(run!==state.epoch||state.view!=='shelf')return;
   try{root.localStorage.setItem(cacheKey,JSON.stringify({sig,pages:laid.pages,map:laid.map}));}catch(_){}
  }
  state.book.phys=laid.pages;state.book.map=laid.map;
  state.single=isSingle();state.view='book';state.spread=state.book.phys.length>=2?1:0;state.message='';render();
  if(state.pending&&state.pending.book===meta.id){const p=tocPage(state.book,state.pending.target);state.pending=null;if(p)goPage(state.book.map[p]||p);}else state.pending=null;
 }catch(_){if(run===state.epoch){state.book=null;state.message='教科書を読み込めませんでした。もう一度押してください。';render();}}
}
async function enter(){
 const app=state.app;if(!app)return;
 if(isFull()){if(state.view==='gate')void showShelf();return;}
 state.message='';
 const request=app.requestFullscreen||app.webkitRequestFullscreen;
 if(!request){state.fallback=true;app.classList.add('tb-fallback');document.documentElement.classList.add('tb-lock');void showShelf();return;}
 try{await request.call(app);}catch(_){state.message='全画面にできませんでした。もう一度「全画面で教科書を開く」を押してください。';state.view='gate';render();return;}
 if(isFull()&&state.view==='gate')void showShelf();
}
function close(){yStop();state.epoch++;state.pending=null;state.view='gate';state.book=null;state.spread=0;state.sheet=null;render();}
function leave(){
 if(state.fallback){state.fallback=false;state.app?.classList.remove('tb-fallback');document.documentElement.classList.remove('tb-lock');close();return;}
 const f=document.fullscreenElement||document.webkitFullscreenElement;
 if(state.app&&f===state.app){try{const r=(document.exitFullscreen||document.webkitExitFullscreen).call(document);r?.catch?.(()=>{});}catch(_){}}
 if(state.view!=='gate')close();
}
function onFullChange(){if(!state.app)return;if(isFull()){if(state.view==='gate')void showShelf();}else if(state.view!=='gate')close();}
function mount(app){
 if(!app||state.app===app)return;
 state.app=app;render();void loadLinks();
 document.addEventListener('fullscreenchange',onFullChange);document.addEventListener('webkitfullscreenchange',onFullChange);
 document.addEventListener('keydown',e=>{if(!isFull())return;if(state.sheet&&e.key==='Escape'){e.preventDefault();closeSheet();return;}if(state.view!=='book'||state.sheet)return;if(e.key==='ArrowLeft'){e.preventDefault();turn(-1);}else if(e.key==='ArrowRight'){e.preventDefault();turn(1);}});
 // 向きが変わったら、いま見ているページを保ったまま1ページ⇄見開きを組みかえる（読み上げ中なら続ける）
 root.addEventListener('resize',()=>{if(state.view!=='book')return;if(relayout()){Y.auto=true;try{render();}finally{Y.auto=false;}if(Y.on)Y.spread=state.spread;}else fitSpread();});
}
root.NobiTextbook=Object.freeze({mount,enter,leave,openAt,linkFor,_state:state,_yomi:()=>({on:Y.on,spread:Y.spread,audio:Y.audio,data:Y.data})});
function auto(){const app=document.getElementById('textbook-app');if(app)mount(app);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',auto);else auto();
})(globalThis);
