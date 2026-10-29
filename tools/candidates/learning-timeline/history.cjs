'use strict';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const SUBJECTS=new Set(['数学','英語','国語','理科','社会']);
// 全ページを検査してから完了を返す。onPageは仮集計専用とし、完了前に画面へ公開しない。
// 生のcontent（保存用の本文）は返さず、台帳と照合された計測区間だけを渡す。
function create({same,ready,request,catalog,maxPages=500}){
 if(![same,ready,request].every(f=>typeof f==='function')||!Array.isArray(catalog)||!Number.isSafeInteger(maxPages)||maxPages<1||maxPages>500)throw Error('invalid history reader');
 const allowed=new Map(catalog.map(x=>[x.id,x]));let flight=null;
 function own(){if(!same()||!ready())throw Error('学習時間の接続を確認してください。');}
 async function run(onPage,onWindow){
  let cursor='',count=0,pages=0;const visited=new Set();let latestTime=0,policy,window=null;
  for(;;){
   own();if(pages>=maxPages)throw Error('学習時間の履歴をすべて読み取れませんでした。');
   const result=await request('/learning-time'+(cursor?'?cursor='+encodeURIComponent(cursor):''));own();
   if(!result||!Array.isArray(result.items)||result.items.length>200||!Number.isSafeInteger(result.serverTime)||result.serverTime<0)throw Error('invalid history page');
   const w=result.window??null;
   if(w&&(!Number.isSafeInteger(w.from)||w.from<0||w.from>result.serverTime||!['mini','standard','pro','unlimit'].includes(w.plan)||!Number.isSafeInteger(w.revision)||w.revision<1||!['1週間','3週間','1か月','3年'].includes(w.label)))throw Error('invalid history window');
   const key=w?w.plan+':'+w.revision+':'+w.label:'unrestricted';
   if(policy!==undefined&&policy!==key){onWindow?.(w);throw Error('history plan changed');}policy=key;
   window=w?{...w,from:Math.max(window?.from||0,w.from)}:null;onWindow?.(window);
   let previous=cursor;
   const spans=[];
   for(const item of result.items){
    if(!item||!UUID.test(item.id||'')||item.id<=previous||!Array.isArray(item.spans)||item.spans.length<1||item.spans.length>60||!Number.isSafeInteger(item.acceptedAt)||item.acceptedAt<0||item.acceptedAt>result.serverTime)throw Error('invalid history record');
    previous=item.id;
    let index=-1;
    item.spans.forEach((s,i)=>{
     const suffix=typeof s?.id==='string'&&s.id.startsWith(item.id+':')?s.id.slice(item.id.length+1):'';
     const originalIndex=/^(0|[1-9]\d?)$/.test(suffix)?Number(suffix):-1;
     const target=allowed.get(s?.activity);
     if(!target||!SUBJECTS.has(target.subject)||target.kind!==s.kind||target.subject!==s.subject||!['textbook','question'].includes(s.kind)||originalIndex<=index||originalIndex>=60||!window&&originalIndex!==i||![s.start,s.end,s.acceptedAt].every(Number.isSafeInteger)||s.start<0||s.end<=s.start||s.end-s.start>5000||s.acceptedAt!==item.acceptedAt||s.end>item.acceptedAt)throw Error('invalid history span');
     index=originalIndex;
     if(!window||s.end>window.from)spans.push({id:s.id,subject:s.subject,start:Math.max(s.start,window?.from||0),end:s.end,acceptedAt:s.acceptedAt});
    });
   }
   const next=result.next;
   if(next!==null&&(!UUID.test(next||'')||result.items.length!==200||next!==previous||next<=cursor||visited.has(next)))throw Error('invalid history cursor');
   // 応答や呼出側に可変参照を共有しない。別本人に切替わったら後続ページを読まない。
   await onPage(spans);own();count+=result.items.length;pages++;latestTime=Math.max(latestTime,result.serverTime);
   if(next===null)return Object.freeze({complete:true,records:count,pages,serverTime:latestTime,...(window?{window:{...window}}:{})});
   visited.add(next);cursor=next;
  }
 }
 function read(onPage,onWindow){if(typeof onPage!=='function'||onWindow!==undefined&&typeof onWindow!=='function')return Promise.reject(Error('invalid page consumer'));if(flight)return Promise.reject(Error('履歴を読み込み中です。'));flight=run(onPage,onWindow).finally(()=>{flight=null;});return flight;}
 return Object.freeze({read});
}
module.exports={create};
