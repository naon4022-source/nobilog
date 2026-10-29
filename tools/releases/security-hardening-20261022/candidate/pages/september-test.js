/* Scheduled exam UI. Answers and scoring keys are served only to the permitted account/window. */
(function () {
  'use strict';
  let identity='', data=null, busy=false, saving=false, error='', dirty=false, draft=null, part=-1, seq=0, requestedFinal=false;
  let anchor=0, received=0, lastPoll=0, rendered='', automatic='', debounce=0;
  const START=Date.parse('2026-09-13T20:00:00+09:00'), END=START+4500000;
  const subjects=['社会','国語','理科','英語','数学'];
  const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const who=()=>typeof currentUserId!=='undefined'&&['u1','u2'].includes(currentUserId)&&typeof authSession==='function'&&authSession()?currentUserId+'|'+authSession():'';
  function reset() {identity=who();data=null;busy=false;saving=false;error='';dirty=false;draft=null;part=-1;seq=0;requestedFinal=false;rendered='';lastPoll=0;automatic='';anchor=0;}
  function now() {return anchor?anchor+Math.max(0,performance.now()-received):Date.now();}
  const key=i=>currentUserId+':september2026:draft:'+i;
  function remember() {
    if(!draft||part<0)return;
    try{recordStorage.setItem(key(part),JSON.stringify({answers:draft,seq,dirty,final:requestedFinal}));}
    catch(e){error='回答を保持できません。画面を閉じず、オンライン保存を確認してください。';}
  }
  async function request(body,review=false) {
    const captured=identity,controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
    try {
      const r=await fetch(SYNC_URL.replace(/\/$/,'')+'/september-test'+(review?'?review=1':''),{method:body?'POST':'GET',headers:vbHeaders(body?{'Content-Type':'application/json'}:{}),...(body?{body:JSON.stringify(body)}:{}),cache:'no-store',signal:controller.signal});
      const result=await r.json();
      if(captured!==who()||captured!==identity)throw new Error('account_changed');
      if(!r.ok){if(result.error==='active_session'&&typeof authLeasePause==='function')authLeasePause(result);const e=new Error(result.error||'通信に失敗しました');e.status=r.status;throw e;}
      anchor=result.now;received=performance.now();return result;
    }finally{clearTimeout(timer);}
  }
  function hydrate(next) {
    const changed=part!==next.current;
    if(changed) {remember();part=next.current;dirty=false;requestedFinal=false;draft=null;}
    if(next.active&&part>=0&&(changed||!draft||!dirty&&!saving)) {
      const remote=next.parts[part];draft=next.active.answers.slice();seq=remote.seq;
      if(changed||!rendered) {
        try {
          const local=JSON.parse(recordStorage.getItem(key(part))||'null');
          if(local?.dirty&&!remote.final&&Array.isArray(local.answers)&&local.answers.length===10&&local.answers.every(v=>typeof v==='string'&&v.length<=300)&&Number.isSafeInteger(local.seq)&&local.seq>=remote.seq) {
            draft=local.answers;seq=local.seq;dirty=true;requestedFinal=!!local.final;
          }
        }catch(e){}
      }
    }
    data=next;
  }
  function phase() {
    if(!data)return 'loading';
    if(now()>=data.close)return 'review';
    if(now()>=data.end)return 'review';
    if(now()<data.start-900000)return 'soon';
    if(now()<data.start)return 'wait';
    return 'part'+Math.floor((now()-data.start)/900000);
  }
  function clock(ms) {const s=Math.max(0,Math.ceil(ms/1000));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}
  function status() {return error|| (saving?'オンライン保存中…':dirty?'端末に予備保存済み・オンライン送信待ち':data?'オンライン保存を確認済み':'時刻と保存状態を確認中…');}
  function draw(force=false) {
    if(identity!==who())reset();
    const el=document.getElementById('sept-test-body');if(!el)return;
    const token=identity+'|'+phase()+'|'+part+'|'+!!data?.joined+'|'+!!data?.parts?.[part]?.final;
    if(!force&&rendered===token){const timer=document.getElementById('sept-countdown');if(timer)timer.textContent=clock(part>=0?data.parts[part].end-now():data.start-now());const msg=document.getElementById('sept-save-status');if(msg)msg.textContent=status();return;}
    rendered=token;
    if(!identity){el.innerHTML='<p>対象のアカウントでログインすると表示されます。</p>';return;}
    let h='<p class="m-desc">9月13日（日）19:45待機・20:00開始・21:15答え合わせ<br>社会 → 国語 → 理科 → 英語 → 数学／各15分・10問・100点</p>';
    if(!data){el.innerHTML=h+'<p>'+safe(status())+'</p><button class="btn" onclick="SeptTest.load(true)">再確認</button>';return;}
    const p=phase();
    if(p==='soon')h+='<p>19時45分になると待機できます。問題は開始時刻に配信します。</p>';
    else if(p==='wait')h+='<h3>開始まで <span id="sept-countdown">'+clock(data.start-now())+'</span></h3><p>20時から社会が始まります。各教科を提出したら、次の開始時刻に自動で進みます。</p>'+(data.joined?'<p>待機中です。この画面でお待ちください。</p>':'<button class="btn btn-action" onclick="SeptTest.join()">待機する</button>');
    else if(p==='expired')h+='<p>問題の閲覧期間は9月16日までです。回答・成績の保存記録は削除していません。成績タブでは引き続き点数を確認できます。</p>';
    else if(p==='review')h+='<p>テストは終了しました。21時15分までにサーバーが受け付けた回答で採点します。</p><button class="btn btn-action" onclick="SeptTest.review()">答え合わせ</button>';
    else if(!data.joined)h+='<p>現在の教科から参加できます。過ぎた教科には戻れません。</p><button class="btn btn-action" onclick="SeptTest.join()">テストに参加する</button>';
    else if(!data.active||part!==Math.floor((now()-data.start)/900000))h+='<p>次の教科を読み込んでいます…</p>';
    else {
      const info=data.parts[part];
      h+='<div class="sept-timer"><b>'+safe(info.subject)+'（10問・100点）</b><b id="sept-countdown">'+clock(info.end-now())+'</b></div>';
      if(info.final)h+='<p>提出済みです。'+(part<4?'次は'+subjects[part+1]+'です。開始時刻までお待ちください。':'21時15分までお待ちください。')+'</p>';
      else {
        h+=data.active.questions.map((q,i)=>'<section class="sept-question"><label for="sept-answer-'+i+'"><b>問'+(i+1)+'（10点）</b><p>'+safe(q.text).replace(/\n/g,'<br>')+'</p></label>'+(q.choices?'<select id="sept-answer-'+i+'" aria-label="問'+(i+1)+'の回答" onchange="SeptTest.answer('+i+',this.value)"><option value="">選んでください</option>'+q.choices.map(c=>'<option value="'+safe(c)+'" '+(draft?.[i]===c?'selected':'')+'>'+safe(c)+'</option>').join('')+'</select>':'<input id="sept-answer-'+i+'" maxlength="300" autocomplete="off" value="'+safe(draft?.[i]||'')+'" oninput="SeptTest.answer('+i+',this.value)" placeholder="答えを入力">')+'</section>').join('');
        h+='<button class="btn btn-action" onclick="SeptTest.submit()">この教科を提出する</button><p class="m-desc">提出後は変更できません。制限時間で入力を締め切り、保存済みの回答を確定します。</p>';
      }
    }
    if(p!=='review'&&p!=='expired')h+='<button class="btn" disabled aria-disabled="true">答え合わせ（21:15から）</button>';
    h+='<p id="sept-save-status" role="status">'+safe(status())+'</p><button class="login-link" onclick="SeptTest.load(true)">保存・時刻を再確認</button>';
    el.innerHTML=h;
  }
  async function load(force=false) {
    if(identity!==who())reset();if(!identity||busy)return;
    if(!force&&performance.now()-lastPoll<5000)return;
    busy=true;lastPoll=performance.now();const captured=identity;
    try{const next=await request();if(captured!==identity)return;if(next.current===part&&part>=0&&(saving||dirty||(next.parts[part]?.seq||0)<seq)){draw();return;}const previousPart=part;hydrate(next);error='';draw();drawStats();if(previousPart!==part&&document.getElementById('view-ottake')?.classList.contains('active'))document.getElementById('sept-test-card')?.scrollIntoView({block:'start'});}
    catch(e){if(captured===identity){error=e.message==='account_changed'?'':'通信を確認できません。保存済み回答は残っています。再接続してください。';draw(true);}}
    finally{if(captured===identity)busy=false;}
  }
  async function flush() {
    if(!identity||identity!==who()||saving||!dirty||!draft||part<0||!data||now()>=data.parts[part].end||authLeaseBlocked)return;
    saving=true;const captured=identity,sentPart=part,sentSeq=seq,sent=draft.slice(),final=requestedFinal;
    try {
      await request({action:'save',part:sentPart,seq:sentSeq,answers:sent,final});
      if(identity!==captured||part!==sentPart)return;
      if(seq===sentSeq){dirty=false;remember();}
      data.parts[part].seq=sentSeq;data.parts[part].saved=now();data.parts[part].final=final;error='';draw(final);
    }catch(e){if(identity===captured){error=e.status===403?'受付時間が終了しました。最後にサーバー保存できた回答が採点対象です。':'送信を確認できません。回答は端末に残し、再送します。';draw();}}
    finally{if(identity===captured){saving=false;if(dirty&&part===sentPart&&seq!==sentSeq)setTimeout(flush,0);}}
  }
  function answer(i,value) {
    if(identity!==who()||!data?.active||part<0||now()>=data.parts[part].end||data.parts[part].final||requestedFinal||authLeaseBlocked||!Number.isInteger(i)||i<0||i>=10)return;
    draft[i]=String(value).slice(0,300);seq++;dirty=true;remember();clearTimeout(debounce);void flush();draw();
  }
  async function submit() {
    if(identity!==who()||authLeaseBlocked||part<0||!draft||requestedFinal||data?.parts[part]?.final)return;
    if(!confirm('この教科を提出しますか？'+(draft.some(a=>!a.trim())?'\n未回答の問題があります。':'')+'\n提出後は変更できません。'))return;
    requestedFinal=true;seq++;dirty=true;remember();await flush();
  }
  async function join() {if(identity!==who())reset();try{await request({action:'join'});await load(true);}catch(e){error='参加を確認できません。再確認してください。';draw(true);}}
  async function review() {
    if(identity!==who())reset();if(!identity)return;
    try {
      const result=await request(null,true);hydrate(result);drawStats();
      if(!result.review){error=result.expired?'閲覧期間は終了しました。':'21時15分以降、受験した本人だけ答え合わせできます。';draw(true);return;}
      gOpenModal('<h2>定期テスト直前テスト・答え合わせ</h2><p>合計 '+result.total+' / 500点</p>'+result.review.map(p=>'<details class="sept-review-subject"><summary>'+safe(p.subject)+'（'+p.questions.length+'問）</summary>'+p.questions.map((q,i)=>'<section class="sept-question"><b>問'+(i+1)+' '+(q.correct?'○ 10点':'× 0点')+'</b><p>'+safe(q.text).replace(/\n/g,'<br>')+'</p><p>自分の回答：<b>'+safe(q.userAnswer||'未回答')+'</b></p><p>答え：<b>'+safe(q.answer)+'</b></p></section>').join('')+'</details>').join('')+'<button class="btn" onclick="gCloseModal()">閉じる</button>');
    }catch(e){error='答え合わせを読み込めません。もう一度お試しください。';draw(true);}
  }
  function card() {return '<section class="m-card" id="sept-test-card"><h2>定期テスト直前テスト</h2><div id="sept-test-body"></div></section>';}
  function drawStats() {
    const el=document.getElementById('nobi-test-stats');if(!el)return;
    if(identity!==who()||!identity){el.innerHTML='<p>対象アカウントでログインすると表示されます。</p>';return;}
    if(!data?.released){el.innerHTML='<p>9月13日21時15分から成績を表示します。</p>';return;}
    const point=(total,x,color,label)=>Number.isFinite(total)?'<circle cx="'+x+'" cy="'+(190-total*.30)+'" r="7" fill="'+color+'"/><text x="'+x+'" y="'+(175-total*.30)+'" text-anchor="middle" font-size="13">'+safe(label)+' '+total+'点</text>':'';
    el.innerHTML='<svg viewBox="0 0 600 240" role="img" aria-label="のびログテストの成績。500点満点" style="width:100%;height:220px;color:var(--text-color);fill:currentColor">'+[0,100,200,300,400,500].map(n=>'<line x1="50" x2="580" y1="'+(190-n*.3)+'" y2="'+(190-n*.3)+'" stroke="currentColor" opacity=".15"/><text x="10" y="'+(195-n*.3)+'" font-size="12">'+n+'</text>').join('')+point(data.total,280,'#e67e22','自分')+point(data.other?.total,345,'#b0b6bd','相手')+'<text x="310" y="225" text-anchor="middle" font-size="13">9月13日 定期テスト直前テスト</text></svg>'+(data.scores?'<details><summary>自分の合計 '+data.total+' / 500点・教科別を見る</summary><table class="m-gtab"><tbody>'+data.scores.map(p=>'<tr><th>'+safe(p.subject)+'</th><td>'+p.score+' / 100点</td></tr>').join('')+'</tbody></table></details>':'<p>自分の受験記録はありません。</p>')+'<p>相手：'+(data.other?data.other.total+' / 500点':'受験記録なし')+'</p><p class="m-desc">本人は5教科、相手には合計だけを表示します。記録の自動削除はありません。</p>';
  }
  function tick() {
    if(identity!==who())reset();if(!identity)return;
    const n=now(),active=n>=START-900000&&n<END+60000;
    if(active||(document.getElementById('view-ottake')?.classList.contains('active')&&document.getElementById('september-archive')?.open)||document.getElementById('view-stats')?.classList.contains('active')) {void load();draw();}
    if(data&&n>=data.start-900000&&n<data.end&&automatic!==identity&&!authLeaseBlocked) {automatic=identity;switchView('ottake');draw(true);document.getElementById('sept-test-card')?.scrollIntoView({block:'start'});}
    if(dirty)void flush();
  }
  window.SeptTest={card,load,join,answer,submit,review,draw,drawStats};
  setInterval(tick,1000);
  window.addEventListener('online',()=>{void load(true);void flush();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){void load(true);void flush();}});
})();
