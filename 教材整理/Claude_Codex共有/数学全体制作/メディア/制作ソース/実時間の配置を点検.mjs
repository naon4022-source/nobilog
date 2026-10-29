// 実際の音声時間割で1.5秒おきに文字を測る。図の数学条件と目視点検は別に行う。
import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';import {pathToFileURL,fileURLToPath} from 'node:url';
const {chromium}=createRequire(import.meta.url)('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.dirname(fileURLToPath(import.meta.url));const ledger=JSON.parse(fs.readFileSync(path.join(root,'69本_制作進捗.json')));
const ids=process.argv.slice(2);const selected=ledger.items.filter(x=>ids.length?ids.includes(x.id):x.state==='出力済み／全場面点検待ち');
if(ids.some(id=>!selected.some(x=>x.id===id)))throw Error('対象外ID');
let browser;let failed=false;
try{
 browser=await chromium.launch();
 for(const item of selected){
  const tl=JSON.parse(fs.readFileSync(path.join(root,item.id+'.timeline.json')));const p=await browser.newPage({viewport:{width:1280,height:720}});
  await p.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.abort());
  await p.addInitScript(t=>{window.TL=t;window.texts=[];const original=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(s,x,y,...a){const tr=this.getTransform(),m=this.measureText(s),size=Number(this.font.match(/([\d.]+)px/)[1]),left=x-(this.textAlign==='center'?m.width/2:this.textAlign==='right'?m.width:0);if(this.globalAlpha>.05)window.texts.push({s,size,l:left*tr.a+tr.e,r:(left+m.width)*tr.a+tr.e,t:(y-m.actualBoundingBoxAscent)*tr.d+tr.f,b:(y+m.actualBoundingBoxDescent)*tr.d+tr.f});return original.call(this,s,x,y,...a);};},tl);
  await p.goto(pathToFileURL(path.join(root,item.id+'.html')).href);await p.evaluate(()=>document.fonts.ready);
  const errors=[];let frames=0;
  for(let i=0;i<Math.round(tl.total*30);i+=45){
   const time=i/30;const xs=await p.evaluate(t=>{window.texts=[];renderAt(t);return window.texts;},time);frames++;
   for(const x of xs)if(x.size<32||x.l<-1||x.r>1281||x.t<0||x.b>721)errors.push({time,reason:'小文字・はみ出し',text:x});
   for(let a=0;a<xs.length;a++)for(let b=a+1;b<xs.length;b++){const x=xs[a],y=xs[b];if(Math.min(x.r,y.r)-Math.max(x.l,y.l)>5&&Math.min(x.b,y.b)-Math.max(x.t,y.t)>5)errors.push({time,reason:'文字の重なり',texts:[x.s,y.s]});}
  }
  fs.writeFileSync(path.join(item.shots,'実時間の配置点検.json'),JSON.stringify({id:item.id,sha256:item.sha256,frames,errors},null,2));
  console.log(item.id,frames,'場面',errors.length,'配置の問題');failed ||=errors.length>0;await p.close();
 }
}finally{await browser?.close();}
if(failed)process.exitCode=1;
