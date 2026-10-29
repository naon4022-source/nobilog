// ノートと相談で共通の画像選択・貼り付け。本人の認証済みAPIだけを使う。
(function(root){
'use strict';
const valid=id=>typeof id==='string'&&/^[a-f0-9]{64}$/.test(id);
const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
const encode=bytes=>{let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(s);};
async function pixels(file){
 if(!file||file.size>10*1024*1024||!file.size)throw Error('画像は10MBまでです。');
 const head=new Uint8Array(await file.slice(0,256*1024).arrayBuffer());let width=0,height=0;
 if(head.length>=24&&head[0]===137&&head[1]===80&&head[2]===78&&head[3]===71){const v=new DataView(head.buffer);width=v.getUint32(16);height=v.getUint32(20);}
 else if(head[0]===255&&head[1]===216){let at=2;while(at+9<head.length){if(head[at++]!==255)break;while(head[at]===255)at++;const marker=head[at++];if(marker===218||marker===217)break;const n=(head[at]<<8)|head[at+1];if(n<2||at+n>head.length)break;if([192,193,194].includes(marker)){height=(head[at+3]<<8)|head[at+4];width=(head[at+5]<<8)|head[at+6];break;}at+=n;}}
 if(!width||!height||width*height>24*1024*1024)throw Error('JPEG・PNGを選んでください。大きい写真は縮小してから貼れます。');
 const bitmap=await createImageBitmap(file);try{let scale=Math.min(1,1024/Math.max(bitmap.width,bitmap.height));
  for(let step=0;step<8;step++){const w=Math.max(1,Math.round(bitmap.width*scale)),h=Math.max(1,Math.round(bitmap.height*scale)),canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
   const c=canvas.getContext('2d');c.drawImage(bitmap,0,0,w,h);const rgba=c.getImageData(0,0,w,h).data;
   const compressed=new Uint8Array(await new Response(new Blob([rgba]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer());
   if(compressed.length<=380*1024)return {width:w,height:h,data:encode(compressed)};scale*=0.75;
  }throw Error('画像を小さくしてから貼ってください。');
 }finally{bitmap.close();}
}
function create(host,options){
 let alive=true,busy=false,ids=(options.initial||[]).filter(valid).slice(0,3),message='',epoch=0;const urls=new Map(),fetches=new Map();
 const live=()=>alive&&host.isConnected&&options.current();
 const panel=el('section');panel.className='learning-images';host.append(panel);
 const status=el('p');status.setAttribute('role','status');const list=el('div');list.className='learning-image-list';
 const input=el('input');input.type='file';input.accept='image/png,image/jpeg';input.multiple=true;input.setAttribute('aria-label','画像を選ぶ');
 const label=el('label','画像を添付（3枚まで）'),icon=el('img');icon.src='/attachment-icon.svg';icon.alt='';icon.width=24;icon.height=24;icon.style.verticalAlign='middle';label.prepend(icon);label.append(input);label.hidden=!!options.readonly;
 // 選び方は4つ（2026-10-12 Claude）：撮影・ファイル（上の「画像を選ぶ」）・ライブラリ・のびログで撮った写真
 const sources=el('div');sources.className='li-sources';sources.hidden=!!options.readonly;sources.setAttribute('aria-label','画像の選び方');
 const lib=el('input');lib.type='file';lib.accept='image/*';lib.multiple=true;lib.hidden=true;lib.setAttribute('aria-label','ライブラリから画像を選ぶ');
 const cap=el('input');cap.type='file';cap.accept='image/*';cap.setAttribute('capture','environment');cap.hidden=true;cap.setAttribute('aria-label','撮影して添付する');
 const srcBtn=(text,fn)=>{const b=el('button',text);b.type='button';b.className='pp-btn';b.addEventListener('click',fn);sources.append(b);return b;};
 const camera=typeof options.camera==='function'?options.camera:(root.NobiCamera?()=>root.NobiCamera.capture({title:'📷 撮影して添付する'}):null);
 const photos=typeof options.photos==='function'?options.photos:async()=>{const r=await options.request('/photos',{cache:'no-store'});if(!r.ok)throw Error('photos');return r.json();};
 const pick=el('div');pick.className='li-photo-pick';pick.hidden=true;
 const shootBtn=srcBtn('📷 撮影',()=>void shoot()),fileBtn=srcBtn('📁 ファイル',()=>input.click()),libBtn=srcBtn('🖼 ライブラリ',()=>lib.click()),photoBtn=srcBtn('🌱 のびログで撮った写真',()=>void openPick());
 panel.append(label,sources,pick,list,status);host.append(lib,cap);// 追加の入力は部品の枠の外に置く（枠の中のファイル入力は今までどおり1つ）
 lib.addEventListener('change',()=>{const f=[...lib.files];lib.value='';void add(f);});cap.addEventListener('change',()=>{const f=[...cap.files];cap.value='';void add(f,true);});
 async function source(id){if(urls.has(id))return urls.get(id);if(!fetches.has(id))fetches.set(id,(async()=>{
  const r=await options.request('/learning-image?id='+encodeURIComponent(id),{cache:'no-store'});if(!r.ok||r.headers.get('Content-Type')!=='image/png')throw Error('画像を読み込めません。');const blob=await r.blob();
  if(!live())return null;const url=URL.createObjectURL(blob);urls.set(id,url);return url;
 })().finally(()=>fetches.delete(id)));return fetches.get(id);}
 async function shoot(){if(!live()||busy||options.disabled||options.readonly)return;if(!camera){cap.click();return;}const file=await camera();if(file&&live())void add([file],true);}
 // のびログで撮った写真：本人の一覧から選ぶ。すでにサーバーにあるので、もう一度送らずにそのまま添付する
 async function openPick(){if(!live()||busy||options.disabled||options.readonly)return;if(!pick.hidden){pick.hidden=true;pick.replaceChildren();return;}
  pick.hidden=false;pick.replaceChildren(el('p','読み込んでいます…'));
  try{const d=await photos();if(!live())return;const items=(Array.isArray(d?.items)?d.items:[]).filter(x=>valid(x?.id)).slice(0,30);pick.replaceChildren();
   if(!items.length){pick.append(el('p','のびログで撮った写真はまだありません。'));return;}
   for(const it of items){const b=el('button');b.type='button';b.setAttribute('aria-label','撮った写真を添付する');const im=el('img');im.alt='';b.append(im);pick.append(b);
    void source(it.id).then(u=>{if(live()&&u)im.src=u;}).catch(()=>{});
    b.addEventListener('click',()=>{if(!live()||busy)return;if(ids.includes(it.id)){message='その写真はもう添付しています。';}else if(ids.length>=3){message='画像は3枚までです。';}else{ids.push(it.id);options.change?.([...ids]);message='写真を添付しました。ノートの保存・相談の送信はまだです。';}pick.hidden=true;pick.replaceChildren();render();});}
  }catch(_){if(live())pick.replaceChildren(el('p','写真の一覧を読み込めませんでした。'));}}
 function render(){if(!live())return;const run=++epoch;input.disabled=busy||!!options.disabled||!!options.readonly;for(const b of [shootBtn,fileBtn,libBtn,photoBtn])b.disabled=busy||!!options.disabled||!!options.readonly;sources.hidden=!!options.readonly;list.replaceChildren();status.textContent=message;
  for(const [i,id] of ids.entries()){const box=el('div'),image=el('img');image.alt='添付画像 '+(i+1);image.dataset.imageId=id;box.append(image);
   void source(id).then(url=>{if(live()&&run===epoch&&url)image.src=url;}).catch(()=>{if(live()&&run===epoch)status.textContent='画像を読み込めませんでした。添付の記録は残っています。';});
   const zoom=el('button','大きく見る');zoom.type='button';zoom.setAttribute('aria-expanded','false');zoom.addEventListener('click',()=>{const expanded=zoom.getAttribute('aria-expanded')!=='true',width=Math.max(image.naturalWidth,image.clientWidth*2);zoom.setAttribute('aria-expanded',String(expanded));zoom.textContent=expanded?'元の大きさに戻す':'大きく見る';box.style.gridColumn=expanded?'1 / -1':'';box.style.overflowX=expanded?'auto':'';image.style.maxHeight=expanded?'none':'';image.style.width=expanded?width+'px':'';});box.append(zoom);
   if(!options.readonly){const remove=el('button','添付から外す');remove.type='button';remove.disabled=busy||!!options.disabled;remove.addEventListener('click',()=>{ids=ids.filter(x=>x!==id);options.change?.([...ids]);render();});box.append(remove);}list.append(box);
  }
  if(options.readonly)label.hidden=true;
 }
 async function add(files,shot=false){if(!live()||busy||options.disabled||options.readonly)return;busy=true;message='画像を準備しています。';render();
  try{for(const file of files){if(ids.length>=3){message='画像は3枚までです。';break;}const body=await pixels(file);if(!live())return;
   let r=null;if(shot){r=await options.request('/photos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});if(!live())return;if(r.status===403||r.status===404)r=null;}
   if(!r)r=await options.request('/learning-images',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});if(!live())return;
   const d=await r.json();if(!r.ok||!valid(d?.item?.id))throw Error(d?.error==='plan_required'?'画像の追加はPro以上です。':d?.error==='image_limit'?'画像の保存上限に達しました。':'画像を保存できませんでした。もう一度選んでください。');
   if(ids.includes(d.item.id)){message='その画像はもう添付しています。';continue;}ids.push(d.item.id);options.change?.([...ids]);message='画像を添付しました。ノートの保存・相談の送信はまだです。';
  }}catch(e){if(live())message=e.message;}finally{busy=false;if(live()){input.value='';render();options.finish?.(message);}}
 }
 input.addEventListener('change',()=>void add([...input.files]));
 const paste=e=>{const files=[...(e.clipboardData?.files||[])];if(files.length){e.preventDefault();void add(files);}};
 options.pasteTarget?.addEventListener('paste',paste);panel.addEventListener('paste',paste);
 const observer=new MutationObserver(()=>{if(!host.isConnected)destroy();});observer.observe(document.documentElement,{childList:true,subtree:true});
 function destroy(){if(!alive)return;alive=false;epoch++;observer.disconnect();options.pasteTarget?.removeEventListener('paste',paste);for(const url of urls.values())URL.revokeObjectURL(url);urls.clear();}
 queueMicrotask(render);return Object.freeze({ids:()=>[...ids],busy:()=>busy,clear(){ids=[];options.change?.([]);render();},setDisabled(value){options.disabled=!!value;render();},destroy});
}
root.NobiLearningImages=Object.freeze({create,pixels});
})(globalThis);
