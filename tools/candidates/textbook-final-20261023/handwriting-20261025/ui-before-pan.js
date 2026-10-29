// Handwritten notes linked to visible textbook passages/figures. Teaching and grades stay intact.
(function(root){
'use strict';
const models=new Map();let controller=null;
const copy=x=>JSON.parse(JSON.stringify(x)),el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const button=(text,fn)=>{const b=el('button',text,'tb-btn');b.type='button';b.addEventListener('click',fn);return b;};
function renderInk(canvas,doc,dpr=1){canvas.width=Math.round(doc.width*dpr);canvas.height=Math.round(doc.height*dpr);const c=canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,doc.width,doc.height);c.lineCap='round';c.lineJoin='round';
 for(const s of doc.strokes){c.globalCompositeOperation=s.tool==='eraser'?'destination-out':'source-over';c.strokeStyle=s.color;c.fillStyle=s.color;c.lineWidth=s.size;const pts=s.points.map(p=>[p[0]*doc.width/10000,p[1]*doc.height/10000]);c.beginPath();if(pts.length===1){c.arc(pts[0][0],pts[0][1],s.size/2,0,Math.PI*2);c.fill();continue;}c.moveTo(...pts[0]);for(let i=1;i<pts.length-1;i++)c.quadraticCurveTo(...pts[i],(pts[i][0]+pts[i+1][0])/2,(pts[i][1]+pts[i+1][1])/2);c.lineTo(...pts.at(-1));c.stroke();}c.globalCompositeOperation='source-over';
}
async function figureBytes(src){const response=await fetch(src,{credentials:'omit',cache:'no-store'});if(!response.ok||!response.body)throw Error('図を読み込めません。');const reader=response.body.getReader(),parts=[];let n=0;try{for(;;){const r=await reader.read();if(r.done)break;n+=r.value.byteLength;if(n>10000000){await reader.cancel();throw Error('図が大きすぎます。');}parts.push(r.value);}}finally{reader.releaseLock();}const data=new Uint8Array(n);let at=0;for(const p of parts){data.set(p,at);at+=p.byteLength;}return data;}
const digest=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
function reset(){controller?.destroy();controller=null;for(const x of models.values())x.model.destroy();models.clear();}
function mount(app,book,context={}){
 controller?.destroy();controller=null;const api=root.nobiTextbookInkAPI,F=root.NobiTextbookInkFormat,M=root.NobiTextbookInkModel;
 if(!api?.available()||!F||!M)return {destroy(){}};
 for(const x of models.values())if(!api.matches(x.owner)){reset();break;}
 let entry=models.get(book);if(!entry){entry={owner:api.snapshot(),model:M.create(api,book)};models.set(book,entry);}const model=entry.model;
 let alive=true,picking=false,panel=null,epoch=0,priorFocus=null,finish=null,cleanup=null,shortcut=null;
 const live=()=>alive&&model.current(),nodes=()=>[...app.querySelectorAll('[data-annotation-anchor]')];
 function stopPick(){picking=false;app.classList.remove('tb-ink-picking');for(const n of nodes()){n.removeAttribute('tabindex');n.removeAttribute('role');}}
 function close(){finish?.();finish=null;cleanup?.();cleanup=null;shortcut=null;++epoch;panel?.remove();panel=null;stopPick();if(priorFocus?.isConnected)priorFocus.focus();}
 function shell(title){close();context.beforeOpen?.();priorFocus=document.activeElement;const back=el('div',undefined,'tb-ink-back'),card=el('section',undefined,'tb-ink-card');card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');card.setAttribute('aria-label',title);const top=el('div',undefined,'tb-ink-top');top.append(el('h3',title),button('閉じる',close));card.append(top);back.append(card);app.append(back);panel=back;
  for(const kind of ['pointerdown','pointerup','wheel'])back.addEventListener(kind,e=>e.stopPropagation(),{passive:true});back.addEventListener('click',e=>{if(e.target===back)close();});top.querySelector('button').focus();return card;
 }
 function pick(){close();context.beforeOpen?.();picking=true;app.classList.add('tb-ink-picking');for(const n of nodes()){n.tabIndex=0;n.setAttribute('role','button');}nodes()[0]?.focus();}
 function list(message){if(!live())return;const card=shell('教科書の手書きノート'),state=model.state();card.append(el('p',message||(!state.loaded?'利用状態を確認しています。':state.writable?'文章や図を選び、手書きノートを作れます。':'保存済みの手書きは読めます。追加・変更はPro以上です。'),'tb-ink-status'));
  if(state.loaded&&state.writable)card.append(button('文章・図を選んで書く',pick));
  card.append(button('接続と保存一覧を再確認',()=>void loadList()));const merged=new Map(state.rows.map(r=>[r.anchor,r]));for(const d of state.drafts)merged.set(d.anchor,{...merged.get(d.anchor),...d,draft:true});
  if(state.loaded&&!merged.size)card.append(el('p','まだ手書きノートはありません。'));
  for(const r of merged.values()){const row=el('section',undefined,'tb-ink-record');if(r.draft)row.append(el('p','未送信の下書き'));row.append(el('blockquote',r.quote),button('手書きを開く',()=>void editor(r.anchor,r.quote)));
   if(context.locate)row.append(button('この文章を見る',()=>{close();context.locate(r.anchor);}));card.append(row);
  }
 }
 async function loadList(){if(!live())return;list();const run=epoch;try{await model.list();if(live()&&run===epoch)list();}catch(e){if(live()&&run===epoch)list(e.status===404?'この版では手書き保存をまだ利用できません。':'一覧を読み込めませんでした。端末下書きは残しています。');}}
 async function editor(anchor,quote,node){
  if(!live())return;const card=shell('手書きノート');card.append(el('blockquote',quote));const status=el('p','読み込んでいます。','tb-ink-status');status.setAttribute('role','status');card.append(status);const run=epoch;
  let loaded;try{loaded=await model.read(anchor);}catch(e){if(live()&&run===epoch)status.textContent=e.message;return;}if(!live()||run!==epoch)return;
  if(loaded.blocked){status.textContent=loaded.error.message;return;}
  if(loaded.error&&!loaded.draft&&!loaded.item){status.textContent='保存した手書きを確認できません。空のノートとして上書きせず、接続を確認して開き直してください。';return;}
  let doc=copy(loaded.draft?.doc||loaded.item?.doc||F.empty()),revision=loaded.draft?.revision??loaded.item?.revision??0,sending=false,stroke=null,pointer=null,color=F.COLORS[0],size=6,tool='pen',frame=0,scale=1,backgroundURL=null,backgroundRun=0,draftTick=0,gesture=false,lastCheckpoint=0;
  const pointers=new Set(),undo=[],redo=[],urls=new Set(),state=model.state();let readonly=state.loaded&&!state.writable;
  cleanup=()=>{if(frame)cancelAnimationFrame(frame);++backgroundRun;for(const url of urls)URL.revokeObjectURL(url);urls.clear();};
  status.textContent=loaded.error?'通信できません。端末の下書きとして編集できます。オンライン保存はまだです。':loaded.recovered?'前回のオンライン保存を確認しました。':loaded.draft?'端末の下書きを復元しました。オンライン保存はまだです。':readonly?'保存済みの手書きです。変更はPro以上です。':'描いた後に「オンライン保存」を押してください。';
  const controls=el('div',undefined,'tb-ink-controls'),paper=el('div',undefined,'tb-ink-paper'),viewport=el('div',undefined,'tb-ink-viewport'),canvas=el('canvas');canvas.tabIndex=0;canvas.setAttribute('role','img');canvas.setAttribute('aria-label','手書きノートの描画面');viewport.append(paper);paper.append(canvas);card.append(controls,viewport);
  const dpr=Math.min(2,root.devicePixelRatio||1);let dirty=true;
  const unlocked=()=>live()&&run===epoch&&!sending&&!readonly;
  function layout(){canvas.width=Math.round(doc.width*dpr);canvas.height=Math.round(doc.height*dpr);paper.style.aspectRatio=doc.width+'/'+doc.height;paper.style.width=100*scale+'%';dirty=true;paint();}
  function paint(){if(!live()||run!==epoch)return;frame=0;if(!dirty)return;dirty=false;renderInk(canvas,doc,dpr);}
  function redraw(){dirty=true;if(!frame)frame=requestAnimationFrame(paint);}
  const body=()=>({book,anchor,quote,revision,doc:copy(doc)});
  function retain(){const tick=++draftTick;void model.draft(body()).then(durable=>{if(live()&&run===epoch&&tick===draftTick&&!sending)status.textContent=durable?'端末に下書きを保存しました。オンライン保存はまだです。':'画面内に下書きを保持しています。閉じる前にオンライン保存してください。';}).catch(e=>{if(live()&&run===epoch&&tick===draftTick)status.textContent=e.message;});}
  function history(){undo.push(copy(doc));if(undo.length>32)undo.shift();redo.length=0;}
  function change(fn){if(!unlocked())return;finishStroke();history();fn();redraw();retain();}
  function finishStroke(){if(!stroke)return;stroke=null;pointer=null;retain();}
  finish=finishStroke;
  function point(e){const r=canvas.getBoundingClientRect();return [Math.max(0,Math.min(10000,Math.round((e.clientX-r.left)*10000/r.width))),Math.max(0,Math.min(10000,Math.round((e.clientY-r.top)*10000/r.height))),Math.max(1,Math.min(1024,Math.round((e.pressure||.5)*1024)))];}
  canvas.addEventListener('pointerdown',e=>{if(!unlocked()||e.button!==0)return;e.preventDefault();pointers.add(e.pointerId);if(pointers.size>1){gesture=true;finishStroke();return;}if(gesture)return;
   if(doc.strokes.length>=F.MAX_STROKES||doc.strokes.reduce((n,s)=>n+s.points.length,0)>=F.MAX_POINTS){status.textContent='このノートの線の上限です。別の文章に新しいノートを作れます。';return;}history();stroke={tool,color,size,points:[point(e)]};doc.strokes.push(stroke);pointer=e.pointerId;canvas.setPointerCapture(e.pointerId);canvas.focus({preventScroll:true});redraw();retain();
  });
  canvas.addEventListener('pointermove',e=>{if(!unlocked()||gesture||pointer!==e.pointerId||!stroke)return;e.preventDefault();let total=doc.strokes.reduce((n,s)=>n+s.points.length,0);for(const p of e.getCoalescedEvents?.().length?e.getCoalescedEvents():[e]){if(total>=F.MAX_POINTS){finishStroke();status.textContent='このノートの点の上限に達しました。下書きを保存しました。';break;}const next=point(p),last=stroke.points.at(-1);if(next[0]!==last[0]||next[1]!==last[1]){stroke.points.push(next);total++;}}redraw();if(performance.now()-lastCheckpoint>400){lastCheckpoint=performance.now();retain();}});
  for(const kind of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(kind,e=>{pointers.delete(e.pointerId);if(pointer===e.pointerId)finishStroke();if(!pointers.size)gesture=false;});
  const pen=button('ペン',()=>{tool='pen';pen.setAttribute('aria-pressed','true');eraser.setAttribute('aria-pressed','false');}),eraser=button('消しゴム',()=>{tool='eraser';pen.setAttribute('aria-pressed','false');eraser.setAttribute('aria-pressed','true');});pen.setAttribute('aria-pressed','true');eraser.setAttribute('aria-pressed','false');controls.append(pen,eraser);
  const colorSelect=el('select'),width=el('select');colorSelect.setAttribute('aria-label','ペンの色');width.setAttribute('aria-label','線の太さ');for(const [i,c]of F.COLORS.entries()){const o=el('option',['黒','赤','青','緑','紫'][i]);o.value=c;colorSelect.append(o);}for(const n of [3,6,12,24]){const o=el('option',n+'');o.value=n;width.append(o);}width.value=String(size);colorSelect.addEventListener('change',()=>color=colorSelect.value);width.addEventListener('change',()=>size=Number(width.value));controls.append(colorSelect,width);
  function backwards(){if(!unlocked()||!undo.length)return;finishStroke();redo.push(copy(doc));doc=undo.pop();void loadBackground(doc.background);layout();retain();}
  function forwards(){if(!unlocked()||!redo.length)return;finishStroke();undo.push(copy(doc));doc=redo.pop();void loadBackground(doc.background);layout();retain();}
  controls.append(button('元に戻す',backwards),button('やり直す',forwards),button('全部消す',()=>change(()=>{doc.strokes=[];})));
  const zoom=el('output','100%');controls.append(button('−',()=>{scale=Math.max(1,scale-.5);paper.style.width=100*scale+'%';zoom.textContent=Math.round(scale*100)+'%';}),zoom,button('＋',()=>{scale=Math.min(3,scale+.5);paper.style.width=100*scale+'%';zoom.textContent=Math.round(scale*100)+'%';}));
  const source=node?.querySelector?.('img')||(node?.tagName==='IMG'?node:null),sourceSrc=source?.getAttribute('src');
  async function loadBackground(bg,provided){const own=++backgroundRun;if(backgroundURL){URL.revokeObjectURL(backgroundURL);urls.delete(backgroundURL);backgroundURL=null;}paper.querySelector('img')?.remove();if(!bg)return;
   try{const bytes=provided||await figureBytes(bg.src);if(await digest(bytes)!==bg.sha256)throw Error('下敷きの図が更新されています。手書きは保持し、違う図への重ね表示を止めました。');if(!live()||run!==epoch||own!==backgroundRun)return;
    const image=el('img'),type=bg.src.endsWith('.svg')?'image/svg+xml':bg.src.endsWith('.jpg')?'image/jpeg':bg.src.endsWith('.webp')?'image/webp':'image/png',url=URL.createObjectURL(new Blob([bytes],{type}));urls.add(url);image.src=url;image.alt='選んだ教科書の図';await image.decode();if(!live()||run!==epoch||own!==backgroundRun){URL.revokeObjectURL(url);urls.delete(url);return;}backgroundURL=url;paper.prepend(image);
   }catch(e){if(live()&&run===epoch&&own===backgroundRun)status.textContent=e.message;}
  }
  if(sourceSrc&&new RegExp('^/textbook-book-'+book+'-[a-z0-9-]+\\.(?:svg|png|jpg|webp)$').test(sourceSrc))controls.append(button('この図を下敷きにする',async()=>{if(!unlocked())return;if(doc.strokes.length){status.textContent='線がある間は下敷きを変えません。必要なら先に「全部消す」を押してください。';return;}const expected=backgroundRun;try{const bytes=await figureBytes(sourceSrc),sha256=await digest(bytes);if(!unlocked()||doc.strokes.length||backgroundRun!==expected)return;history();doc.background={src:sourceSrc,sha256};await loadBackground(doc.background,bytes);retain();}catch(e){if(live()&&run===epoch)status.textContent=e.message;}}));
  controls.append(button('下敷きを外す',()=>change(()=>{doc.background=null;void loadBackground(null);})));await loadBackground(doc.background);if(!live()||run!==epoch)return;layout();
  function lockReadonly(){readonly=true;canvas.setAttribute('aria-disabled','true');for(const b of controls.querySelectorAll('button,select'))if(!['−','＋'].includes(b.textContent))b.disabled=true;}
  const save=button('オンライン保存',async()=>{if(!unlocked())return;finishStroke();++draftTick;sending=true;save.disabled=true;status.textContent='保存しています。';try{if(!model.state().loaded){const current=await model.read(anchor);if(current.blocked)throw current.error;if(!model.state().writable)throw Object.assign(Error('plan'),{status:403});}const item=await model.save(body());if(!live()||run!==epoch)return;revision=item.revision;status.textContent='オンラインに保存しました。';}catch(e){if(!live()||run!==epoch)return;if(e.status===403)lockReadonly();status.textContent=e.status===409?'別の端末で更新されています。下書きは残しています。最新の手書きと比べてください。':e.status===403?'プランが変わったため保存できません。下書きは残しています。':'保存できませんでした。下書きを残したまま再試行できます。';if(e.status===409&&!card.querySelector('.tb-ink-compare')){const compare=button('最新と比べて保存先を確認',async()=>{try{const latest=await model.read(anchor);if(!live()||run!==epoch)return;if(latest.error||!latest.item){status.textContent='最新の記録を確認できません。下書きは残しています。';return;}const box=el('section',undefined,'tb-ink-comparison'),label=el('p','オンラインの最新の線（読むだけ）'),preview=el('canvas');preview.setAttribute('aria-label','オンラインの最新の手書き');renderInk(preview,latest.item.doc);box.append(label,preview);card.append(box);if(!model.state().writable){lockReadonly();save.disabled=true;status.textContent='プランが変わりました。下書きと最新の線を保持し、変更を止めています。';return;}box.append(button('今の下書きで置き換える準備',()=>{revision=latest.item.revision;retain();status.textContent='保存先の更新番号を合わせました。「オンライン保存」で今の下書きに置き換えます。';}));}catch{if(live()&&run===epoch)status.textContent='最新の記録を確認できません。下書きは残しています。';}});compare.className+=' tb-ink-compare';card.append(compare);}}
   finally{if(live()&&run===epoch){sending=false;save.disabled=readonly;}}
  });const saveRow=el('div',undefined,'tb-ink-save-row');saveRow.append(save);card.append(saveRow);
  if(readonly){lockReadonly();save.disabled=true;}
  shortcut=e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?forwards():backwards();}};
 }
 const openButton=button('手書きノート',()=>{if(picking)stopPick();else void loadList();});openButton.classList.add('tb-ink-button');app.querySelector('.tb-bar-actions')?.append(openButton);
 function select(e){if(!picking||!live())return;const n=e.target.closest?.('[data-annotation-anchor]');if(!n||!app.contains(n))return;e.preventDefault();e.stopImmediatePropagation();void editor(n.dataset.annotationAnchor,n.dataset.annotationQuote,n);}
 function key(e){if(!live())return;if(panel){if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();return;}if(panel.contains(e.target)){shortcut?.(e);e.stopPropagation();if(e.key==='Tab'){const targets=[...panel.querySelectorAll('button,select,canvas')].filter(x=>!x.disabled),at=targets.indexOf(document.activeElement);if(targets.length){e.preventDefault();targets[(at+(e.shiftKey?-1:1)+targets.length)%targets.length].focus();}}}}else if(picking&&['Enter',' '].includes(e.key))select(e);}
 app.addEventListener('click',select,true);document.addEventListener('keydown',key,true);
 const instance={close,destroy(){if(!alive)return;close();alive=false;openButton.remove();app.removeEventListener('click',select,true);document.removeEventListener('keydown',key,true);}};controller=instance;return instance;
}
root.NobiTextbookInk=Object.freeze({mount,reset,close(){controller?.close();}});
})(globalThis);
