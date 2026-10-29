// 🌳 管理画面 v1（Claude・2026-10-09）：なお（u1）のプロフィールからだけ開く。権限はサーバーで毎回確かめる。
// 見せるのは集計と活動の種類・時刻だけ（答えの文章・パスコードは出さない）。読むだけで、記録は変えない。
(function(root){
'use strict';
const NAMES={u1:'なお',u2:'りらん',p_free:'f1 · Free',p_mini:'m1 · Mini',p_standard:'s1 · Standard',p_pro:'p1 · Pro',p_unlimit:'u1 · UNLIMIT'};
const TYPE={open:'アプリを開いた',hint:'ヒントを開いた','admin-flag':'問題の「出さない」を変えた','assignment-create':'配布物を作った','assignment-start':'配布物を始めた','assignment-draft':'配布物を途中保存','assignment-submit':'配布物を提出した','assignment-return':'配布物を返却した'};
function el(tag,text,cls){const n=document.createElement(tag);if(text!==undefined&&text!==null)n.textContent=String(text);if(cls)n.className=cls;return n;}
function btn(text,fn,pressed){const b=el('button',text,'adm-btn');b.type='button';if(pressed!==undefined)b.setAttribute('aria-pressed',pressed?'true':'false');b.addEventListener('click',fn);return b;}
const when2=t=>{const d=new Date(t+9*3600000);return d.getUTCFullYear()+'/'+(d.getUTCMonth()+1)+'/'+d.getUTCDate()+' '+String(d.getUTCHours()).padStart(2,'0')+':'+String(d.getUTCMinutes()).padStart(2,'0');};
const pct=(c,a)=>a?Math.round(c/a*100):null;
const when=(t,now)=>{if(!t)return 'まだ記録がありません';const d=new Date(t+9*3600000),s=(d.getUTCMonth()+1)+'/'+d.getUTCDate()+' '+String(d.getUTCHours()).padStart(2,'0')+':'+String(d.getUTCMinutes()).padStart(2,'0');const h=Math.floor((now-t)/3600000);return s+'（'+(h<1?'1時間以内':h<24?h+'時間前':Math.floor(h/24)+'日前')+'）';};
function mount(host,api,preset){
 let extension=null,assignment=null;
 const S={target:'all',qPage:0,kind:'',unit:'',bankError:'',pl:null,plMsg:'',np:[],npMsg:'',tab:'overview',data:null,err:'',who:'u2',type:'',rows:[],next:null,busy:false,titles:{},epoch:0,units:[],flags:new Map(),q:'',subject:'',msg:'',mail:null,mailMsg:'',mailId:null,mailDraft:{uid:'',kind:'',title:'',body:''},inbox:null,inboxMsg:'',inboxSend:{}};
 async function loadTitles(){if(typeof api.bank!=='function')return;try{const b=await api.bank();S.units=((b&&b.units)||[]).filter(u=>u&&u.status!=='preparing');for(const u of (b&&b.units)||[])S.titles[u.id]=u.subject+'「'+u.title+'」';}catch(_){S.bankError='問題一覧を読み込めませんでした。再読み込みしてください。';}finally{if(S.tab==='problems')render();}}
 async function loadOverview(){const e=++S.epoch;S.busy=true;S.err='';render();try{const d=await api.get('/admin/overview');if(e!==S.epoch)return;if(!d||!Array.isArray(d.people))throw Error('shape');S.data=d;}catch(_){if(e===S.epoch)S.err='読み込めませんでした。もう一度ためしてください。';}finally{if(e===S.epoch){S.busy=false;render();}}}
 async function loadActivity(more){const e=++S.epoch;S.busy=true;S.err='';if(!more){S.rows=[];S.next=null;}render();
  try{const q='?uid='+S.who+(S.type?'&type='+encodeURIComponent(S.type):'')+(more&&S.next?'&cursor='+encodeURIComponent(S.next):'');const d=await api.get('/admin/activity'+q);if(e!==S.epoch)return;if(!d||!Array.isArray(d.items))throw Error('shape');S.rows=S.rows.concat(d.items);S.next=d.next||null;}
  catch(_){if(e===S.epoch)S.err='読み込めませんでした。もう一度ためしてください。';}finally{if(e===S.epoch){S.busy=false;render();}}}
 async function loadFlags(){const e=++S.epoch;S.busy=true;S.err='';render();try{const d=await api.get('/material-flags');if(e!==S.epoch)return;S.flags=new Map(((d&&d.items)||[]).map(x=>[x.unitId+':'+x.questionId,x]));}catch(_){if(e===S.epoch)S.err='読み込めませんでした。もう一度ためしてください。';}finally{if(e===S.epoch){S.busy=false;render();}}}
 async function setFlag(u,q,action,note){if(typeof api.post!=='function')return;S.busy=true;S.msg='';render();try{const d=await api.post('/material-flags',{action,unitId:u.id,questionId:q.id,...(note?{note}:{})});const k=u.id+':'+q.id;if(d&&d.item&&d.item.paused)S.flags.set(k,d.item);else S.flags.delete(k);S.msg=action==='pause'?'「出さない」にしました（問題は消していません）。':'また出すようにしました。';}catch(_){S.msg='保存できませんでした。もう一度ためしてください。';}finally{S.busy=false;render();}}
 const answerText=q=>{const a=q.answer||{};return a.value!==undefined?String(a.value)+(a.unitRequired&&a.units?.[0]?a.units[0]:''):Array.isArray(a.accepted)?a.accepted.join(' ／ '):Array.isArray(a.values)?a.values.join('、'):Array.isArray(a.items)?a.items.map(x=>Array.isArray(x)?x.join(' / '):String(x)).join('、'):JSON.stringify(a);};
 const kindOf=u=>u.external?'eiken':u.bank==='tokkun'?'tokkun':u.mode==='drill'?'drill':'textbook';
 const KIND={textbook:'教科書',tokkun:'特訓',drill:'ドリル',eiken:'英検'};
 function problems(){
  const box=el('section',null,'adm-problems');const f=el('div',null,'adm-filter');
  const input=el('input');input.type='search';input.placeholder='問題文・単元・ID・出典でさがす';input.setAttribute('aria-label','問題をさがす');input.value=S.q;input.maxLength=120;
  function select(label,items,value,fn){const n=el('select');n.setAttribute('aria-label',label);for(const [v,t] of items){const o=el('option',t);o.value=v;o.selected=value===v;n.append(o);}n.addEventListener('change',()=>{fn(n.value);S.qPage=0;render();});return n;}
  const sub=select('教科',[['','すべての教科'],...['国語','数学','英語','理科','社会'].map(t=>[t,t])],S.subject,v=>{S.subject=v;S.unit='';});
  const mode=select('問題の種類',[['','すべての種類'],...Object.entries(KIND)],S.kind,v=>{S.kind=v;S.unit='';});
  const unit=select('単元',[['','すべての単元'],...S.units.filter(u=>(!S.subject||u.subject===S.subject)&&(!S.kind||kindOf(u)===S.kind)).map(u=>[u.id,u.title])],S.unit,v=>{S.unit=v;});
  const search=()=>{S.q=input.value.trim();S.qPage=0;render();};input.addEventListener('change',search);
  f.append(input,sub,mode,unit,btn('さがす',search));box.append(f);
  if(S.bankError)box.append(el('p',S.bankError,'adm-alert'),btn('一覧を再読み込み',()=>void loadTitles()));
  if(S.msg){const m=el('p',S.msg);m.setAttribute('role','status');box.append(m);}
  box.append(el('p','いま「出さない」にしている問題：'+S.flags.size+'問'));
  const all=[];for(const u of S.units)for(const [group,qs] of [['問題',u.questions||[]],['確認テスト',u.tests||[]]])for(const x of qs)all.push({u,x,group});
  const q=S.q.toLocaleLowerCase();const hits=all.filter(({u,x})=>(!S.subject||u.subject===S.subject)&&(!S.kind||kindOf(u)===S.kind)&&(!S.unit||u.id===S.unit)&&(!q||(x.prompt+' '+u.title+' '+x.id+' '+JSON.stringify(x.source||{})).toLocaleLowerCase().includes(q)));
  const pages=Math.max(1,Math.ceil(hits.length/50));S.qPage=Math.min(S.qPage,pages-1);
  box.append(el('p','登録 '+all.length.toLocaleString()+'問 / 条件に一致 '+hits.length.toLocaleString()+'問 · '+(S.qPage+1)+' / '+pages+'ページ','adm-count'));
  const list=el('ol',null,'adm-qlist');list.start=S.qPage*50+1;
  hits.slice(S.qPage*50,S.qPage*50+50).forEach(({u,x,group})=>{const k=u.id+':'+x.id,flag=S.flags.get(k),li=el('li');
   li.append(el('small',KIND[kindOf(u)]+' · '+u.subject+' '+u.grade+'年「'+u.title+'」 '+group+' · '+x.id),el('p',x.prompt),el('p','正解：'+answerText(x),'adm-ans'));
   const detail=el('details');detail.append(el('summary','解説・難易度・出典を確認'),el('p',x.explanation||'解説の登録がありません。'));
   detail.append(el('p','難易度：'+(x.difficulty||'未登録')+' / 確認：'+(x.reviewed===true?'確認済み':u.external?'英検の既存練習データ':'確認状態未登録')));
   detail.append(el('p',x.source?'出典：'+(x.source.file||x.source.id||'')+' p.'+(x.source.page??'未登録')+' '+(x.source.number||''):'出典：のびログ独自の英検練習'));
   if(extension)detail.append(btn('配布物の下書きに取り込む',()=>{extension.addQuestion(u,x,answerText(x));S.tab='studio';render();}));li.append(detail);
   if(!u.external){if(flag)li.append(el('p','🚫 出さない'+(flag.note?'（'+flag.note+'）':''),'adm-alert'),btn('また出す',()=>void setFlag(u,x,'resume')));
   else{const note=el('input');note.type='text';note.maxLength=200;note.placeholder='使用禁止の理由';note.setAttribute('aria-label','出さない理由');li.append(note,btn('出さない',()=>{if(confirm('この問題を出題から外します。元の問題は保持します。'))void setFlag(u,x,'pause',note.value.trim());}));}}
   list.append(li);});box.append(list);
  if(!hits.length)box.append(el('p','見つかりませんでした。'));
  const pager=el('div',null,'adm-filter');const prev=btn('← 前の50問',()=>{S.qPage--;render();}),next=btn('次の50問 →',()=>{S.qPage++;render();});prev.disabled=S.qPage===0;next.disabled=S.qPage===pages-1;pager.append(prev,next);box.append(pager);
  box.append(btn('この条件の全問題をJSONで保存',()=>extension?.download('nobilog-problems.json',{exportedAt:Date.now(),count:hits.length,items:hits.map(({u,x,group})=>({unitId:u.id,unit:u.title,subject:u.subject,kind:kindOf(u),group,...x}))})));
  const ids=new Set(),issues=[];for(const {u,x} of all){const id=u.id+':'+x.id;if(ids.has(id))issues.push('ID重複：'+id);ids.add(id);if(!x.prompt||!x.answer)issues.push('問題文または正解が未登録：'+id);if(/(?:undefined|NaN)/.test(x.prompt||''))issues.push('表示を確認：'+id);}
  const quality=el('details');quality.append(el('summary','一覧の点検 · '+all.length.toLocaleString()+'問 / 確認候補 '+issues.length+'件'),el('p','ID・問題文・正解欄の機械点検です。正解内容や誤字の全件照合を済ませたという意味ではありません。'));
  for(const issue of issues)quality.append(el('p',issue));box.append(quality);return box;
 }
 async function loadPaper(){const e=++S.epoch;S.busy=true;S.err='';render();try{const d=await api.get('/newspaper');if(e!==S.epoch)return;S.np=(d&&d.items)||[];}catch(_){if(e===S.epoch)S.err='読み込めませんでした。もう一度ためしてください。';}finally{if(e===S.epoch){S.busy=false;render();}}}
 async function paperPost(body,done){S.busy=true;S.npMsg='';render();try{const d=await api.post('/newspaper',body);if(!d||!d.item)throw Error('x');done(d.item);}catch(_){S.npMsg='保存できませんでした。題名40字・本文3000字まで、公開日時は今から60日以内です。';}finally{S.busy=false;render();}}
 function paper(){
  const box=el('section',null,'adm-paper');box.append(el('h3','📰 のびログ新聞を書く'));
  const t=el('input');t.type='text';t.maxLength=40;t.placeholder='題名（40字まで）';t.setAttribute('aria-label','新聞の題名');
  const b=el('textarea');b.maxLength=3000;b.rows=8;b.placeholder='本文（3000字まで。文字だけ）';b.setAttribute('aria-label','新聞の本文');
  const when=el('input');when.type='datetime-local';when.setAttribute('aria-label','配る日時（空なら今すぐ）');
  box.append(t,b,el('label','配る日時（空なら今すぐ）'),when,btn('配る',()=>{const at=when.value?Date.parse(when.value+':00+09:00'):undefined;if(!t.value.trim()||!b.value.trim()){S.npMsg='題名と本文を書いてください。';render();return;}if(!confirm('なお・りらんに配ります。よろしいですか？'))return;void paperPost({action:'create',title:t.value,body:b.value,...(at?{publishAt:at}:{})},item=>{S.np=[item,...S.np];S.npMsg='配りました。';});}));
  if(S.npMsg){const m=el('p',S.npMsg);m.setAttribute('role','status');box.append(m);}
  const list=el('ol',null,'adm-qlist');
  S.np.forEach(x=>{const li=el('li');li.append(el('strong',x.title),el('small','　'+when2(x.publishAt)+(x.hidden?'　（非公開）':x.publishAt>Date.now()?'　（配る予定）':'')));li.append(btn(x.hidden?'また公開する':'非公開にする',()=>void paperPost({action:x.hidden?'show':'hide',id:x.id},item=>{S.np=S.np.map(y=>y.id===item.id?{...y,hidden:item.hidden}:y);})));list.append(li);});
  box.append(el('h3','配った号'),list);if(!S.np.length)box.append(el('p','まだありません。'));
  return box;
 }
 // 💳 契約（確認版の仮ルール）：なおの指示で変える。変えるたびに8項目の記録が1件残る
 async function loadPlans(){const e=++S.epoch;S.busy=true;S.err='';render();try{S.pl=await api.get('/admin/plans');}catch(_){if(e===S.epoch){S.pl=null;S.err='契約は確認版の仮ルールでだけ使えます（本番ではまだ使えません）。';}}finally{if(e===S.epoch){S.busy=false;render();}}}
 const PL={free:'Free',mini:'Mini（AI 月30回）',standard:'Standard（月150回）',pro:'Pro（月300回）',unlimit:'UNLIMIT（回数なし）'};
 const dval=t=>new Date(t+9*3600000).toISOString().slice(0,10);
 function plans(){
  const box=el('section',null,'adm-paper');box.append(el('h3','💳 契約（確認版の仮ルール）'),el('p','実際の契約・金額・回数ではありません。なおがお金を受け取ったあとに、なおの指示で変えます。','adm-note'));
  if(!S.pl)return box;
  S.pl.people.forEach(p=>box.append(el('p',(NAMES[p.uid]||p.uid)+'：'+(PL[p.plan]||p.plan)+(p.state==='grace'?'（猶予中）':p.state==='expired'?'（期限切れ）':'')+(p.end?'　'+dval(p.start)+'〜'+dval(p.end):'')+(p.aiLimit?'　のこり'+p.aiLeft+'回':''))));
  const who=el('select');who.setAttribute('aria-label','だれの契約');for(const [v,t] of Object.entries(NAMES)){const o=el('option',t);o.value=v;who.append(o);}
  const plan=el('select');plan.setAttribute('aria-label','プラン');for(const [v,t] of Object.entries(PL)){const o=el('option',t);o.value=v;plan.append(o);}
  const start=el('input');start.type='date';start.setAttribute('aria-label','開始日');start.value=dval(S.pl.now);
  const end=el('input');end.type='date';end.setAttribute('aria-label','終了日');end.value=dval(S.pl.now+30*86400000);
  const reason=el('select');reason.setAttribute('aria-label','理由');for(const t of S.pl.reasons||[]){const o=el('option',t);o.value=t;reason.append(o);}
  const f=el('div',null,'adm-filter');f.append(who,plan,start,end,reason);box.append(f);
  box.append(btn('この内容で変える',async()=>{const a=Date.parse(start.value+'T00:00:00+09:00'),b=Date.parse(end.value+'T00:00:00+09:00');if(!(b>a)){S.plMsg='終了日は開始日より後にしてください。';render();return;}
   const cur=S.pl.people.find(x=>x.uid===who.value);if(!confirm((NAMES[who.value])+'：'+(PL[cur?.plan]||'Free')+' → '+PL[plan.value]+'\n'+start.value+' 〜 '+end.value+'\n理由：'+reason.value+'\nこの内容で変えますか？'))return;
   S.busy=true;render();try{const d=await api.post('/admin/plans',{uid:who.value,plan:plan.value,start:a,end:b,reason:reason.value});S.plMsg=d&&d.log&&d.log.applies>Date.now()+60000?'変えました（'+dval(d.log.applies)+'から）。':'変えました。';await loadPlans();}catch(_){S.plMsg='変えられませんでした。日付と内容を確かめてください。';S.busy=false;render();}}));
  if(S.plMsg){const m=el('p',S.plMsg);m.setAttribute('role','status');box.append(m);}
  const list=el('ol',null,'adm-qlist');(S.pl.logs||[]).forEach(l=>list.append(el('li',when2(l.at)+'　'+(NAMES[l.uid]||l.uid)+'：'+(PL[l.from]||l.from)+' → '+(PL[l.to]||l.to)+'　'+dval(l.start)+'〜'+dval(l.end)+'　理由：'+l.reason+'　変更：'+l.by)));
  box.append(el('h3','変更の記録'),list);if(!(S.pl.logs||[]).length)box.append(el('p','まだありません。'));
  return box;
 }
 function person(p,now){
  const box=el('section',null,'adm-person');box.append(el('h3',NAMES[p.uid]||p.uid));
  const r=pct(p.today.correct,p.today.attempts);
  box.append(el('p','今日：'+p.today.attempts+'問（正解 '+p.today.correct+'問'+(r===null?'':'・'+r+'%')+'）・'+Math.round(p.today.elapsedMs/60000)+'分'));
  if(p.presence){const modes={study:'問題','study-textbook':'教科書の問題','study-tokkun':'特訓','study-drill':'ドリル','study-kentei':'検定',textbook:'教科書',eiken:'英検',assignments:'配布物',exam:'受験',calendar:'カレンダー',settings:'設定',stats:'成績',game:'記録・あそび'};box.append(el('p','🟢 いまの画面：'+(modes[p.presence.mode]||p.presence.mode)+' · '+Math.max(0,Math.floor((now-p.presence.startedAt)/60000))+'分（画面を開いている時間）','adm-live'));}
  box.append(el('p','最後に使った時刻：'+when(p.lastActiveAt,now)));
  if(p.lastActiveAt&&now-p.lastActiveAt>2*86400000)box.append(el('p','⚠ 2日以上、のびログを開いていません','adm-alert'));
  const week=el('p','この7日：'+(p.days.length?p.days.map(d=>d.day.slice(5).replace('-','/')+' '+d.attempts+'問').join('、'):'記録なし'));box.append(week);
  return box;
 }
 // CSV（台帳29・2026-10-09）：2人の単元ごとの回答数・正答率と、この7日の問題数。答えの文章は入れない
 function csv(){
  const q=v=>{const t=String(v??'');return /[",\r\n]/.test(t)||/^[=+\-@]/.test(t)?'"'+(/^[=+\-@]/.test(t)?"'":'')+t.replace(/"/g,'""')+'"':t;};
  const lines=[['だれ','種類','教科・日付','単元','回答数','正解数','正答率'].join(',')];
  for(const p of S.data.people.filter(p=>S.target==='all'||p.uid===S.target)){const name=NAMES[p.uid]||p.uid;for(const u of p.units)lines.push([name,'単元',u.subject,u.unitTitle,u.attempts,u.correct,pct(u.correct,u.attempts)??''].map(q).join(','));for(const d of p.days)lines.push([name,'日別',d.day,'',d.attempts,d.correct,pct(d.correct,d.attempts)??''].map(q).join(','));}
  const blob=new Blob(['\ufeff'+lines.join('\r\n')+'\r\n'],{type:'text/csv;charset=utf-8'}),a=document.createElement('a');
  try{a.href=URL.createObjectURL(blob);a.download='nobilog-admin-'+new Date(S.data.now+9*3600000).toISOString().slice(0,10)+'.csv';document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},0);S.msg='CSVを保存しました。';}catch(_){S.msg='CSVを保存できませんでした。';}
  render();
 }
 function heat(p){
  const wrap=el('section',null,'adm-heat');wrap.append(el('h3',(NAMES[p.uid]||p.uid)+'：教科・単元ごとの正答率'));
  if(!p.units.length){wrap.append(el('p','まだ記録がありません。'));return wrap;}
  const table=el('table');const head=el('tr');['教科','単元','回答','正答率'].forEach(t=>{const th=el('th',t);th.scope='col';head.append(th);});table.append(head);
  p.units.forEach(u=>{const tr=el('tr'),r=pct(u.correct,u.attempts),td=el('td',r===null?'—':r+'%');td.className=r===null?'':r>=80?'adm-good':r>=50?'adm-mid':'adm-low';tr.append(el('td',u.subject),el('td',u.unitTitle),el('td',u.attempts+'問'),td);table.append(tr);});
  wrap.append(table);return wrap;
 }
 // ✉️ メッセージを送る・解説依頼の提出箱（2026-10-10）。送れるのは なお（u1）だけ（サーバーで毎回確かめる）
 const newId=()=>(root.crypto&&root.crypto.randomUUID?root.crypto.randomUUID():'');
 async function loadMail(){const e=++S.epoch;S.busy=true;S.err='';render();try{const d=await api.get('/admin/messages');if(e!==S.epoch)return;S.mail=d;}catch(_){if(e===S.epoch)S.err='メッセージを読み込めませんでした。もう一度ためしてください。';}finally{if(e===S.epoch){S.busy=false;render();}}}
 function mail(){
  const box=el('section',null,'adm-form');const d=S.mail;if(!d)return box;
  box.append(el('h3','メッセージを送る'),el('p','送った相手だけが「✉️ メッセージ」で読めます。届いたら相手の端末に通知します。送ったメッセージは消せません。','adm-note'));
  const who=el('select');who.setAttribute('aria-label','送る相手');for(const r of d.recipients||[]){const o=el('option',r.name);o.value=r.uid;who.append(o);}
  const kind=el('select');kind.setAttribute('aria-label','種類');for(const [v,t] of Object.entries(d.kinds||{})){const o=el('option',t);o.value=v;kind.append(o);}
  const title=el('input');title.maxLength=60;title.placeholder='題名（60字まで）';title.setAttribute('aria-label','題名');
  const body=el('textarea');body.maxLength=2000;body.rows=5;body.placeholder='本文（2000字まで）';body.setAttribute('aria-label','本文');
  // 送れなかったときも入力を残す（描き直しても消えない）
  const D=S.mailDraft;if(D.uid)who.value=D.uid;if(D.kind)kind.value=D.kind;title.value=D.title;body.value=D.body;
  const keep=()=>{S.mailDraft={uid:who.value,kind:kind.value,title:title.value,body:body.value};};[who,kind,title,body].forEach(x=>{x.addEventListener('input',keep);x.addEventListener('change',keep);});
  box.append(who,kind,title,body);
  if(S.mailMsg){const m=el('p',S.mailMsg);m.setAttribute('role','status');box.append(m);}
  box.append(btn('送る',async()=>{
   if(!title.value.trim()||!body.value.trim()){S.mailMsg='題名と本文を書いてください。';render();return;}
   if(!root.confirm||!root.confirm((who.options[who.selectedIndex]||{}).text+' に送ります。よろしいですか？'))return;
   S.mailId=S.mailId||newId();S.busy=true;render();
   try{await api.post('/admin/messages',{id:S.mailId,uid:who.value,kind:kind.value,title:title.value,body:body.value});S.mailId=null;S.mailDraft={uid:'',kind:'',title:'',body:''};S.mailMsg='送りました。';await loadMail();}
   catch(_){S.mailMsg='送れませんでした。もう一度押すと、同じメッセージとして送りなおします（二重には届きません）。';S.busy=false;render();}
  }));
  const list=el('ol',null,'adm-log');list.setAttribute('aria-label','送ったメッセージ');
  for(const m of d.items||[])list.append(el('li',when2(m.at)+' '+(m.name||m.uid)+'へ「'+m.title+'」（'+((d.kinds||{})[m.kind]||m.kind)+'）'+(m.readAt?'・既読':'・未読')));
  box.append(el('h3','送ったメッセージ'),list);if(!(d.items||[]).length)box.append(el('p','まだ送っていません。'));
  return box;
 }
 async function loadInbox(){const e=++S.epoch;S.busy=true;S.err='';render();try{const d=await api.get('/admin/explain-requests');if(e!==S.epoch)return;S.inbox=d;}catch(_){if(e===S.epoch)S.err='解説依頼を読み込めませんでした。もう一度ためしてください。';}finally{if(e===S.epoch){S.busy=false;render();}}}
 function inbox(){
  const box=el('section');const d=S.inbox;if(!d)return box;
  box.append(el('p','UNLIMIT の人からの「詳しい解説」の依頼です。「確認中」にしてから返信を書くと、相手に通知します。返信は1回だけで、送ったあとは変えられません。','adm-note'));
  if(S.inboxMsg){const m=el('p',S.inboxMsg);m.setAttribute('role','status');box.append(m);}
  const items=d.items||[];if(!items.length)box.append(el('p','依頼はありません。'));
  for(const r of items){
   const c=el('article',null,'adm-inbox');const st=(d.statuses||{})[r.status]||r.status;
   c.append(el('h3','【'+st+'】'+(r.name||r.uid)+'・'+(r.attempt&&r.attempt.subject||'')+'「'+(r.attempt&&r.attempt.unitTitle||'')+'」'),el('small','依頼：'+when2(r.at)));
   c.append(el('p','問題：'+(r.attempt&&r.attempt.prompt||'')),el('p','本人の答え：'+(r.attempt&&r.attempt.answer||'')+(r.attempt&&r.attempt.correct?'（正解）':'（不正解）')));
   if(r.note)c.append(el('p','わからないところ：'+r.note));
   if(r.reply){c.append(el('p','返信（'+when2(r.reply.at)+'）：'+r.reply.text));}
   else{
    if(r.status==='received')c.append(btn('確認中にする',async()=>{S.busy=true;render();try{await api.post('/admin/explain-requests',{action:'status',uid:r.uid,id:r.id,status:'reviewing'});S.inboxMsg='確認中にしました。';await loadInbox();}catch(_){S.inboxMsg='変えられませんでした。もう一度ためしてください。';S.busy=false;render();}}));
    const ta=el('textarea');ta.maxLength=4000;ta.rows=5;ta.placeholder='解説を書く（4000字まで）';ta.setAttribute('aria-label','解説の返信');ta.value=S.inboxSend[r.id]||'';ta.addEventListener('input',()=>{S.inboxSend[r.id]=ta.value;});
    c.append(ta,btn('返信する',async()=>{if(!ta.value.trim())return;if(!root.confirm||!root.confirm('この解説を送ります。送ったあとは変えられません。'))return;S.busy=true;render();try{await api.post('/admin/explain-requests',{action:'reply',uid:r.uid,id:r.id,text:ta.value});delete S.inboxSend[r.id];S.inboxMsg='返信しました。';await loadInbox();}catch(_){S.inboxMsg='返信できませんでした。書いた文は残っています。';S.busy=false;render();}}));
   }
   box.append(c);
  }
  box.append(btn('読み込みなおす',()=>void loadInbox()));
  return box;
 }
 function goto(id){if(extension?.writing?.()){alert('保存が完了してから切り替えてください。');return;}if(assignment?.dirty?.()){alert('提出箱のコメント・解説を下書き保存してから切り替えてください。');return;}if(S.target==='all'&&['books','studio','schedule','vocab','archive','system'].includes(id)){S.target='u1';S.who='u1';extension?.setPerson('u1');}S.tab=id;const load={overview:()=>S.data?render():loadOverview(),activity:()=>loadActivity(false),problems:loadFlags,paper:loadPaper,plans:loadPlans,mail:loadMail,inbox:loadInbox}[id];if(load)void load();else render();}
 function render(){
  if(assignment?.dirty?.()&&S.tab==='assignments')return;
  host.replaceChildren();const root2=el('div',null,'adm');host.append(root2);
  root2.dataset.account=S.target;root2.append(el('h2','🌳 admin v1.0.0'),el('p','のびログ管理室 · 問題、教科書、配布物とアカウントを一か所で管理','adm-note'));
  const people=S.data?.people||[{uid:'u1',label:'なお'},{uid:'u2',label:'りらん'}];const picker=el('div',null,'adm-account-bar');const sel=el('select');sel.setAttribute('aria-label','管理するアカウント');for(const p of [{uid:'all',label:'全アカウントの概要'},...people]){const o=el('option',p.label||NAMES[p.uid]||p.uid);o.value=p.uid;o.selected=S.target===p.uid;sel.append(o);}sel.addEventListener('change',()=>{if(extension?.writing?.()){alert('保存が完了してから切り替えてください。');sel.value=S.target;return;}if(assignment?.dirty?.()){alert('提出箱の入力を下書き保存してから切り替えてください。');sel.value=S.target;return;}S.target=sel.value;S.who=sel.value==='all'?'u2':sel.value;S.epoch++;S.busy=false;S.err='';extension?.setPerson(S.target==='all'?'u2':S.target);if(S.tab==='activity')void loadActivity(false);else render();});picker.append(sel,el('span',S.target==='all'?'管理者：なお':(people.find(p=>p.uid===S.target)?.focus||'対象別の記録を表示')));root2.append(picker);
  const tabs=el('nav');tabs.setAttribute('aria-label','管理の画面');
  for(const [id,label] of [['overview','ようす'],['activity','活動の記録'],['problems','問題'],['books','教科書'],['studio','テンプレート・作成'],['assignments','配布物・提出箱'],['schedule','カレンダー'],['vocab','英単語'],['archive','提出アーカイブ・レポート'],['mail','メッセージ'],['inbox','解説依頼'],['paper','新聞'],['plans','契約'],['system','保存・履歴']])tabs.append(btn(label,()=>goto(id),S.tab===id));root2.append(tabs);
  const status=el('p',S.busy?'読み込んでいます…':S.err);status.setAttribute('role','status');root2.append(status);
  if(S.tab==='overview'&&S.data){const now=S.data.now;const shown=S.data.people.filter(p=>S.target==='all'||p.uid===S.target);const order={u1:['profile','person','heat'],u2:['person','heat','profile'],p_free:['profile','person','heat'],p_mini:['profile','heat','person'],p_standard:['person','profile','heat'],p_pro:['heat','person','profile'],p_unlimit:['profile','heat','person']}[S.target]||['person','heat'];for(const part of order){if(part==='profile')root2.append(extension?.profile(S.target)||el('span'));else shown.forEach(p=>root2.append(part==='person'?person(p,now):heat(p)));}root2.append(btn('読み込みなおす',()=>void loadOverview()),btn('CSVで保存',()=>csv()));if(S.msg){const m=el('p',S.msg);m.setAttribute('role','status');root2.append(m);}}
  if(extension&&['books','studio','schedule','vocab','archive','system'].includes(S.tab))root2.append(extension.view(S.tab));
  if(S.tab==='assignments'){const h=el('div');root2.append(h);if(!assignment||assignment.host!==h){assignment?.destroy?.();assignment=api.assignments?.(h,{strictReview:true,tab:preset?.form?'new':'box',form:preset?.form,filterUid:S.target==='all'?null:S.target});preset=null;}}else{assignment?.destroy?.();assignment=null;}
  if(S.tab==='problems')root2.append(problems());
  if(S.tab==='paper')root2.append(paper());
  if(S.tab==='plans')root2.append(plans());
  if(S.tab==='mail')root2.append(mail());
  if(S.tab==='inbox')root2.append(inbox());
  if(S.tab==='activity'){
   const f=el('div',null,'adm-filter');
   const who=el('select');who.setAttribute('aria-label','だれ');for(const p of S.data?.people||[{uid:'u1'},{uid:'u2'}]){const v=p.uid,t=p.label||NAMES[v];const o=el('option',t);o.value=v;o.selected=S.who===v;who.append(o);}who.addEventListener('change',()=>{S.who=who.value;void loadActivity(false);});
   const type=el('select');type.setAttribute('aria-label','種類');const all=el('option','すべて');all.value='';type.append(all);for(const [v,t] of Object.entries(TYPE)){const o=el('option',t);o.value=v;o.selected=S.type===v;type.append(o);}type.addEventListener('change',()=>{S.type=type.value;void loadActivity(false);});
   f.append(who,type);root2.append(f);
   const list=el('ol',null,'adm-log');
   S.rows.forEach(r=>{const parts=[when(r.at,Date.now()).replace(/（.*）/,''),TYPE[r.type]||r.type];if(r.type==='hint'&&r.level)parts.push(r.level+'段目');if(r.unitId)parts.push(S.titles[r.unitId]||r.unitId);if(r.questionId)parts.push('問題 '+r.questionId);if(r.student)parts.push('（'+(NAMES[r.student]||r.student)+'へ）');if(r.mock)parts.push('模擬AI');if(r.type==='admin-flag')parts.push(r.paused?'→ 出さない':'→ また出す');list.append(el('li',parts.join('　')));});
   root2.append(list);if(!S.rows.length&&!S.busy&&!S.err)root2.append(el('p','記録はありません。'));
   if(S.next)root2.append(btn('もっと見る',()=>void loadActivity(true)));
  }
 }
 if(root.NobiAdminStudio)extension=root.NobiAdminStudio.create({...api,navigate(id){goto(id);}});
 if(preset?.tab)S.tab=preset.tab;
 void loadTitles();void loadOverview();
 const refresh=setInterval(()=>{if(host.isConnected&&!document.hidden&&S.tab==='overview'&&!S.busy)void loadOverview();},30000);
 return {compose(form){preset={form};S.tab='assignments';render();},dirty:()=>!!extension?.dirty()||!!assignment?.dirty?.(),busy:()=>!!extension?.writing?.()||!!assignment?.busy?.(),destroy(){clearInterval(refresh);S.epoch++;assignment?.destroy?.();extension?.destroy();host.replaceChildren();}};
}
// 読む人の画面（配布物のいちばん上）：配られた号を新しい順に。文字だけ。
function mountPaper(host,api){
 let alive=true;host.replaceChildren();
 (async()=>{let d=null;try{d=await api.get();}catch(_){}if(!alive)return;const items=(d&&Array.isArray(d.items))?d.items:[];host.replaceChildren();if(!items.length)return;
  const box=el('section',null,'np-box');box.append(el('h2','📰 のびログ新聞'));
  items.slice(0,10).forEach((x,i)=>{const a=el(i?'details':'article',null,'np-issue');if(i){a.append(el('summary',x.title+'（'+when2(x.publishAt)+'）'));}else a.append(el('h3',x.title),el('small',when2(x.publishAt)));const p=el('p',x.body,'np-body');a.append(p);box.append(a);});
  host.append(box);})();
 return {destroy(){alive=false;host.replaceChildren();}};
}
root.NobiAdmin=Object.freeze({mount,mountPaper});
})(globalThis);
