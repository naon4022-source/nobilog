// 📚 英検の英単語カード：画面の検証（Claude・2026-10-07）。localhost の合成ページで本物の部品と本物の単語データを使う。外部通信なし・実データなし。
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=new URL('../../../site-assets/',import.meta.url);
const bank=JSON.parse(await readFile(new URL('eiken-vocab-bank.json',base),'utf8'));
const J=(y,m,d,h=0,mi=0)=>Date.UTC(y,m-1,d,h-9,mi);   // 日本時間 → ms
const T0=J(2026,10,6,20);
const html=`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/eiken-vocab.css"><style>body{margin:0;padding:16px;font:16px sans-serif}</style>
<section id="eiken-vocab"></section><script src="/sentence-shadowing.js"></script><script src="/eiken-vocab.js"></script>
<script>window.__store=null;window.__saves=0;window.__failSave=false;window.__uid='v_test';window.__now=${T0};window.__seed=7;
window.io={uid:()=>window.__uid,now:()=>window.__now,random:()=>{window.__seed=(window.__seed*1103515245+12345)>>>0;return window.__seed/4294967296;},
 load:()=>window.__store?JSON.parse(window.__store):null,save:v=>{if(window.__failSave)return false;window.__store=JSON.stringify(v);window.__saves++;return true;}};
window.remount=()=>NobiEikenVocab.mount(document.getElementById('eiken-vocab'),window.io);remount();</script>`;
const server=createServer(async(req,res)=>{const name=req.url.split('?')[0].slice(1);if(!name){res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'});res.end(html);return;}
 try{let body;try{if(process.argv.includes('--main'))throw Error('main');body=await readFile(new URL('integration-candidate/site-assets/'+name,import.meta.url));}catch{body=await readFile(new URL(name,base));}res.writeHead(200,{'Content-Type':name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'application/json'});res.end(body);}catch(_){res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port+'/';
let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++;};
const g5=bank.grades.find(g=>g.id==='5').words,W=s=>[].concat(...bank.grades.map(g=>g.words)).find(w=>w.w===s);
let browser;const shots=process.argv.includes('--shots')?'/tmp/nobi-eiken-vocab':null;if(shots)(await import('node:fs')).mkdirSync(shots,{recursive:true});
const shot=async(page,n)=>{if(shots)await page.screenshot({path:shots+'/'+n+'.png',fullPage:true});};
async function openPage(width,height){
 const page=await browser.newPage({viewport:{width,height}});page.__errors=[];page.on('pageerror',e=>page.__errors.push(e.message));
 page.__outside=[];await page.route('**/*',r=>{if(new URL(r.request().url()).hostname==='127.0.0.1')return r.continue();page.__outside.push(r.request().url());return r.abort();});
 await page.goto(url);await page.locator('.ev-tab').first().waitFor();return page;
}
const noOverflow=async(page,m)=>ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no sideways scroll: '+m);
const stat=async(page,cls)=>Number(await page.locator('.ev-'+cls+' .ev-num').textContent());
const store=async page=>JSON.parse(await page.evaluate(()=>window.__store)||'{"words":{}}');
const word=async page=>(await page.locator('.ev-word').count())?await page.locator('.ev-word').textContent():await page.locator('.ev-mean').textContent();
async function type(page,v){await page.getByRole('textbox',{name:'答え'}).fill(v);await page.getByRole('button',{name:'答え合わせ'}).click();}
const next=page=>page.getByRole('button',{name:/^(次の単語へ|結果を見る)$/}).click();
try{
 browser=await chromium.launch({headless:true});
 for(const [width,height] of [[390,844],[1280,800]]){
  const S='@'+width;let page=await openPage(width,height);
  ok(await page.locator('.ev-tab').count()===4,'4 tabs (5級・4級・3級・ランダム)'+S);
  ok(await stat(page,'new')===600&&await stat(page,'learned')===0,'5級: 600 new, 0 learned'+S);
  await page.getByRole('tab',{name:'4級'}).click();ok(await stat(page,'new')===250,'4級: 250 words'+S);
  await page.getByRole('tab',{name:'3級'}).click();ok(await stat(page,'new')===1150,'3級: 1150 words'+S);
  await page.getByRole('tab',{name:'5級'}).click();
  ok((await page.locator('.ev-small').textContent()).includes('のびログ独自の目安'),'note says the lists are のびログ独自'+S);
  await shot(page,'list'+width);await noOverflow(page,'list'+S);
  // 英語→日本語：読みでも正解、まちがい、わからない
  await page.getByRole('button',{name:'5級を10問はじめる'}).click();
  ok(await word(page)==='one'&&(await page.locator('.ev-where').textContent()).endsWith('1 / 10'),'first card is the first 5級 word'+S);
  await type(page,'いち');ok(await page.locator('.ev-fb.ok').count()===1,'reading accepted as correct'+S);
  ok((await page.locator('.ev-next').textContent()).includes('11月6日'),'correct → next time is 11/6 (one month, JST)'+S);
  ok((await page.locator('.ev-ex').textContent())===g5[0].ex&&(await page.locator('.ev-exja').textContent())===g5[0].exJa,'example and translation shown'+S);
  await shot(page,'ok'+width);await noOverflow(page,'feedback'+S);
  await next(page);ok(await word(page)==='two','card 2'+S);
  await type(page,'ねこ');ok(await page.locator('.ev-fb.ng').count()===1&&(await page.locator('.ev-model').textContent()).includes('2'),'wrong meaning → wrong, answer shown'+S);
  ok((await page.locator('.ev-next').textContent()).includes('苦手'),'wrong → goes to 苦手'+S);
  await next(page);ok(await word(page)==='three','card 3'+S);
  await page.getByRole('button',{name:'わからないので答えを見る'}).click();ok((await page.locator('.ev-mark').textContent()).includes('答えを見て'),'わからない shows the answer'+S);
  await next(page);await page.getByRole('textbox',{name:'答え'}).fill('4つ');await page.getByRole('textbox',{name:'答え'}).press('Enter');ok(await page.locator('.ev-fb.ok').count()===1,'Enter submits; another listed meaning is correct'+S);
  await page.getByRole('button',{name:'単語カードの一覧へもどる'}).click();
  ok(await stat(page,'learned')===2&&await stat(page,'weak')===2&&await stat(page,'new')===596,'counts after 4 answers'+S);
  let st=await store(page);
  ok(st.v===1&&st.words.one.c===1&&st.words.one.due===J(2026,11,6)&&st.words.two.w===1&&st.words.two.due===0&&st.words.three.w===1,'saved per user as {v:1,words:{id:{c,w,due,last}}}'+S);
  // 日本語→英語：苦手が先・1文字ちがいは「惜しい」で不正解
  await page.getByRole('button',{name:'日本語 → 英語'}).click();await page.getByRole('button',{name:'5級を10問はじめる'}).click();
  ok(await word(page)===W('two').ja.join('／'),'weak word comes first (Japanese shown)'+S);
  ok((await page.locator('.ev-ask').textContent()).includes('「t」で始まる 3文字'),'first-letter hint'+S);
  await type(page,'twoo');ok(await page.locator('.ev-fb.near').count()===1&&(await page.locator('.ev-mark').textContent()).includes('惜しい'),'one letter off → 惜しい'+S);
  await shot(page,'near'+width);
  st=await store(page);ok(st.words.two.w===2&&st.words.two.c===0,'惜しい counts as wrong'+S);
  await next(page);ok(await word(page)===W('three').ja.join('／'),'second weak word next'+S);
  await type(page,'Three ');ok(await page.locator('.ev-fb.ok').count()===1,'case and spaces ignored'+S);
  await next(page);ok(await word(page)===W('five').ja.join('／'),'then new words (learned ones skipped)'+S);
  await page.getByRole('button',{name:'単語カードの一覧へもどる'}).click();
  // 1か月ルール：11/5 23:59 まではお休み、11/6 0:00（日本時間）から出る
  await page.evaluate(t=>{window.__now=t;remount();},J(2026,11,5,23,59));
  ok(await stat(page,'learned')===3&&await stat(page,'review')===0,'still resting on 11/5 23:59 JST'+S);
  await page.evaluate(t=>{window.__now=t;remount();},J(2026,11,6));
  ok(await stat(page,'learned')===0&&await stat(page,'review')===3,'one, four and three (all answered 10/6) are back on 11/6 00:00 JST'+S);
  // 同じ意味の別の単語：まちがいにせず、もう一度
  await page.evaluate(t=>{window.__now=t;window.__store=JSON.stringify({v:1,words:{speak:{c:0,w:1,due:0,last:1}}});remount();},T0);
  await page.getByRole('button',{name:'5級を10問はじめる'}).click();
  ok(await word(page)==='話す','speak (weak) comes first'+S);
  await type(page,'talk');ok(await page.locator('.ev-other').count()===1&&await page.locator('.ev-fb').count()===0,'same-meaning word → asked again, not marked'+S);
  ok((await store(page)).words.speak.w===1,'… and not recorded'+S);
  await type(page,'speak');ok(await page.locator('.ev-fb.ok').count()===1,'then the right word is correct'+S);
  await page.getByRole('button',{name:'単語カードの一覧へもどる'}).click();
  // ランダム：級がまざる・10問・結果
  await page.getByRole('tab',{name:'🎲 ランダム'}).click();ok(await stat(page,'new')===1999,'random covers all 2000 words (1 learned)'+S);
  await page.getByRole('button',{name:'英語 → 日本語'}).click();
  await page.getByRole('button',{name:/^ランダムを10問はじめる$/}).click();
  const grades=new Set();
  for(let i=0;i<10;i++){grades.add((await page.locator('.ev-meta').textContent()).slice(0,2));await page.getByRole('button',{name:'わからないので答えを見る'}).click();await next(page);}
  ok(grades.size>=2,'random mode mixes grades: '+[...grades].join(',')+S);
  ok((await page.locator('.ev-score').textContent())==='0 / 10'&&await page.locator('.ev-list li').count()===10,'result: 0 / 10 with list'+S);
  await shot(page,'result'+width);await noOverflow(page,'result'+S);
  // 保存に失敗：知らせを出して、そのまま続けられる。次に保存できたとき、まとめて保存
  await page.getByRole('button',{name:'単語カードの一覧へ'}).click();await page.getByRole('tab',{name:'4級'}).click();
  const prev=(await store(page)).words,pw=id=>(prev[id]&&prev[id].w)||0;
  await page.evaluate(()=>{window.__failSave=true;});
  await page.getByRole('button',{name:'4級を10問はじめる'}).click();const w1=await word(page);
  await type(page,'x');ok((await page.locator('.ev-msg').textContent()).includes('保存できませんでした')&&await page.locator('.ev-fb').count()===1,'save failure is shown, answering still works'+S);
  await shot(page,'savefail'+width);await noOverflow(page,'save failure'+S);
  await next(page);const w2=await word(page);ok(w2!==w1,'next card works while saving fails'+S);
  await page.evaluate(()=>{window.__failSave=false;});await type(page,'y');
  ok(await page.locator('.ev-msg').count()===0,'message disappears when saving works again'+S);
  st=await store(page);const id1=bank.grades[1].words.find(w=>w.w===w1).id,id2=bank.grades[1].words.find(w=>w.w===w2).id;
  ok(st.words[id1]&&st.words[id1].w===pw(id1)+1&&st.words[id2]&&st.words[id2].w===pw(id2)+1,'the unsaved answer is saved together later'+S);
  // アカウント切替：解いている途中でも新しい人には残さない。前の人の記録に書きこまない
  await next(page);const savesBefore=await page.evaluate(()=>window.__saves);
  await page.evaluate(()=>{window.__uid='v_other';window.__store=null;});
  await type(page,'z');
  ok(await page.locator('.ev-card').count()===0&&await stat(page,'new')===250,'uid changed mid-round → back to list for the new person'+S);
  ok(await page.evaluate(()=>window.__saves)===savesBefore&&await page.evaluate(()=>window.__store)===null,'nothing written for the new person by the old round'+S);
  await page.evaluate(()=>{window.__uid='v_third';window.__store=null;remount();});
  ok(await page.locator('.ev-card').count()===0&&await stat(page,'learned')===0&&await stat(page,'weak')===0,'remount with another uid shows a fresh start'+S);
  // 全部覚えたら「次に出るのは」
  await page.evaluate(([words,t])=>{const s={v:1,words:{}};for(const id of words)s.words[id]={c:1,w:0,due:t,last:1};window.__store=JSON.stringify(s);remount();},[bank.grades[1].words.map(w=>w.id),J(2026,11,6)]);
  // 🎧 聞いて書く（台帳35・2026-10-09）：端末の声（ここでは にせの声）で読み、つづりで判定
  await page.evaluate(()=>{window.__spoken=[];Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{cancel(){},getVoices(){return [];},speak(u){__spoken.push(u.text);}}});window.SpeechSynthesisUtterance=function(t){this.text=t;};});
  await page.getByRole('tab',{name:'5級'}).click();await page.getByRole('button',{name:'🎧 聞いて書く'}).click();await page.getByRole('button',{name:'5級を10問はじめる'}).click();
  await page.waitForFunction(()=>__spoken.length>0);const spoken=await page.evaluate(()=>__spoken.at(-1));
  ok(await page.locator('.ev-card .ev-word').count()===0&&/聞こえた英単語を書こう/.test(await page.locator('.ev-card').textContent()),'listening: the word is hidden until answered'+S);
  await page.getByLabel('聞こえた英単語').fill(spoken);await page.getByRole('button',{name:'答え合わせ'}).click();
  ok(/⭕ 正解/.test(await page.locator('.ev-fb').textContent())&&(await page.locator('.ev-card .ev-word').first().textContent())===spoken,'listening: correct spelling is ⭕ and the word is shown'+S);
  // 🎙 まねして言う：にせのマイクで3秒録音→聞き返す音声が出る（保存も送信もしない）
  await page.evaluate(()=>{window.__mic=0;Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async()=>{__mic++;return {getTracks:()=>[{stop(){window.__stopped=true;}}]};}}});window.MediaRecorder=class{constructor(){this.mimeType='audio/webm';}start(){}stop(){this.ondataavailable&&this.ondataavailable({data:new Blob(['x'])});this.onstop&&this.onstop();}};});
  await page.getByRole('button',{name:'次の単語へ'}).click();await page.getByRole('button',{name:'わからないので答えを見る'}).click();
  await page.getByRole('button',{name:'お手本を聞いたあと、自分の声を3秒録音して聞き返す'}).click();
  await page.locator('.ev-shadow audio').waitFor({timeout:8000});ok(await page.evaluate(()=>__mic===1&&window.__stopped===true),'shadowing: records once and releases the mic'+S);
  await page.getByRole('button',{name:'単語カードの一覧へもどる'}).click();
  await page.getByRole('tab',{name:'4級'}).click();
  ok(await page.locator('.ev-panel .ev-main').count()===0&&(await page.locator('.ev-panel .ev-note').textContent()).includes('11月6日'),'all learned → no start button, shows next date'+S);
  await noOverflow(page,'all learned'+S);
  ok(page.__errors.length===0,'no page errors: '+page.__errors.join(' / '));
  ok(page.__outside.length===0,'no outside requests: '+page.__outside.join(' '));
  await page.close();
 }
 console.log('verify-eiken-vocab-browser: '+checks+' checks — 390/1280px、級ごとの語数、英→日（読み・別の意味・わからない・Enter）、日→英（苦手が先・ヒント・惜しい＝不正解・大文字/空白）、1か月ルール（日本時間）、同じ意味の別の単語、ランダムで級がまざる、結果、保存失敗の知らせとあとでまとめて保存、アカウント切替、横はみ出しなし、ページエラーなし');
}finally{await browser?.close();server.close();}
