// 🖼 アイコンの変更・保存した写真・画面の端のカメラボタン・UNLIMITのアイコン生成（Claude・2026-10-12）
// サーバーとのやりとりは index.html が渡す api だけ（アカウントが変わったら api.same() が false になり、何も描かない）。
// 文字はすべて textContent。写真や自己紹介は、本人がボタンを押したときだけ送る。
(function(root){
'use strict';
const OUT=256;
function el(tag,text,cls){const n=document.createElement(tag);if(text!==undefined&&text!==null)n.textContent=String(text);if(cls)n.className=cls;return n;}
function btn(text,fn,cls){const b=el('button',text,'pp-btn'+(cls?' '+cls:''));b.type='button';b.addEventListener('click',fn);return b;}
const jst=t=>{const d=new Date(t+9*3600000);return d.getUTCFullYear()+'/'+(d.getUTCMonth()+1)+'/'+d.getUTCDate()+' '+String(d.getUTCHours()).padStart(2,'0')+':'+String(d.getUTCMinutes()).padStart(2,'0');};
function picker(accept,capture,label){const i=el('input');i.type='file';i.accept=accept;if(capture)i.setAttribute('capture',capture);i.hidden=true;i.setAttribute('aria-label',label);return i;}
async function toPixels(file){if(!root.NobiLearningImages)throw Error('画像の部品を読み込めませんでした。');return root.NobiLearningImages.pixels(file);}
async function loadBitmap(file){if(!file||!file.size)throw Error('画像を選んでください。');if(file.size>15*1024*1024)throw Error('画像は15MBまでです。');try{return await createImageBitmap(file);}catch(_){throw Error('この画像は開けませんでした。JPEG・PNGの写真を選んでください。');}}

// ── アイコンの変更（だれでも） ──
function openAvatar(host,api){
 const S={bitmap:null,zoom:1,x:0,y:0,busy:false,msg:'',gen:{open:false,busy:false,msg:'',retry:null,candidates:[]},alive:true};
 const live=()=>S.alive&&host.isConnected&&api.same();
 const wrap=el('div',null,'pp');host.replaceChildren(wrap);
 const files={file:picker('image/png,image/jpeg','', 'ファイルから選ぶ'),lib:picker('image/*','', 'ライブラリから選ぶ')};
 for(const i of Object.values(files)){wrap.append(i);i.addEventListener('change',()=>{const f=i.files&&i.files[0];i.value='';if(f)void use(f);});}
 const canvas=el('canvas',null,'pp-crop');canvas.width=280;canvas.height=280;canvas.setAttribute('role','img');canvas.setAttribute('aria-label','アイコンの位置合わせ（ドラッグで動かす）');
 const preview=el('canvas',null,'pp-round');preview.width=96;preview.height=96;preview.setAttribute('aria-label','丸い仕上がり');
 async function use(file){S.msg='写真を開いています…';render();try{const b=await loadBitmap(file);if(!live()){b.close();return;}if(S.bitmap)S.bitmap.close();S.bitmap=b;S.zoom=1;S.x=0;S.y=0;S.msg='写真を動かして、丸の中に入るように合わせてください。';}catch(e){if(live())S.msg=e.message;}render();}
 // 写真を丸い枠の中にどう置くか（zoom=1 で短い辺が枠いっぱい）
 function place(size){const b=S.bitmap,base=280/Math.min(b.width,b.height),w=b.width*base*S.zoom,h=b.height*base*S.zoom;
  // 位置は280の枠の大きさで持つ（保存のときは同じ割合で256へ縮める）
  const maxX=Math.max(0,(w-280)/2),maxY=Math.max(0,(h-280)/2);S.x=Math.max(-maxX,Math.min(maxX,S.x));S.y=Math.max(-maxY,Math.min(maxY,S.y));const k=size/280;
  return {dx:((280-w)/2+S.x)*k,dy:((280-h)/2+S.y)*k,w:w*k,h:h*k};}
 function draw(){
  const c=canvas.getContext('2d');c.clearRect(0,0,280,280);if(!S.bitmap){c.fillStyle='#eef2f5';c.fillRect(0,0,280,280);return;}
  const p=place(280);c.drawImage(S.bitmap,p.dx,p.dy,p.w,p.h);
  c.save();c.fillStyle='rgba(20,28,34,.55)';c.beginPath();c.rect(0,0,280,280);c.arc(140,140,136,0,Math.PI*2,true);c.fill('evenodd');c.restore();
  c.strokeStyle='#fff';c.lineWidth=3;c.beginPath();c.arc(140,140,136,0,Math.PI*2);c.stroke();
  const r=preview.getContext('2d');r.clearRect(0,0,96,96);r.save();r.beginPath();r.arc(48,48,48,0,Math.PI*2);r.clip();const q=place(96);r.drawImage(S.bitmap,q.dx,q.dy,q.w,q.h);r.restore();
 }
 let drag=null;
 canvas.addEventListener('pointerdown',e=>{if(!S.bitmap)return;drag={x:e.clientX,y:e.clientY,sx:S.x,sy:S.y};canvas.setPointerCapture?.(e.pointerId);});
 canvas.addEventListener('pointermove',e=>{if(!drag)return;const k=280/canvas.getBoundingClientRect().width;S.x=drag.sx+(e.clientX-drag.x)*k;S.y=drag.sy+(e.clientY-drag.y)*k;draw();});
 const end=()=>{drag=null;};canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);
 canvas.tabIndex=0;canvas.addEventListener('keydown',e=>{const d={ArrowLeft:[-8,0],ArrowRight:[8,0],ArrowUp:[0,-8],ArrowDown:[0,8]}[e.key];if(d&&S.bitmap){e.preventDefault();S.x+=d[0];S.y+=d[1];draw();}});
 async function save(){
  if(!S.bitmap||S.busy||!live())return;S.busy=true;S.msg='保存しています…';render();
  try{
   const out=el('canvas');out.width=OUT;out.height=OUT;const c=out.getContext('2d'),p=place(OUT);c.fillStyle='#fff';c.fillRect(0,0,OUT,OUT);c.drawImage(S.bitmap,p.dx,p.dy,p.w,p.h);
   const blob=await new Promise(r=>out.toBlob(r,'image/png'));if(!blob)throw Error('画像を用意できませんでした。');
   const body=await toPixels(new File([blob],'avatar.png',{type:'image/png'}));if(!live())return;
   const r=await api.post('/avatar',body);if(!live())return;
   if(!r.ok)throw Error(r.status===401?'ログインが切れました。ログインしなおしてください。':'保存できませんでした。写真はこのまま残っています。もう一度「この丸で保存する」を押してください。');
   S.msg='アイコンを変えました。ほかの端末でも、次に開いたときに同じアイコンになります。';api.saved?.(r.json&&r.json.avatar);
  }catch(e){if(live())S.msg=e&&/[ぁ-んァ-ン一-龯]/.test(e.message||'')?e.message:'保存できませんでした（通信が切れたかもしれません）。写真はこのまま残っています。もう一度「この丸で保存する」を押してください。';}
  finally{S.busy=false;if(live())render();}
 }
 async function generate(ta){
  if(api.generatorReady?.()!==true){S.gen.msg='AIアイコン生成は準備中です。自己紹介は送信していません。';render();return;}
  const intro=ta.value;if(!intro.trim()){S.gen.msg='自己紹介を書いてください。';render();return;}
  if(S.gen.busy||!live())return;if(!S.gen.retry||S.gen.retry.intro!==intro)S.gen.retry={id:api.newId(),intro};
  S.gen.busy=true;S.gen.msg='依頼しています…';S.gen.candidates=[];render();
  try{const r=await api.post('/avatar-generate',{id:S.gen.retry.id,intro:S.gen.retry.intro});if(!live())return;
   const d=r.json||{};
   if(r.ok&&d.real===true&&Array.isArray(d.candidates)&&d.candidates.length){S.gen.candidates=d.candidates.filter(c=>c&&typeof c.src==='string').slice(0,4);S.gen.msg='候補ができました。使いたいものを選んで「この候補を使う」を押すと、位置合わせの画面に入ります（まだ保存していません）。';}
   else if(d.error==='generator_not_ready')S.gen.msg='アイコン生成は、まだAIにつながっていません（準備中）。今は何も作っていません。自己紹介はどこにも送らず、保存もしていません。';
   else if(d.error==='plan_required')S.gen.msg='アイコン生成は UNLIMIT で使えます。';
   else S.gen.msg='依頼できませんでした。書いた自己紹介は残っています。';
  }catch(_){if(live())S.gen.msg='通信が切れました。書いた自己紹介は残っています。もう一度押すと、同じ依頼として送りなおします。';}
  finally{S.gen.busy=false;if(live())render();}
 }
 async function adopt(c){try{const r=await api.fetchImage(c.src);if(!live())return;await use(new File([r],'candidate.png',{type:r.type||'image/png'}));}catch(_){if(live()){S.gen.msg='候補を開けませんでした。';render();}}}
 function render(){
  if(!live())return;const keep=wrap.querySelector('textarea')?.value;
  for(const n of [...wrap.children])if(n.tagName!=='INPUT')n.remove();
  wrap.append(el('h2','🖼 アイコンを変える'));
  const src=el('div',null,'pp-sources');
  src.append(btn('📷 写真を撮る',async()=>{if(!root.NobiCamera){S.msg='カメラを使えません。';render();return;}const f=await root.NobiCamera.capture({facing:'user',title:'📷 アイコンの写真を撮る'});if(f&&live())void use(f);}),
   btn('📁 ファイルから選ぶ',()=>files.file.click()),btn('🖼 ライブラリから選ぶ',()=>files.lib.click()));
  wrap.append(src);
  const area=el('div',null,'pp-crop-area');area.append(canvas);const side=el('div',null,'pp-side');side.append(el('p','丸い仕上がり','pp-label'),preview);
  const zl=el('label','大きさ','pp-label');const zoom=el('input');zoom.type='range';zoom.min='1';zoom.max='4';zoom.step='0.05';zoom.value=String(S.zoom);zoom.disabled=!S.bitmap||S.busy;zoom.setAttribute('aria-label','写真の大きさ');
  zoom.addEventListener('input',()=>{S.zoom=Number(zoom.value);draw();});zl.append(zoom);side.append(zl);
  side.append(btn('この丸で保存する',()=>void save(),'pp-main'));side.lastChild.disabled=!S.bitmap||S.busy;
  area.append(side);wrap.append(area);
  const st=el('p',S.msg||'「写真を撮る」「ファイルから選ぶ」「ライブラリから選ぶ」から写真を選んでください。','pp-msg');st.setAttribute('role','status');wrap.append(st);
  // UNLIMIT：自己紹介 → 生成依頼 → 候補の確認 → 本人が採用
  if(api.plan()==='unlimit'){
   const g=el('details',null,'pp-gen');g.open=S.gen.open;g.addEventListener('toggle',()=>{S.gen.open=g.open;});
   g.append(el('summary','✨ AIでアイコンを作る（UNLIMIT）'));
   const ready=api.generatorReady?.()===true;
   g.append(el('p',ready?'自己紹介から、AIがアイコンの候補を作ります。写真は送りません。自己紹介は「生成を依頼する」を押したときだけ送ります。':'AIアイコン生成は準備中です。現在は自己紹介の入力・送信を受け付けていません。写真・ファイルから自分のアイコンを設定できます。','pp-note'));
   const ta=el('textarea');ta.maxLength=600;ta.rows=3;ta.setAttribute('aria-label','自己紹介');ta.placeholder='例：サッカーが好き。青い色が好き。';ta.value=keep??(S.gen.retry?S.gen.retry.intro:'');ta.disabled=S.gen.busy||!ready;
   const gs=el('p',S.gen.msg,'pp-msg');gs.setAttribute('role','status');
   const generateButton=btn(ready?'生成を依頼する':'生成は準備中',()=>void generate(ta));generateButton.disabled=S.gen.busy||!ready;
   g.append(ta,generateButton,gs);
   if(S.gen.candidates.length){const grid=el('div',null,'pp-cands');for(const c of S.gen.candidates){const f=el('figure');const im=el('img');im.alt='アイコンの候補';im.src=c.src;f.append(im,btn('この候補を使う',()=>void adopt(c)));grid.append(f);}g.append(grid);}
   wrap.append(g);
  }
  draw();
 }
 render();
 return {destroy(){S.alive=false;if(S.bitmap)S.bitmap.close();host.replaceChildren();},state:()=>({hasImage:!!S.bitmap,zoom:S.zoom,x:S.x,y:S.y})};
}

// ── 保存した写真（のびログで撮った本人の写真） ──
function openGallery(host,api){
 let alive=true;const urls=[];const live=()=>alive&&host.isConnected&&api.same();
 const wrap=el('div',null,'pp');host.replaceChildren(wrap);wrap.append(el('h2','🖼 保存した写真'));
 const st=el('p','読み込んでいます…','pp-msg');st.setAttribute('role','status');const grid=el('div',null,'pp-grid');wrap.append(st,grid);
 const big=el('div',null,'pp-big');big.hidden=true;wrap.append(big);
 (async()=>{
  let d;try{d=await api.get('/photos');}catch(_){if(live())st.textContent='写真を読み込めませんでした。少し待ってから開きなおしてください。';return;}
  if(!live())return;const items=Array.isArray(d&&d.items)?d.items:[];
  st.textContent=items.length?'保存した写真・スクリーンショットです（'+items.length+'枚）。押すと大きく見られます。':(d&&d.canTake?'まだ写真はありません。画面の端のボタンで、スクリーンショットを囲んで保存できます。':'まだ写真はありません。スクリーンショットの保存は Student 以上で使えます。');
  for(const it of items){
   const b=el('button',null,'pp-thumb');b.type='button';b.setAttribute('aria-label',jst(it.at)+' の写真を大きく見る');const im=el('img');im.alt='';b.append(im,el('small',jst(it.at)));grid.append(b);
   void api.image(it.id).then(u=>{if(!live()||!u)return;urls.push(u);im.src=u;}).catch(()=>{if(live())b.append(el('small','読み込めませんでした'));});
   b.addEventListener('click',()=>{if(!im.src)return;big.replaceChildren();const full=el('img');full.src=im.src;full.alt=jst(it.at)+' の写真';big.append(full,btn('閉じる',()=>{big.hidden=true;big.replaceChildren();b.focus();}));big.hidden=false;big.querySelector('button').focus();});
  }
 })();
 return {destroy(){alive=false;for(const u of urls)URL.revokeObjectURL(u);host.replaceChildren();}};
}

// ── 画面の端のカメラボタン（Standard 以上） ──
function mountCameraButton(api){
 const b=el('button','📷','pp-camera-fab');b.type='button';b.setAttribute('aria-label','カメラで撮る');b.title='カメラで撮る（保存した写真に入ります）';b.hidden=true;document.body.append(b);
 const sheet=el('div',null,'pp-sheet');sheet.hidden=true;sheet.setAttribute('role','dialog');sheet.setAttribute('aria-label','写真の保存');document.body.append(sheet);
 let file=null,busy=false;
 // 集中モード・教科書（全画面とその代わりの表示）・全画面のときは出さない（問題や本の上にかぶせない）
 const busyScreen=()=>document.body.classList.contains('study-focus')||document.documentElement.classList.contains('tb-lock')||!!document.fullscreenElement;
 const refresh=()=>{b.hidden=!api.canCamera()||(root.NobiCamera&&root.NobiCamera.active())||!sheet.hidden||busyScreen();document.body.classList.toggle('has-camera-fab',!b.hidden);};
 new MutationObserver(refresh).observe(document.body,{attributes:true,attributeFilter:['class']});new MutationObserver(refresh).observe(document.documentElement,{attributes:true,attributeFilter:['class']});document.addEventListener('fullscreenchange',refresh);
 if(root.NobiCamera)root.NobiCamera.onChange(refresh);
 function show(msg,actions){sheet.replaceChildren();const m=el('p',msg,'pp-msg');m.setAttribute('role','status');sheet.append(m);const row=el('div',null,'pp-row');for(const a of actions)row.append(a);sheet.append(row);sheet.hidden=false;refresh();}
 function hide(){sheet.hidden=true;sheet.replaceChildren();file=null;refresh();}
 async function save(){
  if(!file||busy)return;busy=true;show('保存しています…',[]);
  try{const body=await toPixels(file);if(!api.canCamera())throw Object.assign(Error('plan'),{plan:true});const r=await api.post('/photos',body);
   if(!r.ok)throw Object.assign(Error('save'),{plan:r.json&&r.json.error==='plan_required',limit:r.json&&r.json.error==='photo_limit'});
   show('保存しました。プロフィールの「保存した写真」で見られます。',[btn('とじる',hide,'pp-main')]);file=null;
  }catch(e){show(e.plan?'今のプランでは写真を保存できません（Standard 以上）。':e.limit?'保存できる写真の数（300枚）に達しました。':'保存できませんでした。写真はこのまま残っています。もう一度押すと、同じ写真として保存しなおします（2枚にはなりません）。',e.plan||e.limit?[btn('とじる',hide)]:[btn('もう一度保存する',()=>void save(),'pp-main'),btn('保存しないで閉じる',hide)]);}
  finally{busy=false;}
 }
 b.addEventListener('click',async()=>{if(!api.canCamera()||!root.NobiCamera)return;const f=await root.NobiCamera.capture({title:'📷 のびログのカメラ'});if(!f||!api.canCamera())return refresh();file=f;void save();});
 refresh();
 return {refresh,reset(){root.NobiCamera?.stopAll();hide();},element:b};
}
root.NobiPhotos=Object.freeze({openAvatar,openGallery,mountCameraButton});
})(globalThis);
