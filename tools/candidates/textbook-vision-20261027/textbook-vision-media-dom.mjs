// Separate image consultation identities. Marker/note attributes are untouched.
// Only accept a catalog returned by checkedMediaCatalog; caller owns source load.
import {isCheckedMediaCatalog} from './textbook-vision-media-context.mjs';
export function attachMediaIdentities(app,catalog,{current}={}){
 if(typeof current!=='function'||!current()||!app?.isConnected||!isCheckedMediaCatalog(catalog))throw Error('figure_unavailable');
 const bySource=new Map(catalog.contexts.map(r=>[r.src,r])),found=new Map();
 for(const figure of app.querySelectorAll('.tb-page figure.tb-media')){
  if(figure.closest('.tb-measure,[hidden],[aria-hidden="true"],details')||figure.hasAttribute('data-annotation-anchor')||figure.querySelector('video,canvas,input,textarea'))continue;
  const list=figure.querySelectorAll('img');if(list.length!==1)continue;
  let url;try{url=new URL(list[0].currentSrc||list[0].src,location.href);}catch(_){continue;}
  if(url.origin!==location.origin||url.search||url.hash||!bySource.has(url.pathname))continue;
  const nodes=found.get(url.pathname)||[];nodes.push(figure);found.set(url.pathname,nodes);
 }
 // Clear only this supplement's attributes; never alter original annotations.
 for(const n of app.querySelectorAll('[data-vision-anchor]')){delete n.dataset.visionAnchor;delete n.dataset.visionQuote;delete n.dataset.visionContextSha256;}
 let count=0;
 for(const [src,nodes]of found){
  if(nodes.length!==1)continue;const row=bySource.get(src),n=nodes[0];
  if(!current())throw Error('account_changed');
  n.dataset.visionAnchor=row.anchor;n.dataset.visionQuote=row.quote;count++;
 }
 return count;
}
