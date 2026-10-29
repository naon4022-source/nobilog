// ★3の難しめ基準の検証（合成データだけ）
const S=require('./stars-model.js');let n=0,f=0;const ok=(c,m)=>{n++;if(!c){f++;console.log('❌',m);}};
const unit={questions:Array.from({length:10},(_,i)=>({id:'q'+i,prompt:i<5?'次の計算をしよう。\n'+i+'+1':'文章の問題'+i,answer:{kind:'number',value:String(i+1)}}))};
let t=0;const row=(id,correct,ms=10000)=>({questionId:id,mode:'study',correct,elapsedMs:ms,at:++t});
const all=(c,ms)=>unit.questions.map(q=>row(q.id,c,ms));
ok(S.evaluate(unit,[]).stars===0,'no records → 0');
ok(S.evaluate(unit,all(true,10000)).stars===3,'all correct first try, fast → ★3');
// 周回で水増ししない：全部まちがえてから全部正解 → 初回正解0 → ★1止まり
ok(S.evaluate(unit,[...all(false),...all(true)]).stars===1,'wrong first then correct → stays ★1 (no farming)');
// 同じ問題を何回正解しても1問
ok(S.evaluate(unit,Array.from({length:30},()=>row('q0',true))).correct===1,'repeating one question counts once');
// 速いだけの誤答は時間に入らない、遅い正解は★3にならない
ok(S.evaluate(unit,all(true,200000)).stars===2,'slow correct answers → not ★3');
ok(S.evaluate(unit,[...unit.questions.map(q=>row(q.id,false,1000)).slice(0,1),...all(true,10000)]).stars===3,'one fast wrong first try still ok when 90% first-try');
// 未回答は初回正解に入らない（分母は全問）
ok(S.evaluate(unit,all(true).slice(0,8)).stars===2&&S.evaluate(unit,all(true).slice(0,8)).firstTryRate===0.8,'8 of 10 answered → ★2, rate uses all questions');
// 記述・読解には時間の基準をかけない
const essay={questions:[{id:'e1',prompt:'説明しよう',answer:{kind:'rubric',criteria:[]}},{id:'e2',prompt:'説明しよう2',answer:{kind:'rubric',criteria:[]}}]};
ok(S.evaluate(essay,[row('e1',true,600000),row('e2',true,600000)]).stars===3,'essays are not timed');
// テストの記録や別単元の問題は数えない
ok(S.evaluate(unit,unit.questions.map(q=>({...row(q.id,true),mode:'test'}))).stars===0,'test-mode rows ignored');
ok(S.evaluate(unit,[row('other',true)]).correct===0,'unknown question ignored');
ok(S.kindOf(unit.questions[0])==='calc'&&S.kindOf(unit.questions[7])==='word','calc/word classification');
console.log('チェック '+n+'件　✅ '+(n-f)+'　❌ '+f);process.exit(f?1:0);
