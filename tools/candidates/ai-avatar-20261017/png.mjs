// Server-side candidate: turn a generated PNG into the existing private-avatar
// format. No provider access or learner data. Reject unsupported PNG encodings.
import {canonicalImage} from '../../../cf-worker/src/learning-images.mjs';
const signature=[137,80,78,71,13,10,26,10];
function crc(bytes){let n=0xffffffff;for(const b of bytes){n^=b;for(let i=0;i<8;i++)n=(n>>>1)^((n&1)?0xedb88320:0);}return (n^0xffffffff)>>>0;}
async function bounded(stream,max){
 const reader=stream.getReader(),parts=[];let size=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw Error('png_limit');}parts.push(value);}}finally{reader.releaseLock();}
 const out=new Uint8Array(size);let at=0;for(const p of parts){out.set(p,at);at+=p.length;}return out;
}
function paeth(a,b,c){const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;}
export async function generatedAvatarPNG(bytes){
 if(!(bytes instanceof Uint8Array)||bytes.length<57||bytes.length>4*1024*1024||signature.some((v,i)=>bytes[i]!==v))throw Error('invalid_png');
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),chunks=[];
 let at=8,width=0,height=0,bpp=0,ended=false,dataEnded=false,dataLength=0;
 while(at<bytes.length){
  if(at+12>bytes.length)throw Error('invalid_png');
  const length=view.getUint32(at);if(length>bytes.length-at-12)throw Error('invalid_png');
  const kind=String.fromCharCode(...bytes.subarray(at+4,at+8)),end=at+8+length;
  if(!/^[A-Za-z]{4}$/.test(kind)||crc(bytes.subarray(at+4,end))!==view.getUint32(end))throw Error('invalid_png');
  const data=bytes.subarray(at+8,end);
  if(at===8&&kind!=='IHDR')throw Error('invalid_png');
  if(kind==='IHDR'){
   if(at!==8||length!==13)throw Error('invalid_png');
   width=view.getUint32(at+8);height=view.getUint32(at+12);
   if(width!==height||width<1||width>1024||data[8]!==8||![2,6].includes(data[9])||data[10]||data[11]||data[12])throw Error('unsupported_png');
   bpp=data[9]===6?4:3;
  }else if(kind==='IDAT'){
   if(dataEnded)throw Error('invalid_png');dataLength+=length;if(dataLength>4*1024*1024)throw Error('png_limit');chunks.push(data);
  }else if(kind==='IEND'){
   if(length||!chunks.length||end+4!==bytes.length)throw Error('invalid_png');ended=true;break;
  }else{
   // Animation, unknown critical chunks and RGB transparency are deliberately
   // unsupported. Ancillary metadata never enters the canonical result.
   if(['acTL','fcTL','fdAT','tRNS'].includes(kind)||kind[0]===kind[0].toUpperCase())throw Error('unsupported_png');
   if(chunks.length)dataEnded=true;
  }
  at=end+4;
 }
 if(!ended)throw Error('invalid_png');
 const packed=new Uint8Array(dataLength);at=0;for(const c of chunks){packed.set(c,at);at+=c.length;}
 const stride=width*bpp,expected=(stride+1)*height;
 const raw=await bounded(new Blob([packed]).stream().pipeThrough(new DecompressionStream('deflate')),expected);
 if(raw.length!==expected)throw Error('invalid_png');
 const pixels=new Uint8Array(stride*height);
 for(let y=0;y<height;y++){
  const filter=raw[y*(stride+1)];if(filter>4)throw Error('invalid_png');
  for(let x=0;x<stride;x++){
   const index=y*stride+x,a=x>=bpp?pixels[index-bpp]:0,b=y?pixels[index-stride]:0,c=y&&x>=bpp?pixels[index-stride-bpp]:0;
   const predict=filter===0?0:filter===1?a:filter===2?b:filter===3?Math.floor((a+b)/2):paeth(a,b,c);
   pixels[index]=(raw[y*(stride+1)+1+x]+predict)&255;
  }
 }
 const size=Math.min(width,384),rgba=new Uint8Array(size*size*4);
 // Area averaging keeps thin lines smooth when the provider's 1024px image is
 // reduced to the avatar size, instead of dropping pixels by nearest-neighbor.
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const left=x*width/size,right=(x+1)*width/size,top=y*height/size,bottom=(y+1)*height/size;
  let alpha=0,red=0,green=0,blue=0,total=0;
  for(let sy=Math.floor(top);sy<Math.ceil(bottom);sy++)for(let sx=Math.floor(left);sx<Math.ceil(right);sx++){
   const weight=(Math.min(right,sx+1)-Math.max(left,sx))*(Math.min(bottom,sy+1)-Math.max(top,sy)),i=(sy*width+sx)*bpp,a=bpp===4?pixels[i+3]/255:1;
   total+=weight;alpha+=a*weight;red+=pixels[i]*a*weight;green+=pixels[i+1]*a*weight;blue+=pixels[i+2]*a*weight;
  }
  const i=(y*size+x)*4;rgba[i]=alpha?Math.round(red/alpha):0;rgba[i+1]=alpha?Math.round(green/alpha):0;rgba[i+2]=alpha?Math.round(blue/alpha):0;rgba[i+3]=Math.round(alpha/total*255);
 }
 const packedRGBA=await bounded(new Blob([rgba]).stream().pipeThrough(new CompressionStream('deflate')),400*1024);
 let binary='';for(let i=0;i<packedRGBA.length;i+=8192)binary+=String.fromCharCode(...packedRGBA.subarray(i,i+8192));
 return canonicalImage({width:size,height:size,data:btoa(binary)});
}
