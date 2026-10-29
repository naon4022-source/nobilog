// Authored game puzzles, separate from ordinary textbooks and answer banks.
// Never send this module wholesale: answers stay on the server.
export const guideVersion=1;
export const guide=[
 {title:'この冒険で大切にすること',text:'これは仲間と協力する練習の場です。速く押せる人だけが進むゲームではありません。自分の情報を伝え、相手の話を聞き、分からないところを一緒に考えます。'},
 {title:'最初の順番',text:'説明を読み、下の「全部読んだよ！」を押してからパーティーを組みます。2〜3人で別々の職業を選び、全員でチュートリアルを終えると、クエストを受けられます。'},
 {title:'役割を分担する',text:'道しるべ師は順番と道筋、記録師は言葉と根拠、調停師は立場と合意を得意とします。同じパーティーで職業を重ねることはできません。2人なら2つの職業で必要な情報を分け合います。職業で得意な見方は変わりますが、誰かが上・下になることはありません。'},
 {title:'クエストからステージへ',text:'依頼を受け、情報を集めて相談し、全員で答えを決めてからステージへ向かいます。必要なレベルに届かないときは、1人用の修練でも力を蓄えられます。協力本編のクリアには仲間が必要です。'},
 {title:'戦いと勉強',text:'四角い光を押すと攻撃します。攻撃力は装備で変わります。ときどき、自分が正解した5教科の問題や英単語が出ます。問題中は自分の攻撃が止まるので、焦らず考えます。RPGでの間違いは普段の成績を書き換えません。'},
 {title:'困ったとき・休むとき',text:'相方がいなくなると協力本編は止まります。つなぎ直して続きを確認できます。クリア履歴には一緒にクリアした人が残ります。ゲームのヒントは、なおが全部知っているよ。答えだけでなく、どの言葉を手掛かりにしたか相談してみましょう。'},
 {title:'12章と、その先',text:'本編12章で一つの物語が完結します。その先の依頼やステージは、内容を作って点検できたものから追加します。1人用の物語は別に進み、協力本編の章を代わりにクリアするものではありません。'}
];
export const jobs=Object.freeze([
 {id:'pathfinder',name:'道しるべ師',purpose:'前後関係・道筋・条件を整理する'},
 {id:'scribe',name:'記録師',purpose:'事実と推測を分け、文章の根拠を探す'},
 {id:'mediator',name:'調停師',purpose:'違う立場を聞き、全員の合意を確かめる'}
]);
export const tutorials=Object.freeze([
 {id:'tutorial_evidence',title:'見たことと、思ったこと',prompt:'看板の傷について、記録帳に「確かなこと」として書ける文を選ぼう。',
  facts:['看板には、細い傷が三本ある。傷ができた瞬間を見た人はいない。','局員は「昨日、強い風が吹いた」と話した。ただし、看板を見たのは今朝だ。','猫が近くに座っていた。猫が看板に触れたという目撃はない。'],
  choices:[{id:'wind',text:'強い風が看板を傷つけた。'},{id:'marks',text:'看板に細い傷が三本ある。'},{id:'cat',text:'猫が看板を傷つけた。'}],answer:'marks'},
 {id:'tutorial_route',title:'一人の情報だけで決めない',prompt:'三つの門のうち、今、全員で通れる門を選ぼう。',
  facts:['赤い門の向こうは、足場が崩れている。青い門か緑の門へ向かう必要がある。','青い門は夕方まで工事中だ。今は昼で、工事が終わるまで開かない。','緑の門の札は「二人以上で、互いの合図を確かめてから通ること」。赤い門の札には危険とある。'],
  choices:[{id:'red',text:'赤い門'},{id:'blue',text:'青い門'},{id:'green',text:'緑の門'}],answer:'green'},
 {id:'tutorial_agreement',title:'全員の準備を確かめる',prompt:'橋へ出発する前に、今するべきことを決めよう。',
  facts:['あなたの荷物は整った。でも、他の人の準備はまだ聞いていない。','仲間の一人は「ちょっと待って」と言った。待つ理由は、まだ確かめていない。','橋の札には「全員の準備ができたことを確かめてから出発」とある。急ぐほど安全になるという記述はない。'],
  choices:[{id:'rush',text:'準備のできた人だけ先へ行く。'},{id:'guess',text:'たぶん大丈夫なので全員を連れて出る。'},{id:'check',text:'待つ理由を聞き、全員の準備を確かめる。'}],answer:'check'}
]);

export function distributeFacts(puzzle,members,uid){
 const index=members.findIndex(m=>m.uid===uid);
 if(index<0||members.length<2||members.length>3)throw Error('not_member');
 // With two players all three clues still exist; neither missing profession
 // nor party size can make a puzzle impossible.
 return puzzle.facts.filter((_,i)=>i%members.length===index);
}
export function puzzleView(puzzle,members,uid){
 return {id:puzzle.id,title:puzzle.title,prompt:puzzle.prompt,clues:distributeFacts(puzzle,members,uid),choices:puzzle.choices.map(x=>({...x}))};
}
