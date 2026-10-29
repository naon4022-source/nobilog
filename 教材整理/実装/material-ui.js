(function(root){
'use strict';
// 📝 下書き（なお指定 2026-10-07：サーバー保存）：打ちかけの答えとメモを本人の記録「materialDrafts」に入れる。
//   ほかの記録と同じしくみでサーバーへ保存され、電波がないあいだは送れるまで端末で待ち、つながったら自動で送る。別の端末でも続きから。
//   打っている最中は1.5秒まとめてから保存（1文字ごとに記録全体を送らない）。人ごと・14日・100件・1件2000字まで。
const DRAFT_DAYS=14,DRAFT_MAX=100,DRAFT_WAIT=1500;
function draftClean(o,now){
 const out=Object.create(null);
 if(o&&typeof o==='object'&&!Array.isArray(o))for(const [k,v] of Object.entries(o))if(/^[an]:/.test(k)&&k.length<=300&&v&&typeof v.v==='string'&&v.v.length<=2000&&Number.isFinite(v.at)&&now-v.at<DRAFT_DAYS*864e5)out[k]={v:v.v,at:v.at};
 return out;
}
// 📐 公式カードと道具（台帳28・2026-10-08）：数学・理科の大単元ごとの公式。「テスト」中は出さない。
//   電卓は計算が必要な理科の単元だけ（数学は手で計算する練習なので出さない）。図を使う問題はないので定規・分度器は出さない。
const FORMULA=[
 ['数学',/正負|正の数|負の数/,[['符号','同じ符号の2数の積・商は＋、ちがう符号なら−'],['ひき算','ひく数の符号を変えてたす：a−(−b)＝a＋b'],['累乗','(−3)²＝9、−3²＝−9（かっこの有無で変わる）'],['計算の順','かっこの内側から、その中では累乗 → ×÷ → ＋−。同じ順位は左から'],['絶対値','数直線上で0からの距離（符号を取った数）']]],
 ['数学',/文字式/,[['書き方','×は省く・数は文字の前・同じ文字の積は累乗（a×a＝a²）'],['わり算','÷は分数で書く：a÷3＝a/3'],['分配法則','a(b＋c)＝ab＋ac'],['項と係数','3x−5の項は3xと−5、xの係数は3'],['代入','文字に数を入れるときは、負の数にかっこをつける']]],
 ['数学',/方程式/,[['等式の性質','両辺に同じ数をたしても・ひいても・かけても・（0でない数で）わっても等式は成り立つ'],['移項','項を反対の辺へ移すときは符号を変える'],['比例式','a:b＝c:d ならば ad＝bc'],['解き方','かっこ→分数・小数をなくす→移項→ax＝b→x＝b/a']]],
 ['数学',/変化と対応|比例|反比例|関数/,[['比例','y＝ax（aは比例定数）。グラフは原点を通る直線'],['反比例','y＝a/x（xy＝a）。グラフは双曲線'],['比例定数','比例 a＝y/x、反比例 a＝xy'],['座標','(x, y)。xは横、yは縦']]],
 ['数学',/平面図形/,[['円周','2πr'],['円の面積','πr²'],['おうぎ形の弧','2πr × a/360（aは中心角）'],['おうぎ形の面積','πr² × a/360 ＝ ½ℓr（ℓは弧の長さ）']]],
 ['数学',/空間図形/,[['柱体の体積','底面積 × 高さ'],['錐体の体積','⅓ × 底面積 × 高さ'],['球','体積 ⁴⁄₃πr³、表面積 4πr²'],['円錐の側面積','πℓr（ℓは母線、rは底面の半径）'],['表面積','底面積 ×（柱は2・錐は1）＋ 側面積']]],
 ['数学',/データ/,[['相対度数','その階級の度数 ÷ 度数の合計'],['累積相対度数','最初の階級からその階級までの相対度数の和'],['範囲','最大値 − 最小値'],['代表値','平均値・中央値（真ん中の値）・最頻値（いちばん多い値）'],['確率','多数回の実験での相対度数を、起こりやすさの目安にする']]],
 ['理科',/物質とその性質|密度/,[['密度','密度[g/cm³] ＝ 質量[g] ÷ 体積[cm³]'],['質量','質量 ＝ 密度 × 体積'],['浮き沈み','水（約1g/cm³）より密度が小さい物は浮く']],true],
 ['理科',/水溶液/,[['質量パーセント濃度','溶質の質量 ÷ 溶液の質量 × 100 [%]'],['溶液','溶液の質量 ＝ 溶質の質量 ＋ 溶媒の質量'],['再結晶','冷やして出てくる結晶の量 ＝ とけていた量 − その温度でとける量']],true],
 ['理科',/光による/,[['反射','入射角 ＝ 反射角'],['屈折','空気→水・ガラスでは屈折角＜入射角'],['凸レンズ','物体が焦点距離の2倍の位置 → 同じ大きさの実像が2倍の位置にできる']]],
 ['理科',/音による/,[['音の速さ','速さ[m/s] ＝ 距離[m] ÷ 時間[s]（空気中で約340m/s）'],['高さ','振動数[Hz]が多いほど高い音'],['大きさ','振幅が大きいほど大きい音']],true],
 ['理科',/力による/,[['フックの法則','ばねののびは、ばねを引く力の大きさに比例する'],['重力','約100gの物体にはたらく重力が約1N'],['重さと質量','重さは場所で変わる（月では約⅙）、質量は変わらない'],['つり合い','2力が一直線上・大きさが等しい・向きが反対']],true],
 ['理科',/ゆれる大地/,[['速さ','速さ ＝ 震源からの距離 ÷ 伝わるのにかかった時間'],['初期微動継続時間','S波が着いた時刻 − P波が着いた時刻（震源から遠いほど長い）'],['震度と規模','震度はその場所のゆれ、マグニチュードは地震そのものの規模']],true]
];
function formulaFor(unit){if(!unit)return null;const t=(unit.majorTitle||'')+' '+(unit.title||'');for(const [subject,re,items,calc] of FORMULA)if(unit.subject===subject&&re.test(t))return {items,calc:!!calc};return null;}
// 電卓：数字と ＋−×÷・かっこ・小数だけ。式を自分で読んで計算する（evalは使わない）
function calcEval(src){
 const s=String(src).normalize('NFKC').replace(/\s/g,'').replace(/[×*]/g,'*').replace(/[÷/]/g,'/').replace(/[−ー]/g,'-');
 if(!s||s.length>80||!/^[0-9.+\-*/()]+$/.test(s))return null;let i=0;
 const num=()=>{const m=/^\d+(\.\d+)?/.exec(s.slice(i));if(!m)throw 0;i+=m[0].length;return Number(m[0]);};
 const atom=()=>{if(s[i]==='-'){i++;return -atom();}if(s[i]==='('){i++;const v=expr();if(s[i]!==')')throw 0;i++;return v;}return num();};
 const term=()=>{let v=atom();while(s[i]==='*'||s[i]==='/'){const o=s[i++],b=atom();if(o==='/'&&b===0)throw 0;v=o==='*'?v*b:v/b;}return v;};
 const expr=()=>{let v=term();while(s[i]==='+'||s[i]==='-'){const o=s[i++],b=term();v=o==='+'?v+b:v-b;}return v;};
 try{const v=expr();if(i!==s.length||!Number.isFinite(v))return null;return Math.round(v*1e10)/1e10;}catch(_){return null;}
}
function mount(host,catalog,bridge,sourceRegistry){
 const engine=root.NobiMaterialEngine;
 let draftMem=null,draftTimer=0;
 function draftAll(uid){
  if(!uid)return Object.create(null);
  if(!draftMem||draftMem.uid!==uid){draftFlush();let saved={};try{saved=typeof bridge.drafts==='function'?bridge.drafts(uid):{};}catch(_){}draftMem={uid,data:draftClean(saved,Date.now())};}
  return draftMem.data;
 }
 function draftFlush(){
  if(draftTimer){root.clearTimeout(draftTimer);draftTimer=0;}
  if(!draftMem||!draftMem.dirty)return;draftMem.dirty=false;
  try{if(typeof bridge.draftsWrite==='function')bridge.draftsWrite(draftMem.data,draftMem.uid);}catch(_){}
 }
 function draftGet(uid,key){const d=draftAll(uid)[key];return d?d.v:undefined;}
 function draftPut(uid,key,value){
  if(!uid)return;const o=draftAll(uid),had=!!o[key];
  if(typeof value==='string'&&value.trim())o[key]={v:value.slice(0,2000),at:Date.now()};else if(had)delete o[key];else return;
  const keep=Object.keys(o).sort((a,b)=>o[b].at-o[a].at).slice(DRAFT_MAX);for(const k of keep)delete o[k];
  draftMem.dirty=true;
  // 消すとき（正解・保存済み）はすぐ、打っている最中はまとめて保存する
  if(!o[key]){draftFlush();return;}
  if(typeof root.setTimeout!=='function'){draftFlush();return;}
  if(draftTimer)root.clearTimeout(draftTimer);draftTimer=root.setTimeout(draftFlush,DRAFT_WAIT);
 }
 const draftHide=()=>draftFlush();
 try{root.addEventListener?.('pagehide',draftHide);}catch(_){}
 const units=(Array.isArray(catalog)?catalog:[]).filter(u=>u.status==='ready'&&engine.validateUnit(u,{sources:sourceRegistry}).length===0);
 const state={mode:'textbook',grade:1,subject:'国語',unit:null,index:0,tab:'問題',busy:false,sync:'loading',loadedIdentity:null,message:'',answer:'',progress:{},progressOpen:false,started:false,layout:'batch',count:15,calcCount:null,query:'',focus:'all',session:null,sessionDone:[],drafts:Object.create(null),major:null,fullscreenOnly:false,sessionSkipped:[],times:Object.create(null)};
 let alive=true,loadEpoch=0,questionClock='',startedAt=0,pendingAttempt=null;
 let activeReview=null;
 // なおが「出さない」印をつけた問題（台帳28・2026-10-09）。問題は消さず、新しく作る問題の組から外すだけ
 let pausedSet=new Set();
 // AIの説明（記録IDごと）とヒント（問題ごと）。採点・進み具合には使わない。
 const aiState={epoch:0,available:false,explain:Object.create(null),hints:Object.create(null),explainFor:null,judge:Object.create(null),similar:Object.create(null),generated:Object.create(null),makeNew:false};
 const notebookState={open:false,busy:false,items:[],drafts:Object.create(null),message:'',epoch:0,auto:[],autoNext:null,autoBusy:false,autoMessage:''};
 const reviewState={open:false,busy:false,page:null,message:'',view:'due',epoch:0};
 const reminder={rows:[],key:'',dismissed:new Set(),epoch:0,busy:false};
 // ログイン時の復習2問（2026-10-07）：前にまちがえて、まだ正解していない問題から2問（AIは使わず決まりで選ぶ）。ヒントの入口は20秒たってから
 const loginReview={uid:null,rows:[],dismissed:false,busy:false,gate:Object.create(null),timer:null};
 let reminderNode=null;
 const reminderTimer=typeof root.setInterval==='function'?root.setInterval(()=>{void checkReminder();void updateDaily();},60000):null;
 const onVisible=()=>{if(!document.hidden){void checkReminder();void updateDaily();}};
 document.addEventListener?.('visibilitychange',onVisible);
 const historyState={open:false,busy:false,page:null,message:'',epoch:0};
 // 小単元の○△×と見た回数（サーバーの回答記録から）。offset はサーバー時計との差
 const marksState={unitId:null,items:null,offset:0,busy:false,open:false,message:'',epoch:0};
 function element(tag,text){const el=document.createElement(tag);if(text)el.textContent=text;return el;}
 // 問題の種類（2026-10-06 ユーザー指示）：教科書＝ワーク・教科書を根拠にした小単元の問題（70問の単元と、以前からの100問の単元）／特訓＝別に作る高難度70問（bank:'tokkun'）／検定＝英検タブ／ドリル＝ドリル。
 // 保存の記録は今までどおり各単元の mode と ID で分けているので、表示の分け方を変えても記録は混ざらない。
 function kindOf(u){return u&&u.mode==='kentei'?'kentei':u&&u.bank==='tokkun'?'tokkun':u&&u.mode==='drill'?'drill':'textbook';}
 function choices(){return units.filter(u=>kindOf(u)===state.mode&&(state.mode==='kentei'||u.grade===state.grade&&u.subject===state.subject));}   // 検定は学年・教科で分けない（2026-10-22）
 function selected(){return choices().find(u=>u.id===state.unit);}
 function bank(unit){const all=state.tab==='テスト'?(unit.tests||[]):[...unit.questions,...(aiState.generated[unit.id]||[])];return state.session&&state.started&&!activeReview?state.session.map(id=>all.find(q=>q.id===id)).filter(Boolean):all;}
 function progressKey(){return state.tab==='テスト'?'testDone':'done';}
 function nextIndex(unit){if(!unit)return 0;const questions=bank(unit),done=state.started&&!activeReview?[...state.sessionDone,...state.sessionSkipped]:state.progress[unit.id]?.[progressKey()];const index=questions.findIndex(q=>!Array.isArray(done)||!done.includes(q.id));return index<0?questions.length:index;}
 function select(fallback=false){
  if(fallback&&!choices().length){const first=units.find(u=>kindOf(u)===state.mode);if(first){state.grade=first.grade;state.subject=first.subject;}}
  marksState.open=false;state.started=false;state.session=null;state.resultFor=null;state.sessionDone=[];state.sessionSkipped=[];state.times=Object.create(null);state.drafts=Object.create(null);state.major=null;state.unit=choices()[0]?.id||null;state.index=nextIndex(selected());state.answer='';state.message='';
 }
 async function reload(){
  const uid=bridge.identity(),epoch=++loadEpoch;rewardMessage='学習報酬を確認中です。';state.busy=false;state.started=false;state.session=null;state.sync='loading';notebookState.open=false;notebookState.items=[];notebookState.auto=[];notebookState.autoNext=null;notebookState.autoBusy=false;notebookState.autoMessage='';notebookState.drafts=Object.create(null);notebookState.epoch++;aiState.epoch++;aiState.available=false;aiState.explain=Object.create(null);aiState.hints=Object.create(null);aiState.explainFor=null;aiState.judge=Object.create(null);aiState.similar=Object.create(null);aiState.generated=Object.create(null);notebookState.busy=false;reminder.epoch++;reminder.busy=false;reminder.rows=[];reminder.key='';reminder.dismissed.clear();activeReview=null;reviewState.open=false;reviewState.page=null;reviewState.epoch++;historyState.open=false;historyState.page=null;historyState.epoch++;marksState.unitId=null;marksState.items=null;marksState.open=false;marksState.busy=false;marksState.epoch++;pendingAttempt=null;questionClock='';state.loadedIdentity=null;state.progress={};state.message='進み具合を読み込んでいます。';render();
  try{
   if(typeof bridge.load!=='function')throw Error('progress loading unavailable');
   const loaded=await bridge.load(uid);
   if(!alive||epoch!==loadEpoch||uid!==bridge.identity())return;
   if(!loaded||typeof loaded!=='object'||Array.isArray(loaded))throw Error('invalid progress');
   state.progress=loaded;state.loadedIdentity=uid;state.sync='ready';state.index=nextIndex(selected());state.message='';
   if(typeof bridge.paused==='function'){try{const p=await bridge.paused(uid);if(alive&&epoch===loadEpoch&&uid===bridge.identity()&&Array.isArray(p))pausedSet=new Set(p.filter(x=>x&&typeof x.unitId==='string'&&typeof x.questionId==='string').map(x=>x.unitId+':'+x.questionId));}catch(_){}}
  }catch(_){if(alive&&epoch===loadEpoch&&uid===bridge.identity()){state.sync='error';state.message='進み具合を読み込めませんでした。再試行してください。';}}
  if(alive&&epoch===loadEpoch&&uid===bridge.identity()){render();if(state.sync==='ready'){void checkLoginReview();void checkReminder();void updateDaily();void checkAi();}}
 }
 function button(label,fn,active,unavailable=false){const b=element('button',label);b.type='button';b.disabled=state.busy||unavailable;b.setAttribute('aria-pressed',String(!!active));if(unavailable)b.setAttribute('aria-disabled','true');b.addEventListener('click',fn);return b;}
 function menu(parent,label,items,key){const box=element('section');box.className='material-selection';box.append(element('h3',label));const nav=element('nav');nav.setAttribute('aria-label',label);items.forEach(([v,t])=>{
  const unavailable=false;
  nav.append(button(t,()=>{if(unavailable)return;closeReview();state[key]=v;select(key==='mode');render();},state[key]===v,unavailable));
 });box.append(nav);parent.append(box);}
 async function answer(q,value,skip=false){
  if(state.busy||!alive||state.sync!=='ready')return;
  if(bridge.identity()!==state.loadedIdentity){void reload();return;}
  const unit=selected(),tab=state.tab;
  if(!unit||tab==='教科書')return;const at=bank(unit).indexOf(q);if(at<0||(!state.started&&!activeReview))return;state.index=at;state.resultFor=null;
  state.answer=value;state.drafts[q.id]=value;draftPut(bridge.identity(),'a:'+q.id,value);
  if(!value.trim()&&q.type!=='reading'){state.message='答えを入力してください。';render();return;}
  const uid=bridge.identity(),answerEpoch=loadEpoch;
  state.busy=true;state.message='回答を保存しています。';render();
  let r;
  try{
   if(typeof bridge.record==='function'){
    if(!pendingAttempt||pendingAttempt.unitId!==unit.id||pendingAttempt.questionId!==q.id||pendingAttempt.answer!==value||pendingAttempt.mode!==(tab==='テスト'?'test':'study')){
     pendingAttempt={id:root.crypto.randomUUID(),unitId:unit.id,questionId:q.id,mode:tab==='テスト'?'test':'study',answer:q.type==='reading'?'読み終えた':value,elapsedMs:Math.min(86400000,Math.max(0,Math.round(Date.now()-(state.times[unit.id+':'+tab+':'+q.id]??startedAt))))};
    }
    const saved=await bridge.record(pendingAttempt,uid);if(!alive||answerEpoch!==loadEpoch)return;r=saved.result;startedAt=Date.now();
    if(!r.correct&&!skip&&tab==='問題'&&typeof saved.id==='string')aiState.explainFor={key:unit.id+':'+tab+':'+q.id,attemptId:saved.id};
   }else r=q.type==='reading'?{correct:true}:engine.grade(q,value);
   if(!alive||uid!==bridge.identity()){state.busy=false;return;}
   if(tab==='問題'&&!activeReview)markLocal(unit,q,r);
   if(!r.correct&&!skip&&tab==='問題'&&!activeReview&&state.started&&q.origin!=='generated'&&(unit.schedule==='marks'||unit.mode==='kentei')){
    // その場で解き直して○にしない：結果と正解・解説を見せて次の問題へ。×は次の日、△は1週間後にもう一度出る
    pendingAttempt=null;state.busy=false;state.sessionSkipped.push(q.id);delete state.drafts[q.id];draftPut(uid,'a:'+q.id,'');state.index=nextIndex(unit);state.answer='';state.resultFor=q.id;
    state.message=(r.near?'前の問題：△ ':'前の問題：× ')+r.reason+'　正解：'+expectedText(q)+(unit.mode==='kentei'?'':r.near?'（1週間後にもう一度出ます）':'（次の日の最初にもう一度出ます）')+(q.explanation?'　'+q.explanation:'');
    render();return;
   }
   if(!r.correct){pendingAttempt=null;startedAt=Date.now();state.times[unit.id+':'+tab+':'+q.id]=startedAt;state.busy=false;if(skip&&!activeReview){state.sessionSkipped.push(q.id);state.index=nextIndex(unit);state.answer='';state.resultFor=q.id;state.message='前の問題は未正解として記録しました。'+(q.explanation||'復習から解き直せます。');}else state.message=r.reason;render();return;}
  }catch(_){if(answerEpoch!==loadEpoch)return;state.busy=false;if(alive&&uid===bridge.identity()){state.message='保存できませんでした。接続を確認して、もう一度押してください。';render();}return;}

  const id=unit.id,next=JSON.parse(JSON.stringify(state.progress));
  const key=progressKey(),p=next[id]&&typeof next[id]==='object'&&!Array.isArray(next[id])?next[id]:{};
  if(!Array.isArray(p[key]))p[key]=[];
  if(q.origin!=='generated'&&!p[key].includes(q.id))p[key].push(q.id);
  p[tab==='テスト'?'lastTestQuestion':'lastQuestion']=q.id;next[id]=p;
  state.busy=true;state.message='正解です。保存しています。';render();
  try{await bridge.save(next,uid);if(!alive||answerEpoch!==loadEpoch||uid!==bridge.identity())return;pendingAttempt=null;state.progress=next;if(!activeReview&&!state.sessionDone.includes(q.id)){state.sessionDone.push(q.id);state.resultFor=q.id;}delete state.drafts[q.id];draftPut(uid,'a:'+q.id,'');void updateDaily();state.index=nextIndex(selected());state.answer='';state.message=q.explanation?'前の問題：正解です。'+q.explanation:'前の問題：正解です。';}
  catch(_){if(alive&&answerEpoch===loadEpoch&&uid===bridge.identity())state.message='保存できませんでした。接続を確認して、もう一度押してください。';}
  finally{if(answerEpoch===loadEpoch){state.busy=false;if(alive){if(uid===bridge.identity()){if(activeReview&&state.answer===''){activeReview=null;reminder.rows=[];void loadReview('all');void checkReminder();}else render();}else void reload();}}}
 }
 async function loadHistory(cursor){
  const uid=bridge.identity(),run=++historyState.epoch;
  closeReview();historyState.open=true;historyState.busy=true;historyState.message='回答履歴を読み込んでいます。';render();
  try{
   const page=await bridge.history(uid,cursor);
   if(!alive||run!==historyState.epoch||uid!==bridge.identity())return;
   historyState.page=page;historyState.message='';
  }catch(_){if(alive&&run===historyState.epoch&&uid===bridge.identity())historyState.message='回答履歴を読み込めませんでした。再試行してください。';}
  finally{if(alive&&run===historyState.epoch&&uid===bridge.identity()){historyState.busy=false;render();}}
 }
 async function loadMarks(unit,open=false){
  if(!unit||typeof bridge.marks!=='function')return null;
  const uid=bridge.identity(),run=++marksState.epoch;
  if(open){closeReview();historyState.open=false;marksState.open=true;}
  marksState.busy=true;marksState.message='問題の一覧を読み込んでいます。';if(open)render();
  try{
   const value=await bridge.marks(uid,unit.id);
   if(!alive||run!==marksState.epoch||uid!==bridge.identity())return null;
   marksState.unitId=unit.id;marksState.items=value.items;marksState.offset=value.serverTime-Date.now();marksState.message='';
   return value.items;
  }catch(_){if(alive&&run===marksState.epoch&&uid===bridge.identity())marksState.message='問題の一覧を読み込めませんでした。再試行してください。';return null;}
  finally{if(alive&&run===marksState.epoch&&uid===bridge.identity()){marksState.busy=false;if(marksState.open)render();}}
 }
 function marksFor(unit){return marksState.unitId===unit.id&&marksState.items?marksState.items:null;}
 function markLocal(unit,q,r){
  // 保存できた回答を、一覧の表示にもすぐ反映する（次に読み込むときはサーバーの記録が正）
  const items=marksFor(unit);if(!items||q.origin==='generated')return;
  const now=Date.now()+marksState.offset,day=86400000,old=items[q.id];
  const mark=old?.mark==='○'||r.correct?'○':r.near?'△':'×';
  items[q.id]={mark,views:(old?.views||0)+1,lastAt:now,dueAt:mark==='○'?null:mark==='△'?now+7*day:(Math.floor((now+32400000)/day)+1)*day-32400000};
 }
 function scheduleOrder(unit,pool){
  // ×（次の日から・古い順）→ △（1週間後から・古い順）→ まだ解いていない問題 → ○ → まだ時期でない△×
  const items=marksFor(unit);if(!items)return null;
  const now=Date.now()+marksState.offset,row=q=>items[q.id];
  const due=mark=>pool.filter(q=>row(q)?.mark===mark&&row(q).dueAt<=now).sort((a,b)=>row(a).lastAt-row(b).lastAt);
  return [...due('×'),...due('△'),...pool.filter(q=>!row(q)),...pool.filter(q=>row(q)?.mark==='○').sort((a,b)=>row(a).lastAt-row(b).lastAt),...pool.filter(q=>row(q)&&row(q).mark!=='○'&&row(q).dueAt>now).sort((a,b)=>row(a).dueAt-row(b).dueAt)];
 }
 function expectedText(q){const a=q.answer||{};const t=a.kind==='number'?String(a.value)+(a.units&&a.units[0]&&a.unitRequired?a.units[0]:''):a.kind==='numbers'?(a.values||[]).join('、'):a.kind==='exact'?String((a.accepted||[])[0]||''):(a.kind==='expr'||a.kind==='relation')?String(a.value||''):a.kind==='set'?(a.items||[]).map(x=>x[0]).join('、'):'';return t.replace(/-/g,'−');}
 function renderMarks(wrap,unit){
  const section=element('section');section.className='material-marks';
  const items=marksFor(unit)||{},qs=unit.questions,count=m=>qs.filter(q=>items[q.id]?.mark===m).length;
  section.append(element('h2',unit.title+'　○ '+count('○')+' / '+qs.length));
  section.append(element('p','○ '+count('○')+'問　△ '+count('△')+'問（惜しい・1週間後にもう一度）　× '+count('×')+'問（次の日の最初に出ます）　まだ '+qs.filter(q=>!items[q.id]).length+'問'));
  section.append(button('問題へ戻る',()=>{marksState.open=false;render();}),button('読み込み直す',()=>void loadMarks(unit,true),false,marksState.busy));
  if(marksState.message)section.append(element('p',marksState.message));
  const now=Date.now()+marksState.offset,list=element('ol');list.className='material-marks-list';
  qs.forEach((q,i)=>{
   const row=items[q.id],li=element('li'),main=element('div'),side=element('div');
   main.className='material-marks-main';side.className='material-marks-side';
   const prompt=element('p',q.prompt);prompt.className='material-question-prompt';
   main.append(element('strong','Q'+(i+1)),prompt,element('small',engine.address(unit,q)));
   const mark=element('span',row?row.mark:'－');mark.className='material-mark material-mark-'+(row?{'○':'ok','△':'near','×':'ng'}[row.mark]:'none');mark.setAttribute('aria-label',row?{'○':'正解','△':'惜しい','×':'不正解'}[row.mark]:'まだ');
   side.append(mark,element('small','見た回数 '+(row?row.views:0)+'回'));
   if(row&&row.mark!=='○')side.append(element('small',row.dueAt<=now?'出題する時期です':(row.mark==='△'?'あと'+Math.ceil((row.dueAt-now)/86400000)+'日で出ます':'次の日に出ます')));
   li.append(main,side);list.append(li);
  });
  section.append(list);wrap.append(section);
 }
 let dailyBusy=false,dailyAgain=false,rewardMessage='学習報酬を確認中です。';
 async function updateDaily(){
  if(!alive||state.sync!=='ready'||document.hidden||typeof bridge.daily!=='function')return;
  if(dailyBusy){dailyAgain=true;return;}
  const uid=bridge.identity();if(uid!==state.loadedIdentity)return;
  dailyBusy=true;
  try{await bridge.daily(uid);}catch(_){}
  if(alive&&uid===bridge.identity()&&typeof bridge.settleRewards==='function'){
   try{
    const receipt=await bridge.settleRewards(uid);
    if(alive&&uid===bridge.identity())rewardMessage='新教材の初回正解 '+receipt.earned+'問を報酬へ反映済みです（1問につき経験値1・コイン1）。';
   }catch(_){if(alive&&uid===bridge.identity())rewardMessage='学習報酬の保存を確認できませんでした。再確認できます。回答記録は残っています。';}
   if(alive&&uid===bridge.identity()){const status=host.querySelector('.material-rewards-status');if(status)status.textContent=rewardMessage;}
  }
  dailyBusy=false;if(dailyAgain){dailyAgain=false;void updateDaily();}
 }
 function renderReminder(){
  reminderNode?.remove?.();reminderNode=null;
  if(!alive||state.sync!=='ready'||bridge.identity()!==state.loadedIdentity||!reminder.rows.length||reminder.dismissed.has(reminder.key)||reviewState.open||activeReview)return;
  // 「今日の復習2問」が出ている間は、同じ誤答を二重に知らせないよう、3日後・7日後のお知らせは待つ
  if(!loginReview.dismissed&&loginReview.rows.length&&loginReview.uid===bridge.identity()&&!state.started)return;
  const card=element('aside');card.className='material-review-reminder';card.setAttribute('role','status');card.setAttribute('aria-label','復習のお知らせ');
  card.append(element('strong','そろそろ解き直してみよう'),element('p','3日後・7日後の復習が'+reminder.rows.length+(reminder.more?'件以上':'件')+'あります。'));
  const first=reminder.rows[0];card.append(element('small',first.subject+' - '+first.unitTitle));
  const actions=element('nav');actions.setAttribute('aria-label','復習のお知らせの操作');
  actions.append(button('この問題を解く',()=>{reminder.dismissed.add(reminder.key);openReview(first);}),button('復習を開く',()=>{reminder.dismissed.add(reminder.key);void loadReview();}),button('あとで',()=>{reminder.dismissed.add(reminder.key);renderReminder();}));
  card.append(actions);reminderNode=card;host.append(card);
 }
 async function checkReminder(){
  if(!alive||state.sync!=='ready'||state.busy||reminder.busy||document.hidden||typeof bridge.review!=='function')return;
  const uid=bridge.identity();if(uid!==state.loadedIdentity)return;
  const run=++reminder.epoch;reminder.busy=true;
  try{
   const page=await bridge.review(uid,{view:'due'});
   if(!alive||run!==reminder.epoch||uid!==bridge.identity()||uid!==state.loadedIdentity)return;
   if(!page||!Array.isArray(page.items)||page.items.some(row=>!row.question||!row.before||!row.due||typeof row.dueAt!=='number'))throw Error('invalid reminder');
   // ○△×で管理する小単元（×は次の日・△は1週間後に問題の順番で出る）は、3日・7日のお知らせに重ねて出さない（台帳25・2026-10-08）
   reminder.rows=page.items.filter(row=>units.find(u=>u.id===row.unitId)?.schedule!=='marks');reminder.more=!!page.next;
   reminder.key=uid+':'+page.items.map(row=>row.unitId+':'+row.mode+':'+row.questionId+':'+row.dueAt).join('|');
   renderReminder();
  }catch(_){if(alive&&run===reminder.epoch&&uid===bridge.identity()){reminder.rows=[];renderReminder();}}
  finally{if(run===reminder.epoch)reminder.busy=false;}
 }
 async function checkLoginReview(){
  if(!alive||state.sync!=='ready'||loginReview.busy||typeof bridge.review!=='function')return;
  const uid=bridge.identity();if(uid!==state.loadedIdentity||loginReview.uid===uid)return;
  loginReview.uid=uid;loginReview.rows=[];loginReview.dismissed=false;loginReview.busy=true;
  try{
   const page=await bridge.review(uid,{view:'all'});
   if(!alive||uid!==bridge.identity())return;
   const open=(page&&Array.isArray(page.items)?page.items:[]).filter(row=>row&&row.question&&row.before&&!row.after&&units.some(u=>u.id===row.unitId));
   // いちばん前にまちがえた問題から2つ（同じ問題は1回だけ）
   open.sort((a,b)=>(a.before.at||0)-(b.before.at||0));
   const seen=new Set();for(const row of open){const k=row.unitId+':'+row.mode+':'+row.questionId;if(seen.has(k))continue;seen.add(k);loginReview.rows.push(row);if(loginReview.rows.length===2)break;}
  }catch(_){loginReview.rows=[];}
  finally{loginReview.busy=false;if(alive&&uid===bridge.identity())render();}
 }
 function renderLoginReview(wrap){
  if(loginReview.dismissed||!loginReview.rows.length||loginReview.uid!==bridge.identity()||activeReview||reviewState.open||notebookState.open||state.started)return;
  const card=element('section');card.className='material-login-review';card.setAttribute('aria-label','今日の復習2問');
  card.append(element('h2','今日の復習 '+loginReview.rows.length+'問'),element('p','前にまちがえて、まだ正解していない問題です。20秒考えたら、ヒントも見られます。'));
  loginReview.rows.forEach((row,i)=>{const item=element('div');item.className='material-login-review-item';item.append(element('small',(i+1)+'問目：'+row.subject+' - '+row.unitTitle),element('p',row.question.prompt));item.append(button((i+1)+'問目を解く',()=>openLoginReview(row)));card.append(item);});
  card.append(button('あとで解く',()=>{loginReview.dismissed=true;render();}));wrap.append(card);
 }
 function openLoginReview(row){
  const key=row.unitId+':'+row.questionId;loginReview.gate[key]=Date.now()+20000;
  if(loginReview.timer!==null)root.clearTimeout(loginReview.timer);
  loginReview.timer=root.setTimeout(()=>{loginReview.timer=null;if(alive)render();},20050);
  openReview(row);
 }
 function closeReview(){notebookState.open=false;notebookState.epoch++;activeReview=null;reviewState.open=false;reviewState.epoch++;}
 async function loadReview(view='due',cursor){
  if(state.busy||state.sync!=='ready'||typeof bridge.review!=='function')return;
  const uid=bridge.identity(),run=++reviewState.epoch;
  notebookState.open=false;notebookState.epoch++;reminder.dismissed.add(reminder.key);historyState.open=false;historyState.epoch++;activeReview=null;
  state.started=false;state.session=null;reviewState.open=true;renderReminder();reviewState.busy=true;reviewState.view=view;reviewState.page=null;reviewState.message='復習を読み込んでいます。';render();
  try{
   const page=await bridge.review(uid,{view,cursor});
   if(!alive||run!==reviewState.epoch||uid!==bridge.identity())return;
   if(!page||!Array.isArray(page.items)||page.items.some(row=>!row.question||!row.before))throw Error('invalid review');
   reviewState.page=page;reviewState.message='';
  }catch(_){if(alive&&run===reviewState.epoch&&uid===bridge.identity())reviewState.message='復習を読み込めませんでした。再試行してください。';}
  finally{if(alive&&run===reviewState.epoch&&uid===bridge.identity()){reviewState.busy=false;render();}}
 }
 function openReview(row){
  const unit=units.find(u=>u.id===row.unitId),tab=row.mode==='test'?'テスト':'問題';
  const questions=tab==='テスト'?unit?.tests:unit?.questions,index=questions?.findIndex(q=>q.id===row.questionId);
  if(!unit||index===undefined||index<0)return;
  closeReview();activeReview=row;state.mode=kindOf(unit);state.grade=unit.grade;state.subject=unit.subject;state.unit=unit.id;state.tab=tab;state.started=true;state.session=null;state.times=Object.create(null);state.index=index;state.answer='';state.message='';questionClock='';pendingAttempt=null;render();
 }
 async function loadNotebook(){
  if(state.busy||typeof bridge.notebook!=='function')return;
  closeReview();historyState.open=false;historyState.epoch++;
  const uid=bridge.identity(),run=++notebookState.epoch;notebookState.open=true;notebookState.busy=true;notebookState.items=[];notebookState.message='苦手ノートを読み込んでいます。';notebookState.auto=[];notebookState.autoNext=null;void loadAutoNotebook();render();
  try{const items=await bridge.notebook(uid);if(!alive||run!==notebookState.epoch||uid!==bridge.identity())return;notebookState.items=items;notebookState.message='';}
  catch(_){if(alive&&run===notebookState.epoch&&uid===bridge.identity())notebookState.message='苦手ノートを読み込めませんでした。再試行してください。';}
  finally{if(alive&&run===notebookState.epoch&&uid===bridge.identity()){notebookState.busy=false;render();}}
 }
 // 間違えた問題・「わからない」は、保存済みの回答記録からサーバーがまとめて返す（重複なし）。
 // ノートのための書き込みはしないので、読み込みに失敗しても記録は失われない。
 async function loadAutoNotebook(cursor){
  if(typeof bridge.review!=='function')return;
  const uid=bridge.identity(),run=notebookState.epoch;notebookState.autoBusy=true;notebookState.autoMessage='自動で記録した問題を読み込んでいます。';if(cursor)render();
  try{
   const page=await bridge.review(uid,{view:'all',cursor});if(!alive||run!==notebookState.epoch||uid!==bridge.identity())return;
   const seen=new Set(notebookState.auto.map(autoKey));
   for(const row of page.items)if(row&&typeof row.unitId==='string'&&typeof row.questionId==='string'&&!seen.has(autoKey(row))){seen.add(autoKey(row));notebookState.auto.push(row);}
   notebookState.autoNext=page.next;notebookState.autoMessage='';
  }catch(_){if(alive&&run===notebookState.epoch&&uid===bridge.identity())notebookState.autoMessage='自動で記録した問題を読み込めませんでした。回答の記録は残っています。「読み込み直す」を押してください。';}
  finally{if(alive&&run===notebookState.epoch&&uid===bridge.identity()){notebookState.autoBusy=false;render();}}
 }
 function autoKey(row){return row.unitId+':'+row.mode+':'+row.questionId;}
 function autoMajor(row){const outline=Array.isArray(root.NobiMaterialOutline)?root.NobiMaterialOutline:[];const hit=outline.find(o=>o&&o.mode===row.unitMode&&o.grade===row.grade&&o.subject===row.subject&&o.title===row.unitTitle);return hit&&typeof hit.major==='string'?hit.major:row.unitTitle;}
 function answerText(q){const expected=q?.answer;return expected?.kind==='number'?String(expected.value)+(Array.isArray(expected.units)&&typeof expected.units[0]==='string'?expected.units[0]:''):expected?.kind==='numbers'?(expected.values||[]).join('、'):(expected?.accepted||[]).join(' ／ ');}
 function appendMistake(card,row){
  const mistake=row.mistake||{};
  card.append(element('p','自分の回答：'+(mistake.dontKnow?'「わからない」を選んだ':String(mistake.answer??row.before?.answer??''))));
  card.append(element('p','間違えた理由：'+(mistake.reason||'記録された理由はありません。')));
  card.append(element('p',row.complete?'復習日：3日後・7日後の復習を完了':'復習日：'+row.reviewDay+'日後（'+new Date(row.dueAt).toLocaleDateString('ja-JP')+'）'+(row.due?'・復習する時期です':'')));
  renderExplain(card,mistake.attemptId);
  if(row.question?.answer?.kind==='rubric')renderJudge(card,mistake.attemptId);
  renderSimilar(card,mistake.attemptId);
 }
 // AIが使える環境（確認版でキー登録済み）のときだけボタンを出す。確かめられなければ出さない。
 async function checkAi(){
  if(typeof bridge.aiStatus!=='function')return;
  const uid=bridge.identity(),epoch=aiState.epoch;
  try{const available=await bridge.aiStatus(uid);if(alive&&epoch===aiState.epoch&&uid===bridge.identity()&&available!==aiState.available){aiState.available=available;render();}}catch(_){}
 }
 // 記述の答えを、必要な内容ごとに意味で確かめてもらう（合否はサーバーが決める）
 async function judge(attemptId){
  const entry=aiState.judge[attemptId]||(aiState.judge[attemptId]={busy:false,result:null,message:''});if(entry.busy||entry.result)return;
  const uid=bridge.identity(),epoch=aiState.epoch;entry.busy=true;entry.message='';render();
  try{const result=await bridge.judge(attemptId,uid);if(!alive||epoch!==aiState.epoch||uid!==bridge.identity())return;entry.result=result;}
  catch(error){if(alive&&epoch===aiState.epoch&&uid===bridge.identity())entry.message=aiText(error);}
  finally{if(alive&&epoch===aiState.epoch&&uid===bridge.identity()){entry.busy=false;render();}}
 }
 function renderJudge(parent,attemptId){
  if(!aiState.available||(bridge.aiFeature&&!bridge.aiFeature('weakness'))||typeof bridge.judge!=='function'||!attemptId)return;
  const entry=aiState.judge[attemptId]||{},box=element('div');box.className='material-ai-box material-judge';
  if(entry.result){
   const r=entry.result,label={correct:'意味で見ると：正解（必要な内容をすべて満たしています）',partial:'意味で見ると：あと一歩（足りない内容があります）',incorrect:'意味で見ると：まだ（必要な内容が入っていません）'}[r.verdict];
   box.append(element('h4',label));const list=element('ul');for(const e of r.elements){const li=element('li',(e.met?'✓ ':'✗ ')+e.need+(e.evidence?'（「'+e.evidence+'」）':''));li.className=e.met?'judge-met':'judge-miss';list.append(li);}
   box.append(list,element('p','次に：'+r.comment),element('small','AIの判定です。記録の正誤は変わりません。気になるときは先生や家の人にも見てもらおう。'));
  }else box.append(button(entry.busy?'AIが確かめています…':'意味で確かめてもらう',()=>void judge(attemptId),false,!!entry.busy));
  if(entry.message){const note=element('p',entry.message);note.setAttribute('role','status');box.append(note);}
  parent.append(box);
 }
 // まちがえた問題に合う、確認済みの問題で練習する
 async function practiceSimilar(attemptId){
  const entry=aiState.similar[attemptId]||(aiState.similar[attemptId]={busy:false,message:''});if(entry.busy||state.busy)return;
  const uid=bridge.identity(),epoch=aiState.epoch;entry.busy=true;entry.message='';render();
  try{
   const r=await bridge.similar(attemptId,uid);if(!alive||epoch!==aiState.epoch||uid!==bridge.identity())return;
   const unit=units.find(u=>u.id===r.unitId);if(!unit||!r.ids.length)throw Error('この問題に合う問題が見つかりませんでした。');
   closeReview();notebookState.open=false;activeReview=null;state.mode=kindOf(unit);state.grade=unit.grade;state.subject=unit.subject;state.unit=unit.id;state.tab='問題';
   state.session=r.ids.filter(id=>unit.questions.some(q=>q.id===id));state.resultFor=null;state.sessionDone=[];state.sessionSkipped=[];state.times=Object.create(null);state.drafts=Object.create(null);state.started=true;state.index=0;state.answer='';questionClock='';pendingAttempt=null;
   state.message=(r.ai?'AIがえらんだ似た問題です。':'似た問題です。')+(r.reason||'');
  }catch(error){if(alive&&epoch===aiState.epoch&&uid===bridge.identity())entry.message=aiText(error);}
  finally{if(alive&&epoch===aiState.epoch&&uid===bridge.identity()){entry.busy=false;render();}}
 }
 function renderSimilar(parent,attemptId){
  if(typeof bridge.similar!=='function'||!attemptId)return;
  const entry=aiState.similar[attemptId]||{},box=element('div');box.className='material-similar';
  box.append(button(entry.busy?'似た問題をさがしています…':'似た問題で練習する',()=>void practiceSimilar(attemptId),false,!!entry.busy||state.busy));
  if(entry.message){const note=element('p',entry.message);note.setAttribute('role','status');box.append(note);}
  parent.append(box);
 }
 function aiText(error){const m=String(error?.message||'');return /^(AI|今月|今日|少し|この問題|ヒント|作った)/.test(m)?m:'AIは今は使えません。勉強はそのまま続けられます。';}
 async function explain(attemptId){
  const entry=aiState.explain[attemptId]||(aiState.explain[attemptId]={busy:false,result:null,message:''});if(entry.busy||entry.result)return;
  const uid=bridge.identity(),epoch=aiState.epoch;entry.busy=true;entry.message='';render();
  try{const result=await bridge.explain(attemptId,uid);if(!alive||epoch!==aiState.epoch||uid!==bridge.identity())return;entry.result=result;}
  catch(error){if(alive&&epoch===aiState.epoch&&uid===bridge.identity())entry.message=aiText(error);}
  finally{if(alive&&epoch===aiState.epoch&&uid===bridge.identity()){entry.busy=false;render();}}
 }
 function renderExplain(parent,attemptId){
  if(!aiState.available||typeof bridge.explain!=='function'||typeof attemptId!=='string'||!attemptId)return;
  const entry=aiState.explain[attemptId]||{},box=element('div');box.className='material-ai-box';
  if(entry.result){
   box.append(element('h4','AIの説明（参考）'),element('p','つまずいたところ：'+entry.result.reason));
   const steps=element('ol');entry.result.steps.forEach(step=>steps.append(element('li',step)));
   box.append(steps,element('p','次に気を付けること：'+entry.result.tip),element('small','AIの説明はまちがえることがあります。正誤と記録は変わりません。'));
  }else box.append(button(entry.busy?'AIが考えています…':'AIに説明してもらう',()=>void explain(attemptId),false,!!entry.busy));
  if(entry.message){const note=element('p',entry.message);note.setAttribute('role','status');box.append(note);}
  parent.append(box);
 }
 async function hint(unit,q){
  const key=unit.id+':'+q.id,entry=aiState.hints[key]||(aiState.hints[key]={busy:false,items:[],message:'',done:false});if(entry.busy||entry.done)return;
  const uid=bridge.identity(),epoch=aiState.epoch,level=entry.items.length+1;entry.busy=true;entry.message='';render();
  try{const result=await bridge.hint({unitId:unit.id,questionId:q.id,level},uid);if(!alive||epoch!==aiState.epoch||uid!==bridge.identity())return;entry.items.push(result.hint);entry.done=!result.more||entry.items.length>=3;}
  catch(error){if(alive&&epoch===aiState.epoch&&uid===bridge.identity())entry.message=aiText(error);}
  finally{if(alive&&epoch===aiState.epoch&&uid===bridge.identity()){entry.busy=false;render();}}
 }
 // 練習の問題だけ。答えは出さず、1段目から順に開く。確認テストでは出さない。
 function renderHints(article,unit,q){
  if(!aiState.available||typeof bridge.hint!=='function'||state.tab!=='問題'||q.type!=='input')return;
  const gate=loginReview.gate[unit.id+':'+q.id];
  if(gate&&Date.now()<gate){const wait=element('p','20秒考えたら、ヒントを見られます。');wait.className='material-hint-wait';article.append(wait);return;}
  const entry=aiState.hints[unit.id+':'+q.id]||{items:[]},box=element('div');box.className='material-ai-box material-hints';
  entry.items.forEach((text,i)=>box.append(element('p','ヒント'+(i+1)+'：'+text)));
  if(!entry.done&&entry.items.length<3)box.append(button(entry.busy?'ヒントを考えています…':entry.items.length?'次のヒント（'+(entry.items.length+1)+'段目）':'ヒントを見る（1段目）',()=>void hint(unit,q),false,!!entry.busy));
  if(entry.message){const note=element('p',entry.message);note.setAttribute('role','status');box.append(note);}
  article.append(box);
 }
 function renderAutoNotebook(section){
  const box=element('section');box.className='material-auto-notebook';box.append(element('h2','自動で記録した問題'));
  box.append(element('p',notebookState.autoMessage||'間違えた問題と「わからない」を選んだ問題を、回答の記録から自動でまとめています。同じ問題は1つにまとめ、上の自分で追加した問題とは重ねて表示しません。'));
  if(!notebookState.autoBusy&&!notebookState.autoMessage&&!notebookState.auto.length)box.append(element('p','まだ記録はありません。'));
  const manual=new Set(notebookState.items.filter(Boolean).map(autoKey)),rows=notebookState.auto.filter(row=>!manual.has(autoKey(row))).map(row=>({row,unit:units.find(u=>u.id===row.unitId),major:autoMajor(row)})).filter(x=>x.unit&&x.row.question&&typeof x.row.question.prompt==='string');
  const order=x=>{const list=x.row.mode==='test'?x.unit.tests||[]:x.unit.questions;return list.findIndex(q=>q.id===x.row.questionId);};
  rows.sort((a,b)=>a.row.subject.localeCompare(b.row.subject,'ja')||(a.row.grade-b.row.grade)||a.major.localeCompare(b.major,'ja')||a.row.unitTitle.localeCompare(b.row.unitTitle,'ja')||(a.row.mode===b.row.mode?0:a.row.mode==='study'?-1:1)||(order(a)-order(b)));
  let group='';
  for(const {row,unit,major} of rows){
   const label=row.subject+' '+row.grade+'年 ／ '+major+' ／ '+row.unitTitle;
   if(label!==group){group=label;box.append(element('h3',label));}
   const card=element('article');card.className='material-notebook-card material-auto-card';
   card.append(element('small','出典：'+engine.address(unit,row.question)+(row.mode==='test'?'（練習テスト）':'')),element('p',row.question.prompt));
   appendMistake(card,row);
   const details=element('details');details.append(element('summary','正解と解説を確認する'),element('p','正解：'+(answerText(row.question)||'下の解説で確かめてください。')));if(row.question.explanation)details.append(element('p',row.question.explanation));card.append(details);
   const nav=element('nav');nav.append(button('この問題を復習する',()=>openReview(row)));card.append(nav);
   box.append(card);
  }
  if(notebookState.autoNext)box.append(button('次の50件',()=>void loadAutoNotebook(notebookState.autoNext),false,notebookState.autoBusy));
  section.append(box);
 }
 async function bookmark(row){
  if(state.busy||typeof bridge.bookmark!=='function')return;
  const uid=bridge.identity();state.busy=true;reviewState.message='ノートを保存しています。';render();
  try{await bridge.bookmark({unitId:row.unitId,questionId:row.questionId,mode:row.mode,subject:row.subject,unitTitle:row.unitTitle,question:row.question,addedAt:Date.now()},uid);if(alive&&uid===bridge.identity())reviewState.message='苦手ノートへ保存しました。同じ問題は重複して追加しません。';}
  catch(_){if(alive&&uid===bridge.identity())reviewState.message='ノートを保存できませんでした。もう一度押してください。';}
  finally{state.busy=false;if(alive&&uid===bridge.identity())render();}
 }
 async function saveNote(row,note){
  if(state.busy||typeof bridge.annotate!=='function')return;
  const uid=bridge.identity(),key=row.unitId+':'+row.mode+':'+row.questionId,run=notebookState.epoch;
  state.busy=true;notebookState.message='メモを保存しています。';render();
  try{const items=await bridge.annotate(key,note,uid);if(alive&&run===notebookState.epoch&&uid===bridge.identity()){notebookState.items=items;delete notebookState.drafts[key];draftPut(uid,'n:'+key,'');notebookState.message='メモを保存しました。';}}
  catch(_){if(alive&&run===notebookState.epoch&&uid===bridge.identity())notebookState.message='メモを保存できませんでした。入力を残しています。もう一度押してください。';}
  finally{state.busy=false;if(alive&&run===notebookState.epoch&&uid===bridge.identity())render();}
 }
 function renderNotebook(wrap){
  const section=element('section');section.append(element('h2','自分の苦手ノート'));
  const actions=element('nav');actions.append(button('問題へ戻る',()=>{closeReview();render();}),button('読み込み直す',()=>void loadNotebook(),false,notebookState.busy));section.append(actions);
  section.append(element('p',notebookState.message||'復習一覧から選んだ問題と解説をまとめています。記録と元の問題は削除しません。印刷すると白黒の冊子として読めます。'));
  if(!notebookState.busy&&!notebookState.message&&!notebookState.items.length)section.append(element('p','まだ問題を追加していません。「誤答の復習」から選んでください。'));
  for(const row of notebookState.items){
   if(!row||typeof row.unitId!=='string'||typeof row.questionId!=='string'||!row.question||typeof row.question.prompt!=='string')continue;
   const card=element('article');card.className='material-notebook-card';card.append(element('h3',row.subject+' - '+row.unitTitle+(row.mode==='test'?'（練習テスト）':'')),element('p',row.question.prompt));
   const unit=units.find(u=>u.id===row.unitId);if(unit)card.append(element('small',engine.address(unit,row.question)));
   const recorded=notebookState.auto.find(a=>autoKey(a)===autoKey(row));if(recorded)appendMistake(card,recorded);
   const details=element('details');details.append(element('summary','答えと解説を確認する'));
   const expected=row.question.answer,value=expected?.kind==='number'?String(expected.value):expected?.kind==='numbers'?(expected.values||[]).join('、'):(expected?.accepted||[]).join(' ／ ');
   details.append(element('p','答え：'+value));if(row.question.explanation)details.append(element('p',row.question.explanation));card.append(details);
   if(typeof bridge.annotate==='function'){
    const key=row.unitId+':'+row.mode+':'+row.questionId,label=element('label','自分のメモ'),input=element('textarea');
    input.id='notebook-note-'+section.children.length;label.htmlFor=input.id;input.maxLength=2000;input.disabled=state.busy;input.value=notebookState.drafts[key]??draftGet(bridge.identity(),'n:'+key)??row.note??'';
    input.addEventListener('input',()=>{notebookState.drafts[key]=input.value;draftPut(bridge.identity(),'n:'+key,input.value);});const edit=element('div');edit.className='material-notebook-editor';edit.append(label,input,button('メモを保存',()=>void saveNote(row,input.value)));card.append(edit);
   }
   if(row.note){const note=element('p','自分のメモ：'+row.note);note.className='material-notebook-saved-note';card.append(note);}
   if(unit){const nav=element('nav');nav.append(button('この問題を復習する',()=>openReview(row)));card.append(nav);}
   section.append(card);
  }
  renderAutoNotebook(section);
  wrap.append(section);
 }
 function renderReview(wrap){
  const section=element('section');section.append(element('h2','誤答の復習'));
  section.append(button('問題へ戻る',()=>{closeReview();state.index=nextIndex(selected());render();}));
  section.append(button('復習する時期の問題',()=>void loadReview('due'),reviewState.view==='due',reviewState.busy));
  section.append(button('すべての誤答・解き直し',()=>void loadReview('all'),reviewState.view==='all',reviewState.busy));
  section.append(element('p',reviewState.message||'直近の誤答から3日後・7日後に復習します。早めに正解しても、予定の復習は残ります。'));
  if(reviewState.message&&!reviewState.busy)section.append(button('再試行',()=>void loadReview(reviewState.view)));
  const rows=reviewState.page?.items||[];
  if(reviewState.page&&!rows.length)section.append(element('p','この一覧に該当する問題はありません。'));
  for(const row of rows){
   const unit=units.find(u=>u.id===row.unitId);if(!unit)continue;
   const card=element('article');card.append(element('h3',row.subject+' - '+row.unitTitle+(row.mode==='test'?'（練習テスト）':'')));
   card.append(element('small',engine.address(unit,row.question)),element('p',row.question.prompt));
   card.append(element('p',row.complete?'3日後・7日後の復習を完了':row.reviewDay+'日後の復習：'+new Date(row.dueAt).toLocaleString('ja-JP')+(row.due?'（復習する時期です）':'')));
   const comparison=element('details');comparison.append(element('summary','自分の回答の変化'));
   const first=row.firstBefore||row.before;
   comparison.append(element('p','最初の誤答：'+first.answer),element('small',new Date(first.at).toLocaleString('ja-JP')));
   if(row.latestImprovement)comparison.append(element('p','その後の正解：'+row.latestImprovement.answer),element('small',new Date(row.latestImprovement.at).toLocaleString('ja-JP')));
   else comparison.append(element('p','その後の正解はまだありません。'));
   if(row.before.at!==first.at)comparison.append(element('p','直近の誤答：'+row.before.answer));
   card.append(comparison,button('この問題を復習する',()=>openReview(row),false,reviewState.busy));if(typeof bridge.bookmark==='function')card.append(button('苦手ノートに追加',()=>void bookmark(row),false,reviewState.busy));section.append(card);
  }
  if(reviewState.page?.next)section.append(button('次の50件',()=>void loadReview(reviewState.view,reviewState.page.next),false,reviewState.busy));
  wrap.append(section);
 }
 function renderHistory(wrap){
  const section=element('section');section.append(element('h2','回答履歴'));
  section.append(button('問題へ戻る',()=>{historyState.open=false;historyState.epoch++;render();}));
  section.append(button('最新の回答',()=>void loadHistory(),false,historyState.busy));
  section.append(element('p',historyState.message||'新しい教材の回答を、50件ずつ新しい順に表示します。'));
  if(historyState.page?.window?.label)section.append(element('p','今のプランでは、直近'+historyState.page.window.label+'の回答を表示します。それより前の回答・成績・ノートは消えていません。'));
  for(const row of historyState.page?.items||[]){
   const card=element('article');
   card.append(element('h3',row.subject+' - '+row.unitTitle+(row.mode==='test'?'（練習テスト）':'')));
   card.append(element('small',new Date(row.at).toLocaleString('ja-JP')+' ／ 解答時間 約'+Math.round(row.elapsedMs/1000)+'秒'));
   card.append(element('p',row.prompt),element('p','自分の答え：'+row.answer));
   const expected=row.expected;
   const value=expected?.kind==='number'?String(expected.value):expected?.kind==='numbers'?(expected.values||[]).join('、'):(expected?.accepted||[]).join(' ／ ');
   card.append(element('p','答え：'+value),element('p',row.result?.correct?'正解':row.result?.reason||'不正解'));
   if(row.explanation)card.append(element('p',row.explanation));section.append(card);
  }
  if(historyState.page?.next)section.append(button('さらに前の回答',()=>void loadHistory(historyState.page.next),false,historyState.busy));
  wrap.append(section);
 }
 function outline(){return (root.NobiMaterialOutline||[]).filter(row=>row.grade===state.grade&&row.subject===state.subject&&(row.mode==='drill'?'drill':'textbook')===state.mode&&state.mode!=='tokkun');}
 // ★1〜3（70問の小単元）：一度正解した「ちがう問題」の数で決める。同じ問題をくり返しても増えない。○35問で★1、56問で★2、70問すべてで★3
 function starCount(done,total){if(!total)return 0;return done>=total?3:done>=Math.ceil(total*0.8)?2:done>=Math.ceil(total/2)?1:0;}
 function stars(done,total){const n=starCount(done,total);return '★'.repeat(n)+'☆'.repeat(3-n);}
 function groupTitle(u){if(u.subject==='数学'&&/正.*数|負.*数/.test(u.title))return '正負の数';return u.majorTitle||u.title;}
 function renderUnits(wrap){
  const rows=outline(),all=choices(),groups=[...new Set([...rows.map(r=>r.major),...all.map(groupTitle)])];
  if(!state.major||!groups.includes(state.major))state.major=groups[0]||null;
  const section=element('section');section.className='material-selection';section.append(element('h3','大単元'));
  const nav=element('nav');nav.setAttribute('aria-label','大単元');groups.forEach(title=>nav.append(button(title,()=>{closeReview();marksState.open=false;state.major=title;state.started=false;state.session=null;state.unit=all.find(u=>groupTitle(u)===title)?.id||null;state.answer='';state.message='';render();},state.major===title)));section.append(nav);wrap.append(section);
  const subs=element('section');subs.className='material-selection';subs.append(element('h3','小単元'));
  const list=element('nav');list.setAttribute('aria-label','単元');
  all.filter(u=>groupTitle(u)===state.major).forEach(u=>{const c=engine.completion(u,state.progress[u.id]).study;list.append(button(u.title+'　○'+c.done+'/'+c.total+(u.schedule==='marks'?'　'+stars(c.done,c.total):''),()=>{closeReview();marksState.open=false;state.started=false;state.session=null;state.unit=u.id;state.index=nextIndex(u);state.answer='';state.message='';render();},state.unit===u.id));});
  rows.filter(r=>r.major===state.major).forEach(row=>{if(all.some(u=>u.title===row.title))return;const item=button(row.title+'（準備中）',()=>{},false,true);list.append(item);});
  if(!list.children.length&&state.mode==='tokkun'){const ready=[...new Set(units.filter(u=>kindOf(u)==='tokkun').map(u=>u.subject+u.grade+'年'))];subs.append(element('p','この教科・学年の特訓は作成中です。いま解けるのは'+ready.join('・')+'です。'));}
  else if(!list.children.length){const name={textbook:'教科書の問題',drill:'ドリル'}[state.mode],order=['国語','数学','英語','理科','社会'],ready=[...new Set(units.filter(u=>kindOf(u)===state.mode).sort((a,b)=>a.grade-b.grade||order.indexOf(a.subject)-order.indexOf(b.subject)).map(u=>u.subject+u.grade+'年'))];subs.append(element('p',name&&ready.length?'この教科・学年の'+name+'は準備中です。いま解けるのは'+ready.join('・')+'です。':'教材の見出しを確認中です。'));}subs.append(list);wrap.append(subs);   // 2年・3年など、まだ教材がないときは「準備中」と、いま解ける教科・学年を出す（2026-10-21）
 }
 // 計算問題か文章問題か（2026-10-21）：1行目が「次の計算をしよう」などで、2行目からが式だけなら計算。それ以外は文章
 function questionKind(q){
  const lines=String(q?.prompt||'').split('\n').map(x=>x.trim()).filter(Boolean);
  if(!lines.length)return 'word';
  const formula=/^[0-9a-zA-Z()（）+＋\-−–×÷*・=＝<>≦≧≤≥²³⁴⁵.,，、/\s|√πxyab]+$/;
  if(lines.length===1){const body=lines[0].replace(/(を|の)?(計算|簡単に|展開|因数分解)(して|しよう|しなさい|せよ)(ください)?。?$/,'');return body!==lines[0]&&formula.test(body)||formula.test(lines[0])?'calc':'word';}   // 「(-4)＋(-3)を計算してください。」も計算
  if(/計算|簡単に|展開|因数分解|解こう|解きなさい|求めよう|値を|式を/.test(lines[0])&&lines.slice(1).every(l=>formula.test(l)))return 'calc';
  return 'word';
 }
 function kindCounts(pool){let calc=0,word=0;for(const q of pool)(questionKind(q)==='calc'?calc++:word++);return {calc,word};}
 // 計算問題の数（スライダーで決めた数）。できる範囲に収める
 function calcTarget(avail){const n=state.count,lo=Math.max(0,n-avail.word),hi=Math.min(n,avail.calc);if(lo>hi)return null;const want=state.calcCount===null?Math.round(n*0.6):state.calcCount;return Math.min(hi,Math.max(lo,want));}
 async function prepareTestRoster(unit,ids,uid,run){
  if((state.tab==='テスト'||unit.mode==='kentei')&&bridge.testSessionAvailable?.())await bridge.beginTest({unitId:unit.id,mode:state.tab==='テスト'?'test':'study',questionIds:ids},uid);
  return alive&&run===loadEpoch&&uid===bridge.identity()&&state.unit===unit.id;
 }
 async function createSession(unit){
  if(state.busy||state.sync!=='ready')return;
  const uid=bridge.identity(),run=loadEpoch;if(uid!==state.loadedIdentity){void reload();return;}
  state.busy=true;state.message='問題を探しています。';render();
  try{
   let pool=state.tab==='テスト'?(unit.tests||[]):unit.questions;
   pool=pool.filter(q=>!pausedSet.has(unit.id+':'+q.id));
   if(unit.mode==='kentei'){const ids=pool.map(q=>q.id);if(!await prepareTestRoster(unit,ids,uid,run))return;state.session=ids;state.resultFor=null;state.sessionDone=[];state.sessionSkipped=[];state.times=Object.create(null);state.drafts=Object.create(null);state.started=true;state.index=0;state.answer='';state.message='';questionClock='';startedAt=Date.now();pendingAttempt=null;return;}   // 模擬検定は全問を本番の順番で（2026-10-22）
   if(state.focus==='weak'){
    if(typeof bridge.review!=='function')throw Error('苦手な問題の記録を確認できません。');
    let cursor,ids=new Set();
    for(let page=0;page<20;page++){
     const result=await bridge.review(uid,{view:'all',cursor});
     if(!alive||uid!==bridge.identity())return;
     for(const row of result.items||[])if(row.unitId===unit.id&&row.mode===(state.tab==='テスト'?'test':'study'))ids.add(row.questionId);
     cursor=result.next;if(!cursor)break;
     if(page===19)throw Error('復習記録が多いため、復習一覧から範囲を絞ってください。');
    }
    pool=pool.filter(q=>ids.has(q.id));
   }
   // AIで新しい問題を作る：検算できた問題だけがサーバーから返る。作れなくても確認済みの問題で続ける
   let fresh=[];
   if(aiState.makeNew&&aiState.available&&(!bridge.aiFeature||bridge.aiFeature('weakness'))&&state.tab==='問題'&&state.focus!=='weak'&&typeof bridge.generate==='function'){
    state.message='AIが新しい問題を作って、答えを検算しています。';render();
    try{await bridge.generate({unitId:unit.id,count:Math.min(5,state.count)},uid);}catch(error){state.message=aiText(error);}
    try{const list=await bridge.generated(unit.id,uid);if(!alive||uid!==bridge.identity())return;aiState.generated[unit.id]=list;fresh=list;}catch(_){}
   }
   const query=state.query.trim().toLocaleLowerCase();if(query)pool=pool.filter(q=>(q.prompt+' '+unit.title).toLocaleLowerCase().includes(query));
   if(pool.length<state.count)throw Error('条件に合う問題は'+pool.length+'問です。'+state.count+'問には足りません。検索条件・問題数を変えてください。');
   const done=state.progress[unit.id]?.[progressKey()]||[];
   let ordered=null;
   // ○△×の順番（古い×→時期の△→まだ→○）は70問の小単元だけ。以前からの100問の単元は、まだ正解していない問題から出す
   if(state.tab==='問題'&&state.focus!=='weak'&&unit.schedule==='marks'){if(!marksFor(unit))await loadMarks(unit);if(!alive||uid!==bridge.identity())return;ordered=scheduleOrder(unit,pool);}
   pool=[...fresh.slice(0,Math.ceil(state.count/3)),...(ordered||[...pool.filter(q=>!done.includes(q.id)),...pool.filter(q=>done.includes(q.id))])];
   const avail=kindCounts(pool),target=avail.calc&&avail.word?calcTarget(avail):null;
   if(target!==null){const calc=pool.filter(q=>questionKind(q)==='calc').slice(0,target),word=pool.filter(q=>questionKind(q)!=='calc').slice(0,state.count-target);pool=[...calc,...word];}   // 計算→文章の順に並べる
   else pool=[...pool.filter(q=>questionKind(q)==='calc'),...pool.filter(q=>questionKind(q)!=='calc')].slice(0,state.count).sort((a,b)=>(questionKind(a)==='calc'?0:1)-(questionKind(b)==='calc'?0:1));
   const ids=pool.slice(0,state.count).map(q=>q.id);if(!await prepareTestRoster(unit,ids,uid,run))return;
   state.session=ids;state.resultFor=null;state.sessionDone=[];state.sessionSkipped=[];state.times=Object.create(null);state.drafts=Object.create(null);state.started=true;state.index=0;state.answer='';state.message='';questionClock='';startedAt=Date.now();pendingAttempt=null;
  }catch(error){if(run===loadEpoch&&uid===bridge.identity())state.message=error.message||'問題を準備できませんでした。';}
  finally{if(alive&&run===loadEpoch){state.busy=false;if(uid===bridge.identity())render();else void reload();}}
 }
 // 計算と文章の割合：バーの点をスワイプして決める（例：15問なら 計算9問・文章6問）
 function renderFormula(article,card,key){
  const box=element('details');box.className='material-formula';box.append(element('summary','📐 公式カード（'+(selected()?.subject||'')+'）'));
  const dl=element('dl');card.items.forEach(([k,v])=>dl.append(element('dt',k),element('dd',v)));box.append(dl);
  if(card.calc){const calc=element('div');calc.className='material-calc';const label=element('label','🧮 電卓（＋−×÷とかっこ）'),inp=element('input'),out=element('output','');
   inp.id='material-calc-'+key;label.htmlFor=inp.id;inp.setAttribute('inputmode','decimal');inp.setAttribute('autocomplete','off');inp.maxLength=80;out.setAttribute('aria-live','polite');
   inp.addEventListener('input',()=>{const v=calcEval(inp.value);out.textContent=inp.value.trim()?(v===null?'式を確かめてください':'＝ '+v):'';});calc.append(label,inp,out);box.append(calc);}
  article.append(box);
 }
 function renderRatio(article,unit){
  const pool=(state.tab==='テスト'?(unit.tests||[]):unit.questions).filter(q=>!pausedSet.has(unit.id+':'+q.id)),avail=kindCounts(pool);
  if(!avail.calc||!avail.word)return;
  const n=state.count,lo=Math.max(0,n-avail.word),hi=Math.min(n,avail.calc),value=calcTarget(avail);if(value===null)return;
  const box=element('section');box.className='material-ratio';box.append(element('h3','計算と文章の割合'));
  const label=element('p','計算 '+value+'問 ・ 文章 '+(n-value)+'問');label.className='material-ratio-label';label.id='material-ratio-label';
  const range=element('input');range.type='range';range.id='material-ratio';range.min=String(lo);range.max=String(hi);range.step='1';range.value=String(value);range.disabled=state.busy||lo===hi;
  range.setAttribute('aria-label','計算問題の数');range.setAttribute('aria-valuetext','計算 '+value+'問、文章 '+(n-value)+'問');
  const paint=v=>{const pct=n?v/n*100:0;range.style?.setProperty?.('--calc',pct+'%');label.textContent='計算 '+v+'問 ・ 文章 '+(n-v)+'問';range.setAttribute('aria-valuetext','計算 '+v+'問、文章 '+(n-v)+'問');};
  paint(value);range.addEventListener('input',()=>{state.calcCount=Number(range.value);paint(state.calcCount);});
  const ends=element('div');ends.className='material-ratio-ends';ends.append(element('span','計算'),element('span','文章'));
  box.append(label,range,ends);article.append(box);
 }
 function examText(unit){const e=unit.exam||{};if(Array.isArray(e.parts))return e.parts.map(p=>p.name+' '+p.count+'問・'+p.minutes+'分').join('／');return (e.count||unit.questions.length)+'問'+(e.total?'・'+e.total+'点':'')+(e.minutes?'・'+e.minutes+'分':'');}
 // 模擬検定の結果（2026-10-22）：大問ごとの正解数と、合格のめやす。正解として保存できた問題だけを数える
 function renderExamResult(article,unit,questions){
  const ok=new Set(state.sessionDone),e=unit.exam||{},box=element('section');box.className='material-exam-result';box.append(element('h2','模擬検定の結果'));
  const parts=[...new Set(questions.map(x=>x.part||x.section||''))],table=element('dl');
  for(const t of parts){const qs=questions.filter(x=>(x.part||x.section||'')===t),n=qs.filter(x=>ok.has(x.id)).length;table.append(element('dt',t),element('dd',n+' / '+qs.length+'問'+(qs.some(x=>x.points)?'（'+qs.filter(x=>ok.has(x.id)).reduce((a,x)=>a+(x.points||0),0)+' / '+qs.reduce((a,x)=>a+(x.points||0),0)+'点）':'')));}
  box.append(table);let pass;
  if(Array.isArray(e.parts))pass=e.parts.every(p=>{const qs=questions.filter(x=>x.part===p.name);return qs.length&&qs.filter(x=>ok.has(x.id)).length>=Math.ceil(qs.length*p.passRate);});
  else if(e.total&&e.pass)pass=questions.filter(x=>ok.has(x.id)).reduce((a,x)=>a+(x.points||0),0)>=e.pass;
  else if(e.passRate)pass=questions.filter(x=>ok.has(x.id)).length>=Math.ceil(questions.length*e.passRate);
  box.append(element('p',(pass?'合格のめやすに届きました。':'合格のめやすにはまだ届いていません。')+'（'+(e.passNote||'')+'）'));
  article.append(box,button('もう一度',()=>void createSession(unit)),button('出題条件へ戻る',()=>{state.started=false;state.session=null;state.message='';render();}));
 }
 function renderCreate(article,unit){
  article.className='material-create';
  if(unit.mode==='kentei'){article.append(element('h2',unit.title),element('p',examText(unit)+'。'+(unit.exam?.passNote||'')),element('p','本番と同じ順番で全'+unit.questions.length+'問を出します。まちがえた問題はその場で正解と解説を見て、次へ進みます。時間は自分で計ってください。'));
   article.append(button('全画面で解く',()=>{state.fullscreenOnly=!state.fullscreenOnly;render();},state.fullscreenOnly),button('模擬検定を始める',()=>void createSession(unit),false,state.sync!=='ready'));const status=element('p',state.message||'');status.setAttribute('role','status');article.append(status);return;}
  if(unit.schedule==='marks'){const c=engine.completion(unit,state.progress[unit.id]).study,note=element('p','評価 '+stars(c.done,c.total)+'（★の条件：ちがう問題を'+Math.ceil(c.total/2)+'問正解で★1、'+Math.ceil(c.total*0.8)+'問で★2、'+c.total+'問すべてで★3。同じ問題をくり返しても増えません）');note.className='material-stars';article.append(note);}
  if(typeof bridge.marks==='function'&&state.tab==='問題'){const c=engine.completion(unit,state.progress[unit.id]).study;article.append(button('○ '+c.done+' / '+c.total+'　全'+c.total+'問を見る（○△×・見た回数）',()=>void loadMarks(unit,true),false,marksState.busy||state.sync!=='ready'));}
  article.append(element('h2','問題を作成する'));
  state.layout='batch';   // 1問ずつの形はやめて、全部を並べて表示する（2026-10-21 ユーザー指示）
  const amounts=element('nav');amounts.setAttribute('aria-label','問題数');[5,10,15,30,45,60].forEach(n=>amounts.append(button(n+'問',()=>{state.count=n;render();},state.count===n)));article.append(element('h3','問題数'),amounts);
  renderRatio(article,unit);
  const focuses=element('nav');[['all','単元から'],['weak','苦手な問題から']].forEach(([v,t])=>focuses.append(button(t,()=>{state.focus=v;render();},state.focus===v)));article.append(element('h3','出題範囲'),focuses);
  const label=element('label','問題を検索'),input=element('input');input.id='material-query';label.htmlFor=input.id;input.type='search';input.disabled=state.busy;input.value=state.query;input.maxLength=100;input.placeholder='例：数直線、絶対値';input.addEventListener('input',()=>{state.query=input.value;});article.append(label,input);
  const full=button('全画面で解く',()=>{state.fullscreenOnly=!state.fullscreenOnly;render();},state.fullscreenOnly);article.append(full);
  if(aiState.available&&(!bridge.aiFeature||bridge.aiFeature('weakness'))&&state.tab==='問題'&&typeof bridge.generate==='function')article.append(button('AIで新しい問題も作る（検算できた問題だけ）',()=>{aiState.makeNew=!aiState.makeNew;render();},aiState.makeNew));
  article.append(button('作成する',()=>void createSession(unit),false,state.sync!=='ready'));
  const status=element('p',state.message||'選んだ条件で、確認済みの問題を組み合わせます。');status.setAttribute('role','status');article.append(status);
 }
 function rememberVisibleAnswers(){
  if(!alive||state.busy||state.sync!=='ready'||bridge.identity()!==state.loadedIdentity)return;
  const unit=selected();if(!unit)return;
  const ids=new Set(bank(unit).map(q=>q.id));
  for(const input of host.querySelectorAll('textarea[data-material-question]')){
   const id=input.getAttribute('data-material-question');
   if(input.getAttribute('data-material-unit')!==unit.id||!ids.has(id)||input.disabled)continue;
   state.drafts[id]=input.value;draftPut(bridge.identity(),'a:'+id,input.value);
  }
 }
 function render(){
  if(!alive)return;host.replaceChildren();const wrap=element('div');wrap.className='materials';host.append(wrap);
  if(state.sync==='ready'&&bridge.identity()!==state.loadedIdentity){void reload();return;}
  const selectionHost=state.started?element('details'):wrap;
  if(state.started){selectionHost.className='material-conditions';selectionHost.append(element('summary','学年・教科・単元を変更'));wrap.append(selectionHost);}
  menu(selectionHost,'問題の種類',[['textbook','教科書'],['tokkun','特訓'],['kentei','検定'],['drill','ドリル']],'mode');
  if(state.mode==='kentei'){
   const mock=units.filter(u=>kindOf(u)==='kentei');
   const box=element('article');box.className='material-kentei';box.append(element('h2','検定'),element('p','英検の練習800問（5級・4級・3級・準2級）と、英検の単語2,000語（5級600・4級250・3級1,150）は「英検」タブで解けます。'+(mock.length?'漢検・数検・理科検定は、本番と同じ問題数の模擬検定をここで解けます。':'漢検・数検・理科検定の問題は準備中です。')));
   box.append(button('英検タブを開く',()=>{if(typeof root.switchView==='function')root.switchView('eiken');}),button('英検の単語を開く',()=>{if(typeof root.switchView!=='function')return;root.switchView('eiken');root.document?.getElementById('eiken-vocab')?.scrollIntoView?.({block:'start'});}));selectionHost.append(box);
   if(!mock.length)return;
   // 漢検・数検・理科検定の模擬検定（2026-10-22）：本番と同じ問題数・順番
   const sec=element('section');sec.className='material-selection';sec.append(element('h3','模擬検定'));const list=element('nav');list.setAttribute('aria-label','模擬検定');
   mock.forEach(u=>{const c=engine.completion(u,state.progress[u.id]).study;list.append(button(u.title+'　○'+c.done+'/'+c.total,()=>{closeReview();marksState.open=false;state.started=false;state.session=null;state.unit=u.id;state.tab='問題';state.index=nextIndex(u);state.answer='';state.message='';render();},state.unit===u.id));});
   sec.append(list);selectionHost.append(sec);
  }else{
  if(state.mode==='tokkun'&&!units.some(u=>kindOf(u)==='tokkun')){
   const box=element('article');box.className='material-kentei';box.append(element('h2','特訓'),element('p','特訓は、教科書の問題とは別の、考えて解く高難度の問題（各小単元70問）です。いま作成中で、できた単元から順に解けるようになります。'));wrap.append(box);return;
  }
  menu(selectionHost,'学年',[[1,'1年'],[2,'2年'],[3,'3年']],'grade');
  const subjects=['国語','数学','英語','理科','社会'];
  menu(selectionHost,'教科',subjects.map(s=>[s,s]),'subject');
  renderUnits(selectionHost);
  }
  if(state.sync!=='ready'){
   const notice=element('p',state.message);notice.setAttribute('role','status');wrap.append(notice);
   if(state.sync==='error')wrap.append(button('再試行',()=>void reload()));
   return;
  }
  renderReminder();
  renderLoginReview(wrap);
  if(typeof bridge.settleRewards==='function'){
   const status=element('small',rewardMessage);status.className='material-rewards-status';status.setAttribute('role','status');wrap.append(status,button('学習報酬を再確認',()=>void updateDaily()));
  }
  if(typeof bridge.history==='function')wrap.append(button('回答履歴',()=>void loadHistory(),historyState.open,historyState.busy));
  if(root.NobiTestReviews&&bridge.testSessionAvailable?.())wrap.append(button('AI解説の履歴',()=>void root.NobiTestReviews.openHistory()));
  if(typeof bridge.review==='function')wrap.append(button('誤答の復習',()=>void loadReview(),reviewState.open,reviewState.busy));
  if(typeof bridge.notebook==='function')wrap.append(button('苦手ノート',()=>void loadNotebook(),notebookState.open,notebookState.busy));
  if(notebookState.open){renderNotebook(wrap);return;}
  if(reviewState.open){renderReview(wrap);return;}
  if(historyState.open){renderHistory(wrap);return;}
  const unit=selected();
  if(marksState.open&&unit&&!state.started){renderMarks(wrap,unit);return;}
  if(state.tab==='教科書'&&unit?.textbook?.status!=='ready')state.tab='問題';
  if(state.tab==='テスト'&&!unit?.tests?.length){state.tab='問題';state.index=nextIndex(unit);}
  const tabs=element('nav');tabs.setAttribute('aria-label','学習の種類');const bookLink=unit?root.NobiTextbook?.linkFor?.(unit.subject,unit.grade,groupTitle(unit)):null;
  ['問題','教科書','テスト'].forEach(t=>tabs.append(button(t==='教科書'?'教科書を読む':t,()=>{if(t==='教科書'&&bookLink&&unit?.textbook?.status!=='ready'){root.NobiTextbook.openAt(bookLink);return;}closeReview();state.tab=t;state.started=false;state.session=null;state.index=nextIndex(selected());state.answer='';state.message='';render();},state.tab===t,t==='教科書'&&unit?.textbook?.status!=='ready'&&!bookLink||t==='テスト'&&!unit?.tests?.length)));wrap.append(tabs);
  const article=element('article');wrap.append(article);
  if(!unit){article.append(element('p','この学年・教科の教材は準備中です。'));return;}
  if(activeReview){article.append(element('p','復習中：保存後に回答の変化を確認できます。'),button('復習一覧へ戻る',()=>void loadReview('all')));}
  if(state.tab!=='教科書'&&!state.started&&!activeReview){renderCreate(article,unit);return;}
  if(state.started&&(unit.fullscreenRequired||state.fullscreenOnly)&&document.fullscreenElement!==host){article.append(element('h2','全画面で開く'),element('p',state.message||'この表示は全画面で解きます。終了すると、この画面へ戻ります。'),button('全画面にする',async()=>{try{if(typeof host.requestFullscreen!=='function')throw Error();await host.requestFullscreen();if(document.fullscreenElement!==host)throw Error();rememberVisibleAnswers();state.message='';render();}catch(_){state.message='全画面を開けませんでした。もう一度試すか、出題条件へ戻ってください。';render();}}),button('出題条件へ戻る',()=>{state.started=false;state.session=null;state.fullscreenOnly=false;state.message='';render();}));return;}
  if(state.started&&!activeReview)article.append(button('出題条件へ戻る',()=>{state.started=false;state.session=null;state.message='';render();}));
  if(state.started&&!activeReview&&(state.tab==='テスト'||unit.mode==='kentei')&&bridge.testSessionAvailable?.()&&root.NobiTestReviews)article.append(button('ノビーの全問解説',()=>void root.NobiTestReviews.openForCurrent(bridge,bridge.identity()),false,state.busy));
  article.append(element('h2',unit.subject+' - '+unit.title+' ('+bank(unit).length+'問)'));
  const completion=engine.completion(unit,state.progress[unit.id]),progress=element('details');progress.className='material-unit-progress';progress.open=state.progressOpen;progress.addEventListener('toggle',()=>{state.progressOpen=progress.open;});progress.setAttribute('aria-label','単元の進み具合');
  progress.append(element('summary','単元の進み具合：問題 '+completion.study.done+'/'+completion.study.total+' ／ 確認 '+completion.test.done+'/'+completion.test.total),element('small','一度正解を保存した問題を数えます。解き直しは重複せず、学力や正答率とは別の表示です。'));
  for(const [key,label] of [['study','問題'],['test','確認テスト']]){
   const value=completion[key],line=element('div');line.className='material-unit-progress-row';
   if(!value.total){line.append(element('p',label+'：準備中'));progress.append(line);continue;}
   const bar=element('progress');bar.max=value.total;bar.value=value.done;bar.setAttribute('aria-label',label+'の正解進捗');bar.textContent=value.done+' / '+value.total;
   line.append(element('p',label+'：'+value.done+' / '+value.total+'問（'+value.percent+'%）'+(value.complete?'・完了':'')),bar);progress.append(line);
  }article.append(progress);
  if(Array.isArray(unit.guide)&&unit.guide.length){
   const help=element('details');help.className='material-guide';help.append(element('summary','❓ 解き方・例題'));
   if(unit.id==='workbook-math-1-signed'){const link=element('a','図解つきの教科書を読む');link.href='/textbook-positive-negative.html';help.append(link);}
   unit.guide.forEach(item=>{if(typeof item.title!=='string'||typeof item.body!=='string')return;const section=element('section');section.append(element('h3',item.title),element('p',item.body));help.append(section);});article.append(help);
  }
  if(state.tab==='教科書'){
   const sections=unit.textbook?.status==='ready'?unit.textbook.sections||[]:[];
   if(!sections.length)article.append(element('p','この単元の教科書は準備中です。'));
   sections.forEach(s=>{const sec=element('section');sec.append(element('h3',s.title),element('p',s.body));if(s.example)sec.append(element('aside',s.example));article.append(sec);});return;
  }
  const questions=bank(unit),q=questions[state.index];
  if(!q&&unit.mode==='kentei'&&state.started){renderExamResult(article,unit,questions);return;}
  if(!q){article.append(element('p',state.tab==='テスト'?'今回のテストを終えました。':'今回の問題を終えました。'));if(state.message)article.append(element('p',state.message));return;}
  if(state.layout==='batch'&&!activeReview){
   article.append(element('p',questions.length+'問。答えは各問題ごとに確かめて保存します。'));
   const card0=state.tab==='テスト'?null:formulaFor(unit);if(card0)renderFormula(article,card0,'all');   // 公式カードは上に1つだけ
   const groups=unit.mode==='kentei'?[...new Set(questions.map(x=>x.part||x.section||''))].map(t=>({k:'word',title:'【'+t+'】',items:questions.map((item,i)=>({item,i})).filter(x=>(x.item.part||x.item.section||'')===t)})):[['calc','【計算問題】'],['word','【文章問題】']].map(([k,title])=>({k,title,items:questions.map((item,i)=>({item,i})).filter(x=>(questionKind(x.item)==='calc')===(k==='calc'))})).filter(g=>g.items.length);   // 模擬検定は大問ごと（2026-10-22）
   for(const g of groups){
    const head=element('h3',g.title);head.className='material-batch-head';article.append(head);
    const grid=element('div');grid.className='material-batch-grid material-batch-'+g.k;
    g.items.forEach(({item,i})=>{const card=element('section');card.className='material-batch-question';card.append(element('h3','('+(i+1)+')'));if(state.sessionDone.includes(item.id))card.append(element('p','正解・保存済み'));else if(state.sessionSkipped.includes(item.id))card.append(element('p','未正解・復習に残しました'));else renderQuestion(card,unit,item,i,true);
     if(state.resultFor===item.id&&state.message){const r=element('p',state.message);r.setAttribute('role','status');card.append(r);}   // 答えた結果は、その問題のカードに出す（2026-10-22）
     grid.append(card);});
    article.append(grid);
   }
   return;
  }
  renderQuestion(article,unit,q,state.index);
 }
 function renderQuestion(article,unit,q,questionIndex,compact){
  const questions=bank(unit);
  const clockKey=unit.id+':'+state.tab+':'+q.id;if(!compact){if(!state.times[clockKey])state.times[clockKey]=Date.now();if(questionClock!==clockKey){questionClock=clockKey;startedAt=state.times[clockKey];}}   // まとめて表示では、その問題の欄に入ったときから測る（2026-10-22）
  if(!compact){const count=element('p',(questionIndex+1)+' / '+questions.length);count.className='materials-count';article.append(count);}
  if(state.tab==='テスト')article.append(element('p','単元確認テスト（練習）。学習した内容を別の問題で確かめましょう。'));
  const prompt=element('p',q.prompt);prompt.className='material-question-prompt';const source=element('small',q.origin==='generated'?'AIが作った問題（答えは検算済み）':engine.address(unit,q));source.className='materials-source'+(q.origin==='generated'?' material-generated-label':'');article.append(source,prompt);if(q.image&&/^\/[a-zA-Z0-9_./-]+$/.test(q.image)&&!q.image.includes('..')){const img=element('img');img.src=q.image;img.alt=q.imageAlt||'問題の図';img.className='material-question-image';article.append(img);}
  if((unit.subject==='英語'||q.audioText)&&root.NobiMaterialTTS){
   const read=button('🔊 問題文を読み上げる',()=>{
    const result=root.NobiMaterialTTS.speak(q.audioText||q.prompt,{lang:unit.subject==='英語'?'en-US':'ja-JP'});
    if(!result.ok){state.message='この端末では読み上げを利用できません。';render();}
   });
   const stop=button('読み上げを停止',()=>root.NobiMaterialTTS.stop());
   const audio=element('div');audio.className='materials-audio';audio.append(read,stop);article.append(audio);
  }
  if(q.type==='reading')article.append(button('読み終えた',()=>void answer(q,'')));
  else{
   const form=element('form'),label=element('label','自分の答え'),input=element('textarea'),submit=element('button',state.busy?'保存中…':'答えを確認する');
   input.id=state.layout==='batch'&&!activeReview?'material-answer-'+questionIndex:'material-answer';label.htmlFor=input.id;input.value=state.drafts[q.id]??draftGet(bridge.identity(),'a:'+q.id)??(state.index===questionIndex?state.answer:'');input.placeholder='答えを入力';input.maxLength=4000;input.disabled=state.busy;input.setAttribute('autocomplete','off');submit.type='submit';submit.disabled=state.busy;
   input.setAttribute('data-answer-subject',unit.subject);input.setAttribute('lang',unit.subject==='英語'?'en':'ja');input.setAttribute('inputmode',unit.subject==='数学'?'decimal':'text');input.setAttribute('autocapitalize','none');input.setAttribute('spellcheck','false');
   input.setAttribute('data-material-question',q.id);input.setAttribute('data-material-unit',unit.id);
   if(compact)input.addEventListener('focus',()=>{if(!state.times[clockKey])state.times[clockKey]=Date.now();});
   input.addEventListener('input',()=>{state.drafts[q.id]=input.value;state.answer=input.value;draftPut(bridge.identity(),'a:'+q.id,input.value);});
   form.addEventListener('submit',e=>{e.preventDefault();void answer(q,input.value);});form.append(label,input,submit);article.append(form);
  }
  renderHints(article,unit,q);
  const card=state.tab==='テスト'||compact?null:formulaFor(unit);
  if(card)renderFormula(article,card,q.id);
  if(q.type!=='reading')article.append(button('わからない',()=>void answer(q,'わからない',true)));
  const status=element('p',state.index===questionIndex&&!(compact&&state.resultFor&&(state.sessionDone.includes(state.resultFor)||state.sessionSkipped.includes(state.resultFor)))?state.message:'');status.setAttribute('role','status');article.append(status);
  if(state.index===questionIndex&&aiState.explainFor&&aiState.explainFor.key===unit.id+':'+state.tab+':'+q.id){renderExplain(article,aiState.explainFor.attemptId);if(q.answer?.kind==='rubric')renderJudge(article,aiState.explainFor.attemptId);renderSimilar(article,aiState.explainFor.attemptId);}
 }
 const onFullscreen=()=>{if(alive&&state.started){rememberVisibleAnswers();render();}};document.addEventListener?.('fullscreenchange',onFullscreen);
 // 教科書の「問題を解く」から：教科書の問題・学年・教科・大単元を選んだ状態にする（問題は自動で始めない）
 // 計測用の読み取り口。本人・表示段階だけを確認し、回答内容や進捗は渡さない。
 function activity(){
  if(!alive||state.sync!=='ready'||bridge.identity()!==state.loadedIdentity||!state.started||state.mode==='kentei'||state.tab==='教科書'||notebookState.open||reviewState.open||historyState.open||marksState.open)return null;
  const unit=selected();if(!unit||unit.status!=='ready'||!bank(unit)[state.index])return null;
  if((unit.fullscreenRequired||state.fullscreenOnly)&&document.fullscreenElement!==host)return null;
  return {id:'question:'+unit.id,kind:'question',subject:unit.subject};
 }
 function focus(o){if(!alive||!o)return;if(typeof o.unitId==='string'){const hit=units.find(u=>u.id===o.unitId);if(!hit)return;closeReview();marksState.open=false;state.started=false;state.session=null;state.mode=kindOf(hit);state.grade=hit.grade;state.subject=hit.subject;state.major=groupTitle(hit);state.unit=hit.id;state.tab='問題';state.index=nextIndex(hit);state.answer='';state.message='';render();return;}closeReview();marksState.open=false;state.mode='textbook';if([1,2,3].includes(o.grade))state.grade=o.grade;if(typeof o.subject==='string')state.subject=o.subject;select(false);const hit=choices().find(u=>groupTitle(u)===o.major);if(hit){state.major=o.major;state.unit=hit.id;state.index=nextIndex(hit);}render();}
 let fractionWatch=null;try{fractionWatch=root.NobiFractions?.watch(host)||null;}catch(_){}   // 分数を縦に表示（2026-10-21・vertical-fractions.js）
 select(true);void reload();return {reload, focus, activity, destroy(){fractionWatch?.();draftFlush();try{root.removeEventListener?.('pagehide',draftHide);}catch(_){}alive=false;if(loginReview.timer!==null){root.clearTimeout(loginReview.timer);loginReview.timer=null;}document.removeEventListener?.('fullscreenchange',onFullscreen);if(document.fullscreenElement===host)document.exitFullscreen?.().catch(()=>{});reminder.epoch++;if(reminderTimer!==null)root.clearInterval(reminderTimer);document.removeEventListener?.('visibilitychange',onVisible);reminderNode?.remove?.();host.replaceChildren();}};
}
root.NobiMaterialUI=Object.freeze({mount,_formulaFor:formulaFor,_calcEval:calcEval});
})(globalThis);
