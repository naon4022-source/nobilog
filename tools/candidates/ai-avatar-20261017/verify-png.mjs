import assert from 'node:assert/strict';
import {deflateSync} from 'node:zlib';
import {canonicalImage} from '../../../cf-worker/src/learning-images.mjs';
const {generatedAvatarPNG}=await import(process.argv.includes('--main')?new URL('../../../cf-worker/src/openai-avatar-png.mjs',import.meta.url):new URL('./png.mjs',import.meta.url));
let checks=0;const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
const reject=async b=>{await assert.rejects(()=>generatedAvatarPNG(b));checks++;};
function crc(b){let n=0xffffffff;for(const v of b){n^=v;for(let i=0;i<8;i++)n=(n>>>1)^((n&1)?0xedb88320:0);}return (n^0xffffffff)>>>0;}
function chunk(name,data=Buffer.alloc(0)){const kind=Buffer.from(name),out=Buffer.alloc(data.length+12);out.writeUInt32BE(data.length);kind.copy(out,4);Buffer.from(data).copy(out,8);out.writeUInt32BE(crc(out.subarray(4,-4)),out.length-4);return out;}
function png({size=2,type=6,rows,extra=[],after=[],interlace=0}){
 const h=Buffer.alloc(13);h.writeUInt32BE(size);h.writeUInt32BE(size,4);h[8]=8;h[9]=type;h[12]=interlace;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',h),...extra,chunk('IDAT',deflateSync(rows)),...after,chunk('IEND')]);
}
const data=Buffer.from([255,0,0,255,0,255,0,255,0,0,255,255,255,255,255,255]);
const expected=await canonicalImage({width:2,height:2,data:deflateSync(data).toString('base64')});
const paeth=(a,b,c)=>{const p=a+b-c,d=[Math.abs(p-a),Math.abs(p-b),Math.abs(p-c)];return d[0]<=d[1]&&d[0]<=d[2]?a:d[1]<=d[2]?b:c;};
for(const type of [2,6])for(let filter=0;filter<5;filter++){
 const bpp=type===6?4:3,pixels=type===6?data:Buffer.from([...data].filter((_,i)=>i%4!==3)),stride=bpp*2,rows=Buffer.alloc((stride+1)*2);
 for(let y=0;y<2;y++){rows[y*(stride+1)]=filter;for(let x=0;x<stride;x++){
  const i=y*stride+x,a=x>=bpp?pixels[i-bpp]:0,b=y?pixels[i-stride]:0,c=y&&x>=bpp?pixels[i-stride-bpp]:0;
  const predict=filter===0?0:filter===1?a:filter===2?b:filter===3?Math.floor((a+b)/2):paeth(a,b,c);
  rows[y*(stride+1)+1+x]=(pixels[i]-predict)&255;
 }}
 const result=await generatedAvatarPNG(png({type,rows,extra:[chunk('tEXt',Buffer.from('metadata\0https://not-retained.invalid'))]}));eq(result.id,expected.id);eq(result.png,expected.png);
}
const rows=Buffer.concat([Buffer.from([0]),data.subarray(0,8),Buffer.from([0]),data.subarray(8)]),valid=png({rows});
const broken=Buffer.from(valid);broken[broken.length-1]^=1;
for(const bad of [Buffer.alloc(0),broken,Buffer.concat([valid,Buffer.from([0])]),valid.subarray(0,-1),png({rows,type:3}),png({rows,interlace:1}),png({rows,extra:[chunk('acTL')]}),png({rows,extra:[chunk('tRNS')]}),png({rows,extra:[chunk('ABCD')]}),png({rows:Buffer.from([5,...rows.subarray(1)])}),png({rows:rows.subarray(0,-1)}),png({rows:Buffer.concat([rows,Buffer.from([0])])}),png({rows:Buffer.alloc(10000)})])await reject(bad);
// More than one full image is never accepted through a second IDAT stream.
await reject(png({rows,after:[chunk('tEXt'),chunk('IDAT',deflateSync(rows))]}));
// 512px checkerboard becomes a bounded 384px canonical PNG, not a URL or SVG.
const largeRows=Buffer.alloc(512*(512*4+1));for(let y=0;y<512;y++)for(let x=0;x<512;x++){const i=y*(512*4+1)+1+x*4;largeRows[i]=(x+y)%2?255:0;largeRows[i+3]=255;}
const reduced=await generatedAvatarPNG(png({size:512,rows:largeRows}));eq(reduced.width,384);eq(reduced.height,384);eq(reduced.bytes<=400*1024,true);eq(/^[a-f0-9]{64}$/.test(reduced.id),true);
console.log('Generated avatar PNG candidate: '+checks+' checks passed; RGB/RGBA filters, metadata removal, CRC/limits/animation rejection, smooth bounded downsample; no provider or learner data');
