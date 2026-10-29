// Local synthetic canvas only; retain every video except two circle revisions.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const root=new URL('../../../',import.meta.url),here=new URL('./',import.meta.url),source=new URL('教材整理/Claude_Codex共有/数学全体制作/メディア/制作ソース/',root);
const {chromium}=createRequire(import.meta.url)('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const before=await readFile(new URL('数学3章_場面.js',source),'utf8'),after=await readFile(new URL('candidate/数学3章_場面.js',here),'utf8');
assert.equal(after,before.replace('ring(x,293,width/2+18,65,C.orange)','ring(640,293,(g.measureText(s).width/2+14)*1.12,110,C.orange)'));
const inventory=JSON.parse(await readFile(new URL('inventory.json',here),'utf8')),hash=b=>createHash('sha256').update(b).digest('hex'),results=[];
let browser;
try{
 browser=await chromium.launch({headless:true});
 for(const item of inventory){
  const tl=JSON.parse(await readFile(new URL(item.id+'.timeline.json',source),'utf8'));
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  await page.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.abort());
  await page.addInitScript(t=>window.TL=t,tl);await page.goto(new URL(item.id+'.html',source).href);await page.evaluate(()=>document.fonts.ready);
  const times=[...new Set([...Array.from({length:Math.ceil(Math.round(tl.total*30)/45)},(_,i)=>i*1.5),...tl.steps.flatMap(s=>[s.start,Math.min(s.end-.01,(s.start+s.end)/2)])])].filter(t=>t>=0&&t<tl.total).sort((a,b)=>a-b);
  const old=[];for(const t of times)old.push(hash(await page.evaluate(t=>{renderAt(t);return document.querySelector('canvas').toDataURL();},t)));
  await page.evaluate(s=>{eval(s);},after);let changed=0;
  for(let i=0;i<times.length;i++){
   const t=times[i],png=await page.evaluate(t=>{renderAt(t);return document.querySelector('canvas').toDataURL();},t),step=await page.evaluate(t=>stepAt(t).i,t);
   const expected=(item.id==='M1-C3-S1-V04'&&step>=2&&step<=4)||(item.id==='M1-C3-S1-VP'&&step===3);
   assert.equal(hash(png)!==old[i],expected,item.id+' '+t+' only designated circle changes');if(expected)changed++;
  }
  if(changed){
   const step=item.id.endsWith('VP')?3:4,t=(tl.steps[step].start+tl.steps[step].end)/2;
   const png=await page.evaluate(t=>{renderAt(t);return document.querySelector('canvas').toDataURL();},t);
   await writeFile(new URL('candidate/'+item.id+'-preview.png',here),Buffer.from(png.split(',')[1],'base64'));
   const geometry=await page.evaluate(()=>[2,3,4].map(k=>{
    const s=k===2?'3(x＋1)＝(2/3)x×12−1×12':k===3?'3(x＋1)＝8x−1×12':'3(x＋1)＝8x−12';
    g.font=`700 ${k===2?45:54}px ${FONT}`;g.textAlign='center';g.textBaseline='alphabetic';
    const m=g.measureText(s),rx=(m.width/2+14)*1.12,pad=10;
    const bounds=[640-m.actualBoundingBoxLeft-pad,640+m.actualBoundingBoxRight+pad,310-m.actualBoundingBoxAscent-pad,310+m.actualBoundingBoxDescent+pad];
    return {s,rx,bounds,corners:bounds.slice(0,2).flatMap(x=>bounds.slice(2).map(y=>((x-640)/rx)**2+((y-293)/110)**2))};
   }));
   assert(geometry.every(x=>x.corners.every(v=>v<1)&&640-x.rx>20&&640+x.rx<1260),'entire formula plus padding inside ellipse and canvas');
   await writeFile(new URL('candidate/'+item.id+'-geometry.json',here),JSON.stringify(geometry,null,2)+'\n');
  }
  results.push({id:item.id,samples:times.length,changed,unchanged:times.length-changed});await page.close();console.log(item.id+': '+changed+' circle samples changed');
 }
 await writeFile(new URL('scene-equivalence.json',here),JSON.stringify({beforeSha256:hash(before),afterSha256:hash(after),scope:'circle only; entire formula inside ellipse; no formula, narration, captions, timing changes',results},null,2)+'\n');
}finally{await browser?.close();}
