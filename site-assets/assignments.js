// 📮 配布物の画面（台帳41・Claude・2026-10-07）
// ・生徒：配られたものの一覧 → 開いて1問ずつ答える（下書きは自動で保存）→ 提出 → なおの返却を見る
// ・なお（GET の答えに admin があるときだけ）：「配る」「提出箱」→ 1問ずつコメント → 下書き保存／返却する
// ・使い方：NobiAssignments.mount(入れ物, {uid:()=>文字, get:()=>Promise<json>, post:(body)=>Promise<json>})
// ・データの文字は textContent でしか入れない（innerHTML は使わない）。時刻はサーバーの時計で数える。
(function(root){'use strict';
const NAMES={u1:'なお',u2:'りらん'};
const MAX={title:60,note:1000,prompt:1000,model:1000,questions:50,answer:4000,answersTotal:20000,comment:1000,overall:2000,minutes:300,points:100};
const ERR={admin_only:'この操作は なお だけができます。',closed:'締め切りを過ぎたので、もう出せません。',already_submitted:'もう提出ずみです。',not_started:'先に「始める」を押してください。',
 rate_limited:'保存が多すぎます。少し待ってから、もう一度入力してください。',not_found:'見つかりませんでした。画面を開き直してください。',not_submitted:'まだ提出されていません。',
 already_returned:'もう返却ずみです。',conflict:'ほかの画面と同時に保存されました。開き直してください。',open_in_past:'配る日時は、今より前は選べません。',
 due_before_open:'締め切りは、配る日時より1分以上あとにしてください。',too_far:'1年より先の日時は選べません。',invalid_title:'題名は1〜60文字で入れてください。',
 invalid_targets:'配る相手を選んでください。',invalid_minutes:'時間制限は1〜300分にしてください。',invalid_prompt:'問題文は1〜1000文字で入れてください。',
 invalid_points:'点数は0〜100の整数にしてください。',too_long:'文字が多すぎます。',too_many:'配布物がいっぱいです。',invalid_score:'点数は0から満点までの整数にしてください。',
 invalid_answers:'答えの形が正しくありません。',invalid_comments:'コメントは1問1000文字までです。',invalid_overall:'全体へのコメントは2000文字までです。',
 unauthorized:'ログインし直してください。',network:'つながりませんでした。接続を確認してください。',origin_rejected:'この画面からは送れません。',family_only:'このアカウントでは使えません。'};
const S={host:null,api:null,uid:'',gen:0,data:null,skew:0,loadError:false,tab:'mine',view:{name:'list'},msg:null,tick:null,
 save:{timer:null,dirty:false,seq:0,state:'',kind:''},answers:{},openId:'',busy:false,form:null,review:null};
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=String(text);return e;}
function btn(label,cls,fn,aria){const b=el('button',cls,label);b.type='button';if(aria)b.setAttribute('aria-label',aria);b.addEventListener('click',fn);return b;}
let uniq=0;const nid=p=>'as-'+p+'-'+(++uniq);
function field(labelText,control,help){const w=el('div','as-field');const id=control.id||(control.id=nid('f'));const l=el('label','as-label',labelText);l.htmlFor=id;w.append(l,control);if(help)w.append(el('p','as-help',help));return w;}
const nowS=()=>Date.now()+S.skew;
const JST=new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',month:'numeric',day:'numeric',weekday:'short',hour:'2-digit',minute:'2-digit',hour12:false});
const HM=new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',hour:'2-digit',minute:'2-digit',hour12:false});
const when=ms=>JST.format(new Date(ms));
function leftText(until){
 const d=until-nowS();if(d<=0)return '締め切りを過ぎました';
 const m=Math.floor(d/60000),h=Math.floor(m/60),days=Math.floor(h/24);
 if(days>=1)return 'のこり '+days+'日'+(h%24)+'時間';
 if(h>=1)return 'のこり '+h+'時間'+(m%60)+'分';
 if(m>=10)return 'のこり '+m+'分';
 return 'のこり '+m+'分'+Math.floor(d/1000)%60+'秒';
}
// datetime-local（日本時間として読む）⇔ ミリ秒
const toLocal=ms=>new Date(ms+9*3600000).toISOString().slice(0,16);
function fromLocal(s){const m=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(String(s||''));return m?Date.UTC(+m[1],+m[2]-1,+m[3],+m[4]-9,+m[5]):NaN;}
const errText=res=>ERR[res&&res.error]||'うまくいきませんでした。もう一度ためしてください。';
const isAdmin=()=>!!(S.data&&S.data.admin);
async function send(body){
 const g=S.gen;let res;
 try{res=await S.api.post(body);}catch(_){res={error:'network'};}
 if(g!==S.gen)return null;// アカウントが変わった：古い結果は使わない
 return res||{error:'network'};
}
function setMsg(text,kind){S.msg=text?{text,kind:kind||'ok'}:null;}
function stopTimers(){if(S.tick){clearInterval(S.tick);S.tick=null;}if(S.save.timer){clearTimeout(S.save.timer);S.save.timer=null;}}
function startTick(){if(S.tick)return;S.tick=setInterval(onTick,1000);}
function onTick(){
 if(!S.host||!S.host.isConnected){stopTimers();return;}
 for(const e of S.host.querySelectorAll('[data-until]')){const u=Number(e.dataset.until);e.textContent=leftText(u);e.classList.toggle('as-soon',u-nowS()<=5*60000);}
 const it=currentItem();
 if(S.view.name==='open'&&it&&editable(it)&&nowS()>it.deadline){it.closed=true;setMsg('締め切りになりました。もう提出できません。','ng');render();}
}
// ---- 読み込み ----
async function load(){
 const g=S.gen;
 try{const d=await S.api.get();if(g!==S.gen)return;if(!d||!Array.isArray(d.items))throw new Error('shape');S.data=d;S.loadError=false;S.skew=(Number.isFinite(d.now)?d.now:Date.now())-Date.now();}
 catch(_){if(g!==S.gen)return;S.loadError=true;}
 render();
}
function mount(host,api){
 stopTimers();S.gen++;
 Object.assign(S,{host,api,uid:String(api&&api.uid&&api.uid()||''),data:null,loadError:false,tab:'mine',view:{name:'list'},msg:null,answers:{},openId:'',busy:false,form:null,review:null});
 S.save={timer:null,dirty:false,seq:0,state:'',kind:''};
 host.classList.add('as-root');render();load();startTick();
 return {refresh:load};
}
// ---- 画面全体 ----
function render(){
 const h=S.host;if(!h)return;
 const keep=document.activeElement&&h.contains(document.activeElement)?document.activeElement.id:'';
 h.replaceChildren();
 const head=el('div','as-head');head.append(el('h3','as-title','📮 配布物'));h.append(head);
 if(isAdmin()){
  const tabs=el('div','as-tabs');tabs.setAttribute('role','tablist');
  for(const [id,label] of [['mine','わたしの配布物'],['new','配る'],['box','提出箱']]){
   const t=btn(label,'as-tab'+(S.tab===id?' on':''),()=>{leaveOpen();S.tab=id;S.view={name:'list'};setMsg('');render();});
   t.setAttribute('role','tab');t.setAttribute('aria-selected',S.tab===id?'true':'false');tabs.append(t);}
  h.append(tabs);
 }
 if(S.msg){const m=el('p','as-msg as-'+S.msg.kind,S.msg.text);m.setAttribute('role',S.msg.kind==='ng'?'alert':'status');h.append(m);}
 const body=el('div','as-body');h.append(body);
 if(!S.data){body.append(el('p','as-empty',S.loadError?'読みこめませんでした。接続を確認してください。':'読みこみ中です…'));if(S.loadError)body.append(btn('もう一度読みこむ','as-btn',()=>{S.loadError=false;render();load();}));return;}
 if(S.tab==='new'&&isAdmin())renderNew(body);
 else if(S.tab==='box'&&isAdmin())S.view.name==='sub'?renderSub(body):renderBox(body);
 else S.view.name==='open'&&currentItem()?renderOpen(body,currentItem()):renderList(body);
 onTick();
 if(keep){const k=document.getElementById(keep);if(k)k.focus();}
}
// ---- 生徒：一覧 ----
const editable=it=>it.status==='未提出'&&!it.closed&&!it.needsStart;
function chip(text,kind){return el('span','as-chip as-chip-'+kind,text);}
function statusChips(it){
 const w=el('div','as-chips');
 w.append(chip(it.status,it.status==='返却済み'?'done':it.status==='提出済み'?'sent':'todo'));
 if(it.closed&&it.status==='未提出')w.append(chip('期限切れ','late'));
 if(it.minutes)w.append(chip('⏱ '+it.minutes+'分','time'));
 return w;
}
function renderList(box){
 const items=S.data.items;
 if(!items.length){box.append(el('p','as-empty','いま配られているものはありません。'));return;}
 const grid=el('div','as-grid');
 for(const it of items){
  const c=el('article','as-card');c.append(el('h4','as-card-title',it.title),statusChips(it));
  c.append(el('p','as-meta','締め切り：'+when(it.deadline)));
  if(it.status==='未提出'&&!it.closed){const l=el('p','as-left');l.dataset.until=String(it.deadline);c.append(l);}
  if(it.status==='提出済み')c.append(el('p','as-meta','提出：'+when(it.submission.at)));
  if(it.status==='返却済み')c.append(el('p','as-meta','返却：'+when(it.review.returnedAt)));
  c.append(btn(it.status==='返却済み'?'返却を見る':it.status==='提出済み'||it.closed?'見る':'開く','as-btn as-main',()=>openItem(it.id),it.title+'を開く'));
  grid.append(c);
 }
 box.append(grid);
}
function currentItem(){return S.data&&S.view.name==='open'?S.data.items.find(x=>x.id===S.view.id)||null:null;}
function openItem(id){
 const it=S.data.items.find(x=>x.id===id);if(!it)return;
 S.view={name:'open',id};setMsg('');
 if(S.openId!==id){S.openId=id;S.answers=Object.assign({},it.draft&&it.draft.answers||{});S.save={timer:null,dirty:false,seq:0,state:it.draft?'下書きがあります（'+HM.format(new Date(it.draft.at))+'）':'',kind:''};}
 render();
}
function leaveOpen(){if(S.save.dirty&&S.save.timer){clearTimeout(S.save.timer);S.save.timer=null;saveDraft();}}
// ---- 生徒：開いた画面 ----
function renderOpen(box,it){
 box.append(btn('← 一覧へもどる','as-btn as-back',()=>{leaveOpen();S.view={name:'list'};setMsg('');load();}));
 const card=el('article','as-open');box.append(card);
 card.append(el('h4','as-open-title',it.title),statusChips(it));
 if(it.note)card.append(el('p','as-note',it.note));
 const meta=el('p','as-meta','締め切り：'+when(it.deadline)+'　満点：'+it.totalPoints+'点'+(it.minutes?'　時間制限：'+it.minutes+'分':''));card.append(meta);
 if(it.needsStart){
  if(it.closed){card.append(el('p','as-warn','締め切りを過ぎたので、始められません。'));return;}
  card.append(el('p','as-help','この配布物は時間制限が '+it.minutes+'分 です（全'+it.questionCount+'問）。「始める」を押すと時計が動き、とちゅうで止められません。'));
  const l=el('p','as-left');l.dataset.until=String(it.deadline);card.append(l);
  card.append(btn('始める','as-btn as-main',async e=>{
   if(S.busy||!root.confirm('「'+it.title+'」を始めます。'+it.minutes+'分たつと提出できなくなります。始めますか？'))return;
   S.busy=true;e.target.disabled=true;const res=await send({action:'start',id:it.id});S.busy=false;if(!res)return;
   if(res.ok){setMsg('始めました。時間に気をつけてね。','ok');await load();}else{setMsg(errText(res),'ng');render();}
  }));
  return;
 }
 const canEdit=editable(it);
 if(canEdit){
  const l=el('p','as-left as-big');l.dataset.until=String(it.deadline);card.append(l);
  const st=el('p','as-save'+(S.save.kind?' as-'+S.save.kind:''),S.save.state);st.id='as-save-state';st.setAttribute('role','status');st.setAttribute('aria-live','polite');card.append(st);
 }
 const answers=canEdit?S.answers:(it.submission?it.submission.answers:it.draft?it.draft.answers:{});
 it.questions.forEach((q,i)=>{
  const sec=el('section','as-q');
  const qh=el('div','as-qhead');qh.append(el('span','as-qnum','問'+(i+1)),el('span','as-points',q.points+'点'));sec.append(qh);
  sec.append(el('p','as-prompt',q.prompt));
  if(canEdit){
   const ta=el('textarea','as-text');ta.id='as-ans-'+it.id+'-'+q.id;ta.maxLength=MAX.answer;ta.rows=4;ta.value=answers[q.id]||'';
   const cnt=el('p','as-count',(ta.value.length)+' / '+MAX.answer);
   ta.addEventListener('input',()=>{S.answers[q.id]=ta.value;cnt.textContent=ta.value.length+' / '+MAX.answer;scheduleSave(it);});
   sec.append(field('問'+(i+1)+'の答え',ta),cnt);
  }else{
   const a=el('div','as-answer');a.append(el('p','as-label','わたしの答え'),el('p','as-pre',answers[q.id]||'（空らん）'));sec.append(a);
   if(it.review){const c=el('div','as-comment');c.append(el('p','as-label','なおのコメント'),el('p','as-pre',it.review.comments[q.id]||'コメントはありません。'));sec.append(c);}
  }
  card.append(sec);
 });
 if(it.review){
  const r=el('section','as-review');
  if(it.review.score!==null&&it.review.score!==undefined)r.append(el('p','as-score','点数 '+it.review.score+' / '+it.totalPoints));
  r.append(el('p','as-label','なおから全体へのコメント'),el('p','as-pre',it.review.overall||'コメントはありません。'));
  r.append(el('p','as-meta','返却：'+when(it.review.returnedAt)));card.append(r);
 }else if(it.status==='提出済み')card.append(el('p','as-ok-note','提出しました（'+when(it.submission.at)+'）。なおの返却を待っています。'));
 else if(it.closed)card.append(el('p','as-warn','締め切りを過ぎたので提出できません。下書きは残っています。'));
 if(canEdit)card.append(btn('提出する','as-btn as-main as-submit',e=>submit(it,e.target)));
}
function cleanAnswers(it){const out={};for(const q of it.questions){const v=S.answers[q.id];if(typeof v==='string'&&v.trim())out[q.id]=v;}return out;}
function setSave(text,kind){S.save.state=text;S.save.kind=kind||'';const e=S.host&&S.host.querySelector('#as-save-state');if(e){e.textContent=text;e.className='as-save'+(kind?' as-'+kind:'');}}
function scheduleSave(it){
 S.save.dirty=true;S.save.item=it;if(S.save.timer)clearTimeout(S.save.timer);
 setSave('入力中…（少ししたら自動で保存します）','');
 S.save.timer=setTimeout(()=>{S.save.timer=null;saveDraft();},1200);
}
async function saveDraft(){
 const it=S.save.item;if(!it||!S.save.dirty)return;
 const total=Object.values(cleanAnswers(it)).reduce((s,v)=>s+v.length,0);
 if(total>MAX.answersTotal){setSave('保存できませんでした：答えの合計が'+MAX.answersTotal+'文字をこえています。','ng');return;}
 S.save.dirty=false;const seq=++S.save.seq;setSave('保存中…','');
 const res=await send({action:'draft',id:it.id,answers:cleanAnswers(it)});
 if(!res)return;
 if(res.ok){if(seq===S.save.seq&&!S.save.dirty)setSave('保存しました（'+HM.format(new Date(res.savedAt))+'）','ok');}
 else{S.save.dirty=true;setSave('保存できませんでした：'+errText(res),'ng');if(res.error==='closed'||res.error==='already_submitted')load();}
}
async function submit(it,button){
 if(S.busy)return;
 if(S.save.timer){clearTimeout(S.save.timer);S.save.timer=null;}
 const answers=cleanAnswers(it),blank=it.questions.filter(q=>!answers[q.id]).length;
 const total=Object.values(answers).reduce((s,v)=>s+v.length,0);
 if(total>MAX.answersTotal){setMsg('答えの合計が'+MAX.answersTotal+'文字をこえています。短くしてください。','ng');render();return;}
 if(!root.confirm('「'+it.title+'」を提出します。提出すると、あとから直せません。'+(blank?'\n空らんが '+blank+'問 あります。':'')+'\n提出しますか？')){if(S.save.dirty)scheduleSave(it);return;}
 S.busy=true;button.disabled=true;
 const res=await send({action:'submit',id:it.id,answers});S.busy=false;if(!res)return;
 if(res.ok){S.save.dirty=false;setMsg('提出しました。なおの返却を待とう。','ok');await load();}
 else{button.disabled=false;setMsg('提出できませんでした：'+errText(res),'ng');if(res.error==='closed'||res.error==='already_submitted')await load();else render();}
}
// ---- なお：配る ----
function blankForm(){return {title:'',note:'',targets:{u1:false,u2:true},now:true,openAt:'',dueAt:'',minutes:'',questions:[{prompt:'',points:'10',answer:''}]};}
function renderNew(box){
 const f=S.form||(S.form=blankForm());
 const form=el('form','as-form');form.noValidate=true;form.addEventListener('submit',e=>{e.preventDefault();createAssignment(form);});box.append(form);
 const input=(type,key,attrs={})=>{const i=el(type==='textarea'?'textarea':'input',type==='textarea'?'as-text':'as-input');if(type!=='textarea')i.type=type;i.id='as-new-'+key;Object.assign(i,attrs);i.value=f[key];i.addEventListener('input',()=>{f[key]=i.value;});return i;};
 form.append(field('題名（60文字まで）',input('text','title',{maxLength:MAX.title,required:true})));
 form.append(field('説明（なくてもよい・1000文字まで）',input('textarea','note',{maxLength:MAX.note,rows:2})));
 const who=el('fieldset','as-fieldset');who.append(el('legend','as-label','配る相手'));
 for(const t of ['u2','u1']){const lab=el('label','as-check');const c=el('input');c.type='checkbox';c.id='as-new-target-'+t;c.checked=!!f.targets[t];c.addEventListener('change',()=>{f.targets[t]=c.checked;});lab.append(c,document.createTextNode(' '+NAMES[t]+(t==='u1'?'（自分でためす）':'')));who.append(lab);}
 form.append(who);
 const when1=el('fieldset','as-fieldset');when1.append(el('legend','as-label','配る日時と締め切り（日本時間）'));
 const nowLab=el('label','as-check');const nowBox=el('input');nowBox.type='checkbox';nowBox.id='as-new-now';nowBox.checked=f.now;nowLab.append(nowBox,document.createTextNode(' 今すぐ配る'));when1.append(nowLab);
 const minLocal=toLocal(nowS());
 const open=input('datetime-local','openAt',{min:minLocal});open.disabled=f.now;
 nowBox.addEventListener('change',()=>{f.now=nowBox.checked;open.disabled=f.now;});
 when1.append(field('配る日時',open,'配る日時は、今より前は選べません。今すぐ配るときは「今すぐ配る」にチェックを入れてください。'));
 when1.append(field('締め切り',input('datetime-local','dueAt',{min:minLocal,required:true})));
 when1.append(field('時間制限（分・なしなら空らん）',input('number','minutes',{min:1,max:MAX.minutes,step:1,inputMode:'numeric'}),'時間制限をつけると、生徒が「始める」を押してから数えます。'));
 form.append(when1);
 const qs=el('div','as-qlist');
 f.questions.forEach((q,i)=>{
  const sec=el('section','as-q as-qedit');
  const qh=el('div','as-qhead');qh.append(el('span','as-qnum','問'+(i+1)));
  if(f.questions.length>1)qh.append(btn('この問題を消す','as-btn as-small',()=>{f.questions.splice(i,1);render();},'問'+(i+1)+'を消す'));
  sec.append(qh);
  const p=el('textarea','as-text');p.id='as-new-q'+i+'-prompt';p.maxLength=MAX.prompt;p.rows=3;p.value=q.prompt;p.addEventListener('input',()=>{q.prompt=p.value;});
  sec.append(field('問'+(i+1)+'の問題文',p));
  const pt=el('input','as-input as-num');pt.type='number';pt.id='as-new-q'+i+'-points';pt.min=0;pt.max=MAX.points;pt.step=1;pt.inputMode='numeric';pt.value=q.points;pt.addEventListener('input',()=>{q.points=pt.value;});
  sec.append(field('問'+(i+1)+'の点数',pt));
  const a=el('textarea','as-text');a.id='as-new-q'+i+'-answer';a.maxLength=MAX.model;a.rows=2;a.value=q.answer;a.addEventListener('input',()=>{q.answer=a.value;});
  sec.append(field('問'+(i+1)+'の見本の答え（なくてもよい）',a,'見本の答えは、生徒には見えません。'));
  qs.append(sec);
 });
 form.append(qs);
 const row=el('div','as-row');
 const add=btn('＋ 問題を足す','as-btn',()=>{if(f.questions.length>=MAX.questions){setMsg('問題は'+MAX.questions+'問までです。','ng');render();return;}f.questions.push({prompt:'',points:'10',answer:''});render();const last=document.getElementById('as-new-q'+(f.questions.length-1)+'-prompt');if(last)last.focus();});
 add.disabled=f.questions.length>=MAX.questions;
 const go=el('button','as-btn as-main','配る');go.type='submit';
 row.append(add,go);form.append(row);
}
function formPayload(){
 const f=S.form,errs=[],now=nowS();
 const title=f.title.trim();if(!title||title.length>MAX.title||/\n/.test(title))errs.push(ERR.invalid_title);
 const targets=['u1','u2'].filter(t=>f.targets[t]);if(!targets.length)errs.push(ERR.invalid_targets);
 let openAt=f.now?now:fromLocal(f.openAt);const dueAt=fromLocal(f.dueAt);
 if(!f.now&&!Number.isFinite(openAt))errs.push('配る日時を入れてください。');
 else if(!f.now&&openAt<now-60000)errs.push(ERR.open_in_past);
 if(!Number.isFinite(dueAt))errs.push('締め切りを入れてください。');
 else if(Number.isFinite(openAt)&&dueAt<Math.max(openAt,now)+60000)errs.push(ERR.due_before_open);
 let minutes=null;if(String(f.minutes).trim()!==''){minutes=Number(f.minutes);if(!Number.isInteger(minutes)||minutes<1||minutes>MAX.minutes)errs.push(ERR.invalid_minutes);}
 const questions=f.questions.map((q,i)=>{const prompt=q.prompt.trim(),points=Number(q.points),answer=q.answer.trim();
  if(!prompt)errs.push('問'+(i+1)+'：問題文を入れてください。');
  if(String(q.points).trim()===''||!Number.isInteger(points)||points<0||points>MAX.points)errs.push('問'+(i+1)+'：'+ERR.invalid_points);
  return {prompt,points,answer:answer||null};});
 if(!f.now&&Number.isFinite(openAt)&&openAt<now)openAt=now;
 return {errs,assignment:{title,note:f.note.trim(),targets,openAt,dueAt,minutes,questions}};
}
async function createAssignment(form){
 if(S.busy)return;
 const {errs,assignment}=formPayload();
 if(errs.length){setMsg(errs.join('\n'),'ng');render();return;}
 const names=assignment.targets.map(t=>NAMES[t]).join('・');
 if(!root.confirm('「'+assignment.title+'」を '+names+' に配ります（全'+assignment.questions.length+'問・締め切り '+when(assignment.dueAt)+'）。\n配ったあとは直せません。よろしいですか？'))return;
 S.busy=true;const b=form.querySelector('button[type="submit"]');if(b)b.disabled=true;
 const res=await send({action:'create',assignment});S.busy=false;if(!res)return;
 if(res.ok){S.form=null;S.tab='box';S.view={name:'list'};setMsg('配りました。','ok');await load();}
 else{if(b)b.disabled=false;setMsg('配れませんでした：'+errText(res),'ng');render();}
}
// ---- なお：提出箱 ----
function renderBox(box){
 const list=S.data.admin.assignments;
 if(!list.length){box.append(el('p','as-empty','まだ何も配っていません。「配る」から作れます。'));return;}
 const grid=el('div','as-grid');
 for(const a of list){
  const c=el('article','as-card');c.append(el('h4','as-card-title',a.title));
  const chips=el('div','as-chips');if(a.openAt>nowS())chips.append(chip('配る前','time'));if(a.minutes)chips.append(chip('⏱ '+a.minutes+'分','time'));c.append(chips);
  c.append(el('p','as-meta',(a.openAt>nowS()?'配る日時：':'配った日時：')+when(a.openAt)),el('p','as-meta','締め切り：'+when(a.dueAt)+'　全'+a.questions.length+'問・満点'+a.totalPoints+'点'));
  const subs=S.data.admin.submissions[a.id]||{};
  for(const t of a.targets){
   const w=subs[t]||{status:'未提出'};const line=el('div','as-who');
   line.append(el('span','as-who-name',NAMES[t]+'：'),chip(w.status,w.status==='返却済み'?'done':w.status==='提出済み'?'sent':'todo'));
   if(w.review&&!w.review.returnedAt)line.append(chip('コメント下書きあり','time'));
   if(w.submission){line.append(el('span','as-meta','提出 '+when(w.submission.at)));line.append(btn(NAMES[t]+'の答えを見る','as-btn as-small',()=>openSub(a.id,t),a.title+'：'+NAMES[t]+'の答えを見る'));}
   c.append(line);
  }
  grid.append(c);
 }
 box.append(grid);
}
function openSub(id,uid){
 S.view={name:'sub',id,uid};setMsg('');
 openSubState(S.data.admin.submissions[id][uid],id,uid);
 render();
}
function renderSub(box){
 const {id,uid}=S.view,a=S.data.admin.assignments.find(x=>x.id===id),w=a&&S.data.admin.submissions[id]&&S.data.admin.submissions[id][uid];
 box.append(btn('← 提出箱へもどる','as-btn as-back',()=>{S.view={name:'list'};setMsg('');render();}));
 if(!a||!w||!w.submission){box.append(el('p','as-empty','提出が見つかりませんでした。'));return;}
 if(!S.review||S.review.key!==id+':'+uid)openSubState(w,id,uid);
 const rv=S.review,returned=!!(w.review&&w.review.returnedAt);
 const card=el('article','as-open');box.append(card);
 card.append(el('h4','as-open-title',a.title+'（'+NAMES[uid]+'）'));
 card.append(el('p','as-meta','提出：'+when(w.submission.at)+'　満点：'+a.totalPoints+'点'+(returned?'　返却：'+when(w.review.returnedAt):'')));
 a.questions.forEach((q,i)=>{
  const sec=el('section','as-q');
  const qh=el('div','as-qhead');qh.append(el('span','as-qnum','問'+(i+1)),el('span','as-points',q.points+'点'));sec.append(qh);
  sec.append(el('p','as-prompt',q.prompt));
  if(q.answer){const m=el('div','as-model');m.append(el('p','as-label','見本の答え'),el('p','as-pre',q.answer));sec.append(m);}
  const s=el('div','as-answer');s.append(el('p','as-label',NAMES[uid]+'の答え'),el('p','as-pre',w.submission.answers[q.id]||'（空らん）'));sec.append(s);
  if(returned){const c=el('div','as-comment');c.append(el('p','as-label','コメント'),el('p','as-pre',rv.comments[q.id]||'コメントなし'));sec.append(c);}
  else{const ta=el('textarea','as-text');ta.id='as-cm-'+q.id;ta.maxLength=MAX.comment;ta.rows=2;ta.value=rv.comments[q.id]||'';ta.addEventListener('input',()=>{rv.comments[q.id]=ta.value;});sec.append(field('問'+(i+1)+'へのコメント',ta));}
  card.append(sec);
 });
 const r=el('section','as-review');
 if(returned){
  if(w.review.score!==null)r.append(el('p','as-score','点数 '+w.review.score+' / '+a.totalPoints));
  r.append(el('p','as-label','全体へのコメント'),el('p','as-pre',w.review.overall||'コメントなし'));
  r.append(el('p','as-ok-note','返却ずみです。返却したあとは直せません。'));
 }else{
  const ov=el('textarea','as-text');ov.id='as-cm-overall';ov.maxLength=MAX.overall;ov.rows=3;ov.value=rv.overall;ov.addEventListener('input',()=>{rv.overall=ov.value;});
  r.append(field('全体へのコメント',ov));
  const sc=el('input','as-input as-num');sc.type='number';sc.id='as-cm-score';sc.min=0;sc.max=a.totalPoints;sc.step=1;sc.inputMode='numeric';sc.value=rv.score;sc.addEventListener('input',()=>{rv.score=sc.value;});
  r.append(field('点数（0〜'+a.totalPoints+'・つけないなら空らん）',sc));
  const row=el('div','as-row');
  row.append(btn('下書き保存','as-btn',e=>sendReview(a,uid,false,e.target)),btn('返却する','as-btn as-main',e=>sendReview(a,uid,true,e.target)));
  r.append(row,el('p','as-help','下書き保存では、'+NAMES[uid]+'にはまだ見えません。「返却する」を押すと見えるようになり、そのあとは直せません。'));
 }
 card.append(r);
}
function openSubState(w,id,uid){const r=w.review||{comments:{},overall:'',score:null};S.review={key:id+':'+uid,comments:Object.assign({},r.comments),overall:r.overall||'',score:r.score===null||r.score===undefined?'':String(r.score)};}
async function sendReview(a,uid,final,button){
 if(S.busy)return;const rv=S.review;
 const comments={};for(const q of a.questions){const v=(rv.comments[q.id]||'').trim();if(v)comments[q.id]=v;}
 let score=null;if(String(rv.score).trim()!==''){score=Number(rv.score);if(!Number.isInteger(score)||score<0||score>a.totalPoints){setMsg(ERR.invalid_score,'ng');render();return;}}
 if(final&&!root.confirm('「'+a.title+'」を '+NAMES[uid]+' に返却します。返却すると、コメントは直せません。よろしいですか？'))return;
 S.busy=true;button.disabled=true;
 const body={action:'return',id:a.id,uid,comments,overall:rv.overall.trim(),score};if(final)body.final=true;
 const res=await send(body);S.busy=false;if(!res)return;
 if(res.ok){setMsg(final?'返却しました。':'下書きを保存しました（'+NAMES[uid]+'にはまだ見えません）。','ok');await load();}
 else{button.disabled=false;setMsg((final?'返却できませんでした：':'保存できませんでした：')+errText(res),'ng');render();}
}
root.NobiAssignments={mount};
})(typeof window!=='undefined'?window:globalThis);
