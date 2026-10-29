// 🔒 サイトを閉じているとき（2026-10-22）：サーバーが「locked」と返したら、画面をすべて隠して閉じた案内だけを出す。
// そのあとは、のびログのサーバーへの通信を止める（開けたあとは、ページを読みこみ直してログインし直す）。
(function(root){'use strict';
 const doc=root.document,orig=root.fetch&&root.fetch.bind(root);if(!doc||!orig)return;
 let locked=false;
 function show(){
  if(locked)return;locked=true;
  try{root.NobiLockdown.onLock&&root.NobiLockdown.onLock();}catch(_){}
  const draw=()=>{for(const c of [...doc.body.children])if(c.id!=='nobi-lockdown')c.style.display='none';
   if(doc.getElementById('nobi-lockdown'))return;
   const box=doc.createElement('div');box.id='nobi-lockdown';box.setAttribute('role','alert');
   box.style.cssText='position:fixed;inset:0;z-index:2147483647;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;background:#1f2937;color:#fff;text-align:center;font:18px/1.8 system-ui,sans-serif';
   const h=doc.createElement('h1');h.textContent='🔒 のびログを閉じています';h.style.cssText='font-size:24px;margin:0';
   const p=doc.createElement('p');p.textContent='安全のため、いまはログインも記録の読み書きもできません。なおが開けるまで待ってください。';p.style.margin='0';
   box.append(h,p);doc.body.append(box);};
  if(doc.body)draw();else doc.addEventListener('DOMContentLoaded',draw,{once:true});
 }
 root.fetch=async function(input,init){
  const url=String(input&&input.url||input);
  if(locked&&!/^(\/|https?:\/\/(localhost|127\.0\.0\.1|nobilog\.pages\.dev)\/)[^?]*\.(js|css|json|png|svg|webp|jpg|mp3|mp4|html)(\?|$)/.test(url))throw new TypeError('locked');
  const res=await orig(input,init);
  if(res.status===503){try{const b=await res.clone().json();if(b&&b.error==='locked')show();}catch(_){}}
  return res;
 };
 root.NobiLockdown={get locked(){return locked;},show,onLock:null};
})(typeof window!=='undefined'?window:globalThis);
