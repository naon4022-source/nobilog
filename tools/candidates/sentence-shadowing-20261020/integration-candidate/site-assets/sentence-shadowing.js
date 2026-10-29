// Sentence practice candidate. Recording stays in memory; no network or storage.
(function(root){'use strict';
function mount(host,options){
 const text=String(options?.text||'').trim();
 if(!host||!text||typeof options?.speak!=='function')throw new TypeError('host, text and speak required');
 const doc=host.ownerDocument,make=(tag,label)=>{const e=doc.createElement(tag);if(label)e.textContent=label;return e;};
 const box=make('section'),status=make('p','お手本を聞いてから、録音してください。');
 status.setAttribute('role','status');
 const sample=make('button','お手本を聞く'),record=make('button','録音する'),stop=make('button','録音を止める'),audio=make('audio');
 for(const b of [sample,record,stop])b.type='button';
 audio.controls=true;audio.hidden=true;audio.setAttribute('aria-label','自分の声を聞く');
 box.append(make('p',text),sample,record,stop,status,audio,make('p','録音は保存・送信しません。最大60秒で止まります。'));
 host.append(box);let disposed=false,pending=false,stream=null,recorder=null,timer=null,url=null,generation=0;
 const tracks=()=>{if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;};
 const buttons=()=>{record.disabled=disposed||pending||!!recorder;sample.disabled=disposed||pending||!!recorder;stop.disabled=!recorder;};
 const releaseAudio=()=>{audio.pause();audio.removeAttribute('src');audio.load();audio.hidden=true;if(url){root.URL.revokeObjectURL(url);url=null;}};
 function cancel(){generation++;pending=false;clearTimeout(timer);timer=null;const r=recorder;recorder=null;if(r&&r.state!=='inactive')try{r.stop();}catch{}tracks();releaseAudio();options.stopSpeaking?.();buttons();}
 sample.addEventListener('click',()=>{if(disposed||pending||recorder)return;audio.pause();try{if(options.speak(text)===false)status.textContent='この端末ではお手本を再生できません。';}catch{status.textContent='この端末ではお手本を再生できません。';}});
 stop.addEventListener('click',()=>{if(recorder&&recorder.state!=='inactive')try{recorder.stop();}catch{cancel();status.textContent='録音を終了しました。';}});
 record.addEventListener('click',async()=>{
  if(disposed||pending||recorder)return;const token=++generation;pending=true;buttons();status.textContent='マイクの許可を確認しています。';
  try{
   options.stopSpeaking?.();audio.pause();
   const acquired=await root.navigator.mediaDevices.getUserMedia({audio:true});
   if(disposed||token!==generation){acquired.getTracks().forEach(t=>t.stop());return;}
   stream=acquired;const r=new root.MediaRecorder(stream),chunks=[];recorder=r;
   r.ondataavailable=e=>{if(token===generation&&e.data?.size)chunks.push(e.data);};
   r.onerror=()=>{if(token!==generation)return;cancel();status.textContent='録音できませんでした。もう一度お試しください。';};
   r.onstop=()=>{
    if(token!==generation)return;clearTimeout(timer);timer=null;tracks();recorder=null;pending=false;
    releaseAudio();if(chunks.length){url=root.URL.createObjectURL(new root.Blob(chunks,{type:r.mimeType||chunks[0].type}));audio.src=url;audio.hidden=false;status.textContent='自分の声とお手本を聞き比べてください。';}
    else status.textContent='録音データがありません。もう一度お試しください。';buttons();
   };
   r.start();pending=false;status.textContent='録音中です。言い終えたら「録音を止める」を押してください。';buttons();
   timer=setTimeout(()=>{if(token===generation&&r.state!=='inactive')try{r.stop();}catch{cancel();}},60000);
  }catch{if(token!==generation)return;cancel();status.textContent='マイクが使えません。端末の許可を確認してください。';}
 });
 const hidden=()=>{if(doc.hidden){cancel();status.textContent='画面を離れたため録音を終了しました。';}};
 const dispose=()=>{if(disposed)return;disposed=true;cancel();doc.removeEventListener('visibilitychange',hidden);root.removeEventListener('pagehide',dispose);observer.disconnect();box.remove();};
 const observer=new root.MutationObserver(()=>{if(!host.isConnected||!box.isConnected)dispose();});
 observer.observe(doc.documentElement,{childList:true,subtree:true});doc.addEventListener('visibilitychange',hidden);root.addEventListener('pagehide',dispose);
 if(!root.MediaRecorder||!root.navigator?.mediaDevices?.getUserMedia){record.hidden=true;stop.hidden=true;status.textContent='この端末では録音できません。お手本を聞いて練習できます。';}
 buttons();return {dispose};
}
root.NobiSentenceShadowing=Object.freeze({mount});
})(globalThis);
