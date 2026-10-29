// V3-only integration candidate. Reuses the main app's existing authenticated
// identity; this script never reads a PIN or stores a session credential.
(function(root){
 'use strict';
 let controller=null,epoch=0;
 function stop(){const old=controller;controller=null;old?.destroy();epoch++;}
 async function start(){
  stop();const run=epoch,host=document.getElementById('coop-story-host'),who=cloudIdentity();
  if(!host)return;
  const current=()=>run===epoch&&cloudSame(who);
  if(!who.uid||isTrial()||!serverBootReady||authLeaseBlocked){host.textContent='オンラインで本人のアカウントにログインしてから開いてください。';return;}
  const headers={...vbHeaders()},hintKey='nobi-coop-room:'+who.uid;
  host.textContent='仲間との冒険を確認しています…';
  if(!document.getElementById('nobi-coop-style')){const link=document.createElement('link');link.id='nobi-coop-style';link.rel='stylesheet';link.href='/coop-story.css';document.head.append(link);}
  try{
   const {mountCoopGame}=await import('/coop-story-client.mjs');if(!current())return;
   async function request(action,options){
    if(!current())throw Error('active_session');
    if(authLeaseBlocked)throw Object.assign(Error('view_blocked'),{code:'view_blocked',status:409});
    const url=new URL(cloudUrl('/coop-story/'+action));for(const [key,value]of Object.entries(options.query||{}))url.searchParams.set(key,value);
    const deadline=new AbortController(),timer=setTimeout(()=>deadline.abort(),15000);
    const signal=options.signal?AbortSignal.any([options.signal,deadline.signal]):deadline.signal;
    try{
     const response=await fetch(url,{method:options.method,headers:{...headers,...(options.method==='POST'?{'Content-Type':'application/json'}:{})},...(options.method==='POST'?{body:JSON.stringify(options.body)}:{}),signal,cache:'no-store',keepalive:options.keepalive===true});
     if(!current()){void response.body?.cancel().catch(()=>{});throw Error('active_session');}
     if(action==='events')return response;
     const bytes=await response.arrayBuffer();if(!current())throw Error('active_session');
     if(typeof authLeasePause==='function'&&(response.status===401||response.status===409)){
      try{const problem=JSON.parse(new TextDecoder().decode(bytes));if(response.status===401||problem.error==='active_session')authLeasePause(problem);}catch(_){}
     }
     return new Response(bytes,{status:response.status,headers:response.headers});
    }finally{clearTimeout(timer);}
   }
   controller=mountCoopGame(host,{isCurrent:current,request,
    renderPrompt:(element,q)=>{if(root.NobiFractions)root.NobiFractions.append(element,q.prompt);else element.textContent=q.prompt;},
    loadRoomId:()=>{try{const id=sessionStorage.getItem(hintKey);return /^[A-Za-z0-9_-]{1,80}$/.test(id||'')?id:null;}catch(_){return null;}},
    onRoom:id=>{try{sessionStorage.setItem(hintKey,id||'');}catch(_){}},
    onStop:()=>{}
   });
   await controller.start();
  }catch(_){
   if(!current())return;controller?.destroy(false);controller=null;
   host.replaceChildren();const message=document.createElement('p');message.textContent='冒険に接続できませんでした。記録はサーバーに残っています。接続を確認して再試行してください。';
   const retry=document.createElement('button');retry.type='button';retry.className='btn';retry.textContent='もう一度接続する';retry.onclick=()=>void start();host.append(message,retry);
  }
 }
 root.NobiCoopEntry=Object.freeze({start,stop});
})(window);
