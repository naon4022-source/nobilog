// 明示的に開く個人のマーカー・メモ。原稿と採点は変更しない。
(function(root){
'use strict';
const books=new Map();let controller=null;
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const btn=(text,fn)=>{const b=el('button',text,'tb-btn');b.type='button';b.addEventListener('click',fn);return b;};
function reset(){controller?.destroy();controller=null;for(const x of books.values())x.model.destroy();books.clear();for(const node of document.querySelectorAll('[data-annotation-anchor]')){node.dataset.annotationColor='none';node.classList.remove('tb-ann-noted','tb-ann-locate');}}
function mount(app,book,context={}){
 controller?.destroy();controller=null;
 const api=root.nobiTextbookAnnotationAPI,M=root.NobiTextbookAnnotationModel;
 if(!api||!api.available()||!M)return;
 for(const x of books.values())if(!api.matches(x.owner)){reset();break;}
 let entry=books.get(book);
 if(!entry){entry={owner:api.snapshot(),model:M.session(api,book),loading:null};books.set(book,entry);}
 const model=entry.model;let alive=true,picking=false,panel=null,priorFocus=null,uiEpoch=0;
 const live=()=>alive&&model.current();
 const nodes=()=>[...app.querySelectorAll('[data-annotation-anchor]')];
 function paint(){if(!live())return;button.hidden=false;const saved=new Map(model.state().items.map(r=>[r.anchor,r]));for(const node of nodes()){
  const r=saved.get(node.dataset.annotationAnchor);node.dataset.annotationColor=r?.color||'none';node.classList.toggle('tb-ann-noted',!!r?.note);
 }}
 function stopPick(){picking=false;app.classList.remove('tb-ann-picking');button.textContent='マーカー・メモ';for(const n of nodes()){n.removeAttribute('tabindex');n.removeAttribute('role');}}
 function close(){uiEpoch++;panel?.remove();panel=null;if(priorFocus?.isConnected)priorFocus.focus();}
 function shell(title){close();stopPick();priorFocus=document.activeElement;const back=el('div',undefined,'tb-ann-back'),card=el('section',undefined,'tb-ann-card');
  card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');card.setAttribute('aria-label',title);
  card.append(el('h3',title),btn('閉じる',close));back.append(card);app.append(back);panel=back;
  back.addEventListener('click',e=>{if(e.target===back)close();});for(const kind of ['pointerdown','pointerup'])back.addEventListener(kind,e=>e.stopPropagation());
  card.querySelector('button').focus();return card;
 }
 async function load(){
  if(!entry.loading)entry.loading=model.load().finally(()=>{entry.loading=null;});
  await entry.loading;if(live())paint();
 }
 function pick(){close();picking=true;app.classList.add('tb-ann-picking');button.textContent='選択を終わる';for(const n of nodes()){n.tabIndex=0;n.setAttribute('role','button');}nodes()[0]?.focus();}
 function showList(error){
  if(!live())return;const card=shell('教科書のマーカー・メモ'),state=model.state();
  card.append(el('p',error||(!state.loaded?'読み込んでいます。':state.writable?'文章や図を選んで、色とメモを保存できます。':'保存済みの書き込みを読めます。追加・変更はPro以上です。'),'tb-ann-status'));
  if(state.loaded&&state.writable)card.append(btn('文章・図を選ぶ',pick));
  if(state.loaded&&!state.writable)card.append(btn('文章・図に書き込む 🔒 Pro以上',()=>{if(root.NobiPlanStudy)root.NobiPlanStudy.notify('教科書への書き込み');else alert('教科書への書き込みはPro以上の機能です。プランの変更はなおに相談してください。');}));
  card.append(btn('最新の記録を読み込む',()=>{const run=uiEpoch;void load().then(()=>{if(run===uiEpoch)showList();}).catch(()=>{if(run===uiEpoch)showList('読み込めませんでした。もう一度試してください。');});}));
  if(state.storageError)card.append(el('p','端末の下書き保存を使えません。画面を閉じる前にオンライン保存してください。','tb-ann-status'));
  const merged=new Map(state.items.map(r=>[r.anchor,r]));for(const d of state.drafts)merged.set(d.anchor,{...merged.get(d.anchor),...d,isDraft:true});
  const rows=[...merged.values()].filter(r=>r.isDraft||r.color!=='none'||r.note).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
  if(state.loaded&&!rows.length)card.append(el('p','まだ書き込みはありません。'));
  for(const r of rows){const box=el('div',undefined,'tb-ann-record');if(r.isDraft)box.append(el('p','未送信の下書き'));box.append(el('blockquote',r.quote),el('p',r.note||'マーカーだけの記録'));
   const target=nodes().find(n=>n.dataset.annotationAnchor===r.anchor);
   box.append(btn(state.writable?'メモを開く':'読む',()=>editor(r.anchor,r.quote)));
   if(target||context.locate)box.append(btn('この文章を見る',()=>{close();if(target){target.tabIndex=-1;target.focus({preventScroll:true});target.classList.add('tb-ann-locate');setTimeout(()=>target.classList.remove('tb-ann-locate'),1200);}else if(!context.locate(r.anchor))showList('原稿が更新されたため、今の本に同じ文章が見つかりません。メモは保存されています。');}));
   card.append(box);
  }
 }
 function editor(anchor,quote){
  if(!live())return;const state=model.state(),old=state.items.find(r=>r.anchor===anchor),draft=model.draft(anchor);
  const card=shell('選んだ文章・図のメモ');card.append(el('blockquote',quote));
  const label=el('label','マーカーの色'),color=el('select');color.setAttribute('aria-label','マーカーの色');
  for(const [value,name] of [['none','色なし'],['yellow','黄色'],['blue','青'],['pink','ピンク']]){const o=el('option',name);o.value=value;color.append(o);}
  color.value=draft?.color||old?.color||'yellow';label.append(color);
  const nl=el('label','メモ（2,000字まで）'),note=el('textarea');note.maxLength=2000;note.rows=6;note.setAttribute('aria-label','教科書メモ');note.value=draft?.note??old?.note??'';nl.append(note);
  const status=el('p',undefined,'tb-ann-status');status.setAttribute('role','status');card.append(label,nl,status);
  let revision=draft?.revision??old?.revision??0,sending=false,retainTick=0;
  const retain=()=>{if(!live())return;const run=uiEpoch,tick=++retainTick;void model.draft(anchor,{quote,note:note.value,color:color.value,revision}).then(durable=>{
   if(live()&&run===uiEpoch&&tick===retainTick&&!sending&&model.draft(anchor))status.textContent=durable?'端末に下書きを保存しました。オンライン保存はまだです。':'画面内に下書きを保持しています。閉じる前にオンライン保存してください。';
  }).catch(()=>{if(live()&&run===uiEpoch&&tick===retainTick&&!sending)status.textContent='端末に下書きを保存できません。画面を閉じる前にオンライン保存してください。';});};
  note.addEventListener('input',retain);color.addEventListener('change',retain);
  if(state.loaded&&!state.writable){note.readOnly=true;color.disabled=true;status.textContent='保存済みのメモです。変更はPro以上です。';return;}
  if(draft)status.textContent='未送信の下書きを復元しました。内容を確認して保存してください。';
  const save=btn('保存する',async()=>{
   if(sending||!live())return;retain();retainTick++;sending=true;save.disabled=true;note.disabled=true;color.disabled=true;status.textContent='保存しています。';
   try{const r=await model.save({anchor,quote,color:color.value,note:note.value,revision});if(!live())return;revision=r.revision;status.textContent='オンラインに保存しました。';paint();}
   catch(e){if(!live())return;status.textContent=e.code==='annotation_limit'?'この本の保存上限に達しました。入力は残っています。':e.status===409?'別の端末で更新されています。入力は残っています。最新のメモを確認してください。':e.status===403?'プランが変わったため保存できません。入力は残っています。':'保存できませんでした。入力を残したまま、もう一度保存できます。';
    if(e.status===409&&e.code!=='annotation_limit'&&!card.querySelector('.tb-ann-conflict')){const compare=btn('最新のメモを確認する',async()=>{try{await load();if(!live())return;const latest=model.state().items.find(r=>r.anchor===anchor);if(!latest)return;revision=latest.revision;card.append(el('p','最新のメモ：'),el('blockquote',latest.note||'（メモなし）'));status.textContent='入力は残っています。内容を比べ、置き換えてよければ保存してください。';}catch(_){if(live())status.textContent='最新のメモを読み込めませんでした。入力は残っています。';}});compare.classList.add('tb-ann-conflict');card.append(compare);}
   }finally{if(live()){sending=false;save.disabled=false;note.disabled=false;color.disabled=false;}}
  });card.append(save);note.focus();
 }
 const button=btn('マーカー・メモ',()=>{
  if(!live())return;if(picking){stopPick();return;}showList();const run=uiEpoch;void load().then(()=>{if(run===uiEpoch)showList();}).catch(()=>{if(run===uiEpoch)showList('読み込めませんでした。保存済みの表示は消していません。');});
 });button.classList.add('tb-ann-button');app.querySelector('.tb-bar-actions')?.append(button);
 function select(e){if(!picking||!live())return;const n=e.target.closest?.('[data-annotation-anchor]');if(!n||!app.contains(n))return;e.preventDefault();e.stopImmediatePropagation();editor(n.dataset.annotationAnchor,n.dataset.annotationQuote);}
 function key(e){if(!live())return;if(panel){if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();return;}if(panel.contains(e.target)){
   e.stopPropagation();if(e.key==='Tab'){const items=[...panel.querySelectorAll('button,input,textarea,select')].filter(n=>!n.disabled),at=items.indexOf(document.activeElement);if(items.length){e.preventDefault();items[(at+(e.shiftKey?-1:1)+items.length)%items.length].focus();}}
  }}else if(picking&&(e.key==='Enter'||e.key===' '))select(e);}
 app.addEventListener('click',select,true);document.addEventListener('keydown',key,true);
 controller={paint,destroy(){alive=false;close();stopPick();button.remove();app.removeEventListener('click',select,true);document.removeEventListener('keydown',key,true);}};
 if(model.state().loaded)paint();else void load().catch(e=>{if(live()&&e.status===404)button.hidden=true;});
 }
root.NobiTextbookAnnotations=Object.freeze({mount,reset,refresh(){controller?.paint();},unmount(){controller?.destroy();controller=null;}});
})(globalThis);
