// Candidate UI: adapters must enforce server-side ownership and fresh verification.
(function(root){'use strict';
function mount(host,adapter){
 const owner=adapter.owner();if(!['u1','u2','u4'].includes(owner?.id)){host.replaceChildren();return {dispose(){}};}
 const doc=host.ownerDocument;let disposed=false,epoch=0,busy=false;
 const el=(tag,text)=>{const n=doc.createElement(tag);if(text)n.textContent=text;return n;};
 const section=el('section');section.className='section';const heading=el('h3','Googleアカウントの連携');
 const identity=el('p',owner.name+'の設定'),status=el('p','連携状態を確認しています…'),actions=el('div');status.setAttribute('role','status');
 section.append(heading,identity,status,actions,el('p','操作できるのは自分のアカウントだけです。解除しても学習記録は残ります。連携・解除にはパスワードと本人確認が必要です。'));host.replaceChildren(section);
 const same=()=>{if(disposed)return false;const current=adapter.owner();if(current?.id!==owner.id||current?.generation!==owner.generation){disposed=true;epoch++;host.replaceChildren();return false;}return true;};
 const button=(text,fn)=>{const b=el('button',text);b.type='button';b.className='btn btn-inactive';b.addEventListener('click',fn);return b;};
 async function refresh(){
  const run=++epoch;actions.replaceChildren();status.textContent='連携状態を確認しています…';
  try{const state=await adapter.status();if(!same()||run!==epoch)return;if(typeof state?.linked!=='boolean')throw Error('state');
   status.textContent=state.linked?'Googleと連携済みです。':'Googleは未連携です。';
   actions.append(button(state.linked?'Googleとの連携を解除する':'Googleアカウントと連携する',()=>act(state.linked?'unlink':'link')));
  }catch{if(!same()||run!==epoch)return;status.textContent='連携状態を確認できませんでした。接続を確認してください。';actions.append(button('もう一度確認する',refresh));}
 }
 async function act(action){
  if(!same()||busy)return;if(action==='unlink'&&!await adapter.confirmUnlink(owner.name))return;if(!same()||busy)return;
  busy=true;actions.querySelectorAll('button').forEach(b=>b.disabled=true);status.textContent='パスワードと本人確認へ進みます…';
  try{const result=await adapter.verifyAndApply(action);if(!same())return;
   if(result?.cancelled){status.textContent='操作をキャンセルしました。';await refresh();}
   else if(result?.redirecting){status.textContent='Googleの画面で本人のアカウントを選んでください。';}
   else await refresh();
  }catch{if(same()){status.textContent='操作を完了できませんでした。もう一度確認してからやり直してください。';actions.replaceChildren(button('連携状態を確認する',refresh));}}
  finally{busy=false;if(same())actions.querySelectorAll('button').forEach(b=>b.disabled=false);}
 }
 void refresh();return {dispose(){disposed=true;epoch++;host.replaceChildren();}};
}
root.NobiGoogleSettings=Object.freeze({mount});
})(globalThis);
