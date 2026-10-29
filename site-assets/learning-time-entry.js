(function(root){
'use strict';
let app=null,loading=null,pending=null,problem='';
const subjects=new Set(['数学','英語','国語','理科','社会']);
function context(){
 if(!currentUserId||isTrial())return null;
 const who=cloudIdentity();
 const planKey=()=>typeof planKnown==='undefined'||planKnown.uid!==who.uid?'unknown':planKnown.plan+':'+(planKnown.data?.revision||0);
 const captured=planKey();
 return {uid:who.uid,sameAuth:()=>cloudSame(who),same:()=>cloudSame(who)&&captured===planKey(),ready:()=>serverBootReady&&!authLeaseBlocked&&!isTrial()};
}
function activity(){
 if(!context()?.ready()||document.getElementById('login-overlay')?.classList.contains('on')||document.getElementById('game-modal')?.classList.contains('on'))return null;
 const active=id=>document.getElementById(id)?.classList.contains('active');
 const value=active('view-textbook')?root.NobiTextbook?.activity?.():active('view-study')?root.NobiMaterialEntry?.activity?.():null;
 return value&&subjects.has(value.subject)&&['textbook','question'].includes(value.kind)?value.id:null;
}
function status(){
 const host=pending?.host;if(!host?.isConnected||!pending.ctx.same())return;
 let section=host.querySelector('[data-learning-time-save-state]');
 if(!section){section=document.createElement('section');section.dataset.learningTimeSaveState='';section.className='material-calendar-detail';host.append(section);}
 section.replaceChildren();
 const text=document.createElement('p');text.setAttribute('role','status');text.textContent=loading?'学習時間の準備をしています。':problem;section.append(text);
 if(problem&&!loading){const button=document.createElement('button');button.type='button';button.className='btn btn-inactive';button.textContent='時間の保存を再試行';button.addEventListener('click',()=>void retry());section.append(button);}
}
async function request(ctx,path,body){
 if(!ctx.same()||!ctx.ready())throw Error('ログイン状態を確認してください。');
 const options=body===undefined?{cache:'no-store'}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)};
 const response=await cloudTry(cloudUrl(path),options,15000);
 if(!ctx.same()||!ctx.ready()||!response.ok)throw Error('学習時間を保存・確認できませんでした。');
 const result=await response.json();if(!ctx.same()||!ctx.ready())throw Error('ログインが変更されました。');return result;
}
async function init(){
 if(app)return app;if(loading)return loading;
 const ctx=context();if(!ctx?.ready())return null;
 loading=(async()=>{
  const [bankResponse,booksResponse]=await Promise.all([fetch('/material-bank.json',{cache:'no-store'}),fetch('/textbook-books.json',{cache:'no-store'})]);
  if(!bankResponse.ok||!booksResponse.ok)throw Error('教材の一覧を確認できません。');
  const [bank,books]=await Promise.all([bankResponse.json(),booksResponse.json()]);
  if(!ctx.same()||!ctx.ready())return null;
  if(!Array.isArray(bank.units)||!Array.isArray(bank.sources)||!Array.isArray(books.books)||!root.NobiMaterialEngine||!root.NobiLearningTimeApp||!root.NobiLearningTimeStorage||!root.NobiLearningTimeCalendar)throw Error('学習時間の準備を確認できません。');
  const catalog=[...bank.units.filter(u=>u.status==='ready'&&subjects.has(u.subject)&&root.NobiMaterialEngine.validateUnit(u,{sources:bank.sources}).length===0).map(u=>({id:'question:'+u.id,subject:u.subject,kind:'question'})),...books.books.filter(b=>b.status==='ready'&&subjects.has(b.subject)).map(b=>({id:'textbook:'+b.id,subject:b.subject,kind:'textbook'}))];
  if(!catalog.length||new Set(catalog.map(x=>x.id)).size!==catalog.length)throw Error('教材の一覧を確認できません。');
  app=root.NobiLearningTimeApp.create({context,request,catalog,activity,openStorage:root.NobiLearningTimeStorage.open,mountCalendar:root.NobiLearningTimeCalendar.mount,document,window:root,now:()=>Math.floor(performance.now()),newId:()=>crypto.randomUUID(),setInterval:root.setInterval.bind(root),clearInterval:root.clearInterval.bind(root),report:message=>{problem=message||'';status();}});
  problem='';return app;
 })().catch(()=>{problem='学習時間の準備を確認できませんでした。再試行できます。';status();return null;}).finally(()=>{loading=null;});
 return loading;
}
async function refresh(){
 if(pending&&!pending.ctx.same()){pending.host?.querySelector('[data-learning-time-save-state]')?.remove();const next=context();pending=pending.ctx.sameAuth()&&next?.ready()?{...pending,ctx:next}:null;problem='';}
 let controller=app||await init();
 // 別の本人の一覧取得を待っていた場合、新しい本人の準備を取りこぼさない。
 if(!controller&&!problem&&context()?.ready())controller=await init();
 if(controller)await controller.refresh();
 if(pending&&pending.ctx.same())controller?.show(pending.host,pending.month,pending.day);
 status();
}
async function retry(){
 const controller=app||await init();if(controller)await controller.retry();
 if(pending&&pending.ctx.same())controller?.show(pending.host,pending.month,pending.day);status();
}
function showCalendar(year,month,selected){
 const ctx=context(),host=document.getElementById('cal-list');if(!ctx?.ready()||!host)return;
 const value=String(year)+'-'+String(month).padStart(2,'0'),day=selected.split('-').map((v,i)=>i?String(Number(v)).padStart(2,'0'):v).join('-');
 pending={ctx,host,month:value,day};void refresh();status();
}
root.NobiLearningTimeEntry=Object.freeze({refresh,retry,showCalendar,activity});
})(globalThis);
