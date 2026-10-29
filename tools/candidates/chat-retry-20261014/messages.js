// ✉️ メッセージ画面（Claude・2026-10-10）：人形マークのマイページから開く。3つを分けて表示する。
// ① なおから（お知らせ・応援・返却連絡）全プラン ② AI相談 Pro・UNLIMIT ③ なおへの解説依頼 UNLIMIT
// サーバーとのやりとりは index.html が渡す api だけで行う（アカウントが変わったら api が止める）。
// 文字はすべて textContent で入れる（HTMLとして扱わない）。生徒どうしのチャットはない。
(function(root){
'use strict';
const PLAN_NAME={free:'Free',mini:'Mini',standard:'Student（Standard）',pro:'Pro',unlimit:'UNLIMIT'};
const STATUS={received:'受付済み',reviewing:'確認中',answered:'返信済み'};
function el(tag,text,cls){const n=document.createElement(tag);if(text!==undefined&&text!==null)n.textContent=String(text);if(cls)n.className=cls;return n;}
function btn(text,fn,cls){const b=el('button',text,'msg-btn'+(cls?' '+cls:''));b.type='button';b.addEventListener('click',fn);return b;}
const jst=t=>{if(!t)return '';const d=new Date(t+9*3600000);return d.getUTCFullYear()+'/'+(d.getUTCMonth()+1)+'/'+d.getUTCDate()+' '+String(d.getUTCHours()).padStart(2,'0')+':'+String(d.getUTCMinutes()).padStart(2,'0');};
const errText=(code,status)=>({ai_plan:'今のプランでは、AIの回数が残っていません（確認版の仮ルール）。',too_fast:'続けて送るのが早すぎます。3秒ほど待ってから送ってください。',plan_required:'今のプランでは使えません。',provider_not_ready:'AI相談は、いま準備中のため使えません。',request_in_progress:'前の送信を処理しています。少し待ってから、もう一度押してください。',id_conflict:'送信の印が重なりました。入力は残っています。もう一度送ってください。',daily_limit:'今日の解説依頼は上限（10件）に達しました。明日また送れます。',too_many_open:'返信を待っている依頼が20件あります。返信が来てから送ってください。',attempt_not_found:'選んだ回答が見つかりませんでした。一覧を読み込みなおしてください。',plan_unavailable:'プランを確認できませんでした。少し待ってから試してください。'}[code]||(status===401?'ログインが切れました。ログインしなおしてください。':'送れませんでした。入力は残っています。'));
function mount(host,api){
 const imageControllers=[];let aiImages=null,renderAfterImage=false;
 let imageDraft=[];try{const v=JSON.parse(api.draftGet('chatImages')||'[]');if(Array.isArray(v))imageDraft=v.filter(x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x)).slice(0,3);}catch(_){}
 const S={tab:['nao','ai','ask'].includes(api.tab)?api.tab:'nao',plan:api.lastPlan||null,planMsg:'',alive:true,
  nao:{items:[],busy:false,err:'',loaded:false,ep:0},
  ai:{items:[],images:imageDraft,provider:'mock',ready:false,busy:false,err:'',loaded:false,ep:0,sending:false,status:'',retry:null,failed:null},
  ask:{items:[],locked:false,hidden:0,busy:false,err:'',loaded:false,ep:0,answers:[],answersErr:'',pick:api.attemptId||'',filter:'all',sending:false,status:'',retry:null}};
 const live=()=>S.alive&&host.isConnected&&(!api.same||api.same());
 const feat=k=>!!(S.plan&&S.plan.provisional&&S.plan.features&&S.plan.features[k]);
 function showImages(target,ids){if(!ids?.length||!root.NobiLearningImages||!api.imageRequest)return;const h=el('div');target.append(h);imageControllers.push(root.NobiLearningImages.create(h,{initial:ids,readonly:true,current:live,request:api.imageRequest}));}
 async function loadPlan(){try{const p=await api.plan();if(!live())return;S.plan=p;S.planMsg='';}catch(_){if(live())S.planMsg=S.plan?'プランを確認できませんでした。前に確認したプランの表示のままです（Freeには戻していません）。':'プランを確認できませんでした。少し待ってから開きなおしてください。';}}
 function updateNaoBadge(){if(!live())return;const b=host.querySelector('[data-msg-tab="nao"]');if(b){const n=S.nao.items.filter(m=>!m.readAt).length;b.textContent='📨 なおから'+(n?'（'+n+'）':'');}}
 async function loadNao(){const e=++S.nao.ep;S.nao.busy=true;S.nao.err='';if(S.tab==='nao')render();
  try{const d=await api.get('/messages');if(!live()||e!==S.nao.ep)return;S.nao.items=Array.isArray(d&&d.items)?d.items:[];S.nao.loaded=true;}
  catch(_){if(live()&&e===S.nao.ep)S.nao.err='メッセージを読み込めませんでした。接続を確かめて、読み込みなおしてください。';}
  finally{if(live()&&e===S.nao.ep){S.nao.busy=false;if(S.tab==='nao')render();else updateNaoBadge();}}}
 async function loadAi(){const e=++S.ai.ep;S.ai.busy=true;S.ai.err='';render();
  try{if(!feat('chat')){S.ai.items=[];S.ai.loaded=true;return;}const d=await api.get('/learning-chat');if(!live()||e!==S.ai.ep)return;S.ai.items=Array.isArray(d&&d.items)?d.items:[];S.ai.provider=d?.provider==='openai'?'openai':'mock';S.ai.ready=d?.ready===true;S.ai.loaded=true;root.NobiAITrialNotice?.show(d?.trial);}
  catch(_){if(live()&&e===S.ai.ep)S.ai.err='相談の記録を読み込めませんでした。読み込みなおしてください。下書きは残っています。';}
  finally{if(live()&&e===S.ai.ep){S.ai.busy=false;render();}}}
 async function loadAsk(){const e=++S.ask.ep;S.ask.busy=true;S.ask.err='';render();
  try{const d=await api.get('/explain-requests');if(!live()||e!==S.ask.ep)return;S.ask.items=Array.isArray(d&&d.items)?d.items:[];S.ask.locked=!!(d&&d.locked);S.ask.hidden=Number(d&&d.hidden)||0;S.ask.loaded=true;
   if(!S.ask.locked&&!S.ask.answers.length&&typeof api.history==='function'){try{const h=await api.history();if(live()&&e===S.ask.ep){const rows=(h&&Array.isArray(h.items)?h.items:[]).filter(r=>r&&typeof r.id==='string');S.ask.answers=rows.filter(r=>!r.result?.correct).concat(rows.filter(r=>r.result?.correct)).slice(0,50);if(S.ask.pick&&!S.ask.answers.some(a=>a.id===S.ask.pick)){S.ask.pick='';S.ask.answersErr='選んだ古い回答はこの一覧にありません。表示中の回答を選び直してください。';}}}catch(_){if(live())S.ask.answersErr='回答の一覧を読み込めませんでした。';}}}
  catch(_){if(live()&&e===S.ask.ep)S.ask.err='解説依頼を読み込めませんでした。読み込みなおしてください。';}
  finally{if(live()&&e===S.ask.ep){S.ask.busy=false;render();}}}
 const loadTab=()=>S.tab==='nao'?loadNao():S.tab==='ai'?loadAi():loadAsk();
 async function markRead(m){if(m.readAt)return;m.readAt=Date.now();render();try{const r=await api.post('/messages',{action:'read',id:m.id});if(!r.ok&&live()){m.readAt=null;render();}}catch(_){if(live()){m.readAt=null;render();}}}
 // AI相談：同じ文のまま再試行するときは同じ送信IDを使う（サーバーが1回分として扱う）
 async function sendAi(textarea){
  if(S.ai.sending||!live())return;if(aiImages?.busy()){S.ai.status='画像の準備が終わるまで待ってください。';return;}const text=textarea.value,images=[...S.ai.images];if(!text.trim()&&!images.length){S.ai.status='相談したいことを書いてください。';render();return;}
  if(!S.ai.retry||S.ai.retry.text!==text||JSON.stringify(S.ai.retry.images||[])!==JSON.stringify(images))S.ai.retry={id:api.newId(),text,images};
  let req=S.ai.retry;S.ai.sending=true;S.ai.failed=null;S.ai.status='送信しています…';render();
  try{
   if(S.ai.provider==='openai'){
    if(typeof api.retrySave!=='function')throw Error('retry_save_unavailable');
    const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify({text:req.text,images:req.images||[]})));
    const hash=Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
    let prior=null;try{const raw=api.draftGet('chatRetry');if(raw.length<=200)prior=JSON.parse(raw);}catch(_){}
    if(prior?.version===1&&/^[a-zA-Z0-9_-]{8,64}$/.test(prior.id)&&prior.hash===hash&&Object.keys(prior).sort().join(',')==='hash,id,version')req={...req,id:prior.id};
    S.ai.retry=req;
    await api.retrySave(JSON.stringify({version:1,id:req.id,hash}),req.text,req.images||[]);
    if(!live())return;
   }
   const r=await api.post('/learning-chat',{id:req.id,text:req.text,...(req.images?.length?{images:req.images}:{})});if(!live())return;
   root.NobiAITrialNotice?.show(r.json?.trial);
   if(!r.ok){S.ai.failed=req;const extra={billing_not_ready:r.json?.retrySafe===true?'OpenAIの残高または利用上限を確認してください。入金や設定の反映後に、同じ相談をもう一度送れます。自動では再送しません。':'OpenAIの残高または利用上限と、前の処理の確認が必要です。なおに確認してください。',ai_budget:'今月のAI料金上限に達しました。新しい通信を止めています。',ai_trial_daily:'試験利用が今日の10回に達しました。追加利用はなおに確認してください。',ai_busy:'別のAI相談を処理しています。少し待ってください。',ai_stopped:'異常が続いたため、AIを停止しています。なおに確認してください。',ai_consent_required:'AIの利用確認が必要です。なおに確認してください。',request_outcome_unknown:'送信結果を確認できません。同じ送信で再確認しても、新しいAI通信は行いません。',content_blocked:'この内容はAIで説明できません。学習についての質問に書き直してください。'};S.ai.status=(extra[r.json?.error]||errText(r.json&&r.json.error,r.status))+(r.status===429&&r.json?.error==='too_fast'?'':' 入力は残っています。');return;}
   const item=r.json&&r.json.item;if(item&&!S.ai.items.some(x=>x.id===item.id))S.ai.items.push(item);
   S.ai.retry=null;S.ai.images=[];api.draftSet('chatRetry','');api.draftSet('chatImages','');api.draftSet('chat','');S.ai.status=r.json&&r.json.cached?'前に送った同じ相談の返事を表示しました（回数は増えていません）。':'送信しました。1回分を使いました。';
   void loadPlan().then(()=>{if(live())render();});
  }catch(_){if(live()){S.ai.failed=req;S.ai.status='送れませんでした（通信が切れたかもしれません）。入力は残っています。「もう一度送る」で同じ相談を送りなおせます（二重には数えません）。';}}
  finally{if(live()){S.ai.sending=false;render();}}
 }
 async function sendAsk(select,note){
  if(S.ask.sending||!live())return;const attemptId=select.value;if(!attemptId){S.ask.status='解説してほしい問題と自分の回答を選んでください。';render();return;}
  const body={attemptId,note:note.value};
  if(!S.ask.retry||S.ask.retry.attemptId!==body.attemptId||S.ask.retry.note!==body.note)S.ask.retry={id:api.newId(),...body};
  const req=S.ask.retry;S.ask.sending=true;S.ask.status='送信しています…';render();
  try{const r=await api.post('/explain-requests',{id:req.id,attemptId:req.attemptId,note:req.note});if(!live())return;
   if(!r.ok){S.ask.status=errText(r.json&&r.json.error,r.status);return;}
   const item=r.json&&r.json.item;if(item&&!S.ask.items.some(x=>x.id===item.id))S.ask.items.unshift(item);
   S.ask.retry=null;S.ask.pick='';api.draftSet('ask','');S.ask.status='なおに送りました（受付済み）。返信まで1日くらいかかることがあります。';
  }catch(_){if(live())S.ask.status='送れませんでした（通信が切れたかもしれません）。入力は残っています。もう一度押すと、同じ依頼として送りなおします。';}
  finally{if(live()){S.ask.sending=false;render();}}
 }
 function planLine(){
  const p=S.plan;const box=el('div',null,'msg-plan');
  if(!p||!p.provisional){box.append(el('span',S.planMsg||'プランを確認しています…'));return box;}
  box.append(el('b','プラン：'+(PLAN_NAME[p.plan]||p.label||p.plan)));
  const left=p.aiLimit===0?'AIは使えません':p.aiLimit===null?'今日のAI 残り '+Number(p.dailyLeft)+' / 1,000回':'今月のAI 残り '+Number(p.aiLeft)+' / '+Number(p.aiLimit)+'回';
  box.append(el('span',left+'（ヒント・解説・AI相談で共通）'));
  if(S.planMsg)box.append(el('span',S.planMsg,'msg-warn'));
  return box;
 }
 function locked(text,extra){const c=el('section',null,'msg-locked');c.setAttribute('role','alert');c.append(el('p',text));if(extra)c.append(el('p',extra,'msg-note'));c.append(el('p','プランの変更は、なおに伝えてください（支払いはなおが受け取り、なおが確認してから変更します）。','msg-note'));return c;}
 function naoTab(){
  const box=el('section',null,'msg-pane');
  box.append(el('p','なおからのお知らせ・応援と、配布物の返却連絡です。開くと「既読」になります。','msg-note'));
  if(S.nao.err)box.append(el('p',S.nao.err,'msg-err'));
  if(!S.nao.items.length&&S.nao.loaded&&!S.nao.err)box.append(el('p','まだメッセージはありません。','msg-empty'));
  const list=el('div',null,'msg-list');
  for(const m of S.nao.items){
   const d=el('details',null,'msg-item'+(m.readAt?'':' msg-unread'));const s=el('summary');
   s.append(el('span',m.label||'お知らせ','msg-chip msg-chip-'+(m.kind||'notice')),el('b',m.title,'msg-title'),el('small',jst(m.at)+(m.readAt?'・既読':'・未読'),'msg-when'));
   d.append(s,el('p',m.body,'msg-body'));
   if(m.assignmentId&&typeof api.openAssignment==='function')d.append(btn('関連する配布物を開く',()=>api.openAssignment(m.assignmentId)));
   d.addEventListener('toggle',()=>{if(d.open)void markRead(m);});
   list.append(d);
  }
  box.append(list,btn('読み込みなおす',()=>void loadNao(),'msg-sub'));
  return box;
 }
 function aiTab(){
  const box=el('section',null,'msg-pane');
  if(!feat('chat'))return locked('AI相談は Pro と UNLIMIT で使えます。'+(S.plan&&S.plan.provisional?'今のプランは '+(PLAN_NAME[S.plan.plan]||S.plan.plan)+' です。':''));
  box.append(el('p',S.ai.provider==='openai'?(S.ai.ready?'OpenAIのAIと、考え方や勉強の進め方を相談できます。試験利用は全体で1日10回までです。':'OpenAI接続の準備中です。支払いと利用承認の確認が終わるまで送信できません。'):'⚠ 実AIはまだつながっていません。返事は「動作確認用の仮の返事」で、質問を読んで分析・解説したものではありません。送信・保存・回数の確認だけができます。','msg-mock'));
  box.append(el('p','1回送ると1回分を使います（ヒント・解説と共通の回数）。通信が切れて送りなおしても、同じ相談は1回分です。','msg-note'));
  if(S.ai.err)box.append(el('p',S.ai.err,'msg-err'));
  const log=el('div',null,'msg-chat');log.setAttribute('aria-live','polite');
  for(const it of S.ai.items){const me=el('div',null,'msg-bubble msg-me');me.append(el('small','自分・'+jst(it.at)),el('p',it.text));showImages(me,it.images);const ai=el('div',null,'msg-bubble msg-ai');ai.append(el('small',it.real===true&&it.mock===false?'AIの返事（'+(it.model==='gpt-6.1-sol'?'Sol':'Luna')+'）':'仮の返事（実AIではありません）'),el('p',it.answer||''));log.append(me,ai);}
  if(S.ai.sending&&S.ai.retry){const me=el('div',null,'msg-bubble msg-me msg-pending');me.append(el('small','送信中…'),el('p',S.ai.retry.text));log.append(me);}
  if(!S.ai.items.length&&!S.ai.sending&&S.ai.loaded)log.append(el('p','まだ相談はありません。','msg-empty'));
  box.append(log);
  const label=el('label','相談したいこと（3,000字まで）','msg-label');const ta=el('textarea');ta.maxLength=3000;ta.rows=4;ta.value=api.draftGet('chat')||'';ta.disabled=S.ai.sending;ta.setAttribute('aria-label','相談したいこと');
  ta.addEventListener('input',()=>api.draftSet('chat',ta.value));label.append(ta);box.append(label);
  const goals=el('div',null,'msg-tabs');goals.setAttribute('aria-label','相談の進め方');
  for(const [title,prompt] of [['考え方を整理','答えを先に言わず、考え方を短い手順に分けて説明してください。'],['理解を確かめる','私に一つずつ確認質問をして、説明できるか確かめてください。'],['間違いを振り返る','私の回答と解説を比べ、間違えた手順と次に確認することを整理してください。']])goals.append(btn(title,()=>{const next=ta.value?ta.value+'\n'+prompt:prompt;if(next.length>3000){st.textContent='3,000字を超えるため追加しませんでした。下書きは残っています。';return;}ta.value=next;api.draftSet('chat',next);ta.focus();}));
  box.append(goals,el('p','相談の進め方は下書きに追加するだけです。送信するまで回数は減りません。','msg-note'));
  if(root.NobiLearningImages&&api.imageRequest){const h=el('div');box.append(h);aiImages=root.NobiLearningImages.create(h,{initial:S.ai.images,disabled:S.ai.sending||S.ai.busy,pasteTarget:ta,current:live,request:api.imageRequest,change:ids=>{S.ai.images=ids;api.draftSet('chatImages',JSON.stringify(ids));},finish:message=>{S.ai.status=message;if(renderAfterImage){renderAfterImage=false;render();}}});imageControllers.push(aiImages);box.append(el('p',S.ai.provider==='openai'?'添付画像は保存できます。画像をAIに送る機能は準備中です。':'添付画像は保存できます。実AIが未接続のため、画像の読み取り・解説はまだ行いません。','msg-note'));}
  const st=el('p',S.ai.status,'msg-status');st.setAttribute('role','status');box.append(st);
  if(S.ai.provider==='openai')box.append(el('p','画像付きのAI相談は準備中です。添付した画像と下書きは残ります。','msg-note'));
  const send=btn(S.ai.failed&&S.ai.failed.text===ta.value?'もう一度送る':'送信する',()=>void sendAi(ta),'msg-main');send.disabled=S.ai.sending||S.ai.busy||(S.ai.provider==='openai'&&(!S.ai.ready||S.ai.images.length>0));box.append(send);
  return box;
 }
 function askTab(){
  const box=el('section',null,'msg-pane');
  if(!feat('nao')||S.ask.locked)return locked('なおへの詳しい解説依頼は UNLIMIT で使えます。',S.ask.hidden?'UNLIMIT のときに受け取った解説が '+S.ask.hidden+' 件保存されています。いまは表示していませんが、消していません。UNLIMIT に戻すと、また表示されます。':'');
  box.append(el('p','問題と自分の回答を選んで、なおに詳しい解説をお願いできます。なおが自分で読んで返信するので、返信まで1日くらいかかることがあります。','msg-note'));
  if(S.ask.err)box.append(el('p',S.ask.err,'msg-err'));
  const form=el('div',null,'msg-form');
  const label=el('label','解説してほしい問題と自分の回答','msg-label');const sel=el('select');sel.setAttribute('aria-label','解説してほしい問題と自分の回答');
  const first=el('option','選んでください');first.value='';sel.append(first);
  for(const a of S.ask.answers){const o=el('option',(a.result?.correct?'○ ':'× ')+(a.subject||'')+'「'+(a.unitTitle||'')+'」 '+String(a.prompt||'').slice(0,30)+' → 自分の答え：'+String(a.answer||'').slice(0,20));o.value=a.id;o.selected=S.ask.pick===a.id;sel.append(o);}
  sel.disabled=S.ask.sending;sel.addEventListener('change',()=>{S.ask.pick=sel.value;});label.append(sel);form.append(label);
  if(S.ask.answersErr)form.append(el('p',S.ask.answersErr,'msg-err'));
  if(!S.ask.answers.length&&!S.ask.answersErr&&S.ask.loaded)form.append(el('p','まだ選べる回答がありません。新しい教材の問題を解くと、ここから選べます。','msg-note'));
  const nl=el('label','わからないところ（なくてもよい・1,000字まで）','msg-label');const note=el('textarea');note.maxLength=1000;note.rows=3;note.value=api.draftGet('ask')||'';note.disabled=S.ask.sending;note.setAttribute('aria-label','わからないところ');note.addEventListener('input',()=>api.draftSet('ask',note.value));nl.append(note);form.append(nl);
  const st=el('p',S.ask.status,'msg-status');st.setAttribute('role','status');form.append(st);
  const send=btn('なおに送る',()=>void sendAsk(sel,note),'msg-main');send.disabled=S.ask.sending||S.ask.busy;form.append(send);
  box.append(form);
  const filters=el('div',null,'msg-tabs');filters.setAttribute('aria-label','解説依頼の絞り込み');
  for(const [key,title] of [['all','すべて'],['waiting','返信待ち'],['answered','なおの解説集']]){const count=S.ask.items.filter(r=>key==='all'||(key==='waiting'?r.status!=='answered':r.status==='answered')).length;const b=btn(title+'（'+count+'）',()=>{S.ask.filter=key;render();});b.setAttribute('aria-pressed',S.ask.filter===key?'true':'false');filters.append(b);}box.append(filters);
  const list=el('div',null,'msg-list');
  for(const r of S.ask.items){
   if(S.ask.filter==='waiting'&&r.status==='answered'||S.ask.filter==='answered'&&r.status!=='answered')continue;
   const c=el('article',null,'msg-item msg-request');const head=el('div',null,'msg-head');
   head.append(el('span',STATUS[r.status]||r.label||r.status,'msg-chip msg-status-'+r.status),el('b',(r.attempt?.subject||'')+'「'+(r.attempt?.unitTitle||'')+'」','msg-title'),el('small','依頼：'+jst(r.at),'msg-when'));
   c.append(head,el('p','問題：'+(r.attempt?.prompt||''),'msg-body'),el('p','自分の答え：'+(r.attempt?.answer||'')+(r.attempt?.correct?'（正解）':'（不正解）'),'msg-body'));
   if(r.note)c.append(el('p','わからないところ：'+r.note,'msg-body'));
   if(r.reply){const rep=el('div',null,'msg-reply');rep.append(el('small','なおの解説・'+jst(r.reply.at)),el('p',r.reply.text));c.append(rep);}
   else c.append(el('p',r.status==='reviewing'?'なおが確認しています。':'なおに届きました。返信まで1日くらいかかることがあります。','msg-note'));
   list.append(c);
  }
  if(!list.children.length&&S.ask.loaded&&!S.ask.err)list.append(el('p',S.ask.filter==='answered'?'なおの返信はまだありません。返信が届くとここにまとめます。':'この表示に該当する依頼はありません。','msg-empty'));
  box.append(list,btn('読み込みなおす',()=>void loadAsk(),'msg-sub'));
  return box;
 }
 function render(){
  if(live()&&S.tab==='ai'&&feat('chat')&&aiImages?.busy()){renderAfterImage=true;return;}
  for(const c of imageControllers)c.destroy();imageControllers.length=0;aiImages=null;
  if(!live())return;
  const keep=host.querySelector('textarea');const focus=keep&&document.activeElement===keep;
  host.replaceChildren();const wrap=el('div',null,'msg');host.append(wrap);
  wrap.append(el('h2','✉️ メッセージ'),planLine());
  const unread=S.nao.items.filter(m=>!m.readAt).length;
  const tabs=el('nav',null,'msg-tabs');tabs.setAttribute('aria-label','メッセージの種類');
  for(const [k,t,need] of [['nao','📨 なおから'+(unread?'（'+unread+'）':''),''],['ai','💬 AI相談','Pro以上'],['ask','🙋 なおに解説依頼','UNLIMIT']]){const b=btn(t+(need&&!feat(k==='ai'?'chat':'nao')?' 🔒':''),()=>{if(need&&!feat(k==='ai'?'chat':'nao')&&root.NobiPlanStudy){root.NobiPlanStudy.notify(k==='ai'?'AI相談':'なおへの解説依頼',k==='ai'?'Pro':'UNLIMIT');return;}if(S.tab===k)return;S.tab=k;render();void loadTab();},'msg-tab');b.dataset.msgTab=k;b.setAttribute('aria-pressed',S.tab===k?'true':'false');if(need)b.title=need+'で使えます';tabs.append(b);}
  wrap.append(tabs);
  const busy=S[S.tab].busy;if(busy){const p=el('p','読み込んでいます…','msg-status');p.setAttribute('role','status');wrap.append(p);}
  wrap.append(S.tab==='nao'?naoTab():S.tab==='ai'?aiTab():askTab());
  if(focus){const t=host.querySelector('textarea');if(t&&!t.disabled){t.focus();t.selectionStart=t.selectionEnd=t.value.length;}}
 }
 // プランが変わったとき（index.html が「プランを変更しています」を出してから呼ぶ）。切り替えた機能を返す
 async function refresh(plan){if(!live())return null;if(plan)S.plan=plan;else await loadPlan();S.ask.answers=[];render();await loadTab();if(!live())return null;return {chat:feat('chat'),nao:feat('nao'),plan:S.plan&&S.plan.plan};}
 render();
 (async()=>{await loadPlan();if(!live())return;if(S.plan&&S.tab!=='nao'&&!feat(S.tab==='ai'?'chat':'nao')&&root.NobiPlanStudy){root.NobiPlanStudy.notify(S.tab==='ai'?'AI相談':'なおへの解説依頼',S.tab==='ai'?'Pro':'UNLIMIT');S.tab='nao';}render();await loadTab();if(S.tab!=='nao'&&live())void loadNao();})();
 return {refresh,destroy(){S.alive=false;host.replaceChildren();},state:()=>({tab:S.tab,plan:S.plan&&S.plan.plan,chat:feat('chat'),nao:feat('nao')})};
}
root.NobiMessages=Object.freeze({mount});
})(globalThis);
