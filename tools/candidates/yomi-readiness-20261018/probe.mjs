// Deterministic native media pause between play() and sampling. No fake
// animation, clock values, output widths, learner records or external network.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const baseline=process.argv.includes('--baseline');
const file=new URL(baseline?'./previous/verify-textbook-yomi-browser.mjs':'./verify.mjs',import.meta.url);
let source=await readFile(file,'utf8');
source=source.replace('createRequire(import.meta.url)','createRequire('+JSON.stringify(file.href)+')');
source=source.replace(/new URL\('\.\.\/(?:\.\.\/)?(?:\.\.\/)?site-assets\/',import.meta.url\)/,'new URL('+JSON.stringify(new URL('../../../site-assets/',import.meta.url).href)+')');
const pause=`await page.addInitScript(()=>{
 const proto=HTMLMediaElement.prototype,clock=Object.getOwnPropertyDescriptor(proto,'currentTime'),play=proto.play;let injected=false;
 Object.defineProperty(proto,'currentTime',{...clock,set(value){
  clock.set.call(this,value);
  if(!injected&&this.tagName==='AUDIO'&&value>0){
   injected=true;clock.set.call(this,value+.05);this.pause();setTimeout(()=>play.call(this).catch(()=>{}),4000);
  }
 }});
 });\n `;
assert.equal(source.split('await page.goto(').length-1,1);
source=source.replace('await page.goto(',pause+'await page.goto(');
try{
 await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 assert.equal(baseline,false,'baseline must expose measurement before audio is playing');
 console.log('Read-aloud startup probe: native seek 50ms into the paragraph, 4s pause, actual playback recovery before unchanged smoothness assertions; no application changes');
}catch(error){
 if(!baseline||!error.message.startsWith('line grows smoothly:'))throw error;
 console.log('Expected baseline failure reproduced: '+error.message);
}
