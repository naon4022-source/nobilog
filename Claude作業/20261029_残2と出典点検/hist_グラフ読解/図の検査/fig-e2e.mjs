// 図つき特訓単元の通し検査（Claude 2026-10-28・候補フォルダ内だけ・本体は読むだけ）
// 使い方: node 図の検査/fig-e2e.mjs <単元キー>
// 1) 本物の build-material-assets.py を一時フォルダの写しで実行（確認済み・台帳・実装も写し）→ 画面用とサーバー用のバンクに image/imageAlt が残る
// 2) 本物の採点エンジン（写し）の validateUnit がエラー 0
// 3) 本物の material-ui.js（写し）で問題を作成し、図がすべて読みこまれ、alt が合い、横にはみ出さない（390/820/1280px）
// 4) SVG を1枚ずつ実表示し、文字が図の中に収まり、文字どうしが重ならない。答えの数が図にない。スクリプト・外部参照なし
// 外部通信はすべて止める。実データ・実採点・submitTest などは使わない。
import {createRequire} from 'node:module';import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import cp from 'node:child_process';import {createServer} from 'node:http';
const require=createRequire(import.meta.url);const {chromium}=require('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const key=process.argv[2];const HERE=path.dirname(decodeURIComponent(new URL(import.meta.url).pathname));const CAND=path.resolve(HERE,'..');const ROOT='/Users/shimizunaotomoo/Desktop/my-app';
const res=[];const ok=(c,m,d)=>res.push({check:m,ok:!!c,detail:d});
const unitPath=path.join(CAND,'原稿',`tokkun-math-1-${key}.json`);const unit=JSON.parse(fs.readFileSync(unitPath,'utf8'));
const reg=JSON.parse(fs.readFileSync(path.join(CAND,`図の対応表_${key}.json`),'utf8'));
const figQ=unit.questions.filter(q=>q.image);ok(figQ.length===reg.length&&figQ.length>0,`図つきの問題 ${figQ.length} 問と対応表 ${reg.length} 件が一致`);
// 1) バンク作成（写し）
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'figunit-'));
for(const d of ['教材整理/確認済み','教材整理/実装','教材整理/scripts','site-assets','cf-worker/src'])fs.mkdirSync(path.join(tmp,d),{recursive:true});
fs.copyFileSync(path.join(ROOT,'教材整理/教材照合台帳.json'),path.join(tmp,'教材整理/教材照合台帳.json'));
for(const f of fs.readdirSync(path.join(ROOT,'教材整理/確認済み')).filter(f=>f.endsWith('.json')))fs.copyFileSync(path.join(ROOT,'教材整理/確認済み',f),path.join(tmp,'教材整理/確認済み',f));
for(const f of ['material-engine.js','material-ui.js','material-ui.css'])fs.copyFileSync(path.join(ROOT,'教材整理/実装',f),path.join(tmp,'教材整理/実装',f));
fs.copyFileSync(path.join(ROOT,'教材整理/scripts/build-material-assets.py'),path.join(tmp,'教材整理/scripts/build-material-assets.py'));
const ledger=JSON.parse(fs.readFileSync(path.join(ROOT,'教材整理/教材照合台帳.json'),'utf8'));
// 統合のまね（一時フォルダの中だけ）：出典の写真を台帳の id に結び、status を ready にする
const u2=JSON.parse(JSON.stringify(unit));u2.status='ready';const tmpAdd=[];const crypto0=require('node:crypto');
for(const q of u2.questions){let s=ledger.find(s=>s.sha256===q.source.sha256&&s.file===q.source.file)||tmpAdd.find(s=>s.sha256===q.source.sha256);
 if(!s){const real=path.join(ROOT,q.source.file);const sha=fs.existsSync(real)?crypto0.createHash('sha256').update(fs.readFileSync(real)).digest('hex'):'';
  ok(sha===q.source.sha256,`出典の写真 ${q.source.file} が実物と SHA 一致`);s={id:'source-99'+String(tmpAdd.length+1).padStart(2,'0'),file:q.source.file,sha256:sha,mode:'textbook',subject:'数学',grade:1,pages:[],verified:true};tmpAdd.push(s);}
 if(tmpAdd.includes(s)&&!s.pages.includes(q.source.page))s.pages.push(q.source.page);q.source.id=s.id;q.reviewed=true;}
res.push({check:'一時フォルダだけのまね：reviewed を true にし、台帳に未登録の出典写真を仮登録（本体の点検・台帳登録は Codex）：'+tmpAdd.map(s=>s.file+' p'+s.pages.join(',')).join(' / '),ok:true,info:true});
fs.writeFileSync(path.join(tmp,'教材整理/教材照合台帳.json'),JSON.stringify(ledger.concat(tmpAdd)));
fs.writeFileSync(path.join(tmp,'教材整理/確認済み',`tokkun-math-1-${key}.json`),JSON.stringify(u2));
let built=null;try{cp.execFileSync('python3',['-I',path.join(tmp,'教材整理/scripts/build-material-assets.py')],{cwd:tmp,stdio:'pipe'});built=JSON.parse(fs.readFileSync(path.join(tmp,'site-assets/material-bank.json'),'utf8'));}catch(e){ok(false,'バンク作成の写しが動く',String(e.stderr||e).slice(0,300));}
if(!built){console.log(res.filter(r=>!r.ok));process.exit(1);}
let bu=null;
if(built){bu=built.units.find(u=>u.id===unit.id);ok(!!bu,'画面用バンクに単元がある');
 const lost=figQ.filter(q=>{const b=bu.questions.find(x=>x.id===q.id);return !b||b.image!==q.image||b.imageAlt!==q.imageAlt;});ok(lost.length===0,'画面用バンクで image と imageAlt がすべて残る',lost.map(q=>q.id).join(','));
 const srv=fs.readFileSync(path.join(tmp,'cf-worker/src/material-bank.mjs'),'utf8');ok(figQ.every(q=>srv.includes(JSON.stringify(q.image))&&srv.includes(JSON.stringify(q.imageAlt))),'サーバー用バンクにも残る');}
// 2) 採点エンジン（写し）の単元検査
if(bu){const e=require(path.join(tmp,'site-assets/material-engine.js'));const errs=e.validateUnit(bu,{sources:built.sources});ok(Array.isArray(errs)&&errs.length===0,'validateUnit がエラー 0',(errs||[]).slice(0,5).join(' / '));
 let g=0;for(const q of bu.questions){const r=e.grade(q,'わからない');if(r.correct)g++;}ok(g===0,'「わからない」はすべて不正解');}
// 図ファイル（静的）
const crypto=require('node:crypto');
for(const r of reg){const p=path.join(CAND,'図',r.file);const s=fs.existsSync(p)?fs.readFileSync(p,'utf8'):'';
 ok(/^tokkun-fig-[a-z0-9]+-\d+\.svg$/.test(r.file),`${r.file}：直下に置ける英数字の名前`);
 ok(s&&crypto.createHash('sha256').update(s).digest('hex')===r.sha256,`${r.file}：ファイルが対応表の SHA と一致`);
 ok(!/<script|href=|xlink|on\w+=|<image|<foreignObject/i.test(s),`${r.file}：スクリプト・外部参照・埋めこみ画像なし`);
 const q=unit.questions.find(q=>q.image==='/'+r.file);const a=q.answer;const vals=a.kind==='number'?[a.value]:a.kind==='numbers'?a.values:[];
 const texts=[...s.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map(m=>m[1]);
 const leak=vals.filter(v=>texts.some(t=>new RegExp('(^|[^0-9.])'+v.replace(/[.*+?^${}()|[\]\\-]/g,'\\$&')+'($|[^0-9.])').test(t)));
 ok(leak.length===0,`${r.file}：答え（${vals.join('、')}）が図の文字にない`,leak.join(','));}
// 3)・4) ブラウザ
const assets=Object.fromEntries(['material-ui.css','material-ui.js','material-engine.js'].map(n=>[n,fs.readFileSync(path.join(tmp,'site-assets',n),'utf8')]));assets['material-outline.js']=fs.readFileSync(path.join(ROOT,'site-assets/material-outline.js'),'utf8');
const one={units:[bu].filter(Boolean),sources:built?built.sources:[]};
const html=`<meta charset="utf-8"><meta name="viewport" content="width=device-width"><link rel="stylesheet" href="/material-ui.css"><style>body{margin:12px;font:16px sans-serif}*{box-sizing:border-box}</style><main id="study-materials"></main><script src="/material-engine.js"></script><script src="/material-outline.js"></script><script src="/material-ui.js"></script><script>
const bank=${JSON.stringify(one).replace(/</g,'\\u003c')};let progress=JSON.parse(sessionStorage.getItem('fx-progress')||'{}');const bridge={identity:()=>'fixture',load:async()=>progress,save:async p=>{progress=p;},record:async a=>({result:{correct:false}}),review:async()=>({items:[],next:null})};NobiMaterialUI.mount(document.querySelector('main'),bank.units,bridge,bank.sources);</script>`;
const server=createServer((req,res)=>{const name=decodeURIComponent(req.url.slice(1).split('?')[0]);
 if(Object.hasOwn(assets,name)){res.writeHead(200,{'Content-Type':name.endsWith('.css')?'text/css':'text/javascript'});return res.end(assets[name]);}
 if(/^tokkun-fig-[a-z0-9]+-\d+\.svg$/.test(name)&&fs.existsSync(path.join(CAND,'図',name))){res.writeHead(200,{'Content-Type':'image/svg+xml'});return res.end(fs.readFileSync(path.join(CAND,'図',name)));}
 if(name.startsWith('svg/')){res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'});return res.end(`<!doctype html><meta charset="utf-8"><body style="margin:0">${fs.readFileSync(path.join(CAND,'図',name.slice(4)),'utf8')}</body>`);}
 res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'});res.end(html);});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;let browser;const shots=path.join(HERE,'画面',key);fs.mkdirSync(shots,{recursive:true});
try{browser=await chromium.launch({headless:true});
 // 4) SVG の実表示
 const pg=await browser.newPage({viewport:{width:900,height:900}});await pg.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 for(const r of reg){await pg.goto(base+'/svg/'+r.file);
  const m=await pg.evaluate(()=>{const svg=document.querySelector('svg');const vb=svg.viewBox.baseVal;const T=[...svg.querySelectorAll('text')].map(t=>{const b=t.getBBox();return {s:t.textContent,x:b.x,y:b.y,w:b.width,h:b.height};});
   const out=T.filter(b=>b.x<0||b.y<0||b.x+b.w>vb.width||b.y+b.h>vb.height).map(b=>b.s);const over=[];
   for(let i=0;i<T.length;i++)for(let j=i+1;j<T.length;j++){const a=T[i],b=T[j];const ix=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x),iy=Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y);if(ix>1&&iy>1)over.push(a.s+'/'+b.s);}
   return {n:T.length,out,over};});
  ok(m.out.length===0,`${r.file}：文字 ${m.n} 個がすべて図の中（文字のない見取図は 0 個）`,m.out.join(','));ok(m.over.length===0,`${r.file}：文字どうしが重ならない`,m.over.join(','));
  await pg.locator('svg').screenshot({path:path.join(shots,r.file.replace('.svg','.png'))});}
 await pg.close();
 // 3) 画面（本物の material-ui.js の写し）
 for(const [w,h] of [[390,844],[820,1180],[1280,900]]){const page=await browser.newPage({viewport:{width:w,height:h}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());await page.goto(base+'/');
  const click=async name=>{const b=page.getByRole('button',{name,exact:true});if(!(await b.isVisible())&&await page.locator('details.material-conditions:not([open])').count())await page.locator('details.material-conditions summary').click();await b.click();};
  await page.waitForTimeout(800);await page.screenshot({path:path.join(shots,`start-${w}.png`)});
  const esc=t=>t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  for(const name of ['特訓','1年','数学',bu.majorTitle,bu.title]){const b=page.getByRole('button',{name:new RegExp('^'+esc(name)+'(\\s*○\\d+/\\d+)?$')});await b.first().waitFor({timeout:5000}).catch(()=>{});if(await b.count()&&!(await b.first().isDisabled()))await b.first().click();await page.waitForTimeout(150);}
  await page.screenshot({path:path.join(shots,`picked-${w}.png`)});
  await page.getByRole('button',{name:'作成する',exact:true}).waitFor({timeout:8000});
  const seen=new Map();const doneIds=[];
  for(let round=0;round<12&&seen.size<figQ.length;round++){await click('60問');await click('作成する');await page.locator('.material-batch-question').first().waitFor();
   await page.waitForFunction(()=>[...document.querySelectorAll('img.material-question-image')].every(i=>i.complete));
   const imgs=await page.evaluate(()=>[...document.querySelectorAll('img.material-question-image')].map(i=>({src:new URL(i.src).pathname,alt:i.alt,nw:i.naturalWidth,w:i.getBoundingClientRect().width,prompt:i.closest('article,.material-batch-question')?.querySelector('.material-question-prompt')?.textContent||''})));
   for(const i of imgs)seen.set(i.src,i);
   ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${w}px：横にはみ出さない（${round+1}回目）`);
   await page.screenshot({path:path.join(shots,`ui-${w}-${round+1}.png`),fullPage:false});
   // 出た問題を「解いた」ことにして（このページの中だけ）、次の回にはまだ出ていない問題が出るようにする
   const shown=await page.evaluate(()=>[...document.querySelectorAll('.material-question-prompt')].map(p=>p.textContent));
   for(const t of shown){const qq=bu.questions.find(x=>x.prompt===t);if(qq&&!doneIds.includes(qq.id))doneIds.push(qq.id);}
   if(seen.size<figQ.length){await page.evaluate(([id,d])=>sessionStorage.setItem('fx-progress',JSON.stringify({[id]:{done:d,testDone:[]}})),[bu.id,doneIds]);await page.reload();await page.waitForTimeout(500);
    for(const name of ['特訓','1年','数学',bu.majorTitle,bu.title]){const b=page.getByRole('button',{name:new RegExp('^'+esc(name)+'(\\s*○\\d+/\\d+)?$')});await b.first().waitFor({timeout:5000}).catch(()=>{});if(await b.count()&&!(await b.first().isDisabled()))await b.first().click();await page.waitForTimeout(150);}
   }else await click('出題条件へ戻る');}
  const miss=figQ.filter(q=>!seen.has(q.image));ok(miss.length===0,`${w}px：図つきの問題 ${figQ.length} 問の図がすべて画面に出た`,miss.map(q=>q.id).join(','));
  const bad=figQ.filter(q=>{const i=seen.get(q.image);return i&&(i.nw===0||i.alt!==q.imageAlt||i.prompt!==q.prompt||i.w>w);});ok(bad.length===0,`${w}px：図が読みこまれ、alt と問題文が合い、幅に収まる`,bad.map(q=>q.id).join(','));
  ok(errors.length===0,`${w}px：ページのエラーなし`,errors.join(' / '));await page.close();}
}catch(e){ok(false,'ブラウザの検査が最後まで動く',String(e.message||e).split('\n')[0]);}finally{await browser?.close();server.close();}
const bad=res.filter(r=>!r.ok);fs.writeFileSync(path.join(HERE,`結果_${key}.json`),JSON.stringify({unit:key,checks:res.length,failed:bad.length,results:res},null,1)+'\n');
for(const r of res)if(!r.ok||process.env.V)console.log(r.ok?'✓':'✗',r.check,r.detail||'');console.log(`${key}：検査 ${res.length} / ✗ ${bad.length}`);process.exit(bad.length?1:0);
