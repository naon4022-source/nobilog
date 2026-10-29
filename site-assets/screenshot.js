// Candidate only: no network, upload, camera access or automatic saving.
(function(root){
'use strict';
let active=null;const listeners=new Set();
const tell=()=>{for(const f of listeners){try{f(!!active);}catch(_){}}};
const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
function capture({same=()=>true,intro=true,acknowledge=()=>{}}={}){
 if(active)active.close();
 return new Promise(resolve=>{
  let closed=false,stream=null,bitmap=null,selection=null,drag=null,preview=null,epoch=0,ownerTimer=null;
  const focused=document.activeElement,back=el('div'),box=el('section'),title=el('h2','画面を囲んで保存'),message=el('p'),stage=el('div'),actions=el('div');
  back.className='ss-back';box.className='ss-box';stage.className='ss-stage';actions.className='ss-actions';
  back.setAttribute('role','dialog');back.setAttribute('aria-modal','true');back.setAttribute('aria-label','スクリーンショット');message.setAttribute('role','status');
  box.append(title,message,stage,actions);back.append(box);
  const input=el('input');input.type='file';input.accept='image/png,image/jpeg';input.hidden=true;input.setAttribute('aria-label','端末のスクリーンショットを選ぶ');box.append(input);
  const valid=()=>!closed&&same()===true;
  function button(text,fn){const b=el('button',text);b.type='button';b.addEventListener('click',fn);return b;}
  function stop(){if(stream)for(const track of stream.getTracks())track.stop();stream=null;}
  function revoke(){if(preview)URL.revokeObjectURL(preview);preview=null;}
  function close(file=null){if(closed)return;closed=true;epoch++;stop();bitmap?.close();bitmap=null;revoke();back.remove();document.removeEventListener('keydown',keys);document.removeEventListener('fullscreenchange',portal);root.removeEventListener('pagehide',leave);clearInterval(ownerTimer);if(active===handle)active=null;tell();if(focused?.isConnected)focused.focus();resolve(file);}
  function portal(){if(!closed)(document.fullscreenElement||document.body).append(back);}
  const leave=()=>close();
  function keys(event){if(event.key==='Escape'){event.preventDefault();close();return;}if(event.key==='Tab'){
   const nodes=[...box.querySelectorAll('button,input:not([hidden]),canvas')].filter(n=>!n.disabled&&n.tabIndex>=0),first=nodes[0],last=nodes.at(-1);
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  }}
  function controls(...buttons){actions.replaceChildren(...buttons,button('キャンセル',()=>close()));}
  function choose(){if(!valid())return close();revoke();bitmap?.close();bitmap=null;selection=null;stage.replaceChildren();back.hidden=false;
   message.textContent='保存したい画面だけを選んでください。取得後、共有はすぐ止まります。まだ保存・AI送信はしません。';
   const buttons=[];if(typeof navigator.mediaDevices?.getDisplayMedia==='function')buttons.push(button('のびログの画面を選ぶ',()=>void screen()));
   else message.textContent='このブラウザでは画面を直接取得できません。端末で撮ったスクリーンショットを選び、必要なところを囲んでください。';
   buttons.push(button('端末のスクリーンショットを選ぶ',()=>input.click()));controls(...buttons);actions.querySelector('button')?.focus();
  }
  async function screen(){
   if(!valid())return close();const run=++epoch;back.hidden=true;
   try{
    const pending=navigator.mediaDevices.getDisplayMedia({video:{displaySurface:'browser'},audio:false,preferCurrentTab:true});
    const got=await pending;if(!valid()||run!==epoch){got.getTracks().forEach(t=>t.stop());return;}
    stream=got;const video=el('video');video.muted=true;video.playsInline=true;video.srcObject=got;
    // Never attach the live stream to the page or upload it. Capture one frame.
    let timer;try{
     await Promise.race([(async()=>{await video.play();if(!video.videoWidth||!video.videoHeight)await new Promise((ok,no)=>{video.onloadeddata=ok;video.onerror=no;});await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));})(),new Promise((_,no)=>{timer=setTimeout(()=>no(Error('timeout')),10000);})]);
     if(!valid()||run!==epoch)return;
     const scale=Math.min(1,4096/Math.max(video.videoWidth,video.videoHeight)),canvas=el('canvas');canvas.width=Math.max(1,Math.round(video.videoWidth*scale));canvas.height=Math.max(1,Math.round(video.videoHeight*scale));canvas.getContext('2d').drawImage(video,0,0,canvas.width,canvas.height);
     const next=await createImageBitmap(canvas);if(!valid()||run!==epoch){next.close();return;}bitmap?.close();bitmap=next;
    }finally{clearTimeout(timer);stop();video.srcObject=null;}
    if(valid()&&run===epoch)crop();
   }catch(_){stop();if(valid()&&run===epoch){choose();message.textContent='画面は取得していません。共有の取消し・非対応の場合は、端末のスクリーンショットを選べます。';}}
   finally{if(valid())back.hidden=false;}
  }
  input.addEventListener('change',async()=>{
   const file=input.files?.[0];input.value='';if(!file||!valid())return;const run=++epoch;
   if(!['image/png','image/jpeg'].includes(file.type)||file.size>10*1024*1024){message.textContent='10MBまでのPNG・JPEGを選んでください。';return;}
   try{
    const head=new Uint8Array(await file.slice(0,256*1024).arrayBuffer());let width=0,height=0;
    if(head.length>=24&&head[0]===137&&head[1]===80&&head[2]===78&&head[3]===71){const v=new DataView(head.buffer);width=v.getUint32(16);height=v.getUint32(20);}
    else if(head[0]===255&&head[1]===216){let at=2;while(at+9<head.length){if(head[at++]!==255)break;while(head[at]===255)at++;const marker=head[at++];if(marker===218||marker===217)break;const n=(head[at]<<8)|head[at+1];if(n<2||at+n>head.length)break;if([192,193,194].includes(marker)){height=(head[at+3]<<8)|head[at+4];width=(head[at+5]<<8)|head[at+6];break;}at+=n;}}
    if(!width||!height||width*height>24000000){message.textContent='2,400万画素までのPNG・JPEGを選んでください。';return;}
    const next=await createImageBitmap(file);if(!valid()||run!==epoch){next.close();return;}
    if(next.width*next.height>24000000){next.close();message.textContent='大きい画像は縮小してから選んでください。';return;}
    bitmap?.close();bitmap=next;crop();
   }catch(_){if(valid())message.textContent='画像を開けませんでした。別のスクリーンショットを選んでください。';}
  });
  function crop(){
   if(!valid()||!bitmap)return close();revoke();back.hidden=false;stage.replaceChildren();selection=null;
   message.textContent='残したいところを指やマウスで囲んでください。四角の中だけを保存します。全体を選んだ後は矢印キーで移動、Shift＋矢印で大きさを調整できます。';
   const canvas=el('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;canvas.tabIndex=0;canvas.setAttribute('aria-label','保存する範囲を囲む');stage.append(canvas);
   const accept=button('この範囲を確認',()=>void confirm());accept.disabled=true;
   function draw(){if(!valid()||!bitmap)return;const c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);c.drawImage(bitmap,0,0);if(selection){const {x,y,w,h}=selection;c.fillStyle='rgba(0,0,0,.55)';c.fillRect(0,0,canvas.width,canvas.height);c.drawImage(bitmap,x,y,w,h,x,y,w,h);c.lineWidth=Math.max(2,canvas.width/400);c.strokeStyle='#fff';c.strokeRect(x,y,w,h);}accept.disabled=!selection||selection.w<8||selection.h<8;}
   function point(e){const r=canvas.getBoundingClientRect();return {x:Math.max(0,Math.min(canvas.width,Math.round((e.clientX-r.left)*canvas.width/r.width))),y:Math.max(0,Math.min(canvas.height,Math.round((e.clientY-r.top)*canvas.height/r.height)))};}
   canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();drag=point(e);canvas.setPointerCapture(e.pointerId);selection=null;draw();});
   canvas.addEventListener('pointermove',e=>{if(!drag)return;const p=point(e);selection={x:Math.min(p.x,drag.x),y:Math.min(p.y,drag.y),w:Math.abs(p.x-drag.x),h:Math.abs(p.y-drag.y)};draw();});
   canvas.addEventListener('pointerup',()=>{drag=null;});canvas.addEventListener('pointercancel',()=>{drag=null;selection=null;draw();});
   canvas.addEventListener('keydown',e=>{if(!selection||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const dx=e.key==='ArrowRight'?10:e.key==='ArrowLeft'?-10:0,dy=e.key==='ArrowDown'?10:e.key==='ArrowUp'?-10:0;
    if(e.shiftKey){selection.w=Math.max(8,Math.min(canvas.width-selection.x,selection.w+dx));selection.h=Math.max(8,Math.min(canvas.height-selection.y,selection.h+dy));}
    else{selection.x=Math.max(0,Math.min(canvas.width-selection.w,selection.x+dx));selection.y=Math.max(0,Math.min(canvas.height-selection.h,selection.y+dy));}draw();});
   controls(button('全体を選ぶ',()=>{selection={x:0,y:0,w:canvas.width,h:canvas.height};draw();canvas.focus();}),accept,button('画像を選び直す',choose));draw();canvas.focus();
   async function confirm(){
    if(!valid()||!bitmap||!selection||accept.disabled)return;accept.disabled=true;const run=++epoch,{x,y,w,h}=selection;
    const out=el('canvas');out.width=w;out.height=h;out.getContext('2d').drawImage(bitmap,x,y,w,h,0,0,w,h);
    const blob=await new Promise(r=>out.toBlob(r,'image/png'));if(!valid()||run!==epoch)return;
    if(!blob||blob.size>10*1024*1024){message.textContent='画像を用意できませんでした。小さい範囲で囲み直してください。';accept.disabled=false;return;}
    const file=new File([blob],'nobilog-screenshot.png',{type:'image/png'}),image=el('img');preview=URL.createObjectURL(blob);image.src=preview;image.alt='保存する範囲の確認';stage.replaceChildren(image);
    message.textContent='この範囲で保存します。AIへは送信しません。';controls(button('この画像を使う',()=>{if(valid())close(file);else close();}),button('囲み直す',crop));actions.querySelector('button')?.focus();
   }
  }
  const handle={close:()=>close()};active=handle;tell();if(closed)return;portal();document.addEventListener('keydown',keys);document.addEventListener('fullscreenchange',portal);root.addEventListener('pagehide',leave);
  ownerTimer=setInterval(()=>{if(!same())close();},250);
  if(intro){message.textContent='わからない問題や、ノートに残したいところを囲んで保存するときに使ってね。カメラで自分を撮る機能ではありません。保存した画像は、確認してからノートやAI相談に添付できます。';controls(button('わかった',()=>{if(!valid())return close();try{acknowledge();}catch(_){}choose();}));actions.querySelector('button')?.focus();}else choose();
 });
}
root.NobiScreenshot=Object.freeze({capture,active:()=>!!active,stopAll(){active?.close();},onChange(f){listeners.add(f);return()=>listeners.delete(f);}});
})(globalThis);
