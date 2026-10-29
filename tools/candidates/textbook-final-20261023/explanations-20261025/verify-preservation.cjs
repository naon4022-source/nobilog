const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {checkDelta}=require('./checked-source.cjs'),ROOT=path.resolve(__dirname,'../../../..');
let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++;};
const receipt=checkDelta({requireProof:false});ok(receipt.files.length===5,'exact five reviewed source/book deltas; every other byte/JSON field retained');
const math=JSON.parse(fs.readFileSync(path.join(ROOT,'site-assets/textbook-book-math1.json')));
const p=math.pages.find(p=>p.pid==='M1-P051'&&p.tag==='しくみ'),list=p.blocks.find(b=>b.t==='ol').items.map(x=>x.x);
ok(list[0].startsWith('かっこの中（内側から。')&&list[1]==='累乗','parentheses before outer power, including precedence within parentheses');
ok(list[2]==='乗法・除法（左から）'&&list[3]==='加法・減法（左から）','same-rank operations evaluated left to right');
const steps=math.pages.find(p=>p.pid==='M1-P052'&&p.tag==='解き方');
ok(steps.blocks[1].items[0].x.startsWith('かっこの内側を先に計算する。'),'procedure agrees with source explanation');
ok(steps.blocks[2].x.includes('かっこの内側から、その中でも'),'self-check includes parentheses');
ok(p.blocks.find(b=>b.t==='goal').x.includes('かっこの中→累乗→乗除→加減'),'goal agrees with explanation');
// Fixed independent examples distinguish incorrect interpretations without adding answers to teaching material.
ok((-2+5)**2===9,'evaluate bracket sum before applying its exponent');
ok(2*(1+3**2)===20,'power still precedes addition inside a bracket');
ok(24/4*2===12,'division and multiplication have equal priority, left to right');
ok(8-3+2===7,'subtraction and addition have equal priority, left to right');
for(const row of receipt.files.filter(r=>r.jsonChanges)){
 const old=JSON.parse(fs.readFileSync(path.join(ROOT,row.beforeFile))),now=JSON.parse(fs.readFileSync(path.join(ROOT,row.file)));
 const details=v=>Array.isArray(v)?v.flatMap(details):v&&typeof v==='object'?(v.t==='details'?[JSON.stringify(v)]:Object.values(v).flatMap(details)):[];
 assert.deepEqual(details(old),details(now));checks++;
 ok(old.pages.length===now.pages.length&&JSON.stringify(old.toc)===JSON.stringify(now.toc),'logical pages/TOC/hidden answers preserved');
}
const geo=JSON.parse(fs.readFileSync(path.join(ROOT,'site-assets/textbook-book-geography.json'))),tip=geo.pages[22].blocks[3].items[0].x;
ok(tip.includes('寒くなる傾向')&&tip.includes('乾燥帯は雨の少なさ'),'latitude tendency and dryness are distinguished');
const inputs=Object.fromEntries(receipt.files.map(r=>[r.file,crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,r.file))).digest('hex')]));
fs.writeFileSync(path.join(__dirname,'preservation-result.json'),JSON.stringify({status:'passed',checks,inputs,scope:'Exact approved explanation/goal/order changes only; all other fields and hidden answers retained. Fixed arithmetic witnesses, no real data or browser submissions.'},null,2)+'\n');
console.log('Approved explanations preservation: '+checks+' checks passed');
