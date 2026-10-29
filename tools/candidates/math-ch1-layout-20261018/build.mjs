// Scoped geometry corrections. This builds candidates, never edits shared materials.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const here=new URL('./',import.meta.url),root=new URL('../../../',here);
const media=new URL('教材整理/Claude_Codex共有/数学全体制作/メディア/',root);
const measurements=JSON.parse(await readFile(new URL('before/geometry.json',here),'utf8'));
const sha=s=>createHash('sha256').update(s).digest('hex');
await mkdir(new URL('svg/',here),{recursive:true});
await mkdir(new URL('previous/',here),{recursive:true});
let browser;const manifest=[];
try{
 browser=await chromium.launch({headless:true});const page=await browser.newPage();
 await page.route('**/*',r=>r.abort());
 for(const original of measurements){
  const {id}=original;assert(!['M1-C1-S2-M05','M1-C1-S2-M06'].includes(id));
  const file=new URL(id+'.svg',media);const before=await readFile(file,'utf8');
  assert.equal(sha(before),original.sha256,'original unchanged: '+id);
  let svg=before;
  const replace=(a,b)=>{assert.equal(svg.split(a).length-1,1,id+' unique edit anchor');svg=svg.replace(a,b);};
  if(id==='M1-C1-S2-D07'){
   // Keep the exponent outside the negative base, and the leading minus outside its green frame.
   replace('>(−3)²</text>','><tspan>(−3)</tspan><tspan dx="24">²</tspan></text>');
   replace('>−3²</text>','><tspan>−</tspan><tspan dx="24">3²</tspan></text>');
   replace('>−(3×3)</text>','><tspan>−</tspan><tspan dx="24">(3×3)</tspan></text>');
   await page.setContent('<meta charset="utf-8">'+svg);await page.evaluate(()=>document.fonts.ready);
   const frames=await page.evaluate(()=>{
    const texts=[...document.querySelectorAll('svg text')];
    return ['(−3)²','(−3)×(−3)','−3²','−(3×3)'].map((value,i)=>{
     const t=texts.find(t=>t.textContent===value);
     const b=(i===0?t.querySelector('tspan'):i>1?t.querySelectorAll('tspan')[1]:t).getBBox();
     return {x:b.x-10,y:b.y-10,width:b.width+20,height:b.height+20};
    });
   });
   const rects=[...svg.matchAll(/<rect\b[^>]*stroke="(?:#1f5fa8|#397052)"[^>]*\/>/g)].map(m=>m[0]);
   assert.equal(rects.length,4);
   for(let i=0;i<rects.length;i++){
    let next=rects[i];for(const [key,value] of Object.entries(frames[i]))next=next.replace(new RegExp(' '+key+'="[^"]+"'),' '+key+'="'+value.toFixed(3)+'"');
    replace(rects[i],next);
   }
  }else if(id==='M1-C1-S2-E02'){
   replace('<rect x="640" y="405"','<rect x="640" y="425"');
   replace('<text x="840" y="373"','<text x="840" y="400"');
  }else if(id==='M1-C1-S3-DMAP'){
   replace('<text x="1090" y="392" text-anchor="middle">','<text x="1030" y="392" text-anchor="end">');
  }else{
   // Keep the required red ellipse, with enough room for the unchanged wrong-answer text.
   replace('cx="420" cy="422" rx="295" ry="113"','cx="420" cy="422" rx="315" ry="125"');
   replace('<text x="420" y="375"','<text x="420" y="400"');
   if(svg.includes('<text x="420" y="450"'))replace('<text x="420" y="450"','<text x="420" y="475"');
  }
  await page.setContent('<meta charset="utf-8">'+svg);await page.evaluate(()=>document.fonts.ready);
  assert.deepEqual(await page.locator('svg text').allTextContents(),original.texts.map(t=>t.text),'all words, formulas and numbers preserved: '+id);
  const copied=new URL('site-assets/textbook-book-math1-'+id.toLowerCase()+'.svg',root);
  const copyBefore=await readFile(copied);assert.equal(sha(copyBefore),sha(before),'book copy matches original');
  await copyFile(file,new URL('previous/'+id+'.svg',here));
  await writeFile(new URL('svg/'+id+'.svg',here),svg);
  manifest.push({id,file:decodeURIComponent(file.pathname),copy:decodeURIComponent(copied.pathname),before:sha(before),after:sha(svg),textPreserved:true});
 }
 await writeFile(new URL('manifest.json',here),JSON.stringify(manifest,null,2)+'\n');
 console.log('Built '+manifest.length+' geometry-only candidates; all SVG texts/formulas/numbers preserved. Shared originals unchanged.');
}finally{await browser?.close();}
