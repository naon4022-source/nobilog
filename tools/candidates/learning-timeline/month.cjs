'use strict';
const {create:history}=require('./history.cjs'),{aggregate}=require('./aggregate.cjs');
const SUBJECTS=['数学','英語','国語','理科','社会'],DAY=86400000,JST=9*3600000;
function bounds(month){
 if(typeof month!=='string'||!/^20\d{2}-(0[1-9]|1[0-2])$/.test(month))throw Error('invalid month');
 const [y,m]=month.split('-').map(Number);return {start:Date.UTC(y,m-1,1)-JST,end:Date.UTC(y,m,1)-JST};
}
// 途中ページを完成した月と誤認しない。公開するのは全履歴の検証後だけ。
// 1チャンク60区間×10万チャンクという保存APIの上限をそのまま使う。
function create(options){
 const {same,ready}=options;if(typeof same!=='function'||typeof ready!=='function')throw Error('invalid month context');
 let closed=false,flight=null,snapshot=null,error='',requested=null;
 const own=()=>!closed&&same()===true;
 const reader=history({...options,same:own});
 const copy=value=>value?JSON.parse(JSON.stringify(value)):null;
 function state(){if(!own())snapshot=null;return {loading:!!flight,requested,snapshot:copy(snapshot),error};}
 async function run(month){
  const range=bounds(month),intervals=new Map();let matchedSpans=0;
  const meta=await reader.read(page=>{
   if(!own()||!ready())throw Error('session changed');
   for(const s of page){
    if(s.end<=range.start||s.start>=range.end)continue;
    if(matchedSpans>=6000000)throw Error('history limit');matchedSpans++;
    const clipped={...s,start:Math.max(s.start,range.start),end:Math.min(s.end,range.end)},key=clipped.subject+':'+clipped.start+':'+clipped.end,old=intervals.get(key);
    // 同じ教科・同じ区間では、優先順位が最も高い記録だけで結果が決まる。
    // 複数端末等の同一区間を百万件保持してから集計する必要はない。
    if(!old||clipped.acceptedAt>old.acceptedAt||clipped.acceptedAt===old.acceptedAt&&clipped.id<old.id)intervals.set(key,clipped);
   }
  },window=>{if(window||snapshot?.window)snapshot=null;});
  if(!meta.complete||!own()||!ready())throw Error('history incomplete');
  const from=meta.window?.from||0;
  const visible=[...intervals.values()].filter(s=>s.end>from).map(s=>({...s,start:Math.max(s.start,from)}));
  const measured=aggregate(visible,{maxRecords:6000000}),days={};
  for(let t=range.start;t<range.end;t+=DAY){const date=new Date(t+JST).toISOString().slice(0,10);days[date]=t+DAY<=from?null:measured[date]||Object.fromEntries(SUBJECTS.map(s=>[s,0]));}
  const totals=Object.fromEntries(SUBJECTS.map(s=>[s,0]));for(const d of Object.values(days))if(d)for(const s of SUBJECTS)totals[s]+=d[s];
  if(!own()||!ready())throw Error('session changed');
  snapshot={month,days,totals,totalMs:Object.values(totals).reduce((a,b)=>a+b,0),matchedSpans,retainedIntervals:intervals.size,records:meta.records,pages:meta.pages,serverTime:meta.serverTime,complete:true,...(meta.window?{window:meta.window}:{})};
  return copy(snapshot);
 }
 function load(month){
  try{bounds(month);}catch(_){return Promise.reject(Error('表示する月を確認してください。'));}
  if(flight)return Promise.reject(Error('学習時間を読み込み中です。'));
  if(!own()){snapshot=null;return Promise.reject(Error('学習時間の接続を確認してください。'));}
  if(!ready()){error='接続を確認できません。前に確認できた表示を残しています。';return Promise.reject(Error(error));}
  requested=month;error='';if(snapshot?.window)snapshot=null;
  flight=run(month).catch(()=>{if(!own())snapshot=null;error=snapshot?'学習時間をすべて確認できませんでした。前に確認できた表示を残しています。':'学習時間をすべて確認できませんでした。接続を確認して、もう一度読み込んでください。';throw Error(error);}).finally(()=>{flight=null;});
  return flight;
 }
 return Object.freeze({load,state,dispose(){closed=true;snapshot=null;}});
}
module.exports={bounds,create};
