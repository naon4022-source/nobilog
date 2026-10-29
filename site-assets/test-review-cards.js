// Fixed Nobi/bubble template. API text is rendered as text, never HTML or generated markup.
(function(root){
'use strict';
const copy=x=>JSON.parse(JSON.stringify(x)),plain=(s,n)=>typeof s==='string'&&Array.from(s).length<=n&&!/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(s);
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
function mount(host,{imageSrc,onGenerate,onPractice}={}){
 if(!/^\/nobi-(?:normal|point|think|joy|read|wave|surprise)\.svg$/.test(imageSrc||''))throw Error('verified_nobi_asset_required');
 let alive=true,revision=0;const rootNode=el('section',undefined,'nr-review');rootNode.setAttribute('aria-label','ノビーとテストの見直し');host.append(rootNode);
 function render(input){
  if(!alive)return;const state=copy(input);
  if(!state||!['idle','working','done','failed'].includes(state.state)||!Number.isSafeInteger(state.total)||state.total<1||state.total>500||!Number.isSafeInteger(state.answered)||state.answered<0||state.answered>state.total||!Array.isArray(state.items)||state.items.length>state.total)throw Error('invalid_review_view');
  if(state.items.length&&state.answered!==state.total||state.state==='done'&&state.items.length!==state.total)throw Error('incomplete_review_view');
  const id=x=>typeof x==='string'&&/^[a-zA-Z0-9_-]{8,64}$/.test(x);
  if(!id(state.testSessionId)||state.state!=='idle'&&!id(state.jobId))throw Error('invalid_review_view');
  const ids=new Set();for(const item of state.items){if(!item||!plain(item.questionId,160)||!item.questionId.trim()||ids.has(item.questionId)||!plain(item.comment,70)||!item.comment.trim()||!plain(item.purpose,20)||!item.purpose.trim()||!plain(item.question,12000)||!item.question.trim()||!plain(item.answer,12000)||!item.answer.trim()||(item.practiceId!==null&&(!plain(item.practiceId,160)||!item.practiceId.trim())))throw Error('invalid_review_view');ids.add(item.questionId);}
  const own=++revision;rootNode.replaceChildren();rootNode.append(el('h3','ノビーと見直そう'),el('p','目的：間違えた理由を確かめ、似た問題を自力で解けるようにする。','nr-purpose'));
  const status=el('p',undefined,'nr-status');status.setAttribute('role','status');
  status.textContent=state.state==='working'?`解説を作っています（${state.completed??state.items.length}/${state.total}問）。ほかの勉強を続けられます。`:state.state==='done'?'テストの解答とコメントができました。':state.state==='failed'?'作成を完了できませんでした。送信状況を確認してから再開できます。':state.answered<state.total?`全問を解くと解説を作れます（${state.answered}/${state.total}問）。`:'全問の解説をまとめて作れます。';rootNode.append(status);
  if(state.state==='idle'){
   const generate=el('button','全問の解説を作る（100回分）','nr-action');generate.type='button';generate.disabled=state.answered!==state.total||!['pro','unlimit'].includes(state.plan)||typeof onGenerate!=='function';generate.addEventListener('click',()=>{if(alive&&own===revision&&!generate.disabled){generate.disabled=true;status.textContent='受け付けています。ほかの勉強を続けられます。';void Promise.resolve().then(()=>onGenerate({testSessionId:state.testSessionId})).catch(()=>{if(alive&&own===revision)status.textContent='受け付けの完了を確認できません。送信状況を確認してください。';});}});rootNode.append(generate);
   if(!['pro','unlimit'].includes(state.plan))rootNode.append(el('p','新しい解説の作成はPro以上です。保存済みの解説は読めます。'));
  }
  const list=el('div',undefined,'nr-cards');list.setAttribute('role','list');
  state.items.forEach((item,i)=>{const card=el('article',undefined,'nr-card');card.setAttribute('role','listitem');card.append(el('h4','問題 '+(i+1)));
   const row=el('div',undefined,'nr-nobi-row'),image=el('img');image.src=imageSrc;image.alt='説明するノビー';image.width=76;image.height=76;
   const bubble=el('div',undefined,'nr-bubble'),comment=el('p',item.comment,'nr-comment');root.NobiFractions?.apply(comment);bubble.append(comment);row.append(image,bubble);card.append(row,el('p','見直すポイント：'+item.purpose,'nr-goal'));
   const details=el('details'),summary=el('summary','問題と解答・解説を見る'),question=el('p',item.question),answer=el('p',(item.answerTitle==='記述のポイント'?'記述のポイント：':'正しい答え：')+item.answer);root.NobiFractions?.apply(question);root.NobiFractions?.apply(answer);details.append(summary,question,answer);if(typeof item.explanation==='string'&&item.explanation){const explanation=el('p',item.explanation);root.NobiFractions?.apply(explanation);details.append(explanation);}card.append(details);
   if(item.practiceId!==null){const practice=el('button','この問題をやってみよう','nr-action');practice.type='button';practice.disabled=typeof onPractice!=='function';practice.addEventListener('click',()=>{if(alive&&own===revision&&!practice.disabled)onPractice({jobId:state.jobId,questionId:item.questionId,practiceId:item.practiceId});});card.append(practice);}
   list.append(card);
  });rootNode.append(list);
 }
 return Object.freeze({render,destroy(){alive=false;revision++;rootNode.remove();}});
}
root.NobiTestReviewCards=Object.freeze({mount});
})(globalThis);
