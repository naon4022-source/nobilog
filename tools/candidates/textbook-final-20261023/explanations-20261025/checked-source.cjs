// Tooling-only strict bridge for explicitly approved explanatory deltas.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'../../../..'),RECEIPT=path.join(__dirname,'receipt.json');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const mathSource='教材整理/Claude_Codex共有/数学全体制作/Claude原稿/M1-C1-S2/';
const expected=new Set([mathSource+'本文.md',mathSource+'本の追加.json','site-assets/textbook-book-math1.json','site-assets/textbook-book-geography.json','教材整理/Claude_Codex共有/地理全体制作/原稿/u02.py']);
const mathPaths=new Set(['pages/69/blocks/7/items/0/x','pages/69/blocks/7/items/1/x','pages/69/blocks/7/items/2/x','pages/69/blocks/7/items/3/x','pages/70/blocks/1/items/0/x','pages/70/blocks/2/x','pages/69/blocks/1/x']);
function checkDelta({requireProof=true}={}){
 const receipt=JSON.parse(fs.readFileSync(RECEIPT));assert.equal(receipt.version,1);assert.equal(receipt.files.length,5);
 assert.match(receipt.approval,/explicitly authorized all/);
 assert.deepEqual(new Set(receipt.files.map(r=>r.file)),expected);
 for(const row of receipt.files){
  const backup=path.resolve(ROOT,row.beforeFile);assert.ok(backup.startsWith(path.join(__dirname,'before')+path.sep));
  const old=fs.readFileSync(backup),current=fs.readFileSync(path.join(ROOT,row.file));
  assert.equal(sha(old),row.beforeSha256);assert.equal(sha(current),row.afterSha256);
  let result;
  if(row.jsonChanges){
   const value=JSON.parse(old);assert.equal(JSON.stringify(value),old.toString());
   const allowed=row.file.endsWith('math1.json')?mathPaths:new Set(['pages/22/blocks/3/items/0/x']);
   assert.deepEqual(new Set(row.jsonChanges.map(c=>c.path.join('/'))),allowed);
   assert.equal(row.jsonChanges.length,allowed.size);
   for(const c of row.jsonChanges){
    let node=value;for(const key of c.path.slice(0,-1))node=node[key];
    assert.equal(node[c.path.at(-1)],c.before);assert.equal(typeof c.before,'string');assert.equal(typeof c.after,'string');
    node[c.path.at(-1)]=c.after;
   }
   result=Buffer.from(JSON.stringify(value));
  }else{
   assert.equal(row.edits.length,row.file.endsWith('本文.md')?3:1);
   let text=old.toString();
   for(const edit of row.edits){assert.equal(text.split(edit.before).length,2);text=text.replace(edit.before,edit.after);}
   result=Buffer.from(text);
  }
  assert.deepEqual(current,result,row.file+': unapproved change outside exact explanatory delta');
 }
 if(requireProof){
  assert.equal(receipt.status,'preservation and actual book display passed; connected-batch full pending');
  assert.equal(receipt.proofs.length,2);
  for(const proof of receipt.proofs){
   assert.equal(proof.observedExitCode,0);const bytes=fs.readFileSync(path.join(ROOT,proof.file));assert.equal(sha(bytes),proof.sha256);
   const result=JSON.parse(bytes);assert.equal(result.status,'passed');assert.equal(result.checks,proof.checks);
   for(const row of receipt.files)assert.equal(result.inputs[row.file],row.afterSha256);
  }
 }
 return receipt;
}
function checkedSource(relative){
 if(!expected.has(relative))return fs.readFileSync(path.join(ROOT,relative));
 const receipt=checkDelta(),row=receipt.files.find(r=>r.file===relative);return fs.readFileSync(path.join(ROOT,row.beforeFile));
}
module.exports={checkDelta,checkedSource};
if(require.main===module){
 const relative=process.argv[2];assert.ok(expected.has(relative));const receipt=checkDelta();
 console.log(receipt.files.find(r=>r.file===relative).beforeFile);
}
