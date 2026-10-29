'use strict';
// 計測候補。実利用者・通信・保存には接続しない。
function create({idleMs=180000,maxGapMs=5000}={}){
 if(!Number.isSafeInteger(idleMs)||idleMs<1000||!Number.isSafeInteger(maxGapMs)||maxGapMs<1)throw Error('invalid clock settings');
 let previous=null,touched=null,owner=null,activity=null,visible=false,focused=false,total=0;
 const segments=[];
 function collect(at){
  if(!Number.isFinite(at)||at<0)throw Error('invalid monotonic time');
  if(previous!==null&&at<previous)throw Error('clock moved backwards');
  if(previous!==null&&owner&&activity&&visible&&focused&&touched!==null){
   const end=Math.min(at,touched+idleMs),delta=end-previous;
   if(at-previous<=maxGapMs&&delta>0){
    total+=delta;const last=segments.at(-1);
    if(last&&last.owner===owner&&last.activity===activity&&last.end===previous)last.end=end;
    else segments.push({owner,activity,start:previous,end});
   }
  }
  previous=at;
 }
 function update(at,next={}){
  if(next.owner!==undefined&&(next.owner!==null&&(typeof next.owner!=='string'||!next.owner||next.owner.length>100)))throw Error('invalid owner');
  if(next.activity!==undefined&&(next.activity!==null&&(typeof next.activity!=='string'||!next.activity||next.activity.length>160)))throw Error('invalid activity');
  for(const k of ['visible','focused','touch'])if(next[k]!==undefined&&typeof next[k]!=='boolean')throw Error('invalid flag');
  collect(at);
  // 呼出側は旧本人の未送信分を退避してから切替える。新本人へ持ち越さない。
  if(next.owner!==undefined&&next.owner!==owner){owner=next.owner;activity=null;touched=null;visible=false;focused=false;total=0;segments.length=0;}
  if(next.activity!==undefined&&next.activity!==activity){activity=next.activity;touched=at;}
  if(next.visible!==undefined)visible=next.visible;
  if(next.focused!==undefined)focused=next.focused;
  if(next.touch)touched=at;
 }
 return Object.freeze({update,tick:collect,snapshot(){return {total,segments:segments.map(s=>({...s}))};},pending(uid){return uid===owner?segments.map(s=>({activity:s.activity,start:s.start,end:s.end})):[];}});
}
module.exports={create};
