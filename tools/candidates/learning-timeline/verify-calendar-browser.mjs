import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const bundle=await readFile(new URL('runtime-browser.js',import.meta.url),'utf8'),view=await readFile(new URL('calendar-view.js',import.meta.url),'utf8');
const server=createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end('<meta name="viewport" content="width=device-width,initial-scale=1"><section id="calendar"><button data-material-day="2026-10-01">1</button></section><script>'+bundle+'</script><script>'+view+'</script>');});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser,n=0;
const eq=(a,b)=>{assert.deepEqual(a,b);n++;};
try{
 browser=await chromium.launch({headless:true});
 for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:900}});let outside=0;
  await page.route('**/*',r=>{if(new URL(r.request().url()).hostname==='127.0.0.1')return r.continue();outside++;return r.abort();});
  await page.goto('http://127.0.0.1:'+server.address().port);
  await page.evaluate(()=>{
   window.owner=true;window.fail=true;window.waiting=null;window.calls=0;
   const t=Date.parse('2026-10-01T00:00:00+09:00'),acceptedAt=t+1000,id='00000000-0000-4000-8000-000000000001';
   window.model=NobiLearningTimeMonth.create({same:()=>owner,ready:()=>true,catalog:[{id:'math',subject:'数学',kind:'textbook'}],request:async()=>{calls++;if(waiting)await waiting;if(fail)throw Error('fake offline');return {items:[{id,acceptedAt,spans:[{id:id+':0',activity:'math',kind:'textbook',subject:'数学',start:t,end:t+1000,acceptedAt}]}],next:null,serverTime:acceptedAt};}});
   window.calendar=NobiLearningTimeCalendar.mount({model,same:()=>owner});calendar.show(document.getElementById('calendar'),'2026-10','2026-10-01');
  });
  await page.getByText('学習時間はまだ確認できていません。0分としては表示していません。',{exact:true}).waitFor();n++;
  eq(await page.locator('.learning-time-mark').count(),0);
  await page.evaluate(()=>{fail=false;});await page.getByRole('button',{name:'学習時間を更新'}).click();
  await page.getByText('2026-10 の合計：1秒',{exact:true}).waitFor();n++;
  eq(await page.locator('.learning-time-mark').textContent(),'1秒');
  await page.evaluate(()=>{fail=true;});await page.getByRole('button',{name:'学習時間を更新'}).click();
  await page.getByText(/前に確認できた表示を残しています/).waitFor();n++;
  eq(await page.getByText('2026-10 の合計：1秒',{exact:true}).count(),1);
  await page.evaluate(()=>{fail=false;waiting=new Promise(resolve=>{window.release=resolve;});calendar.show(document.getElementById('calendar'),'2026-11','2026-11-01');calendar.show(document.getElementById('calendar'),'2026-12','2026-12-01');});
  eq(await page.locator('.learning-time-mark').count(),0);
  await page.evaluate(()=>{waiting=null;release();});
  await page.getByText('2026-12 の合計：0分',{exact:true}).waitFor();n++;
  eq(await page.getByText('2026-11 の合計：0分',{exact:true}).count(),0);
  eq(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  await page.evaluate(()=>{
   calendar.destroy();const from=Date.parse('2026-10-09T12:00:00+09:00'),serverTime=Date.parse('2026-10-16T12:00:00+09:00');
   window.model=NobiLearningTimeMonth.create({same:()=>owner,ready:()=>true,catalog:[],request:async()=>({items:[],next:null,serverTime,window:{from,label:'1週間',plan:'mini',revision:2}})});
   window.calendar=NobiLearningTimeCalendar.mount({model,same:()=>owner});calendar.show(document.getElementById('calendar'),'2026-10','2026-10-01');
  });
  await page.getByText('2026-10-01 は履歴の表示期間外です。0分という意味ではありません。',{exact:true}).waitFor();n++;
  eq(await page.locator('.learning-time-mark').count(),0);
  eq(await page.getByText('保存された学習時間の記録はありません。',{exact:true}).count(),0);
  await page.evaluate(()=>calendar.show(document.getElementById('calendar'),'2026-10','2026-10-09'));
  eq(await page.getByText('この日は日本時間 12:00 以降の記録を表示しています。',{exact:true}).count(),1);
  await page.evaluate(()=>calendar.show(document.getElementById('calendar'),'2026-09','2026-09-01'));
  await page.getByText('この月は、今のプランの履歴表示期間外です。',{exact:true}).waitFor();n++;
  eq(await page.locator('[data-learning-time-summary] dl:visible').count(),0);
  await page.evaluate(()=>{owner=false;calendar.destroy();});eq(await page.locator('[data-learning-time-summary]').count(),0);eq(await page.evaluate(()=>model.state().snapshot),null);
  eq(outside,0);await page.close();
 }
 console.log(`Timeline calendar view: ${n} checks passed; no false zero, failure retention, month race, markers, owner teardown and two widths; synthetic read-only provider`);
}finally{await browser?.close();server.close();}
