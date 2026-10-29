(function(root){'use strict';
const features=[
 {id:'learn',name:'教科書・問題・苦手ノート',min:0,short:'読む・解く・解き直す。学習の基本がそろいます。'},
 {id:'avatar',name:'自分のアイコン・着せ替え',min:0,short:'写真のアイコンと、好きな色で自分らしい画面に。'},
 {id:'hint',name:'AIのヒント・短い説明',min:1,short:'「まず何をする？」を、短い言葉で教えてもらえます。'},
 {id:'planning',name:'予定の遅れを調整',min:2,short:'遅れた教科も、これからの日程へ無理なく組み直せます。'},
 {id:'camera',name:'撮った写真を保存',min:2,short:'ワークやノートを撮り、自分の写真一覧に残せます。'},
 {id:'chat',name:'AIと会話で相談',min:3,short:'聞き直しもOK。「もっと簡単に」と自分のペースで聞けます。'},
 {id:'workbook',name:'ワークのお助け',min:3,short:'教科・ページ・問題番号や写真から、解き方を一緒に確認。'},
 {id:'notes',name:'まとめノート・AIの振り返り',min:3,short:'自分の考えをまとめて、理解を確かめる問題につなげます。'},
 {id:'annotations',name:'教科書にマーカー・メモ',min:3,short:'大切なところや「ここがわからない」を書き残せます。'},
 {id:'detail',name:'一問ずつ、深く解説',min:4,short:'何を求めるか → 解き方 → 理由を、順番にかみ砕きます。'},
 {id:'nao',name:'なおの手作業の解説',min:4,short:'AIの説明に加え、なおにも相談。返信に1日程度かかることがあります。'},
 {id:'aiAvatar',name:'自己紹介からAIアイコン',min:4,short:'好きなことや雰囲気を伝え、自分らしいアイコンを考えます。'}
];
const plans=[
 {id:'free',name:'Free',yen:0,daily:0,history:'基本の学習記録',rank:0,color:'slate',tag:'まずは学習の基本から',intro:'教科書と問題で学ぶ。苦手ノートで復習する。',bullets:['教科書・問題・苦手ノート','写真のアイコン・着せ替え','AIなしでも学習できる'],brain:'AIなし'},
 {id:'mini',name:'Mini',yen:500,daily:20,history:'1週間',rank:1,color:'mint',tag:'困った一問に、ひと押し',intro:'自分で考えたい。迷ったときだけヒントがほしい。',bullets:['AIのヒント・短い説明','毎日20回分のAI','活動履歴は1週間'],brain:'さくっと教えるAI'},
 {id:'standard',name:'Student',yen:1000,daily:100,history:'3週間',rank:2,color:'blue',tag:'学習を続ける相棒に',intro:'ヒントを使いながら、予定も写真も整えて続ける。',bullets:['毎日100回分のAI','予定の遅れを調整','カメラ・保存した写真'],brain:'さくっと教えるAI'},
 {id:'pro',name:'Pro',yen:1500,daily:500,history:'1か月',rank:3,color:'violet',tag:'会話で、わからないをほどく',intro:'ワークもノートも相談して、自分の考えを深める。',bullets:['毎日500回分・会話で相談','ワークのお助け','ノート分析・教科書のメモ'],brain:'普段はさくっと、詳しい分析はじっくり'},
 {id:'unlimit',name:'UNLIMIT',yen:2000,daily:5000,history:'3年',rank:4,color:'peach',tag:'深い解説を、たっぷり',intro:'一問ずつ理由まで知りたい。なおにも相談したい。',bullets:['毎日5,000回分のAI','すべて、じっくり考えるAI','なおの解説・3年の履歴'],brain:'すべて、じっくり考えるAI'}
];
for(const p of plans)p.listedPrice=Object.freeze({basis:'tax-inclusive',currency:'JPY',totalYen:p.yen});
const costs=Object.freeze({light:.5,normal:1,heavy:3});
const find=id=>plans.find(p=>p.id===id)||null;
function compare(fromId,toId){const from=find(fromId),to=find(toId);if(!from||!to)return null;return {from,to,yenDifference:to.yen-from.yen,added:features.filter(f=>f.min>from.rank&&f.min<=to.rank),changedAccess:features.filter(f=>f.min<=from.rank&&f.min>to.rank)};}
function subsidy(planId,kind,months){const p=find(planId);if(!p||!Number.isInteger(months)||months<1||months>12||!['none','500','1000','full'].includes(kind))return null;const amount=kind==='full'?p.yen:kind==='none'?0:Math.min(p.yen,Number(kind));const target=kind==='full'?99:kind==='1000'?95:kind==='500'?85:null;return {monthly:amount,ownMonthly:p.yen-amount,total:amount*months,target,months,selected:kind};}
function priceLabel(p){return !p||p.yen===0?'無料':p.yen.toLocaleString()+'円（税込）';}
root.NobiSubscriptionCatalog=Object.freeze({version:'2026-10-17-total-price',plans:Object.freeze(plans.map(Object.freeze)),features:Object.freeze(features.map(Object.freeze)),costs,find,compare,subsidy,priceLabel});
})(globalThis);
