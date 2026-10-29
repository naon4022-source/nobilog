// 本人のサーバー採点済み回答だけを集計。AI推測・自動出題・自動送信はしない。
(function(root){
'use strict';
const names={free:'Free',mini:'Mini',standard:'Student（Standard）',pro:'Pro',unlimit:'UNLIMIT'};
function el(tag,text,cls){const n=document.createElement(tag);if(text!=null)n.textContent=String(text);if(cls)n.className=cls;return n;}
function button(text,fn){const b=el('button',text);b.type='button';b.addEventListener('click',fn);return b;}
function summarize(items){
 const unique=new Map();for(const r of items||[]){if(!r||typeof r.id!=='string'||!Number.isSafeInteger(r.at)||typeof r.unitId!=='string'||typeof r.questionId!=='string'||typeof r.result?.correct!=='boolean')continue;if(!unique.has(r.id))unique.set(r.id,r);}
 const ordered=[...unique.values()].sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id)),questions=new Map();
 for(const r of ordered){const k=JSON.stringify([r.unitId,r.questionId,r.mode]);if(!questions.has(k))questions.set(k,[]);questions.get(k).push(r);}
 const groups=new Map();
 for(const attempts of questions.values()){
  const last=attempts.at(-1),first=attempts[0],key=last.unitId;let g=groups.get(key);
  if(!g){g={id:key,subject:last.subject||'',title:last.unitTitle||key,wrong:[],recovered:[],attempts:0,questions:0};groups.set(key,g);}
  const pair={first,last,attempts:attempts.length};g.attempts+=attempts.length;g.questions++;
  if(!last.result.correct)g.wrong.push(pair);else if(attempts.some(r=>!r.result.correct))g.recovered.push(pair);
 }
 return [...groups.values()].sort((a,b)=>b.wrong.length-a.wrong.length||a.id.localeCompare(b.id));
}
function notify(feature,required='Pro'){
 if(required){introduction(required);return;}
 document.getElementById('plan-required-notice')?.remove();const previous=document.activeElement,c=el('section',null,'plan-required-notice');c.id='plan-required-notice';c.setAttribute('role','alert');
 c.append(el('b',required?feature+'は'+required+(required==='UNLIMIT'?'':'以上')+'の機能です。':feature),el('p',required?'プランの変更はなおに相談してください。押しただけでは契約や料金は変わりません。':'元の下書きは残っています。内容を整理してからもう一度押してください。'));
 if(required)c.append(button('Pro・UNLIMITの紹介を見る',()=>{c.remove();introduction(required);}));
 const close=button('プラン案内を閉じる',()=>{c.remove();if(previous?.isConnected)previous.focus();});c.append(close);(document.fullscreenElement||document.webkitFullscreenElement||document.body).append(c);close.focus();
}
function introduction(required='Pro',currentPlan=null){
 if(typeof root.subscriptionOpen==='function'){root.subscriptionOpen('compare',required.toLowerCase()==='student'?'standard':required.toLowerCase());return;}
 document.getElementById('plan-introduction')?.remove();const previous=document.activeElement,back=el('div',null,'plan-introduction'),card=el('section');back.id='plan-introduction';card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');card.setAttribute('aria-label','プラン紹介');back.append(card);
 const close=()=>{back.remove();if(previous?.isConnected)previous.focus();};card.append(el('h2','学び方に合わせたプラン'),el('p','今の学習に、何を足せるか見てみよう。機能の紹介を見るだけでプランや料金は変わりません。'),button('紹介を閉じる',close));
 for(const [name,price,text,features] of [
  ['Free','無料','まずは教材と、自分の学習記録から。',['教科書・問題・苦手ノートで普段の学習を続けられます。','AIヒント・AI相談は対象外。機能の鍵から対応プランを確認できます。','記録を残したまま、なおに相談してプランを変更できます。']],
  ['Mini','月500円（税込）','困った問題に、小さな手助けを。',['AIヒント・短い解説は毎日20回分。AI相談はPro以上。','苦手ノートを自分で見て復習。活動履歴は1週間。','予定の遅れを調整する機能とスクリーンショットはStudent以上です。']],
  ['Student（Standard）','月1,000円（税込）','学習のペースを整える。',['AIヒント・短い解説は毎日100回分。AI相談はPro以上。','学習予定と進み具合を見ながら遅れを調整。','活動履歴は3週間。スクリーンショットと保存した写真を活用。']],
  ['Pro','月1,500円（税込）','自分の考えを整理して、苦手を理解へ変える。',['AIは毎日500回分。ヒント・解説・相談で共通。','画像付きまとめノート、教科書のマーカーとメモ。','本人の回答から苦手な単元を振り返り、相談文や復習ノートへ。','解き直して正解できた問題を比較。活動履歴は1か月。']],
  ['UNLIMIT','月2,000円（税込）','一問ごとの振り返りと、なおの解説を学びの記録に。',['Proの機能に加え、AIは毎日5,000回分まで。','一問ごとの段階的な振り返り。問題・自分の回答・根拠を一緒に確認。','なおへの解説依頼、返信待ちの確認、返信済み解説のまとめ。返信に1日程度かかることもあります。','活動履歴は3年。なおの解説はプランを戻すと再表示。']]
 ].sort((a,b)=>Number(b[0].startsWith(required))-Number(a[0].startsWith(required)))){const section=el('section',null,'plan-intro-card');section.append(el('h3',name+'・'+price),el('p',text));const list=el('ul');for(const f of features)list.append(el('li',f));section.append(list);if(name.startsWith(required))section.append(el('small','さっき選んだ機能に対応するプラン'));card.append(section);}
 const comparison=el('a','全5プランの比較・使い方・今のプランとの差を見る');comparison.href='/plans.html'+(Object.hasOwn(names,currentPlan)?'?current='+encodeURIComponent(currentPlan):'');comparison.target='_blank';comparison.rel='noopener';card.append(comparison);
 card.append(el('p','AIの利用可否と残り回分は、各画面で現在の状態を確認できます。仮の返事にはその旨を表示します。ノートの文章・写真の分析は編集画面で、AIアイコン生成はアイコンの編集画面で、現在の利用状態を確認できます。'),button('学習画面へ戻る',close));
 back.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape'){e.preventDefault();close();}if(e.key==='Tab'){const buttons=[...card.querySelectorAll('button,a[href]')],at=buttons.indexOf(document.activeElement);e.preventDefault();buttons[(at+(e.shiftKey?-1:1)+buttons.length)%buttons.length]?.focus();}});(document.fullscreenElement||document.webkitFullscreenElement||document.body).append(back);card.querySelector('button').focus();
}
function mount(host,api){
 let alive=true,epoch=0,plan=null,items=[],next=null,windowLabel='',error='',busy=false,subject='',expanded=false;
 const live=()=>alive&&host.isConnected&&api.same();
 const allowed=k=>!!(plan?.provisional&&plan.features?.[k]);
 const date=t=>new Date(t).toLocaleString('ja-JP',{timeZone:'Asia/Tokyo'});
 function action(label,feature,fn,required='Pro'){return button(label+(!allowed(feature)?' 🔒':''),()=>{if(!live())return;if(!allowed(feature)){notify(label,required);return;}fn();});}
 async function load(more=false){
  if(busy)return;const e=++epoch;busy=true;error='';render();
  try{const p=await api.plan();if(!live()||e!==epoch)return;plan=p;
   if(!allowed('weakness')){items=[];next=null;return;}
   const d=await api.history(more?next:null);if(!live()||e!==epoch)return;
   items=more?items.concat(d.items||[]):d.items||[];next=d.next||null;windowLabel=d.window?.label||'取得した回答';
  }catch(_){if(live()&&e===epoch)error='読み込めませんでした。前に取得した記録は残しています。接続を確かめて、もう一度押してください。';}
  finally{if(live()&&e===epoch){busy=false;render();}}
 }
 function context(r){return '教科：'+r.subject+'\n単元：'+r.unitTitle+'\n問題：'+r.prompt+'\n自分の回答：'+r.answer+'\nわからない点：\nまず考え方を説明して、最後に自分で確かめる質問をしてください。';}
 function details(pair){
  const r=pair.last,c=el('article',null,'plan-study-question');c.append(el('h4',r.prompt),el('p','自分の回答：'+r.answer),el('small',date(r.at)+'・この問題の記録 '+pair.attempts+'回'));
  const a=el('details'),s=el('summary','正解と教材の解説を確認');a.append(s,el('p','正解：'+(r.expected?.accepted?.join(' / ')||(r.expected?.value??'問題の解説で確認'))),el('p',r.explanation||'解説の記録がありません。'));c.append(a);
  c.append(action('相談文の下書きを作る','chat',()=>api.chat(context(r))),action('復習ノートにまとめる','notes',()=>api.note(r.unitTitle+'の振り返り','問題：'+r.prompt+'\n自分の回答：'+r.answer+'\nどこで迷ったか：\n次に気を付けること：\n自分の言葉で説明：')));
  const deep=button('一問ずつ詳しく振り返る'+(!allowed('fullExplanation')?' 🔒':''),()=>{
   if(!live()||!c.isConnected)return;
   if(!allowed('fullExplanation')){notify('一問ずつ詳しく振り返る','UNLIMIT');return;}
   if(c.querySelector('.plan-study-deep'))return;
   const d=el('section',null,'plan-study-deep');d.append(el('h4','最初と今を比べる'),el('p','最初：'+pair.first.answer+'（'+(pair.first.result.correct?'正解':'不正解')+'） → 今：'+r.answer+'（'+(r.result.correct?'正解':'不正解')+'）'));
   for(const [title,text] of [['① 問いを確認','何を求める問題か、条件・単位を先に整理しよう。'],['② 根拠を確認',r.explanation||'教材の該当箇所を確認しよう。'],['③ 自分の説明','答えだけでなく、なぜその手順になるのかをノートに書こう。'],['④ もう一度確かめる','解説を閉じて同じ単元の練習をし、理解できたか確かめよう。']]){const step=el('details');step.append(el('summary',title),el('p',text));d.append(step);}
   d.append(el('p','この振り返りは保存済み教材の解説です。実AIによる詳細解説ではありません。'),action('なおへの解説依頼を開く','nao',()=>api.ask(r.id),'UNLIMIT'));c.append(d);
  });c.append(deep);return c;
 }
 function render(){
  if(!live())return;host.replaceChildren();const box=el('div',null,'plan-study');host.append(box);
  box.append(el('h2','自分専用の学習ラボ'),el('p',plan?.provisional?'今のプラン：'+(names[plan.plan]||plan.label):'プランを確認しています。'));
  const nav=el('div',null,'plan-study-actions');nav.append(action('学習ペースを調整','planning',()=>api.planning?.(),'Student'),action('まとめノート','notes',()=>api.notes()),action('AIに相談','chat',()=>api.chat()),action('教科書への書き込み','annotations',()=>api.book()),action('なおへの解説依頼','nao',()=>api.ask(),'UNLIMIT'));box.append(nav);
  if(plan?.provisional&&plan.creditsVersion==='daily-v2'&&Number.isFinite(plan.dailyLeft)&&Number.isFinite(plan.dailyLimit))box.append(el('p','今日のAI：残り '+plan.dailyLeft+' / '+plan.dailyLimit+'回分。ヒント・解説・相談で共通です。相談はPro以上です。'));
  else if(plan?.provisional&&Number.isSafeInteger(plan.aiLimit)&&Number.isSafeInteger(plan.aiLeft))box.append(el('p','ヒント・短い解説などのAI：今月残り '+plan.aiLeft+' / '+plan.aiLimit+'回。相談はPro以上です。'));
  if(api.study)box.append(button('問題を選ぶ',()=>api.study()));if(api.calendar)box.append(button('学習カレンダーを見る',()=>api.calendar()));
  if(busy)box.append(el('p','読み込んでいます。'));
  if(error){const p=el('p',error);p.setAttribute('role','alert');box.append(p);}
  if(plan?.provisional&&!allowed('weakness')){box.append(el('h3',plan.plan==='standard'?'Studentで学習のペースを整えよう。':'Freeでも普段の学習と苦手ノートは使えます。'),el('p','この画面の個別振り返り・ノート作成・AI相談はPro以上です。必要な機能を押すとプランを案内します。'),button('Proの個別振り返りについて',()=>notify('個別振り返り')));return;}
  const groups=summarize(items),selected=groups.filter(g=>!subject||g.subject===subject),wrong=selected.reduce((n,g)=>n+g.wrong.length,0),recovered=selected.reduce((n,g)=>n+g.recovered.length,0);
  box.append(el('p','表示範囲：'+windowLabel+'・取得 '+new Set(items.map(r=>r.id)).size+'件。取得した回答内で集計します。記録のない能力は推測しません。'),el('p','復習したい問題 '+wrong+'問 ／ 解き直して正解 '+recovered+'問','plan-study-summary'));
  const label=el('label','教科で絞る'),select=el('select');for(const name of ['',...new Set(groups.map(g=>g.subject))]){const o=el('option',name||'すべて');o.value=name;o.selected=subject===name;select.append(o);}select.addEventListener('change',()=>{subject=select.value;render();});label.append(select);box.append(label);
  box.append(button(expanded?'成長した問題を閉じる':'成長した問題も見る',()=>{expanded=!expanded;render();}));
  for(const g of selected){if(!g.wrong.length&&!expanded)continue;const card=el('section',null,'plan-study-unit');card.append(el('h3',g.subject+'・'+g.title),el('p','次の復習：まだ正解できていない '+g.wrong.length+'問。苦手な問題が多い単元から表示しています。'));
   for(const pair of g.wrong)card.append(details(pair));if(expanded)for(const pair of g.recovered){const wrap=el('details');wrap.append(el('summary','解き直して正解した問題'),details(pair));card.append(wrap);}box.append(card);}
  if(!items.length&&!busy&&!error)box.append(el('p','まだ回答の記録がありません。問題を解くと、ここに本人の振り返りが並びます。'));
  const refresh=button('読み込みなおす',()=>void load());refresh.disabled=busy;box.append(refresh);if(next){const more=button('前の50件も読み込む',()=>void load(true));more.disabled=busy;box.append(more);}
 }
 render();void load();return {async refresh(p){++epoch;busy=false;plan=p;if(!allowed('weakness')){items=[];next=null;}render();await load();},destroy(){alive=false;++epoch;host.replaceChildren();}};
}
root.NobiPlanStudy=Object.freeze({mount,summarize,notify,introduction});
})(globalThis);
