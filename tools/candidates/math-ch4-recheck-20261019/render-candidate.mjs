// Render only a defective target, preserving all 30fps frames and the existing approved audio later.
import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const here=new URL('./',import.meta.url),source=new URL('../../../教材整理/Claude_Codex共有/数学全体制作/メディア/制作ソース/',import.meta.url);
const id=process.argv[2],patches={'M1-C4-S2-VP':'階段グラフ_整数条件補正.js','M1-C4-S1-VP':'駐車料金_境界補正.js','M1-C4-REVIEW-V01':'駐車料金_境界補正.js'};assert(patches[id]);
const original=new URL('動画を描画_キャンバス.mjs',source),data=JSON.parse(await readFile(new URL('candidate/'+id+'.json',here),'utf8'));
const candidate='VIDEO.summary='+JSON.stringify(data.summary)+';\n'+await readFile(new URL('candidate/'+patches[id],here),'utf8');
let code=await readFile(original,'utf8');const anchor='await page.evaluate(()=>document.fonts.ready);';assert.equal(code.split(anchor).length,2);
code=code.replace('createRequire(import.meta.url)','createRequire('+JSON.stringify(original.href)+')').replace(anchor,anchor+'await page.evaluate(s=>{eval(s)},'+JSON.stringify(candidate)+');');
const dir=new URL('candidate/'+id+'/',here);await mkdir(new URL('shots/',dir),{recursive:true});
const ffmpeg=fileURLToPath(new URL('制作ツール/imageio_ffmpeg/binaries/ffmpeg-macos-x86_64-v7.1',source));
process.argv=[process.argv[0],fileURLToPath(original),fileURLToPath(new URL(id+'.html',source)),fileURLToPath(new URL(id+'.timeline.json',source)),fileURLToPath(new URL('silent.mp4',dir)),ffmpeg,'30',fileURLToPath(new URL('shots/',dir))];
await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
