const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const sha=v=>crypto.createHash('sha256').update(v).digest('hex');
const patches=JSON.parse(fs.readFileSync(path.join(__dirname,'conditions.json'))),out=path.join(__dirname,'units');
fs.mkdirSync(out,{recursive:true});const files=[],seen=new Set();
for(const unit of ['hansha','kitai','kubetsu','youkaido']){
 const name=`tokkun-science-1-${unit}.json`,file=path.join(__dirname,'../../../教材整理/確認済み',name),raw=fs.readFileSync(file),original=JSON.parse(raw),copy=JSON.parse(raw);
 for(let i=0;i<copy.questions.length;i++){
  const q=copy.questions[i],patch=patches[q.id];if(!patch)continue;
  seen.add(q.id);assert.equal(q.answer.kind,'rubric');Object.assign(q.answer,patch);
  const a={...original.questions[i]},b={...q};delete a.answer;delete b.answer;assert.deepEqual(a,b);
 }
 const bytes=JSON.stringify(copy,null,2)+'\n';fs.writeFileSync(path.join(out,name),bytes);
 files.push({file:'教材整理/確認済み/'+name,sourceSha256:sha(raw),candidateSha256:sha(bytes),changedQuestionIds:copy.questions.filter(q=>patches[q.id]).map(q=>q.id)});
}
assert.deepEqual([...seen].sort(),Object.keys(patches).sort());
fs.writeFileSync(path.join(__dirname,'manifest.json'),JSON.stringify({state:'candidate-not-integrated',scope:'only five answer rubrics; prompts, numerical data, sources, explanations and other questions preserved',files},null,2)+'\n');
console.log('Science rubric candidates: 4 units prepared; only 5 answer conditions differ; all other fields preserved');
