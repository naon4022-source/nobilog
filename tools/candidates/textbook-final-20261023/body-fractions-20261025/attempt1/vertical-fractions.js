// 分数を縦に表示する（2026-10-21 ユーザー指示「縦の分数、横にしないで」）。
// 文字としては「1/5」のまま残す（「/」は見えない形で残す）ので、読み上げ・検索・コピー・採点は今までどおり。
// 入力欄・数の集計（○3/70 など）・日付・時刻・m/s などの単位は分数にしない。
(function(root){
 'use strict';
 const FRACTION=/(^|[^0-9A-Za-z\/.:])(\d*\([^()\/\n]+\)|\d+(?:\.\d+)?[a-z]?|[a-z])\/(\([^()\/\n]+\)|\d+(?:\.\d+)?|[a-z])(?![0-9\/]|\.\d)/g;
 const SKIP_TAG=/^(INPUT|TEXTAREA|SELECT|OPTION|SCRIPT|STYLE|SUMMARY|NAV|SMALL|TIME|PROGRESS|CODE|PRE|SVG|svg|text|A)$/;
 const SKIP_CLASS=['vfrac','material-unit-progress','material-stars','material-selection','material-rewards-status','material-marks-side','no-vfrac'];
 function isCounter(text,start,end,top,bottom){
  const before=text.slice(Math.max(0,start-4),start),after=text.slice(end,end+8);
  if(/^0+$/.test(bottom))return true;   // 0/0 のような数え方は分数ではない
  if(/^\d+$/.test(top)&&/^\d+$/.test(bottom)){
   if(/^\s*[問回人日件枚個月年点頁ページ]/.test(after)||/([○●◯✓✔第]|問題|確認|正解|完了|達成|合計)\s*$/.test(before)||/^\s*\d{1,2}:\d{2}/.test(after)||/[年月]\s*$/.test(before))return true;
   if(/^\s*[（(][日月火水木金土]/.test(after))return true;   // 10/21（火）のような日付
  }
  return false;
 }
 function part(doc,cls,value){
  const el=doc.createElement('span');el.className=cls;const paren=/^\(.*\)$/.test(value);
  if(paren){const o=doc.createElement('span');o.className='vfrac-sr';o.textContent='(';el.append(o);}
  el.append(doc.createTextNode(paren?value.slice(1,-1):value));
  if(paren){const c=doc.createElement('span');c.className='vfrac-sr';c.textContent=')';el.append(c);}
  return el;
 }
 // 文字列を、縦の分数をふくむ部品にして返す（分数がなければ null）
 function fragment(text,doc,options){
  doc=doc||root.document;if(!doc||typeof text!=='string'||text.indexOf('/')<0)return null;
  const frag=doc.createDocumentFragment();let last=0,found=false,m;FRACTION.lastIndex=0;
  while((m=FRACTION.exec(text))){
   const [,before,top,bottom]=m,start=m.index+before.length,end=start+top.length+1+bottom.length;
   if(/^[a-z]$/.test(bottom)&&(/[a-z]$/.test(top)||/^[A-Za-z]/.test(text.slice(end,end+1)))){
    const unit=/^(?:m\/[shd]|g\/[shd]|l\/[shd])$/.test(top.replace(/^\d+(?:\.\d+)?/,'')+'/'+bottom);
    if(options?.math!==true||unit||/^[A-Za-z]/.test(text.slice(end,end+1)))continue;
   }
   if(isCounter(text,start,end,top,bottom))continue;
   found=true;frag.append(doc.createTextNode(text.slice(last,start)));
   const box=doc.createElement('span');box.className='vfrac';
   const bar=doc.createElement('span');bar.className='vfrac-sr';bar.textContent='/';
   box.append(part(doc,'vfrac-num',top),bar,part(doc,'vfrac-den',bottom));frag.append(box);last=end;
  }
  if(!found)return null;frag.append(doc.createTextNode(text.slice(last)));return frag;
 }
 // 親に文字を足す（分数は縦にして）。教科書のように、組む前に同期で使う
 function append(parent,text,options){const doc=parent.ownerDocument||root.document,frag=fragment(text,doc,options);parent.append(frag||doc.createTextNode(text));return parent;}
 function skipped(el,stop){
  for(let e=el;e&&e!==stop;e=e.parentNode){
   if(e.nodeType!==1)continue;
   if(SKIP_TAG.test(e.tagName)||e.isContentEditable||e.hasAttribute?.('data-no-vfrac'))return true;
   if(e.classList&&SKIP_CLASS.some(c=>e.classList.contains(c)))return true;
  }
  return false;
 }
 // node の中の文字を縦の分数にする。selector があれば、その要素の中だけ
 function apply(node,selector){
  const doc=root.document;if(!node||!doc||typeof doc.createTreeWalker!=='function')return;
  const targets=selector?[...(node.matches?.(selector)?[node]:[]),...(node.querySelectorAll?node.querySelectorAll(selector):[])]:[node];
  for(const target of targets){
   const walker=doc.createTreeWalker(target,4),list=[];let t;
   while((t=walker.nextNode()))if(t.nodeValue.indexOf('/')>=0&&!skipped(t.parentNode,target.parentNode))list.push(t);
   for(const t of list){const frag=fragment(t.nodeValue,doc);if(frag&&t.parentNode)t.parentNode.replaceChild(frag,t);}
  }
 }
 // 画面が変わるたびに直す。止めるときは返した関数を呼ぶ
 function watch(node,selector){
  if(!node||typeof root.MutationObserver!=='function')return ()=>{};
  apply(node,selector);
  const ob=new root.MutationObserver(records=>{for(const r of records){
   if(r.type==='characterData'){const p=r.target.parentNode;if(p&&(!selector||p.closest?.(selector))&&!skipped(p,node.parentNode))apply(p,null);continue;}
   for(const n of r.addedNodes){if(n.nodeType===3){const p=n.parentNode;if(p&&(!selector||p.closest?.(selector))&&!skipped(p,node.parentNode))apply(p,null);}else if(n.nodeType===1){if(skipped(n.parentNode,node.parentNode))continue;if(selector&&n.closest?.(selector))apply(n,null);else apply(n,selector);}}
  }});
  ob.observe(node,{childList:true,subtree:true,characterData:true});
  return ()=>ob.disconnect();
 }
 root.NobiFractions=Object.freeze({fragment,append,apply,watch});
})(typeof window!=='undefined'?window:globalThis);
// 見た目：分子／横線／分母。「/」は画面からは消して、文字としては残す
(function(root){
 const doc=root.document;if(!doc||!doc.head||doc.getElementById('vfrac-style'))return;
 const style=doc.createElement('style');style.id='vfrac-style';
 style.textContent='.vfrac{position:relative;display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;line-height:1.12;margin:0 .1em;font-size:.9em;text-indent:0}.vfrac-num{border-bottom:.08em solid currentColor;padding:0 .2em}.vfrac-den{padding:0 .2em}.vfrac-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap}';
 doc.head.append(style);
})(typeof window!=='undefined'?window:globalThis);
// 勉強・テスト・受験・成績などの問題文も縦にする（問題の文と答えの表示だけ。日付や回数の表示はさわらない）
(function(root){
 const doc=root.document;if(!doc||!root.NobiFractions)return;
 const SELECTOR='.q-text,.exm-q-text,.q-ans-show,.school-workbook-question,.g-q,.material-question-prompt';
 const start=()=>{if(doc.body)root.NobiFractions.watch(doc.body,SELECTOR);};
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',start,{once:true});else start();
})(typeof window!=='undefined'?window:globalThis);
