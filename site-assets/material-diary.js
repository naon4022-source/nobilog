(function(root){
'use strict';
const stamps=[['great','🌟','よくできた'],['steady','🌱','こつこつ進めた'],['challenging','🧩','難しかったけど挑戦した']];
function el(tag,text){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;}
function mount(host,bridge,units,enabled){
 const uid=bridge.identity();let alive=true,epoch=0,busy=false,mode='closed',message='',draft=null,items=[],next=null;
 function current(run){if(!alive)return false;if(uid!==bridge.identity()){host.replaceChildren();return false;}return run===epoch;}
 function button(label,action,disabled=busy){const b=el('button',label);b.type='button';b.disabled=disabled;b.addEventListener('click',action);return b;}
 async function open(){
  if(busy)return;if(!enabled()){mode='closed';message='今日もおつかれさま。振り返りの表示は設定でオフになっています。';render();return;}
  const run=++epoch;busy=true;mode='loading';message='今日の日記を確認しています。';render();
  try{
   const page=await bridge.diary(uid);if(!current(run))return;
   const saved=page.items.find(row=>row.day===page.today);
   if(!draft||draft.day!==page.today||!draft.dirty)draft={day:page.today,stamp:saved?.stamp||'steady',note:saved?.note||'',unitId:saved?.unitId||'',revision:saved?.revision||0,dirty:!saved};
   mode='edit';message='';
  }catch(error){if(current(run)){mode='closed';message=error.message||'日記を確認できませんでした。';}}
  finally{if(current(run)){busy=false;render();}}
 }
 async function save(){
  if(busy||!enabled()||!draft||!draft.dirty)return;const run=++epoch;busy=true;message='日記をサーバーに保存しています。';render();
  const entry={day:draft.day,stamp:draft.stamp,note:draft.note,unitId:draft.unitId,revision:draft.revision};
  try{const saved=await bridge.diarySave(entry,uid);if(!current(run))return;draft={...saved,dirty:false};message='日記をサーバーに保存しました。';}
  catch(error){if(current(run))message=error.message||'保存できませんでした。入力はこの画面に残っています。';}
  finally{if(current(run)){busy=false;render();}}
 }
 async function history(more=false){
  if(busy)return;const run=++epoch;busy=true;mode='history';message='日記を読み込んでいます。';if(!more){items=[];next=null;}render();
  try{
   const page=await bridge.diary(uid,more?next:undefined);if(!current(run))return;
   const combined=more?[...items,...page.items]:page.items;
   items=[...new Map(combined.map(row=>[row.day,row])).values()].sort((a,b)=>b.day.localeCompare(a.day));next=page.next;message=items.length?'':'まだ日記はありません。';
  }catch(error){if(current(run))message=error.message||'日記を読み込めませんでした。';}
  finally{if(current(run)){busy=false;render();}}
 }
 function close(){if(busy)return;epoch++;mode='closed';message='';render();}
 function render(){
  if(!current(epoch))return;
  if(!enabled()&&(mode==='edit'||mode==='loading')){mode='closed';message='振り返りの表示をオフにしました。保存済みの日記は残っています。';}
  host.replaceChildren();host.className='material-diary';
  const actions=el('nav');actions.setAttribute('aria-label','学習の振り返り');actions.append(button('今日の学習を終える',()=>void open()),button('振り返り日記を見る',()=>void history()));host.append(actions);
  if(message){const status=el('p',message);status.setAttribute('role','status');host.append(status);}
  if(mode==='edit'&&draft){
   const panel=el('section');panel.className='material-diary-form';panel.append(el('h3','あとのびログ・'+draft.day));
   panel.append(el('p','今日の達成感と、難しかったことを一行で残そう。同じ日の日記は一つです。'));
   const form=el('form'),fieldset=el('fieldset');fieldset.disabled=busy;fieldset.append(el('legend','今日の達成感'));
   for(const [id,icon,label] of stamps){
    const row=el('label'),input=el('input');input.type='radio';input.name='diary-stamp';input.value=id;input.checked=draft.stamp===id;
    input.addEventListener('change',()=>{draft.stamp=id;draft.dirty=true;submit.disabled=false;submit.textContent='日記を保存';});row.append(input,el('span',icon+' '+label));fieldset.append(row);
   }
   const unitLabel=el('label','難しかった単元（任意）'),select=el('select');select.disabled=busy;select.setAttribute('aria-label','難しかった単元');const none=el('option','選ばない');none.value='';select.append(none);
   for(const u of units){const option=el('option',u.subject+' '+u.grade+'年・'+u.title+'（'+(u.mode==='workbook'?'ワーク':'ドリル')+'）');option.value=u.id;select.append(option);}
   if(draft.unitId&&!units.some(u=>u.id===draft.unitId)){const retired=el('option','以前の単元（変更するか選ばないを選択）');retired.value=draft.unitId;select.append(retired);}
   select.value=draft.unitId;select.addEventListener('change',()=>{draft.unitId=select.value;draft.dirty=true;submit.disabled=false;submit.textContent='日記を保存';});unitLabel.append(select);
   const noteLabel=el('label','一行メモ（200文字まで・任意）'),note=el('input');note.type='text';note.maxLength=200;note.value=draft.note;note.disabled=busy;note.setAttribute('aria-label','振り返りの一行メモ');note.autocomplete='off';note.addEventListener('input',()=>{draft.note=note.value;draft.dirty=true;submit.disabled=false;submit.textContent='日記を保存';});noteLabel.append(note);
   const submit=el('button',busy?'保存中…':draft.dirty?'日記を保存':'保存済み');submit.type='submit';submit.disabled=busy||!draft.dirty;form.addEventListener('submit',event=>{event.preventDefault();void save();});
   const reload=button('保存済みの日記を読み込み直す',()=>{if(draft.dirty&&!root.confirm('入力中の内容を置き換えて、保存済みの日記を読み込みますか？'))return;draft=null;void open();});
   form.append(fieldset,unitLabel,noteLabel,submit,button('あとで',close),reload);panel.append(form);host.append(panel);
  }
  if(mode==='history'){
   const panel=el('section');panel.className='material-diary-history';panel.append(el('h3','これまでの振り返り'),button('閉じる',close));
   for(const row of items){const card=el('article'),stamp=stamps.find(s=>s[0]===row.stamp);card.append(el('h4',row.day),el('p',stamp[1]+' '+stamp[2]));if(row.unitId)card.append(el('p','難しかった単元：'+row.subject+'・'+row.unitTitle));if(row.note)card.append(el('p',row.note));panel.append(card);}
   if(next)panel.append(button('以前の日記を読む',()=>void history(true)));host.append(panel);
  }
 }
 render();return Object.freeze({destroy(){alive=false;epoch++;host.replaceChildren();},settingsChanged(){if(!enabled()&&(mode==='edit'||mode==='loading'))render();}});
}
root.NobiMaterialDiary=Object.freeze({mount});
})(globalThis);
