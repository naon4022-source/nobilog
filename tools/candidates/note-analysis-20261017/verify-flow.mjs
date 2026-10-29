import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
const mainMode=process.argv.includes('--main');
const {noteJobRoute}=await import(mainMode?'../../../cf-worker/src/openai-note-jobs.mjs':'./note-jobs.mjs');
const {noteAnalysisRoute}=await import(mainMode?'../../../cf-worker/src/openai-note-route.mjs':'./note-route.mjs');
import {openaiChatRoute} from '../../../cf-worker/src/openai-chat-route.mjs';
import {planStatus} from '../../../cf-worker/src/plans.mjs';
import {learningAssistantRoute} from '../../../cf-worker/src/learning-assistant.mjs';
const require=createRequire(import.meta.url),{D1SQLite}=require('../../../.claude/verify/d1-sqlite.js'),{chromium}=require('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const main=new URL('../../../cf-worker/src/openai-tutor-service.mjs',import.meta.url);
let source=await readFile(main,'utf8');
if(!mainMode)for(const patch of JSON.parse(await readFile(new URL('./service-authorization-patches.json',import.meta.url),'utf8'))){assert.equal(source.split(patch.old).length-1,patch.count);source=source.split(patch.old).join(patch.new);}
source=source.replace(/from '(\.\/[^']+)'/g,(_,p)=>'from '+JSON.stringify(new URL(p,main).href));
source=source.replace('const units=creditUnits(purpose)',"const units=creditUnits(purpose==='note-analysis'?'note_analysis':purpose)");
source='import {capturedNote} from '+JSON.stringify(new URL('./note-context.mjs',import.meta.url).href)+';\nimport {noteContent} from '+JSON.stringify(new URL('./note-content.mjs',import.meta.url).href)+';\n'+source+'\n'+await readFile(new URL('./service-export.txt',import.meta.url),'utf8');
const {serveNoteAnalysis}=await import(mainMode?main.href:'data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const scripts=await Promise.all((mainMode?['../../../site-assets/note-analysis-api.js','../../../site-assets/note-analysis.js']:['note-browser-api.js','note-panel.js']).map(name=>readFile(new URL(name,import.meta.url),'utf8')));
const css=await readFile(new URL(mainMode?'../../../site-assets/note-analysis.css':'note-panel.css',import.meta.url),'utf8'),db=new D1SQLite(),owner='synthetic-owner',uid='p_pro';
const index=mainMode?await readFile(new URL('../../../index.html',import.meta.url),'utf8'):'';
const from=index.indexOf('    async function learningNotesOpen()'),to=index.indexOf('    async function learningImageRequest(',from);
if(mainMode)assert(from>=0&&to>from);
const env={AUTH_DB:db,SUBSCRIPTION_PREVIEW:'1',PREVIEW_PLAN_ACCOUNTS:'1',PLAN_CREDITS_V2:'1',OPENAI_ENABLED:'1',OPENAI_TRIAL_ONLY:'1',OPENAI_SAFETY_READY:'1',OPENAI_TERMS_READY:'1',OPENAI_BILLING_READY:'1',OPENAI_API_KEY:'synthetic-only',OPENAI_MONTHLY_LIMIT_YEN:'800'};
const noteText='右に進むほど数は大きい。';
const result={summary:'数直線の向きを整理しています。',strengths:['右と左に注目しています。'],checks:[{quote:'右に進む',reason:'数の例でも確認しよう。',nextStep:'0と1を比べよう。'}],practice:[{question:'0と1では、どちらが右？',answer:'1',reason:'右ほど大きくなるからです。'}]};
let calls=0,errors=[],n=0;const ok=(v,m)=>{assert(v,m);n++;};
const fetcher=async(url,options)=>{
 calls++;if(url.endsWith('moderations'))return Response.json({results:[{flagged:false}]});
 const b=JSON.parse(options.body);ok(b.model==='gpt-6.1-sol','advanced model for note analysis');ok(JSON.parse(b.input).note.text===noteText,'only authoritative note');
 return Response.json({status:'completed',model:b.model,output:[{type:'message',role:'assistant',content:[{type:'output_text',text:JSON.stringify(result)}]}],usage:{input_tokens:100,output_tokens:100}});
};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,env.APP_ORIGIN||'http://127.0.0.1'),path=url.pathname;
  if(path.startsWith('/learning-')||path==='/plan'){
   const chunks=[];for await(const chunk of req)chunks.push(chunk);
   const request=new Request(url,{method:req.method,headers:req.headers,...(req.method==='POST'?{body:Buffer.concat(chunks)}:{})});
   const options={owner,fetcher,serve:serveNoteAnalysis};
   const r=path==='/plan'?Response.json(await planStatus(env,uid)):path==='/learning-notes'?await learningAssistantRoute(request,env,{uid},{owner,fetchImpl:fetcher}):path==='/learning-note-analysis-job'?await noteJobRoute(request,env,{uid},options):path==='/learning-note-analysis'?await noteAnalysisRoute(request,env,{uid},options):await openaiChatRoute(request,env,{uid},options);
   res.writeHead(r.status,Object.fromEntries(r.headers));res.end(await r.text());return;
  }
  const width=url.searchParams.get('width'),id='note_fixture_'+width,saved={id,revision:1,title:'数直線 '+width,text:noteText,images:[]};
  const start=mainMode?`var uid='p_pro';function cloudIdentity(){return {uid};}function cloudSame(w){return w.uid===uid;}function cloudUrl(path){return path;}function cloudTry(path,options){return fetch(path,options);}function gOpenModal(html){document.getElementById('panel').innerHTML=html;}${index.slice(from,to)};void learningNotesOpen();`:`var saved=${JSON.stringify(saved)};NobiNoteAnalysis.mount(document.getElementById('panel'),NobiNoteAnalysisAPI.create({same:()=>true,saved:()=>saved,draft:()=>saved,allowed:()=>true,request:(path,options)=>fetch(path,options)}));`;
  const html=`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>body{margin:12px;font:16px sans-serif}*{box-sizing:border-box}input,textarea{display:block;width:100%;max-width:100%;font:inherit}${css}</style><main id="panel"></main><script>${scripts.join('\n')}</script><script>${start}</script>`;
  res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'});res.end(html);
 }catch(e){errors.push(e.message);res.writeHead(500);res.end('synthetic fixture error');}
});
let browser;
try{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));env.APP_ORIGIN='http://127.0.0.1:'+server.address().port;
 db.seed('active-session:'+uid,owner,Date.now()+600000);db.seed('openai-access:'+uid,JSON.stringify({version:'2026-10-14',ageBand:'13-17',guardianConsent:true,approved:true}));
 browser=await chromium.launch({headless:true});
 for(const width of [390,1280]){
  const note={id:'note_fixture_'+width,revision:1,title:'数直線 '+width,text:noteText,images:[]};db.seed('learning-note:'+uid+':'+note.id,JSON.stringify(note));
  const page=await browser.newPage({viewport:{width,height:950}});page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
  const before=calls,credits=(await planStatus(env,uid)).dailyUsed;await page.goto(env.APP_ORIGIN+'/?width='+width);
  if(mainMode)await page.getByRole('button',{name:note.title,exact:true}).click();
  const button=page.getByRole('button',{name:'AIで振り返る（3回分）',exact:true});await page.waitForFunction(()=>!document.querySelector('#panel button')?.disabled);
  ok(calls===before,'opening never generates');await button.click();await page.getByText('分析を保存しました。3回分を使いました。',{exact:true}).waitFor();
  ok(calls===before+3,'one moderated generation');ok((await planStatus(env,uid)).dailyUsed===credits+3,'actual shared quota charged three');
  ok(JSON.parse(await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind('learning-note:'+uid+':'+note.id).first('v')).text===noteText,'source unchanged');
  ok(await page.locator('details:not([open])').count()===1,'practice answer closed');
  if(mainMode){
   await page.locator('#learning-note-text').fill(noteText+' 変更中');ok(await page.getByRole('button',{name:'この版の分析を見る（追加消費なし）',exact:true}).isDisabled(),'unsaved editor disables analysis');
   await page.locator('#learning-note-text').fill(noteText);await page.getByRole('button',{name:'保存する',exact:true}).click();await page.getByText('サーバーに保存しました。',{exact:true}).waitFor();
   ok(calls===before+3,'saving note never auto-generates');
  }
  await page.reload();if(mainMode)await page.getByRole('button',{name:note.title,exact:true}).click();await page.getByText('前に保存した分析です。AI回分は使っていません。',{exact:true}).waitFor();ok(calls===before+3,'reload is read-only');
  if(mainMode)ok(await page.getByText('保存済みノート 第1版の分析です。',{exact:true}).isVisible(),'old analysis clearly labels its saved revision');
  ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow');await page.close();
 }
 ok(errors.length===0,'no server/browser errors');
 console.log('Note analysis integrated candidate: '+n+' checks passed; real job/analysis/status APIs + SQLite + browser + quota, synthetic provider only; no live API');
}finally{await browser?.close();await new Promise(r=>server.close(r));db.close();}
