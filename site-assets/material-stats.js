(function(root){
'use strict';
function dayNumber(day){
 if(typeof day!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(day))throw Error('invalid activity date');
 const time=Date.parse(day+'T00:00:00Z');if(!Number.isFinite(time)||new Date(time).toISOString().slice(0,10)!==day)throw Error('invalid activity date');return time/86400000;
}
function activitySummary(rows,today){
 const end=dayNumber(today),days=[...new Set(rows.map(row=>dayNumber(row.day)))].filter(day=>day<=end).sort((a,b)=>a-b);
 let best=0,run=0,previous=null;for(const day of days){run=day===previous+1?run+1:1;best=Math.max(best,run);previous=day;}
 const recorded=new Set(days);let current=0,cursor=recorded.has(end)?end:end-1;while(recorded.has(cursor)){current++;cursor--;}
 return {days:days.length,current,best,today:recorded.has(end)};
}
function monthlyCsv(month,rows){
 if(typeof month!=='string'||!/^\d{4}-(?:0[1-9]|1[0-2])$/.test(month)||!Array.isArray(rows)||rows.length>10000)throw Error('invalid export');
 const cell=value=>'"'+String(value).replace(/^[ \u00a0]*[=+@-]/,"'$&").replace(/"/g,'""')+'"';
 const lines=[['日付','教科','単元','学習の種類','回答数','正答数','解答時間合計（秒）']];
 for(const row of [...rows].sort((a,b)=>String(a.day).localeCompare(String(b.day))||String(a.unitId).localeCompare(String(b.unitId))||String(a.mode).localeCompare(String(b.mode)))){
  if(!row||typeof row.day!=='string'||!row.day.startsWith(month+'-')||!['国語','数学','英語','理科','社会'].includes(row.subject)||typeof row.title!=='string'||row.title.length>300||/[\u0000-\u001f\u007f]/.test(row.title)||!['study','test'].includes(row.mode)||!['attempts','correct','elapsedMs'].every(k=>Number.isSafeInteger(row[k])&&row[k]>=0)||!row.attempts||row.correct>row.attempts)throw Error('invalid export row');
  dayNumber(row.day);
  lines.push([row.day,row.subject,row.title,row.mode==='test'?'練習テスト':'問題',row.attempts,row.correct,(row.elapsedMs/1000).toFixed(3)]);
 }
 return '\uFEFF'+lines.map(row=>row.map(cell).join(',')).join('\r\n')+'\r\n';
}
function mount(host,adapter){
 let alive=true,epoch=0,data=null,dataOwner=null,busy=false,message='',month='',unit='',mode='';
 const el=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
 const sum=rows=>rows.reduce((s,r)=>({attempts:s.attempts+r.attempts,correct:s.correct+r.correct,elapsedMs:s.elapsedMs+r.elapsedMs}),{attempts:0,correct:0,elapsedMs:0});
 const rate=r=>r.attempts?Math.round(r.correct/r.attempts*100)+'%':'—';
 const seconds=r=>r.attempts?(r.elapsedMs/r.attempts/1000).toFixed(1)+'秒':'—';
 const matches=r=>(!unit||r.unitId===unit)&&(!mode||r.mode===mode);
 function validate(value){
  if(!value||!/^\d{4}-(?:0[1-9]|1[0-2])$/.test(value.month)||!Array.isArray(value.totals)||!Array.isArray(value.days))throw Error('invalid statistics');
  for(const row of [...value.totals,...value.days]){
   if(typeof row.unitId!=='string'||!['国語','数学','英語','理科','社会'].includes(row.subject)||typeof row.title!=='string'||!['study','test'].includes(row.mode)||!['attempts','correct','elapsedMs'].every(k=>Number.isSafeInteger(row[k])&&row[k]>=0)||row.attempts===0||row.correct>row.attempts)throw Error('invalid statistics');
  }
  const [year,m]=value.month.split('-').map(Number),last=new Date(Date.UTC(year,m,0)).getUTCDate();
  for(const row of value.days){if(!new RegExp('^'+value.month+'-(?:0[1-9]|[12][0-9]|3[01])$').test(row.day)||Number(row.day.slice(-2))>last)throw Error('invalid date');}
  if(!Array.isArray(value.activity)||!Number.isSafeInteger(value.serverTime)||value.serverTime<0)throw Error('invalid activity');
  for(const row of value.activity){dayNumber(row.day);if(typeof row.unitId!=='string'||!['study','test'].includes(row.mode)||!Number.isSafeInteger(row.attempts)||row.attempts<1)throw Error('invalid activity');}
 }
 async function reload(requestedMonth){
  const uid=adapter.identity(),run=++epoch;busy=true;data=null;message='学習記録を読み込んでいます。';render();
  try{
   const value=await adapter.load(requestedMonth);validate(value);
   if(!alive||run!==epoch||uid!==adapter.identity())return;
   if(requestedMonth&&value.month!==requestedMonth)throw Error('different month');
   data=value;dataOwner=uid;month=value.month;message='';
   if(typeof adapter.achievement==='function'){try{const rows=await adapter.achievement();if(alive&&run===epoch&&uid===adapter.identity()){if(!Array.isArray(rows))throw Error('invalid progress');achieved=rows.filter(r=>r&&typeof r.title==='string'&&typeof r.subject==='string'&&Number.isInteger(r.total)&&Number.isInteger(r.done)&&r.done>=0);achievementOwner=uid;achievementMessage='';}}catch(_){if(alive&&run===epoch&&uid===adapter.identity()){if(achievementOwner!==uid)achieved=null;achievementOwner=uid;achievementMessage=achieved?'単元の達成度を更新できませんでした。前回取得した記録を表示しています。':'単元の達成度を読み込めませんでした。再試行してください。';}}}
  }catch(_){if(alive&&run===epoch&&uid===adapter.identity())message='学習記録を読み込めませんでした。再試行してください。';}
  finally{if(alive&&run===epoch&&uid===adapter.identity()){busy=false;render();}}
 }
 function button(label,fn){const b=el('button',label);b.type='button';b.disabled=busy;b.addEventListener('click',fn);return b;}
 function selector(label,options,value,change){const wrap=el('label',label),select=el('select');select.setAttribute('aria-label',label);for(const [id,text] of options){const option=el('option',text);option.value=id;select.append(option);}select.value=value;select.disabled=busy;select.addEventListener('change',()=>change(select.value));wrap.append(select);return wrap;}
 function graph(rows,days){
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 500 220');svg.setAttribute('role','img');svg.setAttribute('aria-label','日別の平均解答時間。記録のない日は線をつなぎません。');svg.classList.add('material-speed-chart');
  function shape(tag,attrs,text){const n=document.createElementNS(svg.namespaceURI,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,String(v));if(text!==undefined)n.textContent=text;return n;}
  const grouped=new Map();for(const r of rows){const d=Number(r.day.slice(-2));grouped.set(d,sum([grouped.get(d)||sum([]),r]));}
  const max=Math.max(1,...[...grouped.values()].map(r=>r.elapsedMs/r.attempts/1000));
  for(let i=0;i<=4;i++){const y=180-i*40;svg.append(shape('line',{x1:48,x2:480,y1:y,y2:y,stroke:'#ddd'}),shape('text',{x:44,y:y+4,'text-anchor':'end','font-size':12,fill:'currentColor'},(max*i/4).toFixed(1)));}
  svg.append(shape('text',{x:8,y:14,'font-size':12,fill:'currentColor'},'秒'));
  const x=d=>48+(d-1)*432/(days-1),y=r=>180-(r.elapsedMs/r.attempts/1000)/max*160;
  let segment=[];function flush(){if(segment.length>1)svg.append(shape('polyline',{points:segment.join(' '),fill:'none',stroke:'currentColor','stroke-width':2}));segment=[];}
  for(let d=1;d<=days;d++){const r=grouped.get(d);if(!r){flush();continue;}segment.push(x(d)+','+y(r));const dot=shape('circle',{cx:x(d),cy:y(r),r:4,fill:'currentColor'});dot.append(shape('title',{},d+'日：'+seconds(r)));svg.append(dot);}flush();
  for(const d of [1,Math.ceil(days/2),days])svg.append(shape('text',{x:x(d),y:204,'text-anchor':'middle','font-size':12,fill:'currentColor'},d+'日'));
  return svg;
 }
 function weakness(rows){
  const section=el('section');section.className='material-weakness';section.append(el('h3','保存開始からの教科・単元別正答率'),el('p','正解した回答÷保存済み回答で計算します。解き直しも含む回答の傾向で、学力や検定の合格率を表すものではありません。月の指定は下の時間グラフに適用されます。'));
  if(!rows.length){section.append(el('p','まだ正答率を表示できる回答記録がありません。'));return section;}
  const subjects=['国語','数学','英語','理科','社会'],groups=subjects.map(subject=>sum(rows.filter(r=>r.subject===subject)));
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 380 340');svg.setAttribute('role','img');svg.setAttribute('aria-label','5教科の回答正答率。記録のない教科は点を描かず、0点として扱いません。');svg.classList.add('material-weakness-chart');
  const shape=(tag,attrs,text)=>{const n=document.createElementNS(svg.namespaceURI,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,String(v));if(text!==undefined)n.textContent=text;return n;};
  const point=(i,r)=>{const a=-Math.PI/2+i*2*Math.PI/5;return [190+Math.cos(a)*r,170+Math.sin(a)*r];};
  for(const r of [25,50,75,100])svg.append(shape('polygon',{points:subjects.map((_,i)=>point(i,r).join(',')).join(' '),fill:'none',stroke:'#bbb','stroke-width':1}));
  subjects.forEach((subject,i)=>{const p=point(i,100),label=point(i,137);svg.append(shape('line',{x1:190,y1:170,x2:p[0],y2:p[1],stroke:'#bbb'}),shape('text',{x:label[0],y:label[1]-4,'text-anchor':'middle','font-size':14,fill:'currentColor'},subject),shape('text',{x:label[0],y:label[1]+14,'text-anchor':'middle','font-size':12,fill:'currentColor'},groups[i].attempts?rate(groups[i]):'記録なし'));});
  // 全教科があるときだけ面を結ぶ。未学習を0%の点で埋めない。
  if(groups.every(r=>r.attempts))svg.append(shape('polygon',{points:groups.map((r,i)=>point(i,r.correct/r.attempts*100).join(',')).join(' '),fill:'none',stroke:'currentColor','stroke-width':2}));
  groups.forEach((r,i)=>{if(!r.attempts)return;const p=point(i,r.correct/r.attempts*100),dot=shape('circle',{cx:p[0],cy:p[1],r:5,fill:'currentColor','data-subject':subjects[i]});dot.append(shape('title',{},subjects[i]+'：'+rate(r)+'（正答'+r.correct+'／'+r.attempts+'回答）'));svg.append(dot);});
  section.append(svg,el('p','目盛りは中心0%、外側100%。記録のない教科には点を表示しません。単元・学習の種類の絞り込みはこの図にも反映します。'));
  const table=el('table');table.className='material-weakness-table';const caption=el('caption','単元ごとの回答傾向（正答率が低い順）'),head=el('thead'),tr=el('tr');
  for(const label of ['教科・単元','正答率・件数','振り返り']){const th=el('th',label);th.scope='col';tr.append(th);}head.append(tr);table.append(caption,head);const body=el('tbody');
  const ordered=[...rows].sort((a,b)=>a.correct/a.attempts-b.correct/b.attempts||b.attempts-a.attempts||a.unitId.localeCompare(b.unitId)||a.mode.localeCompare(b.mode));
  for(const r of ordered){const line=el('tr');line.setAttribute('data-unit',r.unitId);const name=el('th',r.subject+' - '+r.title+'（'+(r.mode==='test'?'練習テスト':'問題')+'）');name.scope='row';
   line.append(name,el('td',rate(r)+' ／ '+r.correct+'正答・'+r.attempts+'回答'),el('td',r.attempts<5?'記録が少ないため参考値':r.correct/r.attempts<0.7?'誤答の復習で確かめよう':r.correct===r.attempts?'今回の記録はすべて正答':'間違えた条件を振り返ろう'));body.append(line);
  }table.append(body);section.append(table,el('p','5回答未満は参考値です。復習の案内は5回答以上で正答率70%未満のときに表示します。'));return section;
 }
 function activity(rows,dayCount){
  const section=el('section');section.className='material-learning-days';const today=new Date(data.serverTime+32400000).toISOString().slice(0,10),summary=activitySummary(data.activity.filter(matches),today);
  section.append(el('h3','回答を保存した日'),el('p','保存開始から '+summary.days+'日 ／ 現在の連続 '+summary.current+'日 ／ 最長 '+summary.best+'日'),el('p','日本時間で数えます。誤答や解き直しも学習した日に含め、同じ日は1日です。今日まだ回答がなくても、昨日までの連続日数を表示します。月をまたいで数え、単元・学習の種類の絞り込みも反映します。'));
  const grid=el('div');grid.className='material-learning-days-grid';grid.setAttribute('aria-label',month+'の回答日');for(const label of ['日','月','火','水','木','金','土'])grid.append(el('small',label));
  const [year,m]=month.split('-').map(Number);for(let i=0;i<new Date(Date.UTC(year,m-1,1)).getUTCDay();i++){const blank=el('span');blank.setAttribute('aria-hidden','true');grid.append(blank);}
  const details=el('div');details.className='material-learning-day-detail';details.setAttribute('aria-live','polite');details.append(el('p','日付を押すと、その日の回答数を確認できます。'));
  for(let d=1;d<=dayCount;d++){
   const date=month+'-'+String(d).padStart(2,'0'),daily=rows.filter(row=>row.day===date),count=sum(daily).attempts,b=button(String(d),()=>{details.replaceChildren(el('h4',date));if(!count)details.append(el('p','この日の保存済み回答はありません。'));for(const row of daily)details.append(el('p',row.subject+' - '+row.title+'（'+(row.mode==='test'?'練習テスト':'問題')+'）：'+row.attempts+'回答 ／ '+row.correct+'正答 ／ '+(row.elapsedMs/60000).toFixed(1)+'分'));});
   b.className='material-learning-day';b.dataset.level=count===0?'0':count<5?'1':count<15?'2':'3';b.setAttribute('aria-label',date+'：'+count+'回答');if(date===today)b.setAttribute('aria-current','date');b.append(el('small',count?count+'回':'—'));grid.append(b);
  }section.append(el('p','色の濃さ：記録なし／1〜4回答／5〜14回答／15回答以上。解答時間は集中していた時間とは限りません。'),grid,details);return section;
 }
 // 単元の達成度（台帳21・2026-10-08）：取り組んだ単元を教科ごとに ○正解数/問題数 と★（70問の単元は35・56・70問で★1〜3）で表示
 let achieved=null,achievementOwner=null,achievementMessage='';
 function achievementView(rows){
  const section=el('section');section.className='material-achievement';section.append(el('h3','単元の達成度'));
  const started=rows.filter(r=>r.done>0&&r.total>0);
  section.append(el('p','取り組んだ単元 '+started.length+' ／ 全 '+rows.length+' 単元（正解した問題の数。テストは数えません）'));
  if(!started.length){section.append(el('p','まだ記録がありません。問題を解くと、ここに単元ごとの達成度が出ます。'));return section;}
  for(const subject of [...new Set(started.map(r=>r.subject))]){
   const list=el('ul');list.className='material-achievement-list';
   started.filter(r=>r.subject===subject).sort((a,b)=>b.done/b.total-a.done/a.total).forEach(r=>{const stars=r.marks?(r.done>=70?3:r.done>=56?2:r.done>=35?1:0):null;const item=el('li',r.grade+'年 '+r.kind+'「'+r.title+'」　○'+Math.min(r.done,r.total)+'/'+r.total+'（'+Math.round(Math.min(r.done,r.total)/r.total*100)+'%）'+(stars===null?'':'　'+'★'.repeat(stars)+'☆'.repeat(3-stars)));list.append(item);});
   section.append(el('h4',subject),list);
  }
  return section;
 }
 function render(){
  const owner=adapter.identity();if(achievementOwner!==owner){achieved=null;achievementMessage='';}if(dataOwner!==owner)data=null;
  if(!alive)return;host.replaceChildren();const wrap=el('section');wrap.className='materials material-statistics';host.append(wrap);wrap.append(el('h2','新しい教材の学習記録'));
  const controls=el('div');controls.className='material-stat-controls';
  const label=el('label','表示する月'),input=el('input');input.type='month';input.min='2020-01';input.max='2100-12';input.value=month;input.disabled=busy;input.setAttribute('aria-label','表示する月');label.append(input);controls.append(label,button('表示・再読み込み',()=>{if(input.value)void reload(input.value);else void reload();}));wrap.append(controls);
  const status=el('p',message);status.setAttribute('role','status');wrap.append(status);if(achievementMessage){const notice=el('p',achievementMessage);notice.setAttribute('role','status');wrap.append(notice);}if(achieved)wrap.append(achievementView(achieved));if(!data)return;
  const choices=[...new Map(data.totals.map(r=>[r.unitId,[r.unitId,r.subject+' - '+r.title]])).values()];if(unit&&!choices.some(r=>r[0]===unit))unit='';
  controls.append(selector('単元',[['','すべて'],...choices],unit,value=>{unit=value;render();}),selector('学習の種類',[['','すべて'],['study','問題'],['test','練習テスト']],mode,value=>{mode=value;render();}));
  wrap.append(el('p','新教材の保存済み回答だけを集計します。解き直しも1回答として数えます。解答時間は画面を開いてから回答までのおよその時間で、問題の難しさによって変わります。'));
  const rows=data.days.filter(matches),monthly=sum(rows),overall=sum(data.totals.filter(matches));
  controls.append(button('この表示の学習記録をCSVで保存',()=>{
   if(!alive||busy||!data||!dataOwner||dataOwner!==adapter.identity())return;
   let url=null;
   try{
    const csv=monthlyCsv(month,data.days.filter(matches));
    url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
    const link=el('a');link.href=url;link.download='のびログ_学習記録_'+month+'.csv';link.hidden=true;host.append(link);try{link.click();}finally{link.remove();}
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    if(message){message='';render();}
   }catch(_){if(url)URL.revokeObjectURL(url);message='学習記録を保存できませんでした。再試行してください。';render();}
  }));
  wrap.append(el('small','CSVは選択中の月・単元・学習の種類の日別記録です。本人回答・氏名・学校成績は含みません。記録がない月は見出しだけ保存します。'));
  const cards=el('div');cards.className='material-stat-cards';
  for(const [title,value] of [['今月の回答',monthly.attempts+'回'],['今月の正答率',rate(monthly)],['1回答の平均時間',seconds(monthly)],['解答時間の合計',(monthly.elapsedMs/60000).toFixed(1)+'分']]){const card=el('article');card.append(el('small',title),el('strong',value));cards.append(card);}wrap.append(cards);
  wrap.append(el('p','保存開始からの累計：'+overall.attempts+'回答 ／ 正答 '+overall.correct+'回答 ／ 正答率 '+rate(overall)),weakness(data.totals.filter(matches)));
  const [year,m]=month.split('-').map(Number),dayCount=new Date(Date.UTC(year,m,0)).getUTCDate();
  wrap.append(activity(rows,dayCount));
  wrap.append(el('h3','平均解答時間の変化'));
  if(rows.length)wrap.append(graph(rows,dayCount));else wrap.append(el('p','この月の記録はまだありません。'));
  const details=el('details');details.append(el('summary','日別の教科・単元と解答時間'),el('p','一覧にない日は記録なしです。'));
  for(let d=1;d<=dayCount;d++){const day=month+'-'+String(d).padStart(2,'0'),daily=rows.filter(r=>r.day===day);if(!daily.length)continue;const line=el('section');line.append(el('h4',d+'日'));for(const r of daily)line.append(el('p',r.subject+' - '+r.title+'（'+(r.mode==='test'?'練習テスト':'問題')+'）：'+r.attempts+'回答 ／ 正答率 '+rate(r)+' ／ '+(r.elapsedMs/60000).toFixed(1)+'分 ／ 平均 '+seconds(r)));details.append(line);}wrap.append(details);
 }
 void reload();return {reload:()=>reload(month||undefined),destroy(){alive=false;epoch++;data=null;host.replaceChildren();}};
}
root.NobiMaterialStats=Object.freeze({mount,activitySummary,monthlyCsv});
})(globalThis);
