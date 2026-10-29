(function(root){
 'use strict';
 const names={'数学':'数学','算数':'数学',math:'数学','英語':'英語',eng:'英語','国語':'国語',jpn:'国語','理科':'理科',sci:'理科','社会':'社会',soc:'社会'};
 const subject=value=>Object.prototype.hasOwnProperty.call(names,value)?names[value]:'';
 function attributes(value){const name=subject(value);return name?` data-answer-subject="${name}" lang="${name==='英語'?'en':'ja'}" inputmode="${name==='数学'?'decimal':'text'}" autocapitalize="none" autocorrect="off" spellcheck="false"`:'';}
 let target=null,bar=null,composing=false,pointerActive=false,pointerEnd=null;
 function clear(){target=null;composing=false;bar?.remove();bar=null;}
 function usable(){return target&&target.isConnected&&!target.disabled&&!target.readOnly&&target.getClientRects().length>0;}
 function insert(value){
  if(!usable()){clear();return;}if(composing)return;
  const field=target,start=field.selectionStart,end=field.selectionEnd;
  if(start===null||end===null)return;
  if(field.maxLength>=0&&field.value.length-(end-start)+value.length>field.maxLength)return;
  if(!field.dispatchEvent(new root.InputEvent('beforeinput',{bubbles:true,cancelable:true,inputType:'insertText',data:value})))return;
  if(target!==field||!usable())return;
  field.setRangeText(value,start,end,'end');
  field.dispatchEvent(new root.InputEvent('input',{bubbles:true,inputType:'insertText',data:value}));
  if(target===field&&usable())field.focus({preventScroll:true});
 }
 function prepare(input){
  const name=subject(input.dataset.answerSubject);if(!name)return;
  input.lang=name==='英語'?'en':'ja';input.autocapitalize='none';input.setAttribute('autocorrect','off');input.spellcheck=false;
  const mode=input.dataset.nobiInputMode;
  input.inputMode=mode==='text'||mode==='decimal'?mode:name==='数学'?'decimal':'text';
 }
 function show(input){
  const name=subject(input.dataset.answerSubject);prepare(input);
  if(!['数学','理科'].includes(name)){clear();return;}
  if(target===input&&bar?.isConnected)return;
  clear();target=input;bar=root.document.createElement('div');bar.className='nobi-input-tools no-print';bar.setAttribute('role','group');bar.setAttribute('aria-label','答えの入力補助');
  const keys=name==='数学'?[['−','-'],['.','.'],['/','/'],['(', '('],[')',')'],['x','x'],['y','y'],['=','=']]:[['−','-'],['.','.'],['/','/'],['%','%']];
  for(const [label,value] of keys){const b=root.document.createElement('button');b.type='button';b.textContent=label;b.setAttribute('aria-label',({'−':'マイナス','.':'小数点','/':'分数の区切り','(':'開き括弧',')':'閉じ括弧','=':'等号'})[label]||label+'を入力');b.addEventListener('pointerdown',e=>e.preventDefault());b.addEventListener('click',()=>insert(value));bar.append(b);}
  const toggle=root.document.createElement('button');toggle.type='button';toggle.className='nobi-input-toggle';
  const label=()=>{toggle.textContent=input.inputMode==='decimal'?'文字を入力':'数字を入力';};label();
  toggle.addEventListener('click',()=>{if(!usable()){clear();return;}if(composing)return;input.dataset.nobiInputMode=input.inputMode==='decimal'?'text':'decimal';prepare(input);label();input.blur();input.focus({preventScroll:true});});bar.append(toggle);
  input.insertAdjacentElement('afterend',bar);
 }
 function install(){
  const doc=root.document;
  const eligible=input=>(input.tagName==='INPUT'&&input.type==='text'||input.tagName==='TEXTAREA')&&subject(input.dataset.answerSubject)&&!input.disabled&&!input.readOnly;
  const clearAfterFocus=()=>{if(!pointerActive&&target&&doc.activeElement!==target&&!bar?.contains(doc.activeElement))clear();};
  // Keep the layout stable from pointer-down through click; removing the toolbar on focus
  // can move an answer button away before pointer-up and swallow the user's click.
  doc.addEventListener('focusin',e=>{if(bar?.contains(e.target))return;if(eligible(e.target))show(e.target);else if(!pointerActive)clear();});
  const endPointer=()=>{root.clearTimeout?.(pointerEnd);pointerEnd=null;pointerActive=false;root.setTimeout(clearAfterFocus,0);};
  doc.addEventListener('pointerdown',e=>{root.clearTimeout?.(pointerEnd);pointerActive=true;if(eligible(e.target))show(e.target);},true);
  // Touch focus and the synthesized click may occur after pointer-up. Finish after
  // click dispatch; the fallback also handles a drag that generates no click.
  doc.addEventListener('pointerup',()=>{pointerEnd=root.setTimeout(endPointer,500);});
  doc.addEventListener('click',endPointer);
  doc.addEventListener('pointercancel',endPointer);
  root.addEventListener?.('blur',()=>{root.clearTimeout?.(pointerEnd);pointerEnd=null;pointerActive=false;clear();});
  doc.addEventListener('focusout',()=>root.setTimeout(clearAfterFocus,0));
  doc.addEventListener('compositionstart',e=>{if(e.target===target)composing=true;});
  doc.addEventListener('compositionend',()=>{composing=false;});
 }
 root.NobiInput=Object.freeze({attributes,subject,clear});
 if(root.document){if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',install,{once:true});else install();}
 if(typeof module!=='undefined')module.exports=root.NobiInput;
})(typeof window!=='undefined'?window:globalThis);
