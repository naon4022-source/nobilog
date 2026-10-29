'use strict';
const {create:client}=require('./client.cjs'),{create:month}=require('./month.cjs');
// 本体の本人確認・HTTP処理を注入する。認証値を表示・計測保存へ渡さない。
function create(options){
 const {context,request,mountCalendar}=options;
 if(![context,request,mountCalendar].every(f=>typeof f==='function'))throw Error('invalid app adapter');
 let closed=false,calendar=null;
 function current(){
  const ctx=context();
  return ctx&&typeof ctx.uid==='string'&&ctx.uid&&typeof ctx.same==='function'&&typeof ctx.ready==='function'&&ctx.same()&&ctx.ready()?ctx:null;
 }
 function own(ctx){if(closed||!ctx?.same()||!ctx.ready())throw Error('学習時間の接続を確認してください。');}
 async function call(ctx,path,body){
  own(ctx);
  if(body===undefined?!/^\/learning-time(?:\?cursor=[a-f0-9-]{36})?$/.test(path):!['/learning-time','/learning-time-start'].includes(path))throw Error('invalid time route');
  // 本体側も渡された本人を送信の直前・応答後に照合する。
  const value=await request(ctx,path,body===undefined?undefined:structuredClone(body));own(ctx);return value;
 }
 const tracker=client({...options,context:current,request:(path,body)=>call(current(),path,body)});
 function dropCalendar(){if(calendar){calendar.view.destroy();calendar=null;}}
 async function refresh(force=false){
  if(calendar&&!calendar.ctx.same())dropCalendar();
  return tracker.refresh(force);
 }
 function show(host,selectedMonth,day){
  if(calendar&&!calendar.ctx.same())dropCalendar();
  const ctx=current();if(closed||!ctx)return false;
  if(!calendar){
   const model=month({same:()=>!closed&&ctx.same(),ready:ctx.ready,catalog:options.catalog,request:(path,body)=>call(ctx,path,body)});
   let view;
   try{view=mountCalendar({model,same:()=>!closed&&ctx.same()});}catch(error){model.dispose();throw error;}
   calendar={ctx,view};
  }
  calendar.view.show(host,selectedMonth,day);return true;
 }
 async function stop(){closed=true;dropCalendar();return tracker.stop();}
 return Object.freeze({refresh,retry:async()=>{if(calendar&&!calendar.ctx.same())dropCalendar();return tracker.retry();},show,stop,state:tracker.state});
}
module.exports={create};
