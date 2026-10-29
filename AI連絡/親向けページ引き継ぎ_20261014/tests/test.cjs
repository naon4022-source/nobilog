const {chromium}=require('/Users/shimizunaotomoo/Documents/Codex/2026-08-22/new-chat/node_modules/playwright-core');
const exe=process.argv[2], url='file://'+process.argv[3], out=process.argv[4];
const res=[];const ok=(n,c,x)=>res.push((c?'OK ':'NG ')+n+(x?' '+x:''));
(async()=>{
 const b=await chromium.launch({executablePath:exe});
 for(const [w,h,tag] of [[1280,900,'pc'],[390,844,'sp']]){
  const ctx=await b.newContext({viewport:{width:w,height:h},reducedMotion:'reduce'});
  const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  await p.goto(url);await p.waitForTimeout(500);
  const ov=await p.evaluate(()=>{scrollTo(200,0);const x=scrollX;scrollTo(0,0);return x});ok(tag+' 横はみ出しなし',ov<=0,'差'+ov);
  await p.screenshot({path:out+'/t_'+tag+'_top.png'});
  // quiz: wrong -> hint -> right -> next ... -> result -> retry
  const q=p.locator('#qz');await q.scrollIntoViewIfNeeded();
  await p.click('#opts button:nth-child(2)');ok(tag+' 不正解でヒント',(await p.textContent('#qfb')).includes('ヒント'));
  ok(tag+' 不正解ボタン無効',await p.isDisabled('#opts button:nth-child(2)'));
  await p.click('#opts button:nth-child(1)');ok(tag+' 正解表示',(await p.textContent('#qfb')).includes('正解（ヒントのあと）'));
  await p.click('#qnext');ok(tag+' 第2問',(await p.textContent('#qcount'))==='第2問 / 3');
  await p.click('#opts button:nth-child(2)');await p.click('#qnext');
  await p.click('#opts button:nth-child(3)');await p.click('#qnext');
  ok(tag+' 結果',(await p.textContent('#qq')).includes('3問中 2問'),await p.textContent('#qq'));
  if(tag==='sp') await p.screenshot({path:out+'/t_sp_quiz.png',clip:await q.boundingBox().then(bb=>({x:0,y:bb.y,width:390,height:Math.min(600,bb.height+20)}))}).catch(()=>{});
  await p.click('#qagain');ok(tag+' やり直し',(await p.textContent('#qcount'))==='第1問 / 3'&&(await p.locator('#opts button').count())===3);
  // plans tabs click + keyboard
  await p.click('#t3');ok(tag+' Proタブ',(await p.textContent('#pn'))==='Pro'&&(await p.textContent('#pai'))==='500回分'&&(await p.textContent('#phist'))==='1か月');
  await p.focus('#t3');await p.keyboard.press('ArrowRight');ok(tag+' 矢印キーでUNLIMIT',(await p.textContent('#pn'))==='UNLIMIT'&&(await p.getAttribute('#t4','aria-selected'))==='true'&&await p.evaluate(()=>document.activeElement.id)==='t4');
  await p.keyboard.press('Home');ok(tag+' HomeでFree',(await p.textContent('#py'))==='0');
  await p.click('#t1');ok(tag+' Mini 500円',(await p.textContent('#py'))==='500'&&(await p.textContent('#pdiff')).includes('Freeとの違い'));
  // subsidy
  ok(tag+' 補助初期',(await p.textContent('#rm'))==='500円'&&(await p.textContent('#rb'))==='1,500円');
  await p.selectOption('#cp','500');await p.selectOption('#ck','1000');ok(tag+' Miniで1000円は500円まで',(await p.textContent('#rm'))==='500円'&&(await p.textContent('#rx')).includes('多くは割り引けません'));
  await p.selectOption('#cp','2000');await p.selectOption('#ck','full');await p.selectOption('#cm','6');ok(tag+' 全額×6',(await p.textContent('#rb'))==='12,000円');
  // faq
  const d=p.locator('details').first();await d.locator('summary').click();ok(tag+' FAQ開く',await d.evaluate(e=>e.open));
  // anchor not hidden under nav
  await p.click('nav.top a[href="#support"]');await p.waitForTimeout(300);
  const top=await p.evaluate(()=>{const k=document.querySelector('#support .kicker').getBoundingClientRect().top;const n=document.querySelector('nav.top').getBoundingClientRect().bottom;return [k,n]});ok(tag+' 見出しがヘッダーに隠れない',top[0]>=top[1],JSON.stringify(top));
  // copy
  await ctx.grantPermissions(['clipboard-read','clipboard-write']).catch(()=>{});
  await p.click('#copy');await p.waitForTimeout(200);ok(tag+' コピー表示',((await p.textContent('#copied'))||'').length>0,await p.textContent('#copied'));
  // keyboard tab reach
  const focusable=await p.evaluate(()=>[...document.querySelectorAll('a,button,select,summary,[tabindex="0"]')].filter(e=>e.offsetParent!==null).length);ok(tag+' 操作できる部品',focusable>20,String(focusable));
  // text zoom 200%
  await p.evaluate(()=>document.documentElement.style.fontSize='200%');await p.waitForTimeout(200);
  const ov2=await p.evaluate(()=>{scrollTo(200,scrollY);const x=scrollX;scrollTo(0,scrollY);return x});ok(tag+' 文字2倍でも横はみ出し',ov2<=0,'差'+ov2);
  await p.evaluate(()=>document.documentElement.style.fontSize='');
  ok(tag+' エラーなし',errs.filter(e=>!/fonts|ERR_|net::/.test(e)).length===0,errs.join('|').slice(0,200));
  if(tag==='pc'){await p.screenshot({path:out+'/t_pc_full.png',fullPage:true})}else{await p.screenshot({path:out+'/t_sp_full.png',fullPage:true})}
  await ctx.close();
 }
 await b.close();console.log(res.join('\n'));
})().catch(e=>{console.log(res.join('\n'));console.error('FAIL',e.message);process.exit(1)});
