// Domain regression: generated教材 must not reveal these answers before opening their own explanation.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../../../',import.meta.url);
const book=JSON.parse(await readFile(new URL('site-assets/textbook-book-math1.json',root),'utf8'));
const ledger=JSON.parse(await readFile(new URL('教材整理/Claude_Codex共有/数学全体制作/メディア/制作ソース/依頼台帳_1件ずつ.json',root),'utf8'));
const cases=[
 {pid:'M1-P046',question:'**確認5-1**',row:['(−4.8)÷0.6＝8','ちがう符号なので −']},
 {pid:'M1-P046',question:'**確認5-2**',row:['0÷(−5)＝−5','0 をわると 0'],id:'M1-C1-S2-M05'},
 {pid:'M1-P050',question:'**確認6-1**',row:['−9/2 の逆数を 2/9 とする','逆数の符号は元と同じ → −2/9'],id:'M1-C1-S2-M06'},
 {pid:'M1-P087',question:'**確認3-2**',row:['20/x で x＝−4 を 20−4 とする','20/x は 20÷x → −5']},
 {pid:'M1-P094',question:'**確認1-1**',row:['7y−y を 7 とする','y は 1y。7y−1y＝6y']}
];
let checks=0;const ok=(value,label)=>{assert(value,label);checks++;};
const flat=blocks=>(blocks||[]).flatMap(b=>[b,...flat(b.body)]);
for(const c of cases){
 const pages=book.pages.filter(p=>p.pid===c.pid);ok(pages.length===1,c.pid+' appears once');
 const p=pages[0],at=p.blocks.findIndex(b=>b.t==='p'&&b.x.startsWith(c.question));ok(at>=0,'original question retained');
 const answer=p.blocks[at+1];ok(answer?.t==='details'&&answer.summary==='答えと解説','only the own closed explanation follows the question');
 ok(!p.blocks.some(b=>b.t==='table'&&b.rows.some(r=>JSON.stringify(r)===JSON.stringify(c.row))),'answer row absent from public table');
 ok(flat(answer.body).filter(b=>b.t==='table'&&b.rows.some(r=>JSON.stringify(r)===JSON.stringify(c.row))).length===1,'original row appears once in its own answer');
 if(c.id){
  ok(!p.blocks.some(b=>b.id===c.id),'answer image absent from public page');
  const all=book.pages.flatMap(p=>flat(p.blocks)).filter(b=>b.id===c.id);ok(all.length===1,'image identity retained exactly once in book');
  ok(flat(answer.body).some(b=>b.id===c.id&&b.kind==='diagram'),'same diagram inside own answer');
  const expected='/textbook-book-math1-'+c.id.toLowerCase()+'.svg';ok(all[0].src===expected,'same image reference retained');
  const media=await readFile(new URL('教材整理/Claude_Codex共有/数学全体制作/メディア/'+c.id+'.svg',root));
  const copy=await readFile(new URL('site-assets'+expected,root));
  ok(media.equals(copy),'book image is byte-identical to source');
  ok(createHash('sha256').update(copy).digest('hex')===ledger.find(r=>r.id===c.id)?.sha256,'current source/copy/ledger SHA match');
 }
}
ok(book.pages.find(p=>p.pid==='M1-P046').blocks.some(b=>b.t==='table'&&b.rows.some(r=>r[0]==='5÷0＝0')),'unrelated zero-division row preserved');
ok(book.pages.find(p=>p.pid==='M1-P050').blocks.some(b=>b.t==='table'&&b.rows.some(r=>r[0]==='48÷(−4)÷2 を、先に (−4)÷2 から計算する')),'unrelated calculation-order row preserved');
console.log('Hidden math answers: '+checks+' generated教材 checks passed; five rows and two images only in their own closed explanations, unrelated rows and image/source/ledger identity retained. No user data or network.');
