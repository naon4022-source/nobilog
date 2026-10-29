import assert from 'node:assert/strict';import {readFile,writeFile,mkdir} from 'node:fs/promises';import {createHash} from 'node:crypto';import {createRequire} from 'node:module';
import {reflowFractionMetrics} from './reflow-fraction-metrics.mjs';
const {chromium}=createRequire(import.meta.url)('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=new URL('../../../',import.meta.url),here=new URL('./',import.meta.url),out=new URL('font-metrics-repair-20261024/',here),S=new URL('教材整理/Claude_Codex共有/数学全体制作/メディア/制作ソース/',root),hash=x=>createHash('sha256').update(x).digest('hex');
const audit=JSON.parse(await readFile(new URL('fraction-glyph-audit-20261024.json',here),'utf8'));assert.equal(audit.imagesWithIssues,19);
const targets=new Map();
for(const [registry,backup]of [['縦分数_20261023','before-fraction-integration'],['縦分数_2章_20261023','before-chapter2-fraction-integration'],['縦分数_3章_20261023','before-chapter3-fraction-integration'],['縦分数_4章_20261024','before-chapter4-fraction-integration']]){
 const rows=JSON.parse(await readFile(new URL(registry+'/manifest.json',S),'utf8')).items;
 for(const [id,row]of Object.entries(rows))targets.set(id,{row,registry,original:new URL(backup+'/'+row.copy,here),current:new URL(row.copy,root)});
}
const items=[],browser=await chromium.launch({headless:true});await mkdir(new URL('candidates/',out),{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:1600,height:900}});await page.route('**/*',r=>r.abort());
 for(const item of audit.results.filter(x=>x.groups.some(g=>g.issues.length))){
  let original,current,registry=null,row=null;
  if(item.kind==='integrated'){
   const t=targets.get(item.id);assert(t);original=await readFile(t.original);current=await readFile(t.current);assert.equal(hash(current),t.row.afterSha256);assert.equal(hash(original),t.row.beforeSha256);registry=t.registry;row=t.row;
  }else{original=await readFile(new URL('site-assets/textbook-book-math1-'+item.id.toLowerCase()+'.svg',root));current=await readFile(new URL(item.file,root));}
  assert.equal(hash(current),item.sha256);
  const selected=item.kind==='integrated'?item.groups.filter(g=>g.issues.length).map(g=>g.text):null;
  const result=await reflowFractionMetrics(page,current.toString(),original.toString(),selected);assert(result.changes.length);
  const file='textbook-book-math1-'+item.id.toLowerCase()+'.svg',destination=new URL('candidates/'+file,out),final=Buffer.from(result.svg+'\n');await writeFile(destination,final);await page.screenshot({path:new URL('candidates/'+item.id+'.png',out).pathname});
  items.push({id:item.id,kind:item.kind,registry,originalFile:item.kind==='integrated'?String(targets.get(item.id).original.href):'site-assets/textbook-book-math1-'+item.id.toLowerCase()+'.svg',beforeSha256:item.sha256,originalRawSha256:hash(original),afterSha256:hash(final),candidate:'font-metrics-repair-20261024/candidates/'+file,changes:result.changes,canonicalRow:row,status:'candidate; visual and integration pending'});
 }
}finally{await browser.close();}
assert.equal(items.length,19);await writeFile(new URL('manifest.json',out),JSON.stringify({status:'candidate only; no app integration',reason:'Old temporary measuring text lost inherited SVG font family; fix actual glyph widths/bar coverage and explicit whitespace in place; preserve all glyph strings, baselines and non-text geometry',items},null,2)+'\n');console.log('Prepared '+items.length+' typography repair candidates ('+items.filter(x=>x.kind==='integrated').length+' current diagrams,3 unpublished chapter5 diagrams). No app writes.');
