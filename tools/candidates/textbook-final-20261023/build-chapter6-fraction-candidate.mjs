// Offline native-SVG typesetting; mathematical strings are retained as accessible labels.
import assert from 'node:assert/strict';
import {reflowFractionMetrics} from './reflow-fraction-metrics.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=new URL('../../../',import.meta.url),output=new URL('./chapter6-fraction-candidate/',import.meta.url);
const names=["M1-C6-S2-D01", "M1-C6-S2-DMAP", "M1-C6-REVIEW-E01"];
const requested=process.argv[2];assert(!requested||names.includes(requested),'known target ID only');
const sha=s=>createHash('sha256').update(s).digest('hex');
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true}),results=requested?JSON.parse(await readFile(new URL('manifest.json',output),'utf8')).items.filter(x=>x.id!==requested):[];
try{
 const page=await browser.newPage({viewport:{width:1600,height:900}});
 await page.route('**/*',route=>route.abort());
 for(const id of names.filter(id=>!requested||id===requested)){
  const name='textbook-book-math1-'+id.toLowerCase()+'.svg';
  const original=await readFile(new URL('site-assets/'+name,root),'utf8');
  await page.setContent('<style>body{margin:0}svg{display:block;width:1600px;height:900px}</style>'+original);
  let result=await page.evaluate(async()=>{
   await document.fonts.ready;
   const svg=document.querySelector('svg'),ns='http://www.w3.org/2000/svg',changes=[],contrastChanges=[];
   const make=(tag,attrs,text)=>{const node=document.createElementNS(ns,tag);for(const [key,value]of Object.entries(attrs))node.setAttribute(key,String(value));if(text!==undefined)node.textContent=text;return node;};
   const signature=()=>[...svg.querySelectorAll('path,line,rect,circle,ellipse,polygon,polyline')].filter(n=>!n.closest('[data-stacked-fraction]')).map(n=>n.outerHTML);
   const geometryBefore=signature();
   for(const node of [...svg.querySelectorAll('text')]){
    const text=node.textContent;
    if(node.children.length)continue;
    const style=getComputedStyle(node),muted=false;
    if(muted){contrastChanges.push({text,before:style.fill,after:'#52657b'});node.setAttribute('fill','#52657b');}
    const approvedRows={"球は ちょうど入る円柱の ⅔": [["⅔", "2", "3"]], "円柱 2πr³ の ⅔ ＝ ⁴⁄₃πr³": [["⅔", "2", "3"], ["⁴⁄₃", "4", "3"]], "V ＝ ⅓Sh": [["⅓", "1", "3"]], "V ＝ ⁴⁄₃πr³": [["⁴⁄₃", "4", "3"]]};
    const approvedParts=approvedRows[text];if(!approvedParts)continue;
    const originalFont=Number.parseFloat(style.fontSize),header=text==='球は ちょうど入る円柱の ⅔'&&Number(node.getAttribute('y'))===84,compact=false,font=header?40:compact?36:originalFont,x=Number(node.getAttribute('x')),originalY=Number(node.getAttribute('y')),y=originalY-(header?5:compact?6:0);
    if(!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(font))throw Error('unsupported text coordinates');
    const metrics=(value,size=font)=>{const copy=node.cloneNode(false);copy.textContent=value;copy.setAttribute('x',0);copy.setAttribute('y',0);copy.setAttribute('font-size',size);copy.style.fontSize=size+'px';copy.style.fontFamily=style.fontFamily;copy.style.fontWeight=style.fontWeight;copy.style.whiteSpace='pre';node.parentElement.append(copy);const box=copy.getBBox(),width=copy.getComputedTextLength();copy.remove();return {width,top:box.y,bottom:box.y+box.height};};
    const measure=(value,size=font)=>metrics(value,size).width;
    const parts=[];let at=0;
    for(const approved of approvedParts){
     const match={0:approved[0],index:text.indexOf(approved[0],at)};if(match.index<at)throw Error("missing approved fraction token");
     if(match.index>at){const value=text.slice(at,match.index);parts.push({text:value,width:measure(value)});}
     const [,numerator,denominator]=approved,size=font*.74;
     const numeratorMetrics=metrics(numerator,size),denominatorMetrics=metrics(denominator,size);
     parts.push({numerator,denominator,size,numeratorMetrics,denominatorMetrics,width:Math.max(numeratorMetrics.width,denominatorMetrics.width)+font*.36});at=match.index+match[0].length;
    }
    if(at<text.length){const value=text.slice(at);parts.push({text:value,width:measure(value)});}
    // Adjacent parentheses must enclose the whole stacked fraction.
    const expanded=[];
    const parenthesis=value=>{const size=font*1.6,m=metrics(value,size);return {text:value,size,baseline:y-font*.25-(m.top+m.bottom)/2,width:m.width+font*.08};};
    const plain=value=>{if(value)expanded.push({text:value,width:measure(value)});};
    for(let i=0;i<parts.length;i++){
     const part=parts[i];if(part.text===undefined){expanded.push(part);continue;}
     let value=part.text;
     if(value.startsWith(')')&&parts[i-1]?.numerator!==undefined){expanded.push(parenthesis(')'));value=value.slice(1);}
     if(value.endsWith('(')&&parts[i+1]?.numerator!==undefined){plain(value.slice(0,-1));expanded.push(parenthesis('('));}else plain(value);
    }
    const width=expanded.reduce((sum,p)=>sum+p.width,0),anchor=node.getAttribute('text-anchor')||style.textAnchor;
    const start=x-(anchor==='middle'?width/2:anchor==='end'?width:0),group=make('g',{'data-stacked-fraction':text,'aria-label':text,role:'img'});
    for(const a of node.attributes)if(!['x','y','text-anchor'].includes(a.name))group.setAttribute(a.name,a.value);
    // Explicit start anchor prevents a parent middle/end anchor from shifting individual fragments.
    group.setAttribute('text-anchor','start');group.append(make('title',{},text));let cursor=start;
    for(const part of expanded){
     if(part.text!==undefined)group.append(make('text',{x:cursor,y:part.baseline??y,'font-size':part.size??font,'text-anchor':'start'},part.text));
     else{
      const center=cursor+part.width/2,bar=y-font*.25,gap=Math.max(4,font*.12);
      group.append(make('text',{x:center,y:bar-gap-part.numeratorMetrics.bottom,'font-size':part.size,'text-anchor':'middle'},part.numerator));
      group.append(make('line',{x1:cursor+font*.12,x2:cursor+part.width-font*.12,y1:bar,y2:bar,stroke:style.fill,'stroke-width':Math.max(1.5,font*.045)}));
      group.append(make('text',{x:center,y:bar+gap-part.denominatorMetrics.top,'font-size':part.size,'text-anchor':'middle'},part.denominator));
     }
     cursor+=part.width;
    }
    const oldBox=node.getBBox();node.replaceWith(group);const box=group.getBBox(),view=svg.viewBox.baseVal;
    for(const bar of group.querySelectorAll(':scope > line')){
     const above=bar.previousElementSibling.getBBox(),below=bar.nextElementSibling.getBBox(),barY=Number(bar.getAttribute('y1'));
     if(above.y+above.height>barY-3||below.y<barY+3)throw Error('fraction glyph overlaps its bar');
    }
    if(box.x<view.x-1||box.y<view.y-1||box.x+box.width>view.x+view.width+1||box.y+box.height>view.y+view.height+1)throw Error('fraction outside SVG');
    changes.push({original:text,baselineShift:y-originalY,originalBox:{x:oldBox.x,y:oldBox.y,width:oldBox.width,height:oldBox.height},newBox:{x:box.x,y:box.y,width:box.width,height:box.height},fractions:parts.filter(p=>p.numerator!==undefined).map(p=>({numerator:p.numerator,denominator:p.denominator}))});
   }
   if(JSON.stringify(signature())!==JSON.stringify(geometryBefore))throw Error('original diagram geometry changed');
   return {svg:new XMLSerializer().serializeToString(svg),changes,contrastChanges};
  });
  assert.equal(result.changes.length,2,id+' fraction replacements');
  const metric=await reflowFractionMetrics(page,result.svg,original);result.svg=metric.svg;result.metricChanges=metric.changes;
  for(const change of result.changes)change.newBox=metric.changes.find(x=>x.text===change.original).newBox;
  const candidate=new URL(name,output);await writeFile(candidate,result.svg+'\n');
  await page.screenshot({path:new URL(id+'.png',output).pathname});
  results.push({id,file:name,beforeSha256:sha(original),afterSha256:sha(result.svg+'\n'),changes:result.changes,metricChanges:result.metricChanges,contrastChanges:result.contrastChanges,originalNonTextGeometryPreserved:true,status:'candidate; visual/overlap/source integration pending'});
 }
 await writeFile(new URL('manifest.json',output),JSON.stringify({status:'candidate only; not integrated',items:results},null,2)+'\n');
 console.log('Native SVG fraction candidates: '+results.length+' diagrams, '+results.reduce((n,r)=>n+r.changes.length,0)+' text rows; exact numerators/denominators, original strings and non-text geometry retained. Not integrated.');
}finally{await browser.close();}
