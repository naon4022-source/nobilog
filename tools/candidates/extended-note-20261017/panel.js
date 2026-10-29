(function(root){
'use strict';
const validId=x=>typeof x==='string'&&/^[a-zA-Z0-9_-]{8,64}$/.test(x);
const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
function mount(host,api){
 let alive=true,busy=false,ready=false,job=null,item=null,connection=null,quota=null,message='接続と前の分析を確認しています。';
 const reasons={disabled:'AIは停止中です。',provider_conflict:'AIの接続先を確認しています。',setup_required:'AIの接続設定を確認しています。',billing_required:'AI提供元への支払い設定を確認しています。',consent_required:'AIの利用確認が必要です。',controls_unavailable:'安全な利用上限を確認できないため停止しています。',stopped:'安全のためAIを一時停止しています。',daily_limit:'今日の全体試験10回を使い切りました。'};
 const live=()=>alive&&host.isConnected&&api.same();
 const cost=()=>3*Math.max(1,(api.saved()?.images||[]).length);
 const jobValid=j=>j&&Object.keys(j).sort().join(',')==='id,noteId,revision,state'&&validId(j.id)&&validId(j.noteId)&&Number.isSafeInteger(j.revision)&&j.revision>0&&['pending','done'].includes(j.state);
 function reason(){
  const n=api.saved(),draft=api.draft();
  if(!api.allowed())return 'AIのノート分析はPro以上で使えます。';
  if(!n||!validId(n.id)||!Number.isSafeInteger(n.revision)||n.revision<1)return 'まずノートを保存してください。';
  if(draft.title!==n.title||draft.text!==n.text||JSON.stringify(draft.images||[])!==JSON.stringify(n.images||[]))return '変更を保存してから分析できます。';
  if(!Array.isArray(n.images||[])||(n.images||[]).length>3)return '写真は3枚まで選べます。';
  if(typeof n.text!=='string'||(!n.text.trim()&&!(n.images||[]).length)||n.text.length>12000)return '文章は12,000字まで、写真は3枚まで分析できます。元のノートはそのまま残ります。';
  if(job?.state==='pending'&&(job.noteId!==n.id||job.revision!==n.revision))return '前の版の分析結果を確認してから、新しい版を分析できます。';
  if(Number.isFinite(quota?.dailyLeft)&&quota.dailyLeft<cost())return '今日のAI回分が足りません。保存した分析結果は下で確認できます。';
  if(!ready)return 'AIの接続状態を確認してください。';
  return '';
 }
 function resultView(value){
  const section=el('section');section.setAttribute('aria-label','ノートのAI振り返り');
  section.append(el('h4','AIと、理解を確かめよう'),el('p','保存済みノート 第'+item.revision+'版の分析です。'),el('p','AIの提案です。正確さを確認しながら使いましょう。ノートや成績は変更しません。'),el('p',value.summary));
  if(value.strengths.length){section.append(el('h5','まとめられているところ'));for(const s of value.strengths)section.append(el('p',s));}
  if(value.checks.length){section.append(el('h5','ここを確認してみよう'));for(const check of value.checks){const card=el('article');card.append(el('blockquote',check.quote),el('p',check.reason),el('p',check.nextStep));section.append(card);}}
  if(Array.isArray(value.imageChecks)&&value.imageChecks.length){section.append(el('h5','写真から読み取ったこと'));for(const check of value.imageChecks){const card=el('article');card.append(el('h5','写真'+(check.image+1)+'（読み取りの確認が必要）'),el('p',check.readable?'読み取れた内容を、自分の写真と見比べましょう。':'文字を読み取れませんでした。'),el('p',check.observation),el('p',check.reason),el('p',check.nextStep));section.append(card);}}
  if(value.practice.length){section.append(el('h5','自分で確かめるミニ問題'),el('p','点数や成績には入りません。'));
   for(const practice of value.practice){const card=el('article'),answer=el('details');card.append(el('p',practice.question));answer.append(el('summary','解答例と理由を見る'),el('p',practice.answer),el('p',practice.reason));card.append(answer);section.append(card);}}
  return section;
 }
 function render(){
  if(!live())return;host.replaceChildren();host.classList.add('note-analysis-panel');
  host.append(el('h4','ノートをAIで振り返る'),el('p','保存したこの版の文章と添付写真をOpenAIへ送ります。今回は'+cost()+'回分。写真付きは1枚ごとに3回分、文章だけの分析は3回分です。送る前に名前や連絡先がないか確認してください。'));
  if(Number.isFinite(quota?.dailyLeft)&&Number.isFinite(quota?.dailyLimit))host.append(el('p','今日のAI：残り '+quota.dailyLeft+' / '+quota.dailyLimit+'回分。ほかのAI機能と共通です。'));
  if(Number.isInteger(connection?.trialLeft)&&connection.trialLeft>=0&&connection.trialLeft<=10)host.append(el('p','試験利用は全体で今日あと '+connection.trialLeft+' / 10回。月の費用は'+(Number.isInteger(connection.monthlyLimitYen)?connection.monthlyLimitYen:800)+'円の見積り上限で管理します。'));
  const why=reason();if(why)host.append(el('p',why));
  const status=el('p',message);status.setAttribute('role','status');host.append(status);
  const n=api.saved(),sameDone=job?.state==='done'&&job.noteId===n?.id&&job.revision===n?.revision;
  const send=el('button',busy?'確認しています…':job?.state==='pending'?'前の送信を同じ番号で確認する':sameDone?'この版の分析を見る（追加消費なし）':'AIで振り返る（'+cost()+'回分）');send.type='button';send.disabled=busy||!!why;send.addEventListener('click',()=>void run());host.append(send);
  const refresh=el('button','接続と前の結果を確認');refresh.type='button';refresh.disabled=busy;refresh.addEventListener('click',()=>void load());host.append(refresh);
  if(item)host.append(resultView(item.analysis));
 }
 function accept(result){
  const row=result?.item;
  if(!row||row.id!==job?.id||row.noteId!==job.noteId||row.revision!==job.revision||row.real!==true||!row.analysis||typeof row.analysis.summary!=='string'||!Array.isArray(row.analysis.strengths)||!Array.isArray(row.analysis.checks)||!Array.isArray(row.analysis.practice))throw Error('result');
  item=row;job={...job,state:'done'};
 }
 async function load(){
  if(!live()||busy)return;busy=true;render();
  try{
   const [state,prior]=await Promise.all([api.status(),api.loadJob()]);if(!live())return;
   ready=state?.ready===true;connection=state?.connection||null;quota=state?.plan||null;
   if(prior!==null&&prior!==undefined&&!jobValid(prior))throw Error('saved_job');
   job=prior||null;
   if(job){const result=await api.readResult(job.id);if(!live())return;if(result?.item){accept(result);if(await api.saveJob(job)!==true)throw Error('job_save_failed');if(!live())return;message='前に保存した分析です。AI回分は使っていません。';}else message='前の送信を確認できます。新しい番号では送りません。';}
   else message=ready?'保存したノートを、ボタンを押したときだけ分析します。':(reasons[connection?.reason]||'AIは現在使えません。')+' ノートはそのまま編集・保存できます。';
  }catch(_){if(live())message='接続か前の送信を確認できませんでした。自動で新しく送信しません。';ready=false;}
  finally{if(live()){busy=false;render();}}
 }
 async function run(){
  if(!live()||busy||reason())return;busy=true;api.lock?.(true);message='分析を準備しています。';render();
  try{
   const n=api.saved();
   if(!job||job.state==='done'&&(job.noteId!==n.id||job.revision!==n.revision))job={id:crypto.randomUUID(),noteId:n.id,revision:n.revision,state:'pending'};
   if(await api.saveJob(job)!==true)throw Error('job_save_failed');if(!live())return;
   // Only IDs and the saved revision are sent. Never the unsaved editor text.
   const result=await api.analyze({id:job.id,noteId:job.noteId,revision:job.revision});if(!live())return;
   accept(result);if(await api.saveJob(job)!==true)throw Error('job_save_failed');if(!live())return;
   if(!result.cached){if(Number.isFinite(quota?.dailyLeft))quota={...quota,dailyLeft:Math.max(0,quota.dailyLeft-(Number.isFinite(result.creditsUsed)?result.creditsUsed:cost()))};if(Number.isInteger(connection?.trialLeft))connection={...connection,trialLeft:Math.max(0,connection.trialLeft-1)};}
   message=result.cached?'前の結果です。AI回分は増えていません。':'分析を保存しました。'+(Number.isFinite(result.creditsUsed)?result.creditsUsed:cost())+'回分を使いました。';api.refreshQuota?.();
  }catch(_){if(live())message='分析を確認できませんでした。元のノートと送信番号は残しています。同じ番号で確認できます。';}
  finally{if(live()){busy=false;api.lock?.(false);render();}}
 }
 render();void load();return {refresh(){render();},destroy(){alive=false;host.replaceChildren();}};
}
root.NobiNoteAnalysis=Object.freeze({mount});
})(globalThis);
