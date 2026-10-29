// Explicit textbook consultation. Only the selected public excerpt is attached.
(function(root){
'use strict';
const sessions=new Map();let controller=null;
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const button=(text,action)=>{const b=el('button',text,'tb-btn');b.type='button';b.addEventListener('click',action);return b;};
const message=e=>({provider_not_ready:'AIは接続準備中です。下書きは残しています。',ai_consent_required:'AI利用の本人確認・同意が必要です。下書きは残しています。',plan_required:'新しい相談はPro以上です。保存済みの相談は読めます。',context_changed:'本文が更新されました。送信せず、本文を選び直してください。',request_outcome_unknown:'送信結果をまだ確定できません。「送信状況を確認」で確かめてください。',ai_trial_daily:'共通の日次上限に達しました。下書きは残しています。',ai_budget:'費用上限に達しました。下書きは残しています。',ai_stopped:'AIは安全のため停止中です。下書きは残しています。',active_session:'ログイン状態が変わりました。下書きは残しています。',session_changed:'ログイン状態が変わりました。下書きは残しています。',pending_locked:'前の相談の送信状況を先に確認してください。',draft_conflict:'別の画面で送信中の相談があります。今の入力をコピーしてから、この画面を読み直してください。',draft_limit:'この本の下書き上限（256件）です。今の入力は画面に残しています。',draft_invalid:'元の下書きを確認できません。上書きせず、開き直してください。',draft_store:'端末に下書きを保存できません。送信せず、入力を画面に残しています。'}[e?.code||e?.message]||'完了を確認できません。下書きを残したまま、送信状況を確認できます。');
function reset(){controller?.destroy();controller=null;for(const entry of sessions.values())entry.model.destroy();sessions.clear();}
function mount(app,book,context={}){
 controller?.destroy();controller=null;
 const api=root.nobiTextbookAIAPI,M=root.NobiTextbookAIModel;
 if(!api?.available()||!M||!/^[a-f0-9]{64}$/.test(context.annotationSignature||''))return null;
 for(const entry of sessions.values())if(!api.matches(entry.owner)){reset();break;}
 let entry=sessions.get(book);if(!entry){entry={owner:api.snapshot(),model:M.create(api,book)};sessions.set(book,entry);}
 const model=entry.model;let alive=true,picking=false,panel=null,epoch=0,priorFocus;
 const prose=(tag,text,cls)=>{const node=el(tag,text,cls);root.NobiFractions?.apply(node,null,{math:book==='math1'});return node;};
 const live=()=>alive&&model.current(),nodes=()=>[...app.querySelectorAll('[data-annotation-anchor]')];
 function stopPick(){picking=false;app.classList.remove('tb-ai-picking');open.textContent='教科書AI';for(const n of nodes()){n.removeAttribute('tabindex');n.removeAttribute('role');}}
 function close(){epoch++;panel?.remove();panel=null;stopPick();if(priorFocus?.isConnected)priorFocus.focus();}
 function shell(){close();context.beforeOpen?.();priorFocus=document.activeElement;
  const back=el('div',undefined,'tb-ann-back'),card=el('section',undefined,'tb-ann-card tb-ai-card');card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');card.setAttribute('aria-label','教科書AI');
  const top=el('div',undefined,'tb-ai-top');top.append(el('h3','教科書AI'),button('閉じる',close));card.append(top);back.append(card);app.append(back);panel=back;
  back.addEventListener('click',e=>{if(e.target===back)close();});for(const type of ['pointerdown','pointerup'])back.addEventListener(type,e=>e.stopPropagation());card.querySelector('button').focus();return card;
 }
 function pick(){close();context.beforeOpen?.();picking=true;app.classList.add('tb-ai-picking');open.textContent='選択を終わる';for(const n of nodes()){n.tabIndex=0;n.setAttribute('role','button');}nodes()[0]?.focus();}
 async function editor(anchor){
  if(!live())return;const card=shell(),run=epoch,status=el('p','本文と相談履歴を確認しています。','tb-ann-status');status.setAttribute('role','status');card.append(status);
  const valid=()=>live()&&run===epoch;
  let draft,source,canSend=false,busy=false,tick=0;
  const label=el('label','質問（3,000字まで）'),input=el('textarea');input.rows=5;input.maxLength=3000;input.setAttribute('aria-label','教科書AIへの質問');label.append(input);
  const quote=el('blockquote'),sourceLabel=el('p',undefined,'tb-ai-reference'),history=el('div',undefined,'tb-ai-history');history.setAttribute('aria-label','この文章の相談履歴');
  const send=button('本文と質問をAIへ送る',()=>void submit()),recover=button('送信状況を確認',()=>void refreshPending());
  function controls(){input.readOnly=!!draft?.pending||busy;send.disabled=busy||!canSend||!source||!input.value.trim();send.hidden=!!draft?.pending;recover.hidden=!draft?.pending;recover.disabled=busy;}
  function rows(items){history.replaceChildren();for(const item of items){const section=el('section',undefined,'tb-ann-record');section.append(el('p','あなたの質問'),prose('p',item.text),el('p','AIの説明'),prose('p',item.answer,'tb-ai-answer'));history.append(section);}}
  async function readHistory(){const result=await model.history(anchor);if(!valid())return;canSend=result.canSend;rows(result.items);controls();}
  async function refreshPending(){if(busy||!valid())return;busy=true;controls();status.textContent='送信状況を確認しています。';
   card.querySelector('.tb-ai-retry')?.remove();
   try{const result=await model.recover(anchor);if(!valid())return;
    if(result.state==='done'){draft=await model.load(anchor);if(!valid())return;input.value=draft.text;await readHistory();if(valid())status.textContent='保存済みの結果を復元しました。追加のAI通信はしていません。';}
    else if(['not_found','not_started','reserved','rejected'].includes(result.state)){
     status.textContent='完了した回答はありません。同じ相談として再試行できます。';
     if(canSend){const retry=button('同じ相談を再試行',()=>{retry.remove();void submit();});retry.classList.add('tb-ai-retry');card.append(retry);}
    }else status.textContent='結果がまだ確定できません。新しく送り直さず、後で送信状況を確認してください。';
   }catch(e){if(valid())status.textContent=message(e);}finally{if(valid()){busy=false;controls();}}
  }
  async function submit(){if(busy||!valid())return;busy=true;++tick;controls();status.textContent='確認した本文と質問を送信しています。';
   card.querySelector('.tb-ai-retry')?.remove();
   try{if(!draft.pending)await model.edit(anchor,input.value);if(!valid())return;await model.send(anchor,source);if(!valid())return;draft=await model.load(anchor);if(!valid())return;input.value=draft.text;await readHistory();if(valid())status.textContent='回答を保存しました。説明は教科書と照らして確かめましょう。';}
   catch(e){if(valid()){try{draft=await model.load(anchor);}catch{}if(valid())status.textContent=message(e);}}
   finally{if(valid()){busy=false;controls();}}
  }
  try{
   draft=await model.load(anchor);if(!valid())return;
   const [reference,previous]=await Promise.allSettled([model.source(anchor,context.annotationSignature),model.history(anchor)]);if(!valid())return;
   if(reference.status==='fulfilled')source=reference.value;
   if(previous.status==='fulfilled'){canSend=previous.value.canSend;rows(previous.value.items);}
   input.value=draft.text;const shown=draft.pending?draft.context:source;
   quote.textContent=shown?.quote||'本文を取得できません。送信せず、接続を確認してください。';
   root.NobiFractions?.apply(quote,null,{math:book==='math1'});
   sourceLabel.textContent=shown?`${shown.title}／${shown.sectionTitle||shown.chapter}`:'';
   card.append(el('p','送信する本文'),quote,sourceLabel,el('p','この文章と質問、この箇所の直近の相談を送ります。図の画像・閉じた答え・成績・手書きは添付しません。'),label,send,recover,history);
   status.textContent=draft.pending?'未確認の送信があります。質問を変えず、送信状況を確認してください。':!source?'本文を取得できません。下書きは保持しています。':!canSend?'新しい相談はPro以上です。保存済みの相談は読めます。':model.durable?'質問は本人別の端末下書きに保存します。送信ボタンを押すまでAIに送りません。':'端末保存を使えません。下書きはこの画面内だけに保持します。';controls();
   input.addEventListener('input',()=>{const own=++tick;controls();void model.edit(anchor,input.value).then(durable=>{if(valid()&&own===tick&&!busy)status.textContent=durable?'下書きを端末に保存しました。まだAIへ送信していません。':'下書きはこの画面内に保持しています。';}).catch(e=>{if(valid()&&own===tick)status.textContent=message(e);});});
  }catch(e){if(valid())status.textContent=message(e);}
 }
 const open=button('教科書AI',()=>{if(!live())return;if(picking)stopPick();else pick();});open.classList.add('tb-ai-button');app.querySelector('.tb-bar-actions')?.append(open);
 function select(e){if(!picking||!live())return;const n=e.target.closest?.('[data-annotation-anchor]');if(!n||!app.contains(n))return;e.preventDefault();e.stopImmediatePropagation();void editor(n.dataset.annotationAnchor);}
 function key(e){if(!live())return;if(panel){if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();return;}if(panel.contains(e.target)){e.stopPropagation();if(e.key==='Tab'){const targets=[...panel.querySelectorAll('button,textarea')].filter(n=>!n.disabled&&!n.hidden),at=targets.indexOf(document.activeElement);if(targets.length){e.preventDefault();targets[(at+(e.shiftKey?-1:1)+targets.length)%targets.length].focus();}}}}else if(picking&&['Enter',' '].includes(e.key))select(e);}
 app.addEventListener('click',select,true);document.addEventListener('keydown',key,true);
 const instance={close,destroy(){if(!alive)return;close();alive=false;open.remove();app.removeEventListener('click',select,true);document.removeEventListener('keydown',key,true);}};controller=instance;return instance;
}
root.NobiTextbookAI=Object.freeze({mount,reset,close(){controller?.close();}});
})(globalThis);
