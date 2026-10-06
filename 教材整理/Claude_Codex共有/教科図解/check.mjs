// 図解の点検（Claude）：SVG をブラウザで描き、文字が図の外や自分の箱の外にはみ出していないかを実際の大きさで測る。PNG も保存。
// node check.mjs 出力フォルダ a.svg b.svg ...
import {createRequire} from 'node:module';import fs from 'node:fs';import path from 'node:path';
const require=createRequire(import.meta.url),{chromium}=require('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const [out,...files]=process.argv.slice(2);fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:960,height:540}});
await page.route('**/*',r=>r.request().url().startsWith('file:')||r.request().url().startsWith('data:')||r.request().url()==='about:blank'?r.continue():r.abort());
let bad=0;
for(const f of files){
 await page.setContent('<html><body style="margin:0">'+fs.readFileSync(f,'utf8')+'</body></html>');
 const errs=await page.evaluate(()=>{const s=document.querySelector('svg'),E=[];const R=s.getBoundingClientRect();
  for(const t of s.querySelectorAll('text')){const b=t.getBBox();if(!t.textContent.trim())continue;
   if(b.x<-1||b.y<-1||b.x+b.width>961||b.y+b.height>541)E.push('図の外：'+t.textContent.slice(0,20));
   const id=t.getAttribute('data-box');if(id&&id.startsWith('b')){const gq=s.querySelector(`g[data-id="${id}"]`);const r=gq&&gq.querySelector('rect');if(r){const rb=r.getBBox();if(b.x<rb.x-2||b.x+b.width>rb.x+rb.width+2||b.y<rb.y-2||b.y+b.height>rb.y+rb.height+2)E.push('箱の外：'+t.textContent.slice(0,20))}}}
  return E});
 if(errs.length){bad++;console.log('NG',path.basename(f),errs.slice(0,4).join(' | '))}
 await page.screenshot({path:path.join(out,path.basename(f).replace('.svg','.png'))});
}
await browser.close();console.log('checked',files.length,'ng',bad);process.exit(bad?1:0);
