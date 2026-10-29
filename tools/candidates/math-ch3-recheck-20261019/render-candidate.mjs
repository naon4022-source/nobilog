// Reuse the 30fps renderer, injecting only the reviewed candidate scene source.
import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const here=new URL('./',import.meta.url),source=new URL('../../../教材整理/Claude_Codex共有/数学全体制作/メディア/制作ソース/',import.meta.url);
const id=process.argv[2];assert(['M1-C3-S1-V04','M1-C3-S1-VP'].includes(id));
const original=new URL('動画を描画_キャンバス.mjs',source),candidate=await readFile(new URL('candidate/数学3章_場面.js',here),'utf8');
let code=await readFile(original,'utf8');
const anchor='await page.evaluate(()=>document.fonts.ready);';assert.equal(code.split(anchor).length,2);
code=code.replace('createRequire(import.meta.url)','createRequire('+JSON.stringify(original.href)+')').replace(anchor,anchor+'await page.evaluate(s=>{eval(s)},'+JSON.stringify(candidate)+');');
const dir=new URL('candidate/'+id+'/',here);await mkdir(new URL('shots/',dir),{recursive:true});
const ffmpeg=fileURLToPath(new URL('制作ツール/imageio_ffmpeg/binaries/ffmpeg-macos-x86_64-v7.1',source));
process.argv=[process.argv[0],fileURLToPath(original),fileURLToPath(new URL(id+'.html',source)),fileURLToPath(new URL(id+'.timeline.json',source)),fileURLToPath(new URL('silent.mp4',dir)),ffmpeg,'30',fileURLToPath(new URL('shots/',dir))];
await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
