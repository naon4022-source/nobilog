(function(root){'use strict';
const C=root.NobiSubscriptionCatalog,G=root.NobiPlanGuide;if(!C||!G)return;
const priceLabel=p=>typeof C.priceLabel==='function'?C.priceLabel(p):p.yen===0?'無料':p.yen.toLocaleString()+'円（税込）';
const el=(t,s,c)=>{const n=document.createElement(t);if(s!=null)n.textContent=s;if(c)n.className=c;return n;};
function mount(host,api,{mode='current',preferred='pro'}={}){
 let alive=true,plan=null,busy=false,epoch=0,target=C.find(preferred)?.id||'pro',error='';const previous=document.activeElement;
 const live=()=>alive&&host.isConnected&&api.same();
 const box=el('section',null,'subscription-overlay');box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label','サブスク');host.append(box);
 function close(){if(!alive)return;alive=false;++epoch;host.remove();api.closed?.();if(previous?.isConnected)previous.focus();}
 const button=(text,fn,cls)=>{const b=el('button',text,cls);b.type='button';b.addEventListener('click',()=>{if(live())fn();});return b;};
 async function load(){if(busy||!live())return;const e=++epoch;busy=true;error='';render();try{const d=await api.plan();if(!live()||e!==epoch)return;if(!d?.provisional||!C.find(d.plan))throw Error('plan');plan=d;}catch(_){if(live()&&e===epoch)error='現在のプランを確認できませんでした。もう一度確認できます。';}finally{if(live()&&e===epoch){busy=false;render();}}}
 function render(){if(!live())return;const hadFocus=box.contains(document.activeElement),wasSelect=document.activeElement?.tagName==='SELECT';box.replaceChildren();const top=el('header',null,'subscription-header');top.append(el('b','サブスク'),button('閉じる',close));box.append(top);const main=el('div',null,'plan-guide subscription-main');box.append(main);if(hadFocus)queueMicrotask(()=>{if(live())(wasSelect?box.querySelector('select')||box.querySelector('button'):box.querySelector('button'))?.focus({preventScroll:true});});
  if(error){const alert=el('p',error,'subscription-error');alert.setAttribute('role','alert');main.append(alert,button('もう一度確認',()=>void load()));}
  if(!plan){main.append(el('h2',busy?'現在のプランを確認しています。':'サブスク'),el('p','確認できるまで、プランの表示を変更しません。'));return;}
  const p=C.find(plan.plan),current=el('section',null,'subscription-current '+p.color);current.append(el('span','現在のプラン','eyebrow'),el('h1',p.name),el('p',p.intro),el('p','標準月額：'+priceLabel(p)));
  if(plan.creditsVersion==='daily-v2')current.append(el('p','今日のAI：残り '+plan.dailyLeft+' / '+plan.dailyLimit+'回分','current-quota'));
  else current.append(el('p','アップデート後の利用枠：毎日'+p.daily.toLocaleString()+'回分'+(p.id==='free'?'（AI対象外）':''),'current-quota'));
  current.append(button(mode==='current'?'変更する':'現在のプランに戻る',()=>{mode=mode==='current'?'compare':'current';render();},'primary'));main.append(current);
  if(mode==='current'){const list=el('section');list.append(el('h2','今のプランで使う、お助け'));for(const f of C.features.filter(f=>f.min<=p.rank)){const item=el('article',null,'benefit-item');item.append(el('b',f.name),el('p',f.short));list.append(item);}main.append(list);if(p.rank>=3){const help=el('section');help.append(el('h2','ワークの一問を、聞いてみよう。'));G.renderExample(help,'workbook');help.append(button('ワークの相談文を作る',()=>{api.workbookDraft?.();},'primary'));main.append(help);}return;}
  const title=el('section');title.append(el('h2','今の'+p.name+'と比べよう。'),el('p','現在のプランは自動表示しています。気になるプランだけ選んでください。'));const label=el('label','比べるプラン'),select=el('select');G.choose(select,target);select.addEventListener('change',()=>{target=select.value;render();});label.append(select);title.append(label);const diff=el('div');G.renderComparison(diff,p.id,target);title.append(diff,button('このプランについてなおに相談',()=>api.consult?.(target),'primary'));main.append(title);
  const cards=el('section');cards.append(el('h2','プランの全体を見る'));const holder=el('div',null,'plan-cards');G.renderCards(holder,id=>{target=id;render();});cards.append(holder);main.append(cards);
  const note=el('section');note.append(el('h2','補助金も、一緒に相談できます。'),el('p','全教科85点以上で月500円、95点以上で月1,000円、99点以上で全額。金額は希望で選びます。'),el('p','目標に届かなかった場合、その期間にもらった補助分を返します。先に金額・期間を確認して決めます。'));const a=el('a','補助金の金額・期間の例を見る');a.href='/plans.html#support';a.target='_blank';a.rel='noopener';note.append(a);main.append(note);
 }
 box.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape'){e.preventDefault();close();}if(e.key==='Tab'){const nodes=[...box.querySelectorAll('button,select,a[href]')].filter(n=>!n.disabled),index=nodes.indexOf(document.activeElement);if(!nodes.length)return;if(e.shiftKey&&index<=0){e.preventDefault();nodes.at(-1).focus();}else if(!e.shiftKey&&(index===nodes.length-1||index<0)){e.preventDefault();nodes[0].focus();}}});render();box.querySelector('button')?.focus();void load();
 return {destroy:close,async refresh(){await load();}};
}
root.NobiSubscription=Object.freeze({mount});
})(globalThis);
