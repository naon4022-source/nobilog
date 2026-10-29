import {ownImages} from '../../../cf-worker/src/learning-images.mjs';
import {requestBody,reserveMicroYen} from './openai-policy.mjs';
const UID=/^(u[12]|p_(free|mini|standard|pro|unlimit))$/;
const ID=/^[a-f0-9]{64}$/;
function crc(bytes){let c=0xffffffff;for(const b of bytes){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;}
function validSavedImage(image,id){
 if(!image||Object.keys(image).sort().join(',')!=='bytes,height,id,png,width'||image.id!==id||!ID.test(image.id)||!Number.isSafeInteger(image.width)||!Number.isSafeInteger(image.height)||image.width<1||image.height<1||image.width>1024||image.height>1024||!Number.isSafeInteger(image.bytes)||image.bytes<57||image.bytes>409600||typeof image.png!=='string'||image.png.length>560000||image.png.length%4||!/^[A-Za-z0-9+/]*={0,2}$/.test(image.png))throw Error('invalid_saved_image');
 const bytes=Uint8Array.from(atob(image.png),c=>c.charCodeAt(0));
 if(bytes.length!==image.bytes||![137,80,78,71,13,10,26,10].every((x,i)=>bytes[i]===x))throw Error('invalid_saved_image');
 const view=new DataView(bytes.buffer);let at=8;
 // Only the canonical upload writer's three chunks are accepted. No EXIF,
 // comments, profiles, animations or additional chunks reach the provider.
 for(const [name,size] of [['IHDR',13],['IDAT',bytes.length-57],['IEND',0]]){
  if(at+12>bytes.length||view.getUint32(at)!==size||String.fromCharCode(...bytes.subarray(at+4,at+8))!==name||at+size+12>bytes.length||view.getUint32(at+size+8)!==crc(bytes.subarray(at+4,at+size+8)))throw Error('invalid_saved_image');
  if(name==='IHDR'&&(view.getUint32(at+8)!==image.width||view.getUint32(at+12)!==image.height||bytes[at+16]!==8||bytes[at+17]!==6||bytes[at+18]!==0||bytes[at+19]!==0||bytes[at+20]!==0))throw Error('invalid_saved_image');
  at+=size+12;
 }
 if(at!==bytes.length)throw Error('invalid_saved_image');
 return {type:'input_image',detail:'high',image_url:'data:image/png;base64,'+image.png};
}
export async function ownedVisionInput(db,uid,ids){
 if(!UID.test(uid)||!Array.isArray(ids)||!ids.length||!await ownImages(db,uid,ids))throw Error('invalid_images');
 const parts=[];
 for(const id of ids){
  const raw=await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind('learning-image:'+uid+':'+id).first('v');
  if(typeof raw!=='string'||raw.length>561000)throw Error('invalid_saved_image');
  parts.push(validSavedImage(JSON.parse(raw),id));
 }
 return parts;
}
export async function prepareVision(db,uid,plan,content,ids){
 // Existing authenticated plan policy selects Sol for image analysis in Pro
 // and UNLIMIT. No caller-provided model, URL or detail is used.
 const policy=requestBody(plan,'image-analysis',content),images=await ownedVisionInput(db,uid,ids);
 const body={...policy.body,input:[{role:'user',content:[{type:'input_text',text:content.input},...images]}]};
 return {body,countBody:{model:body.model,instructions:body.instructions,input:body.input,text:body.text},imageCount:images.length};
}
export function countedVision(prepared,count){
 // The official exact input-token endpoint includes multimodal framing. Do
 // not guess a GPT-6 image multiplier when it isn't specified in the docs.
 if(!count||count.object!=='response.input_tokens'||!Number.isSafeInteger(count.input_tokens)||count.input_tokens<1||count.input_tokens>31936)throw Error('invalid_image_token_count');
 const inputUpperBound=count.input_tokens+64;
 return {body:structuredClone(prepared.body),inputUpperBound,reservation:reserveMicroYen(prepared.body.model,inputUpperBound,prepared.body.max_output_tokens)};
}
