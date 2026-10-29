// The local manuscript preview must also honor the exact authored closed answers.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=new URL('../../../',import.meta.url),here=new URL('answer-rows-20261019/',import.meta.url);
const text=await readFile(new URL('教材整理/Claude_Codex共有/数学全体制作/原稿を読む.html',root),'utf8');
assert(!text.includes('&lt;details&gt;')&&!text.includes('&lt;/details&gt;')&&!text.includes('NOBILOG_CLOSED_DETAILS_'),'no escaped multiline answer markup or internal placeholders');
const rows=['(−4.8)÷0.6＝8','0÷(−5)＝−5','−9/2 の逆数を 2/9 とする','20/x で x＝−4 を 20−4 とする','7y−y を 7 とする'];
let checks=1;const browser=await chromium.launch({headless:true});
try{
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:900},serviceWorkers:'block'});await page.route('**/*',r=>r.abort());await page.setContent(text);
  for(const row of rows){
   const cell=page.locator('td').filter({hasText:row});assert.equal(await cell.count(),1,'original row exactly once '+row);checks++;
   assert.equal(await cell.isVisible(),false,'hidden before opening '+row);checks++;
   const details=cell.locator('xpath=ancestor::details[1]');assert.equal(await details.locator('summary').first().innerText(),'答えと解説');checks++;
   await details.locator('summary').first().click();assert(await cell.isVisible(),'visible only after own answer opens');checks++;
   await details.locator('summary').first().click();assert.equal(await cell.isVisible(),false,'hidden again after close');checks++;
  }
  for(const id of ['M1-C1-S2-M05','M1-C1-S2-M06']){
   const image=page.locator('img[src="メディア/'+id+'.svg"]');assert.equal(await image.count(),1,'same source SVG used '+id);checks++;
   assert.equal(await image.isVisible(),false,'answer figure remains hidden '+id);checks++;
   assert.equal(await image.locator('xpath=ancestor::details[1]').count(),1,'figure is inside own details '+id);checks++;
  }
  console.log('Manuscript preview '+width+'px: five exact answer rows and two source figures stay closed');await page.close();
 }
 await writeFile(new URL('review-render-result.json',here),JSON.stringify({passed:true,checks,widths:[390,1440],noExternalNetwork:true,noRealUserData:true},null,2)+'\n');
 console.log('Manuscript answer rendering:',checks,'checks passed');
}finally{await browser.close();}
