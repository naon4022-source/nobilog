// 「分速175m」型の採点候補の検査（Claude 2026-10-29）。共通エンジンは読むだけ。写し（engine-元の写し.js）と候補（engine-候補.js）をくらべる
const fs=require('fs'),path=require('path');const A=require('./engine-元の写し.js'),B=require('./engine-候補.js');
const dir=path.join(__dirname,'../反映用_まとめ候補/原稿');const qs=[];
for(const f of fs.readdirSync(dir).filter(f=>f.endsWith('.json')))qs.push(...JSON.parse(fs.readFileSync(path.join(dir,f),'utf8')).questions);
let n=0,bad=0;const fails=[];const ok=(c,m)=>{n++;if(!c){bad++;fails.push(m);console.log('✗',m);}};
// 1) 対象16問：解説の答えの形（分速175m など）が○、前置きなし・単位だけも○、ちがう値・問題文にない前置きは×
const R=/^(分速|秒速|時速|毎分|毎秒|毎時)/;const target=[];
for(const q of qs){const i=q.explanation.lastIndexOf('答え');const t=q.explanation.slice(i+2).replace(/^[：:\s]+/,'').replace(/。$/,'').trim();
 if(q.answer.kind==='number'&&R.test(t)&&!A.grade(q,t).correct)target.push([q,t]);}
ok(target.length===16,'対象は16問（実際 '+target.length+'）');
for(const [q,t] of target){const a=q.answer,u=(a.units||[])[0]||'';const p=t.match(R)[1];
 ok(B.grade(q,t).correct,q.id+' 解説の答え「'+t+'」が○');
 ok(B.grade(q,a.value).correct&&B.grade(q,a.value+u).correct,q.id+' 前置きなしも○');
 ok(!B.grade(q,p+(Number(a.value)+1)+u).correct,q.id+' ちがう値は×');
 const other=['分速','秒速','時速','毎分','毎秒','毎時'].find(x=>!q.prompt.includes(x));ok(!B.grade(q,other+a.value+u).correct,q.id+' 問題文にない前置き「'+other+'」は×');
 ok(!B.grade(q,p+a.value).correct,q.id+' 前置きだけで単位なしは×（読みすぎない）');}
// 1b) 「以上」：hist1-10・hist3-12（「何 cm 以上の階級か」）
const T2=qs.filter(q=>['tokkun-math-1-hist1-10','tokkun-math-1-hist3-12'].includes(q.id));ok(T2.length===2,'以上の対象2問');
for(const q of T2){const a=q.answer,u=(a.units||[])[0]||'';ok(B.grade(q,a.value+' '+u+' 以上').correct,q.id+' 「'+a.value+' '+u+' 以上」が○');ok(!B.grade(q,a.value+' '+u+' 未満').correct,q.id+' 未満は×');ok(!B.grade(q,(Number(a.value)+5)+' '+u+' 以上').correct,q.id+' ちがう値は×');}
// 2) 全3713問の回帰：いろいろな入力で、元と候補の結果が同じ（ちがってよいのは「問題文にある前置き＋単位」の入力だけ）
const model=a=>a.kind==='number'||a.kind==='expr'||a.kind==='relation'?a.value:a.kind==='numbers'?a.values.join('、'):a.kind==='set'?a.items.map(x=>x[0]).join('、'):(a.accepted||[''])[0];
let diffAllowed=0,cmp=0;
for(const q of qs){const a=q.answer,m=model(a),u=(a.units||[])[0]||'';const i=q.explanation.lastIndexOf('答え');const t=q.explanation.slice(i+2).replace(/^[：:\s]+/,'').replace(/。$/,'').trim();
 const inputs=[m,m+u,m+' '+u,'わからない','',t,'1'+m,m+'0','分速'+m+u,'時速'+m+u,'毎分 '+m+' '+u,'分速'+m,'およそ'+m+u,m+' '+u+' 以上',m+u+'未満'];
 for(const s of inputs){const x=A.grade(q,s),y=B.grade(q,s);cmp++;
  if(x.correct!==y.correct){const tail=s.trim().match(/(以上|未満)$/);const allowed=y.correct&&a.kind==='number'&&((R.test(s.trim())&&u&&q.prompt.includes(s.trim().match(R)[1]))||(tail&&new RegExp('何\\s*\\S*\\s*'+tail[1]).test(q.prompt)));
   if(allowed)diffAllowed++;else ok(false,q.id+' 「'+s+'」で結果が変わった '+x.correct+'→'+y.correct);}}}
console.log('回帰：くらべた入力',cmp,'／ 変わってよい変化（問題文にある前置き＋単位、「何…以上」の問題の以上・未満）',diffAllowed);
fs.writeFileSync(path.join(__dirname,'result.json'),JSON.stringify({checks:n,failed:bad,targets:target.map(([q,t])=>({id:q.id,text:t})),regression:{compared:cmp,allowedChanges:diffAllowed},fails},null,1)+'\n');
console.log(`検査 ${n} / ✗ ${bad}`);process.exit(bad?1:0);
