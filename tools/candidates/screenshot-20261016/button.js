// An owner-bound adapter. API callbacks are injected by the authenticated app.
(function(root){
'use strict';
function mount({context,capture=root.NobiScreenshot?.capture,pixels=root.NobiLearningImages?.pixels}={}){
 if(typeof context!=='function'||typeof capture!=='function'||typeof pixels!=='function')throw Error('invalid screenshot adapter');
 const button=document.createElement('button'),sheet=document.createElement('section');button.type='button';button.className='pp-camera-fab';button.textContent='📷';button.setAttribute('aria-label','画面を囲んで保存');button.title='スクリーンショット';
 sheet.className='pp-sheet';sheet.hidden=true;sheet.setAttribute('role','dialog');sheet.setAttribute('aria-label','スクリーンショットの保存');
 let ctx=null,file=null,body=null,busy=false,capturing=false,closed=false,run=0;
 const own=()=>!closed&&ctx?.same()===true;
 const allowed=c=>c&&c.same()===true&&c.allowed()===true;
 function portal(){const host=document.fullscreenElement||document.body;if(button.parentNode!==host)host.append(button);if(sheet.parentNode!==host)host.append(sheet);}
 function refresh(){if(closed)return;if(ctx&&!allowed(ctx))reset();portal();button.hidden=!allowed(context())||capturing||!sheet.hidden||document.hidden||!!root.NobiScreenshot?.active?.()||!!root.NobiCamera?.active?.();document.body.classList.toggle('has-camera-fab',!button.hidden);}
 function reset(){run++;ctx=null;file=null;body=null;busy=false;capturing=false;sheet.hidden=true;sheet.replaceChildren();}
 function action(text,fn){const b=document.createElement('button');b.type='button';b.className='pp-btn';b.textContent=text;b.addEventListener('click',fn);return b;}
 function show(text,...actions){if(!own())return;sheet.replaceChildren();const p=document.createElement('p');p.textContent=text;p.setAttribute('role','status');sheet.append(p,...actions);sheet.hidden=false;refresh();sheet.querySelector('button')?.focus();}
 async function save(){
  if(!own()||!file||busy)return;if(!allowed(ctx)){show('保存はStudent以上で使えます。画像は送っていません。',action('閉じる',()=>{reset();refresh();}));return;}
  const stamp=run,owner=ctx;busy=true;show('保存しています…');
  try{
   const payload=body||await pixels(file);if(stamp!==run||!own()||!allowed(owner))return;body=payload;
   const response=await owner.post('/photos',structuredClone(payload));if(stamp!==run||!own())return;
   if(!response?.ok){const code=response?.json?.error;
    if(code==='plan_required'||code==='photo_limit'){show(code==='photo_limit'?'保存できる写真の数（300枚）に達しました。':'保存はStudent以上で使えます。',action('閉じる',()=>{reset();refresh();}));return;}
    throw Error('save');
   }
   file=null;body=null;show('保存しました。アイコンの「保存した写真」から、ノートやAI相談に添付できます。保存だけではAIの枠は使いません。',action('閉じる',()=>{reset();refresh();}));
  }catch(_){if(stamp===run&&own())show('保存できませんでした。画像はこの画面に残しています。同じ画像のまま、もう一度保存できます。',action('もう一度保存する',()=>void save()),action('保存しないで閉じる',()=>{reset();refresh();}));}
  finally{if(stamp===run){busy=false;if(!own())reset();refresh();}}
 }
 button.addEventListener('click',async()=>{
  const owner=context();if(closed||capturing||!allowed(owner))return;ctx=owner;capturing=true;const stamp=++run;refresh();
  try{
   const result=await capture({same:()=>!closed&&stamp===run&&allowed(owner),intro:owner.seenIntro?.()!==true,acknowledge:()=>{if(stamp===run&&allowed(owner))owner.acknowledge?.();}});
   if(stamp!==run||!allowed(owner))return;if(!result){reset();return;}file=result;body=null;await save();
  }catch(_){if(stamp===run&&own())show('スクリーンショットを開けませんでした。もう一度試してください。',action('閉じる',()=>{reset();refresh();}));}
  finally{if(stamp===run){capturing=false;if(!own())reset();}refresh();}
 });
 const timer=setInterval(refresh,250),notify=()=>refresh();document.addEventListener('fullscreenchange',notify);document.addEventListener('visibilitychange',notify);
 const unsubscribe=root.NobiScreenshot?.onChange?.(notify),unsubscribeCamera=root.NobiCamera?.onChange?.(notify);refresh();
 return Object.freeze({element:button,refresh,reset(){root.NobiScreenshot?.stopAll?.();reset();refresh();},destroy(){if(closed)return;closed=true;root.NobiScreenshot?.stopAll?.();reset();clearInterval(timer);unsubscribe?.();unsubscribeCamera?.();document.removeEventListener('fullscreenchange',notify);document.removeEventListener('visibilitychange',notify);button.remove();sheet.remove();document.body.classList.remove('has-camera-fab');}});
}
root.NobiScreenshotButton=Object.freeze({mount});
})(globalThis);
