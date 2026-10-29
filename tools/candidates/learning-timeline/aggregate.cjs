'use strict';
// サーバーで本人・時刻・教材を確認した保存済み区間だけを集計する候補。
// この関数は認可や端末時刻の信頼性を代替しない。実APIには未接続。
const SUBJECTS=['数学','英語','国語','理科','社会'],DAY=86400000,JST=9*3600000;
function aggregate(records,{maxRecords=10000}={}){
 if(!Number.isSafeInteger(maxRecords)||maxRecords<1||maxRecords>6000000||!Array.isArray(records)||records.length>maxRecords)throw Error('invalid records');
 const unique=new Map();
 for(const r of records){
  if(!r||typeof r.id!=='string'||!r.id||r.id.length>100||!SUBJECTS.includes(r.subject))throw Error('invalid record');
  if(![r.start,r.end,r.acceptedAt].every(Number.isSafeInteger)||r.start<0||r.end<=r.start||r.end-r.start>4*3600000||r.acceptedAt<r.end)throw Error('invalid interval');
  const clean={id:r.id,subject:r.subject,start:r.start,end:r.end,acceptedAt:r.acceptedAt},old=unique.get(r.id);
  if(old&&JSON.stringify(old)!==JSON.stringify(clean))throw Error('conflicting duplicate');
  unique.set(r.id,clean);
 }
 const events=new Map(),days={},heap=[],active=new Set();
 const better=(a,b)=>a.acceptedAt>b.acceptedAt||(a.acceptedAt===b.acceptedAt&&a.id<b.id);
 function push(r){heap.push(r);let i=heap.length-1;while(i>0){const parent=(i-1)>>1;if(!better(heap[i],heap[parent]))break;[heap[i],heap[parent]]=[heap[parent],heap[i]];i=parent;}}
 function pop(){const last=heap.pop();if(!heap.length)return;heap[0]=last;let i=0;for(;;){let best=i;for(const child of [2*i+1,2*i+2])if(child<heap.length&&better(heap[child],heap[best]))best=child;if(best===i)break;[heap[i],heap[best]]=[heap[best],heap[i]];i=best;}}
 for(const r of unique.values()){for(const [at,kind] of [[r.start,'start'],[r.end,'end']]){if(!events.has(at))events.set(at,[]);events.get(at).push({kind,r});}}
 const points=[...events.keys()].sort((a,b)=>a-b);
 for(let i=0;i<points.length-1;i++){
  let start=points[i];const end=points[i+1];
  // 重複時はサーバーの受理時刻が新しい記録を採用。等しい時はIDで固定。
  for(const event of events.get(start)){if(event.kind==='end')active.delete(event.r.id);else{active.add(event.r.id);push(event.r);}}
  while(heap.length&&!active.has(heap[0].id))pop();
  if(!heap.length)continue;const subject=heap[0].subject;
  while(start<end){
   const stop=Math.min(end,(Math.floor((start+JST)/DAY)+1)*DAY-JST),key=new Date(start+JST).toISOString().slice(0,10);
   const day=days[key]||(days[key]=Object.fromEntries(SUBJECTS.map(s=>[s,0])));day[subject]+=stop-start;start=stop;
  }
 }
 return days;
}
module.exports={aggregate};
