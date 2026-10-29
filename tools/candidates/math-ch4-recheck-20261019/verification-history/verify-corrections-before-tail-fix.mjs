// Real canvas before/after pixels and domain conditions; synthetic page only, no network.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
const {chromium}=createRequire(import.meta.url)('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const here=new URL('./',import.meta.url),source=new URL('../../../教材整理/Claude_Codex共有/数学全体制作/メディア/制作ソース/',import.meta.url),integrated=process.argv.includes('--integrated');
const patches={'M1-C4-S2-VP':'階段グラフ_整数条件補正.js','M1-C4-S1-VP':'駐車料金_境界補正.js','M1-C4-REVIEW-V01':'駐車料金_境界補正.js'},allowed={'M1-C4-S2-VP':[4,5],'M1-C4-S1-VP':[3,4],'M1-C4-REVIEW-V01':[0,1]};
const hash=x=>createHash('sha256').update(x).digest('hex');let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++;};const results=[];const browser=await chromium.launch({headless:true});
try{
 for(const [id,patch]of Object.entries(patches)){
  const old=JSON.parse(await readFile(new URL((integrated?'previous/':'../../../教材整理/Claude_Codex共有/数学全体制作/メディア/制作ソース/')+id+'.json',here),'utf8'));
  const candidate=JSON.parse(await readFile(new URL('candidate/'+id+'.json',here),'utf8')),tl=JSON.parse(await readFile(new URL(id+'.timeline.json',source),'utf8'));
  ok(JSON.stringify(old.steps)===JSON.stringify(candidate.steps),'narration/hold unchanged '+id);ok(old.settings===candidate.settings,'approved voice settings unchanged');
  const page=await browser.newPage();await page.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.abort());await page.addInitScript(t=>window.TL=t,tl);
  await page.goto(new URL(id+'.html',source).href);await page.evaluate(()=>document.fonts.ready);
  if(integrated){ok(await page.evaluate(()=>VIDEO.summary.join('|'))===candidate.summary.join('|'),'adopted HTML summary matches candidate');}
  const times=[...new Set([...Array.from({length:Math.ceil(tl.total/1.5)},(_,i)=>i*1.5),...tl.steps.flatMap(s=>[s.start+.01,(s.start+s.end)/2])])].filter(t=>t<tl.total).sort((a,b)=>a-b);
  const snapshot=async()=>{const arr=[];for(const t of times){arr.push(hash(await page.evaluate(t=>{renderAt(t);return document.querySelector('canvas').toDataURL('image/png');},t)));}return arr;};
  let before;
  if(!integrated)before=await snapshot();
  if(!integrated)await page.evaluate(({script,summary})=>{VIDEO.summary=summary;(0,eval)(script);},{script:await readFile(new URL('candidate/'+patch,here),'utf8'),summary:candidate.summary});
  const after=await snapshot();
  const changed=[];
  if(before)for(let n=0;n<times.length;n++)if(before[n]!==after[n]){const step=tl.steps.findIndex(s=>times[n]>=s.start&&times[n]<s.end);ok(allowed[id].includes(step),'only specified defective stage changes '+id+' @'+times[n]);changed.push({time:times[n],step});}
  if(!integrated)ok(changed.length>0,'defect demonstrably changes');
  const state=await page.evaluate(id=>{const savedLn=ln,lines=[],savedTx=tx,text=[];ln=(...a)=>{if(a[4]===C.blue)lines.push(a.slice(0,4));return savedLn(...a);};tx=(...a)=>{text.push(String(a[0]));return savedTx(...a);};try{const state=SCENE.draw({i:id==='M1-C4-REVIEW-V01'?1:4,p:1});return {state,lines,text};}finally{ln=savedLn;tx=savedTx;}},id);
  if(id==='M1-C4-S2-VP'){
   ok(state.lines.length===0,'no continuous blue graph in natural-number stair domain');
   ok(JSON.stringify(state.state.points)===JSON.stringify([[0,0],[1,16],[2,32],[3,48],[4,64],[5,80]]),'exact six allowed stair points including origin');
   ok(state.text.includes('点は飛び飛び'),'discrete-domain explanation drawn');
  }else if(id==='M1-C4-S1-VP'){
   ok(state.state.leftClosed===false&&state.state.rightClosed===true,'parking interval left open/right closed');ok(state.text.includes('例：0＜x≦60'),'drawn domain agrees with adopted source figure');
  }else ok(state.state.zeroExcluded===true,'review uses same open-zero convention');
  results.push({id,snapshots:times.length,changed,canvasSha256:after,summary:candidate.summary});await page.close();
 }
 await writeFile(new URL(integrated?'corrections-integrated-result.json':'corrections-candidate-result.json',here),JSON.stringify({passed:true,checks,integrated,results,realUserData:false,network:false},null,2)+'\n');
 console.log('Chapter4 correction canvas:',checks,'checks passed; discrete stair graph, parking open zero, unchanged narration and other scenes');
}finally{await browser.close();}
