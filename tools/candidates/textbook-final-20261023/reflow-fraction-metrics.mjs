// Measure actual inherited SVG fonts in place; preserve glyphs, baselines and drawing geometry.
export async function reflowFractionMetrics(page,current,original,onlyRows=null){
 await page.setContent('<style>body{margin:0}svg{display:block;width:1600px;height:900px}</style>'+current);
 return page.evaluate(async({original,onlyRows})=>{
  await document.fonts.ready;
  const svg=document.querySelector('svg'),raw=new DOMParser().parseFromString(original,'image/svg+xml'),changes=[];
  if(raw.querySelector('parsererror'))throw Error('invalid original SVG');
  const geometry=()=>[...svg.querySelectorAll('path,line,rect,circle,ellipse,polygon,polyline')].filter(n=>!n.closest('[data-stacked-fraction]')).map(n=>n.outerHTML);
  const oldGeometry=geometry(),oldTexts=[...svg.querySelectorAll('text')].map(n=>n.textContent);
  const box=n=>{const b=n.getBBox();return{x:b.x,y:b.y,width:b.width,height:b.height,right:b.x+b.width,bottom:b.y+b.height};};
  const union=bs=>({x:Math.min(...bs.map(b=>b.x)),y:Math.min(...bs.map(b=>b.y)),right:Math.max(...bs.map(b=>b.right)),bottom:Math.max(...bs.map(b=>b.bottom))});
  for(const group of svg.querySelectorAll('[data-stacked-fraction]')){
   const text=group.getAttribute('data-stacked-fraction');if(onlyRows&&!onlyRows.includes(text))continue;
   const matches=[...raw.querySelectorAll('text')].filter(n=>n.textContent===text);if(matches.length!==1)throw Error('ambiguous original text anchor: '+text);
   const source=matches[0],x=Number(source.getAttribute('x'));if(!Number.isFinite(x))throw Error('invalid original anchor');
   let anchor=source.getAttribute('text-anchor');for(let p=source.parentElement;!anchor&&p;p=p.parentElement)anchor=p.getAttribute('text-anchor');anchor=anchor||'start';if(!['start','middle','end'].includes(anchor))throw Error('unknown original alignment');
   const oldBox=box(group),font=Number.parseFloat(getComputedStyle(group).fontSize),pad=Math.max(3,font*.18),gap=Math.max(2,font*.08);
   group.style.whiteSpace='pre';const nodes=[...group.children].filter(n=>n.tagName!=='title'),parts=[];
   for(const n of nodes)if(n.tagName==='text')n.style.whiteSpace='pre';
   for(let i=0;i<nodes.length;){
    if(nodes[i].tagName==='text'&&nodes[i+1]?.tagName==='line'&&nodes[i+2]?.tagName==='text'){
     const top=nodes[i],bar=nodes[i+1],bottom=nodes[i+2],a=box(top),b=box(bottom);
     parts.push({type:'fraction',top,bar,bottom,width:Math.max(a.width,b.width)+2*pad,topOffset:a.x+a.width/2-Number(top.getAttribute('x')),bottomOffset:b.x+b.width/2-Number(bottom.getAttribute('x'))});i+=3;
    }else if(nodes[i].tagName==='text'){
     const node=nodes[i],b=box(node),left=b.x-Number(node.getAttribute('x')),advance=node.getComputedTextLength();
     parts.push({type:'plain',node,width:Math.max(advance,left+b.width)-Math.min(0,left),left:Math.min(0,left)});i++;
    }else throw Error('unknown fraction fragment structure');
   }
   const width=parts.reduce((n,p)=>n+p.width,0)+gap*(parts.length-1);let cursor=x-(anchor==='middle'?width/2:anchor==='end'?width:0);
   for(const part of parts){
    if(part.type==='plain')part.node.setAttribute('x',cursor-part.left);
    else{
     const centre=cursor+part.width/2;part.top.setAttribute('x',centre-part.topOffset);part.bottom.setAttribute('x',centre-part.bottomOffset);
     part.bar.setAttribute('x1',cursor+pad*.25);part.bar.setAttribute('x2',cursor+part.width-pad*.25);
     const a=box(part.top),b=box(part.bottom),barY=Number(part.bar.getAttribute('y1'));
     if(a.bottom>barY-3||b.y<barY+3)throw Error('vertical fraction clearance changed');
     if(Math.min(a.x,b.x)<Number(part.bar.getAttribute('x1'))-1||Math.max(a.right,b.right)>Number(part.bar.getAttribute('x2'))+1)throw Error('fraction bar does not span actual glyphs');
    }
    cursor+=part.width+gap;
   }
   const newBox=box(group),vb=svg.viewBox.baseVal;if(newBox.x<vb.x-1||newBox.y<vb.y-1||newBox.right>vb.x+vb.width+1||newBox.bottom>vb.y+vb.height+1)throw Error('corrected row leaves SVG');
   const bounds=parts.map(p=>p.type==='plain'?box(p.node):union([box(p.top),box(p.bar),box(p.bottom)]));
   for(let i=1;i<bounds.length;i++)if(bounds[i-1].right>bounds[i].x+1)throw Error('corrected fragments still overlap');
   changes.push({text,oldBox,newBox,originalX:x,originalAnchor:anchor,fontFamily:getComputedStyle(group).fontFamily,fragmentCount:parts.length});
  }
  if(JSON.stringify(geometry())!==JSON.stringify(oldGeometry))throw Error('original drawing geometry changed');
  if(JSON.stringify([...svg.querySelectorAll('text')].map(n=>n.textContent))!==JSON.stringify(oldTexts))throw Error('any displayed glyph string changed');
  return {svg:new XMLSerializer().serializeToString(svg),changes};
 },{original,onlyRows});
}
