// 70問の小単元の画面：○n/70 の表示・一覧（○△×と見た回数）・出す順番（×→△→まだ→○→まだ時期でない）・間違えたら正解を見せて次へ
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
function element(tag){return {tag,textContent:'',children:[],handlers:{},attrs:{},value:'',append(...c){this.children.push(...c);},replaceChildren(...c){this.children=c;},setAttribute(k,v){this.attrs[k]=v;},addEventListener(n,f){this.handlers[n]=f;}};}
const all=node=>[node,...node.children.flatMap(all)];
const find=(host,tag,test)=>all(host).find(n=>n.tag===tag&&(typeof test==='function'?test(n.textContent||''):!test||n.textContent===test));
const screen=host=>all(host).map(n=>n.textContent).join('\n');
const tick=()=>new Promise(r=>setImmediate(r));
const engine=require('./material-engine.js');
let checks=0;const ok=(c,m)=>{checks++;assert.ok(c,m);};
(async()=>{
 const now=Date.parse('2026-10-05T06:00:00Z'),day=86400000;
 const qs=Array.from({length:70},(_,i)=>({id:'u-'+(i+1),type:'input',prompt:'問題'+(i+1)+'\n'+(i+1)+' × 2',answer:{kind:'number',value:String((i+1)*2)},near:[String(-(i+1)*2+1)],explanation:'解説'+(i+1),ref:'参考：数学ワーク p12 A①（テスト）・教科書 p33',source:{page:12,number:'A①'},origin:'adapted',reviewed:true}));
 const unit={id:'u',status:'ready',mode:'workbook',grade:1,subject:'数学',title:'乗法、除法①',majorTitle:'正負の数',size:70,schedule:'marks',questions:qs,tests:[]};
 const marks={ 'u-5':{mark:'×',views:1,lastAt:now-2*day,dueAt:now-day}, 'u-3':{mark:'×',views:2,lastAt:now-3*day,dueAt:now-2*day}, 'u-7':{mark:'△',views:1,lastAt:now-8*day,dueAt:now-day},
  'u-9':{mark:'△',views:1,lastAt:now-day,dueAt:now+6*day}, 'u-11':{mark:'×',views:1,lastAt:now-3600000,dueAt:now+3600000*5}, 'u-2':{mark:'○',views:3,lastAt:now-day,dueAt:null}};
 const records=[];let saved=null;
 const bridge={identity:()=>'synthetic',async load(){return {u:{done:['u-2']}};},async save(v){saved=v;},
  async marks(uid,unitId){assert.equal(unitId,'u');return {items:JSON.parse(JSON.stringify(marks)),serverTime:now};},
  async record(att){records.push(att);const q=qs.find(q=>q.id===att.questionId);return {id:'r'+records.length,result:engine.grade(q,att.answer)};}};
 const realNow=Date.now;Date.now=()=>now;
 const context={document:{createElement:element},Date,NobiMaterialEngine:{...engine,validateUnit:()=>[]},crypto:{randomUUID:()=>'00000000-0000-4000-8000-'+String(records.length+1).padStart(12,'0')},setInterval:()=>0,clearInterval(){}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'material-ui.js'),'utf8'),context);
 const host=element('host');const c=context.NobiMaterialUI.mount(host,[unit],bridge,[]);
 await tick();
 // 数学を選ぶ
 find(host,'button','数学').handlers.click();await tick();
 ok(find(host,'button',t=>t.startsWith('乗法、除法①')&&t.includes('○1/70')),'小単元に ○1/70');
 ok(find(host,'button',t=>t.startsWith('乗法、除法①')&&t.endsWith('☆☆☆')),'1問だけでは★0（☆☆☆）');
 const open=find(host,'button',t=>t.startsWith('○ 1 / 70'));ok(open,'○ 1 / 70 の一覧ボタン');
 open.handlers.click();await tick();await tick();
 const items=all(host).filter(n=>n.tag==='li');ok(items.length===70,'70問すべて一覧に出る');
 const txt=screen(host);
 ok(txt.includes('○ 1問')&&txt.includes('△ 2問')&&txt.includes('× 3問')&&txt.includes('まだ 64問'),'○△×の数');
 const row=i=>screen(items[i]);
 ok(row(1).includes('○')&&row(1).includes('見た回数 3回'),'○と見た回数');
 ok(row(2).includes('×')&&row(2).includes('出題する時期です'),'時期がきた×');
 ok(row(8).includes('△')&&row(8).includes('あと6日で出ます'),'まだ時期でない△');
 ok(row(10).includes('次の日に出ます'),'今日の×は次の日');
 ok(row(0).includes('－')&&row(0).includes('見た回数 0回'),'まだの問題');
 ok(row(0).includes('参考：数学ワーク p12 A①'),'出典を表示');
 find(host,'button','問題へ戻る').handlers.click();await tick();
 // 15問で作成 → 出す順番
 find(host,'button','作成する').handlers.click();await tick();await tick();
 const first=()=>{const p=all(host).find(n=>n.attrs&&false);return screen(host);};
 const order=[];
 // 1問目は u-3（いちばん古い×）
 ok(screen(host).includes('問題3\n3 × 2'),'1問目は古い×（u-3）');
 const form=all(host).find(n=>n.tag==='form');const input=all(host).find(n=>n.tag==='textarea');
 // 間違える → 次の問題へ進み、正解と「次の日」を表示
 input.value='1';form.handlers.submit({preventDefault(){}});await tick();await tick();
 ok(records.length===1&&records[0].questionId==='u-3','回答を記録');
 ok(screen(host).includes('前の問題：× ')&&screen(host).includes('正解：6')&&screen(host).includes('次の日の最初にもう一度出ます'),'×の結果と正解');
 ok(screen(host).includes('問題5\n5 × 2'),'2問目は次に古い×（u-5）');
 // 惜しい → △
 let f2=all(host).find(n=>n.tag==='form'),in2=all(host).find(n=>n.tag==='textarea');in2.value='-9';f2.handlers.submit({preventDefault(){}});await tick();await tick();
 ok(screen(host).includes('前の問題：△ ')&&screen(host).includes('1週間後にもう一度出ます'),'△の結果');
 ok(screen(host).includes('問題7\n7 × 2'),'3問目は時期がきた△（u-7）');
 // 正解 → 保存して次へ（まだの問題 u-1）
 let f3=all(host).find(n=>n.tag==='form'),in3=all(host).find(n=>n.tag==='textarea');in3.value='14';f3.handlers.submit({preventDefault(){}});await tick();await tick();
 ok(saved&&saved.u.done.includes('u-7'),'正解を進み具合に保存');
 ok(screen(host).includes('問題1\n1 × 2'),'4問目はまだ解いていない問題');
 ok(!screen(host).includes('問題9\n9 × 2'),'時期でない△はまだ出さない');
 c.destroy();Date.now=realNow;
 console.log(`Material marks UI: ○n/70 on small units, 70-row list with ○△× and view counts and sources, schedule order (oldest × → due △ → unseen → ○ → not due), wrong/near answers move on with the correct answer, correct answers saved (${checks} checks) passed`);
})().catch(e=>{console.error(e);process.exit(1);});
