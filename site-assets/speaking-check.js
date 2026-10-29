// 話して採点（練習版・2026-10-22 Claude）：例文を声に出すと、端末の音声認識で文字にして、例文の単語とくらべる。
// 本物のAIの評価ではない（契約後に差しかえ）。声も結果も保存・送信しない（のびログのサーバーへは何も送らない）。
// ただし音声認識は、端末やブラウザの会社（Google・Apple など）のサービスで処理されることがあるので、最初に知らせて本人が押したときだけ使う。
(function(root){'use strict';
 const words=s=>String(s||'').toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9' ]+/g,' ').split(/\s+/).filter(Boolean);
 // 例文の単語のうち、順番どおりに言えた単語（最長共通部分列）に印をつける
 function score(target,heard){
  const a=words(target),b=words(heard);const n=a.length,m=b.length;const L=Array.from({length:n+1},()=>new Array(m+1).fill(0));
  for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)L[i][j]=a[i]===b[j]?L[i+1][j+1]+1:Math.max(L[i+1][j],L[i][j+1]);
  const hit=new Array(n).fill(false);for(let i=0,j=0;i<n&&j<m;){if(a[i]===b[j]){hit[i]=true;i++;j++;}else if(L[i+1][j]>=L[i][j+1])i++;else j++;}
  const got=hit.filter(Boolean).length,pct=n?Math.round(100*got/n):0;
  const extra=Math.max(0,m-got);
  const comment=pct===100&&!extra?'ぜんぶ聞き取れたよ！':pct>=80?'あと少し。赤い単語をもう一度ゆっくり言ってみよう。':pct>=50?'半分以上言えたよ。お手本を聞いてから、区切って言ってみよう。':'もう一度お手本を聞いて、ゆっくり言ってみよう。';
  return {words:words(target).map((w,i)=>({w,ok:hit[i]})),percent:pct,heard:b.join(' '),comment};
 }
 function mount(host,{text,beforeListen}={}){
  const SR=root.SpeechRecognition||root.webkitSpeechRecognition;const doc=host.ownerDocument;
  const box=doc.createElement('div');box.className='spk-check';const head=doc.createElement('p');head.textContent='🗣 話して採点（練習版）';
  const btn=doc.createElement('button');btn.type='button';btn.textContent='話して採点する';const out=doc.createElement('div');out.setAttribute('role','status');
  const note=doc.createElement('p');note.className='spk-note';note.textContent='声を文字にするため、端末やブラウザの音声認識サービス（Google・Apple など）で声が処理されることがあります。のびログには声も結果も保存しません。本物のAIの評価ではありません。';
  box.append(head,btn,out);host.append(box);
  if(!SR){btn.hidden=true;out.textContent='この端末では声の聞き取りが使えません。録音して聞き比べてください。';return {dispose(){box.remove();}};}
  let agreed=false,rec=null,disposed=false;
  const stop=()=>{if(rec){try{rec.abort();}catch{}rec=null;}btn.disabled=false;};
  function listen(){
   if(disposed||rec)return;beforeListen?.();rec=new SR();rec.lang='en-US';rec.interimResults=false;rec.maxAlternatives=3;btn.disabled=true;out.textContent='聞いています…例文を英語で言ってください。';
   const r=rec;let done=false;
   r.onresult=e=>{if(r!==rec)return;done=true;const alts=[...e.results[0]].map(x=>x.transcript);const best=alts.map(h=>score(text,h)).sort((x,y)=>y.percent-x.percent)[0];show(best);};
   r.onerror=e=>{if(r!==rec)return;done=true;out.textContent=e.error==='not-allowed'||e.error==='service-not-allowed'?'マイクか音声認識が許可されていません。':e.error==='no-speech'?'声が聞こえませんでした。もう一度どうぞ。':'聞き取れませんでした。もう一度どうぞ。';};
   r.onend=()=>{if(r!==rec)return;rec=null;btn.disabled=false;if(!done)out.textContent='聞き取れませんでした。もう一度どうぞ。';};
   try{r.start();}catch{rec=null;btn.disabled=false;out.textContent='聞き取りを始められませんでした。';}
  }
  function show(s){out.replaceChildren();const p=doc.createElement('p');p.className='spk-words';for(const x of s.words){const span=doc.createElement('span');span.textContent=x.w+' ';span.className=x.ok?'spk-ok':'spk-ng';p.append(span);}
   const pct=doc.createElement('b');pct.textContent=s.percent+'点　';const c=doc.createElement('span');c.textContent=s.comment;const heard=doc.createElement('p');heard.className='spk-note';heard.textContent='聞き取った文：'+(s.heard||'（なし）');out.append(pct,c,p,heard);}
  btn.addEventListener('click',()=>{if(disposed)return;if(!agreed){out.replaceChildren(note);const yes=doc.createElement('button');yes.type='button';yes.textContent='わかった、採点する';yes.addEventListener('click',()=>{agreed=true;listen();});out.append(yes);return;}listen();});
  const hidden=()=>{if(doc.hidden)stop();};doc.addEventListener('visibilitychange',hidden);
  return {dispose(){disposed=true;stop();doc.removeEventListener('visibilitychange',hidden);box.remove();}};
 }
 const api=Object.freeze({score,mount,words});if(typeof module==='object'&&module.exports)module.exports=api;else root.NobiSpeakingCheck=api;
})(typeof globalThis!=='undefined'?globalThis:this);
