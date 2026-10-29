// 共有動画エンジンと同じ renderAt(t) を全30fpsで描画。
// canvasのPNGを取得し、画面キャプチャの待ち時間だけを省く。コマを間引かない。
import {createRequire} from 'node:module';import {spawn} from 'node:child_process';import {once} from 'node:events';import fs from 'node:fs';import {pathToFileURL} from 'node:url';
const {chromium}=createRequire(import.meta.url)('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const [html,tlPath,out,ffmpeg,fpsArg,shotDir]=process.argv.slice(2),fps=Number(fpsArg),tl=JSON.parse(fs.readFileSync(tlPath,'utf8'));
if(fps!==30)throw Error('30fps専用');
const browser=await chromium.launch({headless:true});let proc;
try{
 const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});await page.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.abort());await page.addInitScript(t=>window.TL=t,tl);await page.goto(pathToFileURL(html).href);await page.evaluate(()=>document.fonts.ready);
 proc=spawn(ffmpeg,['-y','-f','image2pipe','-vcodec','png','-r','30','-i','pipe:0','-an','-c:v','libx264','-preset','medium','-crf','24','-pix_fmt','yuv420p','-movflags','+faststart',out],{stdio:['pipe','ignore','pipe']});let err='';proc.stderr.on('data',d=>err+=d);const done=once(proc,'close'),n=Math.round(tl.total*30);
 for(let i=0;i<n;i++){const png=await page.evaluate(t=>{renderAt(t);return document.querySelector('canvas').toDataURL('image/png').split(',')[1]},i/30),img=Buffer.from(png,'base64');if(shotDir&&i%45===0)fs.writeFileSync(`${shotDir}/f${String(i).padStart(5,'0')}.png`,img);if(!proc.stdin.write(img))await once(proc.stdin,'drain')}
 proc.stdin.end();const [code]=await done;if(code)throw Error(err.slice(-800));console.log('frames',n,'canvas PNG, no skipped frames');
}finally{if(proc?.exitCode===null)proc.kill();await browser.close()}
