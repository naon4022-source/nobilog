// Render only the existing third-chapter diagrams; no server, user data or network.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url);
const {chromium}=require('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=new URL('../../../',import.meta.url), here=new URL('./',import.meta.url);
const media=new URL('教材整理/Claude_Codex共有/数学全体制作/メディア/',root);
const only=process.argv.find(x=>x.startsWith('--only='))?.slice(7);
const changed=process.argv.includes('--changed')?new Set(JSON.parse(await readFile(new URL('svg-manifest.json',here),'utf8')).map(x=>x.id)):null;
const requested=JSON.parse(await readFile(new URL('制作ソース/依頼台帳_1件ずつ.json',media),'utf8')).filter(x=>x.id.startsWith('M1-C3-')&&x.kind==='図解'&&(!changed||changed.has(x.id))&&(!only||x.id===only));
const cards=requested.filter(x=>/-M\d+$/.test(x.id)).map(x=>x.id);
const diagrams=requested.filter(x=>!cards.includes(x.id)).map(x=>x.id);
const candidate=process.argv.includes('--candidate'), label=candidate?'candidate-images':'before-images';
const out=new URL(label+'/',here);await mkdir(out,{recursive:true});
const results=[];let browser;
try{
 browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1600,height:900}});
 await page.route('**/*',r=>r.abort());
 const images=[];
 for(const id of [...diagrams,...cards]){
  const svg=await readFile(new URL(id+'.svg',candidate?new URL('svg/',here):media),'utf8');
  await page.setContent('<meta charset="utf-8"><style>body{margin:0}svg{display:block;width:1600px;height:900px}</style>'+svg);
  await page.evaluate(()=>document.fonts.ready);
  const geometry=await page.evaluate(()=>{
   const box=n=>{const b=n.getBBox();return {x:b.x,y:b.y,width:b.width,height:b.height};};
   return {texts:[...document.querySelectorAll('svg text')].map(t=>({text:t.textContent,box:box(t),chars:Array.from({length:t.getNumberOfChars()},(_,i)=>{const b=t.getExtentOfChar(i);return {x:b.x,y:b.y,width:b.width,height:b.height};})})),rects:[...document.querySelectorAll('svg rect')].map(n=>({attrs:Object.fromEntries([...n.attributes].map(a=>[a.name,a.value])),box:box(n)})),ellipses:[...document.querySelectorAll('svg ellipse')].map(n=>({attrs:Object.fromEntries([...n.attributes].map(a=>[a.name,a.value])),box:box(n)}))};
  });
  results.push({id,sha256:createHash('sha256').update(svg).digest('hex'),...geometry});
  if(diagrams.includes(id))await page.screenshot({path:new URL(id+'.png',out).pathname});
  else images.push({id,svg});
 }
 if(images.length){
 await page.setViewportSize({width:1600,height:Math.ceil(images.length/3)*300});
 await page.setContent('<meta charset="utf-8"><style>body{margin:0;display:grid;grid-template-columns:repeat(3,1fr)}section{height:300px;position:relative}svg{width:100%;height:100%}small{position:absolute;left:8px;top:4px;background:white;font:16px sans-serif}</style>'+images.map(({id,svg})=>'<section><small>'+id+'</small>'+svg+'</section>').join(''));
 await page.evaluate(()=>document.fonts.ready);
 await page.screenshot({path:new URL('cards.png',out).pathname});
 }
 await writeFile(new URL('geometry.json',out),JSON.stringify(results,null,2)+'\n');
 console.log(label+': rendered '+diagrams.length+' diagrams and '+cards.length+' cards; SVG text/glyph bounds saved, no network or material changes');
}finally{await browser?.close();}
