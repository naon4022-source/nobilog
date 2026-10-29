(function(root){
'use strict';
const SUBJECTS=['数学','英語','国語','理科','社会'];
function duration(ms){
 if(!Number.isSafeInteger(ms)||ms<0)return '確認できません';
 if(!ms)return '0分';if(ms<1000)return '1秒未満';
 const s=Math.floor(ms/1000),h=Math.floor(s/3600),m=Math.floor(s%3600/60),rest=s%60;
 return (h?h+'時間':'')+(m?m+'分':'')+(rest?rest+'秒':'');
}
function mount({model,same}){
 if(!model||typeof model.load!=='function'||typeof model.state!=='function'||typeof same!=='function')throw Error('invalid time view');
 let alive=true,host=null,month='',day='',busy=false,rerun=false;
 const own=()=>alive&&same()===true;
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 function cleanMarks(){host?.querySelectorAll('.learning-time-mark').forEach(n=>n.remove());}
 function render(){
  if(!own()||!host?.isConnected)return;
  let section=host.querySelector('[data-learning-time-summary]');if(!section){section=el('section',undefined,'material-calendar-detail');section.dataset.learningTimeSummary='';host.append(section);}section.replaceChildren();cleanMarks();
  section.append(el('h3','のびログで取り組んだ時間'));
  const state=model.state(),snapshot=state.snapshot;
  const status=el('p',busy?'保存済みの学習時間を確認しています。':state.error||'');status.setAttribute('role','status');section.append(status);
  if(snapshot?.complete){
   const visible=Object.values(snapshot.days).some(Boolean);
   if(snapshot.window)section.append(el('p','今のプランで見られる履歴：'+snapshot.window.label+'。記録そのものは削除しません。'));
   section.append(el('p',visible?snapshot.month+(snapshot.window?' の表示期間内の合計：':' の合計：')+duration(snapshot.totalMs):'この月は、今のプランの履歴表示期間外です。'));
   if(snapshot.month!==month)section.append(el('p','前に確認できた月の表示です。今選んだ月の集計はまだ確認できていません。'));
   const list=el('dl');list.hidden=!visible;
   for(const subject of SUBJECTS){list.append(el('dt',subject),el('dd',duration(snapshot.totals[subject])));}section.append(list);
   if(snapshot.month===month){
    for(const cell of host.querySelectorAll('[data-material-day]')){const counts=snapshot.days[cell.dataset.materialDay];if(!counts)continue;const ms=Object.values(counts).reduce((a,b)=>a+b,0);if(ms>0){const mark=el('small',duration(ms),'learning-time-mark');mark.setAttribute('aria-label','学習時間 '+duration(ms));Object.assign(mark.style,{display:'block',maxWidth:'100%',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'});cell.append(mark);}}
    const selected=snapshot.days[day];if(selected){section.append(el('h4',day+' の記録'));const total=Object.values(selected).reduce((a,b)=>a+b,0);if(!total)section.append(el('p','保存された学習時間の記録はありません。'));else for(const subject of SUBJECTS)if(selected[subject]>0)section.append(el('p',subject+'：'+duration(selected[subject])));}
    if(Object.hasOwn(snapshot.days,day)&&!selected)section.append(el('p',day+' は履歴の表示期間外です。0分という意味ではありません。'));
    if(selected&&snapshot.window){const from=new Date(snapshot.window.from+9*3600000).toISOString();if(from.slice(0,10)===day)section.append(el('p','この日は日本時間 '+from.slice(11,16)+' 以降の記録を表示しています。'));}
   }
  }else if(!busy)section.append(el('p','学習時間はまだ確認できていません。0分としては表示していません。'));
  const retry=el('button','学習時間を更新');retry.type='button';retry.className='btn btn-inactive';retry.disabled=busy;retry.addEventListener('click',()=>void load());section.append(retry);
  section.append(el('small','教科書や問題で、画面を開いて操作していた区間を集計します。回答までの時間とは別の記録です。複数の記録が重なる時間は二重に数えません。'));
 }
 async function load(){
  if(!own()||!month)return;if(busy){rerun=true;return;}
  const wanted=month;busy=true;render();
  try{await model.load(wanted);}catch(_){}finally{busy=false;if(own()){render();if(rerun||wanted!==month){rerun=false;void load();}}}
 }
 return Object.freeze({
  show(nextHost,nextMonth,nextDay){
   if(!own()||!nextHost||!/^20\d{2}-(0[1-9]|1[0-2])$/.test(nextMonth)||typeof nextDay!=='string'||!nextDay.startsWith(nextMonth+'-'))return;
   const changed=month!==nextMonth;host=nextHost;month=nextMonth;day=nextDay;render();if(changed)void load();
  },
  destroy(){alive=false;cleanMarks();host?.querySelector('[data-learning-time-summary]')?.remove();host=null;model.dispose?.();}
 });
}
root.NobiLearningTimeCalendar=Object.freeze({mount,duration});
})(globalThis);
