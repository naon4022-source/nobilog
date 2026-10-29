// 📷 のびログのカメラ（Claude・2026-10-12）。押したときだけ起動し、閉じたら必ず止める。
// NobiCamera.capture({facing}) → 撮って「使う」を押したら File（JPEG）、閉じたら null。
// 許可されない・カメラがない・とちゅうで画面を離れた、どの場合も画面を壊さず null を返してカメラを止める。
(function(root){
'use strict';
let current=null;const listeners=new Set();
const notify=()=>{for(const f of listeners){try{f(!!current);}catch(_){}}};
function el(tag,text,cls){const n=document.createElement(tag);if(text!==undefined&&text!==null)n.textContent=String(text);if(cls)n.className=cls;return n;}
function btn(text,fn,cls){const b=el('button',text,'cam-btn'+(cls?' '+cls:''));b.type='button';b.addEventListener('click',fn);return b;}
const reason=e=>{const n=e&&e.name;return n==='NotAllowedError'||n==='SecurityError'?'カメラの使用が許可されていません。端末やブラウザの設定で、のびログにカメラを許可してください。':n==='NotFoundError'||n==='OverconstrainedError'||n==='DevicesNotFoundError'?'この端末ではカメラが見つかりませんでした。':n==='NotReadableError'?'ほかのアプリがカメラを使っています。閉じてからもう一度ためしてください。':'カメラを起動できませんでした。もう一度ためしてください。';};
function capture(opts={}){
 if(current)current.close();
 return new Promise(resolve=>{
  let stream=null,facing=opts.facing==='user'?'user':'environment',shot=null,closed=false,starting=0;
  const back=el('div',null,'cam-back');back.setAttribute('role','dialog');back.setAttribute('aria-modal','true');back.setAttribute('aria-label',opts.title||'カメラ');
  const box=el('div',null,'cam-box'),title=el('h2',opts.title||'📷 カメラ','cam-title'),stage=el('div',null,'cam-stage');
  const video=el('video');video.playsInline=true;video.muted=true;video.autoplay=true;video.setAttribute('aria-label','カメラの映像');
  const still=el('canvas','', 'cam-still');still.hidden=true;still.setAttribute('aria-label','撮った写真');
  const msg=el('p','カメラを起動しています…','cam-msg');msg.setAttribute('role','status');
  const tools=el('div',null,'cam-tools');stage.append(video,still);box.append(title,stage,msg,tools);back.append(box);
  function stop(){if(stream){for(const t of stream.getTracks()){try{t.stop();}catch(_){}}}stream=null;try{video.srcObject=null;}catch(_){}}
  function close(result=null){if(closed)return;closed=true;starting++;stop();back.remove();document.removeEventListener('visibilitychange',onHide);root.removeEventListener('pagehide',onHide);document.removeEventListener('keydown',onKey);if(current===api)current=null;notify();resolve(result);}
  const onHide=e=>{if(document.hidden||(e&&e.type==='pagehide'))close(null);};
  const onKey=e=>{if(e.key==='Escape'){e.preventDefault();close(null);}};
  const closeBtn=btn('閉じる',()=>close(null),'cam-close');
  function liveTools(){tools.replaceChildren(btn('撮る',take,'cam-shutter'),...(opts.noSwitch?[]:[btn('カメラを切り替える',()=>{facing=facing==='user'?'environment':'user';void start();})]),closeBtn);}
  function errorTools(){tools.replaceChildren(btn('もう一度ためす',()=>void start()),closeBtn);}
  async function start(){
   const run=++starting;stop();shot=null;video.hidden=false;still.hidden=true;msg.textContent='カメラを起動しています…';tools.replaceChildren(closeBtn);
   const md=root.navigator&&root.navigator.mediaDevices;
   if(!md||typeof md.getUserMedia!=='function'){msg.textContent='この端末・ブラウザではカメラを使えません。「ファイル」や「ライブラリ」から選んでください。';tools.replaceChildren(closeBtn);return;}
   try{
    const s=await md.getUserMedia({video:{facingMode:{ideal:facing},width:{ideal:1280},height:{ideal:960}},audio:false});
    if(closed||run!==starting){for(const t of s.getTracks())t.stop();return;}
    stream=s;video.srcObject=s;try{await video.play();}catch(_){}
    if(closed||run!==starting){stop();return;}
    msg.textContent='写したいものを画面に入れて「撮る」を押してください。';liveTools();
   }catch(e){if(closed||run!==starting)return;stop();msg.textContent=reason(e);errorTools();}
  }
  function take(){
   const w=video.videoWidth,h=video.videoHeight;if(!stream||!w||!h){msg.textContent='まだ映像が出ていません。少し待ってから押してください。';return;}
   const scale=Math.min(1,1600/Math.max(w,h));still.width=Math.round(w*scale);still.height=Math.round(h*scale);
   still.getContext('2d').drawImage(video,0,0,still.width,still.height);
   // 撮ったらすぐカメラを止める（「撮り直す」で もう一度起動する）
   stop();video.hidden=true;still.hidden=false;shot=true;msg.textContent='この写真でよければ「使う」を押してください。';
   tools.replaceChildren(btn('使う',use,'cam-shutter'),btn('撮り直す',()=>void start()),closeBtn);
  }
  function use(){if(!shot)return;still.toBlob(blob=>{if(closed)return;if(!blob){msg.textContent='写真を用意できませんでした。撮り直してください。';return;}close(new File([blob],'nobilog-camera.jpg',{type:'image/jpeg'}));},'image/jpeg',0.9);}
  const api={close:()=>close(null)};current=api;notify();
  document.addEventListener('visibilitychange',onHide);root.addEventListener('pagehide',onHide);document.addEventListener('keydown',onKey);
  document.body.append(back);closeBtn.focus();void start();
 });
}
root.NobiCamera=Object.freeze({capture,active:()=>!!current,stopAll(){if(current)current.close();},onChange(f){listeners.add(f);return()=>listeners.delete(f);}});
})(globalThis);
