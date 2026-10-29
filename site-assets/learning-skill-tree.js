(function(root){
'use strict';
function element(tag,text){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;}
function mount(host,adapter){
 let alive=true,run=0,data=null,subject='数学',kind='教科書',shown=8,message='',busy=false;
 const same=()=>alive&&adapter.same();
 function button(text,action){const b=element('button',text);b.type='button';b.addEventListener('click',()=>{if(same())action();});return b;}
 function render(){
  if(!same()){host.replaceChildren();return;}host.replaceChildren();const section=element('section');section.className='skill-tree';host.append(section);
  section.append(element('h2','学びのスキルツリー'),element('p','保存済みの正解から育つ、5教科の木。ポイントはゲーム内の表示で、学力や学校の成績を表しません。'));
  const status=element('p',message);status.setAttribute('role','status');section.append(status);
  const reload=button('記録を読み込み直す',load);reload.disabled=busy;section.append(reload);if(!data)return;
  const tabs=element('nav');tabs.setAttribute('aria-label','スキルツリーの教科');section.append(tabs);
  for(const g of data){const b=button(g.subject,()=>{subject=g.subject;kind='教科書';shown=8;render();});b.setAttribute('aria-pressed',String(g.subject===subject));tabs.append(b);}
  const group=data.find(g=>g.subject===subject);section.append(element('h3',group.subject+'の木　'+group.points+'ポイント'),element('small','正解した問題が50%で★1、80%で★2、全部で★3。1つの★は5ポイント。何度見ても増えません。'));
  if(!group.units.length){section.append(element('p','この教科の教材は準備中です。'));return;}
  const kinds=element('nav');kinds.setAttribute('aria-label','スキルツリーの教材の種類');section.append(kinds);
  for(const value of ['教科書','特訓','ドリル']){const b=button(value,()=>{kind=value;shown=8;render();});b.setAttribute('aria-pressed',String(kind===value));b.disabled=!group.units.some(u=>u.kind===value);kinds.append(b);}
  const filtered=group.units.filter(u=>u.kind===kind);section.append(element('p','ポイントは教科の全種類合計。表示中は'+kind+' '+Math.min(shown,filtered.length)+' / '+filtered.length+'単元です。'));
  if(!filtered.length){section.append(element('p','選んだ種類の教材は準備中です。'));return;}
  const list=element('ol');list.className='skill-tree-branches';section.append(list);
  for(const u of filtered.slice(0,shown)){const li=element('li');li.dataset.stars=String(u.stars);li.append(element('b',u.title),element('span',u.kind+' · 正解 '+u.done+' / '+u.total+'問'),element('span','★'.repeat(u.stars)+'☆'.repeat(3-u.stars)));
   const meter=element('progress');meter.max=u.total;meter.value=u.done;meter.setAttribute('aria-label',u.title+'の正解数');li.append(meter,button('この単元の問題へ',()=>adapter.open(u.id)));list.append(li);}
  if(filtered.length>shown)section.append(button('続きを見る（残り'+(filtered.length-shown)+'単元）',()=>{const first=shown;shown+=8;render();host.querySelectorAll('.skill-tree-branches li')[first]?.querySelector('button')?.focus();}));
 }
 async function load(){
  if(!same()||busy)return;const id=++run;busy=true;message='保存済みの記録を読み込んでいます。';render();
  try{const next=await adapter.load();if(id!==run||!same())return;if(!Array.isArray(next?.bank?.units)||!next.progress||typeof next.progress!=='object'||Array.isArray(next.progress))throw Error('invalid records');data=root.NobiSkillTreeModel.build(next.bank,next.progress);message='保存済みの正解だけを表示しています。';}
  catch(_){if(id!==run||!same())return;message=data?'更新できませんでした。前に取得した記録を表示しています。':'記録を読み込めませんでした。再試行してください。';}
  finally{if(id===run){busy=false;render();}}
 }
 void load();return {destroy(){alive=false;run++;host.replaceChildren();}};
}
root.NobiSkillTree=Object.freeze({mount});
})(window);
