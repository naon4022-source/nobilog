// Reuse the received isolated harness, with real assertions, four widths, large text and zoom checks.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const here=new URL('./',import.meta.url),root=new URL('../../../',here);
const candidateDirectory=process.argv.includes('--final')?'out-final/':'out/';
const viewports=process.argv.includes('--large-only')?[[390,844,'390-large',true],[1440,900,'1440-large',true]]:process.argv.includes('--normal-only')?[[390,844,'390',false],[820,1180,'820',false],[1180,820,'1180',false],[1440,900,'1440',false]]:[[390,844,'390',false],[820,1180,'820',false],[1180,820,'1180',false],[1440,900,'1440',false],[390,844,'390-large',true],[1440,900,'1440-large',true]];
const original=new URL('Claude作業/20261018_短時間/答え先出し修正候補/隔離確認.mjs',root);
const placementSource=await readFile(process.argv.includes('--main')?new URL('教材整理/実装/media-pages.mjs',root):new URL('media-pages.mjs',here),'utf8');
const placementCollector=/const map=await p\.evaluate\(([\s\S]+?)\);\n map\.generatedAt=/.exec(placementSource)?.[1];
assert(placementCollector,'actual nested-media collector found');
let source=await readFile(original,'utf8');
const replace=(a,b)=>{assert.equal(source.split(a).length-1,1,'unique wrapper anchor');source=source.replace(a,b);};
replace('createRequire(import.meta.url)','createRequire('+JSON.stringify(original.href)+')');
replace("const ORIGINAL=process.argv.includes('--original');const here=new URL('./',import.meta.url),assets=new URL('../../../site-assets/',import.meta.url);",'const ORIGINAL=process.argv.includes("--main");const here=new URL('+JSON.stringify(new URL(candidateDirectory,here).href)+'),assets=new URL('+JSON.stringify(new URL('site-assets/',root).href)+');');
replace("for(const [width,height,label] of [[390,844,'390'],[1440,900,'1440']])", 'for(const [width,height,label,large] of '+JSON.stringify(viewports)+')');
replace('  await page.goto(url);','  await page.goto(url);if(large)await page.evaluate(()=>document.body.classList.add("large-text"));');
replace("const results=[];let checks=0;const ok=(v,m)=>{results.push((v?'OK ':'NG ')+m);if(v)checks++;};", "const results=[],layoutReports=[];let checks=0;const ok=(v,m)=>{assert(v,m);results.push('OK '+m);checks++;};");
replace('const cases=[', `async function navigate(page,target){
 const input=page.getByLabel('コードでページへ移動');
 if(await input.isVisible()){await input.fill(target.code||String(target.page));await page.getByRole('button',{name:'コードで移動',exact:true}).click();return true;}
 // On widths <=900 the product deliberately hides code input. Use its visible page controls.
 for(let k=0;k<1600;k++){
  const shown=await page.locator('.tb-page[data-page]').evaluateAll(nodes=>nodes.map(n=>Number(n.dataset.page)));
  if(shown.includes(target.page))return false;
  await page.locator(target.page<Math.min(...shown)?'.tb-prev':'.tb-next').click();
  await page.locator('.tb-spread').evaluate(el=>Promise.all(el.getAnimations({subtree:true}).filter(a=>Number.isFinite(a.effect.getTiming().iterations)).map(a=>a.finished)));
 }
 throw Error('Visible page navigation did not reach '+target.code);
}
const cases=[`);
if(process.argv.includes('--final'))replace("['5÷0＝0','(−4.8)÷0.6＝8']", "['5÷0＝0']");
replace("   for(const k of keep)ok(await spread.locator('td',{hasText:k}).count()>=1,`${label} ${id}: 関係ない行「${k.slice(0,12)}…」は表に残る`);", `   for(const k of keep){
    const rows=await page.evaluate(text=>NobiTextbook._state.book.phys.filter(p=>(p.blocks||[]).some(b=>b.t==='table'&&(b.rows||[]).some(row=>row.some(cell=>String(cell).includes(text))))).map(p=>p.n),k);
    ok(rows.length===1,label+' '+id+': unrelated row retained once in the public table');
    if(await spread.locator('td',{hasText:k}).count()===0){await navigate(page,{page:rows[0]});console.log('Retained row on '+rows[0]+'; question on '+target[0].page);}
    ok(await spread.locator('td',{hasText:k}).count()>=1,label+' '+id+': unrelated row remains visible on its actual physical page');
    await navigate(page,target[0]);
   }`);
replace("   for(let i=0;i<400;i++){if(await page.locator('.tb-spread .tb-p',{hasText:q}).count()){found=true;break;}const nx=page.locator('.tb-next');if(await nx.isDisabled())break;await nx.click();await page.waitForTimeout(30);}", `   const target=await page.evaluate(pattern=>{const re=new RegExp(pattern);return NobiTextbook._state.book.phys.flatMap(p=>(p.blocks||[]).filter(b=>b.t==='p'&&re.test(String(b.x||'').replace(/\\*\\*/g,''))).map(b=>({page:p.n,code:b.code})));},q.source);
   ok(target.length===1&&!!target[0].code,label+' '+id+': unique recalculated question code');
   const usedJump=await navigate(page,target[0]);
   found=await page.locator('.tb-spread .tb-p',{hasText:q}).count()===1;
   ok(await page.locator('.tb-spread [data-code="'+target[0].code+'"]'+(usedJump?'.tb-highlight':'')).count()===1,label+' '+id+': visible navigation reaches the intended current question code after reflow');
   console.log('Opened '+label+' '+id+' '+target[0].code);`);
replace("   await page.getByRole('button',{name:'閉じる'}).click();await sheet.waitFor({state:'detached'});", `   await im.scrollIntoViewIfNeeded();await im.click();
   const zoom=page.locator('.tb-zoom-img');await zoom.waitFor();
   await page.waitForFunction(el=>el.complete&&el.naturalWidth>0,await zoom.elementHandle());
   const initialWidth=(await zoom.boundingBox()).width;
   await page.locator('.tb-sheet-wide').evaluate(el=>Promise.all(el.getAnimations({subtree:true}).map(a=>a.finished)));
   const zb=await zoom.boundingBox();ok(zb&&zb.width>=640&&zb.width>box.width,label+' '+id+': answer image is enlarged to readable width');
   console.log('Zoom settled: '+label+' '+id+' '+initialWidth.toFixed(1)+' -> '+zb.width.toFixed(1));
   const pan=await page.locator('.tb-sheet-body').evaluate(body=>{const image=body.querySelector('.tb-zoom-img'),r=body.getBoundingClientRect(),max=body.scrollWidth-body.clientWidth;body.scrollLeft=max;const end=image.getBoundingClientRect().right;const reached=body.scrollLeft;body.scrollLeft=0;return {left:r.left,right:r.right,max,reached,end,root:document.documentElement.scrollWidth<=innerWidth};});
   ok(pan.left>=0&&pan.right<=width+1&&pan.root,label+' '+id+': zoom container stays inside viewport');
   ok(pan.max<=0||(pan.reached>=pan.max-1&&pan.end<=pan.right+1),label+' '+id+': entire enlarged image is reachable by inner horizontal pan');
   await page.getByRole('button',{name:'閉じる',exact:true}).click();await zoom.waitFor({state:'detached'});
   ok(await spread.locator('img[src*="'+img+'"]').count()===0,label+' '+id+': zoom close never exposes answer on page');
   await btn.click();await sheet.waitFor();ok(await sheet.locator('img[src*="'+img+'"]').count()===1,label+' '+id+': answer can be reopened after zoom');
   await page.getByRole('button',{name:'閉じる'}).click();await sheet.waitFor({state:'detached'});`);
replace("  ok(errors.length===0,`${label}: ページのエラーなし ${errors.join('|').slice(0,120)}`);", `  const mapping=await page.evaluate(()=>{const b=NobiTextbook._state.book,targets=b.toc.flatMap(c=>[c.page,...(c.sections||[]).map(s=>s.page)]).filter(Boolean),codes=b.phys.flatMap(p=>(p.blocks||[]).filter(q=>q.code).map(q=>q.code));return {physicalPages:b.phys.length,tocTargets:targets.length,allTocMapped:targets.every(n=>Number.isInteger(b.map[n])&&b.map[n]>=1&&b.map[n]<=b.phys.length),codes:codes.length,uniqueCodes:new Set(codes).size};});
  ok(mapping.allTocMapped&&mapping.codes===mapping.uniqueCodes,label+': all TOC destinations resolve and all regenerated question codes are unique');
  layoutReports.push({label,...mapping});
  if(width===1440&&!large){
   const placed=await page.evaluate(()=>{const b=NobiTextbook._state.book,out={};function walk(blocks,p,inAnswer=false){for(const item of blocks||[]){if(item.t==='media'&&item.id){const a=p.n%2===0?p.n:p.n-1;out[item.id]={page:p.n,spread:p.n===1?'数1':'数'+a+'-'+Math.min(a+1,b.phys.length),...(inAnswer?{inAnswer:true}:{})};}if(Array.isArray(item.body))walk(item.body,p,inAnswer||item.t==='details');}}for(const p of b.phys)walk(p.blocks,p);return {pages:b.phys.length,media:out,generatedAt:new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Tokyo'})};});
   ok(placed.media['M1-C1-S2-M05']?.inAnswer&&placed.media['M1-C1-S2-M06']?.inAnswer,'both moved image IDs retain an answer-bound page reference');
   await (await import('node:fs/promises')).writeFile(new URL('media-placements.json',here),JSON.stringify(placed,null,1)+'\\n');
  }
  ok(errors.length===0,label+': no page errors '+errors.join('|').slice(0,120));`);
const placementLine=source.split('\n').find(line=>line.startsWith('   const placed=await page.evaluate('));
assert(placementLine,'placement hook present');
replace(placementLine,'   const placed=await page.evaluate('+placementCollector+');placed.generatedAt=new Date().toLocaleDateString("sv-SE",{timeZone:"Asia/Tokyo"});');
if(process.argv.includes('--final'))replace('  const mapping=await page.evaluate', `  const related=await page.evaluate(()=>NobiTextbook._state.book.phys.flatMap(p=>(p.blocks||[]).filter(b=>b.t==='p'&&String(b.x||'').startsWith('**確認5-1**')&&b.x.includes('(−4.8)÷0.6')).map(b=>({code:b.code,page:p.n}))));
  ok(related.length===1,label+': related confirmation 5-1 has one current code');
  await navigate(page,related[0]);
  await page.evaluate(()=>Promise.all(document.getAnimations().filter(a=>Number.isFinite(a.effect.getTiming().iterations)).map(a=>a.finished)));
  const relatedRow='(−4.8)÷0.6＝8',relatedSpread=page.locator('.tb-spread');
  ok(await relatedSpread.locator('td',{hasText:relatedRow}).count()===0,label+': related answer row hidden before opening');
  const relatedQuestion=relatedSpread.locator('[data-code="'+related[0].code+'"]');
  await relatedQuestion.locator('xpath=following-sibling::*[1]').click();
  ok(await page.locator('.tb-sheet td',{hasText:relatedRow}).count()===1,label+': original related row appears only in its answer');
  await page.getByRole('button',{name:'閉じる',exact:true}).click();
  ok(await relatedSpread.locator('td',{hasText:relatedRow}).count()===0,label+': related row hidden again after close');
  const mapping=await page.evaluate`);
await mkdir(new URL(candidateDirectory+'確認画面/',here),{recursive:true});
source+='\nassert.equal(checks,results.length);\n';
source+='await (await import("node:fs/promises")).writeFile(new URL("layout-reports.json",here),JSON.stringify({checks,results:layoutReports},null,2)+"\\n");\n';
replace('  await page.close();',`  await (await import('node:fs/promises')).writeFile(new URL('case-'+(ORIGINAL?'main-':'candidate-')+label+'.json',here),JSON.stringify({status:'passed',label,large,checksSoFar:checks,layout:mapping},null,2)+'\\n');
  console.log('Passed viewport: '+label);await page.close();`);
source+='console.log("Codex: all assertions passed at "+layoutReports.map(r=>r.label).join(", ")+"; zoom and reopen checked; no user data or external network");\n';
await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64')).catch(error=>{console.error(error.name+': '+error.message);process.exitCode=1;});
