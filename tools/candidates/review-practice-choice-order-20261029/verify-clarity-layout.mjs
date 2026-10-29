// Actual unchanged practice UI, public candidate questions only, isolated local transport.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import data from './clarity/ai-review-practice-data.mjs';
import shipped from '../../../cf-worker/src/ai-review-practice-data.mjs';
const {chromium}=createRequire(import.meta.url)('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const here=new URL('./clarity/',import.meta.url),root=new URL('../../../',import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex');
const oldIds=new Set(shipped.questions.map(q=>q.id)),questions=data.questions.filter(q=>!oldIds.has(q.id)).map(q=>({id:q.id,type:q.type,prompt:q.prompt}));assert.equal(questions.length,48);
const assetNames=['review-practice.js','review-practice.css','test-review.css','vertical-fractions.js'],assets=new Map(),inputs=[];
for(const name of assetNames){const file='site-assets/'+name,bytes=await readFile(new URL(file,root));assets.set('/'+name,bytes);inputs.push({file,sha256:sha(bytes)});}
const publicBytes=Buffer.from(JSON.stringify(questions));assets.set('/questions.json',publicBytes);
const html=`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/test-review.css"><link rel="stylesheet" href="/review-practice.css"><style>body{margin:0;background:#f3f8f5;font-family:system-ui}</style><script src="/vertical-fractions.js"></script><script src="/review-practice.js"></script><script>const owner={uid:'synthetic-layout-only'};window.posts=0;window.nobiReviewPracticeAPI={available:()=>true,snapshot:()=>owner,matches:v=>v===owner,get:async ref=>({question:window.publicQuestions.find(q=>q.id===ref.practiceId)}),post:()=>{window.posts++;throw Error('unexpected grading request')}};window.ready=fetch('/questions.json').then(r=>r.json()).then(q=>window.publicQuestions=q);</script>`;
let outside=0,checks=0;const results=[],errors=[],screens=[];const check=(v,m)=>{assert(v,m);checks++;};
const server=createServer((req,res)=>{const name=new URL(req.url,'http://fixture.invalid').pathname;const bytes=name==='/'?Buffer.from(html):assets.get(name);if(!bytes){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':name.endsWith('.json')?'application/json':'text/html;charset=utf-8'}).end(bytes);});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;let browser;
const selected=new Set(['review-sector-03-c1','review-cone-02-c1','review-data-01-c1','review-micro-02-c1','review-adddiff-02-c1','review-negcmp-02-c1','review-partic-03-c1','review-perfect-02-c1','review-itfor-03-c1','review-future-03-c1']);
try{
 browser=await chromium.launch({headless:true});await mkdir(new URL('screens/',here),{recursive:true});
 for(const [width,large,dark] of [[390,false,false],[820,false,false],[1180,false,false],[1440,false,false],[390,true,true]]){
  const context=await browser.newContext({viewport:{width,height:950},serviceWorkers:'block'}),page=await context.newPage();
  await page.route('**/*',route=>{if(new URL(route.request().url()).origin===origin)return route.continue();outside++;return route.abort();});page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin);await page.evaluate(()=>ready);if(large)await page.evaluate(()=>document.body.classList.add('large-text'));if(dark)await page.evaluate(()=>{document.documentElement.style.setProperty('--box-bg','#192b32');document.documentElement.style.setProperty('--text-color','#f5fcfa');});
  for(const q of questions){
   await page.evaluate(q=>NobiReviewPractice.open({jobId:'00000000-0000-4000-8000-000000000001',questionId:'synthetic-layout-source',practiceId:q.id}),q);
   await page.locator('.rp-prompt').waitFor();await page.evaluate(()=>document.fonts.ready);
   const state=await page.evaluate(()=>{const f=document.querySelector('.rp-frame'),p=document.querySelector('.rp-prompt'),rect=f.getBoundingClientRect();return {frameFits:f.scrollWidth<=f.clientWidth&&rect.left>=0&&rect.right<=innerWidth,promptFits:p.scrollWidth<=p.clientWidth,answerHidden:document.querySelector('.rp-result').textContent===''&&getComputedStyle(document.querySelector('.rp-result')).display==='none',unchangedText:p.textContent,vertical:[...p.querySelectorAll('.vfrac')].every(v=>v.querySelector('.vfrac-num').getBoundingClientRect().bottom<=v.querySelector('.vfrac-den').getBoundingClientRect().top+1),fractions:p.querySelectorAll('.vfrac').length,posts:window.posts};});
   check(state.frameFits&&state.promptFits,'no horizontal clipping '+width+' '+q.id);check(state.answerHidden&&state.posts===0,'no premature answer or grading '+q.id);check(state.unchangedText===q.prompt,'vertical fractions preserve original accessible text '+q.id);check(state.vertical,'fraction numerator above denominator '+q.id);
   const button=page.getByRole('button',{name:'理由を確かめる',exact:true});await button.scrollIntoViewIfNeeded();check(await button.isVisible()&&await button.isDisabled(),'answer action reachable but no automatic submit');
   await page.locator('.rp-frame').evaluate(f=>f.scrollTop=0);
   if((width===390&&!large&&selected.has(q.id))||(width===1440&&['review-sector-03-c1','review-micro-02-c1','review-partic-03-c1'].includes(q.id))||(large&&['review-adddiff-02-c1','review-partic-03-c1','review-itfor-03-c1'].includes(q.id))){
    const file='screens/'+q.id+'-'+width+(large?'-large-dark':'')+'.png';await page.locator('.rp-frame').screenshot({path:new URL(file,here).pathname});screens.push({id:q.id,width,large,dark,file});
   }
   results.push({id:q.id,width,large,dark,...state});await page.getByRole('button',{name:'解説へ戻る',exact:true}).click();check(await page.locator('.rp-back').count()===0,'real close works');
  }
  check(await page.evaluate(()=>window.posts)===0,'zero grading writes at viewport '+width);await context.close();
 }
 check(results.length===240,'48 questions across4 widths plus large-dark phone');check(outside===0&&errors.length===0,'no outside requests or page errors');
 for(const input of inputs)check(sha(await readFile(new URL(input.file,root)))===input.sha256,'main UI unchanged during verification');
 await writeFile(new URL('layout-result.json',here),JSON.stringify({status:'passed',checks,questions:48,cases:results.length,inputs,candidateSha256:sha(await readFile(new URL('ai-review-practice-data.mjs',here))),screens,results,errors,outside,scope:'Unchanged actual practice UI and fraction rendering; public candidate question shape only, synthetic no-write API, no route/auth/AI proof. All48 at390/820/1180/1440 and390 large dark; clipping, reachability, closed answer, original text and vertical fractions. Selected16 screenshots await direct visual review.'},null,2)+'\n');
 console.log('Candidate practice layouts: '+checks+' checks passed,240 cases,16 selected screenshots; no writes/external requests.');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
