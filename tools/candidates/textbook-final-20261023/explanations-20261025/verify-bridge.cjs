const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const ROOT=path.resolve(__dirname,'../../../..'),REL=path.relative(ROOT,__dirname),receipt=JSON.parse(fs.readFileSync(path.join(__dirname,'receipt.json'))),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
let checks=0;
function clone(run){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'nobi-explanation-bridge-'));
 const copy=relative=>{const out=path.join(root,relative);fs.mkdirSync(path.dirname(out),{recursive:true});fs.copyFileSync(path.join(ROOT,relative),out);};
 for(const f of [path.join(REL,'receipt.json'),path.join(REL,'checked-source.cjs'),...receipt.files.flatMap(r=>[r.file,r.beforeFile]),...receipt.proofs.map(r=>r.file)])copy(f);
 try{run(root);}finally{fs.rmSync(root,{recursive:true,force:true});}
}
function execute(root){return spawnSync(process.execPath,[path.join(root,REL,'checked-source.cjs'),'site-assets/textbook-book-math1.json'],{encoding:'utf8'});}
function mutateReceipt(root,fn){const f=path.join(root,REL,'receipt.json'),r=JSON.parse(fs.readFileSync(f));fn(r);fs.writeFileSync(f,JSON.stringify(r));}
clone(root=>{const result=execute(root);assert.equal(result.status,0);assert.equal(result.stdout.trim(),receipt.files.find(r=>r.file==='site-assets/textbook-book-math1.json').beforeFile);checks++;});
const cases=[
 root=>fs.appendFileSync(path.join(root,'site-assets/textbook-book-math1.json'),' '),
 root=>mutateReceipt(root,r=>r.files.find(x=>x.jsonChanges).jsonChanges[0].path=['title']),
 root=>{
  const file='site-assets/textbook-book-math1.json',book=JSON.parse(fs.readFileSync(path.join(root,file)));
  function find(v,p=[]){if(v&&typeof v==='object'&&v.t==='details'&&v.body?.[0]?.x)return [...p,'body',0,'x'];if(v&&typeof v==='object')for(const [key,x]of Object.entries(v)){const found=find(x,[...p,Array.isArray(v)?Number(key):key]);if(found)return found;}return null;}
  const pointer=find(book);assert.ok(pointer);let node=book;for(const k of pointer.slice(0,-1))node=node[k];const old=node.x;node.x+=' tampered answer';const bytes=JSON.stringify(book);fs.writeFileSync(path.join(root,file),bytes);
  mutateReceipt(root,r=>{const row=r.files.find(x=>x.file===file);row.afterSha256=sha(bytes);row.jsonChanges.push({path:pointer,before:old,after:node.x});});
 },
 root=>fs.appendFileSync(path.join(root,receipt.files[0].beforeFile),'unexpected backup edit'),
 root=>fs.appendFileSync(path.join(root,receipt.proofs[0].file),' '),
 root=>mutateReceipt(root,r=>{const proof=r.proofs[0],file=path.join(root,proof.file),data=JSON.parse(fs.readFileSync(file));data.inputs[r.files[0].file]='0'.repeat(64);const bytes=JSON.stringify(data);fs.writeFileSync(file,bytes);proof.sha256=sha(bytes);}),
 root=>mutateReceipt(root,r=>r.files[0].file='unapproved-file.txt')
];
for(const run of cases)clone(root=>{run(root);assert.notEqual(execute(root).status,0);checks++;});
const inputs=Object.fromEntries(receipt.files.map(r=>[r.file,sha(fs.readFileSync(path.join(ROOT,r.file)))]));
fs.writeFileSync(path.join(__dirname,'bridge-result.json'),JSON.stringify({status:'passed',checks,inputs,scope:'Cloned-source strict bridge positive and seven tamper rejections: source, unexpected path, protected answer even with updated digest, backup, proof bytes, proof inputs even with updated digest, unknown file. Actual application files untouched.'},null,2)+'\n');
console.log('Approved explanation strict bridge: '+checks+' cloned-source checks passed');
