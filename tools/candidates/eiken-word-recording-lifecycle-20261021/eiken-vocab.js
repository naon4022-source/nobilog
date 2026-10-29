// 📚 英検の英単語カード（Claude・2026-10-07）
// ・5級600語／4級250語（英検/英検４級単語.pdf の127語＋のびログで選んだ123語）／3級1150語。データは site-assets/eiken-vocab-bank.json（tools/eiken-vocab/build.py で作る）
// ・5級・3級のリストは のびログ独自の目安（英検の公式リストではない）。例文と訳はすべて のびログ独自
// ・1枚に1問。英語→日本語（書いてある意味のどれでも正解）／日本語→英語（1文字ちがいは「惜しい」と出すが不正解）
// ・正解した単語＝「覚えた」→ 1か月（日本時間の日づけで翌月の同じ日）まで出さない。まちがえた単語→まだの単語→1か月たった単語の順に出す
// ・記録の形 {v:1, words:{id:{c:正解数, w:不正解数, due:次に出してよい時刻ms（0＝苦手で今すぐ）, last:最後に答えた時刻ms}}}
// ・保存先は呼び出し側が渡す（io.load / io.save）。この部品は問題データの読み込み以外の通信をしない。読み上げは端末の機能だけ
(function(root){'use strict';
const BANK_URLS=['/eiken-vocab-bank.json'].concat(/^(localhost|127\.0\.0\.1)$/.test(root.location&&root.location.hostname||'')?['/site-assets/eiken-vocab-bank.json']:[]);
const JST=9*3600000,ROUND=10,MODES=['5','4','3','random'];
const S={host:null,io:null,uid:'',bank:null,loading:null,tab:'5',dir:'ej',run:null,msg:'',store:null,dirty:false};
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=String(text);return e;}
function btn(label,cls,fn,aria){const b=el('button',cls,label);b.type='button';if(aria)b.setAttribute('aria-label',aria);b.addEventListener('click',fn);return b;}
function now(){let t=NaN;try{t=Number(S.io&&S.io.now?S.io.now():Date.now());}catch(_){t=NaN;}return Number.isFinite(t)?t:Date.now();}
function rnd(){try{if(S.io&&S.io.random){const r=Number(S.io.random());if(r>=0&&r<1)return r;}}catch(_){}return Math.random();}
// ---- 判定 ----
function kataToHira(s){return s.replace(/[ァ-ヶ]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60));}
function normJa(s){return kataToHira(String(s==null?'':s).normalize('NFKC')).replace(/[\s、。,.，．!！?？・「」『』〜~…]/g,'').replace(/[()（）]/g,'');}
function normEn(s){return String(s==null?'':s).normalize('NFKC').replace(/[’‘`´]/g,"'").toLowerCase().replace(/\s+/g,' ').trim().replace(/[.!?。]+$/,'').trim();}
function variants(m){
 const s=String(m).normalize('NFKC'),out=[s,s.replace(/[(（][^)）]*[)）]/g,''),s.replace(/[()（）]/g,'')];
 out.push(out[1].replace(/^[〜~](を|に|が|で|と|へ|の)?/,''));
 return out;
}
const FORMS=new WeakMap(),SHOW=new WeakMap();
function jaForms(w){if(!FORMS.has(w))FORMS.set(w,new Set([].concat(...(w.acc||w.ja||[]).map(variants)).map(normJa).filter(Boolean)));return FORMS.get(w);}
function showForms(w){if(!SHOW.has(w))SHOW.set(w,new Set([].concat(...(w.ja||[]).map(variants)).map(normJa).filter(x=>x.length>1)));return SHOW.get(w);}
function jaOne(F,g){if(!g)return false;if(F.has(g))return true;
 // 「勉強」→「勉強する」、「有名」→「有名な」のような書き落としは正解にする（2文字以上）
 return g.length>=2&&['する','な','の','に','だ'].some(x=>F.has(g+x));}
function judgeJa(w,given){
 const raw=String(given==null?'':given),g=normJa(raw);if(!g)return{ok:false,empty:true};
 const F=jaForms(w);if(jaOne(F,g))return{ok:true};
 const parts=raw.split(/[、,，\/／;；]/).map(normJa).filter(Boolean);
 if(parts.length>1&&parts.every(p=>jaOne(F,p)))return{ok:true};
 return{ok:false};
}
function lev1(a,b){if(a===b)return false;if(Math.abs(a.length-b.length)>1)return false;let i=0,j=0,d=0;while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;continue;}if(++d>1)return false;if(a.length>b.length)i++;else if(b.length>a.length)j++;else{i++;j++;}}return d+(a.length-i)+(b.length-j)===1;}
const INDEX=new WeakMap();
function enIndex(bank){if(!bank)return null;if(!INDEX.has(bank)){const m=new Map();for(const g of bank.grades)for(const w of g.words)for(const v of [w.w].concat(w.alt||[]))if(!m.has(normEn(v)))m.set(normEn(v),w);INDEX.set(bank,m);}return INDEX.get(bank);}
function judgeEn(w,given,bank){
 const g=normEn(given);if(!g)return{ok:false,empty:true};
 const acc=[w.w].concat(w.alt||[]).map(normEn);if(acc.includes(g))return{ok:true};
 // 同じ意味の別の単語（例：「話す」に talk と書いた）は、まちがいにせず、もう一度書いてもらう
 const o=enIndex(bank)&&enIndex(bank).get(g);
 if(o&&o!==w){const A=showForms(w);for(const x of showForms(o))if(A.has(x))return{ok:false,other:true,word:o.w};}
 const near=acc.some(a=>a.replace(/[^a-z]/g,'').length>=3&&lev1(g,a));
 return{ok:false,near};
}
// ---- 1か月（日本時間） ----
function jstParts(ms){const d=new Date(ms+JST);return{y:d.getUTCFullYear(),m:d.getUTCMonth(),d:d.getUTCDate()};}
function nextMonth(ms){const p=jstParts(ms);let y=p.y,m=p.m+1;if(m>11){m=0;y++;}const dim=new Date(Date.UTC(y,m+1,0)).getUTCDate();return Date.UTC(y,m,Math.min(p.d,dim))-JST;}
function md(ms){const p=jstParts(ms);return (p.m+1)+'月'+p.d+'日';}
// ---- 記録 ----
function cleanStore(r){
 const out={v:1,words:{}};if(!r||typeof r!=='object'||r.v!==1||!r.words||typeof r.words!=='object')return out;
 for(const [id,x] of Object.entries(r.words)){if(!/^[a-z0-9]{1,40}$/.test(id)||!x||typeof x!=='object')continue;const n=k=>Number.isFinite(+x[k])&&+x[k]>=0?+x[k]:0;out.words[id]={c:n('c'),w:n('w'),due:n('due'),last:n('last')};}
 return out;
}
function record(store,id,ok,t){const r=store.words[id]||(store.words[id]={c:0,w:0,due:0,last:0});if(ok){r.c++;r.due=nextMonth(t);}else{r.w++;r.due=0;}r.last=t;return r;}
function status(r,t){if(!r||(!r.c&&!r.w))return'new';if(r.due===0)return'weak';return r.due>t?'learned':'review';}
function shuffle(a,rand){for(let i=a.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
// 出す順：苦手（まちがいが多い順）→ まだ（リストの順）→ 1か月たった単語（古い順）。ランダムは苦手を先にして、残りを混ぜる
function queue(words,store,t,random,rand,n){
 const W=[],N=[],R=[];
 for(const w of words){const r=store.words[w.id],s=status(r,t);if(s==='weak')W.push(w);else if(s==='new')N.push(w);else if(s==='review')R.push(w);}
 const sc=w=>{const r=store.words[w.id];return r.w-r.c;};
 if(random){rand=rand||Math.random;return shuffle(W,rand).concat(shuffle(N.concat(R),rand)).slice(0,n||ROUND);}
 W.sort((a,b)=>sc(b)-sc(a)||store.words[a.id].last-store.words[b.id].last);
 R.sort((a,b)=>store.words[a.id].due-store.words[b.id].due);
 return W.concat(N,R).slice(0,n||ROUND);
}
function counts(words,store,t){const c={all:words.length,new:0,weak:0,learned:0,review:0,next:0};for(const w of words){const r=store.words[w.id],s=status(r,t);c[s]++;if(s==='learned'&&(!c.next||r.due<c.next))c.next=r.due;}return c;}
// 読み直すたびに io.load() を正とする。ただし保存に失敗して手元にしかない答えは、新しいほう（last が大きいほう）を残す
function load(){let r=null;try{r=S.io.load();}catch(_){r=null;}const fresh=cleanStore(r);
 if(S.dirty&&S.store)for(const [id,x] of Object.entries(S.store.words)){const y=fresh.words[id];if(!y||x.last>y.last)fresh.words[id]=x;}
 S.store=fresh;}
function save(){
 let ok=false;try{ok=S.io.save(JSON.parse(JSON.stringify(S.store)))!==false;}catch(_){ok=false;}
 S.dirty=!ok;S.msg=ok?'':'記録を保存できませんでした。この画面ではそのまま続けられます。通信が戻ったら、次に答えたときにまとめて保存します。';return ok;
}
function sameUser(){let u='';try{u=String(S.io.uid&&S.io.uid()||'');}catch(_){u='';}if(u===S.uid)return true;S.uid=u;S.run=null;S.msg='';S.store=null;S.dirty=false;load();return false;}
// ---- データ ----
async function loadBank(){
 if(S.bank)return S.bank;if(S.loading)return S.loading;
 S.loading=(async()=>{for(const u of BANK_URLS){try{const r=await fetch(u,{cache:'no-store',credentials:'same-origin'});if(!r.ok)continue;const d=await r.json();if(d&&d.v===1&&Array.isArray(d.grades)&&d.grades.length===3){S.bank=d;return d;}}catch(_){}}throw new Error('bank');})();
 try{return await S.loading;}finally{S.loading=null;}
}
function wordsOf(mode){return mode==='random'?[].concat(...S.bank.grades.map(g=>g.words)):(S.bank.grades.find(g=>g.id===mode)||{words:[]}).words;}
function byId(id){for(const g of S.bank.grades){const w=g.words.find(x=>x.id===id);if(w)return w;}return null;}
function label(mode){return mode==='random'?'ランダム':mode+'級';}
// ---- 音声（端末の読み上げだけ・録音や送信はしない） ----
function speak(text){const sy=root.speechSynthesis;if(!sy||!root.SpeechSynthesisUtterance||!text)return false;try{sy.cancel();const u=new SpeechSynthesisUtterance(String(text));u.lang='en-US';u.rate=.9;const vs=sy.getVoices()||[];const v=vs.find(v=>/^en-US/.test(v.lang)&&/Samantha|Google US|Alex/.test(v.name))||vs.find(v=>/^en-US/.test(v.lang));if(v)u.voice=v;sy.speak(u);return true;}catch(_){return false;}}
function speakBtn(text,what){const b=btn('🔊 聞く','ev-btn ev-speak',()=>{if(!speak(text))b.textContent='読み上げできません';},what+'を読み上げる');if(!root.speechSynthesis)b.hidden=true;return b;}
// ---- 画面 ----
let sentencePractice=null,wordPractice=null;
function stopSentencePractice(){sentencePractice?.dispose();sentencePractice=null;wordPractice?.dispose();wordPractice=null;}
function render(){
 stopSentencePractice();
 const h=S.host;if(!h)return;if(S.io)sameUser();h.replaceChildren();
 const head=el('div','ev-head');head.append(el('h3',null,'📚 英単語カード（5級・4級・3級）'),
  el('p','ev-note','カードの単語に答えます。正解した単語は「覚えた」になり、1か月は出てきません。まちがえた単語と、まだやっていない単語から先に出ます。'),
  el('p','ev-note ev-small','5級・3級の単語リストは、のびログ独自の目安です（英検の公式リストではありません）。4級は「英検4級単語」プリントの127語に、のびログで選んだ4級程度の123語を足した250語です。例文はのびログのオリジナルです。'));
 h.append(head);
 if(S.msg)h.append(el('p','ev-msg',S.msg));
 if(!S.bank){h.append(el('p','ev-note','単語を読みこんでいます…'));loadBank().then(render,()=>{h.replaceChildren(head,el('p','ev-msg','単語を読みこめませんでした。'),btn('もう一度読みこむ','ev-btn',()=>render()));});return;}
 if(!S.store)load();
 if(S.run)return renderRun(h);
 const tabs=el('div','ev-tabs');tabs.setAttribute('role','tablist');
 for(const m of MODES){const t=btn(m==='random'?'🎲 ランダム':label(m),'ev-tab'+(m===S.tab?' on':''),()=>{S.tab=m;render();});t.setAttribute('role','tab');t.setAttribute('aria-selected',m===S.tab?'true':'false');tabs.append(t);}
 h.append(tabs);
 const dirs=el('div','ev-dirs');
 for(const [d,txt] of [['ej','英語 → 日本語'],['je','日本語 → 英語'],...(root.speechSynthesis&&root.SpeechSynthesisUtterance?[['listen','🎧 聞いて書く']]:[])]){const b=btn(txt,'ev-dir'+(S.dir===d?' on':''),()=>{S.dir=d;render();});b.setAttribute('aria-pressed',S.dir===d?'true':'false');dirs.append(b);}
 h.append(dirs);
 const words=wordsOf(S.tab),t=now(),c=counts(words,S.store,t),box=el('section','ev-panel');
 box.append(el('p','ev-desc',S.tab==='random'?'5級・4級・3級の全'+c.all+'語から、まぜて出します。':label(S.tab)+'の'+c.all+'語を、リストの順に出します。'));
 const st=el('div','ev-stats');
 for(const [k,txt] of [['learned','覚えた'],['weak','苦手'],['new','まだ'],['review','もう一度']]){const s=el('div','ev-stat ev-'+k);s.append(el('span','ev-num',c[k]),el('span','ev-lab',txt));st.append(s);}
 box.append(st);
 const n=Math.min(ROUND,c.weak+c.new+c.review);
 if(n){box.append(btn(n+'問はじめる','ev-btn ev-main',()=>start(),label(S.tab)+'を'+n+'問はじめる'));}
 else box.append(el('p','ev-note','いまは出す単語がありません。'+(c.next?'次に出るのは '+md(c.next)+' です。':'')));
 h.append(box);
}
function start(){
 const t=now(),items=queue(wordsOf(S.tab),S.store,t,S.tab==='random',rnd,ROUND).map(w=>w.id);
 if(!items.length){render();return;}
 S.run={mode:S.tab,dir:S.dir,items,i:0,ans:{},other:''};render();
}
function answer(w,given,res){
 if(!sameUser()){render();return;}
 const R=S.run;R.other='';R.ans[w.id]={a:String(given).slice(0,100),ok:!!res.ok,near:!!res.near,gave:!!res.gave};
 const r=record(S.store,w.id,!!res.ok,now());R.ans[w.id].due=r.due;save();render();
}
function hintOf(w){const s=w.w,letters=s.replace(/[^A-Za-z]/g,'').length;return '「'+s[0]+'」で始まる '+letters+'文字'+(/[ \-']/.test(s)?'（記号や空白をふくむ）':'');}
function renderRun(h){
 const R=S.run,total=R.items.length;
 if(R.i>=total)return renderResult(h);
 const w=byId(R.items[R.i]);if(!w){R.i++;return renderRun(h);}
 const done=R.ans[w.id];
 const top=el('div','ev-runhead');top.append(el('span','ev-where',label(R.mode)+'（'+(R.dir==='ej'?'英→日':R.dir==='listen'?'聞いて書く':'日→英')+'）　'+(R.i+1)+' / '+total));
 top.append(btn('一覧へもどる','ev-btn',()=>{S.run=null;render();},'単語カードの一覧へもどる'));h.append(top);
 const bar=el('div','ev-bar');const fill=el('span');fill.style.width=Math.round(R.i/total*100)+'%';bar.append(fill);h.append(bar);
 const card=el('section','ev-card');card.setAttribute('aria-live','polite');
 card.append(el('p','ev-meta',w.grade+'級・'+w.pos));
 if(R.dir==='ej'){const p=el('p','ev-word');p.setAttribute('lang','en');p.append(document.createTextNode(w.w));card.append(p,speakBtn(w.w,'単語'),el('p','ev-ask','日本語の意味を書こう'));}
 // 🎧 聞いて書く（台帳35・2026-10-09）：端末の英語の声で単語を読み、聞こえたつづりを書く。答えたあとで単語と意味を見せる
 else if(R.dir==='listen'){if(!done&&R.spoke!==R.i){R.spoke=R.i;setTimeout(()=>speak(w.w),150);}card.append(speakBtn(w.w,'単語'),el('p','ev-ask','聞こえた英単語を書こう'+(R.other?'　ヒント：'+hintOf(w):'')));if(done){const p=el('p','ev-word');p.setAttribute('lang','en');p.append(document.createTextNode(w.w));card.append(p,el('p','ev-mean',w.ja.join('／')));}}
 else{card.append(el('p','ev-mean',w.ja.join('／')),el('p','ev-ask','英語で書こう　ヒント：'+hintOf(w)));}
 card.append(done?feedback(w,done):inputFor(w));
 h.append(card);
 if(done){const nav=el('div','ev-row');nav.append(btn(R.i+1<total?'次の単語へ':'結果を見る','ev-btn ev-main',()=>{R.i++;render();}));card.append(nav);setTimeout(()=>{try{nav.querySelector('button').focus();}catch(_){}},0);}
}
function inputFor(w){
 const R=S.run,wrap=el('div','ev-input'),box=el('input','ev-text');
 box.type='text';box.autocomplete='off';box.setAttribute('autocapitalize','off');box.spellcheck=false;box.maxLength=100;box.setAttribute('aria-label','答え');box.setAttribute('lang',R.dir==='ej'?'ja':'en');if(R.dir==='listen')box.setAttribute('aria-label','聞こえた英単語');
 wrap.append(box);
 if(R.other)wrap.append(el('p','ev-other','「'+R.other+'」も同じ意味の単語ですが、ここでは別の単語です。ヒントを見て、もう一度書いてみよう。'));
 const go=()=>{const v=box.value;if(!v.trim()){box.focus();return;}
  const res=R.dir==='ej'?judgeJa(w,v):judgeEn(w,v,S.bank);/* 聞いて書くも つづりで判定 */
  if(res.other){R.other=res.word;render();return;}
  answer(w,v,res);};
 const row=el('div','ev-row');row.append(btn('答え合わせ','ev-btn ev-main',go),btn('わからない','ev-btn',()=>answer(w,'',{ok:false,gave:true}),'わからないので答えを見る'));
 box.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing&&e.keyCode!==229){e.preventDefault();go();}});
 wrap.append(row);setTimeout(()=>{try{box.focus();}catch(_){}},0);return wrap;
}
// 🎙 まねして言う（シャドーイング・台帳35・2026-10-09）：3秒だけ録音して、すぐ聞き返す。録音は画面の中だけで、保存も送信もしない
function shadowBtn(word){
 if(!root.MediaRecorder||!root.navigator?.mediaDevices?.getUserMedia)return null;
 const owner=S.uid,io=S.io,wrap=el('div','ev-row ev-shadow');
 let disposed=false,pending=false,stream=null,recorder=null,timer=null,url=null,generation=0;
 const ownerMatches=()=>{try{return S.io===io&&S.uid===owner&&String(io.uid&&io.uid()||'')===owner;}catch(_){return false;}};
 const tracks=()=>{if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;};
 const releaseAudio=()=>{const a=wrap.querySelector('audio');if(a){a.pause();a.removeAttribute('src');a.load();a.remove();}if(url){root.URL.revokeObjectURL(url);url=null;}};
 const active=token=>!disposed&&token===generation&&wrap.isConnected&&ownerMatches();
 const b=btn('🎙 まねして言う（3秒）','ev-btn',async()=>{
  if(disposed||pending||recorder||!wrap.isConnected||!ownerMatches()||document.hidden)return;
  pending=true;b.disabled=true;const token=++generation;
  try{
   const acquired=await root.navigator.mediaDevices.getUserMedia({audio:true});
   if(disposed||token!==generation){acquired.getTracks().forEach(t=>t.stop());return;}
   if(!active(token)||document.hidden){acquired.getTracks().forEach(t=>t.stop());dispose();return;}
   stream=acquired;const rec=new root.MediaRecorder(stream),parts=[];recorder=rec;
   rec.ondataavailable=e=>{if(active(token)&&e.data?.size)parts.push(e.data);};
   rec.onstop=()=>{
    if(disposed||token!==generation)return;if(!active(token)){dispose();return;}clearTimeout(timer);timer=null;tracks();recorder=null;pending=false;
    releaseAudio();if(parts.length){const a=el('audio');a.controls=true;url=root.URL.createObjectURL(new root.Blob(parts,{type:rec.mimeType||parts[0].type||'audio/webm'}));a.src=url;a.setAttribute('aria-label','自分の声');wrap.append(a);}
    b.textContent=parts.length?'🎙 もう一度まねして言う（3秒）':'録音データがありません。もう一度お試しください。';b.disabled=false;
   };
   rec.onerror=()=>{if(!active(token))return;cancel();b.textContent='マイクが使えません';};
   speak(word);b.textContent='🔴 録音中…';rec.start();pending=false;
   timer=setTimeout(()=>{if(disposed||token!==generation)return;if(!active(token)){dispose();return;}if(rec.state!=='inactive')try{rec.stop();}catch(_){cancel();b.textContent='マイクが使えません';}},3000);
  }catch(_){if(token!==generation||disposed)return;cancel();b.textContent='マイクが使えません';}
 },'お手本を聞いたあと、自分の声を3秒録音して聞き返す');
 function cancel(){generation++;pending=false;clearTimeout(timer);timer=null;const rec=recorder;recorder=null;if(rec&&rec.state!=='inactive')try{rec.stop();}catch(_){}tracks();releaseAudio();b.disabled=disposed;}
 function dispose(){if(disposed)return;disposed=true;cancel();document.removeEventListener('visibilitychange',hidden);root.removeEventListener('pagehide',dispose);observer.disconnect();}
 const hidden=()=>{if(document.hidden){cancel();b.textContent='🎙 まねして言う（3秒）';}};
 const observer=new root.MutationObserver(()=>{if(!wrap.isConnected)dispose();});
 observer.observe(document.documentElement,{childList:true,subtree:true});document.addEventListener('visibilitychange',hidden);root.addEventListener('pagehide',dispose);
 wordPractice={dispose};wrap.append(b);return wrap;
}
function feedback(w,a){
 const f=el('div','ev-fb '+(a.ok?'ok':a.near?'near':'ng'));
 f.append(el('p','ev-mark',a.ok?'⭕ 正解！ 覚えた':a.near?'🔺 惜しい！ あと1文字（今回は不正解）':a.gave?'📖 答えを見て覚えよう':'❌ ざんねん'));
 if(!a.gave){f.append(el('p','ev-label','あなたの答え'),el('p','ev-mine',a.a||'（空欄）'));}
 f.append(el('p','ev-label','答え'));
 const ans=el('p','ev-model');const alts=(w.alt||[]).filter(x=>/^[a-z]+$/i.test(x)&&x.toLowerCase()!==w.w.toLowerCase().replace(/[^a-z]/g,''));const en=el('span','ev-en',w.w+(alts.length?'（'+alts.join('・')+' とも書く）':''));en.setAttribute('lang','en');ans.append(en,document.createTextNode('　'+w.ja.join('／')));
 f.append(ans,speakBtn(w.w,'単語'));{const sh=shadowBtn(w.w);if(sh)f.append(sh);}
 f.append(el('p','ev-label','例文'));const ex=el('p','ev-ex',w.ex);ex.setAttribute('lang','en');f.append(ex,el('p','ev-exja',w.exJa),speakBtn(w.ex,'例文'));
 if(root.NobiSentenceShadowing){const practice=el('div','ev-sentence-shadow');f.append(practice);sentencePractice=root.NobiSentenceShadowing.mount(practice,{text:w.ex,speak,stopSpeaking:()=>root.speechSynthesis?.cancel()});}
 f.append(el('p','ev-next',a.ok?'次にこの単語が出るのは '+md(a.due)+'（1か月後）です。':'苦手な単語に入れました。次も先に出ます。'));
 return f;
}
function renderResult(h){
 const R=S.run,box=el('section','ev-card ev-result'),ids=R.items.filter(id=>R.ans[id]);
 const score=ids.filter(id=>R.ans[id].ok).length;
 box.append(el('h4',null,label(R.mode)+' の結果'),el('p','ev-score',score+' / '+ids.length));
 const ol=el('ol','ev-list');
 for(const id of ids){const w=byId(id),a=R.ans[id],li=el('li',a.ok?'o':'x');li.append(el('span','ev-m',a.ok?'⭕':a.near?'🔺':'❌'));const e=el('span','ev-en',w.w);e.setAttribute('lang','en');li.append(e,document.createTextNode('　'+w.ja.join('／')));ol.append(li);}
 box.append(ol);
 const row=el('div','ev-row');row.append(btn('もう1回','ev-btn ev-main',()=>{S.tab=R.mode;S.dir=R.dir;start();},'同じ設定でもう1回'),btn('一覧へ','ev-btn',()=>{S.run=null;render();},'単語カードの一覧へ'));
 box.append(row);h.append(box);
}
function mount(host,io){
 if(!host||!io)return;let uid='';try{uid=String(io.uid&&io.uid()||'');}catch(_){uid='';}
 if(S.host!==host||S.uid!==uid){S.run=null;S.msg='';}
 if(S.uid!==uid){S.store=null;S.dirty=false;}
 S.host=host;S.io=io;S.uid=uid;load();render();
}
root.NobiEikenVocab=Object.freeze({mount,stopSentencePractice,_:Object.freeze({normJa,normEn,judgeJa,judgeEn,lev1,jstParts,nextMonth,record,status,queue,counts,cleanStore,ROUND})});
})(globalThis);
