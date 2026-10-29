// Reuse the existing full-frame renderer; replace only the isolated scene code.
// Run after the shared full suite completes. This never generates audio.
import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const here=new URL('./',import.meta.url),source=new URL('../../../教材整理/Claude_Codex共有/数学全体制作/メディア/制作ソース/',import.meta.url);
const hash=b=>createHash('sha256').update(b).digest('hex'),id='M1-APP2-V01';
const manifest=JSON.parse(await readFile(new URL('net-layout-candidate.json',here),'utf8'));
assert.equal(hash(await readFile(new URL(id+'.html',source))),manifest.sourceBeforeSha256);
const html=await readFile(new URL('candidate/'+id+'.html',here));
assert.equal(hash(html),manifest.candidateSha256);
const scripts=[...html.toString().matchAll(/<script>([\s\S]*?)<\/script>/g)];
assert.equal(scripts.length,1);
const original=new URL('動画を描画_キャンバス.mjs',source);
let code=await readFile(original,'utf8');
const anchor='await page.evaluate(()=>document.fonts.ready);';
assert.equal(code.split(anchor).length,2);
code=code.replace('createRequire(import.meta.url)','createRequire('+JSON.stringify(original.href)+')')
 .replace(anchor,anchor+'await page.evaluate(s=>{eval(s)},'+JSON.stringify(scripts[0][1])+');');
const dir=new URL('candidate/'+id+'/',here);
await mkdir(new URL('shots/',dir),{recursive:true});
const ffmpeg=fileURLToPath(new URL('制作ツール/imageio_ffmpeg/binaries/ffmpeg-macos-x86_64-v7.1',source));
process.argv=[process.argv[0],fileURLToPath(original),fileURLToPath(new URL(id+'.html',source)),fileURLToPath(new URL(id+'.timeline.json',source)),fileURLToPath(new URL('silent.mp4',dir)),ffmpeg,'30',fileURLToPath(new URL('shots/',dir))];
await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
