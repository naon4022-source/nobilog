// Read-only internal SVG typography audit, separate from page/media-frame bounds.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=new URL('../../../',import.meta.url),here=new URL('./',import.meta.url),S=new URL('教材整理/Claude_Codex共有/数学全体制作/メディア/制作ソース/',root),items=[];
for(const folder of ['縦分数_20261023','縦分数_2章_20261023','縦分数_3章_20261023','縦分数_4章_20261024']){
 const rows=JSON.parse(await readFile(new URL(folder+'/manifest.json',S),'utf8')).items;
 for(const [id,row]of Object.entries(rows))items.push({id,file:row.copy,kind:'integrated'});
}
const next=JSON.parse(await readFile(new URL('chapter5-fraction-candidate/manifest.json',here),'utf8')).items;
for(const row of next)items.push({id:row.id,file:'tools/candidates/textbook-final-20261023/chapter5-fraction-candidate/'+row.file,kind:'candidate'});
const repaired=process.argv.includes('--repaired');
if(repaired){const revision=JSON.parse(await readFile(new URL('font-metrics-repair-20261024/manifest.json',here),'utf8'));for(const item of items){const row=revision.items.find(x=>x.id===item.id);if(row){item.file='tools/candidates/textbook-final-20261023/'+row.candidate;item.kind='repair candidate';}}}
const browser=await chromium.launch({headless:true}),results=[];
try{
 const page=await browser.newPage({viewport:{width:1800,height:1000}});await page.route('**/*',r=>r.abort());
 for(const item of items){
  const bytes=await readFile(new URL(item.file,root));await page.setContent('<style>body{margin:0}</style>'+bytes.toString());
  const groups=await page.evaluate(async()=>{
   await document.fonts.ready;const box=n=>{const b=n.getBBox();return{x:b.x,y:b.y,width:b.width,height:b.height,right:b.x+b.width,bottom:b.y+b.height};};
   const union=bs=>({x:Math.min(...bs.map(b=>b.x)),y:Math.min(...bs.map(b=>b.y)),right:Math.max(...bs.map(b=>b.right)),bottom:Math.max(...bs.map(b=>b.bottom))});
   return [...document.querySelectorAll('[data-stacked-fraction]')].map(group=>{
    const nodes=[...group.children].filter(n=>n.tagName!=='title'),parts=[],issues=[];
    for(let i=0;i<nodes.length;){
     if(nodes[i].tagName==='text'&&nodes[i+1]?.tagName==='line'&&nodes[i+2]?.tagName==='text'){
      const [top,bar,bottom]=nodes.slice(i,i+3),a=box(top),b=box(bottom),x1=Number(bar.getAttribute('x1')),x2=Number(bar.getAttribute('x2'));
      if(a.x<x1-1||b.x<x1-1||a.right>x2+1||b.right>x2+1)issues.push({type:'bar-too-short',numerator:top.textContent,denominator:bottom.textContent,bar:[x1,x2],glyphs:[a,b]});
      parts.push({type:'fraction',box:union([a,b,box(bar)])});i+=3;
     }else{if(nodes[i].tagName==='text')parts.push({type:'plain',text:nodes[i].textContent,box:box(nodes[i])});i++;}
    }
    for(let i=1;i<parts.length;i++){const a=parts[i-1],b=parts[i];if(a.box.right>b.box.x+1&&Math.min(a.box.bottom,b.box.bottom)>Math.max(a.box.y,b.box.y)+1)issues.push({type:'fragment-overlap',left:a.type==='plain'?a.text:'fraction',right:b.type==='plain'?b.text:'fraction',pixels:a.box.right-b.box.x});}
    return {text:group.getAttribute('data-stacked-fraction'),font:getComputedStyle(group).fontFamily,parts,issues};
   });
  });
  results.push({...item,sha256:createHash('sha256').update(bytes).digest('hex'),groups});
 }
}finally{await browser.close();}
const problems=results.filter(x=>x.groups.some(g=>g.issues.length));
await writeFile(new URL(repaired?'fraction-glyph-audit-repaired-candidates-20261024.json':'fraction-glyph-audit-20261024.json',here),JSON.stringify({status:problems.length?'repair required':'passed',scope:'Actual rendered font metrics, fragment spacing and bar coverage; read-only, all current stacked groups plus chapter5 candidates',images:results.length,groups:results.reduce((n,x)=>n+x.groups.length,0),imagesWithIssues:problems.length,results},null,2)+'\n');
for(const item of problems)console.log(item.id+': '+item.groups.filter(g=>g.issues.length).map(g=>g.text+' ['+g.issues.map(x=>x.type).join(',')+']').join('; '));
console.log('Audited '+results.length+' SVGs; '+problems.length+' require typography review; no teaching asset writes.');
