// Capture one visible public textbook image, never a screen, page, file,
// camera, note overlay or closed answer. No upload happens in this module.
(function(root){
'use strict';
const HASH=/^[a-f0-9]{64}$/,asset=/^\/textbook-book-[a-z0-9-]+\.(svg|jpg|png)$/;
const fail=()=>{throw Error('figure_unavailable');};
function selected(app,anchor,signature,current){
 if(typeof current!=='function'||!current()||!app?.isConnected||!HASH.test(anchor)||!HASH.test(signature))fail();
 const found=[...app.querySelectorAll('[data-annotation-anchor]')].filter(n=>n.dataset.annotationAnchor===anchor);
 if(found.length!==1)fail();const figure=found[0],page=figure.closest('.tb-page');
 if(figure.tagName!=='FIGURE'||!page||!app.contains(page)||figure.closest('.tb-measure,[hidden],[aria-hidden="true"]')||figure.querySelector('video,canvas,input,textarea'))fail();
 for(let n=figure;n&&n!==app.parentElement;n=n.parentElement){const style=getComputedStyle(n);if(style.display==='none'||style.visibility!=='visible'||Number(style.opacity)===0||style.contentVisibility==='hidden'||style.clipPath!=='none'||style.maskImage&&style.maskImage!=='none'||n.tagName==='DETAILS'&&!n.open)fail();}
 const list=figure.querySelectorAll('img');if(list.length!==1)fail();const image=list[0],src=image.currentSrc||image.src;
 let url;try{url=new URL(src,location.href);}catch(_){fail();}
 if(url.origin!==location.origin||!asset.test(url.pathname)||url.search||url.hash||!image.complete||!image.naturalWidth||!image.naturalHeight||image.naturalWidth*image.naturalHeight>24*1024*1024)fail();
 const r=image.getBoundingClientRect(),p=page.getBoundingClientRect();
 if(r.width<1||r.height<1||r.top<Math.max(0,p.top)-1||r.left<Math.max(0,p.left)-1||r.bottom>Math.min(innerHeight,p.bottom)+1||r.right>Math.min(innerWidth,p.right)+1)fail();
 if(getComputedStyle(image).objectFit==='cover')fail();
 for(let n=figure;n&&n!==app.parentElement;n=n.parentElement){const style=getComputedStyle(n),rect=n.getBoundingClientRect();if(style.overflowY!=='visible'&&(r.top<rect.top-1||r.bottom>rect.bottom+1)||style.overflowX!=='visible'&&(r.left<rect.left-1||r.right>rect.right+1))fail();}
 if(document.elementFromPoint((r.left+r.right)/2,(r.top+r.bottom)/2)!==image)fail();
 return {figure,image,src};
}
async function pixels(app,anchor,signature,{current}={}){
 const {figure,image,src}=selected(app,anchor,signature,current),scale=Math.min(1,1024/Math.max(image.naturalWidth,image.naturalHeight)),width=Math.max(1,Math.round(image.naturalWidth*scale)),height=Math.max(1,Math.round(image.naturalHeight*scale));
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const c=canvas.getContext('2d',{willReadFrequently:true});if(!c)fail();
 c.fillStyle='#fff';c.fillRect(0,0,width,height);try{c.drawImage(image,0,0,width,height);}catch(_){fail();}
 const rgba=c.getImageData(0,0,width,height).data,packed=new Uint8Array(await new Response(new Blob([rgba]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer());
 if(!current()||!figure.isConnected||image.currentSrc&&image.currentSrc!==src)fail();
 if(packed.length>380*1024)throw Error('figure_size');
 const again=selected(app,anchor,signature,current);if(again.image!==image||again.src!==src)fail();
 let data='';for(let at=0;at<packed.length;at+=8192)data+=String.fromCharCode(...packed.subarray(at,at+8192));
 return {width,height,data:btoa(data)};
}
root.NobiTextbookVisionCapture=Object.freeze({pixels});
})(globalThis);
