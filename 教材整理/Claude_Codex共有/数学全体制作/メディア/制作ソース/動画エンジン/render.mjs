// 1秒30コマで描いて H.264 にする（音はあとで make_video.py が重ねる）
import {createRequire} from 'node:module';import {spawn} from 'node:child_process';import {once} from 'node:events';import fs from 'node:fs';import {pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url),{chromium}=require('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const [html,tlPath,out,ffmpeg,fpsArg,shotDir]=process.argv.slice(2),fps=Number(fpsArg||30),tl=JSON.parse(fs.readFileSync(tlPath,'utf8'));
const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
await page.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.abort());
await page.addInitScript(t=>{window.TL=t},tl);await page.goto(pathToFileURL(html).href);await page.evaluate(()=>document.fonts.ready);
const proc=spawn(ffmpeg,['-y','-f','image2pipe','-vcodec','png','-r',String(fps),'-i','pipe:0','-an','-c:v','libx264','-preset','medium','-crf','24','-pix_fmt','yuv420p','-movflags','+faststart',out],{stdio:['pipe','ignore','pipe']});
let err='';proc.stderr.on('data',d=>err+=d);const done=once(proc,'close');const n=Math.round(tl.total*fps);
for(let i=0;i<n;i++){await page.evaluate(t=>window.renderAt(t),i/fps);const img=await page.screenshot({type:'png'});if(shotDir&&i%Math.round(fps*1.5)===0)fs.writeFileSync(`${shotDir}/f${String(i).padStart(5,'0')}.png`,img);if(!proc.stdin.write(img))await once(proc.stdin,'drain')}
proc.stdin.end();const [code]=await done;await browser.close();if(code){console.error(err.slice(-800));process.exit(1)}console.log('frames',n);
