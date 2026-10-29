(function(root){
'use strict';
let controller=null,diaryController=null,speedController=null,skillController=null,epoch=0,kind=null;
function stop(){epoch++;controller?.destroy();diaryController?.destroy();speedController?.destroy();skillController?.destroy();controller=null;diaryController=null;speedController=null;skillController=null;kind=null;}
async function flush(who,run){
 const deadline=Date.now()+15000;
 while(cloudState.busy){
  if(!cloudSame(who)||run!==epoch||Date.now()>deadline)throw Error('保存を確認できませんでした。');
  await new Promise(resolve=>setTimeout(resolve,100));
 }
 if(!cloudSame(who)||run!==epoch||authLeaseBlocked||cloudConflict())throw Error('保存への接続を確認してください。');
 if(cloudDirty()){
  clearTimeout(cloudTimer);const saved=await cloudPush();
  if(!saved||cloudDirty()||!cloudSame(who)||run!==epoch)throw Error('保存を確認できませんでした。');
 }
}
function rewardStore(who){
 return {
  readGame:()=>{const raw=recordStorage.getItem(who.uid+':gameState');return raw===null?{}:JSON.parse(raw);},
  writeGame:next=>{recordStorage.setItem(who.uid+':gameState',JSON.stringify(next));cloudSetDirty(true);}
 };
}
async function start(){
 const host=document.getElementById('study-materials');
 if(!host||!currentUserId)return;
 if(controller&&kind==='study'){await controller.reload();return;}
 stop();const run=epoch,who=cloudIdentity();host.textContent='教材を読み込んでいます。';
 try{
  const response=await fetch('/material-bank.json',{cache:'no-store'});
  if(!response.ok)throw Error('教材を読み込めませんでした。');
  const bank=await response.json();
  if(run!==epoch||!cloudSame(who))return;
  if(!root.NobiMaterialUI||!root.NobiMaterialBridge||!Array.isArray(bank.units)||!Array.isArray(bank.sources))throw Error('教材を読み込めませんでした。');
  async function records(path,body){
   if(run!==epoch||!cloudSame(who)||authLeaseBlocked)throw Error('回答記録へ接続できません。');
   const response=await cloudTry(cloudUrl(path),body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{cache:'no-store'},15000);
   if(run!==epoch||!cloudSame(who))throw Error('ログインが変更されました。');
   if(!response.ok){
    if(path.startsWith('/material-diary')){
     const error=await response.json().catch(()=>({}));
     throw Error(error.error==='diary_conflict'?'別の保存が届いています。入力を控えて、日記を読み込み直してください。':error.error==='diary_day_changed'?'日付が変わりました。入力を控えて、今日の日記を開き直してください。':'日記を保存・確認できませんでした。入力はこの画面に残っています。');
    }
    if(/^\/material-(explain|hint|judge|similar|generate)/.test(path)){
     const error=await response.json().catch(()=>({}));
     if(run!==epoch||!cloudSame(who))throw Error('ログインが変更されました。');
     root.NobiAITrialNotice?.show(error.trial);
     throw Error({ai_trial_daily:'AIの試験利用は1日10回までです。追加利用にはなおの許可が必要です。',ai_busy:'別のAI通信を処理しています。終わるまで待ってください。',ai_stopped:'異常が続いたためAIを停止しています。なおが原因を確認するまで再開しません。',ai_control_unavailable:'安全管理の保存を確認できないためAIを停止しました。',ai_plan:'今のプランでは、AIの回数が残っていません（確認版の仮ルール）。問題の解説は使えます。',ai_budget:'今月のAI利用の目安額に達したため、AIを止めています。問題の解説は使えます。',ai_rate:'少し時間をあけてから、もう一度押してください。',ai_daily:'今日のAIの利用回数の上限に達しました。明日また使えます。',ai_unsupported:'この問題・この回答ではAIを使えません。問題の解説で確認してください。',generated_full:'作った問題がこの単元の上限（60問）に達しました。作った問題を解いてみよう。',hint_order:'ヒントは1段目から順に開いてください。'}[error.error]||'AIは今は使えません。勉強はそのまま続けられます。');
    }
    throw Error('回答記録を確認できませんでした。');
   }
   const value=await response.json();if(run!==epoch||!cloudSame(who))throw Error('ログインが変更されました。');root.NobiAITrialNotice?.show(value.trial);return value;
  }
  const bridge=root.NobiMaterialBridge.create({
   ...rewardStore(who),
   identity:()=>run===epoch&&cloudSame(who)?who.uid:null,
   ready:()=>serverBootReady&&!isTrial()&&!authLeaseBlocked,
   read:()=>{const raw=recordStorage.getItem(who.uid+':appData');return raw===null?{totalScores:{},history:[]}:JSON.parse(raw);},
   write:next=>{recordStorage.setItem(who.uid+':appData',JSON.stringify(next));userData=next;cloudSetDirty(true);},
   draftsRead:()=>{try{const value=JSON.parse(recordStorage.getItem(who.uid+':materialDrafts')||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}catch(_){return {};}},
   draftsWrite:next=>{const key=who.uid+':materialDrafts',text=JSON.stringify(next);if(recordStorage.getItem(key)===(Object.keys(next).length?text:null))return;if(Object.keys(next).length)recordStorage.setItem(key,text);else recordStorage.removeItem(key);cloudSetDirty(true);},
   flush:()=>flush(who,run),
   progress:async()=>(await records('/material-progress')).progress,
   record:async attempt=>(await records('/material-records',attempt)).record,
   history:cursor=>records('/material-records'+(cursor?'?cursor='+encodeURIComponent(cursor):'')),
   speed:options=>records('/material-speed?'+new URLSearchParams(options).toString()),
   marks:unitId=>records('/material-marks?unitId='+encodeURIComponent(unitId)),
   diary:cursor=>records('/material-diary'+(cursor?'?cursor='+encodeURIComponent(cursor):'')),
   diarySave:entry=>records('/material-diary',entry),
   rewards:()=>records('/material-rewards'),
   daily:async()=>{try{const value=await records('/material-daily');root.studyGoalMaterialUpdate?.(who.uid,value);return value;}catch(error){if(run===epoch&&cloudSame(who))root.studyGoalMaterialUpdate?.(who.uid,null);throw error;}},
   stats:month=>records('/material-stats'+(month?'?month='+encodeURIComponent(month):'')),
   review:options=>records('/material-review?view='+encodeURIComponent(options?.view||'due')+(options?.cursor?'&cursor='+encodeURIComponent(options.cursor):'')),
   aiStatus:()=>records('/material-ai-status'),
   explain:attemptId=>records('/material-explain',{attemptId}),
   judge:attemptId=>records('/material-judge',{attemptId}),
   similar:attemptId=>records('/material-similar',{attemptId}),
   generate:request=>records('/material-generate',request),
   generated:unitId=>records('/material-generated?unitId='+encodeURIComponent(unitId)),
   hint:request=>records('/material-hint',request),
   paused:async()=>(await records('/material-flags')).items
  });
  root.studyGoalMaterialUpdate?.(who.uid,null);
  kind='study';controller=root.NobiMaterialUI.mount(host,bank.units,bridge,bank.sources);
  if(pendingFocus&&controller.focus){controller.focus(pendingFocus);pendingFocus=null;}
  const speedHost=document.getElementById('study-speed');
  if(speedHost&&root.NobiMaterialSpeed)speedController=root.NobiMaterialSpeed.mount(speedHost,bridge,bank,{onSaved:refreshDaily});
  const diaryHost=document.getElementById('study-diary');
  if(diaryHost&&root.NobiMaterialDiary)diaryController=root.NobiMaterialDiary.mount(diaryHost,bridge,bank.units,()=>root.appSettings?.().studyDiary!==false);
 }catch(_){
  if(run!==epoch||!cloudSame(who))return;
  host.replaceChildren();const message=document.createElement('p');message.textContent='教材を読み込めませんでした。接続を確認して再試行してください。';
  const retry=document.createElement('button');retry.type='button';retry.className='btn btn-inactive';retry.textContent='再試行';retry.addEventListener('click',()=>void start());host.append(message,retry);
 }
}
async function refreshDaily(){
 const run=epoch,who=cloudIdentity();
 if(!who.uid||isTrial()||!serverBootReady||authLeaseBlocked)return;
 root.studyGoalMaterialUpdate?.(who.uid,null);
 if(document.getElementById('view-game')?.classList?.contains('active'))root.renderGame?.();
 try{
  const response=await cloudTry(cloudUrl('/material-daily'),{cache:'no-store'},15000);
  if(!response.ok||run!==epoch||!cloudSame(who)||authLeaseBlocked)return;
  const value=await response.json();if(run!==epoch||!cloudSame(who)||authLeaseBlocked)return;
  root.studyGoalMaterialUpdate?.(who.uid,value);
  if(document.getElementById('view-game')?.classList?.contains('active'))root.renderGame?.();
 }catch(_){}
}
function startCalendar(year,month,selected){
 const host=document.getElementById('cal-list');if(!host)return;
 if(!currentUserId||isTrial()||!serverBootReady||!root.NobiMaterialCalendar)return;
 if(!controller||kind!=='calendar'){
  stop();const run=epoch,who=cloudIdentity();kind='calendar';
  controller=root.NobiMaterialCalendar.mount({
   identity:()=>run===epoch&&cloudSame(who)&&!authLeaseBlocked?who.uid:null,
   async load(month){
    if(run!==epoch||!cloudSame(who)||authLeaseBlocked)throw Error('記録へ接続できません。');
    const response=await cloudTry(cloudUrl('/material-stats','month='+encodeURIComponent(month)),{cache:'no-store'},15000);
    if(!response.ok||run!==epoch||!cloudSame(who)||authLeaseBlocked)throw Error('記録を確認できませんでした。');
    const value=await response.json();if(run!==epoch||!cloudSame(who)||authLeaseBlocked)throw Error('ログインが変更されました。');return value;
   }
  });
 }
 controller.show(host,String(year)+'-'+String(month).padStart(2,'0'),selected.split('-').map((v,i)=>i?String(Number(v)).padStart(2,'0'):v).join('-'));
}
async function startStats(){
 const host=document.getElementById('material-statistics');if(!host)return;
 stop();const run=epoch,who=cloudIdentity();
 if(!who.uid||isTrial()||!serverBootReady||!root.NobiMaterialStats){host.textContent='ログインして保存済みの学習記録を確認できます。';return;}
 let bankPending=null,progressPending=null;
 const own=()=>run===epoch&&cloudSame(who)&&!authLeaseBlocked;
 function catalog(){
  if(!own())return Promise.reject(Error('identity changed'));
  if(!bankPending)bankPending=(async()=>{const response=await fetch('/material-bank.json',{cache:'no-store'});if(!response.ok)throw Error('bank unavailable');const bank=await response.json();if(!own()||!Array.isArray(bank.units))throw Error('bank unavailable');return bank;})().catch(error=>{bankPending=null;throw error;});
  return bankPending;
 }
 function progress(){
  if(!own())return Promise.reject(Error('identity changed'));
  if(!progressPending)progressPending=(async()=>{const response=await cloudTry(cloudUrl('/material-progress'),{cache:'no-store'},15000);if(!response.ok)throw Error('records unavailable');const value=await response.json();if(!own()||!value.progress||typeof value.progress!=='object'||Array.isArray(value.progress))throw Error('records unavailable');return value.progress;})().finally(()=>{progressPending=null;});
  return progressPending;
 }
 kind='stats';controller=root.NobiMaterialStats.mount(host,{
  identity:()=>run===epoch&&cloudSame(who)?who.uid:null,
  // 単元の達成度（台帳21・2026-10-08）：問題の一覧と、本人の記録（サーバー保存）の進み具合だけを使う
  async achievement(){
   const [bank,saved]=await Promise.all([catalog(),progress()]);if(!own())throw Error('identity changed');
   return bank.units.filter(u=>u&&u.status==='ready').map(u=>{const ids=new Set((Array.isArray(u.questions)?u.questions:[]).map(q=>q?.id).filter(id=>typeof id==='string'));return {id:u.id,subject:u.subject,grade:u.grade,title:u.title,kind:u.bank==='tokkun'?'特訓':u.mode==='drill'?'ドリル':'教科書',marks:u.schedule==='marks',total:ids.size,done:new Set((Array.isArray(saved[u.id]?.done)?saved[u.id].done:[]).filter(id=>ids.has(id))).size};});
  },
  async load(month){
   if(run!==epoch||!cloudSame(who)||authLeaseBlocked)throw Error('記録へ接続できません。');
   const response=await cloudTry(cloudUrl('/material-stats',month?'month='+encodeURIComponent(month):''),{cache:'no-store'},15000);
   if(!response.ok||run!==epoch||!cloudSame(who)||authLeaseBlocked)throw Error('記録を確認できませんでした。');
   const value=await response.json();if(run!==epoch||!cloudSame(who))throw Error('ログインが変更されました。');return value;
  }
 });
 const skillHost=document.getElementById('learning-skill-tree');
 if(skillHost&&root.NobiSkillTree){skillController=root.NobiSkillTree.mount(skillHost,{
  same:()=>run===epoch&&cloudSame(who)&&!authLeaseBlocked,
  async load(){
   const [bank,saved]=await Promise.all([catalog(),progress()]);if(!own())throw Error('identity changed');return {bank,progress:saved};
  },
  open(unitId){focus({unitId});root.switchView?.('study');}
 });}
 const speedHost=document.getElementById('material-speed-statistics');
 if(speedHost&&root.NobiMaterialSpeed){
  speedHost.textContent='問題ごとの速度比較を準備しています。';
  try{
   const bank=await catalog();
   if(run!==epoch||!cloudSame(who)||authLeaseBlocked)return;
   const bridge=root.NobiMaterialBridge.create({
    identity:()=>run===epoch&&cloudSame(who)?who.uid:null,ready:()=>serverBootReady&&!isTrial()&&!authLeaseBlocked,
    async speed(options){
     if(run!==epoch||!cloudSame(who)||authLeaseBlocked)throw Error('速度の記録へ接続できません。');
     const response=await cloudTry(cloudUrl('/material-speed',new URLSearchParams(options).toString()),{cache:'no-store'},15000);
     if(!response.ok||run!==epoch||!cloudSame(who)||authLeaseBlocked)throw Error('速度の記録を確認できませんでした。');return response.json();
    }
   });
   speedController=root.NobiMaterialSpeed.mount(speedHost,bridge,bank,{readOnly:true});
  }catch(_){if(run===epoch&&cloudSame(who))speedHost.textContent='問題ごとの速度比較を読み込めませんでした。マイページを開き直してください。';}
 }
}
// 教科書の「問題を解く」から呼ばれる：問題タブを開いたあと、その大単元を選ぶ（読み込み中なら終わってから）
let pendingFocus=null;
function focus(o){pendingFocus=o||null;if(controller&&kind==='study'&&controller.focus){controller.focus(pendingFocus);pendingFocus=null;}}
root.NobiMaterialEntry=Object.freeze({focus,start,stop,startStats,startCalendar,refreshDaily,refreshDiarySettings:()=>diaryController?.settingsChanged()});
})(globalThis);
