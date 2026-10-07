// 🎫 英検の練習800問を、のびログの中で解く（Claude・2026-10-06）
// ・5級／4級／3級／準2級 × 20問 × 10セット（tools/eiken-series-bank.json から作った site-assets/eiken-practice-bank.json）
// ・穴うめ＝選択、並べかえ＝語句カードを順に押す、読解＝入力、作文と日本語で答える読解＝見本と観点を見て自分で〇をつける
// ・答えは1問ずつ保存（途中から再開できる）。結果・最高点・まちがえた問題だけの解き直し。ごほうび（コイン等）は出さない
// ・保存先は呼び出し側が渡す（index.html では本人の eikenPractice をサーバー同期）。この部品は記録をほかへ送らない
(function(root){'use strict';
const BANK_URLS=['/eiken-practice-bank.json'].concat(/^(localhost|127\.0\.0\.1)$/.test(root.location&&root.location.hostname||'')?['/site-assets/eiken-practice-bank.json']:[]);
const CHOICE=/\(([^()]*\/[^()]*)\)/g;
const S={host:null,io:null,uid:'',bank:null,loading:null,grade:'5',run:null,msg:''};
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=String(text);return e;}
function btn(label,cls,fn,aria){const b=el('button',cls,label);b.type='button';if(aria)b.setAttribute('aria-label',aria);b.addEventListener('click',fn);return b;}
// ---- 判定 ----
function norm(s){return String(s==null?'':s).normalize('NFKC').replace(/[’‘`´]/g,"'").replace(/[“”]/g,'"').replace(/\s+/g,' ').trim().replace(/\s*([,.!?])/g,'$1').replace(/[.!?]+$/,'').toLowerCase();}
function lev1(a,b){if(a===b)return false;if(Math.abs(a.length-b.length)>1)return false;let i=0,j=0,d=0;while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;continue;}if(++d>1)return false;if(a.length>b.length)i++;else if(b.length>a.length)j++;else{i++;j++;}}return d+(a.length-i)+(b.length-j)===1;}
function judge(q,given){
 const g=norm(given),acc=[q.answer].concat(q.accepted||[]).map(norm);
 if(!g)return{ok:false,empty:true};
 if(acc.includes(g))return{ok:true};
 // 1文字ちがい（英字3文字以上）は「惜しい」。正解にはしない
 const near=acc.some(a=>/^[a-z' -]{3,}$/.test(a)&&lev1(g,a));
 return{ok:false,near};
}
function parts(q){
 const m=[...String(q.q).matchAll(CHOICE)];const last=m[m.length-1];
 const opts=last?last[1].split('/').map(x=>x.trim()).filter(Boolean):[];
 const text=last?(q.q.slice(0,last.index)+(q.kind==='cloze'?'(　　　)':'')+q.q.slice(last.index+last[0].length)):q.q;
 return{opts,text:text.replace('（語句を並べ替えて英文にする）','').trim()};
}
// 語句カードの並びは問題ごとに毎回同じ（端末や再開で変わらない）。正解と同じ並びになったら1つずらす
function shuffled(list,seed,answers){const a=list.slice();let h=0;for(const c of seed)h=(h*31+c.charCodeAt(0))>>>0;for(let i=a.length-1;i>0;i--){h=(h*1103515245+12345)>>>0;const j=h%(i+1);[a[i],a[j]]=[a[j],a[i]];}
 if(a.length>1&&(answers||[]).map(norm).includes(norm(a.join(' '))))a.push(a.shift());
 return a;}
// ---- 記録 ----
function rec(){let r=null;try{r=S.io.load();}catch(_){r=null;}if(!r||typeof r!=='object'||r.v!==1||typeof r.sets!=='object'||!r.sets)r={v:1,sets:{}};return r;}
function save(r){let ok=false;try{ok=S.io.save(r)!==false;}catch(_){ok=false;}S.msg=ok?'':'記録を保存できませんでした。通信が戻ったら、もう一度答えると保存されます。';return ok;}
function setKey(g,n){return g+'-'+String(n).padStart(2,'0');}
// ---- データ ----
async function loadBank(){
 if(S.bank)return S.bank;if(S.loading)return S.loading;
 S.loading=(async()=>{for(const u of BANK_URLS){try{const r=await fetch(u,{cache:'no-store',credentials:'same-origin'});if(!r.ok)continue;const d=await r.json();if(d&&d.v===1&&Array.isArray(d.grades)&&d.grades.length===4){S.bank=d;return d;}}catch(_){}}throw new Error('bank');})();
 try{return await S.loading;}finally{S.loading=null;}
}
function gradeOf(id){return S.bank.grades.find(g=>g.id===id);}
// ---- 音声（英文だけ・端末の読み上げ。録音や外部送信はしない） ----
function speak(text){const sy=root.speechSynthesis;if(!sy||!root.SpeechSynthesisUtterance||!text)return false;try{sy.cancel();const u=new SpeechSynthesisUtterance(String(text));u.lang='en-US';u.rate=.92;const v=(sy.getVoices()||[]).find(v=>/^en-US/.test(v.lang)&&/Samantha|Google US|Alex/.test(v.name))||(sy.getVoices()||[]).find(v=>/^en-US/.test(v.lang));if(v)u.voice=v;sy.speak(u);return true;}catch(_){return false;}}
function speakBtn(text){const b=btn('🔊 英語を聞く','ep-btn ep-speak',()=>{if(!speak(text))b.textContent='この端末では読み上げできません';},'英語を読み上げる');if(!root.speechSynthesis)b.hidden=true;return b;}
// ---- 画面 ----
function render(){
 const h=S.host;if(!h)return;h.replaceChildren();
 const head=el('div','ep-head');head.append(el('h3',null,'🎫 のびログで解く（練習 800問）'),el('p','ep-note','のびログの独自の練習問題です（公式の過去問ではありません・リスニングはありません）。答えは1問ずつ自動で保存され、途中から続けられます。'));h.append(head);
 if(S.msg)h.append(el('p','ep-msg',S.msg));
 if(!S.bank){const p=el('p','ep-note','問題を読みこんでいます…');h.append(p);loadBank().then(render,()=>{h.replaceChildren(head,el('p','ep-msg','問題を読みこめませんでした。'),btn('もう一度読みこむ','ep-btn',()=>render()));});return;}
 if(S.run)return renderRun(h);
 const tabs=el('div','ep-tabs');tabs.setAttribute('role','tablist');
 for(const g of S.bank.grades){const t=btn(g.label,'ep-tab'+(g.id===S.grade?' on':''),()=>{S.grade=g.id;render();});t.setAttribute('role','tab');t.setAttribute('aria-selected',g.id===S.grade?'true':'false');tabs.append(t);}
 h.append(tabs);
 const r=rec(),G=gradeOf(S.grade),grid=el('div','ep-grid');
 for(const s of G.sets){
  const k=setKey(G.id,s.n),R=r.sets[k]||{},card=el('article','ep-set');
  card.append(el('h4',null,'練習'+String(s.n).padStart(2,'0')));
  const st=R.draft?('とちゅう '+Object.keys(R.draft.answers||{}).length+'/'+R.draft.order.length):(R.best!=null?('最高 '+R.best+'/20・'+R.attempts+'回'):'まだ解いていません');
  card.append(el('p','ep-state',st));
  const row=el('div','ep-row');
  if(R.draft)row.append(btn('続きから','ep-btn ep-main',()=>start(G.id,s.n,'resume'),G.label+' 練習'+s.n+'を続きから'));
  row.append(btn(R.best!=null||R.draft?'はじめから':'解く','ep-btn'+(R.draft?'':' ep-main'),()=>start(G.id,s.n,'all'),G.label+' 練習'+s.n+'を解く'));
  const wrong=R.last?Object.entries(R.last.marks||{}).filter(([,m])=>m!=='o').map(([id])=>id):[];
  if(wrong.length)row.append(btn('まちがいだけ（'+wrong.length+'問）','ep-btn',()=>start(G.id,s.n,'wrong'),G.label+' 練習'+s.n+'のまちがえた問題だけ'));
  card.append(row);grid.append(card);
 }
 h.append(grid);
}
function start(g,n,mode){
 const r=rec(),k=setKey(g,n),R=r.sets[k]=r.sets[k]||{},set=gradeOf(g).sets.find(s=>s.n===n);
 if(mode==='resume'&&R.draft){S.run={g,n,k,set,draft:R.draft,i:firstOpen(R.draft)};render();return;}
 let order=set.questions.map(q=>q.id);
 if(mode==='wrong'&&R.last)order=order.filter(id=>(R.last.marks||{})[id]!=='o');
 R.draft={mode:mode==='wrong'?'wrong':'all',order,answers:{},at:Date.now()};save(r);
 S.run={g,n,k,set,draft:R.draft,i:0};render();
}
function firstOpen(d){const i=d.order.findIndex(id=>!(d.answers||{})[id]);return i<0?d.order.length:i;}
function qById(id){return S.run.set.questions.find(q=>q.id===id);}
function persist(){const r=rec();const R=r.sets[S.run.k]=r.sets[S.run.k]||{};R.draft=S.run.draft;return save(r);}
function answer(q,given,res){S.run.draft.answers[q.id]={a:String(given).slice(0,600),ok:!!res.ok,near:!!res.near,self:!!res.self};persist();render();}
function renderRun(h){
 const R=S.run,d=R.draft,total=d.order.length,G=gradeOf(R.g);
 if(R.i>=total)return renderResult(h);
 const q=qById(d.order[R.i]),done=d.answers[q.id];
 const top=el('div','ep-runhead');top.append(el('span','ep-where',G.label+' 練習'+String(R.n).padStart(2,'0')+(d.mode==='wrong'?'（まちがいだけ）':'')+'　'+(R.i+1)+' / '+total));
 top.append(btn('一覧へもどる','ep-btn',()=>{S.run=null;render();},'セットの一覧へもどる'));h.append(top);
 const bar=el('div','ep-bar');const fill=el('span');fill.style.width=Math.round(R.i/total*100)+'%';bar.append(fill);h.append(bar);
 const card=el('section','ep-card');card.setAttribute('aria-live','polite');
 card.append(el('p','ep-kind',{cloze:'（　）に入る語を選ぼう',order:'語句をならべて英文をつくろう（使う順に押す）',reading:'英文を読んで答えよう',writing:'英作文（見本と観点で自分で〇をつける）'}[q.kind]));
 if(q.kind==='reading'){const box=el('div','ep-passage');if(q.title)box.append(el('h4',null,q.title));box.append(el('p',null,q.context));box.append(speakBtn(q.context));card.append(box);}
 const P=(q.kind==='cloze'||q.kind==='order')?parts(q):{text:q.q,opts:[]};
 const qt=el('p','ep-q');for(const [i,line] of P.text.split(/\n|(?= B: )/).entries()){if(i)qt.append(el('br'));qt.append(document.createTextNode(line.trim()));}card.append(qt);
 if(done)card.append(feedback(q,done));else card.append(inputFor(q,P));
 h.append(card);
 if(done){const nav=el('div','ep-row');nav.append(btn(R.i+1<total?'次の問題へ':'結果を見る','ep-btn ep-main',()=>{R.i++;render();}));card.append(nav);setTimeout(()=>nav.querySelector('button')?.focus(),0);}
}
function inputFor(q,P){
 const wrap=el('div','ep-input');
 if(q.kind==='cloze'){const row=el('div','ep-choices');P.opts.forEach((o,i)=>row.append(btn((i+1)+'  '+o,'ep-choice',()=>answer(q,o,judge(q,o)),'選択肢'+(i+1)+' '+o)));wrap.append(row);return wrap;}
 if(q.kind==='order'){
  const picked=[],line=el('div','ep-line'),pool=el('div','ep-pool');line.setAttribute('aria-label','つくった英文');
  const tiles=shuffled(P.opts,q.id,[q.answer].concat(q.accepted||[]));
  const draw=()=>{line.replaceChildren();pool.replaceChildren();
   if(!picked.length)line.append(el('span','ep-ph','ここに英文ができます'));
   picked.forEach((w,i)=>line.append(btn(w,'ep-tile on',()=>{picked.splice(i,1);draw();},w+'をもどす')));
   const used=picked.slice();
   tiles.forEach(w=>{const k=used.indexOf(w);if(k>=0){used.splice(k,1);return;}pool.append(btn(w,'ep-tile',()=>{picked.push(w);draw();},w+'を使う'));});
   ok.disabled=picked.length!==tiles.length;};
  const ok=btn('答え合わせ','ep-btn ep-main',()=>{const s=picked.join(' ');answer(q,s,judge(q,s));});
  wrap.append(line,pool,el('div','ep-row'));wrap.lastChild.append(btn('やり直す','ep-btn',()=>{picked.length=0;draw();}),ok);draw();return wrap;
 }
 const multi=q.kind==='writing'||q.self;const box=el(multi?'textarea':'input','ep-text');
 if(!multi){box.type='text';box.autocomplete='off';}
 const jp=q.self&&q.kind!=='writing';box.setAttribute('lang',jp?'ja':'en');box.setAttribute('autocapitalize','off');box.spellcheck=false;box.setAttribute('aria-label','答え');box.maxLength=600;
 if(multi)box.rows=q.kind==='writing'?6:3;
 wrap.append(box);
 const cnt=el('p','ep-count');if(q.kind==='writing'){const up=()=>{cnt.textContent='語数：'+(box.value.trim()?box.value.trim().split(/\s+/).length:0)+'語';};box.addEventListener('input',up);up();wrap.append(cnt);}
 const row=el('div','ep-row');
 if(q.self){row.append(btn('見本を見て〇をつける','ep-btn ep-main',()=>{wrap.replaceChildren(selfCheck(q,box.value));}));}
 else{const go=()=>{if(!box.value.trim()){box.focus();return;}answer(q,box.value,judge(q,box.value));};row.append(btn('答え合わせ','ep-btn ep-main',go));box.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing&&e.keyCode!==229){e.preventDefault();go();}});}
 wrap.append(row);setTimeout(()=>box.focus(),0);return wrap;
}
function selfCheck(q,given){
 const w=el('div','ep-self');
 w.append(el('p','ep-label','あなたの答え'),el('p','ep-mine',given.trim()||'（空欄）'));
 w.append(el('p','ep-label','見本の答え（これだけが正解ではありません）'),el('p','ep-model',q.answer));
 if(q.kind==='writing'||/[A-Za-z]/.test(q.answer))w.append(speakBtn(q.answer));
 if(q.rubric&&q.rubric.length){w.append(el('p','ep-label','観点（すべて満たせば〇）'));const ul=el('ul','ep-rubric');q.rubric.forEach(x=>ul.append(el('li',null,x)));w.append(ul);}
 if(q.why)w.append(el('p','ep-why',q.why));
 const row=el('div','ep-row');
 row.append(btn('〇 できた','ep-btn ep-main',()=>answer(q,given,{ok:true,self:true})),btn('× まだ','ep-btn',()=>answer(q,given,{ok:false,self:true})));w.append(row);return w;
}
function feedback(q,a){
 const f=el('div','ep-fb '+(a.ok?'ok':a.near?'near':'ng'));
 f.append(el('p','ep-mark',a.ok?(a.self?'〇（自分で〇をつけた）':'⭕ 正解'):a.near?'🔺 惜しい！あと1文字':(a.self?'×（自分で×をつけた）':'❌ ざんねん')));
 f.append(el('p','ep-label','あなたの答え'),el('p','ep-mine',a.a||'（空欄）'));
 f.append(el('p','ep-label','正しい答え'),el('p','ep-model',q.answer));
 if(q.why)f.append(el('p','ep-why',q.why));
 const en=q.kind==='cloze'?parts(q).text.replace('(　　　)',q.answer):(q.kind==='order'||q.kind==='writing')?q.answer:'';
 if(en&&/[A-Za-z]/.test(en))f.append(speakBtn(en.replace(/^[^A-Za-z]*/,'')));
 return f;
}
function renderResult(h){
 const R=S.run,d=R.draft,G=gradeOf(R.g),marks={};let score=0;
 for(const id of d.order){const a=d.answers[id];marks[id]=a&&a.ok?'o':'x';if(a&&a.ok)score++;}
 if(!R.recorded){
  const r=rec(),S2=r.sets[R.k]=r.sets[R.k]||{};
  const prev=(S2.last&&S2.last.marks)||{},all=Object.assign({},prev,marks);
  const full=R.set.questions.map(q=>q.id),fullScore=full.filter(id=>all[id]==='o').length;
  S2.last={score:fullScore,at:Date.now(),marks:all,mode:d.mode};
  S2.best=Math.max(S2.best||0,fullScore);S2.attempts=(S2.attempts||0)+1;delete S2.draft;save(r);R.recorded={fullScore};
 }
 const box=el('section','ep-card ep-result');
 box.append(el('h4',null,G.label+' 練習'+String(R.n).padStart(2,'0')+' の結果'));
 box.append(el('p','ep-score',(d.mode==='wrong'?'今回 '+score+' / '+d.order.length+'　→　セット全体 ':'')+R.recorded.fullScore+' / 20'));
 const ol=el('ol','ep-list');
 for(const id of d.order){const q=qById(id),a=d.answers[id]||{};const li=el('li',a.ok?'o':'x');li.append(el('span','ep-m',a.ok?'⭕':(a.near?'🔺':'❌')),el('span',null,parts(q).text.slice(0,70)));ol.append(li);}
 box.append(ol);
 const row=el('div','ep-row');
 const r=rec(),L=r.sets[R.k]&&r.sets[R.k].last,wrong=L?Object.values(L.marks).filter(m=>m!=='o').length:0;
 if(wrong)row.append(btn('まちがいだけ解き直す（'+wrong+'問）','ep-btn ep-main',()=>start(R.g,R.n,'wrong')));
 row.append(btn('セットの一覧へ','ep-btn',()=>{S.run=null;render();}));box.append(row);h.append(box);
}
function mount(host,io){
 if(!host||!io)return;const uid=String(io.uid&&io.uid()||'');
 if(S.host!==host||S.uid!==uid){S.run=null;S.msg='';}
 S.host=host;S.io=io;S.uid=uid;render();
}
root.NobiEiken=Object.freeze({mount,_judge:judge,_parts:parts,_norm:norm});
})(globalThis);
