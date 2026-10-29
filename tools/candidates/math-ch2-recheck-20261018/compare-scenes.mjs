// Compare all existing 1.5s samples; only the targeted circle may change. No media writes or external network.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const root=new URL('../../../',import.meta.url),here=new URL('./',import.meta.url),source=new URL('教材整理/Claude_Codex共有/数学全体制作/メディア/制作ソース/',root);
const {chromium}=createRequire(import.meta.url)('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const before=await readFile(new URL('数学2章_場面.js',source),'utf8'),after=await readFile(new URL('candidate/数学2章_場面.js',here),'utf8');assert.equal(after,before.replace('ring(720,257,205,63)','ring(640,257,300,75)'));
const inv=JSON.parse(await readFile(new URL('inventory.json',here),'utf8')),hash=b=>createHash('sha256').update(b).digest('hex');const results=[];let browser;
try{browser=await chromium.launch({headless:true});for(const x of inv){const tl=JSON.parse(await readFile(new URL(x.id+'.timeline.json',source),'utf8'));const page=await browser.newPage({viewport:{width:1280,height:720}});await page.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.abort());await page.addInitScript(t=>window.TL=t,tl);await page.goto(new URL(x.id+'.html',source).href);await page.evaluate(()=>document.fonts.ready);
 const times=[...new Set([...Array.from({length:Math.ceil(Math.round(tl.total*30)/45)},(_,i)=>i*1.5),...tl.steps.flatMap(s=>[s.start,Math.min(s.end-.01,(s.start+s.end)/2)])])].filter(t=>t>=0&&t<tl.total).sort((a,b)=>a-b);
 const first=[];for(const t of times)first.push(hash(await page.evaluate(t=>{renderAt(t);return document.querySelector('canvas').toDataURL();},t)));
 await page.evaluate(s=>{eval(s);},after);let changed=0,unchanged=0;
 for(let i=0;i<times.length;i++){const t=times[i],png=await page.evaluate(t=>{renderAt(t);return document.querySelector('canvas').toDataURL();},t);const equal=hash(png)===first[i];const step=await page.evaluate(t=>stepAt(t).i,t);const expected=x.id==='M1-C2-S1-V03'&&[2,3].includes(step);assert.equal(!equal,expected,x.id+' t='+t+' only designated circle frames change');equal?unchanged++:changed++;
 if(x.id==='M1-C2-S1-V03'&&[10.5,15].includes(t))await writeFile(new URL('candidate/preview-'+t+'.png',here),Buffer.from(png.split(',')[1],'base64'));
 }
 if(x.id==='M1-C2-S1-V03'){
 const geometry=await page.evaluate(()=>['5 − 2×(−3)','5 − (−6)'].map(formula=>{g.font=`700 64px ${FONT}`;g.textAlign='center';g.textBaseline='alphabetic';const m=g.measureText(formula),pad=10,x1=640-m.actualBoundingBoxLeft-pad,x2=640+m.actualBoundingBoxRight+pad,y1=280-m.actualBoundingBoxAscent-pad,y2=280+m.actualBoundingBoxDescent+pad;return {formula,bounds:{x1,x2,y1,y2},corners:[[x1,y1],[x1,y2],[x2,y1],[x2,y2]].map(([x,y])=>((x-640)/300)**2+((y-257)/75)**2)};}));assert(geometry.every(g=>g.corners.every(c=>c<1)),'all expression glyphs plus 10px padding inside corrected ellipse');await writeFile(new URL('circle-geometry.json',here),JSON.stringify(geometry,null,2)+'\n');
 }
 results.push({id:x.id,samples:times.length,unchanged,changed});await page.close();console.log(x.id+': '+unchanged+' identical, '+changed+' designated circle samples changed');
}await writeFile(new URL('scene-equivalence.json',here),JSON.stringify({beforeSha256:hash(before),afterSha256:hash(after),change:'single target branch circle center/radii only',results},null,2)+'\n');}finally{await browser?.close();}
