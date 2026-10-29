// 小学校復習の進め方（2026-10-22 Claude・候補）：1周目は全問を順に。全部に1回答えたら、まちがえた問題だけをできるまでくり返す。
// 記録は本人ごと（store は本人のキーで読み書きする関数を渡す）。正解済みを誤答にしない・未回答を誤答にしない。前の12,500問の記録（examDone など）は読まないし消さない。
(function(root){'use strict';
 function load(store,uid){try{const v=store.get(uid);return v&&v.v===1?{v:1,answered:{...v.answered},wrong:{...v.wrong}}:{v:1,answered:{},wrong:{}};}catch{return {v:1,answered:{},wrong:{}};}}
 function next(unit,rec){const qs=unit.questions;const fresh=qs.find(q=>!rec.answered[q.id]);if(fresh)return {q:fresh,phase:'first'};const w=qs.find(q=>rec.wrong[q.id]);return w?{q:w,phase:'review'}:{q:null,phase:'done'};}
 function record(store,uid,unit,qid,correct){if(!unit.questions.some(q=>q.id===qid))return null;const rec=load(store,uid);if(uid!==store.owner())return null;   // 保存の直前にも本人を確かめる
  rec.answered[qid]=true;if(correct)delete rec.wrong[qid];else rec.wrong[qid]=(rec.wrong[qid]||0)+1;store.set(uid,rec);return rec;}
 function progress(unit,rec){const ids=unit.questions.map(q=>q.id);const answered=ids.filter(i=>rec.answered[i]).length,wrong=ids.filter(i=>rec.wrong[i]).length;return {total:ids.length,answered,wrong,mastered:answered-wrong,complete:answered===ids.length&&!wrong};}
 const api=Object.freeze({load,next,record,progress});if(typeof module==='object'&&module.exports)module.exports=api;else root.NobiElementaryReview=api;
})(typeof globalThis!=='undefined'?globalThis:this);
