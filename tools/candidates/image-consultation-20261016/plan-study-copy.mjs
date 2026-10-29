// Staged correction only. Does not write served files during full verification.
export function update(source){
 const changes=[
  ['予定の遅れを調整する機能とカメラはStudent以上です。','予定の遅れを調整する機能とスクリーンショットはStudent以上です。'],
  ['活動履歴は3週間。カメラと保存した写真を活用。','活動履歴は3週間。スクリーンショットと保存した写真を活用。'],
  ['確認版での仕様です。実AIはまだ未接続です。相談の仮返答を本物の解説として扱わず、画像解析・ノートのAI分析・AIアイコン生成は準備中と表示します。','AIの利用可否と残り回分は、各画面で現在の状態を確認できます。仮の返事にはその旨を表示します。ノートのAI分析とAIアイコン生成は、まだ使えません。'],
  ["  if(plan?.provisional&&Number.isSafeInteger(plan.aiLimit)&&Number.isSafeInteger(plan.aiLeft))box.append(el('p','ヒント・短い解説などのAI：今月残り '+plan.aiLeft+' / '+plan.aiLimit+'回。相談はPro以上です。'));",
   "  if(plan?.provisional&&plan.creditsVersion==='daily-v2'&&Number.isFinite(plan.dailyLeft)&&Number.isFinite(plan.dailyLimit))box.append(el('p','今日のAI：残り '+plan.dailyLeft+' / '+plan.dailyLimit+'回分。ヒント・解説・相談で共通です。相談はPro以上です。'));\n  else if(plan?.provisional&&Number.isSafeInteger(plan.aiLimit)&&Number.isSafeInteger(plan.aiLeft))box.append(el('p','ヒント・短い解説などのAI：今月残り '+plan.aiLeft+' / '+plan.aiLimit+'回。相談はPro以上です。'));"]
 ];
 for(const [old,next] of changes){if(source.split(old).length!==2)throw Error('Source changed; review instead of overwriting');source=source.replace(old,next);}
 return source;
}
