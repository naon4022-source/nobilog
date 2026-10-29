assert.match(process.argv[2]||'',/^[2-5]$/,'chapter 2 to 5 only');
// Reuse the reviewed local-only book playback harness. Only its base URL,
// selected chapter and report date/destination change; assertions are retained.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const original=new URL('../../../教材整理/Claude_Codex共有/数学全体制作/メディア/制作ソース/本内動画を点検.mjs',import.meta.url);
let source=await readFile(original,'utf8');
const replace=(before,after)=>{assert.equal(source.split(before).length-1,1,'unchanged playback harness patch anchor');source=source.replace(before,after);};
replace('createRequire(import.meta.url)','createRequire('+JSON.stringify(original.href)+')');
replace("const source=new URL('./',import.meta.url)",'const source=new URL('+JSON.stringify(new URL('./',original).href)+')');
replace('const selected=process.argv.slice(2);',"const selected=['M1-C'+process.argv[2]+'-'];");
replace("new URL('../点検/69本_本内再生/',source)","new URL('../点検/20261023_最終教科書/本内再生/',source)");
replace("date:'2026-10-11'","date:new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Tokyo'})");
await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
