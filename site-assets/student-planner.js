(function(root){
'use strict';
const subjects=['数学','英語','国語','理科','社会'];
const plus=(day,n)=>new Date(Date.parse(day+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);
function adjust(tasks,today){const occupied=new Set(tasks.filter(t=>t.done||t.day>=today).map(t=>t.day));let cursor=today;return tasks.map(t=>{if(t.done||t.day>=today)return {...t};while(occupied.has(cursor))cursor=plus(cursor,1);const day=cursor;occupied.add(day);cursor=plus(cursor,1);return {...t,day};});}
function mount(host,api){
 let alive=true,busy=false,enabled=true,revision=0,tasks=[],today='',message='',dirty=false,ready=false;
 const live=()=>alive&&host.isConnected&&api.same();
 const el=(tag,text)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;return n;};
 const button=(text,fn)=>{const b=el('button',text);b.type='button';b.addEventListener('click',fn);b.disabled=busy||!enabled;return b;};
 async function load(){if(busy)return;busy=true;render();try{const d=await api.get();if(!live())return;revision=d.item.revision;tasks=d.item.tasks;today=new Date(d.serverTime+32400000).toISOString().slice(0,10);dirty=false;ready=true;message='サーバーの予定を読み込みました。';}catch(e){if(live())message=e.code==='plan_required'?'予定調整はStudent以上です。保存済みの予定は消していません。':'読み込めませんでした。画面の予定は残っています。';}finally{if(live()){busy=false;render();}}}
 async function save(){if(busy||!dirty||!ready||!enabled)return;busy=true;message='保存しています。';render();try{const d=await api.post({revision,tasks});if(!live())return;revision=d.item.revision;tasks=d.item.tasks;dirty=false;message='サーバーに保存しました。宿題や成績は変更していません。';}catch(e){if(live())message=e.code==='revision_conflict'?'別の画面で更新されています。今の入力を確認してから読み込みなおしてください。':e.code==='plan_required'?'予定調整はStudent以上です。入力は残しています。':'保存できませんでした。入力は残っています。同じ内容でもう一度保存できます。';}finally{if(live()){busy=false;render();}}}
 function render(){if(!live())return;host.replaceChildren();const box=el('section');box.className='plan-study';host.append(box);box.append(el('h2','Studentの学習ペース調整'),el('p','5教科の予定を一日ずつ組み、遅れた分を空いている日に移せます。学校の宿題・提出期限・成績は変えません。AIの回数も使いません。'));
  const status=el('p',message||(busy?'読み込んでいます。':''));status.setAttribute('role','status');box.append(status);
  if(ready){const overdue=tasks.filter(t=>!t.done&&t.day<today).length;box.append(el('p','未完了の遅れ '+overdue+'件 ／ 完了 '+tasks.filter(t=>t.done).length+'件。'+(dirty?'まだ保存していない変更があります。':'')));
   const add=button('7日分の予定を追加',()=>{if(tasks.length>28){message='予定枠は35件までです。既存の予定を調整できます。';render();return;}const used=new Set(tasks.map(t=>t.day));let day=today;for(let i=0;i<7;i++){while(used.has(day))day=plus(day,1);tasks.push({id:crypto.randomUUID(),day,subject:subjects[i%5],minutes:20,done:false});used.add(day);day=plus(day,1);}dirty=true;render();});box.append(add);
   const shift=button('遅れを空いている日に振り分ける',()=>{tasks=adjust(tasks,today);dirty=true;message='予定の変更案です。日付を確認して「変更を保存する」を押してください。';render();});shift.disabled=busy||!overdue||!enabled;box.append(shift);
   for(const t of tasks){const c=el('section');c.className='plan-study-question';c.append(el('h3',t.subject+(t.done?'・完了':t.day<today?'・予定日を過ぎています':'')));
    for(const [key,label,type] of [['day','予定日','date'],['minutes','学習する分数','number']]){const l=el('label',label),input=el('input');input.type=type;input.value=t[key];input.disabled=busy||!enabled;if(type==='number'){input.min=5;input.max=120;}input.addEventListener('change',()=>{const value=type==='number'?Number(input.value):input.value;if(type==='number'&&(!Number.isInteger(value)||value<5||value>120)||type==='date'&&!/^20\d{2}-\d{2}-\d{2}$/.test(value)){input.value=t[key];return;}t[key]=value;dirty=true;render();});l.append(input);c.append(l);}
    const l=el('label','教科'),sel=el('select');for(const s of subjects){const o=el('option',s);o.value=s;o.selected=s===t.subject;sel.append(o);}sel.disabled=busy||!enabled;sel.addEventListener('change',()=>{t.subject=sel.value;dirty=true;render();});l.append(sel);c.append(l,button(t.done?'未完了に戻す':'この予定を完了にする',()=>{t.done=!t.done;dirty=true;render();}));box.append(c);
   }
   const b=button('変更を保存する',()=>void save());b.disabled=busy||!dirty||!enabled;box.append(b);
  }
  box.append(button('読み込みなおす',()=>{if(dirty&&!root.confirm('保存していない予定の変更があります。サーバーの予定を読み込みなおしますか？'))return;void load();}));
 }
 render();void load();return {refresh(p){enabled=!!(p?.provisional&&p.features?.planning);if(!enabled)message='予定調整はStudent以上です。未保存の入力は残し、読み取り専用にしました。';render();if(!enabled)host.querySelectorAll('input,select').forEach(n=>{n.disabled=true;});},destroy(){alive=false;host.replaceChildren();}};
}
root.NobiStudentPlanner=Object.freeze({mount,adjust});
})(globalThis);
