// Rebase the existing real answer/zoom harness; no original proof is overwritten.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../../../',import.meta.url),here=new URL('./',import.meta.url);
let source=await readFile(new URL('tools/candidates/math-answer-hide-20261018/verify-browser.mjs',root),'utf8');
const from="const here=new URL('./',import.meta.url),root=new URL('../../../',here);";
assert.equal(source.split(from).length-1,1);
source=source.replace(from,'const here=new URL('+JSON.stringify(here.href)+'),root=new URL('+JSON.stringify(root.href)+');');
const zoomAnchor='   const initialWidth=(await zoom.boundingBox()).width;';
assert.equal(source.split(zoomAnchor).length-1,1);
source=source.replace(zoomAnchor,`   await page.locator('.tb-sheet-wide').evaluate(el=>Promise.all(el.getAnimations({subtree:true}).filter(a=>Number.isFinite(a.effect.getTiming().iterations)).map(a=>a.finished)));
   const baseWidth=(await zoom.boundingBox()).width;
   const zoomPlus=page.getByRole('button',{name:'図を大きくする',exact:true});
   const zoomMinus=page.getByRole('button',{name:'図を小さくする',exact:true});
   ok(await zoomMinus.isDisabled(),label+' '+id+': initial minimum scale');
   for(let count=0;count<4;count++)await zoomPlus.click();
   ok(await zoomPlus.isDisabled()&&(await zoom.boundingBox()).width>=baseWidth*2.99,label+' '+id+': bounded 300 percent zoom');
   ok((await page.getByLabel('拡大率',{exact:true}).textContent())==='300%',label+' '+id+': accessible current scale');
   const maxPan=await page.locator('.tb-sheet-body').evaluate(body=>{const max=body.scrollWidth-body.clientWidth;body.scrollLeft=max;const r=body.getBoundingClientRect(),image=body.querySelector('.tb-zoom-img').getBoundingClientRect();return {root:document.documentElement.scrollWidth<=innerWidth,reached:body.scrollLeft>=max-1,right:image.right<=r.right+1};});
   ok(maxPan.root&&maxPan.reached&&maxPan.right,label+' '+id+': full three-times image reachable without page overflow');
   const controls=await page.locator('.tb-zoom-controls').boundingBox();
   ok(controls.x>=0&&controls.x+controls.width<=width+1&&controls.y>=0&&controls.y+controls.height<=height+1,label+' '+id+': zoom controls remain inside viewport');
   const closeBox=await page.getByRole('button',{name:'閉じる',exact:true}).boundingBox();
   ok(closeBox.y>=0&&closeBox.y+closeBox.height<=height+1,label+' '+id+': close remains visible at maximum zoom');
   await page.screenshot({path:fileURLToPath(new URL('確認画面/zoom-'+label+'-'+id+'.png',here))});
   await zoomMinus.click();ok((await page.getByLabel('拡大率',{exact:true}).textContent())==='250%',label+' '+id+': decrease scale');
   await page.getByRole('button',{name:'図を元の大きさに戻す',exact:true}).click();
   ok(await zoomMinus.isDisabled()&&Math.abs((await zoom.boundingBox()).width-baseWidth)<2,label+' '+id+': reset original zoom size');
   const initialWidth=(await zoom.boundingBox()).width;`);
// Browser layout may cancel an in-flight entrance animation. Await that terminal
// state, then let the existing geometry/visibility assertions prove the result.
source=source.replaceAll('.map(a=>a.finished)',".map(a=>a.finished.catch(error=>{if(error.name!=='AbortError')throw error;}))");
process.argv.push('--main','--final','--normal-only');
await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
