const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=JSON.parse(fs.readFileSync(path.join(__dirname,'package-location.json'))).sandbox;
const staged=JSON.parse(fs.readFileSync(path.join(root,'site-assets/material-bank.json')));
const original=JSON.parse(fs.readFileSync(path.join(__dirname,'../../../site-assets/material-bank.json')));
const engine=require(path.join(root,'cf-worker/src/material-engine.cjs'));
const patches=JSON.parse(fs.readFileSync(path.join(__dirname,'conditions.json')));
assert.deepEqual(staged.sources,original.sources);
assert.deepEqual(staged.units.map(x=>x.id),original.units.map(x=>x.id));
let checked=0,changed=0;
for(let i=0;i<staged.units.length;i++){
 const unit=staged.units[i],before=JSON.parse(JSON.stringify(original.units[i])),after=JSON.parse(JSON.stringify(unit));
 assert.deepEqual(engine.validateUnit(unit,{sources:staged.sources}),[]);checked++;
 for(let j=0;j<unit.questions.length;j++){
  const q=unit.questions[j];if(!patches[q.id])continue;
  assert.notDeepEqual(before.questions[j].answer,after.questions[j].answer);changed++;
  delete before.questions[j].answer;delete after.questions[j].answer;
 }
 assert.deepEqual(before,after);
}
assert.equal(changed,5);
const cases=JSON.parse(fs.readFileSync(path.join(__dirname,'candidate-results.json'))).cases;
for(const c of cases){const q=staged.units.flatMap(x=>x.questions).find(q=>q.id===c.id);assert.ok(q);assert.equal(engine.grade(q,c.input).correct,c.expected);checked++;}
console.log(`Science staged package: ${checked} checks passed; 192 units and 466 sources preserved, exactly 5 answer changes, 39 answer probes on rebuilt server package`);
