import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {serveNoteAnalysis} from '../../../cf-worker/src/openai-tutor-service.mjs';
import {planStatus} from '../../../cf-worker/src/plans.mjs';
const {noteJobRoute,readNoteJob}=await import(process.argv.includes('--main')?'../../../cf-worker/src/openai-note-jobs.mjs':'./jobs.mjs');
const {noteAnalysisRoute}=await import(process.argv.includes('--main')?'../../../cf-worker/src/openai-note-route.mjs':'./route.mjs');
const require=createRequire(import.meta.url),{D1SQLite}=require('../../../.claude/verify/d1-sqlite.js'),{chromium}=require('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const db=new D1SQLite(),uid='p_pro',owner='synthetic-owner',notes=new Map(),errors=[];
const env={AUTH_DB:db,SUBSCRIPTION_PREVIEW:'1',PREVIEW_PLAN_ACCOUNTS:'1',PLAN_CREDITS_V2:'1',OPENAI_ENABLED:'1',OPENAI_TRIAL_ONLY:'1',OPENAI_SAFETY_READY:'1',OPENAI_TERMS_READY:'1',OPENAI_BILLING_READY:'1',OPENAI_API_KEY:'synthetic-only',OPENAI_MONTHLY_LIMIT_YEN:'800'};
const value={summary:'数直線の向きを確かめよう。',strengths:[],checks:[],practice:[]};
let calls=0,checks=0,ready=false;const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
const fetcher=async(url,options)=>{calls++;if(url.endsWith('moderations'))return Response.json({results:[{flagged:false}]});const b=JSON.parse(options.body);return Response.json({status:'completed',model:b.model,service_tier:'default',output:[{type:'message',role:'assistant',content:[{type:'output_text',text:JSON.stringify(value)}]}],usage:{input_tokens:100,output_tokens:100}});};
const scripts=await Promise.all(['note-analysis-api.js','note-analysis.js','note-analysis.css'].map(p=>readFile(new URL('../../../site-assets/'+p,import.meta.url),'utf8')));
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,env.APP_ORIGIN||'http://127.0.0.1');let r;
  if(url.pathname==='/'){
   res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'});res.end(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>body{margin:12px;font:16px sans-serif}*{box-sizing:border-box}${scripts[2]}</style><main id="panel"></main><script>${scripts[0]}\n${scripts[1]}</script><script>var saved=${JSON.stringify(notes.get(url.searchParams.get('id')))},ui;function start(){ui?.destroy();ui=NobiNoteAnalysis.mount(document.getElementById('panel'),NobiNoteAnalysisAPI.create({same:()=>true,saved:()=>saved,draft:()=>saved,allowed:()=>true,request:(path,options)=>fetch(path,options)}));}start();</script>`);return;
  }
  if(url.pathname==='/plan')r=Response.json(await planStatus(env,uid));
  else if(url.pathname==='/learning-chat')r=Response.json({ready,connection:{trialLeft:10-calls/3,monthlyLimitYen:800}});
  else{
   const chunks=[];for await(const chunk of req)chunks.push(chunk);
   const request=new Request(url,{method:req.method,headers:req.headers,...(req.method==='POST'?{body:Buffer.concat(chunks)}:{})}),options={owner,fetcher,serve:serveNoteAnalysis};
   r=url.pathname==='/learning-note-analysis-job'?await noteJobRoute(request,env,{uid},options):await noteAnalysisRoute(request,env,{uid},options);
  }
  res.writeHead(r.status,Object.fromEntries(r.headers));res.end(await r.text());
 }catch(error){errors.push(error.message);res.writeHead(500);res.end('synthetic fixture error');}
});
let browser;
try{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));env.APP_ORIGIN='http://127.0.0.1:'+server.address().port;
 db.seed('active-session:'+uid,owner,Date.now()+600000);db.seed('openai-access:'+uid,JSON.stringify({version:'2026-10-14',ageBand:'13-17',guardianConsent:true,approved:true}));
 browser=await chromium.launch({headless:true});
 for(const width of [390,1280]){
  const note={id:'note_fixture_'+width,revision:1,title:'まとめ',text:'右に進むほど数は大きい。',images:[]},id='request_fixture_'+width,selection={id,noteId:note.id,revision:1};
  db.seed('learning-note:'+uid+':'+note.id,JSON.stringify(note));
  const request=new Request(env.APP_ORIGIN+'/learning-note-analysis-job',{method:'POST',headers:{Origin:env.APP_ORIGIN,'Content-Type':'application/json'},body:JSON.stringify(selection)});
  eq((await noteJobRoute(request,env,{uid},{owner})).status,200);
  eq((await serveNoteAnalysis(env,{uid},{noteId:note.id,revision:1},{owner,requestId:id,fetcher})).real,true);
  const edited={...note,revision:2,text:'右と左を、自分の例で説明した。'};db.seed('learning-note:'+uid+':'+note.id,JSON.stringify(edited));notes.set(note.id,edited);
  const beforeCalls=calls,used=(await planStatus(env,uid)).dailyUsed;ready=false;
  const page=await browser.newPage({viewport:{width,height:950}});page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
  await page.goto(env.APP_ORIGIN+'/?id='+note.id);await page.getByText('前に保存した分析です。AI回分は使っていません。',{exact:true}).waitFor();
  eq(await page.getByText('保存済みノート 第1版の分析です。',{exact:true}).isVisible(),true);eq(calls,beforeCalls);eq((await planStatus(env,uid)).dailyUsed,used);eq((await readNoteJob(db,uid,note.id)).state,'done');
  eq(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  ready=true;await page.evaluate(()=>start());await page.getByRole('button',{name:'AIで振り返る（3回分）',exact:true}).waitFor();await page.waitForFunction(()=>!Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='AIで振り返る（3回分）')?.disabled);
  eq(calls,beforeCalls);await page.getByRole('button',{name:'AIで振り返る（3回分）',exact:true}).click();await page.getByText('分析を保存しました。3回分を使いました。',{exact:true}).waitFor();
  eq(calls,beforeCalls+3);eq((await planStatus(env,uid)).dailyUsed,used+3);eq((await readNoteJob(db,uid,note.id)).revision,2);
  eq(await page.getByText('保存済みノート 第2版の分析です。',{exact:true}).isVisible(),true);eq(db.get('learning-note-analysis:'+uid+':'+id)!==null,true);eq(JSON.parse(db.get('learning-note:'+uid+':'+note.id).v),edited);await page.close();
 }
 eq(errors,[]);console.log('Note recovery browser: '+checks+' checks passed; existing note UI/API + real candidate SQLite routes, old result after source edit and provider stop, atomic job completion, explicit new revision generation, no duplicate charge; two widths, fake provider only');
}finally{await browser?.close();await new Promise(r=>server.close(r));db.close();}
