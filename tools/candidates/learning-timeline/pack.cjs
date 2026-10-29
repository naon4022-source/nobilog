'use strict';
// 計測の連続区間を保存APIの最大5秒区間に分割。送信IDは呼出側の永続キューで固定する。
function pack(segments,{uid,origin,maxOffset=4*3600000}){
 if(!Array.isArray(segments)||typeof uid!=='string'||!uid||!Number.isFinite(origin)||origin<0)throw Error('bad packing context');
 const spans=[];let previous=null;
 for(const s of segments){
  if(s.owner!==uid)throw Error('different owner');
  const start=Math.floor(s.start-origin),end=Math.floor(s.end-origin);
  if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||end<=start||end>maxOffset||(previous!==null&&start<previous)||typeof s.activity!=='string')throw Error('bad segment');
  for(let at=start;at<end;at+=5000)spans.push({activity:s.activity,startOffset:at,endOffset:Math.min(end,at+5000)});
  previous=end;
 }
 const batches=[];for(let i=0;i<spans.length;i+=60)batches.push(spans.slice(i,i+60));return batches;
}
module.exports={pack};
