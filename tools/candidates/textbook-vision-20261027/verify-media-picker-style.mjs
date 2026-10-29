import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'),here=new URL('./',import.meta.url),root=new URL('../../../',import.meta.url),sha=x=>createHash('sha256').update(x).digest('hex');
const original=await readFile(new URL('site-assets/textbook-ai.css',root)),css=await readFile(new URL('ui-candidate/textbook-vision.css',here),'utf8'),browser=await chromium.launch({headless:true});let checks=0;
try{for(const width of [390,820,1440]){
 const page=await browser.newPage({viewport:{width,height:900}});await page.setContent('<!doctype html><style>'+original+'\n'+css+'</style><main class="tb-ai-picking"><figure tabindex="0" data-vision-anchor="a">公開図</figure><p tabindex="0" data-annotation-anchor="b">元の本文</p></main>');
 assert.equal(await page.locator('figure').evaluate(n=>getComputedStyle(n).outlineStyle),'dashed');checks++;
 await page.locator('figure').focus();assert.equal(await page.locator('figure').evaluate(n=>getComputedStyle(n).outlineWidth),'3px');checks++;
 assert.equal(await page.locator('figure').evaluate(n=>getComputedStyle(n).outlineStyle),'solid');checks++;
 assert.equal(await page.locator('p').evaluate(n=>getComputedStyle(n).outlineStyle),'dashed');checks++;
 await page.locator('p').focus();assert.equal(await page.locator('p').evaluate(n=>getComputedStyle(n).outlineWidth),'3px');checks++;
 await page.locator('figure').evaluate(n=>{n.blur();n.parentElement.classList.remove('tb-ai-picking');});assert.equal(await page.locator('figure').evaluate(n=>getComputedStyle(n).outlineStyle),'none');checks++;
 await page.close();
}assert.equal(sha(await readFile(new URL('site-assets/textbook-ai.css',root))),sha(original));checks++;
const files=['tools/candidates/textbook-vision-20261027/ui-candidate/textbook-vision.css','tools/candidates/textbook-vision-20261027/verify-media-picker-style.mjs','site-assets/textbook-ai.css'],inputs=[];for(const file of files)inputs.push({file,sha256:sha(await readFile(new URL(file,root)))});
await writeFile(new URL('media-picker-style-result.json',here),JSON.stringify({status:'passed',checks,inputs,scope:'Supplement picker outlines in real browser at390/820/1440. New and old focus remain distinguishable. Original CSS unchanged; separate candidate stylesheet, main not integrated.'},null,2)+'\n');console.log('Media picker style: '+checks+' checks passed.');
}finally{await browser.close();}
