// Execute after the shared full run: real old/new models, no saved user notes.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {webcrypto,createHash} from 'node:crypto';
import vm from 'node:vm';
const here=new URL('./',import.meta.url),load=async p=>JSON.parse(await readFile(new URL(p,here),'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
async function model(path){const ctx=vm.createContext({crypto:webcrypto,TextEncoder});vm.runInContext(await readFile(new URL(path,here),'utf8'),ctx);return ctx.NobiTextbookAnnotationModel;}
const old=await model('previous/textbook-annotation-model.js'),next=await model('candidate/textbook-annotation-model.js');
const bytes=await Promise.all(['previous/textbook-book-math1.json','candidate/textbook-book-math1.json'].map(p=>readFile(new URL(p,here))));
const books=bytes.map(b=>JSON.parse(b)),snapshots=books.map(b=>JSON.stringify(b));
const prepared=[await old.prepare(books[0],'math1'),await next.prepare(books[1],'math1')];
const serial=x=>JSON.parse(JSON.stringify(x));
function anchors(book){const all=[];function walk(blocks,pid){for(const b of blocks||[]){if(b.annotationAnchor)all.push({pid,anchor:b.annotationAnchor,quote:b.annotationQuote});if(b.t==='details')walk(b.body,pid);}}for(const p of book.data.pages)walk(p.blocks,p.pid);return serial(all).sort((a,b)=>a.anchor.localeCompare(b.anchor));}
let checks=0;const ok=(v,m)=>{assert(v,m);checks++;};
const a=anchors(prepared[0]),b=anchors(prepared[1]);
ok(a.length===2724&&b.length===2724,'all original anchors retained, no new hidden-answer anchors');
assert.deepEqual(b,a);checks++;
ok(new Set(b.map(x=>x.anchor)).size===2724,'no duplicate anchor identity');
ok(prepared[0].signature!==prepared[1].signature,'layout cache invalidates for the actual changed source');
ok(books.every((book,i)=>JSON.stringify(book)===snapshots[i]),'prepare never mutates source book');
const rules=await load('candidate/annotation-compatibility.json');
for(const rule of rules){const actual=a.find(x=>x.pid===rule.pid&&x.anchor===rule.anchor);ok(actual?.quote===rule.quote,'captured source identity matches actual old model');}
const moved=prepared[1].data.pages.find(p=>p.pid==='M1-P387').blocks.find(b=>b.t==='details');
ok(moved.body.filter(x=>x.annotationAnchor).length===3,'figure, heading and complete original steps retain identities inside own answer');
const cases=[
 {name:'unannotated answer',block:{t:'p',x:'合成の説明'}},
 {name:'invalid inherited key',block:{t:'p',x:'合成の説明',annotationAnchor:'invalid',annotationQuote:'合成の説明'}},
 {name:'changed source quote',block:{t:'p',x:'変更した説明',annotationAnchor:'a'.repeat(64),annotationQuote:'以前の説明'}},
 {name:'unsupported media',block:{t:'media',kind:'video',title:'合成の説明',annotationAnchor:'a'.repeat(64),annotationQuote:'合成の説明'}},
 {name:'empty quote',block:{t:'p',x:'',annotationAnchor:'a'.repeat(64),annotationQuote:''}},
];
for(const test of cases){const p=await next.prepare({pages:[{n:1,pid:'synthetic',blocks:[{t:'details',body:[test.block]}]}]},'math1');ok(anchors(p).length===0,test.name+' must not inherit a saved note');}
const positive=await next.prepare({pages:[{n:1,pid:'synthetic',blocks:[{t:'details',body:[{t:'p',x:'同じ説明',annotationAnchor:'a'.repeat(64),annotationQuote:'同じ説明'}]}]}]},'math1');
ok(anchors(positive)[0]?.anchor==='a'.repeat(64),'exact explicitly inherited identity remains available');
await writeFile(new URL('candidate-markers-result.json',here),JSON.stringify({status:'passed',checks,anchors:2724,inheritedBlocks:3,originalPage:'M1-P387',bookBeforeSha256:hash(bytes[0]),bookAfterSha256:hash(bytes[1]),realNotesRead:false,scope:'actual source/model identity and rejection cases; browser navigation remains separate'},null,2)+'\n');
console.log('Candidate marker continuity:',checks,'checks passed; all2724 anchors unchanged; no real notes read');
