const assert=require('node:assert/strict');const e=require('./material-engine');let n=0;
function check(q,input,expected){assert.equal(e.grade(q,input).correct,expected,input);n++;}
const exact={type:'input',answer:{kind:'exact',accepted:['光合成','こうごうせい']}};
check(exact,'こうごうせい',true);check(exact,'光合成',true);check(exact,'光合成ではない',false);check(exact,'光合成、呼吸、蒸散',false);check(exact,'',false);
const num={type:'input',answer:{kind:'number',value:'1/2'}};
for(const a of ['0.5','１／２','0.500'])check(num,a,true);
check(num,'2/4',false);   // 2026-10-22 ユーザー指示：約分していない分数は×（「約分しよう」）
for(const a of ['1/0','0.6','0.5か0.6','abc','1/2/3','Infinity','0.5kg'])check(num,a,false);
const unit={type:'input',answer:{kind:'number',value:'12',units:['cm'],unitRequired:true}};check(unit,'12cm',true);check(unit,'12',false);check(unit,'12mm',false);
const rubric={type:'input',answer:{kind:'rubric',required:[['光']],reject:[['光は不要','光がなくても']],criteria:[{any:['光'],weight:4},{any:['二酸化炭素'],weight:3},{any:['水'],weight:3}]}};
check(rubric,'光と二酸化炭素',false);check(rubric,'光と二酸化炭素と水',true);// 2026-10-04 ユーザー指定：必要な内容をすべて満たしたときだけ正解（7割では正解にしない）
check(rubric,'光',false);check(rubric,'光と二酸化炭素を使わない',false);check(rubric,'二酸化炭素と水',false);check(rubric,'光は不要で二酸化炭素と水',false);check({type:'reading'},'読んだ',false);
const cs={type:'input',answer:{kind:'exact',caseSensitive:true,accepted:['I am Ken.']}};check(cs,'I am Ken.',true);check(cs,'i am ken.',false);
assert.ok(e.validateUnit({}).length>0);n++;

const sourceRef={id:'source-0000',file:'ドリル/りか/S__15581193_0.jpg',sha256:'a'.repeat(64),page:2,number:'1-1'};
const verifiedSource={id:'source-0000',file:sourceRef.file,sha256:sourceRef.sha256,mode:'drill',subject:'理科',grade:1,pages:['p2'],verified:true};
const makeQuestion=(id,prompt,origin='original')=>({id,type:'input',prompt,answer:{kind:'exact',accepted:['正解']},explanation:'根拠を確認します。',source:{...sourceRef},origin,reviewed:true});
const ready={id:'science-light-1',mode:'drill',subject:'理科',grade:1,title:'光の性質',status:'ready',
 textbook:{status:'ready',goals:['光の反射を説明できる'],summary:'光の進み方を図とことばで整理します。',sections:[{id:'reflection',title:'光の反射',body:'光は境界面で反射します。',reviewed:true,sources:[{...sourceRef}]}]},
 questions:Array.from({length:100},(_,i)=>makeQuestion('practice-'+i,'練習問題 '+i)),
 tests:[makeQuestion('test-1','条件を変えた確認問題','adapted')]};
assert.deepEqual(e.validateUnit(ready,{sources:[verifiedSource]}),[]);n++;
assert.ok(e.validateUnit(ready).includes('ready unit requires a verified source registry'));n++;
let invalid=JSON.parse(JSON.stringify(ready));invalid.questions[0].source.sha256='b'.repeat(64);assert.ok(e.validateUnit(invalid,{sources:[verifiedSource]}).includes('source registry mismatch'));n++;
invalid=JSON.parse(JSON.stringify(ready));invalid.questions[0].source.file='別の画像.jpg';assert.ok(e.validateUnit(invalid,{sources:[verifiedSource]}).includes('source registry mismatch'));n++;
assert.ok(e.validateUnit(ready,{sources:[{...verifiedSource,verified:false}]}).includes('source registry mismatch'));n++;
assert.ok(e.validateUnit(ready,{sources:[{...verifiedSource,mode:'workbook'}]}).includes('source registry mismatch'));n++;
invalid=JSON.parse(JSON.stringify(ready));invalid.textbook.sections=[];assert.ok(e.validateUnit(invalid,{sources:[verifiedSource]}).includes('ready textbook requires sections'));n++;
const bookRef={id:'reference-0123456789abcdef',file:'理科の教科書/見開き.jpg',sha256:'c'.repeat(64),page:12};
const verifiedBook={...bookRef,kind:'textbook-reference',subject:'理科',gradeScope:'中一',pages:[12],verified:true};
invalid=JSON.parse(JSON.stringify(ready));invalid.textbook.sections[0].sources=[bookRef];
assert.deepEqual(e.validateUnit(invalid,{sources:[verifiedSource,verifiedBook]}),[]);n++;
assert.ok(e.validateUnit(invalid,{sources:[verifiedSource,{...verifiedBook,verified:false}]}).includes('textbook source registry mismatch'));n++;
assert.ok(e.validateUnit(invalid,{sources:[verifiedSource,{...verifiedBook,gradeScope:'中一〜中三'}]}).includes('textbook source registry mismatch'));n++;
invalid.textbook.sections[0].sources=[{...bookRef,file:'別の見開き.jpg'}];assert.ok(e.validateUnit(invalid,{sources:[verifiedSource,verifiedBook]}).includes('textbook source registry mismatch'));n++;
invalid=JSON.parse(JSON.stringify(ready));delete invalid.textbook;assert.deepEqual(e.validateUnit(invalid,{sources:[verifiedSource]}),[]);n++;
invalid=JSON.parse(JSON.stringify(ready));invalid.textbook.status='draft';invalid.textbook.sections=[];assert.deepEqual(e.validateUnit(invalid,{sources:[verifiedSource]}),[]);n++;
invalid=JSON.parse(JSON.stringify(ready));delete invalid.textbook.goals;assert.ok(e.validateUnit(invalid,{sources:[verifiedSource]}).includes('ready textbook requires goals and summary'));n++;
invalid=JSON.parse(JSON.stringify(ready));invalid.questions.pop();assert.ok(e.validateUnit(invalid,{sources:[verifiedSource]}).includes('ready unit requires exactly 100 input questions'));n++;
invalid=JSON.parse(JSON.stringify(ready));invalid.tests[0].prompt=invalid.questions[0].prompt;assert.ok(e.validateUnit(invalid,{sources:[verifiedSource]}).includes('duplicate/missing prompt'));n++;
invalid=JSON.parse(JSON.stringify(ready));invalid.tests[0].origin='original';assert.ok(e.validateUnit(invalid,{sources:[verifiedSource]}).includes('test must be adapted'));n++;
const completionUnit={questions:[{id:'a',type:'input'},{id:'b',type:'input'},{id:'reading',type:'reading'}],tests:[{id:'t',type:'input'}]};
const completionProgress={done:['a','a','t','reading','unknown',42],testDone:['t','t','a']},before=JSON.stringify(completionProgress);
assert.deepEqual(e.completion(completionUnit,completionProgress),{study:{done:1,total:2,percent:50,complete:false},test:{done:1,total:1,percent:100,complete:true}});n++;
assert.equal(JSON.stringify(completionProgress),before);n++;
assert.deepEqual(e.completion(completionUnit,{done:['b','a'],testDone:[]}).study,{done:2,total:2,percent:100,complete:true});n++;
for(const bad of [undefined,null,[],{done:'a',testDone:null}]){assert.equal(e.completion(completionUnit,bad).study.done,0);n++;}
assert.deepEqual(e.completion({questions:[],tests:[]},{}).study,{done:0,total:0,percent:0,complete:false});n++;
assert.equal(e.completion({questions:Array.from({length:100},(_,i)=>({id:String(i),type:'input'}))},{done:Array.from({length:99},(_,i)=>String(i))}).study.complete,false);n++;
console.log(`${n} checks passed`);
