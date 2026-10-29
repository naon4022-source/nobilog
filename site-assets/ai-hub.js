// Independent AI-menu candidate. Buttons open existing flows; never send AI requests.
(function(root){
'use strict';
const names={free:'Free',mini:'Mini',standard:'Student',pro:'Pro',unlimit:'UNLIMIT'},ranks={free:0,mini:1,standard:2,pro:3,unlimit:4};
const cards=[
 {id:'practice',title:'ヒントで一歩進む',text:'まず自分で考えて、止まったところだけヒントを開こう。',rank:1,action:'practice',icon:'💡',example:'「符号の決め方」を確かめたい。'},
 {id:'planning',title:'予定を組み直す',text:'遅れている教科や残りの日数を見て、次に取り組む順番を整理。',rank:2,action:'planning',icon:'🗓️',example:'予定が遅れたので、今週の進め方を見直したい。'},
 {id:'chat',title:'ことばで相談する',text:'どこまでわかったかを書いて、次の一歩を相談。',rank:3,action:'chat',icon:'💬',example:'方程式で、両辺に同じ数を足す理由が知りたい。'},
 {id:'photo',title:'問題を撮って相談する',text:'テストやプリントの、わからないところだけを撮って添付。',rank:3,action:'photo',icon:'📷',example:'この問題の最初の一歩を、短い手順で教えて。'},
 {id:'notes',title:'ノートを整理する',text:'自分の説明や画像をまとめ、わかるところ・迷うところを整理。',rank:3,action:'notes',icon:'📓',example:'自分でまとめた解き方を、あとから読み返したい。'},
 {id:'nao',title:'なおに詳しく聞く',text:'問題と自分の回答を添えて、なおへ解説をお願いできます。',rank:4,action:'nao',icon:'✉️',example:'返事まで1日ほどかかることがあります。'}
];
function mount(host,api){
 if(!host||!api||typeof api.same!=='function'||typeof api.status!=='function')throw Error('invalid AI hub');
 let alive=true,epoch=0,status=null,error='',busy=false;
 const live=()=>alive&&host.isConnected&&api.same()===true;
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 function button(text,fn){const b=el('button',text);b.type='button';b.addEventListener('click',fn);return b;}
 async function refresh(){
  const run=++epoch;busy=true;status=null;error='';render();
  try{
   const value=await api.status();if(!live()||run!==epoch)return;
   if(!value||!Object.hasOwn(ranks,value.plan)||typeof value.ready!=='boolean'||typeof value.images!=='boolean'||!Number.isFinite(value.remaining)||value.remaining<0)throw Error('invalid status');
   status=Object.freeze({...value});
  }catch(_){if(live()&&run===epoch)error='接続を確認できませんでした。相談は送っていません。';}
  finally{if(run===epoch){busy=false;if(live())render();}}
 }
 function render(){
  if(!live())return;host.replaceChildren();const wrap=el('section',undefined,'aih'),hero=el('header',undefined,'aih-hero');
  const heading=el('h2');heading.append(el('span','わからないを、'),el('span','次の一歩へ。'));
  hero.append(el('small','のびログ AI'),heading,el('p','聞きたいことに合わせて、使い方を選ぼう。'));wrap.append(hero);
  const state=el('p',busy?'プランと接続を確認しています。':error||(names[status?.plan]+' · 今日の残り '+status?.remaining+'回分'),'aih-status');state.setAttribute('role','status');wrap.append(state);
  if(error){wrap.append(button('もう一度確認',()=>void refresh()));host.append(wrap);return;}
  if(status){
   const trial=status.trial===true?'現在は全体で1日10回までの試験利用です。通常のプラン枠とは別に止まる場合があります。':'';
   const explanation=ranks[status.plan]===0?'AIのお助けはMini以上で使えます。Freeでも自分の学習記録を振り返れます。':ranks[status.plan]<3?'問題の画面から、必要なヒントや短い解説を開けます。':'相談を送る前に、内容と使う回分を確認できます。';
   wrap.append(el('p',explanation+(ranks[status.plan]>=3&&!status.ready?' AIに接続できていません。送信せず、接続を確認してください。':'')+(trial?' '+trial:''),'aih-note'),button('残り回分を更新',()=>void refresh()));
  }
  const grid=el('div',undefined,'aih-grid');
  for(const c of cards){
   const card=el('article',undefined,'aih-card');card.dataset.aiFeature=c.id;
   card.append(el('span',c.icon,'aih-icon'),el('h3',c.title),el('p',c.text),el('p',c.example,'aih-example'));
   const locked=status&&ranks[status.plan]<c.rank;
   if(locked){const required=c.rank===1?'Mini以上':c.rank===2?'Student以上':c.rank===3?'Pro以上':'UNLIMIT';card.append(el('p','🔒 '+required,'aih-lock'),button('使えるプランを見る',()=>{if(live())api.plans?.(c.rank);}));}
   else{
    const fn=api.actions?.[c.action],unavailable=!status||typeof fn!=='function'||c.id==='photo'&&(!status.images||!status.ready)||c.id==='chat'&&!status.ready;
    const b=button(c.id==='photo'?'写真の相談を開く':'開く',()=>{if(live()&&!unavailable)fn();});b.disabled=busy||unavailable;card.append(b);
    if(status&&c.id==='photo'&&!status.images)card.append(el('p','画像のAI解説はまだ接続されていません。写真は自動送信しません。','aih-note'));
   }
   if(c.id==='photo')card.append(el('p','写真1枚につき3回分。2枚は6回分、3枚は9回分です。撮影・保存だけでは使いません。','aih-note'));
   grid.append(card);
  }
  wrap.append(grid,el('p','AIの説明も、教材や自分の考えと確かめて使おう。画像を送るときは、名前・顔・連絡先を写さず、問題の部分だけ選んでね。','aih-note'));host.append(wrap);
 }
 render();void refresh();
 return Object.freeze({refresh,destroy(){alive=false;epoch++;status=null;host.replaceChildren();}});
}
root.NobiAIHub=Object.freeze({mount});
})(globalThis);
