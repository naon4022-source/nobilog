(function(root){
'use strict';
const colors=Object.freeze({'数学':'#2563eb','英語':'#7c3aed','国語':'#b45309','理科':'#15803d','社会':'#be185d'});
function mount(adapter){
 let alive=true,epoch=0,month='',day='',host=null,data=null,busy=false,message='';
 const identity=adapter.identity();
 const own=()=>alive&&!!identity&&identity===adapter.identity();
 const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 function valid(value,wanted){
  if(!value||value.month!==wanted||!Array.isArray(value.days))throw Error('invalid calendar records');
  const [y,m]=wanted.split('-').map(Number),last=new Date(Date.UTC(y,m,0)).getUTCDate();
  for(const r of value.days){
   if(!r||typeof r.day!=='string'||!new RegExp('^'+wanted+'-(0[1-9]|[12][0-9]|3[01])$').test(r.day)||Number(r.day.slice(-2))>last||typeof r.unitId!=='string'||typeof r.subject!=='string'||typeof r.title!=='string'||!['study','test'].includes(r.mode)||!['attempts','correct','elapsedMs'].every(k=>Number.isSafeInteger(r[k])&&r[k]>=0)||!r.attempts||r.correct>r.attempts)throw Error('invalid calendar record');
  }
 }
 function render(){
  if(!own()||!host)return;
  host.querySelectorAll('.material-calendar-marks').forEach(n=>n.remove());
  const detail=host.querySelector('#cal-learning-records');if(!detail)return;detail.replaceChildren();
  detail.append(el('h3','この日の新教材の学習記録'));
  const status=el('p',message);status.setAttribute('role','status');detail.append(status);
  if(!busy){const retry=el('button','学習記録を更新');retry.type='button';retry.className='btn btn-inactive';retry.addEventListener('click',()=>void load());detail.append(retry);}
  if(!data)return;
  const legend=el('div');legend.className='material-calendar-legend';
  for(const [subject,color] of Object.entries(colors)){const item=el('span',subject),dot=el('i');dot.style.backgroundColor=color;item.prepend(dot);legend.append(item);}detail.append(legend);
  for(const cell of host.querySelectorAll('[data-material-day]')){
   const rows=data.days.filter(r=>r.day===cell.dataset.materialDay);if(!rows.length)continue;
   const marks=el('span');marks.className='material-calendar-marks';marks.setAttribute('aria-label','学習した教科：'+[...new Set(rows.map(r=>r.subject))].join('、'));
   for(const subject of new Set(rows.map(r=>r.subject))){const dot=el('i');dot.style.backgroundColor=colors[subject]||'#475569';dot.title=subject;marks.append(dot);}cell.append(marks);
  }
  const rows=data.days.filter(r=>r.day===day);
  if(!rows.length)detail.append(el('p','この日の新教材の回答記録はありません。'));
  for(const r of rows){
   const card=el('article');card.style.borderLeftColor=colors[r.subject]||'#475569';
   card.append(el('strong',r.subject+' - '+r.title+'（'+(r.mode==='test'?'練習テスト':'問題')+'）'),el('p',r.attempts+'回答 ／ 正答 '+r.correct+'回答 ／ 解答時間の合計 '+(r.elapsedMs/60000).toFixed(1)+'分'));detail.append(card);
  }
  detail.append(el('small','保存済みの新教材の回答だけです。解き直しも1回答として数えます。時間は画面を開いてから回答までのおよその合計で、集中していた時間ではありません。'));
 }
 async function load(){
  if(!own())return;const run=++epoch,wanted=month;busy=true;data=null;message='学習記録を読み込んでいます。';render();
  try{const value=await adapter.load(wanted);valid(value,wanted);if(!own()||run!==epoch)return;data=value;message='';}
  catch(_){if(own()&&run===epoch)message='学習記録を読み込めませんでした。更新ボタンで再試行できます。';}
  finally{if(own()&&run===epoch){busy=false;render();}}
 }
 return Object.freeze({
  show(nextHost,nextMonth,nextDay){
   if(!own()||!/^\d{4}-(0[1-9]|1[0-2])$/.test(nextMonth)||!nextDay.startsWith(nextMonth+'-'))return;
   host=nextHost;day=nextDay;
   if(month!==nextMonth){month=nextMonth;void load();}else render();
  },
  destroy(){alive=false;epoch++;data=null;host=null;}
 });
}
root.NobiMaterialCalendar=Object.freeze({mount});
})(globalThis);
