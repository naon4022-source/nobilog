(function(root){
'use strict';
const el=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
const seconds=ms=>(ms/1000).toFixed(1)+'秒';
function mount(host,bridge,catalog,{readOnly=false,onSaved=()=>{}}={}){
 const units=catalog.units.filter(u=>u.status==='ready'&&u.subject!=='保健体育'&&root.NobiMaterialEngine.validateUnit(u,{sources:catalog.sources}).length===0);
 const uid=bridge.identity();let alive=true,epoch=0,busy=false,running=false,unitId=units[0]?.id||'',mode='study',questionId='',page=null,message='',answer='',started=0,pending=null,timer=null;
 function unit(){return units.find(u=>u.id===unitId);}
 function questions(){return (mode==='test'?unit()?.tests:unit()?.questions)?.filter(q=>q.type!=='reading')||[];}
 function question(){return questions().find(q=>q.id===questionId);}
 function reset(){questionId=questions()[0]?.id||'';page=null;message='';answer='';pending=null;}
 function current(run){if(!alive)return false;if(uid!==bridge.identity()){host.replaceChildren();return false;}return run===epoch;}
 function clearTimer(){if(timer!==null){root.clearInterval(timer);timer=null;}}
 function button(text,action,disabled=busy){const b=el('button',text);b.type='button';b.disabled=disabled;b.addEventListener('click',action);return b;}
 async function load(cursor,start=false){
  if(busy||running||!question())return;const run=++epoch;busy=true;message='過去の解答時間を確認しています。';page=null;render();
  try{
   const value=await bridge.speed(uid,{unitId,questionId,mode,...(cursor?{cursor}:{})});if(!current(run))return;page=value;message='';
   if(start){running=true;answer='';pending=null;started=root.performance.now();}
  }catch(error){if(current(run))message=error.message||'速度の記録を確認できませんでした。';}
  finally{if(current(run)){busy=false;render();}}
 }
 async function submit(){
  if(busy||!running||!question())return;if(!answer.trim()){message='答えを入力してください。';render();return;}
  const run=++epoch,q=question();
  if(!pending)pending={id:root.crypto.randomUUID(),unitId,questionId,mode,answer,elapsedMs:Math.min(86400000,Math.max(0,Math.round(root.performance.now()-started)))};
  busy=true;message='回答と解答時間を保存しています。';clearTimer();render();
  try{
   const record=await bridge.record(pending,uid);if(!current(run))return;
   if(record.elapsedMs!==pending.elapsedMs||!Number.isSafeInteger(record.at)||record.at<0)throw Error('invalid timing receipt');
   const elapsed=record.elapsedMs,target=page.bestMs;
   if(record.result.correct){
    message='正解：'+seconds(elapsed)+'。'+(elapsed===0?'0秒の回答は最速記録に含めません。':target===null?'最初の正解時間を記録しました。':elapsed<target?'過去の最速 '+seconds(target)+' より '+seconds(target-elapsed)+' 速く解けました。':elapsed===target?'過去の最速と同じ時間です。':'過去の最速は '+seconds(target)+'。丁寧に正解できました。');
   }else message='今回：'+seconds(elapsed)+'。'+(record.result.reason||'答えをもう一度確認しましょう。')+' 不正解は最速記録に含めません。';
   if(q.explanation)message+=' '+q.explanation;
   const items=[{id:record.id,at:record.at,elapsedMs:elapsed,correct:record.result.correct},...page.items].sort((a,b)=>b.at-a.at||b.id.localeCompare(a.id)).slice(0,50),last=items.at(-1);
   page={...page,attempts:page.attempts+1,correct:page.correct+(record.result.correct?1:0),bestMs:record.result.correct&&elapsed>0?(target===null?elapsed:Math.min(target,elapsed)):target,items,next:page.attempts>=50?String(last.at).padStart(13,'0')+':'+last.id:null};
   running=false;pending=null;answer='';try{await onSaved();}catch(_){}if(!current(run))return;
  }catch(_){if(current(run))message='保存を確認できませんでした。同じ回答を再送できます。解答時間は送信時の値を保ちます。';}
  finally{if(current(run)){busy=false;render();}}
 }
 function graph(items){
  const rows=[...items].reverse(),box=el('div');box.append(el('h4','この問題の解答時間（古い→新しい）'));
  if(!rows.length){box.append(el('p','まだ記録がありません。'));return box;}
  const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 480 210');svg.setAttribute('role','img');svg.setAttribute('aria-label','同じ問題の解答時間の折れ線グラフ');svg.classList.add('material-speed-chart');
  const max=Math.max(1000,...rows.map(r=>r.elapsedMs)),coords=rows.map((r,i)=>[40+(rows.length===1?190:i/(rows.length-1)*400),170-r.elapsedMs/max*140]);
  const axis=document.createElementNS(ns,'path');axis.setAttribute('d','M40 20V170H450');axis.setAttribute('stroke','currentColor');axis.setAttribute('fill','none');svg.append(axis);
  const line=document.createElementNS(ns,'polyline');line.setAttribute('points',coords.map(p=>p.join(',')).join(' '));line.setAttribute('fill','none');line.setAttribute('stroke','currentColor');line.setAttribute('stroke-width','2');svg.append(line);
  rows.forEach((r,i)=>{const dot=document.createElementNS(ns,'circle');dot.setAttribute('cx',coords[i][0]);dot.setAttribute('cy',coords[i][1]);dot.setAttribute('r','4');dot.setAttribute('stroke','currentColor');dot.setAttribute('fill',r.correct?'currentColor':'white');const title=document.createElementNS(ns,'title');title.textContent=new Date(r.at).toLocaleString('ja-JP')+' '+seconds(r.elapsedMs)+' '+(r.correct?'正解':'不正解');dot.append(title);svg.append(dot);});
  for(const [x,y,text] of [[4,22,seconds(max)],[12,174,'0秒'],[40,200,'古い記録'],[378,200,'新しい記録']]){const t=document.createElementNS(ns,'text');t.setAttribute('x',x);t.setAttribute('y',y);t.setAttribute('font-size','12');t.setAttribute('fill','currentColor');t.textContent=text;svg.append(t);}
  box.append(svg,el('small','● 正解 ／ ○ 不正解。最大50回ずつ表示します。'));
  const details=el('details');details.append(el('summary','時間と正誤を一覧で見る'));
  for(const r of rows)details.append(el('p',new Date(r.at).toLocaleString('ja-JP')+' ／ '+seconds(r.elapsedMs)+' ／ '+(r.correct?'正解':'不正解')));box.append(details);return box;
 }
 function render(){
  if(!current(epoch))return;clearTimer();host.replaceChildren();host.className='materials material-time-attack';host.append(el('h3',readOnly?'問題ごとの解答スピード':'自分の記録に挑戦・タイムアタック'));
  host.append(el('p',readOnly?'問題ごとの保存済みの解答時間です。正解と不正解を分けて見られます。最速は正解した0秒より長い記録だけを使います。':'同じ問題・同じ学習種類の過去の正解時間と比べます。速さで学校の点数は変わりません。計測は開始を押してから送信までで、画面を離れた時間も含みます。'));
  const controls=el('div');controls.className='material-stat-controls';
  for(const [label,values,value,set] of [
   ['速度比較の単元',units.map(u=>[u.id,u.subject+' '+u.grade+'年・'+u.title+'（'+(u.mode==='workbook'?'ワーク':'ドリル')+'）']),unitId,v=>{unitId=v;reset();}],
   ['速度比較の学習種類',[['study','問題'],['test','確認テスト']],mode,v=>{mode=v;reset();}],
   ['速度比較の問題',questions().map((q,i)=>[q.id,(i+1)+'問目：'+q.prompt.slice(0,65)]),questionId,v=>{questionId=v;page=null;message='';answer='';}]
  ]){const l=el('label',label),select=el('select');select.setAttribute('aria-label',label);select.disabled=busy||running;for(const [id,text] of values){const o=el('option',text);o.value=id;select.append(o);}select.value=value;select.addEventListener('change',()=>{epoch++;set(select.value);render();});l.append(select);controls.append(l);}host.append(controls);
  if(!question()){host.append(el('p','計測できる問題は準備中です。'));return;}
  host.append(button('解答時間の記録を見る',()=>void load(),busy||running));
  if(!readOnly&&!running)host.append(button('計測を開始する',()=>void load(undefined,true),busy));
  if(page){host.append(el('p','保存済み '+page.attempts+'回答 ／ 正解 '+page.correct+'回答 ／ 最速 '+(page.bestMs===null?'まだ記録なし':seconds(page.bestMs))));if(!running)host.append(graph(page.items));if(page.next&&!running)host.append(button('以前の解答時間を見る',()=>void load(page.next)));}
  if(running){
   const panel=el('article');panel.append(el('p',question().prompt),el('small',root.NobiMaterialEngine.address(unit(),question())));
   const clock=el('p',pending?'送信時の解答時間：'+seconds(pending.elapsedMs):'計測中：'+seconds(root.performance.now()-started));clock.setAttribute('aria-live','off');panel.append(clock);
   if(!busy&&!pending)timer=root.setInterval(()=>{if(current(epoch))clock.textContent='計測中：'+seconds(Math.min(86400000,Math.max(0,root.performance.now()-started)));},200);
   const form=el('form'),label=el('label','タイムアタックの答え'),input=el('textarea');input.id='material-speed-answer';label.htmlFor=input.id;input.value=answer;input.maxLength=4000;input.disabled=busy||!!pending;input.autocomplete='off';input.setAttribute('data-answer-subject',unit().subject);input.setAttribute('inputmode',unit().subject==='数学'?'decimal':'text');input.addEventListener('input',()=>answer=input.value);
   const b=el('button',busy?'保存中…':pending?'同じ回答を再送する':'回答と時間を保存する');b.type='submit';b.disabled=busy;form.addEventListener('submit',e=>{e.preventDefault();void submit();});form.append(label,input,b);panel.append(form);
   if(!pending)panel.append(button('計測をやめる',()=>{epoch++;running=false;answer='';message='計測を終了しました。回答は保存していません。';render();}));host.append(panel);
  }
  if(message){const status=el('p',message);status.setAttribute('role','status');host.append(status);}
 }
 reset();render();return Object.freeze({destroy(){alive=false;epoch++;clearTimer();host.replaceChildren();}});
}
root.NobiMaterialSpeed=Object.freeze({mount});
})(globalThis);
