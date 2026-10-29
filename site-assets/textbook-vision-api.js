(function(root){
'use strict';
const HASH=/^[a-f0-9]{64}$/;
function extend(base,request){
 if(!base||typeof base.matches!=='function'||typeof request!=='function')throw Error('vision_unavailable');
 const call=async(path,options,owner)=>{if(!base.available()||!base.matches(owner))throw Error('account_changed');const result=await request(path,options,owner);if(!base.matches(owner))throw Error('account_changed');return result;};
 return Object.freeze({...base,
  visionSource:(selection,owner)=>call('/textbook-ai-vision-context?'+new URLSearchParams(selection),{},owner),
  visionHistory:(selection,owner)=>call('/textbook-ai-vision?'+new URLSearchParams(selection),{},owner),
  visionPost:(body,owner)=>call('/textbook-ai-vision',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)},owner),
  async uploadFigure(reference,pixels,owner){
   const {book,anchor,annotationSignature,contextSha256}=reference;
   const result=await call('/textbook-ai/images',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({book,anchor,annotationSignature,contextSha256,pixels})},owner),item=result?.item;
   if(!item||!HASH.test(item.id||'')||item.width!==pixels.width||item.height!==pixels.height||!Number.isSafeInteger(item.bytes)||item.bytes<57||item.bytes>409600)throw Error('image_unavailable');return item;
  }
 });
}
root.NobiTextbookVisionAPI=Object.freeze({extend});
})(globalThis);
