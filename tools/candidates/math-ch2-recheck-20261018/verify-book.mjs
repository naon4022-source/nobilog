// Reuse the reviewed local-only book playback harness. Only its base URL,
// selected chapter and report date/destination change; assertions are retained.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const original=new URL('../../../教材整理/Claude_Codex共有/数学全体制作/メディア/制作ソース/本内動画を点検.mjs',import.meta.url);
let source=await readFile(original,'utf8');
const replace=(before,after)=>{assert.equal(source.split(before).length-1,1,'unchanged playback harness patch anchor');source=source.replace(before,after);};
replace('createRequire(import.meta.url)','createRequire('+JSON.stringify(original.href)+')');
replace("const source=new URL('./',import.meta.url)",'const source=new URL('+JSON.stringify(new URL('./',original).href)+')');
replace('const selected=process.argv.slice(2);',"const selected=['M1-C2-'];");
replace("new URL('../点検/69本_本内再生/',source)",process.argv.includes('--layout-final')?"new URL('../点検/20261018_配置修正後/本内再生/',source)":"new URL('../点検/20261018_章別再点検/本内再生/',source)");
replace("date:'2026-10-11'","date:new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Tokyo'})");
if(process.argv.includes('--layout-final')){
 const placements=await readFile(new URL('../../../教材整理/実装/media-pages.mjs',import.meta.url),'utf8');
 const collector=/const map=await p\.evaluate\(([\s\S]+?)\);\n map\.generatedAt=/.exec(placements)?.[1];
 assert(collector,'actual recursive placement collector available');
 const destination=new URL('final-media-placements.json',import.meta.url).href;
 replace('  assert.deepEqual(errors,[]);await page.close();',
  '  if(width===1440){const placed=await page.evaluate('+collector+');placed.generatedAt=new Date().toLocaleDateString("sv-SE",{timeZone:"Asia/Tokyo"});for(const item of items)assert(Number.isInteger(placed.media[item.id]?.page));await fs.writeFile(new URL('+JSON.stringify(destination)+'),JSON.stringify(placed,null,1)+"\\n");}\n  assert.deepEqual(errors,[]);await page.close();');
}
await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
