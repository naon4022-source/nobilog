// Standalone candidate. No main-page edits, storage, credentials or auto-start.
// Authorization, ownership, damage and grading remain server responsibilities.
import {reconcileChildren} from './view-dom.mjs';
export function mountCoopView(root,io){
 if(!root?.ownerDocument||typeof io?.onAction!=='function'||typeof io?.isCurrent!=='function'||typeof io?.renderPrompt!=='function')throw Error('coop_view_configuration');
 const doc=root.ownerDocument;
 let destroyed=false,busy=false,pendingTaps=0,snapshot=null,questionId=null,answerDraft='',activeTab='party',storySection=0,selectedStage=null;
 const current=()=>!destroyed&&io.isCurrent()===true;
 function node(tag,text,cls){const el=doc.createElement(tag);if(text!==undefined)el.textContent=String(text);if(cls)el.className=cls;return el;}
 function button(text,action,detail={},disabled=false){const b=node('button',text);b.type='button';b.dataset.coopKey=action+':'+(detail.itemId||detail.requestId||detail.challengeId||detail.stageId||detail.roomId||'');b.disabled=disabled||busy||(snapshot?.retryPending===true&&action!=='retry');b.onclick=()=>void invoke(action,detail);return b;}
 function info(text){const p=node('p',text,'nobi-coop-info');p.setAttribute('role','status');return p;}
 function field(label,name,{type='text',maxLength=80,value=''}={}){
  const wrap=node('label',label),input=node('input');input.name=name;input.type=type;input.maxLength=maxLength;input.value=value;input.autocomplete='off';wrap.append(input);return {wrap,input};
 }
 function form(title,fields,action,extra={},disabled=false){
  const f=node('form'),heading=node('h3',title);f.dataset.coopKey='form:'+action;f.append(heading);const controls=fields.map(spec=>field(...spec));
  for(const c of controls)f.append(c.wrap);
  const submit=node('button',title);submit.type='submit';submit.disabled=disabled||busy||snapshot?.retryPending===true;f.append(submit);
  f.onsubmit=event=>{event.preventDefault();if(disabled||busy||snapshot?.retryPending)return;void invoke(action,{...extra,...Object.fromEntries(fields.map(spec=>[spec[1],event.currentTarget.elements.namedItem(spec[1]).value.trim()]))});};return f;
 }
 function joinForm(){
  const join=form('招待コードで参加を申し込む',[['招待コード','inviteCode',{maxLength:8}]],'join-request',{consent:true});
  const consent=node('label','この部屋の参加者に自分の表示名を伝え、協力して遊ぶことに同意します。');const checkbox=node('input');checkbox.type='checkbox';checkbox.required=true;consent.prepend(checkbox);join.insertBefore(consent,join.lastChild);return join;
 }
 const errors={active_session:'ログイン状態が変わりました。開き直してください。',host_only:'部屋を作った人が操作してください。',need_connected_party:'仲間が2人以上つながるまで待ってください。',need_ready_party:'全員の準備ができるまで待ってください。',insufficient_coins:'RPGコインが足りません。',room_unavailable:'この部屋は開けません。招待と参加状況を確認してください。',invite_unavailable:'招待が見つからないか、期限が切れています。',tap_rate:'少し待ってからタップしてください。',question_changed:'問題が更新されました。最新の表示を確認してください。'};
 let message='';
 async function invoke(action,detail){
  if(!current()){destroy();return;}if(busy)return;
  const tapping=action==='tap';if(tapping&&pendingTaps>=20)return;
  if(tapping)pendingTaps++;else busy=true;message='';if(!tapping||pendingTaps>=20)paint();
  try{const result=await io.onAction(action,detail);if(!current()){destroy();return;}if(result)accept(result);}
  catch(error){if(current())message=errors[error?.code]||'通信を確認して、もう一度試してください。';}
  finally{if(tapping)pendingTaps--;else busy=false;if(current())paint();else destroy();}
 }
 function accept(next){
  if(!next||typeof next!=='object')throw Error('coop_view_payload');
  const id=next.state?.own?.question?.challengeId||null;
  if(id!==questionId){questionId=id;answerDraft='';}
  snapshot=next;
 }
 function avatar(profile){
  const figure=node('figure',undefined,'nobi-coop-avatar');
  figure.dataset.body=profile?.body==='female'?'female':'male';
  figure.dataset.armored=String(Boolean(profile&&profile.armor!=='装備なし'));
  const shape=node('div',undefined,'nobi-coop-body');shape.setAttribute('aria-hidden','true');shape.append(node('i'),node('b'),node('span'));
  if(profile&&profile.weapon!=='素手')shape.append(node('em',profile.weapon.includes('杖')?'│':'⚔','nobi-coop-weapon'));
  figure.append(shape,node('figcaption',profile?`${profile.body==='female'?'女性':'男性'}・${profile.weapon}／${profile.armor}`:'体を選んで旅を始めよう'));
  return figure;
 }
 function party(panel,data){
  const state=data.state,profile=data.equipment||data.profile;
  panel.append(avatar(profile));
  if(!profile){
   panel.append(info('最初は素手・防具なしです。見た目はいつでも旅の装備に合わせて変わります。'));
   panel.append(button('男性の体で始める','profile',{body:'male'}),button('女性の体で始める','profile',{body:'female'}));return;
  }
  if(!state){
   panel.append(info('2〜3人で協力する物語です。招待された人の同意と、部屋を作った人の承認で参加します。'));
   const stageId=data.nextStageId||'story_01';
   panel.append(button('仲間を招待する部屋を作る','create',{stageId}));
   panel.append(joinForm());
   if(data.joinStatus)panel.append(info(data.joinStatus==='pending'?'参加の承認を待っています。':'参加状況を更新してください。'));return;
  }
  panel.append(node('h3',data.stageTitle||state.stageId));
  if(data.inviteCode&&state.phase==='lobby')panel.append(info('招待コード：'+data.inviteCode));
  const members=node('ul',undefined,'nobi-coop-members');
  for(const m of state.members||[])members.append(node('li',`${m.name}${m.self?'（あなた）':''}：${m.connected?'接続中':'再接続待ち'}${m.ready?'・準備できた':''}${m.questionPending?'・問題に挑戦中':''}`));
  panel.append(members);
  if(data.canHost&&state.phase!=='cleared')panel.append(button(state.phase==='lobby'?'この部屋を閉じる':'この冒険をやめて部屋を閉じる','cancel',{roomId:state.id}));
  const live=(state.members||[]).filter(m=>m.connected).length,self=state.members?.find(m=>m.self);
  if(state.phase==='lobby'){
   if(!data.canHost)panel.append(button('部屋から抜ける','leave',{roomId:state.id}));
   panel.append(button(self?.ready?'準備を取り消す':'準備できた','ready',{roomId:state.id,ready:!self?.ready},!self?.connected));
   if(data.canHost===true){
    if(state.members.length<3){panel.append(button('招待コードを作り直す','invite',{roomId:state.id}));if(!data.inviteCode)panel.append(info('コードを作り直すと、仲間を招待できます。'));}
    for(const request of data.pendingRequests||[]){const row=node('div',request.name);row.append(button('参加を承認','approve',{roomId:state.id,requestId:request.requestId}),button('見送る','reject',{roomId:state.id,requestId:request.requestId}));panel.append(row);}
    const ready=live>=2&&live<=3&&state.members.every(m=>m.ready&&m.connected);
    panel.append(button('全員で出発する','start',{roomId:state.id},!ready));
   }
   if(live<2)panel.append(info('相方が接続すると出発できます。1人では遊べません。'));return;
  }
  if(state.phase==='cleared'){
   panel.append(node('h3','ステージクリア！'));
   const included=state.clear?.selfPresentAtClear===true;
   panel.append(info(included?`一緒にクリア：${state.clear.companions?.join('・')||'記録を確認中'}`:'仲間がクリアしました。あなたのクリア記録は履歴で確認してください。'));
   if(data.loadingClear)panel.append(info('クリア履歴を確認しています…'));
   else if(data.nextStageId)panel.append(button(data.nextStageId===state.stageId?'このステージに再挑戦する':'次のステージの部屋を作る','create',{stageId:data.nextStageId}));
   if(data.joinStatus==='pending')panel.append(info('次の部屋への参加承認を待っています。'));else panel.append(joinForm());
   panel.append(button('クリア履歴を更新する','history'));return;
  }
  const hp=node('progress');hp.max=state.maxHp;hp.value=state.hp;hp.setAttribute('aria-label','ボスの残り体力');panel.append(hp,node('p',`ボスの体力 ${state.hp} / ${state.maxHp}`));
  if(state.phase==='countdown'){panel.append(info(Number.isInteger(data.countdownSeconds)?`出発まで ${data.countdownSeconds} 秒`:'全員の準備ができました。まもなく始まります。'));return;}
  if(live<2||state.phase==='paused'){panel.append(info('仲間の再接続を待っています。攻撃と進行を止めています。'));return;}
  const question=state.own?.question;
  if(question){
   const block=node('section',undefined,'nobi-coop-question');block.append(node('h3','自分が正解した問題を、もう一度'));
   const prompt=node('div',undefined,'nobi-coop-prompt');io.renderPrompt(prompt,question);block.append(prompt);
   const f=node('form'),label=node('label','答え'),input=node('textarea');f.dataset.coopKey='answer:'+question.challengeId;input.maxLength=4000;input.value=answerDraft;input.dataset.coopAnswer=question.challengeId;input.disabled=busy||snapshot?.retryPending===true;label.append(input);f.append(label);
   input.oninput=event=>{answerDraft=event.currentTarget.value;};
   const submit=node('button','答えを確かめる');submit.type='submit';submit.disabled=busy||snapshot?.retryPending===true;f.append(submit);
   f.onsubmit=event=>{event.preventDefault();if(busy||snapshot?.retryPending)return;void invoke('answer',{roomId:state.id,challengeId:question.challengeId,sequence:state.own.nextAnswerSequence,answer:event.currentTarget.querySelector('textarea').value});};
   block.append(f);
   if(state.own.lastResult?.challengeId===question.challengeId)block.append(info(state.own.lastResult.near?'惜しい。表記も確かめてもう一度。':'もう一度、問題をよく読もう。'));
   panel.append(block);return;
  }
  const canTap=data.connection==='connected'&&self?.connected===true&&state.phase==='battle';
  const tap=button('タップして攻撃','tap',{roomId:state.id,sequence:(state.own?.lastSequence||0)+1},!canTap||pendingTaps>=20||data.retryPending===true);tap.className='nobi-coop-tap';tap.setAttribute('aria-label','四角い光をタップして攻撃');panel.append(tap);
  panel.append(info(profile.damage?`1タップの攻撃力：${profile.damage}`:'攻撃力を確認中'));
 }
 function story(panel,data){
  const stages=data.story?.stages||[];
  const stage=stages.find(s=>s.id===(selectedStage||data.state?.stageId))||stages[0];
  if(!stage){panel.append(info('物語を読み込んでください。'),button('物語を読み込む','story'));return;}
  const allowed=new Set([data.state?.stageId,...(data.completedStageIds||[]),...(data.history||[]).map(x=>x.stageId)]);
  if(!allowed.has(stage.id)){panel.append(info('仲間と進むステージか、クリア済みの物語を選んでください。'));}
  else{
   const section=stage.sections[Math.min(storySection,stage.sections.length-1)];panel.append(node('h3',`${stage.number}章 ${stage.title}`),node('h4',section.title));
   for(const text of section.paragraphs)panel.append(node('p',text,'nobi-coop-prose'));
   const nav=node('nav');
   for(const [label,step] of [['前の場面',-1],['次の場面',1]]){const b=node('button',label);b.type='button';b.dataset.coopKey='scene:'+step;b.disabled=storySection+step<0||storySection+step>=stage.sections.length;b.onclick=()=>{storySection+=step;paint();};nav.append(b);}panel.append(nav);
  }
  for(const item of stages.filter(s=>allowed.has(s.id))){const b=node('button',`${item.number}章 ${item.title}`);b.type='button';b.dataset.coopKey='chapter:'+item.id;b.onclick=()=>{selectedStage=item.id;storySection=0;paint();};panel.append(b);}
 }
 function shop(panel,data){
  const profile=data.equipment||data.profile;if(!profile){panel.append(info('先に体を選んでください。'));return;}
  const coins=profile.coins;
  panel.append(avatar(profile),info(`RPGコイン：${Number.isSafeInteger(coins)?coins:'確認中'}`));
  const owned=new Set((profile.owned||[]).map(x=>x.id));
  for(const item of data.shop||[]){const row=node('div',undefined,'nobi-coop-shop-item');row.append(node('h3',item.label),node('p',`${item.slot==='armor'?'防具の追加攻撃力 +':'武器の攻撃力 '}${item.power}・${item.price}コイン`));row.append(owned.has(item.id)?button('装備する','equip',{itemId:item.id}):button('買う','purchase',{itemId:item.id},!Number.isSafeInteger(coins)||coins<item.price));panel.append(row);}
 }
 function history(panel,data){
  panel.append(button('履歴を更新する','history'));
  if(!data.history?.length){panel.append(info('一緒にクリアしたステージがここに残ります。'));return;}
  for(const item of data.history){const entry=node('article');entry.append(node('h3',item.stageTitle||item.stageId),node('p',`一緒にクリア：${(item.companions||[]).join('・')}`));panel.append(entry);}
  if(data.historyCursor)panel.append(button('以前のクリアを見る','history-more'));
 }
 function paint(){
  if(!current()){destroy();return;}
  const focused=doc.activeElement?.dataset?.coopAnswer,selection=focused?[doc.activeElement.selectionStart,doc.activeElement.selectionEnd]:null;
  const shell=node('section',undefined,'nobi-coop');shell.append(node('h2','仲間と読む冒険'));
  const tabs=node('nav',undefined,'nobi-coop-tabs');tabs.setAttribute('aria-label','協力冒険の画面');
  for(const [id,label] of [['party','冒険'],['story','物語'],['shop','装備のお店'],['history','クリア履歴']]){const b=node('button',label);b.type='button';b.dataset.coopKey='tab:'+id;b.setAttribute('aria-pressed',String(activeTab===id));b.onclick=()=>{activeTab=id;paint();};tabs.append(b);}shell.append(tabs);
  const data=snapshot||{};if(data.connection&&data.connection!=='connected')shell.append(info(data.connection==='session_changed'?'ログイン状態が変わりました。':'接続を確認しています。攻撃は確定するまで反映しません。'));
  if(data.retryPending)shell.append(info('前の操作の結果を確認するまで、新しい操作を止めています。'),button('同じ操作を再送する','retry'));
  if(message)shell.append(info(message));if(busy)shell.append(info('保存と反映を確認しています…'));
  const panel=node('section');panel.dataset.coopKey='panel:'+activeTab+':'+(data.state?.id||'')+(activeTab==='party'?':'+(data.state?.phase||'setup'):'');({party,story,shop,history}[activeTab])(panel,data);shell.append(panel);const frame=node('div');frame.append(shell);reconcileChildren(root,frame);
  if(focused===questionId){const input=root.querySelector('textarea[data-coop-answer]');if(input){input.focus({preventScroll:true});if(selection)input.setSelectionRange(...selection);}}
 }
 function destroy(){if(destroyed)return;destroyed=true;answerDraft='';snapshot=null;root.replaceChildren();}
 return Object.freeze({render(next){if(!current()){destroy();return;}accept(next);paint();},destroy});
}
