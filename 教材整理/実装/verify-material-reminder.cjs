// 🔔 復習のお知らせの重なり（台帳25・2026-10-08）：○△×の小単元の誤答は○△×の順番で出るので、3日・7日のお知らせには出さない。ほかの単元は今までどおり
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function element(tag){return {tag,textContent:'',children:[],handlers:{},attrs:{},value:'',append(...c){this.children.push(...c);},replaceChildren(...c){this.children=c;},setAttribute(k,v){this.attrs[k]=v;},addEventListener(n,f){this.handlers[n]=f;},remove(){}};}
const all=node=>[node,...node.children.flatMap(all)];
const screen=host=>all(host).map(n=>n.textContent).join('\n');
const find=(host,tag,test)=>all(host).find(n=>n.tag===tag&&(typeof test==='function'?test(n.textContent||''):!test||n.textContent===test));
const tick=async()=>{for(let i=0;i<6;i++)await new Promise(r=>setImmediate(r));};
const engine=require('./material-engine.js');
let checks=0;const ok=(c,m)=>{checks++;assert.ok(c,m);};
(async()=>{
 let now=Date.parse('2026-10-08T06:00:00Z');
 const qs=n=>Array.from({length:3},(_,i)=>({id:n+'q'+(i+1),type:'input',prompt:n+'問'+(i+1),answer:{kind:'number',value:String(i+1)},explanation:'解説'}));
 const marks={id:'m',status:'ready',mode:'workbook',grade:1,subject:'数学',title:'○△×の単元',schedule:'marks',size:70,questions:qs('m'),tests:[]};
 const old={id:'o',status:'ready',mode:'workbook',grade:1,subject:'数学',title:'100問の単元',questions:qs('o'),tests:[]};
 const row=(u,q)=>({unitId:u.id,subject:'数学',grade:1,unitTitle:u.title,questionId:q.id,mode:'study',question:q,before:{answer:'x',at:now-4*864e5},due:'3',dueAt:now-1000});
 let due=[row(marks,marks.questions[0]),row(old,old.questions[1]),row(marks,marks.questions[2])];
 const bridge={identity:()=>'synthetic',async load(){return {};},async save(){},async review(uid,o){return o.view==='due'?{items:JSON.parse(JSON.stringify(due))}:{items:[]};},async aiStatus(){return {available:false};},async record(){return {id:'r',result:{correct:false}};}};
 const timers=[];const realNow=Date.now;Date.now=()=>now;
 const context={document:{createElement:element},Date,NobiMaterialEngine:{...engine,validateUnit:()=>[],address:()=>'出典'},crypto:{randomUUID:()=>'00000000-0000-4000-8000-000000000001'},setInterval:()=>0,clearInterval(){},setTimeout:(f,ms)=>{timers.push({f,ms});return timers.length;},clearTimeout(){}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'material-ui.js'),'utf8'),context);
 let host=element('host');let c=context.NobiMaterialUI.mount(host,[marks,old],bridge,[]);await tick();
 ok(/3日後・7日後の復習が1件あります/.test(screen(host)),'only the non-○△× due question is counted');
 ok(/100問の単元/.test(screen(host).split('そろそろ解き直してみよう')[1]||''),'the reminder points to the 100-question unit');
 c.destroy();
 due=[row(marks,marks.questions[0])];host=element('host');c=context.NobiMaterialUI.mount(host,[marks,old],bridge,[]);await tick();
 ok(!/そろそろ解き直してみよう/.test(screen(host)),'no reminder when only ○△× questions are due');
 c.destroy();
 // 「出さない」印の問題（台帳28）：新しく作る問題の組から外れる。問題は消えない
 bridge.paused=async()=>[{unitId:'o',questionId:'oq1'}];due=[];
 host=element('host');c=context.NobiMaterialUI.mount(host,[old],bridge,[]);await tick();
 find(host,'button','数学').handlers.click();await tick();find(host,'button',t=>t.startsWith('100問の単元')).handlers.click();await tick();
 find(host,'button','作成する').handlers.click();await tick();
 const shown=screen(host);ok(/条件に合う問題は2問です/.test(shown),'paused question oq1 is left out of the new set (3 → 2)');
 ok(old.questions.length===3,'the paused question still exists in the unit');
 c.destroy();Date.now=realNow;
 console.log('Material reminder: '+checks+' checks ❌ 0 — ○△×の単元は3日・7日のお知らせに重ねない・ほかは今までどおり・「出さない」問題は組から外れる');
})().catch(e=>{console.error(e);process.exit(1);});
