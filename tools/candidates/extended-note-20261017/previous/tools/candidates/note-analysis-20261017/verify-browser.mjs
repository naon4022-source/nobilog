import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
const {chromium}=createRequire(import.meta.url)('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const mainMode=process.argv.includes('--main');
const script=await readFile(new URL(mainMode?'../../../site-assets/note-analysis.js':'./note-panel.js',import.meta.url),'utf8'),css=await readFile(new URL(mainMode?'../../../site-assets/note-analysis.css':'./note-panel.css',import.meta.url),'utf8');
const html=`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>body{margin:12px;font:16px sans-serif}*{box-sizing:border-box}${css}</style><main id="panel"></main><script>${script}</script><script>
var saved={id:'note_fixture',revision:1,title:'数直線',text:'右に進むほど数は大きい。',images:[]},draft=structuredClone(saved),job=null,requests=[],writes=0,saveOK=true,live=true,ready=true,allowed=true,lose=false,hold=false,release=null;
var result={summary:'数直線の向きを確認しています。',strengths:['向きに注目しています。'],checks:[{quote:'右に進む',reason:'実際の数でも確かめよう。',nextStep:'0と1を比べよう。'}],practice:[{question:'0と1では、どちらが右？',answer:'1',reason:'右ほど大きいからです。'}]};
var completed=null,ui=null;
function start(){ui?.destroy();ui=NobiNoteAnalysis.mount(document.getElementById('panel'),{same:()=>live,saved:()=>saved,draft:()=>draft,allowed:()=>allowed,status:async()=>({ready}),loadJob:async()=>job,saveJob:async j=>{writes++;if(!saveOK)return false;job=structuredClone(j);return true;},readResult:async id=>completed?.item.id===id?completed:null,analyze:async b=>{requests.push(b);if(hold)await new Promise(r=>release=r);const response={item:{...b,real:true,model:'gpt-6.1-sol',analysis:result},cached:completed!==null};completed=response;if(lose){lose=false;throw Error('synthetic lost reply');}return response;}});}
start();</script>`;
const server=createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'});res.end(html);});await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser,n=0;const ok=(v)=>{assert(v);n++;};
try{
 browser=await chromium.launch({headless:true});
 for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:950}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
  const reset=async()=>{await page.goto('http://127.0.0.1:'+server.address().port);await page.getByRole('button',{name:'AIで振り返る（3回分）',exact:true}).waitFor();await page.waitForFunction(()=>!document.querySelector('#panel button').disabled);};
  await reset();ok(await page.evaluate(()=>requests.length===0&&writes===0));
  await page.getByRole('button',{name:'AIで振り返る（3回分）',exact:true}).click();await page.getByText('分析を保存しました。3回分を使いました。',{exact:true}).waitFor();
  ok(await page.evaluate(()=>requests.length===1&&JSON.stringify(Object.keys(requests[0]).sort())==='["id","noteId","revision"]'));ok(await page.evaluate(()=>saved.revision===1&&saved.text===draft.text));
  ok(await page.locator('details:not([open])').count()===1);await page.locator('summary').click();ok(await page.getByText('1',{exact:true}).isVisible());
  await page.evaluate(()=>start());await page.getByText('前に保存した分析です。AI回分は使っていません。',{exact:true}).waitFor();ok(await page.evaluate(()=>requests.length===1));
  ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await reset();await page.evaluate(()=>{saveOK=false;});await page.getByRole('button',{name:'AIで振り返る（3回分）',exact:true}).click();await page.getByText('分析を確認できませんでした。元のノートと送信番号は残しています。同じ番号で確認できます。',{exact:true}).waitFor();ok(await page.evaluate(()=>requests.length===0));
  await reset();await page.evaluate(()=>{lose=true;});await page.getByRole('button',{name:'AIで振り返る（3回分）',exact:true}).click();await page.getByRole('button',{name:'前の送信を同じ番号で確認する',exact:true}).waitFor();const first=await page.evaluate(()=>requests[0].id);
  await page.getByRole('button',{name:'前の送信を同じ番号で確認する',exact:true}).click();await page.getByText('前の結果です。AI回分は増えていません。',{exact:true}).waitFor();ok(await page.evaluate(id=>requests.length===2&&requests.every(x=>x.id===id),first));
  await reset();await page.evaluate(()=>{draft.text='未保存の変更';ui.refresh();});ok(await page.getByRole('button',{name:'AIで振り返る（3回分）',exact:true}).isDisabled());ok(await page.evaluate(()=>requests.length===0));
  await reset();await page.evaluate(()=>{saved.images=['a'.repeat(64)];draft=structuredClone(saved);ui.refresh();});ok(await page.getByRole('button',{name:'AIで振り返る（3回分）',exact:true}).isDisabled());
  await reset();await page.evaluate(()=>{hold=true;});await page.getByRole('button',{name:'AIで振り返る（3回分）',exact:true}).click();await page.waitForFunction(()=>typeof release==='function');await page.evaluate(()=>{live=false;release();});await page.waitForTimeout(30);ok(await page.getByRole('heading',{name:'AIと、理解を確かめよう',exact:true}).count()===0);
  ok(errors.length===0);await page.close();
 }
 console.log('Note analysis panel: '+n+' synthetic browser checks passed; 390/1280px, explicit send, pre-send persistence, stable retry ID, read-only reopening, source/owner protection');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
