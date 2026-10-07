// ログイン時の復習2問（2026-10-07）：まだ正解していない誤答から古い順に2問、同じ問題は1回、20秒たつまでヒントの入口を出さない、「あとで解く」で閉じる
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function element(tag){return {tag,textContent:'',children:[],handlers:{},attrs:{},value:'',append(...c){this.children.push(...c);},replaceChildren(...c){this.children=c;},setAttribute(k,v){this.attrs[k]=v;},addEventListener(n,f){this.handlers[n]=f;},remove(){}};}
const all=node=>[node,...node.children.flatMap(all)];
const find=(host,tag,test)=>all(host).find(n=>n.tag===tag&&(typeof test==='function'?test(n.textContent||''):!test||n.textContent===test));
const screen=host=>all(host).map(n=>n.textContent).join('\n');
const tick=async()=>{for(let i=0;i<6;i++)await new Promise(r=>setImmediate(r));};
const engine=require('./material-engine.js');
let checks=0;const ok=(c,m)=>{checks++;assert.ok(c,m);};
(async()=>{
 let now=Date.parse('2026-10-07T06:00:00Z');
 const qs=Array.from({length:5},(_,i)=>({id:'q'+(i+1),type:'input',prompt:'問'+(i+1),answer:{kind:'number',value:String(i+1)},explanation:'解説'}));
 const unit={id:'u',status:'ready',mode:'drill',grade:1,subject:'数学',title:'正負の数',questions:qs,tests:[]};
 const row=(q,at,after)=>({unitId:'u',subject:'数学',grade:1,unitTitle:'正負の数',questionId:q,mode:'study',question:qs.find(x=>x.id===q),before:{answer:'x',at},after:after?{answer:'1',at:at+1}:null});
 const items=[row('q3',now-3000,false),row('q1',now-9000,true),row('q2',now-5000,false),row('q2',now-4000,false),row('q4',now-1000,false)];
 let reviewCalls=0;
 const bridge={identity:()=>'synthetic',async load(){return {};},async save(){},async review(uid,o){reviewCalls++;return o.view==='all'?{items:JSON.parse(JSON.stringify(items))}:{items:[]};},
  async aiStatus(){return {available:true};},async hint(){return {level:1,hint:'（模擬AI）ヒント',more:true};},async record(){return {id:'r',result:{correct:false}};}};
 const timers=[];const realNow=Date.now;Date.now=()=>now;
 const context={document:{createElement:element},Date,NobiMaterialEngine:{...engine,validateUnit:()=>[],address:()=>'出典'},crypto:{randomUUID:()=>'00000000-0000-4000-8000-000000000001'},setInterval:()=>0,clearInterval(){},setTimeout:(f,ms)=>{timers.push({f,ms});return timers.length;},clearTimeout(){}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'material-ui.js'),'utf8'),context);
 const host=element('host');const c=context.NobiMaterialUI.mount(host,[unit],bridge,[]);await tick();
 const text=screen(host);
 ok(/今日の復習 2問/.test(text),'card with 2 questions');
 ok(/1問目：数学 - 正負の数/.test(text)&&text.indexOf('問2')<text.indexOf('問3'),'oldest unresolved first (q2 then q3)');
 ok(!/問1\n/.test(text.split('今日の復習')[1]||'')&&!(text.split('今日の復習')[1]||'').includes('問4'),'resolved q1 and the 3rd unresolved q4 are not shown');
 ok(((text.split('今日の復習')[1]||'').match(/問2/g)||[]).length===1,'same question only once');
 find(host,'button','1問目を解く').handlers.click();await tick();
 ok(/問2/.test(screen(host))&&/20秒考えたら、ヒントを見られます/.test(screen(host))&&!find(host,'button',t=>t.startsWith('ヒントを見る')),'hint entry hidden for 20 seconds');
 const t=timers.find(x=>x.ms>=20000);ok(t,'a 20-second timer is set');
 now+=20001;t.f();await tick();
 ok(find(host,'button',t=>t.startsWith('ヒントを見る')),'hint entry appears after 20 seconds');
 c.destroy();
 // 「あとで解く」で閉じる
 const host2=element('host');const c2=context.NobiMaterialUI.mount(host2,[unit],bridge,[]);await tick();
 ok(/今日の復習/.test(screen(host2)),'card shown again on a new login');
 find(host2,'button','あとで解く').handlers.click();await tick();ok(!/今日の復習/.test(screen(host2)),'dismissed');
 await c2.reload();await tick();ok(!/今日の復習/.test(screen(host2)),'not re-shown on reload in the same login');
 c2.destroy();Date.now=realNow;
 console.log('Material login review: '+checks+' checks — 古い順に2問・解決ずみと3問目は出さない・同じ問題は1回・20秒後にヒントの入口・あとで解く');
})().catch(e=>{console.error(e);process.exit(1);});
