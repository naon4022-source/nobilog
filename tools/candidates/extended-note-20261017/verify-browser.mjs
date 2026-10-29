import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {deflateSync} from 'node:zlib';
const {serveNoteAnalysis}=await import(process.argv.includes('--main')?'../../../cf-worker/src/openai-tutor-service.mjs':'./service.mjs');
const {noteJobRoute}=await import(process.argv.includes('--main')?'../../../cf-worker/src/openai-note-jobs.mjs':'./jobs.mjs');
const {noteAnalysisRoute}=await import(process.argv.includes('--main')?'../../../cf-worker/src/openai-note-route.mjs':'./route.mjs');
import {canonicalImage} from '../../../cf-worker/src/learning-images.mjs';
import {planStatus} from '../../../cf-worker/src/plans.mjs';
const require=createRequire(import.meta.url),{D1SQLite}=require('../../../.claude/verify/d1-sqlite.js'),{chromium}=require('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const db=new D1SQLite(),uid='p_pro',owner='synthetic-owner',ids=[],notes=new Map(),errors=[];
const env={AUTH_DB:db,APP_ORIGIN:'',SUBSCRIPTION_PREVIEW:'1',PREVIEW_PLAN_ACCOUNTS:'1',PLAN_CREDITS_V2:'1',OPENAI_ENABLED:'1',OPENAI_TRIAL_ONLY:'1',OPENAI_SAFETY_READY:'1',OPENAI_TERMS_READY:'1',OPENAI_BILLING_READY:'1',OPENAI_API_KEY:'synthetic-only',OPENAI_MONTHLY_LIMIT_YEN:'800'};
for(let i=0;i<3;i++){const image=await canonicalImage({width:1,height:1,data:deflateSync(Buffer.from([i*70,0,0,255])).toString('base64')});ids.push(image.id);db.seed('learning-image:'+uid+':'+image.id,JSON.stringify(image));}
const scripts=await Promise.all(['../../../site-assets/note-analysis-api.js',process.argv.includes('--main')?'../../../site-assets/note-analysis.js':'panel.js'].map(p=>readFile(new URL(p,import.meta.url),'utf8'))),css=await readFile(new URL('../../../site-assets/note-analysis.css',import.meta.url),'utf8');
let generations=0,calls=0,checks=0;const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
const fetcher=async(url,options)=>{
 calls++;const b=JSON.parse(options.body);
 if(url.endsWith('moderations'))return Response.json({results:[{flagged:false}]});
 if(url.endsWith('input_tokens'))return Response.json({object:'response.input_tokens',input_tokens:13000});
 generations++;
 const n=Array.isArray(b.input)?b.input[0].content.length-1:0;
 const value={summary:'考え方を確かめよう。',strengths:[],checks:[],practice:n?[]:[{question:'どのように確かめる？',answer:'例を考えよう。',reason:'手順を振り返れます。'}],...(n?{imageChecks:Array.from({length:n},(_,image)=>({image,readable:false,observation:'文字を判読できません。',reason:'式を確認できません。',nextStep:'明るい場所で撮り直そう。'}))}:{})};
 return Response.json({status:'completed',model:b.model,service_tier:'default',output:[{type:'message',role:'assistant',content:[{type:'output_text',text:JSON.stringify(value)}]}],usage:{input_tokens:13000,output_tokens:300}});
};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,env.APP_ORIGIN||'http://127.0.0.1');
  if(url.pathname==='/'){
   const note=notes.get(url.searchParams.get('id'));
   res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'});res.end(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>body{margin:12px;font:16px sans-serif}*{box-sizing:border-box}${css}</style><main id="panel"></main><script>${scripts.join('\n')}</script><script>var saved=${JSON.stringify(note)};NobiNoteAnalysis.mount(document.getElementById('panel'),NobiNoteAnalysisAPI.create({same:()=>true,saved:()=>saved,draft:()=>saved,allowed:()=>true,request:(path,options)=>fetch(path,options)}));</script>`);return;
  }
  let r;
  if(url.pathname==='/plan')r=Response.json(await planStatus(env,uid));
  else if(url.pathname==='/learning-chat')r=Response.json({ready:true,connection:{trialLeft:10-generations,monthlyLimitYen:800}});
  else{
   const chunks=[];for await(const c of req)chunks.push(c);
   const request=new Request(url,{method:req.method,headers:req.headers,...(req.method==='POST'?{body:Buffer.concat(chunks)}:{})}),options={owner,fetcher,serve:serveNoteAnalysis};
   r=url.pathname==='/learning-note-analysis-job'?await noteJobRoute(request,env,{uid},options):await noteAnalysisRoute(request,env,{uid},options);
  }
  res.writeHead(r.status,Object.fromEntries(r.headers));res.end(await r.text());
 }catch(error){errors.push(error.message);res.writeHead(500);res.end('synthetic error');}
});
let browser;
try{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));env.APP_ORIGIN='http://127.0.0.1:'+server.address().port;
 db.seed('active-session:'+uid,owner,Date.now()+600000);db.seed('openai-access:'+uid,JSON.stringify({version:'2026-10-14',ageBand:'13-17',guardianConsent:true,approved:true}));
 browser=await chromium.launch({headless:true});
 for(const width of [390,1280])for(const n of [0,1,3]){
  const id='fixture_'+width+'_'+n,note={id,revision:1,title:'まとめ',text:n?'':'学び'.repeat(6000),images:ids.slice(0,n)},cost=3*Math.max(1,n);notes.set(id,note);db.seed('learning-note:'+uid+':'+id,JSON.stringify(note));
  const page=await browser.newPage({viewport:{width,height:950}});page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
  const before=calls,used=(await planStatus(env,uid)).dailyUsed;await page.goto(env.APP_ORIGIN+'/?id='+id);
  const button=page.getByRole('button',{name:'AIで振り返る（'+cost+'回分）',exact:true});await button.waitFor();await page.waitForFunction(()=>!Array.from(document.querySelectorAll('button')).find(b=>b.textContent.startsWith('AIで振り返る'))?.disabled);
  eq(calls,before);await button.click();await page.getByText('分析を保存しました。'+cost+'回分を使いました。',{exact:true}).waitFor();
  eq(calls,before+4);eq((await planStatus(env,uid)).dailyUsed,used+cost);eq(await page.locator('article h5').count(),n);
  if(n)eq(await page.getByText('文字を読み取れませんでした。',{exact:true}).count(),n);else eq(await page.locator('details:not([open])').count(),1);
  eq(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.reload();await page.getByText('前に保存した分析です。AI回分は使っていません。',{exact:true}).waitFor();eq(calls,before+4);eq((await planStatus(env,uid)).dailyUsed,used+cost);await page.close();
 }
 eq(errors,[]);console.log('Extended note browser: '+checks+' checks passed; 390/1280px, 12k text and 1/3 photos, visible 3/9 credits, unreadable image guidance, saved reload and no automatic generation; fake provider only');
}finally{await browser?.close();await new Promise(r=>server.close(r));db.close();}
