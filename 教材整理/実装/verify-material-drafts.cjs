// 📝 下書き（2026-10-07・なお指定でサーバー保存）：打ちかけの答えとメモを本人の記録 materialDrafts に入れる（自動同期でサーバーへ）／開きなおしで戻る／人ごと／1.5秒まとめて保存／正解で消える／14日・100件・2000字
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function element(tag){return {tag,textContent:'',children:[],handlers:{},attrs:{},value:'',append(...c){this.children.push(...c);},replaceChildren(...c){this.children=c;},setAttribute(k,v){this.attrs[k]=v;},addEventListener(n,f){this.handlers[n]=f;},remove(){}};}
const all=node=>[node,...node.children.flatMap(all)];
const find=(host,tag,test)=>all(host).find(n=>n.tag===tag&&(typeof test==='function'?test(n.textContent||''):!test||n.textContent===test));
const tick=async()=>{for(let i=0;i<6;i++)await new Promise(r=>setImmediate(r));};
const engine=require('./material-engine.js');
let checks=0;const ok=(c,m)=>{checks++;assert.ok(c,m);};
(async()=>{
 let now=Date.parse('2026-10-07T06:00:00Z');
 const qs=Array.from({length:5},(_,i)=>({id:'q'+(i+1),type:'input',prompt:'問'+(i+1),answer:{kind:'number',value:String(i+1)},explanation:'解説'}));
 const unit={id:'u',status:'ready',mode:'drill',grade:1,subject:'数学',title:'正負の数',questions:qs,tests:[]};
 const row=(q,at)=>({unitId:'u',subject:'数学',grade:1,unitTitle:'正負の数',questionId:q,mode:'study',question:qs.find(x=>x.id===q),before:{answer:'x',at},after:null});
 const items=[row('q2',now-5000),row('q3',now-3000)];
 let who='synthetic',sent=[];
 const bridge={identity:()=>who,async load(){return {};},async save(p){sent.push(JSON.stringify(p));},async review(uid,o){return o.view==='all'?{items:JSON.parse(JSON.stringify(items))}:{items:[]};},
  async aiStatus(){return {available:false};},async record(a){sent.push(JSON.stringify(a));return {id:'r',result:{correct:a.answer===a.questionId.slice(1)}};}};
 const records={};let writes=0;
 bridge.drafts=uid=>JSON.parse(JSON.stringify(records[uid]||{}));
 bridge.draftsWrite=(next,uid)=>{writes++;records[uid]=JSON.parse(JSON.stringify(next));return true;};
 const timers=[],allTimers=[];const realNow=Date.now;Date.now=()=>now;
 const runTimers=()=>{for(const t of timers.splice(0))if(!t.cleared)t.f();};
 const context={document:{createElement:element},Date,NobiMaterialEngine:{...engine,validateUnit:()=>[],address:()=>'出典'},crypto:{randomUUID:()=>'00000000-0000-4000-8000-000000000001'},setInterval:()=>0,clearInterval(){},clearTimeout(id){const t=allTimers[id-1];if(t)t.cleared=true;},setTimeout:(f,ms)=>{const t={f,ms};timers.push(t);allTimers.push(t);return allTimers.length;}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'material-ui.js'),'utf8'),context);
 const open=async()=>{const host=element('host');const c=context.NobiMaterialUI.mount(host,[unit],bridge,[]);await tick();find(host,'button','1問目を解く').handlers.click();await tick();return {host,c,box:()=>find(host,'textarea')};};
 let s=await open();
 ok(s.box()&&s.box().value==='','starts empty');
 s.box().value='-';s.box().handlers.input();s.box().value='-1';s.box().handlers.input();
 ok(writes===0,'typing is not saved on every key');
 const wait=timers.filter(t=>!t.cleared&&t.ms===1500);ok(wait.length===1,'one pending save after 1.5 seconds');
 runTimers();
 ok(writes===1&&records.synthetic['a:q2']&&records.synthetic['a:q2'].v==='-1','draft saved into the synced record once');
 ok(sent.length===0,'drafts are not sent as answers or progress');
 s.box().value='-12';s.box().handlers.input();s.c.destroy();
 ok(records.synthetic['a:q2'].v==='-12','closing the screen saves the last typing at once');
 // アプリを閉じて開きなおしても残る
 s=await open();ok(s.box().value==='-12','draft restored after reopening');
 s.c.destroy();who='other';s=await open();ok(s.box().value==='','another user does not see the draft');s.c.destroy();who='synthetic';
 // 正解して保存できたら、すぐ消える
 s=await open();s.box().value='2';s.box().handlers.input();find(s.host,'form').handlers.submit({preventDefault(){}});await tick();
 ok(!records.synthetic['a:q2'],'draft removed at once after the correct answer is saved');
 s.c.destroy();
 records.synthetic={'a:q2':{v:'old',at:now-15*864e5}};s=await open();ok(s.box().value==='','drafts older than 14 days are ignored');s.c.destroy();
 records.synthetic={'a:q2':'broken','x:bad':{v:'1',at:now}};s=await open();ok(s.box().value==='','broken saved data does not break the screen');
 const many={};for(let i=0;i<120;i++)many['a:x'+i]={v:'v'+i,at:now-i*1000};records.synthetic=many;s.c.destroy();s=await open();
 s.box().value='y'.repeat(2500);s.box().handlers.input();runTimers();
 const capped=records.synthetic;
 ok(Object.keys(capped).length===100&&capped['a:q2']&&!capped['a:x119'],'at most 100 drafts, newest kept');
 ok(capped['a:q2'].v.length===2000,'one draft is at most 2,000 characters');
 s.c.destroy();
 // 本物の橋わたし：本人のときだけ読み書き
 const bctx={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../../site-assets/material-bridge.js'),'utf8'),bctx);
 let stored={'a:q1':{v:'1',at:now}};const real=bctx.NobiMaterialBridge.create({identity:()=>'me',ready:()=>false,read:()=>({}),draftsRead:()=>stored,draftsWrite:n=>{stored=n;}});
 ok(real.drafts('me')['a:q1'].v==='1'&&Object.keys(real.drafts('you')).length===0,'bridge reads drafts only for the signed-in user (even offline)');
 ok(real.draftsWrite({'a:q3':{v:'3',at:now}},'me')===true&&stored['a:q3']&&real.draftsWrite({},'you')===false,'bridge writes only for the signed-in user');
 // 入口：本人の記録キー「uid:materialDrafts」に入れ、空になったら消す（自動同期の対象＝サーバー保存）
 const entry=fs.readFileSync(path.join(__dirname,'../../site-assets/material-entry.js'),'utf8');
 ok(/draftsWrite:next=>\{const key=who\.uid\+':materialDrafts'/.test(entry)&&/recordStorage\.removeItem\(key\)/.test(entry)&&/cloudSetDirty\(true\)/.test(entry.slice(entry.indexOf('draftsWrite:'))),'entry stores drafts in the synced record uid:materialDrafts');
 const src=fs.readFileSync(path.join(__dirname,'material-ui.js'),'utf8');
 ok(!/localStorage/.test(src),'material-ui no longer writes device-only storage');
 ok(/draftGet\(bridge\.identity\(\),'n:'\+key\)/.test(src)&&/draftPut\(bridge\.identity\(\),'n:'\+key,input\.value\)/.test(src)&&/draftPut\(uid,'n:'\+key,''\)/.test(src),'notebook memo drafts: restore, keep, clear after save');
 ok(src===fs.readFileSync(path.join(__dirname,'../../site-assets/material-ui.js'),'utf8'),'site-assets copy is identical');
 Date.now=realNow;
 console.log('Material drafts (server): '+checks+' checks ❌ 0 — 本人の記録へ保存（自動同期）・1.5秒まとめ・閉じるとき保存・開きなおしで戻る・人ごと・正解で消える・14日・100件・2000字');
})().catch(e=>{console.error(e);process.exit(1);});
