// コマンド（2026-10-21 ユーザー指示「便利になるコマンド」）：⌘K（Windows は Ctrl+K）または「/」で開き、文字を打って選ぶ。
// 画面を開く・文字の大きさ・動きを控える・いちばん上へ、など。画面を開くのはメニューと同じボタンを押すので、体験版の制限もメニューと同じ。
(function(root){
 'use strict';
 const doc=root.document;if(!doc)return;
 let box=null,input=null,list=null,items=[],active=0,lastFocus=null;
 function typing(e){const t=e.target;return t&&(t.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));}
 function settings(){try{return typeof root.appSettings==='function'?root.appSettings():null;}catch(_){return null;}}
 function commands(){
  const out=[];
  // メニューに出ている画面（人ごとに出し分けているものも、そのまま使う）
  for(const nav of doc.querySelectorAll('.nav-item[id^="nav-"]')){
   if(nav.hidden||getComputedStyle(nav).display==='none')continue;
   const label=nav.textContent.replace(/\s+/g,' ').trim();if(!label)continue;
   out.push({label:label+' を開く',keys:label,run:()=>nav.click()});
  }
  const s=settings();
  if(s&&typeof root.appSettingChange==='function'){
   out.push({label:(s.largeText?'文字をふつうの大きさにする':'文字を大きくする'),keys:'文字 大きい 小さい もじ',run:()=>root.appSettingChange('largeText',!s.largeText)});
   out.push({label:(s.reduceMotion?'アニメーションを元にもどす':'アニメーションを控える'),keys:'動き アニメーション うごき',run:()=>root.appSettingChange('reduceMotion',!s.reduceMotion)});
  }
  out.push({label:'いちばん上へ',keys:'上 トップ うえ',run:()=>root.scrollTo({top:0,behavior:'smooth'})});
  out.push({label:'いちばん下へ',keys:'下 した',run:()=>root.scrollTo({top:doc.documentElement.scrollHeight,behavior:'smooth'})});
  return out;
 }
 function close(){if(!box)return;box.remove();box=null;try{lastFocus?.focus?.();}catch(_){}}
 function draw(){
  const q=input.value.trim().toLowerCase();
  items=commands().filter(c=>!q||(c.label+' '+c.keys).toLowerCase().includes(q));
  if(active>=items.length)active=Math.max(0,items.length-1);
  list.replaceChildren();
  items.forEach((c,i)=>{const li=doc.createElement('li');li.id='nobi-cmd-'+i;li.setAttribute('role','option');li.setAttribute('aria-selected',String(i===active));li.textContent=c.label;
   li.addEventListener('mousemove',()=>{if(active!==i){active=i;mark();}});li.addEventListener('click',()=>pick(i));list.append(li);});
  if(!items.length){const li=doc.createElement('li');li.className='nobi-cmd-empty';li.textContent='見つかりません';list.append(li);}
  mark();
 }
 function mark(){[...list.querySelectorAll('[role=option]')].forEach((li,i)=>{li.setAttribute('aria-selected',String(i===active));if(i===active)li.scrollIntoView?.({block:'nearest'});});input.setAttribute('aria-activedescendant',items.length?'nobi-cmd-'+active:'');}
 function pick(i){const c=items[i];close();if(c)try{c.run();}catch(_){}}
 function open(){
  if(box)return;if(doc.getElementById('login-overlay')?.classList.contains('on'))return;   // ログイン前は開かない
  lastFocus=doc.activeElement;box=doc.createElement('div');box.className='nobi-cmd';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label','コマンド');
  const panel=doc.createElement('div');panel.className='nobi-cmd-panel';
  input=doc.createElement('input');input.type='text';input.className='nobi-cmd-input';input.placeholder='したいことを入力（例：英検、文字、上）';input.setAttribute('role','combobox');input.setAttribute('aria-expanded','true');input.setAttribute('aria-controls','nobi-cmd-list');input.setAttribute('autocomplete','off');
  list=doc.createElement('ul');list.id='nobi-cmd-list';list.className='nobi-cmd-list';list.setAttribute('role','listbox');
  const help=doc.createElement('p');help.className='nobi-cmd-help';help.textContent='↑↓で選ぶ・Enterで決定・Escでとじる';
  panel.append(input,list,help);box.append(panel);const fs=doc.fullscreenElement||doc.webkitFullscreenElement;(fs&&!/^(VIDEO|IMG|CANVAS|IFRAME)$/.test(fs.tagName)?fs:doc.body).append(box);   // 全画面の中でも見えるように
 active=0;draw();input.focus();
  box.addEventListener('click',e=>{if(e.target===box)close();});
  input.addEventListener('input',()=>{active=0;draw();});
  input.addEventListener('keydown',e=>{
   if(e.key==='Escape'){e.preventDefault();close();}
   else if(e.key==='ArrowDown'){e.preventDefault();if(items.length){active=(active+1)%items.length;mark();}}
   else if(e.key==='ArrowUp'){e.preventDefault();if(items.length){active=(active-1+items.length)%items.length;mark();}}
   else if(e.key==='Enter'&&!e.isComposing){e.preventDefault();pick(active);}
  });
 }
 doc.addEventListener('keydown',e=>{
  if(e.isComposing)return;
  if((e.metaKey||e.ctrlKey)&&!e.altKey&&!e.shiftKey&&(e.key==='k'||e.key==='K')){e.preventDefault();box?close():open();return;}
  if(e.key==='/'&&!e.metaKey&&!e.ctrlKey&&!e.altKey&&!typing(e)&&!doc.fullscreenElement){e.preventDefault();open();}
 });
 const style=doc.createElement('style');style.id='nobi-cmd-style';
 style.textContent='.nobi-cmd{position:fixed;inset:0;z-index:2147483000;background:#0006;display:flex;align-items:flex-start;justify-content:center;padding:12vh 16px 16px}.nobi-cmd-panel{width:min(560px,100%);background:var(--card-bg,#fff);color:var(--text,#222);border-radius:16px;box-shadow:0 12px 40px #0005;overflow:hidden}.nobi-cmd-input{width:100%;box-sizing:border-box;border:0;border-bottom:1px solid #ddd;padding:16px 18px;font-size:18px;background:transparent;color:inherit;outline:none}.nobi-cmd-list{list-style:none;margin:0;padding:6px;max-height:50vh;overflow:auto}.nobi-cmd-list li{padding:10px 12px;border-radius:10px;cursor:pointer}.nobi-cmd-list li[aria-selected=true]{background:#3498db;color:#fff}.nobi-cmd-empty{color:#888}.nobi-cmd-help{margin:0;padding:8px 14px;font-size:13px;color:#888;border-top:1px solid #eee}';
 (doc.head||doc.documentElement).append(style);
 root.NobiCommands=Object.freeze({open,close});
})(typeof window!=='undefined'?window:globalThis);
