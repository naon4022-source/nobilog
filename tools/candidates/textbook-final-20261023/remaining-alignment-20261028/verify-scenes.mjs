import assert from 'node:assert/strict';
import {readFile,writeFile,readdir,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const here=new URL('./',import.meta.url),root=new URL('../../../../',here),movies=new URL('movies/',here);
const sha=b=>createHash('sha256').update(b).digest('hex');
const available=(await readdir(movies,{withFileTypes:true})).filter(x=>x.isDirectory()).map(x=>x.name).sort();
const ids=process.argv.slice(2).length?process.argv.slice(2):available;
assert(ids.length&&new Set(ids).size===ids.length&&ids.every(id=>available.includes(id)));
const browser=await chromium.launch({headless:true});const results=[];
try{
 for(const id of ids){
  const dir=new URL(id+'/',movies),preparedBytes=await readFile(new URL('prepared.json',dir)),prepared=JSON.parse(preparedBytes);
  assert.equal(prepared.sceneSha256,sha(await readFile(new URL('scene.js',here))));
  for(const [file,digest]of Object.entries(prepared.inputs))assert.equal(sha(await readFile(new URL(file,root))),digest,'scene input changed');
  try{
   const previous=JSON.parse(await readFile(new URL('preflight-result.json',dir)));
   assert.equal(previous.preparedSha256,sha(preparedBytes));assert.equal(previous.status,'mechanical preflight passed; direct scene review required');
   for(const row of previous.screens)assert.equal(sha(await readFile(new URL(row.file,dir))),row.sha256);
   results.push(previous);continue;
  }catch(error){if(error.code!=='ENOENT')throw error;}
  const timeline=JSON.parse(await readFile(new URL('timeline.json',dir))),page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',route=>route.request().url().startsWith('file:')?route.continue():route.abort());
  await page.addInitScript(t=>{window.TL=t;},timeline);
  await page.goto(new URL('scene.html',dir).href);await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.evaluate(()=>META.id),id);
  await page.evaluate(()=>{
   window.paintErrors=[];const original=g.fillText.bind(g);
   g.fillText=(value,x,y,...rest)=>{
    if(g.globalAlpha>.01&&String(value).trim()){
     const bounds=g.measureText(value),matrix=g.getTransform();
     const corners=[[x-bounds.actualBoundingBoxLeft,y-bounds.actualBoundingBoxAscent],[x+bounds.actualBoundingBoxRight,y+bounds.actualBoundingBoxDescent]].map(([a,b])=>new DOMPoint(a,b).matrixTransform(matrix));
     if(corners.some(p=>p.x < -2||p.x > 1282||p.y < -2||p.y > 722))paintErrors.push({text:value,x,y,font:g.font,corners:corners.map(p=>[p.x,p.y])});
    }
    return original(value,x,y,...rest);
   };
  });
  for(const step of timeline.steps)for(const time of [step.start+.03,Math.max(step.start,step.end-.03)]){
   await page.evaluate(t=>renderAt(t),time);
   const caption=await page.evaluate(()=>lastCandidateCaption);
   assert.equal(caption.source,step.cap);assert.equal(caption.lines.join(''),step.cap);
   const boundaryOK=caption.lines.every(line=>{
    const first=line[0],last=line.at(-1);
    return !'、。，．！？?!）)]」』】〉》…ー'.includes(first)&&!'（([「『【〈《'.includes(last);
   });
   assert(boundaryOK,'caption quote boundary');
  }
  const roles=await page.evaluate(()=>META.steps.map(s=>({role:s.role,say:s.say})));
  for(const row of roles)if(row.say.startsWith('気をつけて'))assert.equal(row.role,'caution');
  const overflow=await page.evaluate(()=>paintErrors);
  assert.deepEqual(errors,[]);assert.deepEqual(overflow,[],'canvas text leaves frame');
  await mkdir(new URL('scene-screens/',dir));const screens=[];
  for(const step of [...new Map(timeline.steps.map(s=>[s.sceneIndex,s])).values()]){
   const time=step.sceneStart+(step.sceneEnd-step.sceneStart)*.65;
   await page.evaluate(t=>renderAt(t),time);
   const file=`scene-screens/s${String(step.sceneIndex).padStart(2,'0')}.png`;await page.screenshot({path:new URL(file,dir).pathname});
   screens.push({scene:step.sceneIndex,time,file,sha256:sha(await readFile(new URL(file,dir)))});
  }
  await page.close();const result={status:'mechanical preflight passed; direct scene review required',id,preparedSha256:sha(preparedBytes),sceneSha256:prepared.sceneSha256,logicalScenes:screens.length,captionChunks:timeline.steps.length,roles,screens,scope:'Actual canvas at every caption start/end; exact source captions, quote boundaries, text frame bounds, caution-role identity and logical-scene screenshots. No MP4, main changes or final approval.'};
  await writeFile(new URL('preflight-result.json',dir),JSON.stringify(result,null,2)+'\n');results.push(result);console.log(id,'preflight passed;',screens.length,'scenes;',timeline.steps.length,'caption chunks');
 }
}finally{await browser.close();}
await writeFile(new URL('scene-preflight-result.json',here),JSON.stringify({status:'mechanical candidate preflight passed; direct review required',items:results.map(r=>({id:r.id,logicalScenes:r.logicalScenes,captionChunks:r.captionChunks,sceneSha256:r.sceneSha256}))},null,2)+'\n');
