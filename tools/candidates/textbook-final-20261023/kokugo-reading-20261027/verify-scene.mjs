import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import crypto from 'node:crypto';
const require=createRequire(import.meta.url);
const {chromium}=require('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const here=path.dirname(fileURLToPath(import.meta.url)),sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const group=process.argv[2]||'videos';if(!['videos','videos-caption-v2'].includes(group))throw Error('invalid candidate group');
const browser=await chromium.launch({headless:true});
const results=[];
try{
 for(const id of ['K1-C1-S1-V01','K1-C1-S1-VP']){
  const dir=path.join(here,group,id),timeline=JSON.parse(fs.readFileSync(path.join(dir,'timeline.json')));
  const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.abort());
  await page.addInitScript(t=>{window.TL=t},timeline);
  await page.goto(pathToFileURL(path.join(dir,'scene.html')).href);
  await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(()=>{
   window.paintErrors=[];const original=g.fillText.bind(g);
   g.fillText=(s,x,y,...rest)=>{
    if(g.globalAlpha>.01&&String(s).trim()){
     const b=g.measureText(s),m=g.getTransform();
     const corners=[[x-b.actualBoundingBoxLeft,y-b.actualBoundingBoxAscent],[x+b.actualBoundingBoxRight,y+b.actualBoundingBoxDescent]].map(([a,c])=>new DOMPoint(a,c).matrixTransform(m));
     if(corners.some(p=>p.x < -2||p.x > 1282||p.y < -2||p.y > 722))window.paintErrors.push({text:s,x,y,font:g.font,corners:corners.map(p=>[p.x,p.y])});
    }
    return original(s,x,y,...rest);
   };
  });
  for(const step of timeline.steps){
   for(const time of [step.start+.03,Math.max(step.start,step.end-.03)]){
    await page.evaluate(t=>window.renderAt(t),time);
    if(group==='videos-caption-v2'){
     const caption=await page.evaluate(()=>window.lastCandidateCaption);
     const invalidBoundary=caption?.lines.some(s=>{
      const first=s[0],last=s[s.length-1];
      return '、。，．！？?!）)]」』】〉》…ー'.includes(first)||'（([「『【〈《'.includes(last);
     });
     if(!caption||caption.source!==step.cap||caption.lines.join('')!==step.cap||invalidBoundary)throw Error('caption content or quotation boundary regression');
    }
   }
  }
  const overflow=await page.evaluate(()=>window.paintErrors);
  if(errors.length||overflow.length)throw Error(JSON.stringify({id,errors,overflow}));
  const screens=path.join(dir,'scene-screens');fs.mkdirSync(screens,{recursive:true});
  const scenes=[...new Map(timeline.steps.map(s=>[s.sceneIndex,s])).values()],shots=[];
  for(const scene of scenes){
   const time=scene.sceneStart+(scene.sceneEnd-scene.sceneStart)*.65;
   await page.evaluate(t=>window.renderAt(t),time);
   const file=path.join(screens,`s${String(scene.sceneIndex).padStart(2,'0')}.png`);await page.screenshot({path:file});
   shots.push({scene:scene.sceneIndex,time,file:path.relative(here,file),sha256:sha(file)});
  }
  await page.close();results.push({id,logicalScenes:scenes.length,captionChunks:timeline.steps.length,sceneSha256:sha(path.join(here,'scene.js')),timelineSha256:sha(path.join(dir,'timeline.json')),screens:shots});
 }
 fs.writeFileSync(path.join(here,group==='videos'?'scene-result.json':'scene-caption-v2-result.json'),JSON.stringify({status:'canvas preflight passed; actual movie and visual approval pending',items:results,scope:'Every caption chunk start/end; real text bounds/no page errors;15 logical scene screenshots. No API/main edits.'},null,2)+'\n');
 console.log('Chapter1 scene preflight:2 scenesets, every caption chunk checked; visual/movie approval pending');
}finally{await browser.close();}
