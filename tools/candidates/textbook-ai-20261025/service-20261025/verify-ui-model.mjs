import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
const source=await readFile(new URL('./ui-candidate/textbook-ai-model.js',import.meta.url),'utf8');
const sandbox={crypto:webcrypto};sandbox.globalThis=sandbox;vm.runInNewContext(source,sandbox);
const M=sandbox.NobiTextbookAIModel,anchor='a'.repeat(64),book='math1';let checks=0;
const ok=(v,m)=>{assert.ok(v,m);checks++;},copy=x=>JSON.parse(JSON.stringify(x));
const context={book,anchor,annotationSignature:'b'.repeat(64),contextSha256:'c'.repeat(64),sourceSha256:'d'.repeat(64),quote:'かっこの中から計算します。',kind:'p',title:'合成教材',subject:'数学',chapter:'合成章',section:'S1',sectionTitle:'計算',page:1};
function fixture(){
 const rows=new Map(),posts=[],results=new Map();let actor={uid:'u4',epoch:1},failPut=false,failGet=false,losePost=false,sourceWait=null,postWait=null;
 const store={get:async key=>{if(failGet)throw Error('draft_store');return copy(rows.get(key)||null);},put:async d=>{if(failPut)throw Error('draft_store');rows.set(d.anchor,copy(d));return true;},clear:async d=>{if(JSON.stringify(rows.get(d.anchor))===JSON.stringify(d)){rows.delete(d.anchor);return true;}return false;}};
 const api={snapshot:()=>({...actor}),matches:who=>who.uid===actor.uid&&who.epoch===actor.epoch,source:async()=>{if(sourceWait)await sourceWait;return {context:copy(context)};},history:async q=>q.id?results.has(q.id)?{state:'done',item:copy(results.get(q.id))}:{state:'unknown'}:{canSend:true,items:[...results.values()].map(copy)},post:async body=>{
  ok(rows.get(anchor)?.pending?.id===body.id,'pending identity durable before API call');posts.push(copy(body));
  const item={id:body.id,text:body.text,book,anchor,context:copy(context),answer:'まず、かっこの内側を確かめます。',state:'done',real:true,mock:false,model:'gpt-6.1-sol'};
  results.set(body.id,item);if(postWait)await postWait;if(losePost)throw Error('network_lost');return {real:true,model:item.model,value:{answer:item.answer},context:copy(context)};
 }};
 return {rows,posts,results,store,api,model:()=>M.create(api,book,{store}),set failPut(v){failPut=v;},set failGet(v){failGet=v;},set losePost(v){losePost=v;},set sourceWait(v){sourceWait=v;},set postWait(v){postWait=v;},change:()=>{actor={uid:'u1',epoch:actor.epoch+1};}};
}
{
 const f=fixture(),m=f.model();ok(m.durable,'durability exposed without credentials');await m.edit(anchor,'どう計算しますか。');ok(f.rows.get(anchor).text==='どう計算しますか。','own text saved');
 m.destroy();const reopened=f.model();ok((await reopened.load(anchor)).text==='どう計算しますか。','reopened draft restored');
 const item=await reopened.send(anchor,context);ok(item.state==='done'&&f.posts.length===1,'explicit send returns validated result');ok(!f.rows.has(anchor)&&(await reopened.load(anchor)).text==='','acknowledged matching draft cleared');
 ok(!JSON.stringify([...f.rows]).includes('epoch'),'actor credentials never persisted');
}
{
 const f=fixture(),m=f.model();await m.edit(anchor,'順番を教えてください。');f.losePost=true;
 await assert.rejects(m.send(anchor,context));checks++;const pending=(await m.load(anchor)).pending;
 ok(pending&&f.rows.get(anchor).pending.id===pending.id,'lost response retains immutable durable request');
 await assert.rejects(m.edit(anchor,'変えたい文'));checks++;ok((await m.load(anchor)).text===pending.text,'unknown request cannot silently change text');
 const r=await m.recover(anchor);ok(r.state==='done'&&f.posts.length===1&&!f.rows.has(anchor),'read-only recovery does not resend');
}
{
 const f=fixture(),m=f.model();await m.edit(anchor,'もう一度。');f.losePost=true;await assert.rejects(m.send(anchor,context));checks++;
 const id=f.posts[0].id;f.results.clear();m.destroy();const reopened=f.model();ok((await reopened.recover(anchor)).state==='unknown','unknown result does not become a new request');
 f.losePost=false;await reopened.send(anchor,{...context,annotationSignature:'e'.repeat(64)});
 ok(f.posts.length===2&&f.posts[1].id===id&&f.posts[1].annotationSignature===context.annotationSignature,'explicit retry keeps original id and source version');
}
{
 const f=fixture(),m=f.model();await m.edit(anchor,'下書きを守る。');f.failPut=true;
 await assert.rejects(m.send(anchor,context));checks++;ok(f.posts.length===0,'draft persistence failure never dispatches');
 ok(!(await m.load(anchor)).pending&&(await m.load(anchor)).text==='下書きを守る。','known unsent draft remains editable after storage failure');
 f.failPut=false;await m.edit(anchor,'直した下書き。');ok(f.rows.get(anchor).text==='直した下書き。','retry persistence preserves latest text');
}
{
 const f=fixture(),m=f.model();f.failGet=true;await assert.rejects(m.edit(anchor,'空で上書きしない。'));checks++;ok(f.rows.size===0&&f.posts.length===0,'unreadable original store is not overwritten or sent');
}
{
 const f=fixture(),m=f.model();let release;f.sourceWait=new Promise(r=>release=r);const p=m.source(anchor,context.annotationSignature);f.change();release();await assert.rejects(p);checks++;ok(!m.current(),'late source result rejected after account change');
}
{
 const f=fixture(),m=f.model();await m.edit(anchor,'本人別の送信。');let release;f.postWait=new Promise(r=>release=r);const p=m.send(anchor,context);
 while(!f.posts.length)await new Promise(r=>setTimeout(r,0));f.change();release();await assert.rejects(p);checks++;ok(f.rows.get(anchor)?.pending,'late other-account result never clears original owner draft');
}
{
 const f=fixture();f.rows.set(anchor,{version:1,book,anchor,text:'保存済み',context:null,pending:null,extra:'unrecognized'});const m=f.model();await assert.rejects(m.load(anchor));checks++;ok(f.rows.get(anchor).extra==='unrecognized','corrupt stored shape is preserved and blocked');
}
const result={status:'passed',checks,scope:'Candidate model only, injected isolated draft store. Stable pending identity, lost-response recovery, fresh retry/edit protection, blocked persistence, late actor responses. Real IndexedDB/browser/main integration remain separate.'};
await writeFile(new URL('./ui-model-result.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log('Textbook AI draft model: '+checks+' checks passed');
