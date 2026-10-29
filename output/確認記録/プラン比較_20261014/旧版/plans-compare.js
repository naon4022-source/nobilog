(function(){
'use strict';
const plans=[
 {id:'free',name:'Free',yen:0,quota:'AI対象外',history:'未確定',lead:'教材と記録で、自分のペースをつくる。',features:['教科書・問題・自分の苦手ノート','AIの対象機能は鍵から確認','比較だけで料金は発生しない']},
 {id:'mini',name:'Mini',yen:500,quota:'月30回',history:'1週間',lead:'困った一問に、ヒントを添える。',features:['ヒント・短い解説が対象（準備中）','活動履歴は1週間','自分で苦手ノートを振り返る']},
 {id:'standard',name:'Student',yen:1000,quota:'月150回',history:'3週間',lead:'復習と予定を、無理なく続ける。',features:['Miniの5倍のAI回数（準備中）','予定の遅れを調整','カメラ・保存した写真を活用']},
 {id:'pro',name:'Pro',yen:1500,quota:'月300回',history:'1か月',lead:'自分の考えを、理解につなげる。',features:['AI相談・分析が対象（準備中）','画像付きまとめノート','教科書のマーカーとメモ','回答から個別の振り返り']},
 {id:'unlimit',name:'UNLIMIT',yen:2000,quota:'1日1,000回まで',history:'3年',lead:'一問の「なぜ」まで、じっくり。',features:['すべてSonnetの予定（準備中）','一問ずつ段階的に振り返る','なおへの手作業の解説依頼','返信を学習の記録に残す']}
];
const rows=[
 ['月額','税込・税別は未確定',plans.map(p=>p.yen?p.yen.toLocaleString()+'円':'無料')],
 ['AI回数','実AIは接続準備中',plans.map(p=>p.quota)],
 ['活動履歴の表示期間','保存期間とは別',plans.map(p=>p.history)],
 ['教科書・問題・苦手ノート','確認版：用意できた教材の範囲',['対象','対象','対象','対象','対象']],
 ['自分の写真をアイコンに設定','実装済み：本人の画像だけを保存',['対象','対象','対象','対象','対象']],
 ['テーマ・文字・ごほうびの設定','実装済み：着せ替え50種類。実機確認は別',['対象','対象','対象','対象','対象']],
 ['AIヒント・短い解説','準備中：画面・制限の仕組みあり',['対象外','対象','対象','対象','対象']],
 ['予定の遅れの調整','確認版の学習ペース調整',['対象外','対象外','対象','対象','対象']],
 ['カメラ・保存した写真','確認版：写真の撮影・保存',['対象外','対象外','対象','対象','対象']],
 ['AIチャット相談','実AIは準備中。送信1回＝1回分',['対象外','対象外','対象外','対象','対象']],
 ['画像付きまとめノート','確認版：保存。AI分析は別',['対象外','対象外','対象外','対象','対象']],
 ['教科書のマーカー・メモ','確認版：本人の保存',['対象外','対象外','対象外','対象','対象']],
 ['苦手・ノートのAI分析','準備中。AIによる問題生成も準備中',['対象外','対象外','対象外','対象','対象']],
 ['詳しい段階別の振り返り','確認版：教材の解説。実AIは準備中',['対象外','対象外','対象外','対象外','対象']],
 ['なおへの解説依頼','確認版：受付・返信。返信に1日程度の場合あり',['対象外','対象外','対象外','対象外','対象']],
 ['AIモデルの使い分け','Claude APIへの切り替え準備中',['なし','Haiku','Haiku','Haiku＋一部Sonnet','すべてSonnet']],
 ['自己紹介からAIアイコンを作る','準備中。自分で画像を設定する操作とは別',['対象外','対象外','対象外','対象外','対象']]
];
const current=document.getElementById('current-plan'),target=document.getElementById('target-plan'),difference=document.getElementById('difference');
const node=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
const byId=id=>plans.find(p=>p.id===id);
const query=new URLSearchParams(location.search).get('current');if(byId(query)){current.value=query;document.getElementById('selection-source').textContent='アプリから渡された比較用のプランです。選び直せます。契約の変更・確認を行う操作ではありません。';}
for(const p of plans){const card=node('article');card.className='plan-card';card.dataset.plan=p.id;const badge=node('span','');badge.className='current-badge';card.append(badge,node('h3',p.name));const price=node('p',p.yen?p.yen.toLocaleString()+'円':'無料');price.className='price';price.append(node('small',p.yen?' / 月':''));card.append(price,node('p',p.lead));const list=node('ul');for(const f of p.features)list.append(node('li',f));card.append(list);const b=node('button','今のプランと比較');b.type='button';b.className='pill';b.addEventListener('click',()=>{target.value=p.id;render();document.getElementById('current').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});current.focus();});card.append(b);document.getElementById('plan-cards').append(card);}
for(const [title,state,values] of rows){const tr=node('tr'),th=node('th',title);th.scope='row';th.append(node('small',state));tr.append(th);for(const value of values)tr.append(node('td',value));document.getElementById('comparison-body').append(tr);}
function render(){
 difference.replaceChildren();const from=byId(current.value),to=byId(target.value);
 for(const card of document.querySelectorAll('.plan-card')){const active=card.dataset.plan===from?.id;card.classList.toggle('is-current',active);card.querySelector('.current-badge').textContent=active?'比較元：今のプラン':'';}
 if(!from){difference.append(node('p','現在のプランを選ぶと、違いを具体的に表示します。'));return;}
 if(!to)return;
 if(from===to){difference.append(node('h3',from.name+'と'+to.name+'は同じプランです。'),node('p','料金・AI回数・機能は変わりません。別の比較先を選んでみてください。'));return;}
 const delta=to.yen-from.yen;difference.append(node('h3',from.name+' → '+to.name),node('p','月額：'+(from.yen?from.yen.toLocaleString()+'円':'無料')+' → '+(to.yen?to.yen.toLocaleString()+'円':'無料')+'（'+(delta>0?'＋':'−')+Math.abs(delta).toLocaleString()+'円）'),node('p','AI回数：'+from.quota+' → '+to.quota+' ／ 活動履歴：'+from.history+' → '+to.history));
 const a=plans.indexOf(from),b=plans.indexOf(to),added=[],removed=[],changed=[];
 for(const [title,state,values] of rows.slice(3)){if(values[a]===values[b])continue;const description=title+'：'+values[a]+' → '+values[b]+'（'+state+'）';if(values[a]==='対象外'&&values[b]==='対象')added.push(description);else if(values[a]==='対象'&&values[b]==='対象外')removed.push(description);else changed.push(description);}
 const grid=node('div');grid.className='difference-grid';for(const [title,values,empty] of [['増える機能',added,'追加される機能はありません。'],['減る機能',removed,'対象外になる機能はありません。'],['変わる使い方',changed,'回数と履歴の違いは上に表示しています。']]){const box=node('article');box.append(node('h3',title));if(values.length){const ul=node('ul');for(const s of values)ul.append(node('li',s));box.append(ul);}else box.append(node('p',empty));grid.append(box);}difference.append(grid,node('p','比較の選択はこの画面だけの操作です。保存済み記録・契約・料金・利用回数は変更しません。'));
}
current.addEventListener('change',()=>{document.getElementById('selection-source').textContent='自分で選んだプランで比較しています。実際の契約はアプリで確認してください。';render();});target.addEventListener('change',render);render();
})();
