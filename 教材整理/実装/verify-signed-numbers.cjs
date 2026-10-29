const fs=require('node:fs'),assert=require('node:assert/strict'),e=require('./material-engine');
const u=JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'../確認済み/数学1年_正負の数.json')));let n=0;
const path=require('node:path'),crypto=require('node:crypto');
const sources=JSON.parse(fs.readFileSync(path.join(__dirname,'../教材照合台帳.json')));
const source=sources.find(s=>s.id==='source-0104');
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'../../',source.file))).digest('hex'),source.sha256);
assert.equal(u.status,'ready');assert.equal(u.textbook,undefined,'must not claim an uncreated textbook lesson');n+=3;
assert.deepEqual(e.validateUnit(u,{sources}),[]);assert.equal(u.questions.length,100);assert.equal(u.tests.length,15);
assert.ok(e.validateUnit(u,{sources:sources.map(s=>({...s,verified:false}))}).length);
const originalAnswers=['8,-3,10,0','8,10','-3','-1.5','0.5','右3.5','左2.5','左4.5','左4.5','7減る','3増える','6小さい','4大きい','6','7','4.5','3/8','0','4','-4','9','-2,-1.1','-6,-1/6','-1,0,3','-1/2,-1/3,-1/4','-3.6,-3,0,2,2.4,7','-4,-2,-0.5,0.25,1,2.4','東7km','西3km'];
originalAnswers.forEach((a,i)=>{assert.equal(e.grade(u.questions[i],a).correct,true,'source question '+(i+1));n++;});
// 正答データを流用せず、別の式・整数の列挙で15問を確認する。
const integers=Array.from({length:21},(_,i)=>i-10);
const testAnswers=['3',String(-.5*7),'1200円のししゅつ','-1.25',String(Math.max(-1.8,-7/4)),
 integers.filter(x=>x>-.75&&x<=1.25).join(','),[-.6,-2/3,0,3/5].sort((a,b)=>b-a).join(','),'4','9大きい',
 integers.filter(x=>x<0&&Math.abs(x)>3&&Math.abs(x)<6).join(','),
 integers.filter(x=>x>=-5&&x<=3&&Math.abs(x)>2).join(','),
 integers.filter(x=>Math.abs(x)>=1&&Math.abs(x)<=4&&x<2).join(','),String(-2+(1-(-2))/6*5),
 String(Math.abs(Math.min(-7/5,-1.4,-3/2,-1.45))),
 integers.filter(x=>x<0&&Math.abs(x)>2&&Math.abs(x)<5&&x>-4).join(',')];
testAnswers.forEach((a,i)=>{assert.equal(e.grade(u.tests[i],a).correct,true,'independent test '+(i+1));n++;});
assert.equal(e.grade(u.tests[6],'3/5,0,-2/3,-3/5').correct,false,'descending order matters');
assert.equal(e.grade(u.tests[10],'-5,-4,-3,-2,2,3').correct,false,'strict boundary matters');
assert.equal(e.grade(u.tests[2],'1200円の収入').correct,false,'opposite meaning matters');
for(const q of [...u.questions,...u.tests]){assert.equal(e.grade(q,'わかりません').correct,false);n++;}
assert.equal(new Set([...u.questions,...u.tests].map(q=>q.prompt)).size,115);
assert.equal(e.grade(u.questions[0],'-1.5,8,-3,10').correct,false);assert.equal(e.grade(u.questions[13],'-6').correct,false);
console.log(n+' independent/source and invalid-answer checks passed');
