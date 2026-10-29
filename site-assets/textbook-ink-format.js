// Bounded vector handwriting; no HTML, executable content, credentials or grades.
(function(root){
'use strict';
const BOOKS=Object.freeze(['math1','kokugo1','english1','science1','geography','history']);
const COLORS=Object.freeze(['#172b3a','#c63235','#1765aa','#267a45','#7544a1']);
const MAX_POINTS=12000,MAX_STROKES=512,MAX_BYTES=300000;
const plain=(s,n)=>typeof s==='string'&&s.length<=n&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(s);
const int=(n,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
const keys=(v,want)=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join(',')===want;
const anchor=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
function background(b,book){return b===null||(keys(b,'sha256,src')&&anchor(b.sha256)&&typeof b.src==='string'&&new RegExp('^/textbook-book-'+book+'-[a-z0-9-]+\\.(?:svg|png|jpg|webp)$').test(b.src));}
function documentValid(d,book){
 if(!BOOKS.includes(book)||!keys(d,'background,height,strokes,version,width')||d.version!==1||!int(d.width,128,2000)||!int(d.height,128,2000)||!background(d.background,book)||!Array.isArray(d.strokes)||d.strokes.length>MAX_STROKES)return false;
 let points=0;
 for(const s of d.strokes){
  if(!keys(s,'color,points,size,tool')||!['pen','eraser'].includes(s.tool)||!COLORS.includes(s.color)||!int(s.size,1,32)||!Array.isArray(s.points)||!s.points.length)return false;
  points+=s.points.length;if(points>MAX_POINTS)return false;
  for(const p of s.points)if(!Array.isArray(p)||p.length!==3||!int(p[0],0,10000)||!int(p[1],0,10000)||!int(p[2],1,1024))return false;
 }
 return new TextEncoder().encode(JSON.stringify(d)).byteLength<=MAX_BYTES;
}
function draftValid(v,book){return keys(v,'anchor,book,doc,quote,revision')&&v.book===book&&anchor(v.anchor)&&plain(v.quote,2000)&&!!v.quote.trim()&&int(v.revision,0,999999998)&&documentValid(v.doc,book);}
function rowValid(v,book){return keys(v,'anchor,book,doc,quote,revision,updatedAt')&&draftValid({book:v.book,anchor:v.anchor,quote:v.quote,revision:v.revision-1,doc:v.doc},book)&&int(v.revision,1,999999999)&&int(v.updatedAt,0,Number.MAX_SAFE_INTEGER);}
const api=Object.freeze({BOOKS,COLORS,MAX_POINTS,MAX_STROKES,MAX_BYTES,plain,anchor,documentValid,draftValid,rowValid,empty:()=>({version:1,width:1000,height:700,background:null,strokes:[]})});
if(typeof module==='object'&&module.exports)module.exports=api;else root.NobiTextbookInkFormat=api;
})(globalThis);
