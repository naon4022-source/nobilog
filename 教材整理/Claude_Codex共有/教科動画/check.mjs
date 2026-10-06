// 点検：場面の各ステップの終わり（p=0.92）の絵を撮り、template.js の警告（入りきらない・見出しが長い）を出す（Claude）
import {createRequire} from 'node:module';import fs from 'node:fs';import {pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url),{chromium}=require('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const [html,tlPath,outDir]=process.argv.slice(2),tl=JSON.parse(fs.readFileSync(tlPath,'utf8'));fs.mkdirSync(outDir,{recursive:true});
const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1280,height:720}});
await page.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.abort());
const errs=[];page.on('pageerror',e=>errs.push(String(e)));
await page.addInitScript(t=>{window.TL=t},tl);await page.goto(pathToFileURL(html).href);await page.evaluate(()=>document.fonts.ready);
for(let k=0;k<tl.steps.length;k++){await page.evaluate(t=>{window.WARN.length=0;window.renderAt(t)},k+0.92);fs.writeFileSync(`${outDir}/s${k}.png`,await page.screenshot({type:'png'}));
 const w=await page.evaluate(()=>[...new Set(window.WARN)]);w.forEach(x=>errs.push(`s${k} ${x}`))}
await browser.close();console.log(errs.length?'WARN '+errs.join(' | '):'clean');process.exit(errs.length?1:0);
