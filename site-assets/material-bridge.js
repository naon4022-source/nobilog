(function(root){
'use strict';
const clone=value=>JSON.parse(JSON.stringify(value));
const object=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
function diaryDay(day){return typeof day==='string'&&/^20\d{2}-\d{2}-\d{2}$/.test(day)&&Number.isFinite(Date.parse(day+'T00:00:00Z'))&&new Date(day+'T00:00:00Z').toISOString().slice(0,10)===day;}
function diaryRow(row){return object(row)&&diaryDay(row.day)&&['great','steady','challenging'].includes(row.stamp)&&typeof row.note==='string'&&row.note.length<=200&&!/[\x00-\x1f\x7f]/.test(row.note)&&typeof row.unitId==='string'&&typeof row.unitTitle==='string'&&row.unitTitle.length<=300&&typeof row.subject==='string'&&Number.isSafeInteger(row.createdAt)&&row.createdAt>=0&&Number.isSafeInteger(row.updatedAt)&&row.updatedAt>=row.createdAt&&Number.isSafeInteger(row.revision)&&row.revision>=1;}
function create(adapter){
 let aiFeatures=null;
 let testPreparation=null,activeTest=null;
 const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
 function guard(uid){if(!uid||adapter.identity()!==uid||!adapter.ready())throw Error('学習記録へ接続できません。');}
 function read(){const value=adapter.read();if(!object(value))throw Error('保存記録を確認してください。');return value;}
 async function acknowledge(attempt,uid){
  const saved=await adapter.record(clone(attempt));guard(uid);
  if(!object(saved)||!object(saved.result)||typeof saved.result.correct!=='boolean'||['id','questionId','unitId','mode','answer'].some(k=>saved[k]!==attempt[k]))throw Error('回答の保存を確認できませんでした。');
  return clone(saved);
 }
 return Object.freeze({
  identity:()=>adapter.identity(),
  testSessionAvailable:()=>typeof adapter.testSessionCreate==='function'&&typeof adapter.testSessionStatus==='function',
  async beginTest(selection,uid){
   guard(uid);
   if(!adapter.testSessionCreate||!object(selection)||Object.keys(selection).sort().join(',')!=='mode,questionIds,unitId'||!['study','test'].includes(selection.mode)||typeof selection.unitId!=='string'||!Array.isArray(selection.questionIds)||selection.questionIds.length<1||selection.questionIds.length>500||selection.questionIds.some(id=>typeof id!=='string'||!id.trim()||id.length>160)||new Set(selection.questionIds).size!==selection.questionIds.length)throw Error('テストの問題を確認してください。');
   const signature=JSON.stringify(selection);
   // Keep the creation ID until the server acknowledges it; a lost response
   // must not create a second roster when the same conditions are retried.
   if(!testPreparation||testPreparation.uid!==uid||testPreparation.signature!==signature)testPreparation={uid,signature,request:{id:root.crypto.randomUUID(),...clone(selection)}};
   const pending=testPreparation,saved=await adapter.testSessionCreate(clone(pending.request));guard(uid);
   if(testPreparation!==pending)throw Error('問題の組が変更されました。');
   if(!object(saved)||!uuid.test(saved.id||'')||saved.unitId!==selection.unitId||saved.mode!==selection.mode||!Number.isSafeInteger(saved.at)||saved.at<0||saved.total!==selection.questionIds.length||typeof saved.cached!=='boolean'||!Array.isArray(saved.slots)||saved.slots.length!==saved.total||new Set(saved.slots.map(s=>s?.attemptId)).size!==saved.total||saved.slots.some((s,i)=>!object(s)||s.questionId!==selection.questionIds[i]||!uuid.test(s.attemptId||'')))throw Error('テストの保存を確認できませんでした。');
   activeTest={uid,session:clone(saved),first:new Map()};testPreparation=null;return clone(saved);
  },
  async testStatus(uid){
   guard(uid);const current=activeTest;
   if(!current||current.uid!==uid||!adapter.testSessionStatus)throw Error('テストを確認できません。');
   const saved=await adapter.testSessionStatus(current.session.id);guard(uid);
   if(activeTest!==current||!object(saved)||saved.id!==current.session.id||saved.unitId!==current.session.unitId||saved.mode!==current.session.mode||saved.at!==current.session.at||saved.total!==current.session.total||!Number.isSafeInteger(saved.answered)||saved.answered<0||saved.answered>saved.total||saved.complete!==(saved.answered===saved.total))throw Error('テストの状態を確認できませんでした。');
   return clone(saved);
  },
  async marks(uid,unitId){
   guard(uid);
   if(!adapter.marks||typeof unitId!=='string'||!/^[a-z0-9][a-z0-9_-]{0,120}$/.test(unitId))throw Error('問題の一覧へ接続できません。');
   const saved=await adapter.marks(unitId);guard(uid);
   if(!object(saved)||saved.unitId!==unitId||!Array.isArray(saved.items)||!Number.isSafeInteger(saved.serverTime))throw Error('問題の一覧を確認できませんでした。');
   const items=Object.create(null);
   for(const row of saved.items){
    if(!object(row)||typeof row.questionId!=='string'||!['○','△','×'].includes(row.mark)||!Number.isSafeInteger(row.views)||row.views<1||!Number.isSafeInteger(row.lastAt)||(row.dueAt!==null&&!Number.isSafeInteger(row.dueAt))||(row.mark==='○')!==(row.dueAt===null)||items[row.questionId])throw Error('問題の一覧を確認できませんでした。');
    items[row.questionId]={mark:row.mark,views:row.views,lastAt:row.lastAt,dueAt:row.dueAt};
   }
   return {items,serverTime:saved.serverTime};
  },
  async speed(uid,options){
   guard(uid);
   const id=/^[a-z0-9][a-z0-9_-]{0,120}$/,cursor=/^\d{13}:[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
   if(!adapter.speed||!object(options)||!id.test(options.unitId||'')||!id.test(options.questionId||'')||!['study','test'].includes(options.mode)||(options.cursor!==undefined&&!cursor.test(options.cursor)))throw Error('速度比較の問題を確認してください。');
   const saved=await adapter.speed(clone(options));guard(uid);
   if(!object(saved)||saved.unitId!==options.unitId||saved.questionId!==options.questionId||saved.mode!==options.mode||typeof saved.subject!=='string'||typeof saved.title!=='string'||saved.title.length>300||!Number.isSafeInteger(saved.serverTime)||saved.serverTime<0||!Number.isSafeInteger(saved.attempts)||saved.attempts<0||!Number.isSafeInteger(saved.correct)||saved.correct<0||saved.correct>saved.attempts||(saved.bestMs!==null&&(!Number.isSafeInteger(saved.bestMs)||saved.bestMs<1||saved.bestMs>86400000||saved.correct<1))||!Array.isArray(saved.items)||saved.items.length>50||saved.items.length>saved.attempts||(saved.next!==null&&!cursor.test(saved.next)))throw Error('速度の記録を確認できませんでした。');
   let previous=options.cursor||null;const seen=new Set();
   for(const row of saved.items){
    if(!object(row)||typeof row.id!=='string'||!Number.isSafeInteger(row.at)||row.at<0||row.at>saved.serverTime||!Number.isSafeInteger(row.elapsedMs)||row.elapsedMs<0||row.elapsedMs>86400000||typeof row.correct!=='boolean')throw Error('速度の記録を確認できませんでした。');
    const key=String(row.at).padStart(13,'0')+':'+row.id;
    if(!cursor.test(key)||seen.has(row.id)||(previous!==null&&key>=previous))throw Error('速度の記録の順序を確認してください。');
    seen.add(row.id);previous=key;
   }
   if(saved.next!==null&&(saved.items.length!==50||saved.next!==previous))throw Error('速度の記録の続きが不正です。');
   return clone(saved);
  },
  async diary(uid,cursor){
   guard(uid);if(!adapter.diary)throw Error('日記へ接続できません。');const saved=await adapter.diary(cursor);guard(uid);
   if(!object(saved)||!diaryDay(saved.today)||!Number.isSafeInteger(saved.serverTime)||saved.serverTime<0||new Date(saved.serverTime+32400000).toISOString().slice(0,10)!==saved.today||!Array.isArray(saved.items)||saved.items.length>50||saved.items.some(row=>!diaryRow(row)||row.day>saved.today)||(saved.next!==null&&!diaryDay(saved.next)))throw Error('日記を確認できませんでした。');
   for(let i=1;i<saved.items.length;i++)if(saved.items[i-1].day<=saved.items[i].day)throw Error('日記の順序を確認してください。');
   return clone(saved);
  },
  async diarySave(entry,uid){
   guard(uid);if(!adapter.diarySave||!object(entry)||!diaryDay(entry.day)||!['great','steady','challenging'].includes(entry.stamp)||typeof entry.note!=='string'||entry.note.length>200||/[\x00-\x1f\x7f]/.test(entry.note)||typeof entry.unitId!=='string'||!Number.isSafeInteger(entry.revision)||entry.revision<0)throw Error('日記の入力を確認してください。');
   const saved=await adapter.diarySave(clone(entry));guard(uid);
   if(!object(saved)||!diaryRow(saved.record)||saved.record.day!==entry.day||saved.record.stamp!==entry.stamp||saved.record.note!==entry.note.trim()||saved.record.unitId!==entry.unitId||saved.record.revision!==entry.revision+1)throw Error('日記の保存を確認できませんでした。');
   return clone(saved.record);
  },
  async load(uid){
   guard(uid);await adapter.flush();guard(uid);const progress=read().materialProgress;
   if(progress!==undefined&&!object(progress))throw Error('進み具合を確認してください。');
   const merged=clone(progress||{});
   if(adapter.progress){
    const saved=await adapter.progress();guard(uid);
    if(!object(saved))throw Error('進み具合を確認してください。');
    for(const [id,value] of Object.entries(saved)){
     if(['__proto__','constructor','prototype'].includes(id)||!object(value))continue;
     const current=object(merged[id])?merged[id]:{};
     for(const key of ['done','testDone'])current[key]=[...new Set([...(Array.isArray(current[key])?current[key]:[]),...(Array.isArray(value[key])?value[key]:[])].filter(v=>typeof v==='string'))];
     merged[id]=current;
    }
   }
   return merged;
  },
  async record(attempt,uid){
   guard(uid);if(!adapter.record)throw Error('回答の保存へ接続できません。');
   const current=activeTest,slot=current?.uid===uid&&attempt.mode===current.session.mode&&current.session.unitId===attempt.unitId?current.session.slots.find(s=>s.questionId===attempt.questionId):null;
   if(!slot)return acknowledge(attempt,uid);
   let first=current.first.get(attempt.questionId);
   if(!first){first={clientId:attempt.id,attempt:{...clone(attempt),id:slot.attemptId},acknowledged:false};current.first.set(attempt.questionId,first);}
   // If the learner edited an answer after an unknown save result, first
   // recover that exact immutable submission, then record the new answer.
   if(!first.acknowledged&&first.clientId!==attempt.id){await acknowledge(first.attempt,uid);if(activeTest!==current)throw Error('問題の組が変更されました。');first.acknowledged=true;}
   const initial=first.clientId===attempt.id;
   if(initial&&['unitId','questionId','mode','answer','elapsedMs'].some(k=>first.attempt[k]!==attempt[k]))throw Error('前の回答の保存を確認してください。');
   const saved=await acknowledge(initial?first.attempt:attempt,uid);
   if(activeTest!==current)throw Error('問題の組が変更されました。');
   if(initial)first.acknowledged=true;return saved;
  },
  async history(uid,cursor){guard(uid);if(!adapter.history)throw Error('回答履歴へ接続できません。');const saved=await adapter.history(cursor);guard(uid);if(!object(saved)||!Array.isArray(saved.items)||(saved.next!==null&&typeof saved.next!=='string'))throw Error('回答履歴を確認できませんでした。');return clone(saved);},
  async stats(uid,month){guard(uid);if(!adapter.stats)throw Error('学習集計へ接続できません。');const saved=await adapter.stats(month);guard(uid);if(!object(saved)||!Array.isArray(saved.totals)||!Array.isArray(saved.days)||typeof saved.month!=='string')throw Error('学習集計を確認できませんでした。');return clone(saved);},
  async review(uid,options){guard(uid);if(!adapter.review)throw Error('復習へ接続できません。');const saved=await adapter.review(options);guard(uid);if(!object(saved)||!Array.isArray(saved.items)||(saved.next!==null&&typeof saved.next!=='string'))throw Error('復習を確認できませんでした。');return clone(saved);},
  async rewards(uid){
   guard(uid);if(!adapter.rewards)throw Error('学習報酬へ接続できません。');const saved=await adapter.rewards();guard(uid);
   if(!object(saved)||!Number.isSafeInteger(saved.earned)||saved.earned<0||saved.pointsPerQuestion!==1||!Array.isArray(saved.byUnit)||saved.byUnit.some(row=>!object(row)||typeof row.unitId!=='string'||!['study','test'].includes(row.mode)||!Number.isSafeInteger(row.correctQuestions)||row.correctQuestions<1||typeof row.subject!=='string'||typeof row.title!=='string'||!Number.isSafeInteger(row.firstAt)||!Number.isSafeInteger(row.lastFirstAt)||row.firstAt<0||row.lastFirstAt<row.firstAt)||saved.byUnit.reduce((sum,row)=>sum+row.correctQuestions,0)!==saved.earned)throw Error('学習報酬を確認できませんでした。');
   return clone(saved);
  },
  async settleRewards(uid){
   const reward=await this.rewards(uid);guard(uid);
   if(!adapter.readGame||!adapter.writeGame)throw Error('学習報酬の保存へ接続できません。');
   await adapter.flush();guard(uid);
   const game=adapter.readGame();if(!object(game))throw Error('学習報酬の保存を確認してください。');
   const applied=game.materialRewardsApplied??0;
   if(!Number.isSafeInteger(applied)||applied<0||applied>reward.earned)throw Error('学習報酬の受け取り記録を確認してください。');
   const delta=reward.earned-applied;
   if(delta){
    const next={...game,materialRewardsApplied:reward.earned};
    for(const key of ['coins','xp','totalQ']){
     const value=game[key]??0;
     if(!Number.isSafeInteger(value)||value<0||!Number.isSafeInteger(value+delta))throw Error('学習報酬の残高を確認してください。');
     next[key]=value+delta;
    }
    // Balance and receipt watermark travel in the same server snapshot. Read
    // immediately before writing so purchases made during the request stay spent.
    adapter.writeGame(next);await adapter.flush();guard(uid);
   }
   return {earned:reward.earned,added:delta};
  },
  async daily(uid){
   guard(uid);if(!adapter.daily)throw Error('今日の学習へ接続できません。');const saved=await adapter.daily();guard(uid);
   if(!object(saved)||typeof saved.day!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(saved.day)||!Number.isSafeInteger(saved.correctQuestions)||saved.correctQuestions<0)throw Error('今日の学習を確認できませんでした。');
   return clone(saved);
  },
  // Geminiの学習補助。返答は文字列だけを受け取り、採点・進み具合には使わない。
  async aiStatus(uid){guard(uid);if(!adapter.aiStatus)return false;const saved=await adapter.aiStatus();guard(uid);aiFeatures=object(saved?.features)?clone(saved.features):null;return object(saved)&&saved.available===true;},
  aiFeature(name){return aiFeatures===null||aiFeatures[name]===true;},
  async explain(attemptId,uid){
   guard(uid);if(!adapter.explain)throw Error('AIの説明へ接続できません。');
   if(typeof attemptId!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(attemptId))throw Error('AIの説明に使う記録を確認できません。');
   const saved=await adapter.explain(attemptId);guard(uid);const e=saved?.explanation;
   if(!object(e)||typeof e.reason!=='string'||typeof e.tip!=='string'||!Array.isArray(e.steps)||!e.steps.length||e.steps.some(s=>typeof s!=='string'))throw Error('AIの説明を確認できませんでした。');
   return {reason:e.reason,steps:[...e.steps],tip:e.tip};
  },
  async judge(attemptId,uid){
   guard(uid);if(!adapter.judge)throw Error('AIの判定へ接続できません。');
   if(typeof attemptId!=='string'||!/^[a-f0-9-]{36}$/.test(attemptId))throw Error('AIの判定に使う記録を確認できません。');
   const r=await adapter.judge(attemptId);guard(uid);
   if(!object(r)||!['correct','partial','incorrect'].includes(r.verdict)||!Array.isArray(r.elements)||r.elements.some(e=>!object(e)||typeof e.need!=='string'||typeof e.met!=='boolean'||typeof e.evidence!=='string')||typeof r.comment!=='string')throw Error('AIの判定を確認できませんでした。');
   return {verdict:r.verdict,elements:r.elements.map(e=>({need:e.need,met:e.met,evidence:e.evidence})),comment:r.comment};
  },
  async similar(attemptId,uid){
   guard(uid);if(!adapter.similar)throw Error('似た問題へ接続できません。');
   if(typeof attemptId!=='string'||!/^[a-f0-9-]{36}$/.test(attemptId))throw Error('記録を確認できません。');
   const r=await adapter.similar(attemptId);guard(uid);
   if(!object(r)||typeof r.unitId!=='string'||!Array.isArray(r.ids)||r.ids.some(id=>typeof id!=='string'))throw Error('似た問題を確認できませんでした。');
   return {unitId:r.unitId,ids:r.ids.slice(0,10),reason:typeof r.reason==='string'?r.reason:'',ai:r.ai===true};
  },
  async generate(request,uid){
   guard(uid);if(!adapter.generate)throw Error('AIの問題作成へ接続できません。');
   const r=await adapter.generate({unitId:request.unitId,count:request.count});guard(uid);
   if(!object(r)||!Array.isArray(r.items))throw Error('作った問題を確認できませんでした。');return {count:r.items.length,discarded:r.discarded||0};
  },
  async generated(unitId,uid){
   guard(uid);if(!adapter.generated)return [];
   const r=await adapter.generated(unitId);guard(uid);
   if(!object(r)||!Array.isArray(r.items))throw Error('作った問題を確認できませんでした。');
   return r.items.filter(q=>object(q)&&/^gen-[a-f0-9]{12}$/.test(q.id)&&typeof q.prompt==='string'&&object(q.answer)&&q.answer.kind==='number'&&typeof q.answer.value==='string').map(q=>({id:q.id,type:'input',prompt:q.prompt,answer:{kind:'number',value:q.answer.value},explanation:typeof q.explanation==='string'?q.explanation:'',origin:'generated',reviewed:'ai-verified',source:{generated:true}}));
  },
  async hint(request,uid){
   guard(uid);if(!adapter.hint)throw Error('AIのヒントへ接続できません。');
   const id=/^[a-z0-9][a-z0-9_-]{0,120}$/;
   if(!object(request)||!id.test(request.unitId||'')||!id.test(request.questionId||'')||![1,2,3].includes(request.level))throw Error('ヒントの段階を確認できません。');
   const saved=await adapter.hint({unitId:request.unitId,questionId:request.questionId,level:request.level});guard(uid);
   if(!object(saved)||saved.level!==request.level||typeof saved.hint!=='string'||!saved.hint)throw Error('AIのヒントを確認できませんでした。');
   return {level:saved.level,hint:saved.hint,more:saved.more===true};
  },
  async notebook(uid){
   guard(uid);await adapter.flush();guard(uid);const saved=read().materialNotebook;
   if(saved!==undefined&&!Array.isArray(saved))throw Error('苦手ノートを確認してください。');
   return clone(saved||[]);
  },
  async bookmark(entry,uid){
   guard(uid);
   if(!object(entry)||typeof entry.unitId!=='string'||!/^[a-z0-9][a-z0-9_-]{0,120}$/.test(entry.unitId)||typeof entry.questionId!=='string'||!/^[a-z0-9][a-z0-9_-]{0,120}$/.test(entry.questionId)||!['study','test'].includes(entry.mode)||!object(entry.question)||entry.question.id!==entry.questionId||typeof entry.question.prompt!=='string'||entry.question.prompt.length>10000||typeof entry.subject!=='string'||typeof entry.unitTitle!=='string')throw Error('ノートの問題を確認してください。');
   const latest=read(),saved=latest.materialNotebook;
   if(saved!==undefined&&!Array.isArray(saved))throw Error('苦手ノートを確認してください。');
   const entries=clone(saved||[]);
   if(!entries.some(row=>row.unitId===entry.unitId&&row.mode===entry.mode&&row.questionId===entry.questionId))entries.push(clone(entry));
   adapter.write({...latest,materialNotebook:entries});await adapter.flush();guard(uid);return clone(entries);
  },
  async annotate(key,note,uid){
   guard(uid);if(typeof key!=='string'||typeof note!=='string'||note.length>2000)throw Error('メモを確認してください。');
   await adapter.flush();guard(uid);const latest=read(),saved=latest.materialNotebook;
   if(!Array.isArray(saved))throw Error('苦手ノートを確認してください。');
   const entries=clone(saved),row=entries.find(row=>row&&row.unitId+':'+row.mode+':'+row.questionId===key);
   if(!row)throw Error('ノートの問題が見つかりません。');row.note=note;
   adapter.write({...latest,materialNotebook:entries});await adapter.flush();guard(uid);return clone(entries);
  },
  // 下書き（打ちかけの答え・メモ）。本人の記録にだけ読み書きし、送信はほかの記録と同じ自動同期にまかせる
  // なおが「出さない」印をつけた問題の一覧（だれでも読める・つけ外しは管理画面）
  async paused(uid){guard(uid);if(typeof adapter.paused!=='function')return [];const items=await adapter.paused();guard(uid);return Array.isArray(items)?items.filter(x=>object(x)&&typeof x.unitId==='string'&&typeof x.questionId==='string').map(x=>({unitId:x.unitId,questionId:x.questionId})):[];},
  drafts(uid){if(!uid||adapter.identity()!==uid||typeof adapter.draftsRead!=='function')return {};const value=adapter.draftsRead();return object(value)?clone(value):{};},
  draftsWrite(next,uid){if(!uid||adapter.identity()!==uid||typeof adapter.draftsWrite!=='function'||!object(next))return false;adapter.draftsWrite(clone(next));return true;},
  async save(progress,uid){
   guard(uid);if(!object(progress))throw Error('進み具合を確認してください。');
   // Other fields are read just before writing, so an older UI snapshot cannot replace scores or settings.
   const next={...read(),materialProgress:clone(progress)};adapter.write(next);
   await adapter.flush();guard(uid);
  }
 });
}
root.NobiMaterialBridge=Object.freeze({create});
})(globalThis);
