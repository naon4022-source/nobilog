// 小学校の復習（受験タブ・2026-10-22 Claude）：学年→教科→1問ずつ。1周目は全問、そのあとまちがえた問題だけをできるまで。
// 記録は本人の記録（recordStorage）の uid:elemReview:<単元ID>。答えの文章は保存しない（正解したか・何回まちがえたかだけ）。
(function(root){'use strict';
 const doc=root.document;
 function el(tag,cls,text){const e=doc.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;}
 function btn(text,cls,on){const b=el('button','btn '+(cls||'btn-active'),text);b.type='button';b.addEventListener('click',on);return b;}
 function mount(host,io){
  const M=root.NobiElementaryReview,E=root.NobiMaterialEngine;let bank=null,grade=null,unit=null,cur=null,answered=false,alive=true;const owner=io.uid();
  const same=()=>alive&&io.uid()===owner&&!!owner;
  const storeFor=u=>({get:uid=>io.read(uid,u.id),set:(uid,v)=>io.write(uid,u.id,v),owner:()=>io.uid()});
  function bar(p){const w=el('div','elr-bar');const s=el('span');s.style.width=Math.round(p.total?100*p.mastered/p.total:0)+'%';w.append(s);return w;}
  function home(){
   host.replaceChildren();host.append(el('h3',null,'🏫 小学校の復習（小学3〜6年・5教科）'),el('p','elr-note','1周目は全部の問題を順番に。全部に答えたら、まちがえた問題だけを、できるまでくり返すよ。'));
   const g=el('div','elr-grades');for(const n of [3,4,5,6])g.append(btn('小学'+n+'年',grade===n?'btn-active':'btn-inactive',()=>{grade=n;home();}));host.append(g);
   if(!grade){host.append(el('p','elr-note','学年をえらんでね。'));return;}
   const list=el('div','elr-units');
   for(const u of bank.units.filter(x=>x.grade===grade)){const p=M.progress(u,M.load(storeFor(u),owner));const b=el('button','elr-unit');b.type='button';
    b.append(el('b',null,u.subject),el('span',null,p.complete?'✅ できるようになった':(p.answered+' / '+p.total+'問'+(p.wrong?'・まちがい '+p.wrong+'問':''))),bar(p));b.addEventListener('click',()=>{unit=u;ask();});list.append(b);}
   host.append(list);
  }
  function ask(){
   if(!same())return;const rec=M.load(storeFor(unit),owner);const n=M.next(unit,rec);cur=n.q;answered=false;host.replaceChildren();
   const p=M.progress(unit,rec);const head=el('div','elr-head');head.append(btn('← もどる','btn-inactive',()=>{unit=null;home();}),el('b',null,unit.title));host.append(head,bar(p));
   if(!cur){host.append(el('div','exm-result ok','🎉 この教科はぜんぶできるようになったよ！（'+p.total+'問）'),btn('ほかの教科へ','btn-active',()=>{unit=null;home();}));return;}
   host.append(el('p','elr-phase',n.phase==='first'?'1周目：'+(p.answered+1)+' / '+p.total+'問':'まちがえた問題の復習（のこり '+p.wrong+'問）'),el('div','elr-topic',cur.topic||''));
   const q=el('div','elr-prompt',cur.prompt);host.append(q);
   const long=cur.answer.kind==='rubric';const inp=el(long?'textarea':'input','elr-input');if(!long)inp.type='text';inp.setAttribute('aria-label','答え');inp.autocomplete='off';
   const out=el('div','elr-out');out.setAttribute('aria-live','polite');const act=el('div','elr-actions');
   const submit=s=>{if(answered||!same())return;const r=E.grade(cur,s);answered=true;inp.disabled=true;const saved=M.record(storeFor(unit),owner,unit,cur.id,!!r.correct);
    out.replaceChildren(el('div','exm-result '+(r.correct?'ok':'ng'),r.correct?'⭕ 正解！':'❌ '+(s?(r.message||'ちがうよ'):'わからない')));
    if(!r.correct){const a=cur.answer;const ans=a.kind==='number'||a.kind==='expr'||a.kind==='relation'?a.value:a.kind==='exact'?a.accepted[0]:a.kind==='numbers'?a.values.join('、'):a.kind==='set'?a.items.map(x=>x[0]).join('、'):'';if(ans)out.append(el('div','elr-ans','答え：'+ans));}
    if(cur.explanation)out.append(el('div','elr-expl',cur.explanation));if(!saved)out.append(el('div','elr-note','記録できませんでした（アカウントが変わった可能性があります）。'));
    act.replaceChildren(btn('次へ','btn-active',ask));act.querySelector('button').focus();};
   inp.addEventListener('keydown',e=>{if(e.key==='Enter'&&!long&&!e.isComposing){e.preventDefault();submit(inp.value.trim());}});
   act.append(btn('答える','btn-active',()=>submit(inp.value.trim())),btn('わからない','btn-inactive',()=>submit('')));
   host.append(inp,act,out);inp.focus();
  }
  host.replaceChildren(el('p','elr-note','問題を読みこんでいます…'));
  io.bank().then(b=>{if(!same())return;if(!b||!Array.isArray(b.units)||!b.units.length)throw Error('bank');bank=b;home();}).catch(()=>{if(!same())return;host.replaceChildren(el('div','exm-result ng','問題を読みこめませんでした'),btn('もう一度','btn-active',()=>{alive=false;mount(host,io);}));});
  return {destroy(){alive=false;}};
 }
 root.NobiElementaryReviewUI=Object.freeze({mount});
})(typeof window!=='undefined'?window:globalThis);
